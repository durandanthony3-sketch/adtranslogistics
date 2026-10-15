import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, '..', 'qa');
const html = await fs.readFile(path.join(root, 'vehicules.html'), 'utf8');
assert(!html.includes('function calculateDuty'));
assert(!html.includes('function autoInsurance'));
assert(!html.includes('vehicles_db.js'));
assert(html.includes('function closeMobile()') && html.includes('function toggleFaq(btn)') && html.includes('function submitOrder(e)'));
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  const open = match[0].slice(0, match[0].indexOf('>'));
  if (/application\/ld\+json|\bsrc=/i.test(open)) continue;
  new Function(match[1]);
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.route('**/*', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  const response = await page.goto('http://127.0.0.1:8766/vehicules', { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  const section = page.locator('#simulateur-vehicule');
  assert.equal(await section.count(), 1);
  assert.equal(await section.locator('input,select,form').count(), 0);
  assert.equal(await page.evaluate(() => typeof calculateDuty), 'undefined');
  const simulator = section.getByRole('link', { name: 'Ouvrir le simulateur complet' });
  assert.equal(await simulator.getAttribute('href'), '/simulateur');
  assert.equal(await section.getByRole('link', { name: 'Demander une estimation personnalisée' }).getAttribute('href'), '/demande');
  await section.scrollIntoViewIfNeeded();
  await fs.mkdir(out, { recursive: true });
  await section.screenshot({ path: path.join(out, 'vehicules-simulateur-unique.png') });
  await simulator.click();
  await page.waitForURL('**/simulateur');
  assert(await page.locator('#sel-valuation-source').count(), 'Le lien ouvre bien le simulateur audité.');
  const enquiry = await page.goto('http://127.0.0.1:8766/demande', { waitUntil: 'domcontentloaded' });
  assert.equal(enquiry.status(), 200);
  assert.equal(errors.length, 0, errors.join('\n'));
  const report = { ok: true, checks: ['ancre préservée', 'carte sans moteur de calcul secondaire', 'JS restant compilable', 'pas de référence DOM absente', 'navigation simulateur central valide', 'route demande valide', 'aucune erreur JS', 'GET/HEAD uniquement'], errors };
  await fs.writeFile(path.join(out, 'vehicules-simulateur-unique.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
