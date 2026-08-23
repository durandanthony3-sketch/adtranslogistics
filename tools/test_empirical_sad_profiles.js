const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'simulateur.html'), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function calculate(cote, category, observedCaf) {
  const caf = observedCaf || Math.round(cote * 655.96) + 600000;
  const assiette = caf * 0.70;
  const base = assiette * 1.23;
  const dd = Math.round(assiette * 0.20);
  const community = Math.round(assiette * 0.03);
  const vat = Math.round(base * 0.18);
  const excise = category === 'A' ? Math.round(base * 0.10) : 0;
  const duties = dd + community + vat + excise + 98600;
  return { caf, duties, allIn: duties + 189668 };
}

assert(html.includes("id: 'sad-o121r'"), 'Profil prudent O121R absent');
assert(html.includes("id: 'sad-6300'"), 'Profil fréquent 6 300 € absent');
assert(html.includes('id="sel-tax-category"'), 'Sélecteur explicite de catégorie fiscale absent');
assert(html.includes('Référence SAD observée — à vérifier'), 'Statut de vérification SAD absent');
assert(!html.includes('Référence ADTL confirmée'), 'Le statut trompeur « confirmé » est encore présent');
assert(html.includes("id: 'rav4-2012-observed'"), 'Profil RAV4 2012 absent');
assert(html.includes("id: 'rav4-2013-observed'"), 'Profil RAV4 2013 absent');
assert(html.includes("id: 'rav4-2014-high'") && html.includes("id: 'rav4-2014-low'"), 'Profils RAV4 2014 incomplets');
assert(html.includes("id: 'rav4-2015-high'") && html.includes("id: 'rav4-2015-low'"), 'Profils RAV4 2015 incomplets');
assert(html.includes('const FRAIS_ANNEXES = FRAIS_GUCE_PAC + FRAIS_EMISSION_DECLARATION + FRAIS_LIQUIDATION + FRAIS_INTERPOL + FRAIS_ENLEVEMENT + FRAIS_PLAQUE; // 189 668'), 'Total des frais complémentaires incorrect');

const high = calculate(7675, 'A', 5634496);
const lowA = calculate(6300, 'A', 4732549);
const lowB = calculate(6300, 'B', 4732549);
assert(high.duties === 2364117 && high.allIn === 2553785, 'Le profil O121R ne reproduit pas la déclaration');
assert(lowA.duties === 2001463, 'Le profil 6 300 € catégorie A est incorrect');
assert(lowB.duties === 1593991 && lowB.allIn === 1783659, 'Le profil client 6 300 € catégorie B est incorrect');

const rav4Observed = {
  2012: { duties: 1483652, total: 1673320 },
  2013: { duties: 2410275, total: 2599943 },
  2014: { duties: 2865239, total: 3054907 },
  2015: { duties: 3702641, total: 3892309 }
};
for (const [year, values] of Object.entries(rav4Observed)) {
  assert(values.total === values.duties + 189668, `Total RAV4 ${year} incorrect`);
  assert(html.includes(`officialTaxes: ${values.duties}`), `Liquidation RAV4 ${year} absente du simulateur`);
}

console.log(JSON.stringify({ ok: true, high, lowA, lowB, rav4Observed }, null, 2));
