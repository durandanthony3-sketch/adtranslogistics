'use strict';

// Réveil quotidien de la base Supabase (plan gratuit : mise en pause après 7 jours sans requête).
// Appelé par le cron Vercel (vercel.json) ; une requête REST suffit à compter comme une activité.
const fs = require('node:fs');
const path = require('node:path');

function publicConfig() {
  const text = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
  return { url: (text.match(/SUPABASE_URL:\s*'([^']+)'/) || [])[1], anonKey: (text.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/) || [])[1] };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const { url, anonKey } = publicConfig();
  const checks = {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const rpc = await fetch(url + '/rest/v1/rpc/track_depotage', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: 'Bearer ' + anonKey },
      body: JSON.stringify({ p_code: 'KEEPALIVE' })
    });
    checks.rest = rpc.status;
    const auth = await fetch(url + '/auth/v1/health', { signal: controller.signal, headers: { apikey: anonKey } });
    checks.auth = auth.status;
  } catch (error) {
    checks.error = error.name === 'AbortError' ? 'timeout' : 'unreachable';
  } finally { clearTimeout(timer); }
  const ok = checks.rest === 200 && checks.auth === 200;
  if (!ok) console.error(JSON.stringify({ event: 'supabase_keepalive_failed', ...checks }));
  res.statusCode = ok ? 200 : 503;
  res.end(JSON.stringify({ ok, at: new Date().toISOString(), ...checks }));
};
