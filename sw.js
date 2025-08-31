const C='rsvp-cache-v3'
const A=['./','./index.html','./style.css?v=3','./app.js?v=3','./icon-192.png','./icon-512.png','./manifest.json?v=3']
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A))) })
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))) })
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))) })
