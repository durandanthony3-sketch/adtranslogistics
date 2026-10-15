'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createGoodsEngine}=require('../lib/goods-engine.cjs');
const {createPaymentService}=require('../lib/payment-service.cjs');
const {createSimulationReport}=require('../lib/simulation-report.cjs');
const handler=require('../api/goods.js');
const fixture=require('./fixtures/goods-container.cjs');
const env={PAYMENT_ENABLED:'true',KKIAPAY_SANDBOX:'true',KKIAPAY_PUBLIC_KEY:'local-public',KKIAPAY_PRIVATE_KEY:'local-private',KKIAPAY_SECRET_KEY:'local-secret',ADTL_PAYMENT_SIGNING_SECRET:'local-test-secret-at-least-thirty-two-characters'};
const device='a'.repeat(64),customer={firstName:'Test',lastName:'Local',phone:'+2290197000000',email:'test@example.com'};
function setup(){
  const engine=createGoodsEngine({fees:fixture.fees,fetch:fixture.transport()});
  let transaction;const notifications=[];
  const service=createPaymentService({env,product:'goods',compute:engine.compute,normalizeInput:engine.normalizeInput,fetch:async()=>({ok:true,text:async()=>JSON.stringify(transaction)}),notifySubmission:async s=>notifications.push(s)});
  return {service,notifications,setTransaction:t=>transaction=t};
}
function assertNoReport(value){
  assert.equal(value.result,undefined);assert.equal(value.budget,undefined);assert.equal(value.fees,undefined);assert.equal(value.contentBase64,undefined);
  assert.doesNotMatch(JSON.stringify(value),/THC|manutention|175000|265000|knownSubtotal|totalLanded|sourceAmount/);
}
test('public fees endpoint exposes only form choices, never tariff details or amounts',async()=>{
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(body){this.body=JSON.parse(body);}};
  await handler({method:'GET',url:'/api/goods?action=fees'},res);
  assert.equal(res.statusCode,200);assert.match(res.headers['Cache-Control'],/no-store/);assert.equal(res.headers['Vercel-CDN-Cache-Control'],'no-store');
  assert.deepEqual(Object.keys(res.body).sort(),['approved','carriers','demurrage','storage']);
  for(const carrier of res.body.carriers)assert.deepEqual(Object.keys(carrier).sort(),['id','label']);
  assert.deepEqual(res.body.storage,{freeDays:11});assert.deepEqual(res.body.demurrage,{freeDays:14});assertNoReport(res.body);
  const approved=createGoodsEngine({fees:fixture.fees}).fees();assert.equal(approved.approved,true);assertNoReport(approved);
});
test('quote and unpaid order do not expose calculated container fees or allow report recovery',async()=>{
  const s=setup(),quote=await s.service.quote({input:fixture.input},device);assertNoReport(quote);
  const order=await s.service.order({quoteToken:quote.quoteToken,customer},device);assertNoReport(order);
  for(const receiptToken of [quote.quoteToken,order.orderToken,'forged']){
    await assert.rejects(s.service.result({receiptToken},device),{code:'invalid_token'});
    await assert.rejects(s.service.report({receiptToken},device),{code:'invalid_token'});
    await assert.rejects(s.service.email({receiptToken,email:customer.email},device),{code:'invalid_token'});
  }
  s.setTransaction({transactionId:'QA_UNPAID',partnerId:order.orderId,amount:500,currency:'XOF',status:'PENDING',type:'DEBIT'});
  await assert.rejects(s.service.verify({orderToken:order.orderToken,transactionId:'QA_UNPAID'},device),{code:'payment_mismatch'});assert.equal(s.notifications.length,0);
});
for(const containerSize of ['20','40'])test('verified '+containerSize+' foot report retains fees in result, download and email copy',async()=>{
  const s=setup(),quote=await s.service.quote({input:{...fixture.input,containerSize}},device);
  const order=await s.service.order({quoteToken:quote.quoteToken,customer},device);
  s.setTransaction({transactionId:'QA_PAID_'+containerSize,partnerId:order.orderId,amount:500,currency:'XOF',status:'SUCCESS',type:'DEBIT'});
  const paid=await s.service.verify({orderToken:order.orderToken,transactionId:'QA_PAID_'+containerSize},device);
  assert.equal(paid.result.budget.local.items.find(f=>f.id==='thc').amount,containerSize==='20'?175000:265000);
  assert.deepEqual(s.notifications[0].result.budget,paid.result.budget);
  const emailed=createSimulationReport(s.notifications[0]),downloaded=await s.service.report({receiptToken:paid.receiptToken},device);
  assert.equal(downloaded.contentBase64,emailed.bytes.toString('base64'));assert.equal(downloaded.sha256,emailed.sha256);
  const resend=await s.service.email({receiptToken:paid.receiptToken,email:customer.email},device);assert.equal(resend.contentBase64,downloaded.contentBase64);
  const recovered=await s.service.result({receiptToken:paid.receiptToken},device);assert.deepEqual(recovered.result.budget,paid.result.budget);
  await assert.rejects(s.service.result({receiptToken:paid.receiptToken},'b'.repeat(64)),{code:'invalid_token'});
});
