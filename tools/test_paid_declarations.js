'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createStore, mount } = require('../paid-declarations.js');
const base = { brand: 'LEXUS', model: 'RX350', year: 2016, declYear: 2025, category: 'A', n: 4, cafMedian: 8000000, cafMin: 7800000, cafMax: 8500000, dutyMedian: 3300000, dutyMin: 3250000, dutyMax: 3500000, firstDate: '2025-01-10', lastDate: '2025-11-09', formulaFits: 4, receiptCount: 4 };
const data = { meta: { source: 'Compilation test', sourcePeriod: '2023-2026' }, records: [
  base,
  Object.assign({}, base, { declYear: 2026, cafMedian: 8200000, dutyMedian: 3400000, n: 2, vin: 'PRIVATE', client: 'PRIVATE' }),
  Object.assign({}, base, { category: 'B', declYear: 2026, dutyMedian: 2600000, dutyMin: 2500000, dutyMax: 2700000 }),
  Object.assign({}, base, { brand: 'BMW', model: 'Serie 3' }),
  Object.assign({}, base, { year: 2015 })
] };
const context = { brand: 'Lexus', model: 'RX 350', year: 2016, category: 'A', caf: 9000000, totalDouane: 3600000 };
const store = createStore(data);
let match = store.find(context);
assert.equal(match.record.declYear, 2026, 'Retenir le dernier exercice de la catégorie exacte.');
assert.equal(match.record.n, 2);
assert.equal(match.dutyDifference, 200000);
assert.equal(match.cafDifference, 800000);
assert.equal(match.record.vin, undefined, 'Aucun champ personnel ne doit être conservé.');
assert.equal(match.record.client, undefined);
match = store.find(Object.assign({}, context, { category: 'B' }));
assert.equal(match.record.dutyMedian, 2600000);
assert.equal(store.find(Object.assign({}, context, { category: 'C' })), null);
assert.equal(store.find(Object.assign({}, context, { category: null })), null, 'Sans catégorie, ne pas mélanger A et B.');
assert.equal(store.find(Object.assign({}, context, { model: 'RX450' })), null);
assert.equal(store.find(Object.assign({}, context, { brand: 'BMW', model: '330i' })), null, 'Aucun rapprochement automatique avec Série 3.');
assert.equal(store.find(Object.assign({}, context, { year: 2017 })), null);
assert.equal(store.find(Object.assign({}, context, { isReexport: true })), null, 'Ne pas comparer les droits IM4 au forfait de réexportation.');
assert.equal(createStore({ records: [base, base] }).find(context), null, 'Ne pas fabriquer une médiane en présence de doublons.');
assert.equal(createStore({ records: [Object.assign({}, base, { cafMedian: NaN })] }).find(context), null);

class FakeNode {
  constructor() { this.children = []; this.textContent = ''; this.hidden = false; }
  appendChild(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; this.textContent = ''; }
  text() { return this.textContent + this.children.map(child => child.text()).join(' '); }
}
function surface(fetch) {
  const box = new FakeNode();
  const content = new FakeNode();
  return { box, content, window: { fetch, document: { getElementById: id => id === 'paid-declarations' ? box : id === 'paid-declarations-content' ? content : null, createElement: () => new FakeNode() } } };
}
async function main() {
  let count = 0;
  let resolveFetch;
  const pending = new Promise(resolve => { resolveFetch = resolve; });
  const ui = surface(() => { count++; return pending; });
  const controller = mount(ui.window);
  assert.equal(count, 0, 'Aucune requête au chargement sans calcul.');
  const first = controller.render(context);
  await Promise.resolve();
  assert.equal(count, 1);
  const later = controller.render(Object.assign({}, context, { model: 'RX450' }));
  resolveFetch({ ok: true, json: async () => data });
  await Promise.all([first, later]);
  assert.match(ui.content.text(), /Pas de donnée comparable/);
  assert(!ui.content.text().includes('3\u202f400\u202f000'), 'Le résultat ancien ne doit pas revenir après le chargement.');
  await controller.render(context);
  assert.match(ui.content.text(), /2 observations/);
  assert.match(ui.content.text(), /exercice 2026/);
  assert.match(ui.content.text(), /au-dessus de la médiane/);
  assert.equal(count, 1, 'Une seule requête pour les recalculs successifs.');
  await controller.render(Object.assign({}, context, { category: 'B' }));
  assert.match(ui.content.text(), /catégorie B/);
  assert(!ui.content.text().includes('catégorie A'));
  await controller.render(Object.assign({}, context, { year: 2017 }));
  assert.match(ui.content.text(), /Pas de donnée comparable/);
  await controller.render(null);
  assert.equal(ui.box.hidden, true);
  assert.equal(ui.content.text(), '', 'La remise à zéro efface les observations.');

  let failCount = 0;
  const missing = surface(async () => { failCount++; return { ok: false, status: 404 }; });
  const missingController = mount(missing.window);
  await missingController.render(context);
  assert.match(missing.content.text(), /pas disponible/);
  await missingController.render(context);
  assert.equal(failCount, 1, 'Pas de boucle de requêtes sur un fichier absent.');
  const offline = surface(async () => { throw new Error('Network unavailable'); });
  await mount(offline.window).render(context); // Absence de rejet de promesse non traité.
  assert.match(offline.content.text(), /pas disponible/);

  const html = fs.readFileSync(path.join(__dirname, '..', 'simulateur.html'), 'utf8');
  assert(html.includes('ADTL_LAST_OBSERVATION_CONTEXT = null'));
  assert(html.includes('ADTL_LAST_OBSERVATION_CONTEXT = {'));
  assert(!html.includes('2 181'), 'Le seuil fiscal ne doit pas être assimilé à une cylindrée.');
  assert(!html.includes('2,2 L'));
  console.log(JSON.stringify({ ok: true, checks: 'identité exacte, catégorie séparée, exercice récent, écart, anonymisation, absence/race/remise à zéro, requête unique et erreurs interceptées, seuil 13 CV' }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
