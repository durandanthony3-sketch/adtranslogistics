/**
 * Cookie Consent Banner — AD TRANS LOGISTICS
 * RGPD / Loi informatique et libertés
 * Auto-injecte le bandeau si pas encore accepté/refusé
 */
(function() {
  'use strict';
  var STORAGE_KEY = 'adtl_cookie_consent';
  var consent = localStorage.getItem(STORAGE_KEY);
  if (consent) return; // Already accepted or refused

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = [
    '#cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:0;transform:translateY(100%);animation:cookie-slide-up .5s cubic-bezier(.4,0,.2,1) .8s forwards;}',
    '@keyframes cookie-slide-up{to{transform:translateY(0);}}',
    '#cookie-banner .cb-inner{max-width:960px;margin:0 auto;padding:20px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;}',
    '#cookie-banner .cb-text{flex:1;min-width:260px;font-size:13px;line-height:1.5;color:rgba(255,255,255,.85);font-family:"Instrument Sans",sans-serif;}',
    '#cookie-banner .cb-text a{color:#fbbf24;text-decoration:underline;}',
    '#cookie-banner .cb-actions{display:flex;gap:10px;flex-shrink:0;}',
    '#cookie-banner .cb-btn{padding:10px 22px;border-radius:999px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:"Instrument Sans",sans-serif;transition:all .2s;}',
    '#cookie-banner .cb-accept{background:#fff;color:#0A0A0A;}',
    '#cookie-banner .cb-accept:hover{background:#fbbf24;transform:translateY(-1px);}',
    '#cookie-banner .cb-refuse{background:transparent;color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2);}',
    '#cookie-banner .cb-refuse:hover{background:rgba(255,255,255,.1);color:#fff;}',
    '@media(max-width:640px){#cookie-banner .cb-inner{flex-direction:column;text-align:center;padding:16px 20px 24px;}#cookie-banner .cb-actions{width:100%;justify-content:center;}}'
  ].join('\n');
  document.head.appendChild(style);

  // Inject HTML
  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Consentement cookies');
  banner.innerHTML =
    '<div style="background:linear-gradient(135deg,#0D1B2A 0%,#1B4F72 100%);border-top:1px solid rgba(255,255,255,.08);box-shadow:0 -8px 32px rgba(0,0,0,.25);">' +
      '<div class="cb-inner">' +
        '<div class="cb-text">' +
          '<strong style="color:#fff;font-size:14px;">Ce site utilise des cookies</strong><br>' +
          'Nous utilisons des cookies pour am\u00e9liorer votre exp\u00e9rience, analyser le trafic et personnaliser le contenu. ' +
          'Vos donn\u00e9es personnelles (nom, email, t\u00e9l\u00e9phone) collect\u00e9es via nos formulaires sont utilis\u00e9es uniquement pour le suivi de vos demandes. ' +
          'En cliquant sur \u00ab Accepter \u00bb, vous consentez \u00e0 l\u2019utilisation de ces cookies.' +
        '</div>' +
        '<div class="cb-actions">' +
          '<button class="cb-btn cb-refuse" onclick="cookieConsent(false)">Refuser</button>' +
          '<button class="cb-btn cb-accept" onclick="cookieConsent(true)">Accepter</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(banner);

  // Global handler
  window.cookieConsent = function(accepted) {
    localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'refused');
    var el = document.getElementById('cookie-banner');
    if (el) {
      el.style.transition = 'transform .4s ease, opacity .4s ease';
      el.style.transform = 'translateY(100%)';
      el.style.opacity = '0';
      setTimeout(function() { el.remove(); }, 500);
    }
  };
})();
