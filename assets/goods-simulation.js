(function(){
  'use strict';
  const flow=window.ADTLFlow,el=id=>document.getElementById(id),API='/api/goods';
  const DRAFT='adtl_goods_draft_v1',ORDERS='adtl_goods_orders_v1',RECEIPTS='adtl_goods_receipts_v1';
  const CURRENCIES=[['XOF','XOF — Franc CFA'],['USD','USD — Dollar américain'],['EUR','EUR — Euro']];
  const allowedCurrency=code=>CURRENCIES.some(([value])=>value===code);
  const ids=['goods-model','goods-origin','goods-commodity','goods-search','goods-value','goods-freight','goods-currency','goods-mass','goods-units','goods-container','goods-carrier','goods-storage-days','goods-demurrage-days'];
  const math=window.ADTLGoodsBudget;let feeConfig=null,legacyInput=null,searchTimer,searchVersion=0;
  let busy=false,widgetOpen=false,config=null,quote=null,pending=null,paid=null,widgetPromise=null;
  let commodities=[],currencies=[];
  const list=key=>{const value=flow.read(key,[]);return Array.isArray(value)?value:[];};
  const fp=input=>JSON.stringify(input);
  const input=()=>legacyInput||({schema:'container-v1',model:'IM-4',origin:el('goods-origin').value,commodity:el('goods-commodity').value,designation:el('goods-search').value.trim(),goodsValue:Number(el('goods-value').value),freight:Number(el('goods-freight').value),currency:el('goods-currency').value,netMass:Number(el('goods-mass').value),units:el('goods-units').value?Number(el('goods-units').value):null,containerSize:el('goods-container').value,carrier:el('goods-carrier').value,storageDays:Number(el('goods-storage-days').value),demurrageDays:Number(el('goods-demurrage-days').value)});
  const money=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2}).replace(/[\u202f\u00a0]/g,' ')+' F CFA';
  const status=message=>{el('goods-status').textContent=message;};
  function setBusy(value){busy=value;el('goods-new-calculation').disabled=value||widgetOpen;el('goods-email-send').disabled=value||widgetOpen;el('goods-continue').disabled=value||widgetOpen;el('goods-pay').disabled=value||widgetOpen;el('goods-verify').disabled=value;el('goods-history-open').disabled=value||widgetOpen;el('goods-continue').textContent=value?'Vérification du calcul GUCE…':'Vérifier ma simulation — 500 F CFA';el('goods-pay').textContent=value?'Vérification en cours…':widgetOpen?'Paiement ouvert dans KKiaPay…':'Payer 500 F CFA et obtenir mon rapport';}
  function checkout(show){el('goods-checkout').hidden=!show;el('sim-customer-fields').disabled=!show;}
  function option(select,value,label){const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);return o;}
  function refreshHistory(){
    const select=el('goods-history'),current=select.value;select.replaceChildren();
    list(RECEIPTS).forEach(r=>option(select,'paid:'+r.transactionId,r.input.commodity+' · rapport payé · '+r.transactionId));
    list(ORDERS).forEach(r=>option(select,'pending:'+r.orderId,r.input.commodity+' · paiement à vérifier'));
    if(Array.from(select.options).some(o=>o.value===current))select.value=current;
    el('goods-recovery').hidden=!select.options.length;el('goods-manual').hidden=!pending?.orderToken;
  }
  async function references(entity,query=''){
    const response=await fetch(API+'?action=references&entity='+entity+'&query='+encodeURIComponent(query),{cache:'no-store',signal:AbortSignal.timeout(25000)});
    const data=await response.json();if(!response.ok||!Array.isArray(data.rows))throw Error(data.error?.message||'Références GUCE indisponibles. Réessayez.');return data.rows;
  }
  function selectedCommodity(){const item=commodities.find(c=>c.code===el('goods-commodity').value);el('goods-description').textContent=item?item.code+' — '+item.description:'Le code SH et son libellé apparaîtront ici.';el('goods-units').required=!!item?.unit;el('goods-units-wrap').hidden=!item?.unit;el('goods-units-label').textContent='Quantité complémentaire · unité GUCE '+(item?.unit||'');if(!item?.unit)el('goods-units').value='';}
  function selectedCurrency(){
    const code=el('goods-currency').value,currency=currencies.find(c=>c.code===code),unit=code?' ('+code+')':'';
    el('goods-value-label').textContent='Prix des marchandises'+unit+' *';
    el('goods-freight-label').textContent='Prix du fret'+unit+' *';
    el('goods-rate').textContent=currency?'Taux GUCE : 1 '+currency.code+' = '+Number(currency.rate).toLocaleString('fr-FR')+' F CFA. Recontrôlé au calcul.':'Le taux de change est fourni par le GUCE.';preview();
  }
  function preview(){
    const i=input(),format=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:2})+' '+i.currency;
    try{const b=math.commercial(i.goodsValue,i.freight);el('goods-cfr-preview').textContent=format(b.cfr);el('goods-insurance-preview').textContent=format(b.insurance);el('goods-caf-preview').textContent=format(b.cif);}catch(_){['goods-cfr-preview','goods-insurance-preview','goods-caf-preview'].forEach(id=>el(id).textContent='—');}
    el('goods-carrier-note').textContent='Le tarif documentaire dépend de la compagnie. Son détail est inclus dans votre rapport après paiement confirmé.';
  }
  async function search(){
    clearTimeout(searchTimer);const query=el('goods-search').value.trim(),version=++searchVersion;
    if(query.length<2)return;
    el('goods-search-status').textContent='Identification du code SH…';
    try{
      const response=await fetch(API+'?action=classify&query='+encodeURIComponent(query),{signal:AbortSignal.timeout(25000)}),data=await response.json();
      if(version!==searchVersion||query!==el('goods-search').value.trim())return;
      if(!response.ok||!Array.isArray(data.rows))throw Error(data.error?.message||'Recherche indisponible. Réessayez.');
      commodities=data.rows;el('goods-commodity').value=data.selectedCode||'';el('goods-search-status').textContent=data.message;
      const box=el('goods-candidates');box.replaceChildren();box.hidden=!!data.selectedCode||!data.rows.length;
      for(const c of data.rows){const button=document.createElement('button');button.type='button';button.className='goods-candidate';button.textContent=c.description+' · '+c.code;button.addEventListener('click',()=>{el('goods-commodity').value=c.code;box.hidden=true;changed();el('goods-search-status').textContent='Code SH retenu pour votre marchandise.';});box.appendChild(button);}
      changed();
    }catch(error){if(version===searchVersion){el('goods-search-status').textContent=error.message;const button=document.createElement('button');button.type='button';button.textContent='Réessayer la recherche';button.className='sim-text-button';button.addEventListener('click',search);el('goods-search-status').appendChild(button);}}
  }
  function changed(){
    legacyInput=null;quote=null;paid=null;checkout(false);el('goods-result').hidden=true;el('goods-preview').hidden=false;el('goods-review').hidden=true;flow.step(1);selectedCommodity();selectedCurrency();
    flow.save(DRAFT,{input:input(),description:el('goods-description').textContent,raw:Object.fromEntries(ids.map(id=>[id,el(id).value]))});
  }
  function newCalculation(){
    if(busy||widgetOpen)return;
    if(pending?.orderToken&&!flow.remember(ORDERS,pending)){status('Impossible de conserver votre commande. Réessayez.');return;}
    ++searchVersion;clearTimeout(searchTimer);
    legacyInput=null;quote=null;paid=null;pending=null;commodities=[];
    el('goods-form').reset();el('goods-currency').value='XOF';el('goods-origin').value='';
    el('goods-carrier').value='';el('goods-container').value='20';el('goods-commodity').value='';
    el('goods-storage-days').value=feeConfig?.storage?.freeDays??11;
    el('goods-demurrage-days').value=feeConfig?.demurrage?.freeDays??14;
    window.ADTLClientContact.set({});
    document.querySelectorAll('#goods-form input, #goods-form select').forEach(field=>{field.setCustomValidity('');field.classList.remove('input-error');field.removeAttribute('aria-invalid');});
    ['goods-search-status','goods-pdf-status','goods-email-status','goods-paid-reference','goods-result-body'].forEach(id=>el(id).replaceChildren());
    el('goods-candidates').replaceChildren();el('goods-candidates').hidden=true;
    el('goods-report-email').value='';el('goods-report-email').setCustomValidity('');el('goods-customs-details').open=false;el('goods-transaction').value='';el('goods-email-retry').hidden=true;
    checkout(false);el('goods-result').hidden=true;el('goods-preview').hidden=false;el('goods-review').hidden=true;
    flow.save(DRAFT,null);try{sessionStorage.removeItem('adtl_goods_request_v1');}catch(_){}
    selectedCommodity();selectedCurrency();refreshHistory();flow.step(1);
    status('Nouveau calcul. Vos rapports payés restent disponibles dans votre historique.');
    el('goods-form').scrollIntoView({behavior:'smooth',block:'start'});el('goods-search').focus({preventScroll:true});
  }
  async function restoreInput(data,description){
    ++searchVersion;clearTimeout(searchTimer);el('goods-candidates').hidden=true;
    legacyInput=data.schema==='container-v1'&&allowedCurrency(data.currency)?null:data;
    const values=[data.model,data.origin,data.commodity,data.designation||description||data.commodity,data.goodsValue??'',data.freight??'',data.currency,data.netMass,data.units??'',data.containerSize||'20',data.carrier||'',data.storageDays??11,data.demurrageDays??14];
    ids.forEach((id,i)=>{const field=el(id);if(id!=='goods-currency'&&field.tagName==='SELECT'&&!Array.from(field.options).some(o=>o.value===String(values[i])))option(field,String(values[i]),String(values[i]));field.value=values[i];});
    document.querySelectorAll('[name="container-size"]').forEach(r=>r.checked=r.value===el('goods-container').value);
    if(data.commodity&&!commodities.some(x=>x.code===data.commodity))commodities.push({code:data.commodity,description:description||'Référence de votre simulation',unit:data.units===null?null:'à vérifier'});
    selectedCommodity();selectedCurrency();
  }
  function render(data){
    const result=data.result;
    if(result?.product!=='goods'||!Array.isArray(result.taxes)||!data.receiptToken)throw Error('Le rapport vérifié n’a pas été reçu. Réessayez sans payer à nouveau.');
    paid=data;el('goods-preview').hidden=true;el('goods-result').hidden=false;checkout(false);el('goods-review').hidden=true;
    el('goods-paid-reference').textContent='Référence KKiaPay : '+data.transactionId+' · Simulation ADTL : '+money(data.amount);
    el('goods-email-status').textContent=flow.reportEmailMessage(data);
    el('goods-report-email').value=data.customer?.email||'';
    el('goods-email-retry').hidden=data.notificationStatus!=='pending';
    const body=el('goods-result-body');body.replaceChildren();
    const heading=document.createElement('p');heading.textContent=result.input.commodity+' — '+result.input.description;heading.style.marginTop='22px';body.appendChild(heading);
    const row=(label,value)=>{const div=document.createElement('div');div.className='goods-result-row';const title=document.createElement('span'),valueNode=document.createElement('strong');title.textContent=label;valueNode.textContent=value;div.append(title,valueNode);body.appendChild(div);};
    row('Valeur statistique',money(result.input.statisticalValue));result.taxes.forEach(t=>row(t.code+' · '+t.description,money(t.amount)));
    const total=document.createElement('div');total.className='goods-total';total.textContent='Total des taxes renvoyées par le GUCE';const value=document.createElement('strong');value.textContent=money(result.totalTaxes);total.appendChild(value);body.appendChild(total);
    if(result.budget){
      const b=result.budget;
      row('Marchandises',money(b.commercialXof.goodsValue));row('Fret',money(b.commercialXof.freight));row('CFR',money(b.commercialXof.cfr));row('Assurance · 1 % du CFR',money(b.commercialXof.insurance));row('CAF',money(b.commercialXof.cif));
      const heading=document.createElement('h2');heading.textContent='Frais de votre '+result.input.containerSize+' pieds';body.appendChild(heading);
      row('Consignataire',b.local.carrier);b.local.items.forEach(f=>row(f.label,money(f.amount)));row('Total frais locaux',money(b.local.total));row('Douane et livraison (hors achat, fret, assurance)',money(b.totalClearance));row('Budget global (achat, fret et assurance inclus)',money(b.totalLanded));
    }
    row('Garantie indiquée par le GUCE',money(result.guaranteeAmount));row('Date du calcul',new Date(result.calculatedAt).toLocaleString('fr-FR'));
    flow.step(3);flow.track('result_viewed','goods');el('goods-result').scrollIntoView({behavior:'smooth',block:'center'});
  }
  async function accept(data,order){
    if(!data.receiptToken||!data.input||!data.result)throw Error('Résultat non reçu. Réessayez la vérification sans repayer.');
    const record={receiptToken:data.receiptToken,transactionId:data.transactionId,input:data.input,description:data.result.input.description,orderId:order?.orderId};
    if(!flow.remember(RECEIPTS,record))flow.download('Sauvegarde-simulation-'+data.transactionId+'.json',JSON.stringify(record));
    if(order?.orderId)flow.save(ORDERS,list(ORDERS).filter(o=>o.orderId!==order.orderId));
    pending=null;await restoreInput(data.input,record.description);render(data);refreshHistory();status('Paiement confirmé. Retrouvez votre rapport sur cet appareil sans repayer.');
    if(data.notificationStatus==='pending'&&data.customer?.email)await sendReportEmail(data.customer.email);
  }
  async function sendReportEmail(email){
    if(!paid?.receiptToken)return;
    const source=paid,stillCurrent=()=>paid?.transactionId===source.transactionId&&fp(input())===fp(source.input);
    el('goods-email-status').textContent='Envoi de votre rapport PDF à '+email+'…';
    const keep=job=>{if(stillCurrent())paid={...source,receiptToken:job.receiptToken,customer:job.customer,notificationStatus:job.notificationStatus,emailDeliveryStatus:job.emailDeliveryStatus};flow.remember(RECEIPTS,{receiptToken:job.receiptToken,transactionId:source.transactionId,input:source.input,description:source.result.input.description});};
    try{const sent=await flow.deliverReportEmail(API,source.receiptToken,email,keep);keep(sent);if(stillCurrent()){el('goods-email-status').textContent=flow.reportEmailMessage(sent);el('goods-email-retry').hidden=true;}}
    catch(error){if(stillCurrent()){el('goods-email-status').textContent=error.message;el('goods-email-retry').hidden=false;}}
  }
  async function resendReportEmail(){
    if(busy||widgetOpen||!paid)return;
    const field=el('goods-report-email');if(!field.reportValidity())return;
    setBusy(true);try{await sendReportEmail(field.value.trim());}finally{setBusy(false);}
  }
  async function restore(record){if(busy||widgetOpen)return;setBusy(true);status('Récupération du rapport payé…');try{const data=await flow.request(API,'result',{receiptToken:record.receiptToken});await accept(data,record);}catch(error){status(error.message);}finally{setBusy(false);}}
  async function verify(){
    if(busy||!pending?.transactionId||!pending?.orderToken)return;
    setBusy(true);status('Vérification de votre paiement auprès de KKiaPay…');const order={...pending};
    try{const data=await flow.request(API,'verify',{orderToken:order.orderToken,transactionId:order.transactionId});await accept(data,order);}
    catch(error){status(error.message+' Conservez votre reçu et utilisez Vérifier sans repayer.');}
    finally{setBusy(false);refreshHistory();}
  }
  async function prepare(event){
    event?.preventDefault();if(busy||widgetOpen)return;
    if(pending?.transactionId){await verify();return;}
    el('goods-customs-details').open=true;
    if(!el('goods-form').reportValidity())return;
    if(!el('goods-commodity').value){status('Précisez votre marchandise pour identifier son code SH.');await search();if(!el('goods-commodity').value){el('goods-search').focus();return;}}
    if(Number(el('goods-demurrage-days').value)<Number(el('goods-storage-days').value)){status('Le retour du conteneur vide doit être prévu après sa sortie du port.');return;}
    legacyInput=null;
    const values=input(), previous=list(RECEIPTS).find(r=>fp(r.input)===fp(values));if(previous)return restore(previous);
    if(!flow.available()){status('Autorisez le stockage du site pour conserver votre commande et votre rapport avant de continuer.');return;}
    setBusy(true);status('Le calcul GUCE est vérifié avant tout paiement…');el('goods-review').hidden=true;
    try{
      const data=await flow.request(API,'quote',{input:values});
      if(fp(values)!==fp(input()))throw Error('Les paramètres ont changé. Vérifiez à nouveau votre simulation.');
      if(!data.quoteToken||data.amount!==500||data.currency!=='XOF')throw Error('Le calcul n’est pas disponible. Aucun paiement n’a été ouvert.');
      quote={...data,fingerprint:fp(values)};el('goods-summary').textContent=values.model+' · '+values.commodity+' — '+data.description+' · '+math.commercial(values.goodsValue,values.freight).cif.toLocaleString('fr-FR')+' '+values.currency+' CAF · '+values.containerSize+' pieds'+' · '+values.netMass+' kg';
      checkout(true);el('goods-checkout-title').focus();flow.step(2);flow.track('form_validated','goods');status('Calcul disponible. Vérifiez le récapitulatif et vos coordonnées avant de payer.');
    }catch(error){status(error.message);el('goods-review').hidden=!(['guce_incomplete','invalid_simulation','fees_pending_validation'].includes(error.code));if(error.code==='guce_incomplete')flow.track('calculation_needs_review','goods');}
    finally{setBusy(false);}
  }
  async function widget(){
    if(widgetPromise)return widgetPromise;
    widgetPromise=new Promise((resolve,reject)=>{
      function connect(){if(typeof window.openKkiapayWidget!=='function'||typeof window.addSuccessListener!=='function'){reject(Error('KKiaPay est indisponible. Aucun paiement ouvert.'));return;}
        window.addSuccessListener(event=>{const transactionId=String(event?.transactionId||event?.transaction?.id||'');if(!pending||!transactionId){status('Conservez votre reçu KKiaPay et utilisez la récupération du paiement.');return;}pending={...pending,transactionId};flow.remember(ORDERS,pending);widgetOpen=false;queueMicrotask(verify);});
        window.addFailedListener?.(()=>{widgetOpen=false;setBusy(false);status('Paiement non confirmé. Si vous avez été débité, vérifiez la référence du reçu avant de réessayer.');refreshHistory();});
        window.addKkiapayCloseListener?.(()=>{widgetOpen=false;setBusy(false);status('Commande conservée. Si vous avez payé, saisissez votre référence KKiaPay pour récupérer le rapport.');refreshHistory();});resolve();}
      if(window.openKkiapayWidget){connect();return;}const script=document.createElement('script');script.src='https://cdn.kkiapay.me/k.js';script.onload=connect;script.onerror=()=>reject(Error('Impossible de charger KKiaPay. Vérifiez votre connexion.'));document.head.appendChild(script);
    }).catch(error=>{widgetPromise=null;throw error;});return widgetPromise;
  }
  async function pay(){
    if(busy||widgetOpen)return;if(pending?.transactionId)return verify();
    const values=input(),previous=list(RECEIPTS).find(r=>fp(r.input)===fp(values));if(previous)return restore(previous);
    if(!quote||quote.fingerprint!==fp(values)){status('Vérifiez d’abord le calcul de votre marchandise.');return;}
    if(!window.ADTLClientContact.validate(true))return;
    if(!flow.available()){status('Le stockage est indisponible. Aucun paiement ouvert.');return;}
    setBusy(true);status('Préparation de votre paiement…');
    try{
      const customer=window.ADTLClientContact.get();
      pending=list(ORDERS).find(o=>fp(o.input)===fp(values)&&JSON.stringify(o.customer)===JSON.stringify(customer))||null;
      if(!pending){const order=await flow.request(API,'order',{quoteToken:quote.quoteToken,customer});if(order.amount!==500||order.currency!=='XOF'||!order.orderToken||!order.publicKey)throw Error('Commande non valide. Aucun paiement ouvert.');pending={...order,description:quote.description};if(!flow.remember(ORDERS,pending))throw Error('Impossible de conserver la commande. Aucun paiement ouvert.');}
      await widget();if(fp(values)!==fp(input())||JSON.stringify(customer)!==JSON.stringify(window.ADTLClientContact.get()))throw Error('La saisie a changé. Vérifiez votre simulation.');
      widgetOpen=true;window.openKkiapayWidget({amount:pending.amount,key:pending.publicKey,sandbox:pending.sandbox,partnerId:pending.orderId,data:pending.orderId,theme:'#0A0A0A',position:'center',name:[customer.firstName,customer.lastName].join(' '),phone:customer.phone});
      flow.track('payment_started','goods');status('Terminez le paiement dans KKiaPay. Votre rapport apparaît après vérification.');
    }catch(error){widgetOpen=false;status(error.message);if(error.code==='quote_expired'){quote=null;checkout(false);}}
    finally{setBusy(false);refreshHistory();}
  }
  async function pdf(){
    if(!paid||fp(paid.input)!==fp(input()))return;
    const data=paid;el('goods-pdf').disabled=true;el('goods-pdf-status').textContent='Préparation du PDF…';
    try{
      const report=await flow.request(API,'report',{receiptToken:data.receiptToken});
      if(paid!==data||fp(data.input)!==fp(input()))throw Error('La simulation a changé. Rouvrez le rapport souhaité.');
      paid={...data,receiptToken:report.receiptToken,notificationStatus:report.notificationStatus,emailDeliveryStatus:report.emailDeliveryStatus};
      flow.remember(RECEIPTS,{receiptToken:report.receiptToken,transactionId:data.transactionId,input:data.input,description:data.result.input.description});
      flow.downloadReportFile(report);
      el('goods-email-status').textContent=flow.reportEmailMessage(report);
      el('goods-email-retry').hidden=report.notificationStatus!=='pending';
      el('goods-pdf-status').textContent='Téléchargement lancé. Consultez les téléchargements de votre navigateur.';
      if(report.notificationStatus==='pending')status('Votre rapport est disponible. L’envoi par e-mail sera réessayé à la prochaine ouverture.');
      flow.track('pdf_download_started','goods');
    }catch(error){el('goods-pdf-status').textContent=error.message+' Votre rapport payé reste disponible.';}finally{el('goods-pdf').disabled=false;}
  }
  async function boot(){
    setBusy(true);status('Chargement des références officielles GUCE…');
    try{const [countries,fx,cfg,fees]=await Promise.all([references('country'),references('exchangeRate'),flow.request(API,'config'),flow.request(API,'fees')]);currencies=fx.filter(c=>allowedCurrency(c.code));config=cfg;feeConfig=fees;fees.carriers.forEach(c=>option(el('goods-carrier'),c.id,c.label));
      const origin=el('goods-origin');origin.replaceChildren();option(origin,'','Choisissez le pays d’origine');countries.forEach(c=>option(origin,c.code,c.description+' ('+c.code+')'));
      const currency=el('goods-currency');currency.replaceChildren();CURRENCIES.forEach(([code,label])=>{const o=option(currency,code,label);o.disabled=!currencies.some(c=>c.code===code);});currency.value='XOF';
      const draft=flow.read(DRAFT);if(draft?.input){await restoreInput(draft.input,draft.description);if(draft.raw)ids.forEach(id=>{if(typeof draft.raw[id]==='string')el(id).value=draft.raw[id].slice(0,100);});if(!allowedCurrency(draft.input.currency))legacyInput=null;}selectedCurrency();status(draft?.input&&!currency.value?'Choisissez XOF, USD ou EUR et vérifiez vos montants : la devise de votre ancien brouillon n’est plus proposée.':config.enabled?'':'Paiement temporairement indisponible. Vos rapports payés restent récupérables.');
    }catch(error){status('Les références GUCE ne sont pas disponibles. Actualisez la page pour réessayer. Vos rapports payés restent accessibles.');}
    finally{setBusy(false);refreshHistory();}
  }
  el('goods-form').addEventListener('submit',prepare);
  el('goods-new-calculation').addEventListener('click',newCalculation);
  el('goods-email-retry').addEventListener('click',resendReportEmail);
  el('goods-email-send').addEventListener('click',resendReportEmail);
  el('goods-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  ids.filter(id=>id!=='goods-search').forEach(id=>el(id).addEventListener('change',changed));['goods-value','goods-freight','goods-mass','goods-units','goods-storage-days','goods-demurrage-days'].forEach(id=>el(id).addEventListener('input',changed));
  el('goods-search').addEventListener('input',()=>{++searchVersion;clearTimeout(searchTimer);el('goods-commodity').value='';el('goods-candidates').hidden=true;changed();searchTimer=setTimeout(search,650);});
  document.querySelectorAll('[name="container-size"]').forEach(r=>r.addEventListener('change',()=>{el('goods-container').value=r.value;changed();}));
  el('goods-pay').addEventListener('click',pay);el('goods-edit').addEventListener('click',()=>{checkout(false);el('goods-search').focus();flow.step(1);});el('goods-pdf').addEventListener('click',pdf);
  el('goods-history-open').addEventListener('click',async()=>{const value=el('goods-history').value;if(value.startsWith('paid:')){const record=list(RECEIPTS).find(r=>r.transactionId===value.slice(5));if(record)await restore(record);}else{const order=list(ORDERS).find(r=>r.orderId===value.slice(8));if(!order)return;pending=order;await restoreInput(order.input,order.description);window.ADTLClientContact.set(order.customer);refreshHistory();status('Commande retrouvée. Déjà payé ? Saisissez la référence KKiaPay pour vérifier sans repayer.');if(order.transactionId)await verify();}});
  el('goods-verify').addEventListener('click',()=>{const transactionId=el('goods-transaction').value.trim();if(!pending||!/^[A-Za-z0-9_-]{4,128}$/.test(transactionId)){status('Choisissez la commande puis saisissez la référence du reçu KKiaPay.');return;}pending={...pending,transactionId};flow.remember(ORDERS,pending);verify();});
  el('goods-support').addEventListener('click',()=>{const values=input();try{sessionStorage.setItem('adtl_goods_request_v1',JSON.stringify({createdAt:Date.now(),input:values,description:el('goods-description').textContent}));location.assign('/demande?service='+(values.model==='EX-1'?'exportation':'importation')+'&from=calculateur');}catch(_){status('Votre navigateur ne permet pas la reprise. Utilisez notre page Demande de service.');}});
  flow.track('simulation_view','goods');boot();
})();
