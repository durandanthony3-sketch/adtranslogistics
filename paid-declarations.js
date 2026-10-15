/* Rapprochement indicatif avec des agrégats anonymisés de déclarations payées. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    const start = function () {
      root.ADTLPaidDeclarations = api.mount(root);
      if (root.ADTL_LAST_OBSERVATION_CONTEXT) root.ADTLPaidDeclarations.render(root.ADTL_LAST_OBSERVATION_CONTEXT);
    };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function key(value) {
    return String(value == null ? '' : value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function validContext(context) {
    return !!context && !!key(context.brand) && !!key(context.model) && Number.isInteger(Number(context.year))
      && Number(context.year) >= 1970 && Number.isFinite(context.caf) && Number.isFinite(context.totalDouane);
  }
  function validRecord(row) {
    return !!row && !!key(row.brand) && !!key(row.model) && Number.isInteger(Number(row.year))
      && Number.isInteger(Number(row.declYear)) && Number.isInteger(row.n) && row.n > 0
      && ['cafMedian', 'cafMin', 'cafMax', 'dutyMedian', 'dutyMin', 'dutyMax'].every(function (field) { return Number.isFinite(row[field]) && row[field] >= 0; })
      && row.cafMin <= row.cafMedian && row.cafMedian <= row.cafMax
      && row.dutyMin <= row.dutyMedian && row.dutyMedian <= row.dutyMax;
  }
  function createStore(data) {
    if (!data || !Array.isArray(data.records)) throw new Error('Historique indisponible');
    const records = data.records.filter(validRecord).map(function (record) {
      // Seuls des champs agrégés sont conservés dans le composant d'affichage.
      const row = {};
      ['brand', 'model', 'year', 'declYear', 'category', 'n', 'cafMedian', 'cafMin', 'cafMax', 'dutyMedian', 'dutyMin', 'dutyMax', 'firstDate', 'lastDate', 'formulaFits', 'receiptCount'].forEach(function (field) { row[field] = record[field]; });
      return Object.freeze(row);
    });
    const index = new Map();
    const vehicleKey = function (value) { return key(value.brand) + '|' + key(value.model) + '|' + Number(value.year); };
    records.forEach(function (record) {
      const id = vehicleKey(record);
      if (!index.has(id)) index.set(id, []);
      index.get(id).push(record);
    });
    return {
      meta: { source: String(data.meta && data.meta.source || 'Déclarations payées'), sourcePeriod: String(data.meta && data.meta.sourcePeriod || '') },
      find: function (context) {
        if (!validContext(context) || context.isReexport) return null;
        const candidates = (index.get(vehicleKey(context)) || []).filter(function (record) {
          return !context.category || key(record.category) === key(context.category);
        });
        if (!candidates.length) return null;
        // Aucun mélange de catégories si un appel ne précise pas la catégorie.
        if (!context.category && new Set(candidates.map(function (row) { return key(row.category); })).size > 1) return null;
        const latestYear = Math.max.apply(null, candidates.map(function (row) { return Number(row.declYear); }));
        const latest = candidates.filter(function (row) { return Number(row.declYear) === latestYear; });
        // Des agrégats dupliqués ne peuvent pas être fusionnés en recalculant une médiane.
        if (latest.length !== 1) return null;
        const record = latest[0];
        return { record: record, dutyDifference: Math.round(context.totalDouane - record.dutyMedian), cafDifference: Math.round(context.caf - record.cafMedian) };
      }
    };
  }
  function mount(win) {
    const doc = win.document;
    const box = doc.getElementById('paid-declarations');
    const body = doc.getElementById('paid-declarations-content');
    if (!box || !body) return { render: function () {} };
    let latestContext = null;
    let dataPromise = null;
    let store = null;
    let failed = false;
    const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
    const dates = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
    const money = function (value) { return number.format(value) + ' FCFA'; };
    function dateLabel(value) {
      if (!value) return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? '' : dates.format(date);
    }
    function element(tag, className, text) {
      const node = doc.createElement(tag);
      if (className) node.className = className;
      if (text != null) node.textContent = text;
      return node;
    }
    function note(text) { body.replaceChildren(element('p', 'paid-declarations-note', text)); }
    function draw() {
      if (!latestContext) { body.replaceChildren(); box.hidden = true; return; }
      box.hidden = false;
      if (latestContext.isReexport) { note('Pas de donnée comparable pour ce régime de réexportation.'); return; }
      if (failed) { note('L’historique n’est pas disponible pour le moment. Le calcul courant reste inchangé.'); return; }
      if (!store) { note('Chargement de l’historique des déclarations payées…'); return; }
      const match = store.find(latestContext);
      if (!match) { note('Pas de donnée comparable pour cette marque, ce modèle, cette année et cette catégorie.'); return; }
      body.replaceChildren();
      const row = match.record;
      const observedDates = [dateLabel(row.firstDate), dateLabel(row.lastDate)].filter(Boolean);
      body.appendChild(element('p', 'paid-declarations-intro', number.format(row.n) + ' observation' + (row.n > 1 ? 's' : '') + ' issue' + (row.n > 1 ? 's' : '') + ' de déclarations payées · exercice ' + row.declYear + ' · catégorie ' + (row.category || 'non renseignée') + ' du modèle de calcul'));
      if (observedDates.length) body.appendChild(element('p', 'paid-declarations-note', observedDates.join(' au ')));
      const grid = element('dl', 'paid-declarations-grid');
      function item(label, value, range) {
        const cell = element('div', 'paid-declarations-cell');
        cell.appendChild(element('dt', '', label));
        cell.appendChild(element('dd', '', value));
        if (range) cell.appendChild(element('span', 'paid-declarations-range', range));
        grid.appendChild(cell);
      }
      item('CAF historique médiane', money(row.cafMedian), 'De ' + money(row.cafMin) + ' à ' + money(row.cafMax));
      item('Droits payés médians', money(row.dutyMedian), 'De ' + money(row.dutyMin) + ' à ' + money(row.dutyMax));
      const direction = match.dutyDifference === 0 ? 'identique à la médiane' : match.dutyDifference > 0 ? 'au-dessus de la médiane' : 'en dessous de la médiane';
      item('Écart des droits estimés', money(Math.abs(match.dutyDifference)), direction);
      body.appendChild(grid);
      body.appendChild(element('p', 'paid-declarations-note', 'Source : ' + store.meta.source + (store.meta.sourcePeriod ? ' · ' + store.meta.sourcePeriod : '') + '. Rapprochement sur la marque, le modèle, l’année et la catégorie de calcul, sans garantie de version identique. Droits historiques hors prestations. Les paiements passés ne fixent ni un taux officiel ni le montant du prochain dédouanement.'));
    }
    function load() {
      if (dataPromise) return dataPromise;
      dataPromise = Promise.resolve().then(function () { return win.fetch('/data/observations-douane.json'); }).then(function (response) {
        if (!response.ok) throw new Error('Historique indisponible');
        return response.json();
      }).then(function (data) { store = createStore(data); }).catch(function () { failed = true; }).then(draw);
      return dataPromise;
    }
    return {
      render: function (context) {
        latestContext = validContext(context) ? Object.assign({}, context) : null;
        draw();
        if (latestContext && !latestContext.isReexport) return load();
        return Promise.resolve();
      }
    };
  }
  return { key: key, createStore: createStore, validContext: validContext, mount: mount };
});
