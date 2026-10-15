/**
 * Bandeau cookies — AD TRANS LOGISTICS (version compacte, 15/10/2026)
 * Le site n'utilise que des cookies techniques (session client, paiement sécurisé, préférences) :
 * un simple avis non bloquant suffit. Mémorisé dans localStorage.
 */
(function () {
  'use strict';
  var STORAGE_KEY = 'adtl_cookie_consent';
  try { if (localStorage.getItem(STORAGE_KEY)) return; } catch (e) { return; }

  var style = document.createElement('style');
  style.textContent = [
    '#cookie-banner{position:fixed;left:16px;bottom:16px;z-index:9998;max-width:360px;width:calc(100% - 32px);background:#fff;color:#0A0A0A;border:1px solid #E5E5E5;border-radius:18px;box-shadow:0 16px 48px -16px rgba(10,10,10,.35);padding:16px 18px;font-family:"Instrument Sans",sans-serif;opacity:0;transform:translateY(12px);transition:opacity .35s ease,transform .35s ease;}',
    '#cookie-banner.show{opacity:1;transform:none;}',
    '#cookie-banner p{margin:0;font-size:13px;line-height:1.55;color:#404040;}',
    '#cookie-banner p strong{color:#0A0A0A;display:block;font-size:13.5px;margin-bottom:3px;}',
    '#cookie-banner .cb-row{display:flex;align-items:center;gap:14px;margin-top:12px;background:transparent;}',
    '#cookie-banner .cb-ok{background:#0A0A0A!important;color:#fff!important;border:0;border-radius:999px;padding:9px 18px;font:700 13px "Instrument Sans",sans-serif;cursor:pointer;width:auto!important;flex:none;display:inline-block;line-height:1.2;}',
    '#cookie-banner .cb-ok:hover{background:#262626;}',
    '#cookie-banner a{font-size:13px;color:#525252!important;text-decoration:underline;background:transparent!important;}',
    '@media(max-width:1023px){#cookie-banner{bottom:76px;}}'
  ].join('\n');
  document.head.appendChild(style);

  var EN = String(document.documentElement.lang || '').slice(0, 2).toLowerCase() === 'en';
  var banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', EN ? 'Cookie information' : 'Information sur les cookies');
  banner.innerHTML = EN
    ? '<p><strong>Essential cookies only</strong>This site uses cookies required for it to work (client area, secure payment, preferences). No advertising trackers.</p>' +
      '<div class="cb-row"><button class="cb-ok" type="button" onclick="cookieConsent(true)">Got it</button><a href="/confidentialite">Learn more</a></div>'
    : '<p><strong>Cookies techniques uniquement</strong>Ce site utilise des cookies nécessaires à son fonctionnement (espace client, paiement sécurisé, préférences). Aucun traceur publicitaire.</p>' +
      '<div class="cb-row"><button class="cb-ok" type="button" onclick="cookieConsent(true)">J’ai compris</button><a href="/confidentialite">En savoir plus</a></div>';
  document.body.appendChild(banner);
  setTimeout(function () { banner.classList.add('show'); }, 1200);

  window.cookieConsent = function (accepted) {
    try { localStorage.setItem(STORAGE_KEY, accepted ? 'accepted' : 'refused'); } catch (e) {}
    var el = document.getElementById('cookie-banner');
    if (el) { el.classList.remove('show'); setTimeout(function () { el.remove(); }, 400); }
  };
})();
