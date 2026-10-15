(function(root){
  'use strict';
  function read(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch(_){return fallback;}}
  function save(key,value){try{value===null?localStorage.removeItem(key):localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}}
  function remember(key,record){
    const list=read(key,[]); if(!Array.isArray(list))return false;
    const id=record.transactionId||record.orderId;
    return save(key,[record,...list.filter(x=>(x.transactionId||x.orderId)!==id)]);
  }
  async function request(api,action,body,timeoutMs=55000){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
    try{
      const res=await fetch(api+'?action='+encodeURIComponent(action),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'same-origin',signal:controller.signal});
      let data;try{data=await res.json();}catch(_){throw Error('Le service ne répond pas. Votre saisie est conservée. Réessayez.');}
      if(!res.ok){const error=Error(data.error?.message||'La vérification n’a pas abouti. Réessayez sans payer à nouveau.');error.code=data.error?.code;throw error;}
      return data;
    }catch(error){if(error.name==='AbortError')throw Error('La réponse prend trop de temps. Votre référence est conservée : vérifiez le paiement sans repayer.');throw error;}
    finally{clearTimeout(timer);}
  }
  function track(name,product){
    try{if(localStorage.getItem('adtl_cookie_consent')!=='accepted')return;root.va?.('event',{name,data:{product}});}catch(_){}
  }
  function step(n){document.querySelectorAll('.sim-progress li').forEach((el,i)=>{el.classList.toggle('done',i+1<n);if(i+1===n)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});}
  function available(){const key='adtl_storage_probe';return save(key,true)&&save(key,null);}
  function download(name,text,type='application/json') { const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  function downloadReportFile(report) {
    if (!/^Rapport-ADTL-[A-Za-z0-9_-]+\.pdf$/.test(report?.filename || '') || typeof report.contentBase64 !== 'string') throw Error('Le rapport reçu est invalide. Réessayez sans repayer.');
    const bytes=Uint8Array.from(atob(report.contentBase64),c=>c.charCodeAt(0));
    if(String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Le PDF reçu est incomplet. Réessayez.');
    download(report.filename,bytes,'application/pdf');
  }
  function reportEmailMessage(data) {
    const email=data?.customer?.email||data?.email;
    if(!email)return 'Ce rapport ancien ne comporte pas d’adresse e-mail enregistrée. Téléchargez-le ou contactez AD TRANS LOGISTICS pour un envoi.';
    return data.emailDeliveryStatus==='sent'
      ? 'Rapport transmis par e-mail à '+email+'. Pensez à vérifier les courriers indésirables.'
      : 'L’envoi à '+email+' doit être réessayé. Votre PDF reste téléchargeable, sans nouveau paiement.';
  }
  async function deliverReportEmail(api, receiptToken, email, prepared) {
    const job = await request(api,'email',{receiptToken,email});
    prepared?.(job);
    const submission=job.emailSubmission, next=new URL(submission?.payload?._next||'',location.origin);
    if(submission?.endpoint!=='https://formsubmit.co/adtranslogistics@hotmail.com'||next.origin!==location.origin||next.pathname!=='/rapport-envoi-confirme'||!/^[a-f0-9]{48}$/.test(submission.attempt))throw Error('Envoi du rapport indisponible. Réessayez.');
    const frame=document.createElement('iframe'), form=document.createElement('form');
    frame.name='adtl-mail-'+submission.attempt;frame.hidden=true;frame.title='Confirmation de l’envoi du rapport';
    form.method='POST';form.action=submission.endpoint;form.target=frame.name;form.enctype='multipart/form-data';form.hidden=true;
    for(const [name,value] of Object.entries(submission.payload)){if(value==null)continue;const field=document.createElement('input');field.type='hidden';field.name=name;field.value=String(value);form.appendChild(field);}
    const attachment=document.createElement('input');attachment.type='file';attachment.name='attachment';
    const transfer=new DataTransfer();transfer.items.add(new File([Uint8Array.from(atob(job.contentBase64),c=>c.charCodeAt(0))],job.filename,{type:'application/pdf'}));attachment.files=transfer.files;form.appendChild(attachment);
    document.body.append(frame,form);
    try{
      await new Promise((resolve,reject)=>{
        const cleanup=()=>{clearTimeout(timer);window.removeEventListener('message',accepted);};
        const accepted=event=>{if(event.origin===location.origin&&event.source===frame.contentWindow&&event.data?.type==='adtl-report-email-accepted'&&event.data.attempt===submission.attempt){cleanup();resolve();}};
        const timer=setTimeout(()=>{cleanup();reject(Error('L’envoi par e-mail n’a pas pu être confirmé. Réessayez ; votre PDF reste disponible.'));},30000);
        window.addEventListener('message',accepted);
        try{form.submit();}catch(error){cleanup();reject(error);}
      });
      return await request(api,'emailConfirm',{receiptToken:job.receiptToken,attempt:submission.attempt});
    }finally{form.remove();frame.remove();}
  }
  root.ADTLFlow={read,save,remember,request,track,step,available,download,downloadReportFile,reportEmailMessage,deliverReportEmail};
})(window);
