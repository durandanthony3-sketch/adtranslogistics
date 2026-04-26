-- ═══════════════════════════════════════════════════════════════
--   AD TRANS LOGISTICS — Schéma Supabase
--   À exécuter dans l'éditeur SQL de votre projet Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLE : profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name   TEXT,
    phone       TEXT,
    company     TEXT,
    email       TEXT,
    is_admin    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies : chaque utilisateur voit son propre profil
CREATE POLICY "users_own_profile_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_own_profile_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- L'admin peut voir tous les profils
CREATE POLICY "admin_all_profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ─── TRIGGER : créer le profil à l'inscription ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, company, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'company',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── TABLE : dossiers ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dossiers (
    id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reference    TEXT UNIQUE NOT NULL,
    user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type         TEXT NOT NULL CHECK (type IN ('import','export','transit')),
    marchandise  TEXT NOT NULL,
    description  TEXT,
    origine      TEXT,
    destination  TEXT,
    valeur       NUMERIC,
    devise       TEXT NOT NULL DEFAULT 'XOF',
    statut       TEXT NOT NULL DEFAULT 'ouvert'
                 CHECK (statut IN ('ouvert','en_cours','en_attente','complete','annule')),
    current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
    admin_notes  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

-- Clients : voir et créer leurs propres dossiers
CREATE POLICY "clients_own_dossiers_select" ON public.dossiers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_own_dossiers_insert" ON public.dossiers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin : tout voir et modifier
CREATE POLICY "admin_all_dossiers_select" ON public.dossiers
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "admin_all_dossiers_update" ON public.dossiers
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- ─── TRIGGER : updated_at automatique ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_dossier_updated ON public.dossiers;
CREATE TRIGGER on_dossier_updated
    BEFORE UPDATE ON public.dossiers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── Activer Realtime sur dossiers ───────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.dossiers;

-- ═══════════════════════════════════════════════════════════════
--   ÉTAPE FINALE : Définir l'administrateur
--   À exécuter APRÈS avoir créé votre compte avec l'email admin
--   (adtranslogistic@hotmail.com)
-- ═══════════════════════════════════════════════════════════════

-- UPDATE public.profiles
--   SET is_admin = TRUE
--   WHERE email = 'adtranslogistic@hotmail.com';
