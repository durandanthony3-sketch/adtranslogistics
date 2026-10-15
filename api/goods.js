'use strict';
const {createHttpHandler,PaymentError}=require('../lib/payment-service.cjs');
const {createGoodsEngine}=require('../lib/goods-engine.cjs');
const {createSubmissionNotifier}=require('../lib/submission-notification.cjs');
const engine=createGoodsEngine();
const payment=createHttpHandler({product:'goods',normalizeInput:engine.normalizeInput,compute:engine.compute,notifySubmission:createSubmissionNotifier()});
module.exports=async function(req,res){
  const url=new URL(req.url,'https://www.adtranslogistics.com');
  const action=url.searchParams.get('action');
  if(!['references','classify','fees'].includes(action))return payment(req,res);
  res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public, max-age=0, s-maxage=300');
  if(action==='fees'){
    res.setHeader('Cache-Control','private, no-store, max-age=0');
    res.setHeader('CDN-Cache-Control','no-store');
    res.setHeader('Vercel-CDN-Cache-Control','no-store');
  }
  try{
    if(req.method!=='GET'){res.setHeader('Allow','GET');throw new PaymentError('method_not_allowed','Méthode non autorisée.',405);}
    const data=action==='fees'?engine.fees():action==='classify'?await engine.classify(url.searchParams.get('query')||''):{rows:await engine.references(url.searchParams.get('entity'),url.searchParams.get('query')||'')};
    res.statusCode=200;res.end(JSON.stringify(data));
  }catch(error){res.setHeader('Cache-Control','no-store');res.statusCode=error instanceof PaymentError?error.status:503;res.end(JSON.stringify({error:{code:error.code||'unavailable',message:error instanceof PaymentError?error.message:'Les références GUCE sont temporairement indisponibles.'}}));}
};
