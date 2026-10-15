/* Tests métier avec les fonctions réellement présentes dans simulateur.html. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createStore, canUse } = require('../argus-catalogue.js');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'simulateur.html'), 'utf8');
const verified = { id: 'AUDI-S3-2016', brand: 'AUDI', model: 'S3', version: 'S3 Berline 2.0 TFSI 300', year: 2016, priceEur: 15600, energy: 'E', fiscalCv: 19, fiscalCvVerified: true, pdfPage: 44, printedPage: 88, status: 'verified', usable: true, warnings: [] };
const unchecked = Object.assign({}, verified, { id: 'OCR-UNCHECKED', fiscalCvVerified: false, status: 'ocr_usable' });
const suspect = Object.assign({}, verified, { id: 'OCR-SUSPECT', usable: false, priceEur: 156000, status: 'review', warnings: ['Prix à contrôler'] });
const fixtures = { meta: { edition: '4616', date: '2022-06-29' }, records: [verified, unchecked, suspect] };
const store = createStore(fixtures);
const utility = Object.assign({}, verified, { id: 'FIAT-DUCATO-2021', brand: 'FIAT', model: 'Ducato', version: 'Ducato Fg', section: 'UTILITAIRE_LEGER', year: 2021, fiscalCv: 9 });
const utilityStore = createStore({ records: [utility] });
utilityStore.select(utility.id);
assert.equal(utilityStore.valuation('FIAT', 'Ducato', 2021).cat, 'C', 'Le CV 9 d’un utilitaire ne doit pas déclencher la catégorie tourisme B.');
assert.equal(store.search('audi s3 berline', 2016, 1, 8).total, 3, 'Les lignes suspectes doivent rester consultables.');
assert.equal(store.search('S3', 2015).total, 0);
assert.equal(store.search('BERLINE audi', '', 1, 1).pages, 3);
assert.equal(store.search('S3', 2016, 2, 1).records[0].id, unchecked.id);
assert.equal(store.search('S3', 2016, 999, 1).page, 3);
assert.equal(store.select(suspect.id), null, 'Une ligne suspecte ne doit jamais alimenter un calcul.');
assert.equal(store.selected(), null);

assert.equal(canUse(Object.assign({}, verified, { priceEur: '15600' })), false);
assert.equal(canUse(Object.assign({}, verified, { priceEur: NaN })), false);
assert.equal(canUse(Object.assign({}, verified, { priceEur: -1 })), false);
assert.equal(canUse(Object.assign({}, verified, { year: 2022 })), false);
assert.equal(canUse(Object.assign({}, verified, { version: '' })), false);
assert.throws(() => createStore({ records: [verified, verified] }), /dupliqu/);

store.select(unchecked.id);
assert.equal(store.valuation('AUDI', 'S3', 2016).cat, null, 'Le CV OCR ne doit pas déterminer la catégorie fiscale.');
assert.equal(store.valuation('AUDI', 'S3', 2016).trace.status, 'ocr');
store.select(verified.id);
let selected = store.valuation('AUDI', 'S3', 2016);
assert.equal(selected.cote, 15600);
assert.equal(selected.trace.coefficient, 1);
assert.equal(selected.cat, 'A');
assert.equal(selected.trace.lines[0].version, verified.version);
assert.equal(selected.trace.pdfPages[0], 44);
assert.equal(store.valuation('BMW', '330i', 2016), null, 'Aucune assimilation Audi/BMW implicite.');
assert.equal(store.selected(), null);
store.select(verified.id);
assert.equal(store.valuation('AUDI', 'S3', 2017), null, 'Un changement d’année invalide la référence.');

// Fonctions isolées par leurs frontières stables ; aucune formule recopiée.
function block(start, end) {
  const begin = html.indexOf(start);
  assert.notEqual(begin, -1, start);
  const finish = html.indexOf(end, begin + start.length);
  assert.notEqual(finish, -1, end);
  return html.slice(begin, finish);
}
const elements = new Map();
function el(id) {
  if (!elements.has(id)) elements.set(id, {
    value: '', textContent: '', style: {}, dataset: {}, checked: false, disabled: false,
    classList: { add() {}, remove() {} }, appendChild() {}, removeAttribute() {}, setAttribute() {}
  });
  return elements.get(id);
}
let fallbackCalls = 0;
const sandbox = {
  console, URLSearchParams, Intl, Set,
  document: { getElementById: el, createElement: () => ({}) },
  window: { ADTLSelectedArgus: { valuation: (...args) => store.valuation(...args), invalidate: () => store.clear() } },
  refModelEntry: () => { fallbackCalls++; return { y: { '2016': ['c', 9999] } }; },
  recToVal: rec => ({ mode: 'cote', src: 'ref', cote: rec[1] }),
  withArgusTrace: val => val,
  findDouaneAssimilation: () => null,
  getArgusFamilyValuation: () => null,
  getReferenceValuation: () => null,
  refBrand: () => null,
  ARGUS_BY_KEY: {}, DOUANE_ASSIMILATIONS: [],
  normalizeArgusKey: value => String(value).toUpperCase(),
  selMarque: el('sel-marque'), selModele: el('sel-modele'), inpAnnee: el('inp-annee'),
  selOrigine: el('sel-origine'), selType: el('sel-type'), inpTransaction: el('inp-transaction-value'),
  isTgcEligibleType: type => ['tourisme', 'suv', 'luxe'].includes(type),
  FRET_TABLE: { usa: 600000 }, getEffectiveFret: () => 600000,
  fmt: value => value, fmtEur: value => value,
  resetResults() {}, refreshValuationDisplay() {}, renderArgusTrace() {},
  renderChecklists() {}, applyLeadGate() {}, applyPayGate() {}, updateTransactionControl() {}
};
vm.createContext(sandbox);
vm.runInContext(block('function isManualValuation()', 'function onValuationSourceChange'), sandbox);
vm.runInContext(block('function getValuation(marque, modele, annee)', 'function getValuationLabel'), sandbox);
store.select(verified.id);
assert.equal(sandbox.getValuation('AUDI', 'S3', 2016).cote, 15600);
assert.equal(fallbackCalls, 0, 'La ligne sélectionnée doit primer sur la famille/valeur empirique.');
store.clear();
assert.equal(sandbox.getValuation('AUDI', 'S3', 2016).cote, 9999, 'Sans sélection, conserver le parcours existant.');
assert.equal(sandbox.getValuation('AUDI', 'S3', 2024).mode, 'transaction');

vm.runInContext(block('const TAUX_TYPES =', "if (typeof REF_DOUANE"), sandbox);
vm.runInContext(block('function getTransactionInput()', 'function onTransactionChange'), sandbox);
vm.runInContext(block('const FRAIS_BFU_GUCE_PAC =', '// ── Mobile nav & navbar'), sandbox);
vm.runInContext(block('function updateTgcControl()', 'function onTypeChange'), sandbox);
const inputs = { 'sel-marque': 'AUDI', 'sel-modele': 'S3', 'inp-annee': '2016', 'sel-origine': 'usa', 'sel-type': 'tourisme', 'sel-contribuable': 'physique', 'sel-destination': 'benin' };
Object.entries(inputs).forEach(([id, value]) => { el(id).value = value; });
store.select(verified.id);
sandbox.updateTgcControl();
assert.equal(el('chk-tgc').checked, true);
sandbox.calculate();
const totalWithTgc = el('res-total-douane').textContent;
const caf = el('res-cif').textContent;
assert.equal(el('res-bfu').textContent, 100000);
assert.equal(el('res-prestation').textContent, 100000);
assert.equal(el('res-user-frais').textContent, 551815, 'Provisions 100 000 + 100 000, autres coûts et IMF inchangés.');
assert.equal(el('res-total').textContent, 5006138, 'Total incluant les nouvelles provisions.');
assert.equal(caf, 10832976, 'CAF : 15 600 € × 655,96 + 600 000 F de fret.');
assert(Math.abs(totalWithTgc - (Math.round(caf * 0.40208) + 98600)) <= 2, 'Taux agrégé existant 40,208 %, sous réserve des arrondis de chaque taxe.');
el('chk-tgc').checked = false;
sandbox.calculate();
const totalWithoutTgc = el('res-total-douane').textContent;
assert(Math.abs(totalWithoutTgc - (Math.round(caf * 0.31598) + 98600)) <= 2, 'Taux agrégé existant 31,598 %.');
assert(totalWithTgc > totalWithoutTgc);
store.select(unchecked.id);
el('chk-tgc').checked = true;
sandbox.updateTgcControl();
assert.equal(el('chk-tgc').checked, false, 'Une nouvelle version sans CV fiable ne conserve pas le statut fiscal précédent.');
assert.equal(el('chk-tgc').disabled, false, 'La TGC reste une saisie manuelle si le CV n’est pas contrôlé.');

// Une CAF / AVD contient déjà le fret : le même champ ne doit jamais le doubler.
store.clear();
el('inp-annee').value = '2024';
el('inp-transaction-value').value = '10000000';
el('sel-transaction-currency').value = 'XOF';
el('sel-transaction-basis').value = 'caf';
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10000000);
assert.match(el('res-fret-val').textContent, /Compris/);
assert.match(el('res-val-brute-label').textContent, /CAF/);
el('sel-transaction-basis').value = 'fob';
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10600000);
assert.equal(el('res-fret-val').textContent, 600000);
el('sel-transaction-currency').value = 'EUR';
el('inp-transaction-value').value = '15600';
el('sel-transaction-basis').value = 'caf';
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10232976);
el('sel-transaction-basis').value = 'fob';
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10832976);
el('inp-annee').value = '2016';
store.select(verified.id);
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10832976, 'La devise/base transactionnelle ne doit pas altérer une cote Argus.');
assert.equal(el('res-transaction-basis').hidden, true);

el('inp-annee').value = '2010';
el('sel-valuation-source').value = 'manual';
el('sel-transaction-basis').value = 'caf';
el('sel-transaction-currency').value = 'XOF';
el('inp-transaction-value').value = '10000000';
sandbox.calculate();
assert.equal(sandbox.getValuation('AUDI', 'S3', 2010).mode, 'transaction');
assert.equal(el('res-cif').textContent, 10000000, 'Une AVD doit aussi remplacer les références des millésimes anciens.');
el('sel-valuation-source').value = 'reference';
el('inp-annee').value = '2016';
store.select(verified.id);
sandbox.calculate();
assert.equal(el('res-cif').textContent, 10832976, 'Le retour à une version du catalogue rétablit la cote exacte.');

sandbox.window.ADTLSelectedArgus.valuation = (...args) => utilityStore.valuation(...args);
el('sel-marque').value = 'FIAT';
el('sel-modele').value = 'Ducato';
el('inp-annee').value = '2021';
el('sel-type').value = 'utilitaire';
sandbox.calculate();
assert(Math.abs(el('res-total-douane').textContent - (Math.round(el('res-cif').textContent * 0.23338) + 98600)) <= 2, 'Le Ducato utilise le modèle utilitaire C et non le tourisme B.');
sandbox.window.ADTLSelectedArgus.valuation = (...args) => store.valuation(...args);
el('sel-marque').value = 'AUDI';
el('sel-modele').value = 'S3';
el('inp-annee').value = '2016';
el('sel-type').value = 'tourisme';

vm.runInContext(block('function onMarqueChange()', '// ── On modèle change'), sandbox);
vm.runInContext(block('function onModeleChange()', 'function updateTgcControl'), sandbox);
vm.runInContext(block('function onAnneeChange()', '// ── Lead gate'), sandbox);
store.select(verified.id);
el('sel-marque').value = 'BMW';
sandbox.onMarqueChange();
assert.equal(store.selected(), null);
el('sel-marque').value = 'AUDI';
store.select(verified.id);
el('sel-modele').value = 'A4';
sandbox.onModeleChange();
assert.equal(store.selected(), null);
el('sel-modele').value = 'S3';
store.select(verified.id);
el('inp-annee').value = '2017';
sandbox.onAnneeChange();
assert.equal(store.selected(), null);

// Un passage à Neuf efface les chiffres et interdit le rapport standard occasion.
vm.runInContext(block('function resetResults()', '// ── Origine'), sandbox);
vm.runInContext(block('function onTypeChange()', 'function updateTransactionControl'), sandbox);
vm.runInContext(block('function getSimulationData()', '// ══ Build devis'), sandbox);
vm.runInContext(block('function downloadReportPDF()', '// ── Partage WhatsApp'), sandbox);
let observedContext = 'previous';
sandbox.window.ADTLPaidDeclarations = { render(value) { observedContext = value; } };
el('sel-marque').value = 'AUDI';
el('sel-modele').value = 'S3';
el('inp-annee').value = '2016';
el('sel-type').value = 'tourisme';
store.select(verified.id);
sandbox.calculate();
assert.equal(sandbox.window.ADTL_SIMULATION_READY, true);
el('sel-type').value = 'neuf';
sandbox.onTypeChange();
assert.equal(sandbox.window.ADTL_SIMULATION_READY, false);
assert.equal(el('res-total').textContent, '—');
assert.equal(el('res-total-douane').textContent, '—');
assert.equal(el('res-content').style.display, 'none');
assert.equal(el('new-vehicle-notice').hidden, false);
assert.equal(observedContext, null);
assert.equal(sandbox.getSimulationData().result_data.total, undefined);
sandbox.downloadReportPDF();
assert.match(el('pdf-status').textContent, /Aucun rapport chiffré/);
el('sel-type').value = 'tourisme';
sandbox.onTypeChange();
assert.equal(el('new-vehicle-notice').hidden, true);
assert.equal(sandbox.window.ADTL_SIMULATION_READY, true);

// Syntaxe de tous les scripts inline, y compris les parcours non modifiés.
assert(html.includes('id="res-bfu">100 000 XOF'));
assert(html.includes('id="res-prestation">100 000 XOF'));
assert(html.includes('id="sel-valuation-source"'));
assert(html.includes('${fmt(FRAIS_BFU_GUCE_PAC)}'), 'L’export HTML doit reprendre la provision du calcul.');
assert(html.includes('${fmt(FRAIS_PRESTATIONS_ADTL)}'));
assert(html.includes("row('Provision BFU / GUCE / PAC', fmt(FRAIS_BFU_GUCE_PAC))"), 'Le PDF doit reprendre la même provision.');
assert(html.includes("row('Prestation AD TRANS LOGISTICS', fmt(FRAIS_PRESTATIONS_ADTL))"));
assert(!html.includes('34 668 XOF'));
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
  const openTag = match[0].slice(0, match[0].indexOf('>'));
  if (/application\/ld\+json/i.test(openTag) || /\bsrc=/i.test(openTag)) continue;
  new Function(match[1]);
}

let realCatalogue = null;
const dataPath = path.join(root, 'data', 'argus4616-catalogue.json');
if (fs.existsSync(dataPath)) {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const catalogue = createStore(data);
  assert.equal(catalogue.records.length, data.meta.totalRows);
  const expectedAudi = catalogue.records.find(row => row.brand === 'AUDI' && row.year === 2016 && /S3.*Berline/i.test(row.model + ' ' + row.version) && row.priceEur === 15600 && row.status === 'verified');
  assert(expectedAudi, 'L’override Audi S3 Berline 2016 contrôlé doit être présent.');
  assert(catalogue.select(expectedAudi.id), 'La ligne Audi contrôlée doit être sélectionnable.');
  assert.equal(catalogue.valuation(expectedAudi.brand, expectedAudi.model, 2016).cote, 15600);
  for (const row of catalogue.records.filter(row => !row.usable)) assert.equal(catalogue.select(row.id), null);
  realCatalogue = { rows: catalogue.records.length, selectable: catalogue.records.filter(canUse).length, blocked: catalogue.records.filter(row => !canUse(row)).length };
}
console.log(JSON.stringify({ ok: true, totalWithTgc, totalWithoutTgc, caf, tests: 'recherche, blocage OCR, priorité, invalidation, CV/utilitaire, calculs réels, AVD sans double fret, FOB/EUR/XOF, neuf sans total ni export, repli historique, syntaxe', realCatalogue }, null, 2));
