-- ═══════════════════════════════════════════════════════════════
--   AD TRANS LOGISTICS — Module DÉPOTAGE (suivi synchronisé)
--   Migration appliquée le 15/10/2026 sur le projet mmfdxoappbhxoqpgsdit
--   CE FICHIER N'EST PAS DÉPLOYÉ (voir .vercelignore). Il sert de référence.
-- ═══════════════════════════════════════════════════════════════

-- ─── 0. Rôle « équipe » (staff) : Pascal, Michée, Rabib, Carolive… ──
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_staff BOOLEAN NOT NULL DEFAULT FALSE;

-- Un client ne doit jamais pouvoir s'auto-promouvoir : on verrouille la colonne.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, company, email) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT p.is_admin OR p.is_staff FROM public.profiles p WHERE p.id = auth.uid()), FALSE)
$$;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- L'équipe doit pouvoir lire les profils (nom des collègues, clients) sans être admin.
DROP POLICY IF EXISTS "staff_read_profiles" ON public.profiles;
CREATE POLICY "staff_read_profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff());

-- L'admin nomme / retire un membre d'équipe par email (le compte doit déjà exister).
CREATE OR REPLACE FUNCTION public.set_staff(target_email TEXT, flag BOOLEAN)
RETURNS TABLE (email TEXT, full_name TEXT, is_staff BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'admin_only'; END IF;
  RETURN QUERY
    UPDATE public.profiles p SET is_staff = flag
    WHERE lower(p.email) = lower(trim(target_email))
    RETURNING p.email, p.full_name, p.is_staff;
END $$;
REVOKE ALL ON FUNCTION public.set_staff(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_staff(TEXT, BOOLEAN) TO authenticated;

-- ─── 1. Référentiel des 13 étapes, en 4 phases ───────────────────
CREATE TABLE IF NOT EXISTS public.depotage_etapes_ref (
  code        TEXT PRIMARY KEY,
  phase       SMALLINT NOT NULL,
  phase_label TEXT NOT NULL,
  position    SMALLINT NOT NULL,
  label       TEXT NOT NULL,
  parallel    BOOLEAN NOT NULL DEFAULT FALSE,   -- les validations de la phase 2 se font en parallèle
  notify      BOOLEAN NOT NULL DEFAULT FALSE    -- étape qui déclenche une notification client
);
INSERT INTO public.depotage_etapes_ref (code, phase, phase_label, position, label, parallel, notify) VALUES
  ('echange_documentaire',     1, 'Documents',              1,  'Échange documentaire',                    FALSE, TRUE),
  ('bon_a_delivrer',           1, 'Documents',              2,  'Bon à délivrer (BAD)',                    FALSE, FALSE),
  ('liste_previsionnelle',     1, 'Documents',              3,  'Liste prévisionnelle de dépotage',        FALSE, FALSE),
  ('demande_transfert',        1, 'Documents',              4,  'Demande de transfert',                    FALSE, FALSE),
  ('declaration_douane',       1, 'Documents',              5,  'Déclaration en douane du conteneur',      FALSE, TRUE),
  ('facture_port',             2, 'Validations',            6,  'Validation facture Port de Cotonou',      TRUE,  FALSE),
  ('facture_benin_manutention',2, 'Validations',            7,  'Validation facture Bénin Manutention',    TRUE,  FALSE),
  ('facture_benin_terminal',   2, 'Validations',            8,  'Validation facture Bénin Terminal',       TRUE,  FALSE),
  ('besc',                     2, 'Validations',            9,  'Validation BESC',                         TRUE,  FALSE),
  ('relache',                  3, 'Relâche & positionnement',10, 'Relâche autorisée',                      FALSE, TRUE),
  ('positionnement',           3, 'Relâche & positionnement',11, 'Demande de positionnement',              FALSE, TRUE),
  ('fiches_depotage',          4, 'Dépotage',               12, 'Fiches de dépotage',                      FALSE, FALSE),
  ('degroupage',               4, 'Dépotage',               13, 'Dégroupage & remise des marchandises',    FALSE, TRUE)
ON CONFLICT (code) DO UPDATE SET phase=EXCLUDED.phase, phase_label=EXCLUDED.phase_label,
  position=EXCLUDED.position, label=EXCLUDED.label, parallel=EXCLUDED.parallel, notify=EXCLUDED.notify;
ALTER TABLE public.depotage_etapes_ref ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ref_public_read" ON public.depotage_etapes_ref;
CREATE POLICY "ref_public_read" ON public.depotage_etapes_ref FOR SELECT TO anon, authenticated USING (TRUE);

-- ─── 2. Dossiers de dépotage (un par conteneur) ──────────────────
CREATE OR REPLACE FUNCTION public.gen_tracking_code()
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  -- 8 caractères sans ambiguïté (pas de 0/O, 1/I)
  SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random()*32))::int + 1, 1), '')
  FROM generate_series(1, 8)
