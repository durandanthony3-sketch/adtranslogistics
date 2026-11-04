-- AD TRANS LOGISTICS — copie serveur des simulations payées (véhicule et marchandises)
-- À exécuter une fois dans Supabase (SQL Editor) ou via l'outil Supabase MCP. Idempotent, sans DROP.
-- Écriture : uniquement par la RPC public.store_sim_receipt (appelée par les fonctions Vercel avec la clé anon).
-- Lecture / mise à jour : équipe ADTL (admin ou staff) via RLS, depuis la console /admin.

CREATE TABLE IF NOT EXISTS public.sim_receipts (
  id BIGSERIAL PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE,
  order_id TEXT NOT NULL,
  product TEXT NOT NULL CHECK (product IN ('vehicle', 'goods')),
  amount INTEGER NOT NULL CHECK (amount BETWEEN 0 AND 1000000),
  currency TEXT NOT NULL DEFAULT 'XOF',
  customer JSONB,
  customer_email TEXT GENERATED ALWAYS AS (lower(customer->>'email')) STORED,
  customer_phone TEXT GENERATED ALWAYS AS (customer->>'phone') STORED,
  input JSONB NOT NULL,
  result JSONB NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  label TEXT,
  total NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'sent', 'not_required', 'failed')),
  email_provider TEXT,
  notified_at TIMESTAMPTZ,
  report_version TEXT,
  handled_by UUID REFERENCES auth.users(id),
  handled_at TIMESTAMPTZ,
  staff_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sim_receipts_verified_idx ON public.sim_receipts (verified_at DESC);
CREATE INDEX IF NOT EXISTS sim_receipts_email_idx ON public.sim_receipts (customer_email);

ALTER TABLE public.sim_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sim_receipts FROM anon;
GRANT SELECT ON public.sim_receipts TO authenticated;
GRANT UPDATE (notification_status, email_provider, notified_at, handled_by, handled_at, staff_note, updated_at) ON public.sim_receipts TO authenticated;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sim_receipts' AND policyname = 'staff_read_sim_receipts') THEN
    CREATE POLICY "staff_read_sim_receipts" ON public.sim_receipts FOR SELECT TO authenticated USING (public.is_staff());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sim_receipts' AND policyname = 'staff_update_sim_receipts') THEN
    CREATE POLICY "staff_update_sim_receipts" ON public.sim_receipts FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.store_sim_receipt(
  p_order_id TEXT, p_transaction_id TEXT, p_product TEXT, p_amount INTEGER, p_currency TEXT,
  p_customer JSONB, p_input JSONB, p_result JSONB, p_summary JSONB,
  p_created_at TIMESTAMPTZ, p_verified_at TIMESTAMPTZ, p_notification_status TEXT,
  p_email_provider TEXT DEFAULT NULL, p_report_version TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_transaction_id !~ '^[A-Za-z0-9_-]{4,128}$' OR p_order_id !~ '^[a-f0-9]{32}$' THEN RAISE EXCEPTION 'invalid_receipt'; END IF;
  IF p_product NOT IN ('vehicle', 'goods') THEN RAISE EXCEPTION 'invalid_product'; END IF;
  IF p_input IS NULL OR p_result IS NULL THEN RAISE EXCEPTION 'invalid_receipt'; END IF;
  IF pg_column_size(p_input) > 65536 OR pg_column_size(p_result) > 131072 OR pg_column_size(p_customer) > 4096 THEN RAISE EXCEPTION 'receipt_too_large'; END IF;
  INSERT INTO public.sim_receipts (order_id, transaction_id, product, amount, currency, customer, input, result, summary, label, total, created_at, verified_at, notification_status, email_provider, report_version)
  VALUES (p_order_id, p_transaction_id, p_product, p_amount, COALESCE(p_currency, 'XOF'), p_customer, p_input, p_result, COALESCE(p_summary, '{}'::jsonb),
          CASE WHEN p_product = 'goods' THEN 'SH ' || COALESCE(p_input->>'commodity', '') ELSE concat_ws(' ', p_input->>'brand', p_input->>'model', p_input->>'year') END,
          NULLIF(p_summary->>'total', '')::numeric, COALESCE(p_created_at, now()), p_verified_at, COALESCE(p_notification_status, 'pending'), p_email_provider, p_report_version)
  ON CONFLICT (transaction_id) DO UPDATE SET
    notification_status = CASE WHEN EXCLUDED.notification_status = 'sent' OR public.sim_receipts.notification_status <> 'sent' THEN EXCLUDED.notification_status ELSE public.sim_receipts.notification_status END,
    email_provider = COALESCE(EXCLUDED.email_provider, public.sim_receipts.email_provider),
    customer = COALESCE(EXCLUDED.customer, public.sim_receipts.customer),
    report_version = COALESCE(EXCLUDED.report_version, public.sim_receipts.report_version),
    notified_at = CASE WHEN EXCLUDED.notification_status = 'sent' THEN now() ELSE public.sim_receipts.notified_at END,
    updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.store_sim_receipt(TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB, JSONB, JSONB, JSONB, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_sim_receipt(TEXT, TEXT, TEXT, INTEGER, TEXT, JSONB, JSONB, JSONB, JSONB, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Vue d'ensemble pour la console (sans le JSON lourd)
CREATE OR REPLACE VIEW public.sim_receipts_overview WITH (security_invoker = true) AS
  SELECT id, transaction_id, order_id, product, amount, currency, label, total,
         customer->>'firstName' AS first_name, customer->>'lastName' AS last_name, customer_phone, customer_email,
         created_at, verified_at, notification_status, email_provider, notified_at, handled_by, handled_at, staff_note
  FROM public.sim_receipts;
GRANT SELECT ON public.sim_receipts_overview TO authenticated;
