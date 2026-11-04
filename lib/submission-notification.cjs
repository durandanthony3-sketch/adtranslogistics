'use strict';

const RECIPIENT = 'adtranslogistics@hotmail.com';
// The AJAX endpoint silently drops file uploads. Use the multipart form endpoint.
const ENDPOINT = 'https://formsubmit.co/' + RECIPIENT;
const CONFIRMATION_URL = 'https://www.adtranslogistics.com/simulateur?report-copy=accepted';
const { createSimulationReport } = require('./simulation-report.cjs');
const { normalizeEmail } = require('./customer-email.cjs');
const { createMailTransport } = require('./mail-transport.cjs');
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

const money = value => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 }).replace(/[\u202f\u00a0]/g, ' ') + ' F CFA';

// E-mail du rapport : destinataire = le client (copie cachée ADTL) ; sans e-mail client, ADTL seul.
function reportMessage(submission, report) {
  const { product = 'vehicle', customer, input, result, transactionId, amount, currency, orderId } = submission;
  const email = customer?.email ? normalizeEmail(customer.email) : null;
  const who = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Madame, Monsieur';
  const vehicle = product === 'goods' ? ('Marchandises - code SH ' + input.commodity) : [input.brand, input.model, input.year].join(' ');
  const total = product === 'goods' ? (result.budget?.totalLanded ?? result.totalTaxes) : result.totalGeneral;
  const totalLabel = product === 'goods' ? (result.budget ? 'Budget global estimé' : 'Total des taxes estimé') : 'Montant total à prévoir (droits, taxes et frais)';
  const lines = [
    'Bonjour ' + who + ',',
    '',
    'Votre rapport de simulation AD TRANS LOGISTICS est joint à cet e-mail (PDF).',
    '',
    'Référence : ADTL-' + transactionId,
    'Objet : ' + vehicle,
    totalLabel + ' : ' + money(total),
    'Service de simulation réglé : ' + amount + ' ' + currency + ' (hors frais KKiaPay éventuels)',
    '',
    'Ce rapport est une estimation indicative : le montant définitif dépend des documents du dossier et du contrôle douanier.',
    'Pour lancer le dédouanement ou poser une question, répondez à cet e-mail ou écrivez-nous sur WhatsApp : +229 01 97 50 05 55.',
    '',
    'AD TRANS LOGISTICS - transitaire au port de Cotonou',
    'www.adtranslogistics.com - IFU 3202465578499 - RCCM RB/COT/24 B 38537',
    'Référence de demande : ' + orderId
  ];
  const esc = v => String(v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#0A0A0A;max-width:560px">' +
    '<p>Bonjour ' + esc(who) + ',</p><p>Votre rapport de simulation AD TRANS LOGISTICS est joint à cet e-mail (PDF).</p>' +
    '<table style="border-collapse:collapse;font-size:14px"><tr><td style="padding:4px 12px 4px 0;color:#737373">Référence</td><td style="padding:4px 0"><b>ADTL-' + esc(transactionId) + '</b></td></tr>' +
    '<tr><td style="padding:4px 12px 4px 0;color:#737373">Objet</td><td style="padding:4px 0">' + esc(vehicle) + '</td></tr>' +
    '<tr><td style="padding:4px 12px 4px 0;color:#737373">' + esc(totalLabel) + '</td><td style="padding:4px 0"><b>' + esc(money(total)) + '</b></td></tr>' +
    '<tr><td style="padding:4px 12px 4px 0;color:#737373">Service réglé</td><td style="padding:4px 0">' + esc(amount + ' ' + currency) + ' (hors frais KKiaPay éventuels)</td></tr></table>' +
    '<p style="color:#525252;font-size:13px">Estimation indicative : le montant définitif dépend des documents du dossier et du contrôle douanier.</p>' +
    '<p>Pour lancer le dédouanement ou poser une question, répondez à cet e-mail ou écrivez-nous sur <a href="https://wa.me/2290197500555">WhatsApp +229 01 97 50 05 55</a>.</p>' +
    '<p style="color:#737373;font-size:12px">AD TRANS LOGISTICS - transitaire au port de Cotonou - www.adtranslogistics.com - IFU 3202465578499 - RCCM RB/COT/24 B 38537<br>Référence de demande : ' + esc(orderId) + '</p></div>';
  return {
    to: email && email !== RECIPIENT ? [{ email, name: who === 'Madame, Monsieur' ? undefined : who }] : [{ email: RECIPIENT }],
    bcc: email && email !== RECIPIENT ? [{ email: RECIPIENT }] : [],
    replyTo: RECIPIENT,
    subject: 'Votre rapport de simulation ADTL-' + transactionId + ' — AD TRANS LOGISTICS',
    text: lines.join('\n'), html,
    attachments: [{ filename: report.filename, content: report.bytes, type: 'application/pdf' }]
  };
}

function createSubmissionNotifier(options = {}) {
  const mail = createMailTransport(options);
  const legacy = createReportTransport(options);
  const notifier = async submission => {
    const report = createSimulationReport(submission);
    if (mail.provider !== 'none') { await mail.send(reportMessage(submission, report)); return { provider: mail.provider }; }
    await legacy(submissionPayload(submission), report);
    return { provider: 'formsubmit' };
  };
  notifier.provider = mail.provider === 'none' ? 'formsubmit' : mail.provider;
  return notifier;
}

module.exports = { createSubmissionNotifier, createReportTransport, submissionPayload, reportMessage, RECIPIENT, CONFIRMATION_URL };
