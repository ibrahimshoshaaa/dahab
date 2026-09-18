const CACHE = "dahab-v2"
const OFFLINE_URL = "/"

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.add(OFFLINE_URL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && (event.request.mode === "navigate" || url.pathname.startsWith("/_next/"))) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {})
        }
        return response
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match(OFFLINE_URL)))
  )
})