'use strict';
// Extraction serveur du modèle de simulation existant, sans modification des barèmes.
// Les données sont des instantanés JSON de fichiers contrôlés du site ; aucun code client
// ni texte fourni par l'utilisateur n'est évalué. Un résultat reste une estimation.
const DATA = require('./simulator-reference-data.json');
const REF_DOUANE = DATA.REF_DOUANE;
const CATALOGUE = require('../data/argus4616-catalogue.json');
const CATALOGUE_BY_ID = new Map(CATALOGUE.records.map(record => [record.id, record]));
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  const MAX_PAGE_SIZE = 20;
  function key(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  }
  function canUse(record) {
    return !!record && record.usable === true && typeof record.priceEur === 'number'
      && Number.isFinite(record.priceEur) && record.priceEur > 0
      && Number.isInteger(record.year) && record.year >= 1970 && record.year <= 2021
      && !!key(record.brand) && !!key(record.model) && !!key(record.version)
      && typeof record.id === 'string' && !!record.id
      && Number.isInteger(record.pdfPage) && record.pdfPage > 0;
  }
  function visuallyVerified(record) {
    return record && (record.visuallyVerified === true || record.status === 'verified' || record.status === 'verified_visual');
  }
  function stateLabel(record) {
    if (!canUse(record)) return 'Lecture à contrôler · sélection bloquée';
    return visuallyVerified(record) ? 'Ligne contrôlée visuellement' : 'Lecture automatique exploitable · version à confirmer sur la page';
  }
  function createStore(data) {
    if (!data || !Array.isArray(data.records)) throw new Error('Catalogue absent ou invalide');
    const ids = new Set();
    const records = data.records.map(function (record) {
      if (!record || typeof record.id !== 'string' || ids.has(record.id)) throw new Error('Identifiant de ligne invalide ou dupliqué');
      ids.add(record.id);
      return Object.freeze(Object.assign({}, record, { warnings: Object.freeze(Array.isArray(record.warnings) ? record.warnings.slice() : []) }));
    });
    const byId = new Map(records.map(function (record) { return [record.id, record]; }));
    const index = records.map(function (record) { return key([record.brand, record.model, record.version, record.energy, record.section].join(' ')); });
    let selected = null;
    return {
      records: records,
      meta: Object.assign({}, data.meta),
      search: function (query, year, page, pageSize) {
        const tokens = key(query).split(' ').filter(Boolean);
        const targetYear = year == null || year === '' ? null : Number(year);
        const matches = records.filter(function (record, i) {
          return (targetYear === null || record.year === targetYear) && tokens.every(function (token) { return index[i].includes(token); });
        });
        const size = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(Number(pageSize) || 8)));
        const pages = Math.max(1, Math.ceil(matches.length / size));
        const current = Math.max(1, Math.min(pages, Math.floor(Number(page) || 1)));
        return { total: matches.length, page: current, pages: pages, records: matches.slice((current - 1) * size, current * size) };
      },
      select: function (id) {
        const record = byId.get(id);
        if (!canUse(record)) return null;
        selected = record;
        return record;
      },
      clear: function () { const hadSelection = !!selected; selected = null; return hadSelection; },
      selected: function () { return selected; },
      valuation: function (brand, model, year) {
        if (!selected) return null;
        if (key(brand) !== key(selected.brand) || key(model) !== key(selected.model) || Number(year) !== selected.year) {
          selected = null;
          return null;
        }
        const record = selected;
        const reliableCv = record.fiscalCvVerified === true && Number.isInteger(record.fiscalCv) && record.fiscalCv > 0;
        return {
          mode: 'cote', src: 'argus_catalogue', cote: record.priceEur, zone: null,
          cat: key(record.section) === 'UTILITAIRE LEGER' ? 'C' : reliableCv ? (record.fiscalCv >= 13 ? 'A' : 'B') : null, n: 1,
          trace: {
            status: visuallyVerified(record) ? 'verified' : 'ocr', relation: 'direct', method: 'variant',
            sourceBrand: record.brand, sourceModel: record.model, sourceYear: record.year,
            baseValue: record.priceEur, retained: record.priceEur, low: record.priceEur, high: record.priceEur, coefficient: 1,
            pages: record.printedPage == null ? [] : [record.printedPage], pdfPages: [record.pdfPage],
            lines: [{ id: record.id, version: record.version, value: record.priceEur, page: record.printedPage, pdfPage: record.pdfPage, status: record.status }],
            note: stateLabel(record) + '. Référence historique du 29 juin 2022 ; valeur douanière et AVD à confirmer. Aucun rapprochement automatique avec un autre véhicule.',
            fiscalCvVerified: reliableCv
          }
        };
      }
    };
  }


