// AD TRANS LOGISTICS — Service Worker de nettoyage
// Purge les caches installes par les versions precedentes puis se desinstalle.
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      await self.registration.unregister();
      const cs = await self.clients.matchAll({ type: 'window' });
      cs.forEach(c => { try { c.navigate(c.url); } catch (err) {} });
    } catch (err) {}
  })());
});
