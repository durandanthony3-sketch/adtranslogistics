(function(){
  'use strict';
  if(new URLSearchParams(location.search).get('from')!=='calculateur')return;
  try{
    const draft=JSON.parse(sessionStorage.getItem('adtl_goods_request_v1')||'null');
    if(!draft?.input||!Number.isFinite(draft.createdAt)||Date.now()-draft.createdAt>24*60*60*1000)return;
    const data=draft.input,clean=(value,max=250)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,max);
    const set=(id,value)=>{const field=document.getElementById(id);if(field&&!field.value)field.value=value;};
    set('f-marchandise',clean(data.commodity)+' — '+clean(draft.description));set('f-origine',clean(data.origin,2));set('f-poids',clean(data.netMass,20)+' kg');
    if(data.model==='IM-4')set('f-destination','Bénin');
    const commercial=data.schema==='container-v1'?['Désignation : '+clean(data.designation),'Conteneur : '+clean(data.containerSize)+' pieds ; compagnie : '+clean(data.carrier),'Marchandises : '+clean(data.goodsValue)+' '+clean(data.currency,3),'Fret : '+clean(data.freight)+' '+clean(data.currency,3),'Assurance à estimer : 1 % du CFR','Jours au port / retour vide : '+clean(data.storageDays)+' / '+clean(data.demurrageDays)]:['Valeur CAF : '+clean(data.cif,30)+' '+clean(data.currency,3)];
    set('f-details',['Demande de vérification d’une simulation marchandises GUCE.', 'Régime : '+clean(data.model,4),'Code SH : '+clean(data.commodity,14),...commercial,'Unités complémentaires : '+clean(data.units??'non renseignées',30),'Le calcul automatique nécessite une vérification. Aucun paiement de simulation effectué à cette étape.'].join('\n'));
    const status=document.getElementById('vehicle-prefill-status');if(status){status.hidden=false;status.textContent='Informations de la marchandise reprises. Vérifiez-les et complétez vos coordonnées avant d’envoyer la demande.';}
  }catch(_){}
})();
