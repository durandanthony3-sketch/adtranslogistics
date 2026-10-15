'use strict';
const defaults=require('../../lib/container-fees.cjs');
const fees=structuredClone(defaults);fees.approved=true;fees.version='FIXTURE-TEST-NE-PAS-PUBLIER';
fees.fees.find(f=>f.id==='guce').amounts={20:25000,40:25000};
fees.fees.find(f=>f.id==='port').amounts={20:5000,40:5000};
fees.storage.bands=[{through:5,rates:{20:1000,40:2000}},{through:null,rates:{20:3000,40:6000}}];
fees.demurrage.bands=[{through:7,rates:{20:6000,40:12000}},{through:null,rates:{20:10000,40:20000}}];
const input={schema:'container-v1',model:'IM-4',origin:'CN',commodity:'9403100000',designation:'meubles de bureau en métal',goodsValue:5000000,freight:1000000,currency:'XOF',netMass:5000,units:null,containerSize:'20',carrier:'hapag',storageDays:11,demurrageDays:14};
const commodity={code:'9403100000',description:'MEUBLES EN METAL DES TYPES UTILISES DANS LES BUREAUX',hsCode:'940310',pr1:'00',pr2:'00',unit:null};
const rates={XOF:1,EUR:655.957,USD:560};
function transport({partial=false,ambiguous=false,seen=[]}={}){return async(url,options)=>{
  const body=JSON.parse(options.body);seen.push({url,body});let result;
  if(url.includes('/commodity/'))result={resultList:ambiguous?[commodity,{...commodity,code:'9403200000',description:'AUTRES MEUBLES EN METAL'}]:[commodity]};
  else if(url.includes('/country/'))result={resultList:[{code:'CN',description:'Chine'}]};
  else if(url.includes('/exchangeRate/')){const code=body.restrictions[0].value;result={resultList:[{code,description:code,rate:rates[code],validFromDate:'2026-09-23'}]};}
  else if(url.includes('/sad/simulation')){
    const i=body.items[0],dd=i.statisticalValue*.2,tva=(i.statisticalValue+dd)*.18;
    result={global:[],errors:[],fieldsErrors:partial?[{ruleName:'TVA',fields:[{propertyName:'extendedProcedureCode'}]}]:[],askTaxes:[],currency:'XOF',guaranteeAmount:0,totalItemTaxes:dd+tva,items:[{commodityCode:i.commodityCode,countryOfOriginCode:i.itemCountryOfOriginCode,statisticalValue:i.statisticalValue,errors:[],askTaxes:[],taxes:[{code:'DD',description:'TEST LOCAL - droit fictif',amount:dd,baseAmount:i.statisticalValue,rate:20},{code:'TVA',description:'TEST LOCAL - taxe fictive',amount:tva,baseAmount:i.statisticalValue+dd,rate:18}]}]};
  }else throw Error('Unexpected URL '+url);
  return {ok:true,text:async()=>JSON.stringify(result)};
};}
module.exports={fees,input,commodity,rates,transport};
