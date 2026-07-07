-- ═══════════════════════════════════════════════════════════════
--   AD TRANS LOGISTICS — Correctif de sécurité RLS (06/07/2026)
--   FAILLE CORRIGÉE : tout client inscrit pouvait s'auto-promouvoir
--   admin (UPDATE profiles SET is_admin=true) et lire les données
--   personnelles de TOUS les clients.
--   À exécuter dans l'éditeur SQL Supabase dès la réactivation du
--   projet mmfdxoappbhxoqpgsdit (ou via migration MCP).
--   CE FICHIER N'EST PAS DÉPLOYÉ (voir .vercelignore).
-- ═══════════════════════════════════════════════════════════════

-- 1. Fonction is_admin() SECURITY DEFINER : évite la récursion RLS
--    et empêche toute manipulation côté client.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()),
    FALSE
  )
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 2. Verrouiller la colonne is_admin : le client ne peut modifier
--    que ses champs de profil, jamais son statut admin.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, company, email) ON public.profiles TO authenticated;
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.dossiers FROM anon;

-- 3. Policy UPDATE avec WITH CHECK (le USING seul ne contrôle pas
--    les nouvelles valeurs).
DROP POLICY IF EXISTS "users_own_profile_update" ON public.profiles;
CREATE POLICY "users_own_profile_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. Policies admin fondées sur is_admin() (plus d'auto-référence).
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_dossiers_select" ON public.dossiers;
CREATE POLICY "admin_all_dossiers_select" ON public.dossiers
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_all_dossiers_update" ON public.dossiers;
CREATE POLICY "admin_all_dossiers_update" ON public.dossiers
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Contrôle : aucun client ne doit pouvoir exécuter
--    UPDATE public.profiles SET is_admin = TRUE WHERE id = auth.uid();
--    (doit échouer avec « permission denied for column is_admin »)
