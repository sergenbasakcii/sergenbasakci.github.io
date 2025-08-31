const C='rsvp-cache-v2'
const A=['./','./index.html','./style.css','./app.js','./icon-192.png','./icon-512.png','./manifest.json']
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A))) })
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))) })
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))) })
