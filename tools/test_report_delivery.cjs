'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createPaymentService, createHttpHandler, COOKIE_NAME } = require('../lib/payment-service.cjs');
const { compute, normalizeInput } = require('../lib/simulator-engine.cjs');
const { createSimulationReport, REPORT_VERSION } = require('../lib/simulation-report.cjs');
const { createSubmissionNotifier, submissionPayload, CONFIRMATION_URL } = require('../lib/submission-notification.cjs');
const { normalizeEmail } = require('../lib/customer-email.cjs');
const env = { PAYMENT_ENABLED:'true', KKIAPAY_SANDBOX:'true', KKIAPAY_PUBLIC_KEY:'qa-public', KKIAPAY_PRIVATE_KEY:'qa-private', KKIAPAY_SECRET_KEY:'qa-secret', ADTL_PAYMENT_SIGNING_SECRET:'qa-only-signing-secret-more-than-32-characters' };
const device = 'a'.repeat(64);
const customer = { firstName:'Vérification', lastName:'Locale', phone:'+2290197000000', email:'client@example.com' };
const input = { brand:'LAND ROVER', model:'EVOQUE', year:2014, type:'suv', taxpayer:'physique', origin:'europe', destination:'benin', tgc:false, valuationSource:'transaction', transaction:{value:10000,currency:'EUR',basis:'fob'} };
const fixture = { product:'vehicle', input:normalizeInput(input), result:compute(input), customer, orderId:'b'.repeat(32), transactionId:'QA_LOCAL_2309', createdAt:'2026-09-23T17:00:00.000Z', verifiedAt:'2026-09-23T17:01:00.000Z', amount:500, currency:'XOF' };
function serviceSetup(options = {}) {
  let transaction, submissions=[];
  const service=createPaymentService({env,compute,normalizeInput,now:()=>Date.parse(fixture.verifiedAt),fetch:async()=>({ok:true,text:async()=>JSON.stringify(transaction)}),notifySubmission:async s=>submissions.push(s),...options});
  return {service,submissions,setTransaction: t=>{transaction=t;}};
}
async function pay(setup) {
  const order=await setup.service.order({input,customer},device);
  setup.setTransaction({transactionId:fixture.transactionId,partnerId:order.orderId,amount:500,currency:'XOF',status:'SUCCESS',type:'DEBIT'});
  return {order,paid:await setup.service.verify({orderToken:order.orderToken,transactionId:fixture.transactionId},device)};
}
function rewriteTestToken(token, mutate) {
  const [v,iv,data,tag]=token.split('.'); const key=crypto.createHash('sha256').update(env.ADTL_PAYMENT_SIGNING_SECRET).digest();
  const decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));decipher.setAAD(Buffer.from('adtl.simulation.payment.v1'));decipher.setAuthTag(Buffer.from(tag,'base64url'));
  const receipt=JSON.parse(Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]));mutate(receipt);
  const nonce=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(Buffer.from('adtl.simulation.payment.v1'));
  const bytes=Buffer.concat([cipher.update(JSON.stringify(receipt)),cipher.final()]);return [v,nonce.toString('base64url'),bytes.toString('base64url'),cipher.getAuthTag().toString('base64url')].join('.');
}
function legacyReceipt(token) { return rewriteTestToken(token, receipt => { delete receipt.reportCopyVersion; delete receipt.clientEmailVersion; delete receipt.customer.email; receipt.notificationStatus='sent'; }); }
test('paid snapshot supplies the same PDF bytes to the merchant and customer', async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);assert.equal(setup.submissions.length,1);
  assert.deepEqual(setup.submissions[0].result,fixture.result);
  const sent=createSimulationReport(setup.submissions[0]);const downloaded=await setup.service.report({receiptToken:paid.receiptToken},device);
  assert.equal(downloaded.contentBase64,sent.bytes.toString('base64'));assert.equal(downloaded.sha256,sent.sha256);assert.equal(downloaded.filename,sent.filename);assert.equal(setup.submissions.length,1);
  assert.equal(paid.emailDeliveryStatus,'sent');assert.equal(downloaded.email,customer.email);assert.equal(downloaded.emailDeliveryStatus,'sent');
  assert.equal(setup.service.config().reportCopyVersion,REPORT_VERSION);
  assert.equal(setup.service.config().customerEmailRequired,true);
});
test('invalid payment amount, currency, order or status never sends a report',async()=>{
  for(const mutation of [{amount:1},{currency:'EUR'},{partnerId:'c'.repeat(32)},{status:'FAILED'},{type:'CREDIT'},{transactionId:'OTHER_1234'}]){
    const setup=serviceSetup();const order=await setup.service.order({input,customer},device);
    setup.setTransaction({transactionId:fixture.transactionId,partnerId:order.orderId,amount:500,currency:'XOF',status:'SUCCESS',type:'DEBIT',...mutation});
    await assert.rejects(()=>setup.service.verify({orderToken:order.orderToken,transactionId:fixture.transactionId},device),{code:'payment_mismatch'});assert.equal(setup.submissions.length,0);
  }
});
test('report rejects another device, unsigned tokens, unpaid orders and injected fields',async()=>{
  const setup=serviceSetup();const {order,paid}=await pay(setup);
  for(const [body,d] of [[{receiptToken:paid.receiptToken},'d'.repeat(64)],[{receiptToken:'v1.invalid.invalid.invalid'},device],[{receiptToken:order.orderToken},device],[{receiptToken:paid.receiptToken,result:{total:0}},device]])await assert.rejects(()=>setup.service.report(body,d));
  assert.equal(setup.submissions.length,1);
});
test('mail failure preserves paid report and can be retried without charging again',async()=>{
  let attempts=0;const setup=serviceSetup({notifySubmission:async()=>{if(++attempts===1)throw Error('mail unavailable');}});
  const {paid}=await pay(setup);assert.equal(paid.notificationStatus,'pending');
  assert.equal(paid.emailDeliveryStatus,'pending');
  const report=await setup.service.report({receiptToken:paid.receiptToken},device);assert.equal(report.notificationStatus,'sent');assert.ok(report.contentBase64.startsWith('JVBER'));assert.equal(attempts,2);
  assert.equal(report.emailDeliveryStatus,'sent');
  await setup.service.report({receiptToken:report.receiptToken},device);assert.equal(attempts,2);
});
test('old notification without attachment is upgraded once on authenticated recovery',async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);const old=legacyReceipt(paid.receiptToken);
  const recovered=await setup.service.result({receiptToken:old},device);assert.equal(setup.submissions.length,2);assert.notEqual(recovered.receiptToken,old);
  assert.equal(recovered.emailDeliveryStatus,'missing_email');
  await setup.service.report({receiptToken:recovered.receiptToken},device);assert.equal(setup.submissions.length,2);
});
test('multipart uses the attachment endpoint and confirms only the expected redirect',async()=>{
  const report=createSimulationReport(fixture);let called=0;
  const notify=createSubmissionNotifier({fetch:async(url,options)=>{
    called++;assert.equal(url,'https://formsubmit.co/adtranslogistics@hotmail.com');assert.equal(options.redirect,'manual');assert.ok(!options.headers['Content-Type']);
    assert.equal(options.body.get('_next'),CONFIRMATION_URL);assert.equal(options.body.get('Empreinte_PDF_SHA256'),report.sha256);
    assert.equal(options.body.get('_cc'),customer.email);assert.equal(options.body.get('_replyto'),'adtranslogistics@hotmail.com');
    const file=options.body.get('attachment');assert.equal(file.name,report.filename);assert.equal(file.type,'application/pdf');assert.deepEqual(Buffer.from(await file.arrayBuffer()),report.bytes);
    return {status:302,headers:new Headers({location:CONFIRMATION_URL})};
  }});await notify(fixture);assert.equal(called,1);
  for(const response of [{status:200,headers:new Headers()},{status:302,headers:new Headers({location:'https://unexpected.example/'})},{status:500,headers:new Headers()}])await assert.rejects(()=>createSubmissionNotifier({fetch:async()=>response})(fixture));
});
test('new orders require one valid email, without recipient/header injection',async()=>{
  const setup=serviceSetup();const {email,...withoutEmail}=customer;
  for(const c of [withoutEmail,...['','bad-address','a@example.com,b@example.com','a@example.com;b@example.com','a@example.com\r\nBcc:b@example.com','<a@example.com>','.name@example.com','a..b@example.com','a@-domain.com','a@domain..com'].map(email=>({...customer,email}))]){
    await assert.rejects(()=>setup.service.order({input,customer:c},device),{code:'invalid_email'});
  }
  const order=await setup.service.order({input,customer:{...customer,email:' Client+Auto@Example.COM '}},device);assert.equal(order.customer.email,'client+auto@example.com');assert.equal(setup.submissions.length,0);
  await assert.rejects(()=>setup.service.order({input,customer:{...customer,_cc:'another@example.com'}},device),{code:'invalid_request'});
  assert.equal(normalizeEmail('client@example.com\nbcc:other@example.com'),null);
});
test('notifier refuses recipient injection independently and does not duplicate the company address',()=>{
  for(const email of ['a@example.com,b@example.com','x@example.com\r\nBcc:y@example.com','not-an-email'])assert.throws(()=>submissionPayload({...fixture,customer:{...customer,email}}),/invalid_customer_email/);
  assert.equal(submissionPayload({...fixture,customer:{...customer,email:'adtranslogistics@hotmail.com'}})._cc,undefined);
});
test('already-open legacy orders may use only the verified provider address',async()=>{
  const setup=serviceSetup();const order=await setup.service.order({input,customer},device);
  const oldOrder=rewriteTestToken(order.orderToken,payload=>{delete payload.customer.email;});
  setup.setTransaction({transactionId:fixture.transactionId,partnerId:order.orderId,amount:500,status:'SUCCESS',type:'DEBIT',client:{email:'legacy@example.com'}});
  const paid=await setup.service.verify({orderToken:oldOrder,transactionId:fixture.transactionId},device);
  assert.equal(paid.customer.email,'legacy@example.com');assert.equal(paid.emailDeliveryStatus,'sent');assert.equal(setup.submissions[0].customer.email,'legacy@example.com');
});
test('an old merchant-only notification with an email upgrades client delivery once',async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);const old=rewriteTestToken(paid.receiptToken,payload=>{delete payload.clientEmailVersion;});
  const recovered=await setup.service.result({receiptToken:old},device);assert.equal(recovered.emailDeliveryStatus,'sent');assert.equal(setup.submissions.length,2);
  await setup.service.result({receiptToken:recovered.receiptToken},device);assert.equal(setup.submissions.length,2);
});
test('report recovery cannot redirect the bound email address',async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);
  await assert.rejects(()=>setup.service.report({receiptToken:paid.receiptToken,email:'different@example.com'},device),{code:'invalid_request'});
  assert.equal(setup.submissions.length,1);
});
test('notification timeout cannot block the paid customer indefinitely',async()=>{
  const notify=createSubmissionNotifier({timeoutMs:5,fetch:()=>new Promise(()=>{})});await assert.rejects(()=>notify(fixture),{message:'notification_timeout'});
});
test('goods PDF preserves all GUCE taxes and inputs',()=>{
  const g={model:'IM-4',origin:'CN',originLabel:'Chine',commodity:'9403100000',description:'Mobilier métallique - fixture locale',cif:1000000,currency:'XOF',exchangeRate:1,statisticalValue:1000000,netMass:100,units:null};
  const taxes=Array.from({length:25},(_,n)=>({code:'T'+n,description:'Taxe de contrôle locale '+n,amount:100,baseAmount:1000,rate:10}));
  const result={product:'goods',input:g,calculatedAt:fixture.createdAt,taxes,totalTaxes:2500,guaranteeAmount:0,source:'https://guce.gouv.bj/fr/tools/taxation-simulation-customs',scope:'Fixture QA locale, aucune demande GUCE envoyée.'};
  const report=createSimulationReport({...fixture,product:'goods',input:g,result});assert.ok(report.bytes.length>10000);
  if(process.env.REPORT_QA_DIR){fs.mkdirSync(process.env.REPORT_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REPORT_QA_DIR,'qa-marchandises.pdf'),report.bytes);}
});
test('HTTP download route requires the authenticated device cookie and approved origin',async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);const handler=createHttpHandler({service:setup.service,env});
  async function invoke(cookie,origin='https://www.adtranslogistics.com'){
    const req={method:'POST',url:'/api/sim-pay?action=report',headers:{'content-type':'application/json',origin,...(cookie?{cookie}: {})},body:{receiptToken:paid.receiptToken}};
    const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}};await handler(req,res);return res;
  }
  assert.equal((await invoke()).statusCode,403);assert.equal((await invoke(COOKIE_NAME+'='+device,'https://untrusted.example')).statusCode,403);
  const response=await invoke(COOKIE_NAME+'='+device);assert.equal(response.statusCode,200);assert.match(response.headers['Cache-Control'],/no-store/);assert.ok(response.body.contentBase64);
});
if(process.env.REPORT_QA_DIR){fs.mkdirSync(process.env.REPORT_QA_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.REPORT_QA_DIR,'qa-vehicule.pdf'),createSimulationReport(fixture).bytes);}


