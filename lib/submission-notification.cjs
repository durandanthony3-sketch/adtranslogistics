'use strict';

const RECIPIENT = 'adtranslogistics@hotmail.com';
// The AJAX endpoint silently drops file uploads. Use the multipart form endpoint.
const ENDPOINT = 'https://formsubmit.co/' + RECIPIENT;
const CONFIRMATION_URL = 'https://www.adtranslogistics.com/simulateur?report-copy=accepted';
const { createSimulationReport } = require('./simulation-report.cjs');
const { normalizeEmail } = require('./customer-email.cjs');
const ORIGINS = { usa: 'Amérique du Nord (USA, Canada)', europe: 'Europe', asie: 'Asie', afrique: 'Afrique' };

function submissionPayload({ product, orderId, createdAt, customer, input, result, amount, currency, transactionId, verifiedAt }) {
  if (typeof transactionId !== 'string' || !/^[A-Za-z0-9_-]{4,128}$/.test(transactionId) || !verifiedAt) throw new Error('verified_payment_required');
  const email = customer.email === undefined ? null : normalizeEmail(customer.email);
  if (customer.email !== undefined && !email) throw new Error('invalid_customer_email');
  return {
    _subject: 'Votre rapport de simulation ' + transactionId + ' — AD TRANS LOGISTICS',
    _template: 'table', _captcha: 'false', _next: CONFIRMATION_URL,
    _replyto: RECIPIENT,
    ...(email && email !== RECIPIENT ? { _cc: email } : {}),
    Message: 'Bonjour ' + customer.firstName + ' ' + customer.lastName + ', votre rapport PDF est joint à cet e-mail. Vous pouvez également le télécharger sur le site après paiement confirmé. AD TRANS LOGISTICS conserve une copie pour votre suivi.',
    Reference_demande: orderId, Date_UTC: createdAt,
    Nom: customer.lastName, Prenom: customer.firstName, Telephone: customer.phone,
    ...(email ? { Adresse_envoi_rapport: email } : {}),
    Service: product==='goods'?'Simulation marchandises GUCE avec rapport PDF':'Simulation véhicule avec rapport PDF',
    Vehicule: product==='goods'?'Sans objet':[input.brand, input.model, input.year].join(' '),
    ...(product==='goods'?{Code_SH:input.commodity,Regime:input.model,Valeur_CAF:(result.input?.cif??input.cif)+' '+input.currency,Masse_nette_kg:input.netMass}:{}),
    Type_vehicule: input.type, Origine: ORIGINS[input.origin] || input.origin,
    Destination: input.destination === 'benin' ? 'Bénin — mise à la consommation' : input.destination,
    Tarif_simulation: amount + ' ' + currency + ', hors frais KKiaPay éventuels',
    Statut_paiement: 'Paiement confirmé auprès de KKiaPay',
    Reference_KKiaPay: transactionId, Verification_paiement_UTC: verifiedAt,
    Total_rapport: (product === 'goods' ? result.budget?.totalLanded ?? result.totalTaxes : result.totalGeneral) + ' XOF',
    Portee: 'Rapport PDF du client, copie AD TRANS LOGISTICS. Estimation indicative, pas une quittance douanière.',
    Page: 'https://www.adtranslogistics.com/'+(product==='goods'?'calculateur':'simulateur')
  };
}

function createReportTransport({ fetch: fetchImpl = globalThis.fetch, timeoutMs = 20000 } = {}) {
  return async function sendReport(payload, report) {
    const controller = new AbortController();
    let timer;
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(payload)) if (value != null) body.set(key, String(value));
      body.set('Empreinte_PDF_SHA256', report.sha256);
      body.set('attachment', new Blob([report.bytes], { type: 'application/pdf' }), report.filename);
      const request = (async () => {
        const response = await fetchImpl(ENDPOINT, {
          method: 'POST', redirect: 'manual', signal: controller.signal,
          headers: { Accept: 'text/html', Origin: 'https://www.adtranslogistics.com', Referer: payload.Page || 'https://www.adtranslogistics.com/simulateur' },
          body
        });
        // Do not follow a third-party redirect or mistake an activation/captcha page for success.
        if (![302, 303].includes(response.status) || response.headers.get('location') !== CONFIRMATION_URL) {
          const error = new Error('notification_rejected'); error.providerStatus = response.status; throw error;
        }
      })();
      await Promise.race([request, new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('notification_timeout')); }, timeoutMs);
      })]);
    } finally { clearTimeout(timer); }
  };
}

function createSubmissionNotifier(options) {
  const send = createReportTransport(options);
  return async submission => send(submissionPayload(submission), createSimulationReport(submission));
}

module.exports = { createSubmissionNotifier, createReportTransport, submissionPayload, RECIPIENT, CONFIRMATION_URL };
