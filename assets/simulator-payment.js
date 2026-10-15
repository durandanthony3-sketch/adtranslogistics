(function () {
  'use strict';
  const PRICE = 500;
  const API = '/api/sim-pay';
  const HISTORY_KEY = 'adtl_vehicle_receipts_v3', ORDERS_KEY = 'adtl_vehicle_orders_v3';
  const flow = window.ADTLFlow;
  const RECEIPT_KEY = 'adtl_simulation_receipt_v2';
  const PENDING_KEY = 'adtl_simulation_pending_v2';
  const fieldIds = ['sel-marque', 'sel-modele', 'inp-annee', 'sel-type', 'sel-contribuable',
    'sel-origine', 'sel-destination', 'chk-tgc', 'inp-fret', 'sel-valuation-source',
    'inp-transaction-value', 'sel-transaction-currency', 'sel-transaction-basis'];
  const el = id => document.getElementById(id);
  let config = null, configPromise = null, widgetPromise = null;
  let busy = false, widgetOpen = false, restoring = false, activeOrder = null;
  let pending = read(PENDING_KEY), receipt = read(RECEIPT_KEY), authorizedResult = null, authorizedFingerprint = null, authorizedCustomer = null;
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function save(key, value) { return flow.save(key, value); }
  function fingerprint(input) {
    if (!input) return '';
    const clean = value => String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
    return JSON.stringify([clean(input.brand), clean(input.model), Number(input.year), input.type,
      input.taxpayer, input.origin, input.destination, !!input.tgc, Number(input.freight), input.valuationSource,
      input.transaction ? [Number(input.transaction.value), input.transaction.currency, input.transaction.basis] : null,
      input.catalogueId || null]);
  }
  function currentInput() { return window.getPaymentInput(); }
  function status(message, recovery) {
    el('sim-payment-status').textContent = message;
    if (recovery) { el('sim-recovery-message').textContent = message; el('sim-recovery').hidden = false; }
  }
  async function request(action, body) { return flow.request(API, action, body); }
  function history() { const list=flow.read(HISTORY_KEY,[]); return Array.isArray(list)?list:[]; }
  function orders() { const list=flow.read(ORDERS_KEY,[]); return Array.isArray(list)?list:[]; }
  function refreshHistory() {
    const select=el('sim-history'), selected=select.value, rows=history(), open=orders();
    select.replaceChildren();
    rows.forEach(r=>{const option=document.createElement('option');option.value='paid:'+r.transactionId;option.textContent=[r.input?.brand,r.input?.model,r.input?.year].filter(Boolean).join(' ')+' — payé — '+r.transactionId;select.appendChild(option);});
    open.forEach(r=>{const option=document.createElement('option');option.value='pending:'+r.orderId;option.textContent=[r.input?.brand,r.input?.model,r.input?.year].filter(Boolean).join(' ')+' — paiement à vérifier';select.appendChild(option);});
    if(Array.from(select.options).some(x=>x.value===selected))select.value=selected;
    el('sim-history-box').hidden=!select.options.length;
    el('sim-returning').hidden=!(select.options.length||pending||receipt);
  }
  async function resumePending(order=pending) {
    if(busy||widgetOpen||!order?.orderToken)return;
    pending=order;save(PENDING_KEY,pending);await restoreInput(order.input);
    window.ADTLClientContact.set(order.customer);prepare(false);refreshButtons();
    if(order.transactionId)return verifyPending();
    status('Commande retrouvée. Si vous avez déjà payé, saisissez votre référence KKiaPay ci-dessous avant toute nouvelle tentative.',true);
    el('sim-recovery').focus();
  }
  function refreshButtons() {
    const enabled = !!config?.enabled && config.amount === PRICE && config.currency === 'XOF' && !!config.publicKey;
    const hasTransaction = !!pending?.transactionId;
    refreshHistory();
    const study = window.isNewVehicle() || window.needsVehicleReview();
    const paid = paidOK();
    el('sim-new-calculation').disabled = busy || widgetOpen;
    el('sim-email-send').disabled = busy || widgetOpen;
    el('sim-history-open').disabled = busy || widgetOpen;
    const button = el('btn-calculate');
    button.disabled = busy || widgetOpen || (!study && !paid && !enabled);
    el('vehicle-continue-label').textContent = busy ? 'Vérification en cours…' : widgetOpen ? 'Paiement ouvert dans KKiaPay…'
      : study ? (window.isNewVehicle() ? 'Préparer ma demande d’étude' : 'Demander une vérification')
      : paid ? 'Voir mon résultat' : hasTransaction ? 'Vérifier mon paiement'
      : !enabled ? 'Paiement temporairement indisponible' : 'Vérifier ma simulation — 500 F CFA';
    el('sticky-unlock').disabled = button.disabled;
    el('sticky-unlock').textContent = hasTransaction ? 'Vérifier mon paiement' : widgetOpen ? 'Paiement ouvert…' : busy ? 'Vérification…' : 'Vérifier ma simulation';
    el('sim-payment-details').hidden = study || paid;
    el('sim-retry').hidden = !hasTransaction;
    el('sim-retry').disabled = busy;
    el('sim-restore').hidden = !receipt?.receiptToken;
    el('sim-restore').disabled = busy || widgetOpen;
    el('sim-recovery').hidden = !(pending?.orderToken || receipt?.receiptToken || history().length || orders().length);
    el('sim-manual-recovery').hidden=!pending?.orderToken;
    el('sim-pay-confirm').disabled=button.disabled;
    el('sim-pay-confirm').textContent=study?'Préparer ma demande d’étude':busy?'Vérification en cours…':widgetOpen?'Paiement ouvert…':hasTransaction?'Vérifier mon paiement':'Payer 500 F CFA et obtenir mon rapport';
  }
  async function loadConfig() {
    if (!configPromise) configPromise = request('config').then(data => {
      config = data;
      status(data.enabled ? ''
        : 'Le paiement est temporairement indisponible. Réessayez plus tard ; aucun calcul payant n’est lancé.');
      refreshButtons();
      return data;
    }).catch(() => {
      config = { enabled: false };
      configPromise = null;
      status('Le paiement est temporairement indisponible. Vérifiez votre connexion puis réessayez plus tard.');
      refreshButtons();
      return config;
    });
    return configPromise;
  }
  function validInput(showErrors) {
    const input = currentInput();
    if (input.type === 'neuf') {
      if (showErrors) el('calc-feedback').textContent = 'Un véhicule neuf nécessite une étude personnalisée avec facture ou AVD.';
      return null;
    }
    const required = ['sel-marque', 'sel-modele', 'inp-annee', 'sel-origine'];
    if (input.valuationSource === 'transaction') required.push('inp-transaction-value');
    required.forEach(id => { el(id).classList.remove('input-error'); el(id).removeAttribute('aria-invalid'); });
    const invalid = required.find(id => !el(id).value || !el(id).checkValidity()) || (el('inp-fret').value && !el('inp-fret').checkValidity() ? 'inp-fret' : null);
    if (invalid) {
      if (showErrors) {
        el(invalid).classList.add('input-error'); el(invalid).setAttribute('aria-invalid', 'true'); el(invalid).focus();
        el('calc-feedback').textContent = 'Complétez les champs obligatoires avec des valeurs valides avant de continuer.';
      }
      return null;
    }
    if (!Number.isFinite(input.freight) || input.freight < 0) {
      if (showErrors) el('calc-feedback').textContent = 'Indiquez un fret valide.';
      return null;
    }
    const valuation = input.valuationSource === 'reference' ? window.getValuation(input.brand, input.model, input.year) : null;
    if (input.valuationSource === 'reference' && (!valuation || valuation.mode === 'transaction')) {
      if (showErrors) el('calc-feedback').textContent = 'Ce véhicule nécessite une vérification. Cliquez sur « Demander une vérification » : aucun prix d’achat à saisir, aucun paiement de simulation à cette étape.';
      return null;
    }
    if (showErrors) el('calc-feedback').textContent = '';
    return input;
  }
  function paidOK() { return !!authorizedResult && authorizedFingerprint === fingerprint(currentInput()); }
  function hidePaid() {
    authorizedResult = null; authorizedFingerprint = null; authorizedCustomer = null;
    window.resetResults();
    el('sim-paid-banner').hidden = true;
    el('sim-report-action').hidden=true;
    el('btn-share-wa').style.display = 'none';
    el('pdf-status').style.display = 'none';
  }
  function inputChanged() {
    if (restoring) return;
    el('sim-checkout').hidden=true;
    flow.step(1);
    if (window.ADTLLegacyPaidTransaction && authorizedFingerprint !== fingerprint(currentInput())) {
      window.ADTLLegacyPaidTransaction = false;
      el('sel-valuation-source').value = 'reference';
      el('inp-transaction-value').value = '';
    }
    if (authorizedResult && !paidOK()) hidePaid();
    if (pending && pending.fingerprint !== fingerprint(currentInput())) {

      if (pending.transactionId) status('Les paramètres ont changé. Vérifiez d’abord votre paiement précédent ; vous pourrez retrouver sa simulation.', true);
    }
    prepare(false);
    window.updateVehicleJourney();
  }
  function newCalculation() {
    if (busy || widgetOpen) return;
    // Keep every recoverable receipt/order before clearing the current selection.
    if (receipt?.receiptToken && !flow.remember(HISTORY_KEY, receipt)) { status('Impossible de conserver votre rapport. Téléchargez-le avant de recommencer.', true); return; }
    if (pending?.orderToken && !flow.remember(ORDERS_KEY, pending)) { status('Impossible de conserver votre commande. Réessayez.', true); return; }
    restoring = true;
    try {
      pending = null; receipt = null; activeOrder = null;
      save(PENDING_KEY, null); save(RECEIPT_KEY, null);
      window.ADTLSelectedArgus?.invalidate();
      fieldIds.concat(['new-brand','new-model','new-energy','new-engine-capacity','new-electric-power','new-seats']).forEach(id => {
        const field=el(id);
        if(field.type==='checkbox') field.checked=field.defaultChecked;
        else if(field.tagName==='SELECT') field.selectedIndex=0;
        else field.value=field.defaultValue;
        field.setCustomValidity(''); field.classList.remove('input-error'); field.removeAttribute('aria-invalid');
      });
      window.setVehicleCondition('occasion', { restoring: true });
      window.onMarqueChange(); window.onOrigineChange();
      window.updateTgcControl(); window.updateNewEngineFields(); window.refreshValuationDisplay();
      window.ADTLClientContact.set({});
      ['sim-email-status','pdf-status','calc-feedback','sim-recovery-message'].forEach(id=>{el(id).textContent='';});
      el('sim-report-email').value='';el('sim-report-email').setCustomValidity('');el('sim-notification-status').hidden=true;
      el('sim-notification-retry').hidden=true;
      el('sim-transaction-ref').value=''; el('sim-checkout').hidden=true;
      hidePaid();
      try { sessionStorage.removeItem('adtl_vehicle_request_v1'); } catch (_) {}
    } finally { restoring=false; }
    flow.step(1); prepare(false); window.updateVehicleJourney(); refreshButtons();
    status('Nouveau calcul. Vos rapports payés restent disponibles dans « Retrouver mes simulations ».');
    el('vehicle-form').scrollIntoView({behavior:'smooth',block:'start'}); el('sel-marque').focus({preventScroll:true});
  }
  function prepare(showErrors) {
    if (restoring) return false;
    if (paidOK()) {
      if (!window.ADTL_SIMULATION_READY) window.renderPaidSimulation(authorizedResult);
      el('pay-gate').style.display = 'none';
      el('sticky-unlock').style.display = 'none';
      document.body.classList.remove('has-sticky');
      return true;
    }
    const input = validInput(showErrors);
    el('pay-gate').style.display = input ? 'block' : 'none';
    el('sticky-unlock').style.display = input ? 'flex' : 'none';
    document.body.classList.toggle('has-sticky', !!input);
    el('res-empty').style.display = input ? 'none' : 'block';
    if (input) {
      el('sim-order-summary').textContent = [input.brand, input.model, input.year].join(' ') + ' · ' +
        el('sel-origine').selectedOptions[0].textContent + ' · ' + el('sel-destination').selectedOptions[0].textContent;
      el('sim-checkout-summary').textContent=el('sim-order-summary').textContent;
      if (!busy && !widgetOpen) status(pending?.transactionId ? 'Un paiement attend sa vérification. Utilisez « Vérifier mon paiement » sans payer à nouveau.'
        : config?.enabled ? ''
        : 'Paiement temporairement indisponible. Réessayez plus tard.');
    }
    refreshButtons();
    return !!input;
  }
  function loadWidget() {
    if (widgetPromise) return widgetPromise;
    widgetPromise = new Promise((resolve, reject) => {
      function connect() {
        if (typeof window.openKkiapayWidget !== 'function' || typeof window.addSuccessListener !== 'function') {
          reject(new Error('Le module Kkiapay n’est pas disponible. Aucun nouveau paiement n’a été ouvert.')); return;
        }
        window.addSuccessListener(event => {
          const transactionId = String(event?.transactionId || event?.transaction?.id || '');
          if (!activeOrder || !transactionId) { status('La référence de paiement est manquante. Conservez le reçu Kkiapay et contactez ADTL.', true); return; }
          pending = { ...activeOrder, transactionId };
          save(PENDING_KEY, pending);flow.remember(ORDERS_KEY,pending);
          widgetOpen = false;
          queueMicrotask(verifyPending);
        });
        if (typeof window.addFailedListener === 'function') window.addFailedListener(() => {
          widgetOpen = false; refreshButtons();
          status('Le paiement n’a pas été confirmé. Vérifiez son statut dans Kkiapay avant toute nouvelle tentative.');
        });
        if (typeof window.addKkiapayCloseListener === 'function') window.addKkiapayCloseListener(() => {
          widgetOpen = false; refreshButtons();
          if (!busy && !paidOK()) status(pending?.transactionId
            ? 'Votre référence est conservée. Vérifiez le paiement sans payer à nouveau.'
            : 'Le widget est fermé. Si vous avez payé, conservez votre reçu ; ne payez pas une seconde fois avant vérification.');
        });
        resolve();
      }
      if (window.openKkiapayWidget) { connect(); return; }
      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js'; script.async = true;
      script.onload = connect;
      script.onerror = () => reject(new Error('Impossible de charger Kkiapay. Vérifiez votre connexion puis réessayez.'));
      document.head.appendChild(script);
    }).catch(error => { widgetPromise = null; throw error; });
    return widgetPromise;
  }
  async function acceptVerified(data, source) {
    if (!data?.receiptToken || !data.result || !data.input) throw new Error('Le résultat vérifié n’a pas été reçu. Réessayez la vérification.');
    receipt = { receiptToken: data.receiptToken, transactionId: data.transactionId,
      input: data.input, fingerprint: fingerprint(data.input), customer: data.customer || null,
      notificationStatus: data.notificationStatus || null, emailDeliveryStatus: data.emailDeliveryStatus || null };
    const receiptSaved=save(RECEIPT_KEY, receipt);
    const archived=flow.remember(HISTORY_KEY,receipt);
    if(!receiptSaved||!archived) { flow.download('Sauvegarde-simulation-'+data.transactionId+'.json',JSON.stringify(receipt)); }
    save(ORDERS_KEY,orders().filter(x=>x.orderId!==source?.orderId));
    pending = null; save(PENDING_KEY, null); activeOrder = null;
    el('sim-notification-retry').hidden = data.notificationStatus !== 'pending';
    el('sim-notification-status').hidden = data.notificationStatus !== 'pending';
    el('sim-email-status').textContent = flow.reportEmailMessage(data);
    el('sim-report-email').value = data.customer?.email || '';
    if (receipt.fingerprint !== fingerprint(currentInput())) {
      hidePaid();
      status('Paiement confirmé pour vos paramètres précédents. Cliquez sur « Retrouver ma simulation payée » pour l’afficher.', true);
      return;
    }
    authorizedFingerprint = receipt.fingerprint; authorizedResult = data.result;
    authorizedCustomer = data.customer ? Object.freeze({ ...data.customer }) : null;
    window.ADTLClientContact.set(authorizedCustomer || { lastName: '', firstName: '', phone: '' });
    window.renderPaidSimulation(data.result);
    status('Votre simulation payée est disponible. Vous pourrez la retrouver sur cet appareil sans payer à nouveau pour ces mêmes paramètres.', true);
    el('sim-paid-banner').textContent = 'Paiement confirmé pour la prestation de simulation' + (Number.isSafeInteger(data.amount) && data.currency === 'XOF' ? ' à ' + data.amount.toLocaleString('fr-FR') + ' F CFA' : '') + ', hors frais KKiaPay éventuels. Référence Kkiapay : ' + String(data.transactionId || 'conservée') + '. Votre rapport PDF est disponible.';
    el('sim-paid-banner').hidden = false;
    el('sim-report-action').hidden=false; el('sim-checkout').hidden=true;
    flow.step(3);flow.track('result_viewed','vehicle');
    el('sticky-unlock').style.display = 'none'; document.body.classList.remove('has-sticky');
    el('res-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if(data.notificationStatus==='pending'&&data.customer?.email)await sendReportEmail(data.customer.email);
  }
  async function sendReportEmail(email) {
    if(!receipt?.receiptToken)return;
    el('sim-email-status').textContent='Envoi de votre rapport PDF à '+email+'…';
    const keep=job=>{
      receipt={...receipt,receiptToken:job.receiptToken,customer:job.customer,notificationStatus:job.notificationStatus,emailDeliveryStatus:job.emailDeliveryStatus};
      save(RECEIPT_KEY,receipt);flow.remember(HISTORY_KEY,receipt);
      if(job.customer){authorizedCustomer=Object.freeze({...job.customer});window.ADTLClientContact.set(job.customer);}
    };
    try{
      const sent=await flow.deliverReportEmail(API,receipt.receiptToken,email,keep);keep(sent);
      el('sim-email-status').textContent=flow.reportEmailMessage(sent);
      el('sim-notification-retry').hidden=true;el('sim-notification-status').hidden=true;
    }catch(error){el('sim-email-status').textContent=error.message;el('sim-notification-retry').hidden=false;el('sim-notification-status').hidden=false;}
  }
  async function resendReportEmail(){
    if(busy||widgetOpen||!paidOK())return;
    const field=el('sim-report-email');if(!field.reportValidity())return;
    busy=true;refreshButtons();try{await sendReportEmail(field.value.trim());}finally{busy=false;refreshButtons();}
  }
  async function verifyPending() {
    if (busy || !pending?.transactionId || !pending?.orderToken) return;
    busy = true; refreshButtons(); status('Vérification du paiement auprès de Kkiapay…', true);
    const source = { ...pending };
    try {
      const data = await request('verify', { orderToken: source.orderToken, transactionId: source.transactionId });
      await acceptVerified(data, source);
    } catch (error) { status(error.message + ' Votre référence est conservée ; utilisez « Vérifier mon paiement » sans payer à nouveau.', true); }
    finally { busy = false; refreshButtons(); }
  }
  async function start(confirmed=false) {
    if (busy || widgetOpen) return;
    if(paidOK()){el('sim-report-action').scrollIntoView({behavior:'smooth',block:'center'});return;}
    const previous=history().find(r=>r.fingerprint===fingerprint(currentInput()));
    if(previous)return restoreReceipt(previous);
    if (pending?.transactionId) {
      status('Un paiement possède déjà une référence. Vérifiez-le sans repayer ; si la récupération échoue, contactez ADTL avec votre reçu Kkiapay.', true);
      await verifyPending();
      return;
    }
    if (!prepare(true)) return;
    if(!confirmed){el('sim-checkout-title').textContent='Vérifiez votre simulation';document.querySelector('#sim-checkout > p:nth-of-type(2)').hidden=false;el('sim-checkout').hidden=false;el('sim-checkout-title').focus();flow.step(2);flow.track('form_validated','vehicle');return;}
    if (!window.ADTLClientContact.validate(true)) return;
    if(!flow.available()){status('Votre navigateur ne permet pas de conserver votre reçu. Activez le stockage du site avant de payer.');return;}

    busy = true; refreshButtons();
    try {
      const cfg = await loadConfig();
      if (!cfg.enabled || cfg.amount !== PRICE || cfg.currency !== 'XOF' || !cfg.publicKey) throw new Error('Paiement temporairement indisponible. Réessayez plus tard.');
      const input = currentInput(), fp = fingerprint(input), customer = window.ADTLClientContact.get();
      const matching=orders().find(x=>x.fingerprint===fp && JSON.stringify(x.customer)===JSON.stringify(customer));
      if(matching)pending=matching;
      if (!pending || pending.fingerprint !== fp || !pending.orderToken ||
          JSON.stringify(pending.customer) !== JSON.stringify(customer) || pending.amount !== cfg.amount || pending.publicKey !== cfg.publicKey || pending.sandbox !== !!cfg.sandbox) {
        status('Préparation du paiement…');
        const order = await request('order', { input, customer });
        if (!order.orderToken || order.amount !== PRICE || order.currency !== 'XOF' || !order.publicKey) throw new Error('La commande n’a pas pu être préparée. Aucun paiement n’a été ouvert.');
        pending = { orderId: order.orderId, orderToken: order.orderToken, input, fingerprint: fp,
          publicKey: order.publicKey, sandbox: !!order.sandbox, amount: order.amount, customer: order.customer };
        if(!save(PENDING_KEY, pending)||!flow.remember(ORDERS_KEY,pending))throw Error('Le reçu ne peut pas être conservé sur cet appareil. Aucun paiement n’a été ouvert.');
      }
      if (fp !== fingerprint(currentInput()) || JSON.stringify(customer) !== JSON.stringify(window.ADTLClientContact.get())) throw new Error('Les informations ont changé. Vérifiez-les avant de payer.');
      await loadWidget();
      if (fp !== fingerprint(currentInput()) || JSON.stringify(customer) !== JSON.stringify(window.ADTLClientContact.get())) throw new Error('Les informations ont changé. Vérifiez-les avant de payer.');
      activeOrder = { ...pending }; widgetOpen = true;
      window.openKkiapayWidget({ amount: activeOrder.amount, key: activeOrder.publicKey, sandbox: activeOrder.sandbox,
        partnerId: activeOrder.orderId, data: activeOrder.orderId, theme: '#0A0A0A', position: 'center',
        name: [activeOrder.customer.firstName, activeOrder.customer.lastName].join(' '), phone: activeOrder.customer.phone });
      flow.track('payment_started','vehicle');
      status('Terminez le paiement dans Kkiapay. Le résultat s’affichera après sa vérification.');
    } catch (error) { widgetOpen = false; status(error.message); }
    finally { busy = false; refreshButtons(); }
  }
  function ensureValue(id, value) {
    const field = el(id);
    if (field.tagName === 'SELECT' && !Array.from(field.options).some(option => option.value === String(value))) {
      const option = document.createElement('option'); option.value = value; option.textContent = value; field.appendChild(option);
    }
    field.value = value;
  }
  async function restoreInput(input) {
    restoring = true;
    try {
      window.setVehicleCondition('occasion', { restoring: true });
      ensureValue('sel-marque', input.brand); window.onMarqueChange();
      ensureValue('sel-modele', input.model); el('sel-modele').disabled = false;
      if (input.catalogueId) await window.ADTLSelectedArgus.restore(input.catalogueId);
      el('inp-annee').value = input.year; el('sel-type').value = input.type;
      el('sel-origine').value = input.origin; el('sel-destination').value = input.destination;
      el('sel-contribuable').value = input.taxpayer; el('inp-fret').value = input.freight;
      el('sel-valuation-source').value = input.valuationSource === 'transaction' ? 'manual' : 'reference';
      window.ADTLLegacyPaidTransaction = input.valuationSource === 'transaction';
      if (input.transaction) {
        el('inp-transaction-value').value = input.transaction.value;
        el('sel-transaction-currency').value = input.transaction.currency;
        el('sel-transaction-basis').value = input.transaction.basis;
      }
      window.updateTransactionControl(); window.updateTgcControl();
      el('chk-tgc').checked = !!input.tgc;
      window.refreshValuationDisplay();
      el('new-vehicle-notice').hidden = true;
      window.updateVehicleJourney();
    } finally { restoring = false; }
  }
  async function restoreReceipt(selected) {
    if (busy || widgetOpen) return;
    if(selected?.receiptToken)receipt=selected;
    if (!receipt?.receiptToken) return;
    busy = true; refreshButtons(); status('Récupération de votre simulation payée…', true);
    const saved = { ...receipt };
    try {
      const data = await request('result', { receiptToken: saved.receiptToken });
      await restoreInput(data.input);
      await acceptVerified(data, saved);
    } catch (error) { status(error.message + ' Conservez votre référence de paiement pour assistance.', true); }
    finally { busy = false; refreshButtons(); }
  }
  window.ADTLSimulatorPayment = {
    paidOK, prepare, inputChanged, start, refreshButtons,
    async downloadReport() {
      if (!paidOK() || !receipt?.receiptToken) throw Error('Récupérez votre simulation payée avant de télécharger le rapport.');
      const saved = receipt;
      const report = await request('report', { receiptToken: saved.receiptToken });
      if (!paidOK() || receipt.transactionId !== saved.transactionId) throw Error('La simulation a changé. Rouvrez le rapport souhaité.');
      receipt = { ...saved, receiptToken: report.receiptToken, notificationStatus: report.notificationStatus, emailDeliveryStatus: report.emailDeliveryStatus };
      save(RECEIPT_KEY, receipt); flow.remember(HISTORY_KEY, receipt);
      el('sim-notification-retry').hidden = report.notificationStatus !== 'pending';
      el('sim-notification-status').hidden = report.notificationStatus !== 'pending';
      el('sim-email-status').textContent = flow.reportEmailMessage(report);
      flow.downloadReportFile(report);
      return report.filename;
    },
    customer: () => authorizedCustomer,
    authorized: result => result === authorizedResult && paidOK(),
    restore: restoreReceipt, retry: verifyPending
  };
  fieldIds.forEach(id => {
    el(id).addEventListener('input', inputChanged);
    el(id).addEventListener('change', inputChanged);
  });

  el('sim-restore').addEventListener('click', ()=>restoreReceipt());
  el('sim-new-calculation').addEventListener('click', newCalculation);
  el('sim-email-send').addEventListener('click',resendReportEmail);
  el('sim-pay-confirm').addEventListener('click',()=>window.isNewVehicle()||window.needsVehicleReview()?window.continueVehicleStudy():start(true));
  el('sim-checkout-edit').addEventListener('click',()=>{el('sim-checkout').hidden=true;el('vehicle-form').scrollIntoView({behavior:'smooth',block:'start'});flow.step(1);});
  el('sim-resume-pending').addEventListener('click',()=>resumePending());
  el('sim-manual-verify').addEventListener('click',()=>{const id=el('sim-transaction-ref').value.trim();if(!pending?.orderToken||!/^[A-Za-z0-9_-]{4,128}$/.test(id)){status('Saisissez la référence figurant sur votre reçu KKiaPay.',true);return;}pending={...pending,transactionId:id};save(PENDING_KEY,pending);flow.remember(ORDERS_KEY,pending);verifyPending();});
  el('sim-history-open').addEventListener('click',()=>{const value=el('sim-history').value;if(value.startsWith('paid:'))restoreReceipt(history().find(x=>x.transactionId===value.slice(5)));else resumePending(orders().find(x=>x.orderId===value.slice(8)));});
  if(receipt?.receiptToken)flow.remember(HISTORY_KEY,receipt);
  if(pending?.orderToken)flow.remember(ORDERS_KEY,pending);
  window.addEventListener('storage',()=>{pending=read(PENDING_KEY);receipt=read(RECEIPT_KEY);refreshButtons();});
  flow.track('simulation_view','vehicle');
  el('sim-notification-retry').addEventListener('click', resendReportEmail);
  el('sim-retry').addEventListener('click', verifyPending);
  // A previous local flag never authorizes a result. Only the signed receipt can be checked again.
  hidePaid(); prepare(false); refreshButtons(); loadConfig(); window.updateVehicleJourney();
})();
