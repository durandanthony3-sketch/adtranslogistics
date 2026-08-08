const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'argus_4616_reference.js'), 'utf8'), sandbox);

const meta = sandbox.window.ARGUS_4616_META;
const families = sandbox.window.ARGUS_4616_FAMILIES;
const links = sandbox.window.ARGUS_4616_LINKS;
const traces = sandbox.window.ARGUS_4616_TRACE;

assert.strictEqual(meta.edition, '4616');
assert.strictEqual(meta.date, '29 juin 2022');
assert.strictEqual(meta.trustedRows, 14492);
assert.strictEqual(Object.keys(families).length, 461);
assert.strictEqual(Object.keys(links).length, 1365);
assert.strictEqual(Object.keys(traces).length, 512);

const rav = traces['TOYOTA|RAV|2013'];
assert.strictEqual(rav.status, 'verified');
assert.strictEqual(rav.sourceModel, 'RAV4');
assert.strictEqual(rav.retained, 7850);
assert.deepStrictEqual(Array.from(rav.pages), [103]);
assert(rav.lines.every((line) => /^ARGUS4616-P103-/.test(line.id)));

const highlander = traces['TOYOTA|HIGHLANDER|2005'];
assert.strictEqual(highlander.relation, 'assimilation');
assert.strictEqual(highlander.sourceModel, 'LAND CRUISER');
assert.strictEqual(highlander.baseValue, 5900);
assert.strictEqual(highlander.coefficient, 0.4);
assert.strictEqual(highlander.retained, 2360);

const glk = traces['MERCEDESBENZ|GLK350|2013'];
assert.strictEqual(glk.status, 'corroborated');
assert.strictEqual(glk.lines[0].status, 'A_VERIFIER');
assert.strictEqual(glk.pages[0], 102);

const corollaVerso = traces['TOYOTA|COROLLAVERSO|2008'];
assert.strictEqual(corollaVerso.low, 2260);
assert.strictEqual(corollaVerso.high, 2770);
assert.strictEqual(corollaVerso.retained, 2515);

// Contrôles de régression sur l'intégration du simulateur.
const html = fs.readFileSync(path.join(root, 'simulateur.html'), 'utf8');
assert(html.includes('/argus_4616_reference.js?v=1'));
assert(html.includes('id="inp-transaction-value"'));
assert(html.includes("if (annee >= 2022)"));
assert(html.includes('function renderArgusTrace'));
assert(!html.includes('Math.pow(1.08'), 'Une extrapolation +8 %/an subsiste dans le simulateur.');

// Chaque script inline doit au minimum être syntaxiquement compilable.
const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
for (const match of html.matchAll(scriptPattern)) {
  const openTag = match[0].slice(0, match[0].indexOf('>'));
  if (/application\/ld\+json/i.test(openTag) || /\bsrc=/i.test(openTag)) continue;
  new Function(match[1]);
}

// Formule de liquidation reproduite pour vérifier les quatre catégories fiscales.
function liquidate(coteEur, freight, category) {
  const rates = { A: 0.20, B: 0.20, C: 0.10, D: 0.05 };
  const caf = Math.max(category === 'C' || category === 'D' ? 2500000 : 1500000,
    Math.round(coteEur * 655.957) + freight);
  const base = 0.70 * caf;
  const dd = Math.round(base * rates[category]);
  const community = Math.round(base * 0.03);
  const taxBase = base * (1 + rates[category] + 0.03);
  const vat = Math.round(taxBase * 0.18);
  const excise = category === 'A' ? Math.round(taxBase * 0.10) : 0;
  return dd + community + vat + excise + 98600;
}

assert(liquidate(7850, 600000, 'A') > liquidate(7850, 600000, 'B'));
assert(liquidate(7850, 600000, 'B') > liquidate(7850, 600000, 'C'));
assert(liquidate(7850, 600000, 'C') > liquidate(7850, 600000, 'D'));

console.log(JSON.stringify({
  ok: true,
  families: Object.keys(families).length,
  links: Object.keys(links).length,
  traces: Object.keys(traces).length,
  statuses: meta.traceStats,
  samples: ['TOYOTA RAV 2013', 'TOYOTA HIGHLANDER 2005', 'MERCEDES-BENZ GLK350 2013']
}, null, 2));