$$;

CREATE TABLE IF NOT EXISTS public.depotage_dossiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code   TEXT UNIQUE NOT NULL DEFAULT public.gen_tracking_code(),
  reference       TEXT UNIQUE,                       -- ex. DEP-2026-0042 (généré)
  container_no    TEXT NOT NULL,                     -- ex. MSKU1234567
  bl_no           TEXT NOT NULL,                     -- connaissement
  shipping_line   TEXT,                              -- Maersk, MSC, CMA CGM, Hapag-Lloyd…
  vessel          TEXT,
  eta             DATE,                              -- arrivée navire prévue / constatée
  container_type  TEXT NOT NULL DEFAULT '40HC',
  cargo           TEXT,                              -- description marchandises
  vehicles_count  SMALLINT,
  -- Client
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name     TEXT NOT NULL,
  client_company  TEXT,
  client_email    TEXT,
  client_phone    TEXT,                              -- WhatsApp, format international 229…
  -- Employé référent que le client a demandé de notifier
  notify_name     TEXT,
  notify_phone    TEXT,
  -- Pilotage
  status          TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours','bloque','termine','annule')),
  blocked_reason  TEXT,
  assigned_to     TEXT,                              -- Pascal, Michée, Rabib, Carolive…
  internal_notes  TEXT,
  client_message  TEXT,                              -- message visible par le client (ex. « documents manquants »)
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS depotage_dossiers_container_idx ON public.depotage_dossiers (upper(container_no));
CREATE INDEX IF NOT EXISTS depotage_dossiers_email_idx ON public.depotage_dossiers (lower(client_email));
CREATE INDEX IF NOT EXISTS depotage_dossiers_user_idx ON public.depotage_dossiers (user_id);

-- Référence automatique DEP-AAAA-NNNN + normalisation + rattachement au compte client
CREATE SEQUENCE IF NOT EXISTS public.depotage_ref_seq;
CREATE OR REPLACE FUNCTION public.depotage_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.container_no := upper(regexp_replace(COALESCE(NEW.container_no,''), '\s', '', 'g'));
  NEW.bl_no := upper(trim(COALESCE(NEW.bl_no,'')));
  NEW.client_email := NULLIF(lower(trim(COALESCE(NEW.client_email,''))), '');
  IF NEW.reference IS NULL THEN
    NEW.reference := 'DEP-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('public.depotage_ref_seq')::text, 4, '0');
  END IF;
  IF NEW.user_id IS NULL AND NEW.client_email IS NOT NULL THEN
    SELECT id INTO NEW.user_id FROM public.profiles WHERE lower(email) = NEW.client_email LIMIT 1;
  END IF;
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS depotage_dossiers_bi ON public.depotage_dossiers;
CREATE TRIGGER depotage_dossiers_bi BEFORE INSERT ON public.depotage_dossiers
  FOR EACH ROW EXECUTE PROCEDURE public.depotage_before_insert();

CREATE OR REPLACE FUNCTION public.depotage_before_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.container_no := upper(regexp_replace(COALESCE(NEW.container_no,''), '\s', '', 'g'));
  NEW.bl_no := upper(trim(COALESCE(NEW.bl_no,'')));
  NEW.client_email := NULLIF(lower(trim(COALESCE(NEW.client_email,''))), '');
  IF NEW.client_email IS DISTINCT FROM OLD.client_email AND NEW.client_email IS NOT NULL THEN
    SELECT id INTO NEW.user_id FROM public.profiles WHERE lower(email) = NEW.client_email LIMIT 1;
  END IF;
  IF NEW.status = 'termine' AND OLD.status <> 'termine' THEN NEW.completed_at := NOW(); END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS depotage_dossiers_bu ON public.depotage_dossiers;