const catalogueKey = key;
const TAUX_TYPES = {
  'tourisme':     { cat: 'B', plancherCAF: 1500000, label: 'Tourisme (VP)' },
  'suv':          { cat: 'B', plancherCAF: 1500000, label: 'SUV / 4×4' },
  'utilitaire':   { cat: 'C', plancherCAF: 1500000, label: 'Utilitaire' },
  'luxe':         { cat: 'A', plancherCAF: 1500000, label: 'Tourisme 13 CV fiscaux ou plus' },
  'camion':       { cat: 'C', plancherCAF: 2500000, label: 'Camion' },
  'tracteur':     { cat: 'D', plancherCAF: 2500000, label: 'Tracteur routier' },
  'semi-remorque':{ cat: 'C', plancherCAF: 2500000, label: 'Semi-remorque' },
  'neuf':         { cat: 'B', plancherCAF: 1500000, label: 'Véhicule neuf' },
};
const PENTES   = { A: 0.402080, B: 0.315980, C: 0.233380, D: 0.192080 }; // taux marginal × CAF (contrôle)
const DD_RATES = { A: 0.20, B: 0.20, C: 0.10, D: 0.05 };
const TAXES_FIXES = 98600;        // écotaxe, RI & redevances fixes par déclaration (depuis févr. 2025)
const EUR_XOF = 655.96;  // taux effectif constaté dans le référentiel douanier (parité BCEAO 655,957 arrondie)
const FORFAIT_REEXPORT = 305000;  // forfait EX8 (depuis févr. 2025)
const FRET_TABLE = {
  'europe':  300000,   // Europe → Cotonou
  'usa':     600000,   // Amérique → Cotonou
  'asie':    450000,   // Asie → Cotonou
  'dubai':   450000,   // Moyen-Orient (assimilé Asie)
  'afrique':  50000,   // Intra-Afrique
};

