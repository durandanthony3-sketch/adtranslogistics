/* Catalogue de lignes de l'Argus 4616. Aucune assimilation ni moyenne implicite. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.ADTLArgusCatalogue = api;
    if (root.document) {
      if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { api.mount(root); });
      else api.mount(root);
    }
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
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

  function mountRestoration(win) {
    let store = null;
    let cataloguePromise = null;
    let revision = 0;
    function loadCatalogue() {
      if (!cataloguePromise) {
        cataloguePromise = Promise.resolve().then(function () {
          return win.fetch('/data/argus4616-catalogue.json');
        }).then(function (response) {
          if (!response.ok) throw new Error('Catalogue indisponible');
          return response.json();
        }).then(function (data) {
          store = createStore(data);
          return store;
        }).catch(function (error) {
          cataloguePromise = null;
          throw error;
        });
      }
      return cataloguePromise;
    }
    win.ADTLSelectedArgus = {
      valuation: function (brand, model, vehicleYear) {
        return store ? store.valuation(brand, model, vehicleYear) : null;
      },
      selectedId: function () { return store && store.selected() ? store.selected().id : null; },
      restore: function (id) {
        const requestedRevision = ++revision;
        if (store) store.clear();
        if (typeof id !== 'string' || !id) return Promise.reject(new Error('Version Argus indisponible'));
        return loadCatalogue().then(function () {
          if (requestedRevision !== revision) throw new Error('Restauration Argus annulée');
          const record = store.records.find(function (row) { return row.id === id; });
          if (!canUse(record)) throw new Error('Version Argus indisponible');
          const brandInput = win.document.getElementById('sel-marque');
          const modelInput = win.document.getElementById('sel-modele');
          const yearInput = win.document.getElementById('inp-annee');
          if (!brandInput || !modelInput || !yearInput ||
              key(brandInput.value) !== key(record.brand) || key(modelInput.value) !== key(record.model)) {
            throw new Error('La référence Argus ne correspond pas au véhicule restauré');
          }
          // restoreInput installs brand/model first; its former year must not invalidate this exact line.
          yearInput.value = record.year;
          store.select(id);
        });
      },
      invalidate: function () { revision += 1; if (store) store.clear(); }
    };
  }

  function mount(win) {
    const doc = win.document;
    const container = doc.getElementById('argus-catalogue');
    if (!container) {
      if (!win.ADTLSelectedArgus) mountRestoration(win);
      return;
    }
    if (container.dataset.mounted) return;
    container.dataset.mounted = 'true';
    const query = doc.getElementById('argus-catalogue-query');
    const year = doc.getElementById('argus-catalogue-year');
    const results = doc.getElementById('argus-catalogue-results');
    const message = doc.getElementById('argus-catalogue-message');
    const selection = doc.getElementById('argus-catalogue-selection');
    const selectionText = doc.getElementById('argus-catalogue-selection-text');
    const previous = doc.getElementById('argus-catalogue-prev');
    const next = doc.getElementById('argus-catalogue-next');
    const pageLabel = doc.getElementById('argus-catalogue-page');
    let store = null;
    let page = 1;
    let cataloguePromise = null;
    const money = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
    function element(tag, className, text) {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text != null) el.textContent = text;
      return el;
    }
    function provenance(record) {
      return 'Argus 4616 · 29 juin 2022 · page PDF ' + record.pdfPage + (record.printedPage == null ? '' : ' / imprimée ' + record.printedPage);
    }
    function description(record) {
      const model = key(record.version).startsWith(key(record.model) + ' ') ? '' : record.model + ' ';
      return record.brand + ' ' + model + record.version + ' · ' + (record.year || 'année à contrôler');
    }
    function renderSelection() {
      const current = store && store.selected();
      selection.hidden = !current;
      const resultNote = doc.getElementById('argus-catalogue-used');
      if (resultNote) {
        resultNote.hidden = !current;
        resultNote.textContent = current ? 'Référence choisie : ' + description(current) + ' — ' + money.format(current.priceEur) + ' €. ' + provenance(current) + '. ' + stateLabel(current) + '. Valeur douanière et AVD à confirmer.' : '';
      }
      if (current) selectionText.textContent = description(current) + ' — ' + money.format(current.priceEur) + ' €. ' + provenance(current) + '. ' + stateLabel(current) + '. Coefficient 1 (même année). Vérifiez la catégorie et la TGC du véhicule avant le calcul.';
    }
    function clearSelection() {
      if (!store) return;
      if (store.clear()) {
        renderSelection();
        render();
        message.textContent = 'Référence retirée : choisissez à nouveau une version exacte pour utiliser le catalogue.';
      }
    }
    function ensureOption(select, value) {
      let option = Array.from(select.options).find(function (item) { return key(item.value) === key(value); });
      if (!option) {
        option = element('option', '', value);
        option.value = value;
        select.appendChild(option);
      }
      select.value = option.value;
    }
    function applyRecord(id) {
      const record = store.records.find(function (row) { return row.id === id; });
      if (!canUse(record)) return;
      const brandInput = doc.getElementById('sel-marque');
      const modelInput = doc.getElementById('sel-modele');
      const valueSource = doc.getElementById('sel-valuation-source');
      if (valueSource) valueSource.value = 'reference';
      ensureOption(brandInput, record.brand);
      win.onMarqueChange();
      ensureOption(modelInput, record.model);
      modelInput.disabled = false;
      doc.getElementById('inp-annee').value = record.year;
      const typeInput = doc.getElementById('sel-type');
      if (key(record.section) === 'UTILITAIRE LEGER') typeInput.value = 'utilitaire';
      else if (key(record.section) === 'TOURISME') typeInput.value = 'tourisme';
      store.select(id);
      renderSelection();
      win.onModeleChange();
      message.textContent = 'Cette version et son année alimentent maintenant la simulation. La valeur de 2022 reste indicative, à confirmer par l’AVD.';
      render();
    }
    function render() {
      if (!store) return;
      const found = store.search(query.value, year.value, page, 8);
      page = found.page;
      results.replaceChildren();
      found.records.forEach(function (record) {
        const li = element('li', 'argus-catalogue-row');
        const detail = element('div', 'argus-catalogue-detail');
        detail.appendChild(element('strong', '', description(record)));
        const price = typeof record.priceEur === 'number' && Number.isFinite(record.priceEur)
          ? money.format(record.priceEur) + ' €' : 'Prix à contrôler';
        detail.appendChild(element('span', 'argus-catalogue-price', price + (record.energy ? ' · énergie ' + record.energy : '') + (record.fiscalCvVerified === true ? ' · ' + record.fiscalCv + ' CV contrôlés' : '')));
        detail.appendChild(element('span', 'argus-catalogue-source', provenance(record)));
        detail.appendChild(element('span', canUse(record) ? 'argus-catalogue-state' : 'argus-catalogue-state blocked', stateLabel(record)));
        if (record.warnings.length) detail.appendChild(element('span', 'argus-catalogue-source', record.warnings.join(' · ')));
        const button = element('button', 'argus-catalogue-choose', 'Utiliser cette version');
        button.type = 'button';
        button.disabled = !canUse(record);
        button.setAttribute('aria-label', 'Utiliser ' + description(record) + ', ' + price);
        if (store.selected() && store.selected().id === record.id) { button.textContent = 'Version sélectionnée'; button.setAttribute('aria-pressed', 'true'); }
        button.addEventListener('click', function () { applyRecord(record.id); });
        li.appendChild(detail);
        li.appendChild(button);
        results.appendChild(li);
      });
      if (!found.total) results.appendChild(element('li', 'argus-catalogue-empty', 'Aucune ligne pour cette recherche. Essayez le modèle seul ou une autre année.'));
      pageLabel.textContent = found.total.toLocaleString('fr-FR') + ' résultats · page ' + found.page + '/' + found.pages;
      previous.disabled = found.page <= 1;
      next.disabled = found.page >= found.pages;
    }
    win.ADTLSelectedArgus = {
      valuation: function (brand, model, vehicleYear) {
        if (!store) return null;
        const value = store.valuation(brand, model, vehicleYear);
        renderSelection();
        return value;
      },
      selectedId: function () { return store && store.selected() ? store.selected().id : null; },
      restore: function (id) {
        return loadCatalogue().then(function () {
          if (!store || !store.records.some(function (r) { return r.id === id && canUse(r); })) throw new Error('Version Argus indisponible');
          applyRecord(id);
        });
      },
      invalidate: clearSelection
    };
    query.addEventListener('input', function () { page = 1; render(); });
    year.addEventListener('change', function () { page = 1; render(); });
    previous.addEventListener('click', function () { page -= 1; render(); });
    next.addEventListener('click', function () { page += 1; render(); });
    doc.getElementById('argus-catalogue-clear').addEventListener('click', function () { clearSelection(); render(); win.onModeleChange(); });
    function loadCatalogue() {
      if (cataloguePromise) return cataloguePromise;
      cataloguePromise = Promise.resolve().then(function () { return win.fetch('/data/argus4616-catalogue.json'); }).then(function (response) {
      if (!response.ok) throw new Error('Catalogue indisponible');
      return response.json();
    }).then(function (data) {
      store = createStore(data);
      const years = Array.from(new Set(store.records.map(function (record) { return record.year; }).filter(Number.isInteger))).sort(function (a, b) { return b - a; });
      years.forEach(function (value) { const option = element('option', '', value); option.value = value; year.appendChild(option); });
      query.disabled = false;
      year.disabled = false;
      const usable = store.records.filter(canUse).length;
      message.textContent = store.records.length.toLocaleString('fr-FR') + ' lignes chargées ; ' + usable.toLocaleString('fr-FR') + ' sélectionnables. Les lectures suspectes restent consultables et ne peuvent pas alimenter un calcul.';
      render();
    }).catch(function () {
      message.textContent = 'Le catalogue ne peut pas être chargé. Réessayez en rechargeant la page ; la saisie habituelle du simulateur reste disponible.';
    });
      return cataloguePromise;
    }
    container.addEventListener('toggle', function () { if (container.open) loadCatalogue(); });
    if (container.open) loadCatalogue();
  }
  return { createStore: createStore, canUse: canUse, key: key, mount: mount };
});
