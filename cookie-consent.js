/**
 * Google AdSense — AD TRANS LOGISTICS
 * Le consentement publicitaire est géré par la CMP Google configurée
 * dans AdSense avec les choix Autoriser, Refuser et Gérer les options.
 */
(function() {
  'use strict';
  var ADSENSE_CLIENT = 'ca-pub-3856827785689665';

  if (document.querySelector('script[data-adtl-adsense]')) return;

  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-adtl-adsense', 'true');
  document.head.appendChild(script);
})();