function normalizeArgusKey(value) {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalArgusModelKey(value) {
  const key = normalizeArgusKey(value);
  const aliases = {
    'RAV 4': 'RAV4',
    'RAV44': 'RAV4',
    'RX 350': 'RX',
    'GLC300': 'GLC',
    'BENZ GLC300': 'GLC',
    'GLK 350': 'GLK',
    'ML350': 'ML',
    'ML 350': 'ML',
    '5': 'MAZDA 5',
    'PRADO': 'LAND CRUISER PRADO',
    'COROLLA VERSO': 'VERSO'
  };
  return aliases[key] || key;
}

// ── Accès tolérant à la table Argus générique (repli) ──

// ── Référentiel douanier réel (REF_DOUANE — /referentiel_douane.js) ──
function refBrand(marque) {
  return REF_DOUANE[normalizeArgusKey(marque)] || null;
}
function refModelEntry(marque, modele) {
  const b = refBrand(marque);
  if (!b) return null;
  return b[normalizeArgusKey(modele).replace(/ /g, '')] || null;
}

// Assimilations retenues pour les modèles absents du référentiel nominatif.
// Ordre de priorité : cote exacte du modèle > assimilation documentée > estimation Argus générique.
// Une assimilation n'écrase donc jamais une ligne déjà présente dans REF_DOUANE.
const DOUANE_ASSIMILATIONS = [
  // Assimilations du modèle douanier ADTL 2026
  { fromBrand: 'TOYOTA', fromModel: 'MATRIX',        toBrand: 'TOYOTA',        toModel: 'COROLLA VERSO' },
  { fromBrand: 'TOYOTA', fromModel: 'CAMRY',         toBrand: 'TOYOTA',        toModel: 'AVENSIS' },
  { fromBrand: 'TOYOTA', fromModel: 'HIGHLANDER',    toBrand: 'TOYOTA',        toModel: 'LANDCRUISER' },
  { fromBrand: 'TOYOTA', fromModel: 'AVALON',        toBrand: 'TOYOTA',        toModel: 'RAV4' },
  { fromBrand: 'TOYOTA', fromModel: 'SIENNA',        toBrand: 'TOYOTA',        toModel: 'RAV4' },
  { fromBrand: 'TOYOTA', fromModel: 'VENZA',         toBrand: 'TOYOTA',        toModel: 'RAV4' },
  { fromBrand: 'PONTIAC', fromModel: 'VIBE',         toBrand: 'TOYOTA',        toModel: 'MATRIX' },
  { fromBrand: 'ACURA', fromModel: 'MDX',            toBrand: 'HONDA',         toModel: 'CR V' },
  { fromBrand: 'ACURA', fromModel: 'RDX',            toBrand: 'HONDA',         toModel: 'CR V' },
  { fromBrand: 'ACURA', fromModel: 'TL',             toBrand: 'HONDA',         toModel: 'ACCORD' },
  { fromBrand: 'HONDA', fromModel: 'PILOT',          toBrand: 'HONDA',         toModel: 'CR V' },
  { fromBrand: 'NISSAN', fromModel: 'QASHQAI',       toBrand: 'NISSAN',        toModel: 'X TRAIL' },
  { fromBrand: 'NISSAN', fromModel: 'ROGUE',         toBrand: 'NISSAN',        toModel: 'X TRAIL' },
  { fromBrand: 'MERCEDES BENZ', fromModel: 'GLK 350',toBrand: 'MERCEDES BENZ', toModel: 'ML350' },
  { fromBrand: 'HONDA', fromModel: 'RIDGELINE',      toBrand: 'TOYOTA',        toModel: 'HILUX' },
  { fromBrand: 'VOLKSWAGEN', fromModel: 'JETTA',     toBrand: 'VOLKSWAGEN',    toModel: 'PASSAT' },

  // Variantes de libellé/finition confirmées par les séries empiriques
  { fromBrand: 'BMW', fromModel: 'X3 XDRIVE 28I',           toBrand: 'BMW',         toModel: 'X3' },
  { fromBrand: 'HYUNDAI', fromModel: 'TUCSON SE',           toBrand: 'HYUNDAI',     toModel: 'TUCSON' },
  { fromBrand: 'HYUNDAI', fromModel: 'TUSCON',              toBrand: 'HYUNDAI',     toModel: 'TUCSON' },
  { fromBrand: 'KIA', fromModel: 'SORENTO EX',              toBrand: 'KIA',         toModel: 'SORENTO' },
  { fromBrand: 'KIA', fromModel: 'SPORTAGE MC',             toBrand: 'KIA',         toModel: 'SPORTAGE' },
  { fromBrand: 'LAND ROVER', fromModel: 'LANDROVER EVOQUE', toBrand: 'LAND ROVER',  toModel: 'RANGE ROVER EVOQUE' },
  { fromBrand: 'PONTIAC', fromModel: 'VIBE GT',             toBrand: 'TOYOTA',      toModel: 'MATRIX' },
  { fromBrand: 'TOYOTA', fromModel: 'HIGHLANDER MC',        toBrand: 'TOYOTA',      toModel: 'HIGHLANDER' },
  { fromBrand: 'TOYOTA', fromModel: 'MATRIX BASE',          toBrand: 'TOYOTA',      toModel: 'MATRIX' },
  { fromBrand: 'TOYOTA', fromModel: 'RAV',                  toBrand: 'TOYOTA',      toModel: 'RAV4' },
  { fromBrand: 'TOYOTA', fromModel: 'RAV 4',                toBrand: 'TOYOTA',      toModel: 'RAV4' },
  { fromBrand: 'TOYOTA', fromModel: 'TYPE RAV4',            toBrand: 'TOYOTA',      toModel: 'RAV4' },
  { fromBrand: 'TOYOTA', fromModel: 'RUNNER',               toBrand: 'TOYOTA',      toModel: 'HIGHLANDER' },
  { fromBrand: 'TOYOTA', fromModel: 'YARIS BASE',           toBrand: 'TOYOTA',      toModel: 'YARIS' },
  { fromBrand: 'TOYOTA', fromModel: 'YARIS VERSO',          toBrand: 'TOYOTA',      toModel: 'YARIS' }
];

const DOUANE_ASSIMILATION_BY_KEY = {};
DOUANE_ASSIMILATIONS.forEach(function (a) {
  const key = normalizeArgusKey(a.fromBrand) + '|' + normalizeArgusKey(a.fromModel).replace(/ /g, '');
  DOUANE_ASSIMILATION_BY_KEY[key] = a;
});

function findDouaneAssimilation(marque, modele) {
  const key = normalizeArgusKey(marque) + '|' + normalizeArgusKey(modele).replace(/ /g, '');
  return DOUANE_ASSIMILATION_BY_KEY[key] || null;
}

function recToVal(rec, src) {
  if (rec[0] === 'c') return { mode: 'cote', cote: rec[1], zone: rec[4] || null, cat: rec[2], n: rec[3], src: src };
  if (rec[0] === 'p') return { mode: 'plancher', plancher: rec[1], cat: rec[2], n: rec[3], src: src };
  return { mode: 'caf', caf: rec[1], cat: rec[2], n: rec[3], src: src };
}

// Valorisation depuis une série du référentiel (exacte, interpolée ou millésime antérieur).
function getReferenceValuation(mm, annee) {
  if (mm) {
    const rec = mm.y[String(annee)];
    if (rec) return recToVal(rec, 'ref');
    const cotes = Object.entries(mm.y)
      .filter(function (e) { return e[1][0] === 'c'; })
      .map(function (e) { return { y: +e[0], rec: e[1] }; })
      .sort(function (a, b) { return a.y - b.y; });
    if (cotes.length) {
      let before = null, after = null;
      cotes.forEach(function (c) {
        if (c.y < annee) before = c;
        if (c.y > annee && !after) after = c;
      });
      if (before && after) {
        const t = (annee - before.y) / (after.y - before.y);
        const cote = Math.round(before.rec[1] + t * (after.rec[1] - before.rec[1]));
        const near = (annee - before.y) <= (after.y - annee) ? before.rec : after.rec;
        return { mode: 'cote', cote: cote, zone: near[4] || null, cat: near[2], n: 0, src: 'interp' };
      }
      // Aucune hausse automatique au-delà du dernier millésime documenté :
      // l'Argus 4616 s'arrête à 2021 et ne justifie pas une extrapolation de +8 %/an.
      if (before && !after) return null;
      const near = after;
      const gap = Math.abs(annee - near.y);
      // Barème douanier sous le plus ancien millésime coté : -1 an → 80 %, -2 ans → 60 %, -3 ans et au-delà → 40 %.
      const coef = gap === 1 ? 0.80 : gap === 2 ? 0.60 : 0.40;
      return { mode: 'cote', cote: Math.round(near.rec[1] * coef), zone: near.rec[4] || null, cat: near.rec[2], n: 0, src: 'proche', coefficient: coef, sourceYear: near.y };
    }
    const firstKey = Object.keys(mm.y)[0];
    const anyRec = mm.y[firstKey];
    return { mode: 'plancher', plancher: anyRec[1], cat: anyRec[2], n: 0, src: 'proche' };
  }
  return null;
}

function normalizeTraceKey(value) {
  return normalizeArgusKey(value).replace(/[^A-Z0-9]/g, '');
}

function argusVehicleKey(marque, modele) {
  return normalizeTraceKey(marque) + '|' + normalizeTraceKey(modele);
}

function getArgusLink(marque, modele) {
  return (DATA.ARGUS_4616_LINKS || {})[argusVehicleKey(marque, modele)] || null;
}

function getArgusFamily(marque, modele) {
  const link = getArgusLink(marque, modele);
  if (!link) return null;
  return (DATA.ARGUS_4616_FAMILIES || {})[normalizeTraceKey(link[0]) + '|' + normalizeTraceKey(link[1])] || null;
}

function getExactArgusTrace(marque, modele, annee) {
  return clone((DATA.ARGUS_4616_TRACE || {})[argusVehicleKey(marque, modele) + '|' + String(annee)] || null);
}

// Retourne une cote directement reconstructible depuis une famille de l'Argus 4616.
// Sans version/finition saisie, la moyenne basse/haute reste explicitement indicative.
function getArgusFamilyValuation(marque, modele, annee) {
  const link = getArgusLink(marque, modele);
  const family = getArgusFamily(marque, modele);
  if (!link || !family) return null;
  const years = Object.keys(family.years).map(Number).sort(function (a, b) { return a - b; });
  if (!years.length) return null;
  let sourceYear = annee, coefficient = 1, rec = family.years[String(annee)];
  if (!rec) {
    const firstYear = years[0];
    if (annee >= firstYear) return null;
    const gap = firstYear - annee;
    coefficient = gap === 1 ? 0.80 : gap === 2 ? 0.60 : 0.40;
    sourceYear = firstYear;
    rec = family.years[String(firstYear)];
  }
  const baseValue = rec[2];
  const retained = Math.round(baseValue * coefficient);
  const lines = [{ value: rec[0], id: rec[6], page: rec[3], pdfPage: rec[4], version: rec[8], status: 'VALIDE' }];
  if (rec[7] && rec[7] !== rec[6]) lines.push({ value: rec[1], id: rec[7], page: rec[3], pdfPage: rec[4], version: rec[9], status: 'VALIDE' });
  return {
    mode: 'cote', cote: retained, zone: null, cat: null, n: rec[5] || 0, src: 'argus4616',
    trace: {
      status: 'reference_only', relation: link[2], sourceBrand: family.brand, sourceModel: family.model,
      sourceYear: sourceYear, retained: retained, baseValue: baseValue, coefficient: coefficient,
      method: coefficient < 1 ? 'depreciated_range' : 'midrange', low: rec[0], high: rec[1],
      pages: [rec[3]], pdfPages: [rec[4]], lines: lines, note: link[3]
    }
  };
}

function withArgusTrace(val, marque, modele, annee) {
  if (!val) return null;
  val.trace = getExactArgusTrace(marque, modele, annee);
  if (!val.trace && val.mode === 'cote') {
    const familyValuation = getArgusFamilyValuation(marque, modele, annee);
    if (familyValuation && familyValuation.trace) {
      val.trace = familyValuation.trace;
      val.trace.argusRetained = val.trace.retained;
      val.trace.retained = val.cote;
      val.trace.method = 'reference_range';
      val.trace.note = (val.trace.note ? val.trace.note + ' ' : '') + 'La valeur utilisée provient du référentiel empirique ; la plage Argus sert de pièce de rapprochement.';
    }
  }
  return val;
}

// Valorisation d'un véhicule.
// 2022+ : valeur facture/AVD ; jusqu'à 2021 : référence empirique recoupée avec l'Argus 4616.
function getValuation(input) {
  const { brand: marque, model: modele, year: annee } = input;
  if (input.valuationSource === 'transaction') {
    return { mode: 'transaction', cote: null, zone: null, cat: null, n: 0, src: 'transaction', trace: null, manual: true };
  }
  // La version choisie explicitement prime ; aucun prix familial ne la remplace.
  const catalogueVal = input.catalogueId ? getCatalogueValuation(input) : null;
  if (catalogueVal) return catalogueVal;
  const mm = refModelEntry(marque, modele);

  // L'édition 4616 ne couvre aucun millésime après 2021.
  // La catégorie éventuelle est conservée, mais jamais la cote extrapolée.
  if (annee >= 2022) {
    const rec = mm && mm.y[String(annee)];
    return { mode: 'transaction', cote: null, zone: rec && rec[4] || null, cat: rec && rec[2] || null, n: 0, src: 'transaction', trace: null };
  }

  const exactRec = mm && mm.y[String(annee)];
  if (exactRec) return withArgusTrace(recToVal(exactRec, 'ref'), marque, modele, annee);

  // Si le modèle n'est pas nommé, une équivalence douanière documentée peut fournir une valeur exacte.
  const assimilation = findDouaneAssimilation(marque, modele);
  if (assimilation) {
    const target = refModelEntry(assimilation.toBrand, assimilation.toModel);
    const targetRec = target && target.y[String(annee)];
    if (targetRec) {
      const assimilated = recToVal(targetRec, 'assimilation');
      assimilated.src = 'assimilation';
      assimilated.assimilation = assimilation;
      return withArgusTrace(assimilated, marque, modele, annee);
    }
  }

  // Priorité à une ligne/famille réellement présente dans l'édition 4616.
  const argus = getArgusFamilyValuation(marque, modele, annee);
  if (argus) return argus;

  // Dernier recours documenté : interpolation entre années empiriques ou dépréciation sous la première année.
  const direct = getReferenceValuation(mm, annee);
  if (direct) return withArgusTrace(direct, marque, modele, annee);
  if (assimilation) {
    const target = refModelEntry(assimilation.toBrand, assimilation.toModel);
    const assimilated = getReferenceValuation(target, annee);
    if (assimilated) {
      assimilated.baseSrc = assimilated.src;
      assimilated.src = 'assimilation';
      assimilated.assimilation = assimilation;
      return withArgusTrace(assimilated, marque, modele, annee);
    }
  }

  // Pas de cote générique inventée : l'utilisateur est orienté vers une vérification manuelle.
  return null;
}

const FRAIS_BFU_GUCE_PAC = 100000; // Provision commerciale ; débours réels à confirmer.
const FRAIS_EMISSION_DECLARATION = 10000;
const FRAIS_LIQUIDATION = 10000;
const FRAIS_INTERPOOL = 20000;
const FRAIS_ENLEVEMENT = 75000;
const FRAIS_PLAQUE_CG = 40000;
const FRAIS_ECHANGE_DOCUMENTAIRE = 110000;
const FRAIS_PRESTATIONS_ADTL = 100000;
const ANNEE_ARRIVEE_IMF = 2026;
const IMF_SESUR_2026 = {
  CAT1: { morale: { lourd: 266815, leger: 141815 }, physique: { lourd: 316815, leger: 181815 } },
  CAT2: { morale: { lourd: 166815, leger:  76815 }, physique: { lourd: 216815, leger: 116815 } },
  CAT3: { morale: { lourd: 106815, leger:  46815 }, physique: { lourd: 156815, leger:  86815 } }
};

function getImfCategory(anneeVehicule) {
  const age = Math.max(0, ANNEE_ARRIVEE_IMF - Number(anneeVehicule || ANNEE_ARRIVEE_IMF));
  if (age < 5) return 'CAT1';
  if (age < 10) return 'CAT2';
  return 'CAT3';
}

function getImfVehicleClass(typeVeh) {
  return ['camion', 'tracteur', 'semi-remorque'].includes(typeVeh) ? 'lourd' : 'leger';
}

function getImfSesur(anneeVehicule, typeVeh, contribuable) {
  const categorie = getImfCategory(anneeVehicule);
  const classe = getImfVehicleClass(typeVeh);
  const statut = contribuable === 'morale' ? 'morale' : 'physique';
  return {
    categorie,
    classe,
    statut,
    montant: IMF_SESUR_2026[categorie][statut][classe]
  };
}

function getFraisComplementaires(anneeVehicule, typeVeh, contribuable, isReexport) {
  const imf = getImfSesur(anneeVehicule, typeVeh, contribuable);
  const base = FRAIS_BFU_GUCE_PAC + FRAIS_EMISSION_DECLARATION + FRAIS_LIQUIDATION
    + FRAIS_INTERPOOL + FRAIS_ENLEVEMENT + FRAIS_ECHANGE_DOCUMENTAIRE + FRAIS_PRESTATIONS_ADTL;
  return {
    imf,
    montantImf: isReexport ? 0 : imf.montant,
    total: base + (isReexport ? 0 : FRAIS_PLAQUE_CG + imf.montant)
  };
}


class SimulationInputError extends Error {
  constructor(code, message) { super(message); this.name = 'SimulationInputError'; this.code = code; this.statusCode = 400; }
}
function invalid(code, message) { throw new SimulationInputError(code, message); }
function label(value, field) {
  if (typeof value !== 'string') invalid('INVALID_INPUT', 'Renseignez ' + field + '.');
  const result = value.trim().replace(/\s+/g, ' ');
  if (!result || result.length > 160 || /[\u0000-\u001f<>]/.test(result)) invalid('INVALID_INPUT', 'Le champ ' + field + ' est invalide.');
  return result;
}
function oneOf(value, allowed, field, fallback) {
  const result = value == null ? fallback : value;
  if (!allowed.includes(result)) invalid('INVALID_INPUT', 'Le champ ' + field + ' est invalide.');
  return result;
}
function number(value, field, positive) {
  if (typeof value !== 'number' && typeof value !== 'string') invalid('INVALID_INPUT', 'Le champ ' + field + ' est invalide.');
  const result = Number(value);
  if (!Number.isFinite(result) || (positive ? result <= 0 : result < 0) || result > Number.MAX_SAFE_INTEGER / 1000) invalid('INVALID_INPUT', 'Le champ ' + field + ' est invalide.');
  return result;
}
function normalizeInput(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid('INVALID_INPUT', 'Les informations du véhicule sont requises.');
  const type = oneOf(raw.type, Object.keys(TAUX_TYPES), 'genre de véhicule', 'tourisme');
  if (type === 'neuf') invalid('NEW_VEHICLE_REQUIRES_REVIEW', 'Un véhicule neuf nécessite une étude personnalisée avec facture ou AVD. Aucun paiement de simulation ne sera demandé.');
  const year = number(raw.year, 'année', true);
  if (!Number.isInteger(year) || year < 1970 || year > 2027) invalid('INVALID_YEAR', 'Indiquez une année comprise entre 1970 et 2027.');
  const valuationSource = oneOf(raw.valuationSource, ['reference', 'transaction'], 'source de valeur', 'reference');
  const catalogueId = raw.catalogueId == null || raw.catalogueId === '' ? null : label(raw.catalogueId, 'référence Argus');
  if (catalogueId && valuationSource === 'transaction') invalid('CONFLICTING_VALUATION', 'Choisissez une référence Argus ou une valeur de facture / AVD.');
  if (raw.tgc != null && typeof raw.tgc !== 'boolean') invalid('INVALID_INPUT', 'La puissance fiscale doit être confirmée.');
  const input = {
    brand: label(raw.brand, 'marque'), model: label(raw.model, 'modèle'), year, type,
    taxpayer: oneOf(raw.taxpayer, ['physique', 'morale'], 'statut du contribuable', 'physique'),
    origin: oneOf(raw.origin, Object.keys(FRET_TABLE), 'zone d’achat'),
    destination: oneOf(raw.destination, ['benin', 'reexport'], 'destination', 'benin'),
    tgc: raw.tgc === true,
    freight: raw.freight == null || raw.freight === '' ? null : number(raw.freight, 'fret', false),
    valuationSource, transaction: null, catalogueId
  };
  if (valuationSource === 'transaction' || (year >= 2022 && !catalogueId)) {
    const transaction = raw.transaction;
    if (!transaction || typeof transaction !== 'object' || Array.isArray(transaction)) invalid('TRANSACTION_VALUE_REQUIRED', 'Indiquez un prix d’achat ou une valeur CAF / AVD positive avec sa devise.');
    input.transaction = {
      value: number(transaction.value, 'montant de la facture / AVD', true),
      currency: oneOf(transaction.currency, ['EUR', 'XOF'], 'devise', 'EUR'),
      basis: oneOf(transaction.basis, ['fob', 'caf'], 'base de valeur', 'fob')
    };
  }
  if (catalogueId) {
    const record = CATALOGUE_BY_ID.get(catalogueId);
    if (!canUse(record)) invalid('CATALOGUE_NOT_USABLE', 'Cette lecture Argus doit être contrôlée et ne peut pas être utilisée pour une simulation payante.');
    if (catalogueKey(input.brand) !== catalogueKey(record.brand) || catalogueKey(input.model) !== catalogueKey(record.model) || input.year !== record.year) invalid('CATALOGUE_MISMATCH', 'La référence Argus sélectionnée ne correspond pas à la marque, au modèle et à l’année.');
    input.brand = record.brand;
    input.model = record.model;
  }
  // Seuls ces champs canoniques servent à la commande ; les prix/catégories/totaux
  // éventuellement ajoutés par un client sont ignorés, jamais considérés fiables.
  return input;
}

function getCatalogueValuation(input) {
  const record = CATALOGUE_BY_ID.get(input.catalogueId);
  // Le même helper testé est utilisé des deux côtés, mais la ligne provient ici
  // exclusivement du catalogue serveur. Le magasin est isolé pour chaque appel.
  const store = createStore({ records: [record], meta: CATALOGUE.meta });
  store.select(record.id);
  return store.valuation(input.brand, input.model, input.year);
}

function isTgcEligibleType(typeVeh) { return ['tourisme', 'suv', 'luxe'].includes(typeVeh); }

function compute(raw) {
  const input = normalizeInput(raw);
  const { brand, model, year, type, taxpayer, origin } = input;
  const cfg = TAUX_TYPES[type];
  const val = getValuation(input);
  if (!val) invalid('VALUATION_UNAVAILABLE', 'Aucune cote exploitable pour ce véhicule. Utilisez une facture / AVD ou demandez une vérification AD TRANS LOGISTICS avant paiement.');
  if (val.mode === 'transaction') {
    if (!input.transaction) invalid('TRANSACTION_VALUE_REQUIRED', 'Indiquez une valeur positive de facture ou de CAF / AVD.');
    const transaction = input.transaction;
    const amount = transaction.value;
    val.transaction = {
      amount, currency: transaction.currency, basis: transaction.basis, valid: true,
      eur: transaction.currency === 'XOF' ? amount / EUR_XOF : amount,
      xof: Math.round(transaction.currency === 'XOF' ? amount : amount * EUR_XOF)
    };
    val.cote = val.transaction.eur;
  }
  let cat;
  if (val.cat === 'C' || val.cat === 'D') cat = val.cat;
  else if (type === 'luxe') cat = 'A';
  else if (isTgcEligibleType(type)) cat = input.tgc ? 'A' : 'B';
  else cat = cfg.cat;

  let fob = null, fret = 0, rawCAF = 0;
  const isTransactionCaf = val.mode === 'transaction' && val.transaction.basis === 'caf';
  if (isTransactionCaf) {
    rawCAF = val.transaction.xof;
  } else if (val.mode === 'cote' || val.mode === 'transaction') {
    fob = val.mode === 'transaction' ? val.transaction.xof : Math.round(val.cote * EUR_XOF);
    const effectiveFret = input.freight > 0 ? input.freight : FRET_TABLE[origin] || 0;
    fret = effectiveFret || FRET_TABLE[val.zone] || 0;
    rawCAF = fob + fret;
  } else if (val.mode === 'caf') rawCAF = val.caf;

  const plancher = cfg.plancherCAF;
  const caf = Math.max(plancher, rawCAF);
  const isPlancherApplied = rawCAF < plancher;
  const isReexport = input.destination === 'reexport';
  const assiette = 0.70 * caf;
  const baseTaxes = assiette * (1 + DD_RATES[cat] + 0.03);
  let dd = Math.round(assiette * DD_RATES[cat]);
  let prel = Math.round(assiette * 0.03);
  let tva = Math.round(baseTaxes * 0.18);
  let acc = cat === 'A' ? Math.round(baseTaxes * 0.10) : 0;
  let redevances = TAXES_FIXES;
  const fraisComplementaires = getFraisComplementaires(year, type, taxpayer, isReexport);
  if (isReexport) { dd = FORFAIT_REEXPORT; prel = 0; tva = 0; acc = 0; redevances = 0; }
  const totalDouane = dd + prel + tva + acc + redevances;
  const totalGeneral = totalDouane + fraisComplementaires.total;
  return {
    schemaVersion: 1, engineVersion: 'adtl-2026-09-06', input,
    val: clone(val), cat, caf, rawCAF, fob, fret, assiette, baseTaxes,
    dd, prel, tva, acc, redevances, totalDouane, totalGeneral,
    fraisComplementaires, fraisAnnexesEff: fraisComplementaires.total,
    isReexport, isPlancherApplied, isTransactionCaf, plancher,
    rates: { dd: DD_RATES[cat], prelevements: 0.03, tva: 0.18, accise: cat === 'A' ? 0.10 : 0, assiette: 0.70, eurXof: EUR_XOF },
    fees: {
      bfuGucePac: FRAIS_BFU_GUCE_PAC, emissionDeclaration: FRAIS_EMISSION_DECLARATION,
      liquidation: FRAIS_LIQUIDATION, interpol: FRAIS_INTERPOOL,
      enlevement: FRAIS_ENLEVEMENT, plaqueCarteGrise: isReexport ? 0 : FRAIS_PLAQUE_CG,
      echangeDocumentaire: FRAIS_ECHANGE_DOCUMENTAIRE, prestationAdtl: FRAIS_PRESTATIONS_ADTL,
      imf: fraisComplementaires.montantImf
    }
  };
}

module.exports = { compute, normalizeInput, SimulationInputError };
