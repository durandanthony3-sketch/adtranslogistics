(function(){
  try{
    if(location.pathname.indexOf('/en')===0) return;
    try{ if(localStorage.getItem('adtl_lang_dismiss')) return; }catch(e){}
    var l=(navigator.language||navigator.userLanguage||'').toLowerCase();
    if(!l||l.indexOf('fr')===0) return;
    var msg={en:'View this site in English',zh:'\u67e5\u770b\u672c\u7f51\u7ad9\u82f1\u6587\u7248',ar:'\u0639\u0631\u0636 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0627\u0644\u0644\u063a\u0629 \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',es:'Ver este sitio en ingl\u00e9s',pt:'Ver este site em ingl\u00eas',de:'Diese Website auf Englisch ansehen',hi:'\u0907\u0938 \u0938\u093e\u0907\u091f \u0915\u094b \u0905\u0902\u0917\u094d\u0930\u0947\u091c\u093c\u0940 \u092e\u0947\u0902 \u0926\u0947\u0916\u0947\u0902',tr:'Bu siteyi \u0130ngilizce g\u00f6r\u00fcnt\u00fcle',ru:'\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0441\u0430\u0439\u0442 \u043d\u0430 \u0430\u043d\u0433\u043b\u0438\u0439\u0441\u043a\u043e\u043c'};
    var k=l.slice(0,2); var t=msg[k]||msg.en;
    var map={'/transit-nigeria':'/en/nigeria','/transit-niger':'/en/niger'};
    var target=map[location.pathname]||'/en';
    var b=document.createElement('div');
    b.setAttribute('role','dialog');
    b.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0D1B2A;color:#fff;padding:11px 18px;border-radius:999px;z-index:9999;font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,.28);display:flex;align-items:center;gap:6px;font-family:Inter,system-ui,sans-serif;max-width:92vw;';
    b.innerHTML='\ud83c\udf10 <a href="'+target+'" style="color:#fff;font-weight:600;text-decoration:underline;white-space:nowrap;">'+t+'</a><button aria-label="Close" style="background:none;border:none;color:#fff;opacity:.65;margin-left:10px;cursor:pointer;font-size:15px;line-height:1;">\u2715</button>';
    b.querySelector('button').onclick=function(){b.remove();try{localStorage.setItem('adtl_lang_dismiss','1')}catch(e){}};
    if(document.body) document.body.appendChild(b);
  }catch(e){}
})();