test('browser delivery requires a paid device-bound receipt and retains the canonical PDF',async()=>{
  const setup=serviceSetup();const {order,paid}=await pay(setup);
  for(const token of [order.orderToken,'invalid'])await assert.rejects(()=>setup.service.email({receiptToken:token,email:customer.email},device));
  await assert.rejects(()=>setup.service.email({receiptToken:paid.receiptToken,email:customer.email},'f'.repeat(64)));
  await assert.rejects(()=>setup.service.email({receiptToken:paid.receiptToken,email:'x@example.com,y@example.com'},device),{code:'invalid_email'});
  const job=await setup.service.email({receiptToken:paid.receiptToken,email:'corrected@example.com'},device);
  assert.equal(job.customer.email,'corrected@example.com');assert.equal(job.emailSubmission.payload._cc,'corrected@example.com');assert.ok(job.contentBase64.startsWith('JVBER'));
  const before=setup.submissions.length;
  await assert.rejects(()=>setup.service.emailConfirm({receiptToken:job.receiptToken,attempt:'0'.repeat(48)},device));
  await assert.rejects(()=>setup.service.emailConfirm({receiptToken:paid.receiptToken,attempt:job.emailSubmission.attempt},device));
  const expired=rewriteTestToken(job.receiptToken,r=>{r.emailAttempt.expiresAt=0;});
  await assert.rejects(()=>setup.service.emailConfirm({receiptToken:expired,attempt:job.emailSubmission.attempt},device));
  const sent=await setup.service.emailConfirm({receiptToken:job.receiptToken,attempt:job.emailSubmission.attempt},device);
  assert.equal(sent.emailDeliveryStatus,'sent');
  const report=await setup.service.report({receiptToken:sent.receiptToken},device);assert.equal(report.email,'corrected@example.com');assert.equal(report.contentBase64,job.contentBase64);assert.equal(setup.submissions.length,before);
});

test('old paid reports can add their missing address without a new payment',async()=>{
  const setup=serviceSetup();const {paid}=await pay(setup);
  const job=await setup.service.email({receiptToken:legacyReceipt(paid.receiptToken),email:customer.email},device);
  assert.equal(job.emailSubmission.payload._cc,customer.email);assert.ok(job.receiptToken);assert.equal(setup.submissions.length,1);
});
