const CACHE = 'finance-v1'
const STATIC = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const { request } = e
  if (request.url.includes('/api/')) {
    // network-first for API calls
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }
  // cache-first for static assets
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(res => {
      const clone = res.clone()
      caches.open(CACHE).then(c => c.put(request, clone))
      return res
    }))
  )
})
