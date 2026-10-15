(function () {
  'use strict';
  const el = id => document.getElementById(id);
  const text = id => el(id).value.trim();
  const selectedLabel = id => el(id).selectedOptions[0]?.textContent.trim() || '';
  const numberText = id => text(id) ? Number(text(id)).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') : '';
  const newRequired = ['new-brand', 'new-model', 'inp-annee', 'new-energy', 'inp-transaction-value', 'sel-origine'];
  const optionalNumbers = ['new-engine-capacity', 'new-electric-power', 'new-seats'];

  function needsVehicleReview() {
    if (window.isNewVehicle() || window.ADTLLegacyPaidTransaction) return false;
    if (!text('sel-marque') || !text('sel-modele') || !text('inp-annee') || !el('inp-annee').checkValidity()) return false;
    const valuation = window.getValuation(text('sel-marque'), text('sel-modele'), Number(text('inp-annee')));
    return !valuation || valuation.mode === 'transaction';
  }

  function updateNewEngineFields() {
    const electric = text('new-energy') === 'electrique';
    el('new-engine-capacity').disabled = electric;
    if (electric) el('new-engine-capacity').value = '';
  }

  function updateVehicleJourney() {
    const isNew = window.isNewVehicle();
    document.querySelectorAll('[data-vehicle-new]').forEach(node => { node.hidden = !isNew; });
    document.querySelectorAll('[data-vehicle-used]').forEach(node => { node.hidden = isNew; });
    el('new-vehicle-notice').hidden = !isNew;
    window.updateTransactionControl();
    const review = needsVehicleReview();
    el('vehicle-continue-label').textContent = isNew ? 'Préparer ma demande d’étude'
      : review ? 'Demander une vérification' : 'Payer 500 F CFA et lancer la simulation';
    el('vehicle-journey-hint').textContent = isNew
      ? 'Vos caractéristiques, votre prix d’achat et vos coordonnées seront repris dans la demande d’étude. Vérifiez-les avant l’envoi.'
      : review ? 'La référence de ce véhicule doit être vérifiée par notre équipe. Aucun prix d’achat à saisir et aucun paiement de simulation à cette étape.'
      : window.ADTLLegacyPaidTransaction ? 'Les paramètres de votre simulation déjà payée ont été restaurés. Votre rapport est disponible ci-dessous.'
      : 'La valeur de référence est déterminée automatiquement à partir de votre véhicule. Aucun prix d’achat à saisir.';
    if (review) el('res-empty-message').textContent = 'Une vérification est nécessaire pour ce véhicule. Transmettez ses informations avec le bouton ci-contre.';
    if (isNew) {
      el('fret-hint').textContent = 'Cette origine sera reprise dans votre demande d’étude.';
      el('res-empty-message').textContent = 'Complétez les caractéristiques et le prix d’achat pour préparer votre demande d’étude.';
    }
    el('inp-annee').placeholder = isNew ? 'Ex. 2026' : 'Ex. 2015';
    window.ADTLSimulatorPayment?.refreshButtons();
  }

  function setVehicleCondition(value, options) {
    const condition = value === 'neuf' ? 'neuf' : 'occasion';
    el('vehicle-condition').value = condition;
    el('condition-neuf').checked = condition === 'neuf';
    el('condition-occasion').checked = condition === 'occasion';
    window.ADTLLegacyPaidTransaction = false;
    el('sel-valuation-source').value = 'reference';
    el('sel-transaction-basis').value = 'fob';
    el('inp-transaction-value').value = '';
    el('calc-feedback').textContent = '';
    document.querySelectorAll('.input-error').forEach(node => { node.classList.remove('input-error'); node.removeAttribute('aria-invalid'); });
    if (!options?.restoring) {
      window.updateTgcControl();
      window.onOrigineChange();
      window.calculate();
    }
    updateVehicleJourney();
  }

  function continueVehicleStudy() {
    const isNew=window.isNewVehicle();
    const fields=isNew?newRequired.concat(optionalNumbers.filter(id=>!el(id).disabled&&text(id))):['sel-marque','sel-modele','inp-annee','sel-origine'];
    fields.forEach(id=>{el(id).classList.remove('input-error');el(id).removeAttribute('aria-invalid');});
    const invalid=fields.find(id=>!text(id)||!el(id).checkValidity());
    if(invalid){el(invalid).classList.add('input-error');el(invalid).setAttribute('aria-invalid','true');el(invalid).focus();el('calc-feedback').textContent='Complétez les caractéristiques du véhicule avant de continuer.';return;}
    if(el('sim-checkout').hidden){
      el('sim-checkout').hidden=false;
      el('sim-checkout-title').textContent='Vos coordonnées pour l’étude';
      el('sim-checkout-summary').textContent='Aucun paiement à cette étape. Vos informations seront reprises dans une demande à vérifier avant envoi.';
      document.querySelector('#sim-checkout > p:nth-of-type(2)').hidden=true;
      el('sim-pay-confirm').textContent='Préparer ma demande d’étude';
      el('sim-checkout-title').focus();window.ADTLFlow?.step(2);return;
    }
    if(!window.ADTLClientContact?.validate(true))return;
    const condition = isNew ? 'neuf' : 'occasion';
    const draft = {
      version: 1, createdAt: Date.now(), condition,
      customer: window.ADTLClientContact.get(),
      brand: text(isNew ? 'new-brand' : 'sel-marque'), model: text(isNew ? 'new-model' : 'sel-modele'),
      year: numberText('inp-annee'), vehicleType: selectedLabel('sel-type'),
      energy: isNew ? selectedLabel('new-energy') : '',
      engineCapacity: isNew && !el('new-engine-capacity').disabled ? numberText('new-engine-capacity') : '',
      electricPower: isNew ? numberText('new-electric-power') : '', seats: isNew ? numberText('new-seats') : '',
      purchasePrice: isNew ? numberText('inp-transaction-value') : '', currency: isNew ? text('sel-transaction-currency') : '',
      origin: selectedLabel('sel-origine'), destination: selectedLabel('sel-destination'),
      reason: isNew ? 'Étude du dédouanement d’un véhicule neuf.' : 'Vérification de la référence d’un véhicule d’occasion.'
    };
    try {
      sessionStorage.setItem('adtl_vehicle_request_v1', JSON.stringify(draft));
    } catch (_) {
      el('calc-feedback').textContent = 'Le navigateur ne permet pas de conserver ces informations. Autorisez le stockage pour ce site puis réessayez, ou utilisez la page Demande de service.';
      return;
    }
    window.location.assign('/demande?service=vehicule-' + condition + '&from=simulateur');
  }

  Object.assign(window, { setVehicleCondition, updateVehicleJourney, updateNewEngineFields, needsVehicleReview, continueVehicleStudy });
  if (new URLSearchParams(window.location.search).get('condition') === 'neuf') setVehicleCondition('neuf');
  else updateVehicleJourney();
})();
