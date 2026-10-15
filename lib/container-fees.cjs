'use strict';
// Public preview displays known amounts. Paid quotes require validation of the
// remaining amounts, tax treatment and potential overlap with terminal handling.
// null means unknown, never a free service. No browser-supplied fee is accepted.
module.exports={
  version:'20260923-container-draft1',approved:false,taxTreatment:'À valider',
  fees:[
    {id:'thc',label:'THC et manutention',amounts:{20:175000,40:265000},basis:'container',source:'Valeurs proposées par ADTL le 23/09/2026'},
    {id:'transport',label:'Transport local',amounts:{20:150000,40:150000},basis:'container',source:'Valeur proposée par ADTL le 23/09/2026'},
    {id:'operations',label:'Enlèvement, visa, positionnement et acconage',amounts:{20:100000,40:100000},basis:'dossier',source:'Montant communiqué par ADTL le 23/09/2026 ; périmètre à confirmer face aux THC'},
    {id:'adtl',label:'Prestation AD TRANS LOGISTICS',amounts:{20:200000,40:200000},basis:'dossier',source:'Montant communiqué par ADTL le 23/09/2026'},
    {id:'guce',label:'Frais GUCE / BFU',amounts:{20:null,40:null},basis:'dossier',source:'Montant à confirmer'},
    {id:'port',label:'Autres frais portuaires non compris dans les THC',amounts:{20:null,40:null},basis:'container',source:'Montant ou inclusion à confirmer'}
  ],
  storage:{freeDays:11,bands:null},demurrage:{freeDays:14,bands:null},
  carriers:[
    {id:'cma',label:'CMA CGM',source:'https://www.cma-cgm.com/assets/public/documents/BENIN%20-%20LOCAL%20SCES_7.pdf',checkedAt:'2026-09-23',note:'Documentaire : 20 300 XOF/TEU hors TVA. TVA, commissions et autres frais à confirmer avant chiffrage final.',fees:[
      {id:'exchange',label:'Échange documentaire / BAD (hors TVA)',amounts:{20:20300,40:40600},currency:'XOF',basis:'TEU'},
      {id:'carrierManifest',label:'Manifeste consignataire (hors TVA)',amounts:{20:1015,40:1015},currency:'XOF',basis:'BL'},
      {id:'carrierStamp',label:'Timbre consignataire',amounts:{20:3000,40:3000},currency:'XOF',basis:'BL'},
      {id:'carrierAdmin',label:'Administration consignataire (hors TVA)',amounts:{20:300,40:300},currency:'XOF',basis:'BL'},
      {id:'carrierSecurity',label:'Sûreté terminal consignataire',amounts:{20:5000,40:10000},currency:'XOF',basis:'TEU'},
      {id:'carrierInspection',label:'Inspection conteneur (hors TVA)',amounts:{20:3045,40:6090},currency:'XOF',basis:'TEU'},
      {id:'carrierBalance',label:'TVA, commissions et frais conditionnels du consignataire',amounts:{20:null,40:null},currency:'XOF',basis:'dossier'}
    ]},
    {id:'hapag',label:'Hapag-Lloyd',source:'https://www.hapag-lloyd.com/content/dam/website/downloads/pdf/Local_charge_BJ_Jul_2026_updated.pdf',checkedAt:'2026-09-23',note:'Barème publié de juillet 2026. Traitement fiscal et éventuels doublons avec les forfaits ADTL à confirmer.',fees:[
      {id:'exchange',label:'Échange documentaire / BAD',amounts:{20:30.49,40:60.98},currency:'EUR',basis:'container'},
      {id:'carrierAdmin',label:'Administration consignataire',amounts:{20:3.73,40:3.73},currency:'USD',basis:'BL'},
      {id:'carrierSecurity',label:'Sûreté terminal consignataire',amounts:{20:4.88,40:9.76},currency:'EUR',basis:'container'},
      {id:'carrierMaintenance',label:'Entretien équipement consignataire',amounts:{20:4.57,40:9.14},currency:'EUR',basis:'container'}
    ]},
    ...[
      ['maersk','Maersk','https://www.maersk.com/local-information/imea/benin/import','Montant documentaire non publié sur la page import consultée.'],
      ['msc','MSC','https://www.msc.com/en/local-information/africa/benin','Barème documentaire non trouvé dans la page locale consultée.'],
      ['oocl','OOCL','https://www.oocl.com/benin/eng/localinformation/localsurcharges/Pages/default.aspx','La page Bénin affiche 20 300 XOF/TEU, mais cite un agent au Togo et exclut le Transpacifique : applicabilité à confirmer.'],
      ['other','Autre / à préciser',null,'Tarif du consignataire à confirmer.']
    ].map(([id,label,source,note])=>({id,label,source,note,checkedAt:'2026-09-23',fees:[{id:'exchange',label:'Échange documentaire / BAD et frais consignataire',amounts:{20:null,40:null},currency:'XOF',basis:'BL'}]}))
  ]
};
