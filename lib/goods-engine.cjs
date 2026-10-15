'use strict';
const { PaymentError } = require('./payment-service.cjs');
const budget = require('../assets/goods-budget.js');
const defaultFees = require('./container-fees.cjs');
const SOURCE = 'https://guce.gouv.bj/fr/tools/taxation-simulation-customs';
const RIMM = 'https://guce.gouv.bj/rimm-server/';
const TAXATION = 'https://guce.gouv.bj/taxation-service-cwb/sad/simulation';
const MODELS = ['IM-4', 'EX-1'];
const fields = ['model','origin','commodity','cif','currency','netMass','units'];
const containerFields=['schema','model','origin','commodity','designation','goodsValue','freight','currency','netMass','units','containerSize','carrier','storageDays','demurrageDays'];
const fail = message => new PaymentError('invalid_simulation', message, 422);
const unavailable = () => new PaymentError('guce_unavailable', 'Le service GUCE ne répond pas pour le moment. Votre saisie est conservée. Aucun paiement n’a été ouvert.', 503);

function normalizeInput(input) {
  if(input?.schema==='container-v1'){
    if(Object.keys(input).some(k=>!containerFields.includes(k))||input.model!=='IM-4'||!['20','40'].includes(input.containerSize)||typeof input.designation!=='string'||input.designation.trim().length<2||input.designation.length>160||/[\u0000-\u001f]/.test(input.designation)||!defaultFees.carriers.some(c=>c.id===input.carrier)||![input.storageDays,input.demurrageDays].every(n=>Number.isInteger(n)&&n>=0&&n<=3650)||input.demurrageDays<input.storageDays)throw fail('Vérifiez la désignation, le conteneur, le consignataire et les durées (retour du vide après sortie du port).');
    let values;try{values=budget.commercial(input.goodsValue,input.freight);}catch(e){throw fail(e.message);}
    normalizeInput({model:input.model,origin:input.origin,commodity:input.commodity,cif:values.cif,currency:input.currency,netMass:input.netMass,units:input.units});
    return Object.fromEntries(containerFields.map(k=>[k,k==='designation'?input[k].trim():input[k]]));
  }
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !fields.includes(k))) throw fail('Vérifiez les paramètres de la marchandise.');
  if (!MODELS.includes(input.model) || !/^[A-Z]{2}$/.test(input.origin || '') || !/^\d{10,14}$/.test(input.commodity || '') || !/^[A-Z]{3}$/.test(input.currency || '')) throw fail('Choisissez un régime, une origine, une devise et un code SH exact.');
  const number = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (!number(input.cif, .01, 1e11) || !number(input.netMass, .001, 1e9) || !(input.units === null || number(input.units, .001, 1e9))) throw fail('Indiquez une valeur, un poids et, si nécessaire, une quantité valides.');
  return Object.fromEntries(fields.map(k => [k,input[k]]));
}
function createGoodsEngine({fetch: fetchImpl=globalThis.fetch, now=()=>new Date(), timeoutMs=22000, fees=defaultFees}={}) {
  const date = () => now().toISOString().slice(0,10);
  async function post(url, data) {
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeoutMs);
    try {
      const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(data),signal:controller.signal,redirect:'error'});
      if (!response.ok) throw unavailable();
      const raw=await response.text();
      if (Buffer.byteLength(raw)>1500000) throw unavailable();
      return JSON.parse(raw);
    } catch (error) { if (error instanceof PaymentError) throw error; throw unavailable(); }
    finally {clearTimeout(timer);}
  }
  async function references(entity, query='', exact=false,words=null) {
    if (!['country','commodity','exchangeRate'].includes(entity) || typeof query!=='string' || query.length>100 || (entity==='commodity' && query.length<2)) throw fail('Saisissez au moins deux chiffres du code SH.');
    const restrictions=words?words.map(value=>({field:'description',operator:'CONTAINS',value})):query ? [{field:/^\d+$/.test(query)||entity!=='commodity'?'code':'description',operator:exact?'EQUALS':/^\d+$/.test(query)||entity!=='commodity'?'STARTS_WITH':'CONTAINS',value:query}] : [{field:'code',operator:'IS_NOT_NULL'}];
    const selectFields=entity==='commodity'?['code','description','descriptionTranslated','hsCode','pr1','pr2','pr3','pr4','supplementaryUnit1Code']:entity==='exchangeRate'?['code','description','rate','validFromDate','validToDate']:['code','description'];
    const response=await post(RIMM+entity+'/search',{max:entity==='commodity'?50:300,offset:0,distinct:false,restrictBy:words?'AND':'OR',selectFields,restrictions,sortByFields:{code:'ASC'},meta:{validityDate:date()}});
    if (!Array.isArray(response.resultList)) throw unavailable();
    return response.resultList.map(r=>({code:r.code,description:r.descriptionTranslated||r.description||r.code,...(entity==='exchangeRate'?{rate:r.rate,validFromDate:r.validFromDate}:{}),...(entity==='commodity'?{hsCode:r.hsCode,pr1:r.pr1,pr2:r.pr2,pr3:r.pr3,pr4:r.pr4,unit:r.supplementaryUnit1Code}: {})}));
  }
  async function classify(query){
    if(typeof query!=='string'||query.trim().length<2||query.length>160)throw fail('Décrivez la marchandise en quelques mots.');
    query=query.trim();
    const clean=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const tokens=clean(query).split(' ').filter(s=>s.length>2&&!['des','les','pour','avec','sans','une','dans'].includes(s)).slice(0,4);
    const termWords=tokens.map(t=>t.endsWith('s')?t.slice(0,-1):t);
    let rows=await references('commodity',query.slice(0,100),false,termWords.length>1?termWords:null);
    let truncated=rows.length>=50;
    if(!rows.length&&tokens.length){
      const batches=await Promise.all(tokens.map(t=>references('commodity',t)));
      truncated=batches.some(a=>a.length>=50);
      rows=[...new Map(batches.flat().map(r=>[r.code,r])).values()];
    }
    const score=r=>termWords.filter(t=>clean(r.description).includes(t)).length;
    rows.sort((a,b)=>score(b)-score(a)||a.code.localeCompare(b.code));
    const exact=rows.filter(r=>r.code===query||clean(r.description)===clean(query));
    const complete=rows.filter(r=>termWords.length&&score(r)===termWords.length);
    const selected=exact.length===1&&!truncated?exact[0]:!truncated&&rows.length===1&&complete.length===1?complete[0]:null;
    return {rows:rows.slice(0,20),selectedCode:selected?.code||null,truncated:truncated||rows.length>20,message:selected?'Code SH identifié. Vérifiez que son libellé correspond à votre produit.':rows.length?'Précisez la matière ou l’usage, ou choisissez ci-dessous le libellé correspondant à votre produit.':'Aucune correspondance trouvée. Précisez la nature, la matière et l’usage de la marchandise.'};
  }
  async function compute(raw) {
    const normalized=normalizeInput(raw),isContainer=normalized.schema==='container-v1';
    let commercial,localCosts;
    if(isContainer){
      commercial=budget.commercial(normalized.goodsValue,normalized.freight);
      if(!fees.approved)throw new PaymentError('fees_pending_validation','Le barème des frais de conteneur est en cours de validation par ADTL. Votre saisie est conservée ; aucun paiement n’est ouvert.',422);
    }
    const input=isContainer?{...normalized,cif:commercial.cif}:normalized;
    const [commodities,countries,currencies]=await Promise.all([references('commodity',input.commodity,true),references('country',input.origin,true),references('exchangeRate',input.currency,true)]);
    const commodity=commodities.find(x=>x.code===input.commodity), country=countries.find(x=>x.code===input.origin), currency=currencies.find(x=>x.code===input.currency);
    if (!commodity || !country || !currency || !Number.isFinite(currency.rate) || currency.rate<=0) throw fail('Une référence n’est plus disponible dans le GUCE. Actualisez votre sélection.');
    if (commodity.unit && input.units===null) throw fail('Ce code SH nécessite une quantité en unité complémentaire ('+commodity.unit+').');
    const code=String(commodity.hsCode||'')+String(commodity.pr1??'')+String(commodity.pr2??'');
    if (!/^\d{8,10}$/.test(code)) throw fail('Ce code nécessite une vérification de ses précisions nationales.');
    const statisticalValue=input.cif*currency.rate;
    const [type,procedure]=input.model.split('-');
    const item={statisticalValue,itemCountryOfOriginCode:input.origin,commodityDescription:commodity.description,statValueInForeignCurrency:input.cif,currencyCode:input.currency,itemInvoiceCurrencyExchangeRate:currency.rate,supplementaryUnit:input.units,netMass:input.netMass,commodityCode:code};
    if (commodity.pr3) item.commodityCodeNationalPrecision3=commodity.pr3;
    if (commodity.pr4) item.commodityCodeNationalPrecision4=commodity.pr4;
    const response=await post(TAXATION,{document:{typeOfDeclaration:type,generalProcedureCode:procedure},items:[item]});
    const result=validateResult(response,{...input,description:commodity.description,originLabel:country.description,exchangeRate:currency.rate,exchangeRateDate:currency.validFromDate,statisticalValue},now());
    if(isContainer){
      const carrier=fees.carriers.find(c=>c.id===input.carrier),rates={XOF:1,[input.currency]:currency.rate};
      for(const code of [...new Set(carrier.fees.map(f=>f.currency))])if(!rates[code]){const values=await references('exchangeRate',code,true);rates[code]=values.find(x=>x.code===code)?.rate;}
      try{localCosts=budget.local(input,fees,rates);}catch(e){throw fail(e.message);}
      if(localCosts.total===null)throw new PaymentError('fees_pending_validation','Certains frais du dossier restent à chiffrer : '+localCosts.missing.join(', ')+'. Aucun paiement n’est ouvert.',422);
      const commercialXof=Object.fromEntries(['goodsValue','freight','cfr','insurance','cif'].map(k=>[k,budget.round(commercial[k]*currency.rate)]));
      // Add rounded components, so the displayed cost lines reconcile exactly.
      commercialXof.cfr=budget.round(commercialXof.goodsValue+commercialXof.freight);
      commercialXof.cif=budget.round(commercialXof.cfr+commercialXof.insurance);
      result.budget={commercial,commercialXof,local:localCosts,totalClearance:budget.round(result.totalTaxes+localCosts.total),totalLanded:budget.round(commercialXof.cif+result.totalTaxes+localCosts.total)};
      result.scope='Un conteneur standard sec, une nature de marchandise et un BL, importation IM-4 au Bénin. Assurance estimée à 1 % du CFR. Frais locaux selon le barème ADTL et le consignataire indiqués. Hors cautions remboursables, contrôles exceptionnels et prestations non listées. La simulation ne remplace pas une liquidation officielle.';
    }
    return result;
  }
  // Public form options only. Tariffs and their amounts stay server-side and
  // are released exclusively in the result bound to a verified paid receipt.
  const publicFees=()=>({
    approved:fees.approved===true,
    carriers:fees.carriers.map(({id,label})=>({id,label})),
    storage:{freeDays:fees.storage.freeDays},
    demurrage:{freeDays:fees.demurrage.freeDays}
  });
  return {normalizeInput,references,classify,compute,fees:publicFees};
}
function validateResult(data,input,now=new Date()) {
  const item=data?.items?.[0];
  // A positive total is not proof of a complete calculation. GUCE can return
  // partial taxes alongside errors for DD, TVA and other missing parameters.
  if(!Array.isArray(data?.errors)||!Array.isArray(data?.fieldsErrors)||!Array.isArray(item?.errors)||data?.global?.length)throw unavailable();
  const errors=[...(Array.isArray(data?.errors)?data.errors:[]),...(Array.isArray(data?.fieldsErrors)?data.fieldsErrors:[]),...(Array.isArray(item?.errors)?item.errors:[])];
  if (errors.length || data?.askTaxes?.length || item?.askTaxes?.length) throw new PaymentError('guce_incomplete','Le GUCE demande des informations complémentaires pour calculer toutes les taxes de ce dossier. Aucun paiement ne sera demandé. Faites vérifier votre marchandise par ADTL.',422);
  if (!Array.isArray(data?.items) || data.items.length!==1 || !Array.isArray(item.taxes) || !item.taxes.length || !['CFA','XOF'].includes(data.currency) || item.commodityCode!==input.commodity.slice(0,10) || item.countryOfOriginCode!==input.origin || Math.abs(item.statisticalValue-input.statisticalValue)>.01) throw unavailable();
  const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  if (!numeric(data.totalItemTaxes) || !numeric(data.guaranteeAmount) || item.taxes.some(t=>!numeric(t.amount)||!numeric(t.baseAmount)||!numeric(t.rate)||typeof t.code!=='string')) throw unavailable();
  const taxes=item.taxes.map(t=>({code:t.code.slice(0,30),description:String(t.descriptionTranslated||t.description||t.code).slice(0,300),amount:t.amount,baseAmount:t.baseAmount,rate:t.rate,methodOfPayment:String(t.methodOfPayment||'')}));
  if (Math.abs(taxes.reduce((n,t)=>n+t.amount,0)-data.totalItemTaxes)>1) throw new PaymentError('guce_incomplete','Le détail GUCE ne correspond pas au total. Une vérification est nécessaire ; aucun paiement ne sera demandé.',422);
  return {product:'goods',source:SOURCE,calculatedAt:now.toISOString(),input,taxes,totalTaxes:data.totalItemTaxes,guaranteeAmount:data.guaranteeAmount,currency:'XOF',scope:'Taxes renvoyées par la simulation GUCE. Hors frais portuaires, transport et honoraires de transit. La simulation ne remplace pas une liquidation officielle.'};
}
module.exports={createGoodsEngine,normalizeInput,validateResult,SOURCE,MODELS};
