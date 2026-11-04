'use strict';

// Copie serveur de chaque simulation payée (Supabase, table public.sim_receipts).
// Écriture : RPC publique store_sim_receipt (SECURITY DEFINER, insert/upsert seulement) avec la clé anon.
// Lecture : réservée aux comptes admin/staff via RLS (console /admin) ; le serveur relit une ligne
// avec le jeton de session de l'administrateur, jamais avec une clé de service.
// Sans configuration Supabase, le magasin est inactif : le paiement et le rapport continuent de fonctionner.

const fs = require('node:fs');
const path = require('node:path');

function publicConfig() {
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
    const url = text.match(/SUPABASE_URL:\s*'([^']+)'/), key = text.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/);
    return { url: url ? url[1] : '', anonKey: key ? key[1] : '' };
  } catch { return { url: '', anonKey: '' }; }
}

function summarize(product, result) {
  if (!result || typeof result !== 'object') return {};
  if (product === 'goods') {
    return { total: result.budget?.totalLanded ?? result.totalTaxes ?? null, totalTaxes: result.totalTaxes ?? null, cif: result.input?.cif ?? null, currency: result.input?.currency ?? null };
  }
  return { total: result.totalGeneral ?? null, totalDouane: result.totalDouane ?? null, caf: result.caf ?? null, cat: result.cat ?? null, valuation: result.val?.src ?? null };
}

function createReceiptStore({ env = process.env, fetch: fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const fallback = publicConfig();
  const url = String(env.SUPABASE_URL || fallback.url || '').replace(/\/+$/, '');
  const anonKey = String(env.SUPABASE_ANON_KEY || fallback.anonKey || '');
  const enabled = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && anonKey.length > 20 && env.RECEIPT_STORE !== 'off';

  async function call(method, pathname, { body, bearer, headers } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url + pathname, {
        method, signal: controller.signal, redirect: 'error',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: anonKey, Authorization: 'Bearer ' + (bearer || anonKey), ...(headers || {}) },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      const text = await response.text();
      if (!response.ok) { const error = new Error('store_rejected'); error.providerStatus = response.status; error.providerBody = text.slice(0, 200); throw error; }
      try { return text ? JSON.parse(text) : null; } catch { return null; }
    } finally { clearTimeout(timer); }
  }

  return {
    enabled,
    /** Enregistre (ou met à jour) la copie serveur d'un reçu vérifié. Ne lève jamais : journalise seulement. */
    async save(receipt, extra = {}) {
      if (!enabled) return { stored: false, reason: 'store_disabled' };
      try {
        const product = receipt.product || 'vehicle';
        await call('POST', '/rest/v1/rpc/store_sim_receipt', { body: {
          p_order_id: receipt.orderId, p_transaction_id: receipt.transactionId, p_product: product,
          p_amount: receipt.amount, p_currency: receipt.currency,
          p_customer: receipt.customer || null, p_input: receipt.input, p_result: receipt.result,
          p_summary: summarize(product, receipt.result),
          p_created_at: receipt.createdAt, p_verified_at: receipt.verifiedAt,
          p_notification_status: receipt.notificationStatus || 'pending',
          p_email_provider: extra.provider || null, p_report_version: extra.reportVersion || null
        } });
        return { stored: true };
      } catch (error) {
        console.error(JSON.stringify({ event: 'receipt_store_failed', product: receipt.product || 'vehicle', reason: error.name === 'AbortError' ? 'store_timeout' : (error.message || 'store_failed'), ...(Number.isInteger(error.providerStatus) ? { providerStatus: error.providerStatus } : {}) }));
        return { stored: false, reason: 'store_failed' };
      }
    },
    /** Relit une simulation payée avec le jeton de session d'un administrateur (RLS). */
    async readAsAdmin(accessToken, transactionId) {
      if (!enabled) return null;
      if (typeof accessToken !== 'string' || !/^[A-Za-z0-9._-]{20,4096}$/.test(accessToken) || !/^[A-Za-z0-9_-]{4,128}$/.test(String(transactionId || ''))) return null;
      const rows = await call('GET', '/rest/v1/sim_receipts?select=*&transaction_id=eq.' + encodeURIComponent(transactionId) + '&limit=1', { bearer: accessToken });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    },
    async markNotified(accessToken, transactionId, status, provider) {
      if (!enabled) return false;
      await call('PATCH', '/rest/v1/sim_receipts?transaction_id=eq.' + encodeURIComponent(transactionId), { bearer: accessToken, headers: { Prefer: 'return=minimal' }, body: { notification_status: status, email_provider: provider || null, notified_at: new Date().toISOString() } });
      return true;
    }
  };
}

module.exports = { createReceiptStore, summarize };
