const CACHE = 'janny-pos-v1';
const OFFLINE_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', (e)=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(OFFLINE_URLS))); self.skipWaiting(); });
self.addEventListener('activate', (e)=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (event)=>{
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(()=>caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const url = new URL(req.url);
    if (res.ok && req.method === 'GET' && url.origin === location.origin) {
      caches.open(CACHE).then(c=>c.put(req, res.clone()));
    }
    return res;
  }).catch(()=> cached || Response.error())));
});
