'use strict';

const { jsPDF } = require('../assets/vendor/jspdf.umd.min.js');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const REPORT_VERSION = '20260923-1';
const logo = readFileSync(join(__dirname, '../assets/logo-adtl-20260919.jpeg'));
const text = value => String(value ?? 'Non renseigné').replace(/[\u202f\u00a0]/g, ' ').replace(/[\u2010-\u2015]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/\u0153/g, 'oe');
const money = value => Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 }).replace(/[\u202f\u00a0]/g, ' ') + ' F CFA';
const origins = { europe: 'Europe', usa: 'Amérique du Nord', asie: 'Asie', dubai: 'Moyen-Orient', afrique: 'Afrique' };

// Both the customer download and the merchant copy use this paid server snapshot.
// No browser totals, current catalogue lookup or payment credentials enter the PDF.
function createSimulationReport(submission) {
  const { product = 'vehicle', input: i, result: r, customer: c = {}, orderId, transactionId, verifiedAt } = submission;
  if (!i || !r || !/^[a-f0-9]{32}$/.test(orderId || '') || !/^[A-Za-z0-9_-]{4,128}$/.test(transactionId || '') || !Number.isFinite(Date.parse(verifiedAt))) throw new Error('verified_report_required');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  doc.setCreationDate(new Date(verifiedAt));
  doc.setFileId(createHash('sha256').update(orderId + ':' + transactionId + ':' + REPORT_VERSION).digest('hex').slice(0, 32));
  doc.setProperties({ title: 'Simulation ADTL - ' + transactionId, author: 'AD TRANS LOGISTICS', subject: 'Estimation indicative', creator: 'ADTL ' + REPORT_VERSION });
  const M = 17, W = 176, navy = [18, 29, 40];
  let y;
  function page() {
    doc.setFillColor(...navy); doc.rect(0, 0, 210, 37, 'F');
    doc.addImage(logo, 'JPEG', M, 7, 28, 21.2);
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('RAPPORT DE SIMULATION', 51, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(product === 'goods' ? 'Marchandises - source GUCE' : 'Véhicule - estimation de dédouanement', 51, 23);
    doc.setFontSize(8); doc.text('www.adtranslogistics.com | +229 01 97 50 05 55', 51, 29);
    y = 47;
  }
  function space(height) { if (y + height > 277) { doc.addPage(); page(); } }
  function paragraph(value, size = 9) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(55, 65, 75);
    const lines = doc.splitTextToSize(text(value), W);
    for (const line of lines) { space(5); doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(55, 65, 75); doc.text(line, M, y); y += 4.8; }
    y += 3;
  }
  function section(value) {
    space(21); y += 3; doc.setFillColor(236, 240, 243); doc.rect(M, y - 4, W, 8, 'F');
    doc.setTextColor(...navy); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(text(value), M + 3, y + 1); y += 11;
  }
  function row(label, value, bold = false) {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    const left = doc.splitTextToSize(text(label), 102), right = doc.splitTextToSize(text(value), 65);
    const height = Math.max(left.length, right.length) * 4.5 + 4; space(height);
    doc.setFontSize(9); doc.setTextColor(60, 65, 70); doc.setFont('helvetica', 'normal'); doc.text(left, M, y);
    doc.setTextColor(...navy); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(right, M + W, y, { align: 'right' });
    y += height; doc.setDrawColor(225, 230, 234); doc.line(M, y - 3, M + W, y - 3);
  }
  page();
  paragraph('Référence de rapport : ADTL-' + transactionId + '\nPaiement vérifié le ' + new Date(verifiedAt).toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' }) + ' (Bénin)', 8);
  section('Client et demande');
  row('Client', [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Non renseigné'); row('Téléphone', c.phone || 'Non renseigné');
  row('Service de simulation payé', money(submission.amount) + ' - hors frais KKiaPay');
  if (product === 'goods') {
    const g = r.input;
    row('Code SH', g.commodity, true); paragraph(g.description); row('Régime / origine', g.model + ' / ' + g.originLabel + ' (' + g.origin + ')');
    section('Données du calcul GUCE');
    if(r.budget){
      const b=r.budget.commercial,fx=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+g.currency;row('Conteneur',g.containerSize+' pieds - standard sec');row('Désignation saisie',g.designation);
      row('Prix des marchandises',fx(b.goodsValue));row('Fret',fx(b.freight));
      row('Valeur CFR (marchandises + fret)',fx(b.cfr));row('Assurance automatique (1 % du CFR)',fx(b.insurance));
    }
    row(r.budget?'Valeur CAF calculée':'Valeur CAF saisie', g.cif + ' ' + g.currency); row('Taux de change GUCE', g.exchangeRate); row('Valeur statistique', money(g.statisticalValue));
    row('Masse nette', g.netMass + ' kg'); row('Unités complémentaires', g.units ?? 'Non renseignées'); row('Date du calcul (UTC)', r.calculatedAt);
    if(r.budget)space(58);
    section('Détail des taxes renvoyées par le GUCE');
    for (const tax of r.taxes) { space(35); row(tax.code + ' - ' + tax.description, money(tax.amount), true); paragraph('Base : ' + money(tax.baseAmount) + ' | Taux indiqué par le GUCE : ' + tax.rate, 8); }
    row('TOTAL DES TAXES', money(r.totalTaxes), true); row('Garantie GUCE', money(r.guaranteeAmount));
    if(r.budget){
      const b=r.budget;section('Frais locaux et livraison');row('Compagnie / consignataire',b.local.carrier);
      for(const fee of b.local.items)row(fee.label,money(fee.amount));
      row('TOTAL FRAIS LOCAUX',money(b.local.total),true);
      paragraph('Magasinage : '+b.local.storage.days+' jours prévus, dont '+b.local.storage.freeDays+' jours de franchise. Surestaries : '+b.local.demurrage.days+' jours prévus, dont '+b.local.demurrage.freeDays+' jours de franchise.');
      space(76);section('Budget à prévoir');row('Douane et livraison',money(b.totalClearance),true);paragraph('Hors prix des marchandises, fret et assurance.');
      row('Marchandises + fret + assurance',money(b.commercialXof.cif));row('BUDGET GLOBAL',money(b.totalLanded),true);paragraph('Achat, fret, assurance, droits et taxes, frais locaux détaillés ci-dessus. Les cautions remboursables sont distinctes.');
      paragraph('Barème ADTL : '+b.local.version+'. Source consignataire : '+(b.local.carrierSource||'Tarif validé par ADTL'),8);
    }
    section('Portée et source'); paragraph(r.scope); paragraph('Source : ' + r.source, 8);
  } else {
    row('Véhicule / année', [i.brand, i.model, i.year].join(' '), true);
    row('Type / statut du contribuable', i.type + ' / ' + (i.taxpayer === 'morale' ? 'Personne morale' : 'Personne physique'));
    row('Origine / destination', (origins[i.origin] || i.origin) + ' / ' + (r.isReexport ? 'Réexportation EX8' : 'Bénin - consommation'));
    row('Catégorie fiscale retenue', r.cat); row('13 CV et plus déclarés', i.tgc ? 'Oui' : 'Non');
    section('Base de calcul');
    if (r.val.transaction) row('Valeur déclarée / base', r.val.transaction.amount + ' ' + r.val.transaction.currency + ' / ' + r.val.transaction.basis.toUpperCase());
    else if (r.val.cote != null) row('Cote historique retenue', r.val.cote + ' EUR');
    row('Valeur hors fret', r.fob == null ? 'Incluse dans la CAF' : money(r.fob)); row('Fret intégré à la base', money(r.fret));
    row('Valeur CAF retenue', money(r.caf), true);
    if (r.isPlancherApplied) row('Plancher CAF appliqué', money(r.plancher));
    if (!r.isReexport) row('Assiette taxable', money(r.assiette));
    section('Droits et taxes estimés');
    row(r.isReexport ? 'Forfait EX8 du modèle' : 'Droits de douane (' + r.rates.dd * 100 + ' %)', money(r.dd));
    if (!r.isReexport) { row('Prélèvements communautaires (3 %)', money(r.prel)); row('TVA (18 %)', money(r.tva)); row('Accise 13 CV et plus', money(r.acc)); row('Taxes et redevances fixes', money(r.redevances)); }
    row('TOTAL DROITS ET TAXES', money(r.totalDouane), true);
    section('Frais annexes et accompagnement');
    const labels = { bfuGucePac: 'Provision BFU / GUCE / PAC', emissionDeclaration: 'Émission de la déclaration', liquidation: 'Liquidation', interpol: 'Interpol', enlevement: 'Enlèvement', plaqueCarteGrise: 'Plaque / carte grise', echangeDocumentaire: 'Échange documentaire', prestationAdtl: 'Prestation AD TRANS LOGISTICS', imf: 'Provision IMF / SESUR du modèle' };
    for (const [key, value] of Object.entries(r.fees)) if (value) row(labels[key] || key, money(value));
    row('TOTAL FRAIS ANNEXES', money(r.fraisComplementaires.total), true); row('MONTANT TOTAL À PRÉVOIR', money(r.totalGeneral), true);
    paragraph("Le total ci-dessus couvre les droits, taxes et frais détaillés. Il exclut le prix d'achat et le fret à payer. Le fret affiché dans la base sert uniquement au calcul de la valeur CAF.", 9);
    section('Références et hypothèses');
    paragraph('Modèle : ' + r.engineVersion + ' | Source de valeur : ' + r.val.src + ' | Parité du modèle : 1 EUR = ' + r.rates.eurXof + ' F CFA.', 8);
    const trace = r.val.trace;
    if (trace) {
      paragraph(trace.note || 'Référence historique indicative, à confirmer.', 8);
      for (const line of (trace.lines || [])) paragraph([line.version, line.value == null ? '' : line.value + ' EUR', line.pdfPage == null ? '' : 'Page PDF ' + line.pdfPage, line.id].filter(Boolean).join(' | '), 8);
    }
    if (r.val.transaction) paragraph('Valeur saisie par le demandeur ; facture, état, puissance fiscale et AVD à vérifier.');
  }
  section('Information importante');
  paragraph('Estimation indicative. Le montant définitif dépend des caractéristiques et documents du dossier ainsi que du contrôle douanier. Le paiement ADTL rémunère la simulation ; il ne constitue pas un paiement de droits et taxes. Ce rapport ne vaut ni liquidation officielle ni quittance.');
  paragraph('Référence de demande : ' + orderId + ' | Version du rapport : ' + REPORT_VERSION, 8);
  for (let p = 1; p <= doc.getNumberOfPages(); p++) { doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(100, 108, 115); doc.text('AD TRANS LOGISTICS | ' + transactionId + ' | Page ' + p + '/' + doc.getNumberOfPages(), 105, 290, { align: 'center' }); }
  const bytes = Buffer.from(doc.output('arraybuffer'));
  return { filename: 'Rapport-ADTL-' + (product === 'goods' ? 'Marchandises' : 'Vehicule') + '-' + transactionId + '.pdf', bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
}

module.exports = { createSimulationReport, REPORT_VERSION };
