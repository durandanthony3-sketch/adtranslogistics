'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const math=require('../assets/goods-budget.js'),{createGoodsEngine,normalizeInput}=require('../lib/goods-engine.cjs');
const draft=require('../lib/container-fees.cjs'),f=require('./fixtures/goods-container.cjs');
const engine=options=>createGoodsEngine({fees:f.fees,fetch:f.transport(),...options});
test('CFR, 1% insurance and CIF reconcile including decimal amounts',()=>{
  assert.deepEqual(math.commercial(5000000,1000000),{goodsValue:5000000,freight:1000000,cfr:6000000,insurance:60000,insuranceRate:.01,cif:6060000});
  const x=math.commercial(1.005,1.005);assert.equal(x.cfr,x.goodsValue+x.freight);
  for(const n of [-1,NaN,Infinity,'500'])assert.throws(()=>math.commercial(n,10));
});
test('20/40 fees, currency conversion and one operations bundle without duplicate visa',()=>{
  const a=math.local(f.input,f.fees,f.rates),b=math.local({...f.input,containerSize:'40'},f.fees,f.rates);
  assert.equal(a.items.find(i=>i.id==='thc').amount,175000);assert.equal(b.items.find(i=>i.id==='thc').amount,265000);
  assert.equal(a.items.find(i=>i.id==='exchange').amount,20000.13);assert.equal(b.items.find(i=>i.id==='exchange').amount,40000.26);
  assert.equal(a.items.filter(i=>i.id==='operations').length,1);assert.equal(a.items.find(i=>i.id==='operations').amount,100000);
  assert.equal(a.total,math.round(a.items.reduce((n,i)=>n+i.amount,0)));
});
test('free days, first charged day and progressive bands are inclusive correctly',()=>{
  assert.equal(math.delay(11,11,f.fees.storage.bands,'20').amount,0);
  assert.equal(math.delay(12,11,f.fees.storage.bands,'20').amount,1000);
  assert.equal(math.delay(17,11,f.fees.storage.bands,'20').amount,8000);
  assert.equal(math.delay(14,14,f.fees.demurrage.bands,'40').amount,0);
  assert.equal(math.delay(15,14,f.fees.demurrage.bands,'40').amount,12000);
  assert.equal(math.delay(22,14,f.fees.demurrage.bands,'40').amount,104000);
  assert.equal(math.delay(12,11,null,'20').amount,null);
});
test('missing fees are not zero and unvalidated defaults prevent new paid quotes',async()=>{
  const b=math.local(f.input,draft,f.rates);assert.equal(b.total,null);assert.ok(b.missing.some(n=>n.includes('GUCE')));
  await assert.rejects(createGoodsEngine({fetch:f.transport()}).compute(f.input),e=>e.code==='fees_pending_validation');
  const unknown=structuredClone(f.fees);unknown.fees.find(f=>f.id==='guce').amounts[20]=null;
  await assert.rejects(engine({fees:unknown}).compute(f.input),e=>e.code==='fees_pending_validation');
});
test('server rejects injected totals, insurance, fees, invalid count/days and unsupported scope',()=>{
  for(const patch of [{totalLanded:1},{insurance:0},{fees:[]},{cif:1},{containerSize:'45'},{model:'EX-1'},{carrier:'injected'},{storageDays:-1},{storageDays:15,demurrageDays:14},{storageDays:1.5},{goodsValue:Infinity}])assert.throws(()=>normalizeInput({...f.input,...patch}));
});
test('GUCE receives computed CAF once; logistics fees do not enter the customs base',async()=>{
  const seen=[],r=await engine({fetch:f.transport({seen})}).compute(f.input);
  const payload=seen.find(s=>s.url.includes('sad/simulation')).body;
  assert.equal(payload.items[0].statisticalValue,6060000);assert.equal(payload.items[0].statValueInForeignCurrency,6060000);
  assert.equal(r.budget.totalLanded,math.round(6060000+r.totalTaxes+r.budget.local.total));
  assert.equal(r.budget.totalClearance,math.round(r.totalTaxes+r.budget.local.total));
});
test('foreign currency converts the complete CAF with current GUCE exchange rate',async()=>{
  const r=await engine().compute({...f.input,goodsValue:10000,freight:2000,currency:'EUR'});
  assert.equal(r.input.statisticalValue,12120*f.rates.EUR);
  assert.equal(r.budget.commercialXof.insurance,78714.84);
});
test('partial official response cannot produce a chargeable report',async()=>{
  await assert.rejects(engine({fetch:f.transport({partial:true})}).compute(f.input),e=>e.code==='guce_incomplete');
});
test('designation resolves a unique reference; ambiguous selection is never automatic',async()=>{
  const good=await engine().classify(f.input.designation);assert.equal(good.selectedCode,'9403100000');
  const ambiguous=await engine({fetch:f.transport({ambiguous:true})}).classify('meubles');assert.equal(ambiguous.selectedCode,null);assert.equal(ambiguous.rows.length,2);
});
test('legacy goods input still computes without introducing container fees',async()=>{
  const i={model:'IM-4',origin:'CN',commodity:'9403100000',cif:1000000,currency:'XOF',netMass:100,units:null};
  const r=await engine().compute(i);assert.equal(r.input.cif,1000000);assert.equal(r.budget,undefined);assert.deepEqual(normalizeInput(i),i);
});