CREATE TRIGGER depotage_dossiers_bu BEFORE UPDATE ON public.depotage_dossiers
  FOR EACH ROW EXECUTE PROCEDURE public.depotage_before_update();

-- Quand un client crée son compte, ses dossiers existants (même email) lui sont rattachés.
CREATE OR REPLACE FUNCTION public.depotage_link_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    UPDATE public.depotage_dossiers SET user_id = NEW.id
    WHERE user_id IS NULL AND lower(client_email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS depotage_link_profile ON public.profiles;
CREATE TRIGGER depotage_link_profile AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.depotage_link_new_profile();

-- ─── 3. Étapes franchies ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.depotage_etapes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id   UUID NOT NULL REFERENCES public.depotage_dossiers(id) ON DELETE CASCADE,
  code         TEXT NOT NULL REFERENCES public.depotage_etapes_ref(code),
  done_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  done_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  done_by_name TEXT,
  note         TEXT,
  UNIQUE (dossier_id, code)
);
CREATE INDEX IF NOT EXISTS depotage_etapes_dossier_idx ON public.depotage_etapes (dossier_id);

CREATE OR REPLACE FUNCTION public.depotage_etape_touch()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d UUID;
BEGIN
  d := COALESCE(NEW.dossier_id, OLD.dossier_id);
  IF TG_OP <> 'DELETE' AND NEW.done_by IS NULL THEN NEW.done_by := auth.uid(); END IF;
  IF TG_OP <> 'DELETE' AND NEW.done_by_name IS NULL THEN
    SELECT COALESCE(full_name, email) INTO NEW.done_by_name FROM public.profiles WHERE id = NEW.done_by;
  END IF;
  UPDATE public.depotage_dossiers SET updated_at = NOW() WHERE id = d;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS depotage_etapes_touch ON public.depotage_etapes;
CREATE TRIGGER depotage_etapes_touch BEFORE INSERT OR UPDATE OR DELETE ON public.depotage_etapes
  FOR EACH ROW EXECUTE PROCEDURE public.depotage_etape_touch();

-- ─── 4. Journal des notifications envoyées au client ─────────────
CREATE TABLE IF NOT EXISTS public.depotage_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id  UUID NOT NULL REFERENCES public.depotage_dossiers(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('whatsapp','email','sms','appel')),
  recipient   TEXT NOT NULL,
  etape_code  TEXT REFERENCES public.depotage_etapes_ref(code),
  message     TEXT,
  sent_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS depotage_notif_dossier_idx ON public.depotage_notifications (dossier_id);

-- ─── 5. Sécurité (RLS) ───────────────────────────────────────────
ALTER TABLE public.depotage_dossiers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depotage_etapes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depotage_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.depotage_dossiers, public.depotage_etapes, public.depotage_notifications FROM anon;

-- Équipe (staff + admin) : tout
DROP POLICY IF EXISTS "staff_all_dossiers" ON public.depotage_dossiers;
CREATE POLICY "staff_all_dossiers" ON public.depotage_dossiers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "staff_all_etapes" ON public.depotage_etapes;
CREATE POLICY "staff_all_etapes" ON public.depotage_etapes FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS "staff_all_notifs" ON public.depotage_notifications;
CREATE POLICY "staff_all_notifs" ON public.depotage_notifications FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Client : lecture seule de SES conteneurs (par compte rattaché ou par email du compte)
DROP POLICY IF EXISTS "client_own_dossiers" ON public.depotage_dossiers;
CREATE POLICY "client_own_dossiers" ON public.depotage_dossiers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (client_email IS NOT NULL AND client_email = lower(auth.jwt()->>'email')));
DROP POLICY IF EXISTS "client_own_etapes" ON public.depotage_etapes;
CREATE POLICY "client_own_etapes" ON public.depotage_etapes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.depotage_dossiers d WHERE d.id = dossier_id
                 AND (d.user_id = auth.uid() OR (d.client_email IS NOT NULL AND d.client_email = lower(auth.jwt()->>'email')))));
