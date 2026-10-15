(function () {
  'use strict';
  const params = new URLSearchParams(window.location.search);
  const select = document.getElementById('f-service');
  const status = document.getElementById('youxinpai-request-status');
  if (!select || !status || params.get('sent') === '1') return;

  const serviceLabel = 'Véhicules Chine — Youxinpai';
  const fields = ['f-marchandise', 'f-origine', 'f-destination', 'f-details']
    .map(id => document.getElementById(id));
  const edited = new Set();
  fields.forEach(field => {
    if (!field) return;
    field.addEventListener('input', () => edited.add(field.id));
    field.addEventListener('change', () => edited.add(field.id));
  });
  const active = () => select.value === serviceLabel;
  const setEmpty = (id, value) => {
    const field = document.getElementById(id);
    if (field && !edited.has(id) && !field.value.trim()) field.value = value;
  };
  const text = (value, maximum = 200) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maximum) : '';
  const notify = message => {
    if (!active()) return;
    status.textContent = message;
    status.hidden = false;
  };
  function setRoute() {
    if (!active()) { status.hidden = true; return; }
    setEmpty('f-origine', 'Chine');
    setEmpty('f-destination', 'Bénin');
  }
  select.addEventListener('change', setRoute);
  setRoute();

  if (params.get('service') !== 'vehicule-chine' || !active()) return;
  const references = params.getAll('vehicle');
  if (!references.length) {
    notify('Indiquez la marque, le modèle ou le lien Youxinpai souhaité. Nous confirmerons le prix et la disponibilité avant toute commande.');
    return;
  }
  const reference = references[0];
  if (references.length !== 1 || !/^\d{1,20}$/.test(reference)) {
    notify('La référence du véhicule est invalide. Ajoutez le lien de l’annonce ou décrivez le véhicule recherché dans les détails.');
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  fetch('/assets/data/youxinpai-selection-20260924.json?v=galeries18', { signal: controller.signal })
    .then(response => {
      if (!response.ok) throw new Error('selection-unavailable');
      return response.json();
    })
    .then(data => {
      if (!active()) return;
      const vehicle = Array.isArray(data.vehicles)
        ? data.vehicles.find(item => item && String(item.id) === reference) : null;
      if (!vehicle) {
        notify('Cette référence ne figure plus dans notre sélection. Ajoutez le lien de l’annonce ou le modèle recherché : notre équipe vérifiera sa disponibilité.');
        return;
      }
      const title = text(vehicle.title);
      const brand = text(vehicle.brand, 80);
      if (!title) throw new Error('vehicle-title-unavailable');
      const identity = brand && !title.toLocaleLowerCase().startsWith(brand.toLocaleLowerCase())
        ? brand + ' ' + title : title;
      const lines = [
        'Demande d’achat et d’importation depuis la Chine — Youxinpai.',
        'Référence Youxinpai : ' + reference,
        'Véhicule : ' + identity
      ];
      const add = (label, value) => { if (value) lines.push(label + ' : ' + value); };
      add('Marque', brand);
      add('Date annoncée', text(vehicle.registrationDate, 40));
      if (typeof vehicle.mileageKm === 'number' && Number.isFinite(vehicle.mileageKm) && vehicle.mileageKm >= 0) {
        add('Kilométrage annoncé', vehicle.mileageKm.toLocaleString('fr-FR') + ' km');
      }
      add('Énergie annoncée', text(vehicle.fuel, 80));
      add('Transmission annoncée', text(vehicle.transmission, 80));
      add('Catégorie', text(vehicle.category, 80));
      add('Titre original Youxinpai', text(vehicle.sourceTitle, 300));
      const sourceUrl = text(vehicle.sourceUrl, 500);
      try {
        const source = new URL(sourceUrl);
        if (source.protocol === 'https:' && ['youxinpai.cn', 'www.youxinpai.cn'].includes(source.hostname)) {
          add('Source Youxinpai', source.href);
        }
      } catch (_) { /* The client can still describe the requested vehicle. */ }
      add('Sélection vérifiée le', text(data.verifiedAt, 40));
      lines.push('Prix et disponibilité à confirmer.', 'Merci de préciser les frais d’achat, les conditions d’exportation, le fret, le dédouanement et la livraison dans le devis.');
      setEmpty('f-marchandise', identity + ' — Youxinpai ' + reference);
      setEmpty('f-details', lines.join('\n'));
      notify('Référence Youxinpai ' + reference + ' retrouvée. Les champs vides ont été complétés ; vos saisies sont conservées. Vérifiez les informations et ajoutez vos coordonnées avant d’envoyer la demande. Prix et disponibilité à confirmer.');
    })
    .catch(() => {
      notify('Les informations de l’annonce ne peuvent pas être chargées pour le moment. Ajoutez la référence Youxinpai ' + reference + ' ou le lien dans les détails ; notre équipe la vérifiera.');
    })
    .finally(() => clearTimeout(timeout));
})();
