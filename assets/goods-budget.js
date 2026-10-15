(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ADTLGoodsBudget=factory();})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const round=n=>Math.round((n+Number.EPSILON)*100)/100;
  function commercial(goods,freight){
    if(![goods,freight].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)||goods<=0||goods+freight>1e11)throw Error('Indiquez des montants valides.');
    goods=round(goods);freight=round(freight);
    const cfr=round(goods+freight),insurance=round(cfr*.01);
    return {goodsValue:round(goods),freight:round(freight),cfr,insurance,insuranceRate:.01,cif:round(cfr+insurance)};
  }
  // Bands count chargeable days AFTER the free period, not calendar day numbers.
  function delay(days,freeDays,bands,size){
    if(!Number.isInteger(days)||days<0||days>3650||!Number.isInteger(freeDays)||freeDays<0)throw Error('Durée non valide.');
    const chargedDays=Math.max(0,days-freeDays);
    if(!chargedDays)return {days,freeDays,chargedDays,amount:0};
    if(!Array.isArray(bands)||!bands.length)return {days,freeDays,chargedDays,amount:null};
    let previous=0,amount=0;
    for(const b of bands){
      const end=b.through===null?Infinity:b.through,rate=b.rates?.[size];
      if(!(end>previous)||!Number.isFinite(rate)||rate<0)throw Error('Barème journalier non valide.');
      amount+=Math.max(0,Math.min(chargedDays,end)-previous)*rate;
      if(chargedDays<=end)return {days,freeDays,chargedDays,amount:round(amount)};
      previous=end;
    }
    return {days,freeDays,chargedDays,amount:null};
  }
  function local(input,config,rates={XOF:1}){
    if(!['20','40'].includes(input.containerSize))throw Error('Choisissez 20 ou 40 pieds.');
    const size=input.containerSize,carrier=config.carriers.find(c=>c.id===input.carrier);
    const items=config.fees.map(f=>({...f,amount:f.amounts[size]}));
    if(!carrier)throw Error('Choisissez le consignataire.');
    for(const f of carrier.fees){
      const sourceAmount=f.amounts[size],fx=rates[f.currency];
      const amount=Number.isFinite(sourceAmount)&&Number.isFinite(fx)&&fx>0?round(sourceAmount*fx):null;
      items.push({...f,amount,exchangeRate:fx??null,sourceAmount,source:carrier.source});
    }
    const storage=delay(input.storageDays,config.storage.freeDays,config.storage.bands,size);
    const demurrage=delay(input.demurrageDays,config.demurrage.freeDays,config.demurrage.bands,size);
    items.push({id:'storage',label:'Magasinage ('+storage.chargedDays+' jours facturables)',amount:storage.amount},{id:'demurrage',label:'Surestaries ('+demurrage.chargedDays+' jours facturables)',amount:demurrage.amount});
    const missing=items.filter(f=>!Number.isFinite(f.amount)||f.amount<0).map(f=>f.label);
    return {version:config.version,approved:config.approved===true,carrier:carrier.label,carrierSource:carrier.source,items,storage,demurrage,missing,knownSubtotal:round(items.reduce((n,f)=>n+(Number.isFinite(f.amount)&&f.amount>=0?f.amount:0),0)),total:missing.length?null:round(items.reduce((n,f)=>n+f.amount,0))};
  }
  return {round,commercial,delay,local};
});