DROP POLICY IF EXISTS "client_own_notifs" ON public.depotage_notifications;
CREATE POLICY "client_own_notifs" ON public.depotage_notifications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.depotage_dossiers d WHERE d.id = dossier_id
                 AND (d.user_id = auth.uid() OR (d.client_email IS NOT NULL AND d.client_email = lower(auth.jwt()->>'email')))));

-- ─── 6. Suivi public (page /suivi) : code de suivi OU conteneur + BL ──
-- Ne renvoie que des informations non sensibles (pas de coordonnées client).
CREATE OR REPLACE FUNCTION public.track_depotage(p_code TEXT DEFAULT NULL, p_container TEXT DEFAULT NULL, p_bl TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE d public.depotage_dossiers%ROWTYPE; steps JSONB; notifs JSONB;
BEGIN
  IF p_code IS NOT NULL AND length(trim(p_code)) >= 6 THEN
    SELECT * INTO d FROM public.depotage_dossiers WHERE upper(tracking_code) = upper(trim(p_code)) LIMIT 1;
  ELSIF p_container IS NOT NULL AND p_bl IS NOT NULL THEN
    SELECT * INTO d FROM public.depotage_dossiers
     WHERE upper(regexp_replace(container_no,'\s','','g')) = upper(regexp_replace(p_container,'\s','','g'))
       AND upper(trim(bl_no)) = upper(trim(p_bl))
     ORDER BY created_at DESC LIMIT 1;
  ELSE
    RETURN NULL;
  END IF;
  IF d.id IS NULL THEN RETURN NULL; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('code', e.code, 'done_at', e.done_at, 'note', e.note) ORDER BY r.position), '[]'::jsonb)
    INTO steps FROM public.depotage_etapes e JOIN public.depotage_etapes_ref r ON r.code = e.code WHERE e.dossier_id = d.id;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('channel', n.channel, 'etape_code', n.etape_code, 'sent_at', n.sent_at) ORDER BY n.sent_at DESC), '[]'::jsonb)
    INTO notifs FROM public.depotage_notifications n WHERE n.dossier_id = d.id;
  RETURN jsonb_build_object(
    'reference', d.reference, 'tracking_code', d.tracking_code,
    'container_no', d.container_no, 'bl_no', d.bl_no, 'shipping_line', d.shipping_line, 'vessel', d.vessel,
    'eta', d.eta, 'container_type', d.container_type, 'cargo', d.cargo, 'vehicles_count', d.vehicles_count,
    'client_company', d.client_company, 'client_name', d.client_name,
    'status', d.status, 'blocked_reason', d.blocked_reason, 'client_message', d.client_message,
    'created_at', d.created_at, 'updated_at', d.updated_at, 'completed_at', d.completed_at,
    'steps', steps, 'notifications', notifs);
END $$;
REVOKE ALL ON FUNCTION public.track_depotage(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_depotage(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── 7. Temps réel (l'espace client et la console se mettent à jour seuls) ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='depotage_dossiers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.depotage_dossiers;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='depotage_etapes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.depotage_etapes;
  END IF;
END $$;

-- ─── 8. Vue de pilotage (délais) ─────────────────────────────────
CREATE OR REPLACE VIEW public.depotage_kpi AS
SELECT
  count(*) FILTER (WHERE status = 'en_cours')  AS en_cours,
  count(*) FILTER (WHERE status = 'bloque')    AS bloques,
  count(*) FILTER (WHERE status = 'termine')   AS termines,
  round(avg(EXTRACT(EPOCH FROM (completed_at - created_at))/86400) FILTER (WHERE completed_at IS NOT NULL)::numeric, 1) AS delai_moyen_jours,
  round(avg(EXTRACT(EPOCH FROM (deg.done_at - rel.done_at))/86400)::numeric, 1) AS delai_relache_depotage_jours
FROM public.depotage_dossiers d
LEFT JOIN public.depotage_etapes rel ON rel.dossier_id = d.id AND rel.code = 'relache'
LEFT JOIN public.depotage_etapes deg ON deg.dossier_id = d.id AND deg.code = 'degroupage';
GRANT SELECT ON public.depotage_kpi TO authenticated;
