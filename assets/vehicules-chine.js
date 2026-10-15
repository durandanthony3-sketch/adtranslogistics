(function () {
  'use strict';
  const DATA_URL = '/assets/data/youxinpai-selection-20260924.json?v=galeries18';
  const byId = id => document.getElementById(id);
  const grid = byId('china-grid');
  const search = byId('china-search');
  const brand = byId('china-brand');
  const fuel = byId('china-fuel');
  const count = byId('china-count');
  const empty = byId('china-empty');
  const error = byId('china-error');
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const clean = (value, limit = 250) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, limit) : '';
  let vehicles = [];
  let selectionDate = '24 septembre 2026';
  let loading = false;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function officialUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'youxinpai.cn' || url.hostname.endsWith('.youxinpai.cn')) && !url.username && !url.password ? url.href : null;
    } catch (_) { return null; }
  }

  function dateText(value, fallback = 'À confirmer') {
    const raw = clean(value, 40).replace(/\./g, '-');
    if (!/^\d{4}-\d{2}(?:-\d{2})?(?:T.*)?$/.test(raw)) return fallback;
    const date = new Date(raw.length === 7 ? raw + '-01T12:00:00Z' : raw);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('fr-FR', { timeZone: 'UTC', year: 'numeric', month: 'long', ...(raw.length === 7 ? {} : { day: 'numeric' }) });
  }

  function imageFallback(image, container, label) {
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      image.hidden = true;
      const message = element('p', 'china-image-fallback', 'Photo indisponible pour ' + label + '. Consultez l’annonce source ou demandez les photos à ADTL.');
      container.appendChild(message);
    };
    image.addEventListener('error', show, { once: true });
    if (image.complete && image.naturalWidth === 0) show();
  }

  function specification(list, label, value) {
    const item = element('div');
    item.append(element('dt', '', label), element('dd', '', value));
    list.appendChild(item);
  }

  function gallery(vehicle) {
    const media = element('div', 'china-card-media china-gallery');
    if (!vehicle.gallery.length) {
      media.appendChild(element('p', 'china-image-fallback', 'Photos à consulter dans l’annonce source.'));
      return media;
    }
    const viewport = element('div', 'china-gallery-viewport');
    viewport.id = 'china-gallery-' + vehicle.id;
    const slides = vehicle.gallery.map((source, index) => {
      const slide = element('div', 'china-gallery-slide');
      slide.hidden = index !== 0;
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt = vehicle.title + ' — photo ' + (index + 1) + ' sur ' + vehicle.gallery.length + ' de l’annonce Youxinpai ' + vehicle.id;
      image.width = 640;
      image.height = 480;
      image.draggable = false;
      slide.appendChild(image);
      viewport.appendChild(slide);
      return { slide, image, source, loaded: false };
    });
    const counter = element('span', 'china-gallery-count');
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-atomic', 'true');
    let current = 0;
    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((entry, position) => { entry.slide.hidden = position !== current; });
      const selected = slides[current];
      if (!selected.loaded) {
        selected.loaded = true;
        selected.image.src = selected.source;
        imageFallback(selected.image, selected.slide, vehicle.title + ' (photo ' + (current + 1) + ')');
      }
      counter.textContent = 'Photo ' + (current + 1) + ' / ' + slides.length;
    }
    media.append(viewport, counter);
    if (slides.length > 1) {
      media.tabIndex = 0;
      media.setAttribute('role', 'group');
      media.setAttribute('aria-label', 'Photos de ' + vehicle.title + '. Utilisez les flèches gauche et droite pour changer de photo.');
      const previous = element('button', 'china-gallery-arrow china-gallery-arrow--previous', '‹');
      const next = element('button', 'china-gallery-arrow china-gallery-arrow--next', '›');
      [[previous, 'Photo précédente de '], [next, 'Photo suivante de ']].forEach(([button, label]) => {
        button.type = 'button';
        button.setAttribute('aria-label', label + vehicle.title);
        button.setAttribute('aria-controls', viewport.id);
      });
      previous.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      media.append(previous, next);
      media.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        show(current + (event.key === 'ArrowLeft' ? -1 : 1));
      });
      let touchStart = null;
      media.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch' || event.target.closest('button')) return;
        touchStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      });
      media.addEventListener('pointerup', event => {
        const start = touchStart;
        touchStart = null;
        if (!start || event.pointerId !== start.id) return;
        const horizontal = event.clientX - start.x;
        const vertical = event.clientY - start.y;
        if (Math.abs(horizontal) >= 45 && Math.abs(horizontal) > Math.abs(vertical) * 1.2) {
          show(current + (horizontal < 0 ? 1 : -1));
        }
      });
      media.addEventListener('pointercancel', () => { touchStart = null; });
    }
    show(0);
    return media;
  }

  function card(vehicle) {
    const article = element('article', 'china-card');
    const media = gallery(vehicle);
    const body = element('div', 'china-card-body');
    body.append(element('p', 'china-card-kicker', vehicle.brand || 'Marque à confirmer'), element('h3', '', vehicle.title));
    if (vehicle.conditionNote) body.appendChild(element('p', 'china-condition-note', 'État signalé : ' + vehicle.conditionNote));
    const specs = element('dl', 'china-specs');
    specification(specs, 'Date annoncée', dateText(vehicle.registrationDate));
    specification(specs, 'Kilométrage annoncé', Number.isFinite(vehicle.mileageKm) && vehicle.mileageKm >= 0 ? new Intl.NumberFormat('fr-FR').format(vehicle.mileageKm) + ' km' : 'À confirmer');
    specification(specs, 'Énergie annoncée', vehicle.fuel || 'À confirmer');
    specification(specs, 'Boîte annoncée', vehicle.transmission || 'À confirmer');
    body.append(specs, element('p', 'china-card-price', 'Prix livré au Bénin sur devis'), element('p', 'china-card-status', 'Disponibilité et état à confirmer avant toute offre.'));
    const actions = element('div', 'china-card-actions');
    const request = element('a', 'china-button', 'Demander ce véhicule à ADTL');
    request.href = '/demande?service=vehicule-chine&vehicle=' + encodeURIComponent(vehicle.id);
    request.setAttribute('aria-label', 'Demander ' + vehicle.title + ' à ADTL');
    const source = element('a', 'china-source-link', 'Source Youxinpai ↗');
    source.href = vehicle.sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.setAttribute('aria-label', 'Consulter Youxinpai, source de la référence ' + vehicle.id + ', nouvel onglet');
    actions.append(request, source);
    body.append(actions, element('p', 'china-card-reference', 'Source : Youxinpai · Réf. ' + vehicle.id + '\nAnnonce relevée le ' + selectionDate));
    article.append(media, body);
    return article;
  }

  function render() {
    const words = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    const matches = vehicles.filter(vehicle => {
      const text = normalize([vehicle.id, vehicle.title, vehicle.brand, vehicle.fuel, vehicle.transmission, vehicle.category, vehicle.sourceTitle].join(' '));
      return (!brand.value || normalize(vehicle.brand) === brand.value) && (!fuel.value || normalize(vehicle.fuel) === fuel.value) && words.every(word => text.includes(word));
    });
    grid.replaceChildren(...matches.map(card));
    count.textContent = matches.length + ' véhicule' + (matches.length > 1 ? 's' : '') + ' dans cette sélection' + (matches.length !== vehicles.length ? ' sur ' + vehicles.length : '');
    empty.hidden = matches.length > 0;
    error.hidden = true;
  }

  function options(select, field, label) {
    select.replaceChildren();
    const all = element('option', '', label);
    all.value = '';
    select.appendChild(all);
    const values = new Map();
    vehicles.forEach(vehicle => { if (vehicle[field]) values.set(normalize(vehicle[field]), vehicle[field]); });
    [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], 'fr')).forEach(([key, title]) => {
      const option = element('option', '', title);
      option.value = key;
      select.appendChild(option);
    });
  }

  function resetFilters() {
    search.value = '';
    brand.value = '';
    fuel.value = '';
    render();
    search.focus();
  }

  async function load() {
    if (loading) return;
    loading = true;
    error.hidden = true;
    empty.hidden = true;
    count.textContent = 'Chargement de la sélection…';
    byId('china-retry').disabled = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(DATA_URL, { signal: controller.signal });
      if (!response.ok) throw new Error('Catalogue indisponible');
      const data = await response.json();
      if (!data || !Array.isArray(data.vehicles)) throw new Error('Catalogue invalide');
      selectionDate = dateText(data.verifiedAt, '24 septembre 2026');
      const seen = new Set();
      vehicles = data.vehicles.flatMap(raw => {
        if (!raw || typeof raw !== 'object') return [];
        const id = String(raw.id ?? '');
        const sourceUrl = officialUrl(raw.sourceUrl);
        const model = clean(raw.title);
        const vehicleBrand = clean(raw.brand, 80);
        const title = [vehicleBrand, model].filter(Boolean).join(' ');
        if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || seen.has(id) || !sourceUrl || !model) return [];
        seen.add(id);
        const photoPattern = new RegExp('^/assets/youxinpai/' + id + '-[1-4]\\.(?:webp|jpe?g)$');
        const localImage = value => {
          const path = clean(value, 180);
          return photoPattern.test(path) ? path : null;
        };
        const image = localImage(raw.image);
        const photos = [...new Set((Array.isArray(raw.gallery) ? raw.gallery : []).map(localImage).filter(Boolean))].slice(0, 4);
        if (!photos.length && image) photos.push(image);
        return [{ id, title, sourceUrl, brand: vehicleBrand, fuel: clean(raw.fuel, 80), transmission: clean(raw.transmission, 80), category: clean(raw.category, 80), sourceTitle: clean(raw.sourceTitle), registrationDate: clean(raw.registrationDate, 40), mileageKm: typeof raw.mileageKm === 'number' ? raw.mileageKm : null, image: photos[0] || null, gallery: photos, conditionNote: clean(raw.conditionNote, 450) }];
      });
      if (data.vehicles.length && !vehicles.length) throw new Error('Catalogue invalide');
      byId('china-selection-date').textContent = 'Sélection du ' + selectionDate;
      options(brand, 'brand', 'Toutes les marques');
      options(fuel, 'fuel', 'Toutes les énergies');
      [search, brand, fuel, byId('china-reset')].forEach(control => { control.disabled = false; });
      render();
    } catch (_) {
      grid.replaceChildren();
      count.textContent = 'Sélection temporairement indisponible';
      error.hidden = false;
    } finally {
      clearTimeout(timer);
      loading = false;
      byId('china-retry').disabled = false;
    }
  }

  function closeMobile() {
    byId('mobileMenu').classList.remove('flex');
    byId('mob-overlay').classList.remove('visible');
    byId('hamburger').setAttribute('aria-expanded', 'false');
    byId('mobileMenu').inert = true;
  }
  window.closeMobile = closeMobile;
  const mobile = byId('mobileMenu');
  mobile.inert = true;
  byId('hamburger').setAttribute('aria-controls', 'mobileMenu');
  byId('hamburger').setAttribute('aria-expanded', 'false');
  byId('hamburger').addEventListener('click', () => {
    if (mobile.classList.contains('flex')) closeMobile();
    else {
      mobile.classList.add('flex');
      mobile.inert = false;
      byId('mob-overlay').classList.add('visible');
      byId('hamburger').setAttribute('aria-expanded', 'true');
    }
  });
  byId('mob-overlay').addEventListener('click', closeMobile);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.classList.contains('flex')) {
      closeMobile();
      byId('hamburger').focus();
    }
  });
  const hero = byId('china-hero-photo');
  imageFallback(hero, hero.parentElement, 'cette sélection');
  search.addEventListener('input', render);
  brand.addEventListener('change', render);
  fuel.addEventListener('change', render);
  byId('china-reset').addEventListener('click', resetFilters);
  byId('china-empty-reset').addEventListener('click', resetFilters);
  byId('china-retry').addEventListener('click', load);
  load();
})();
