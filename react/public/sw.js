'use strict'

// Temporary retirement worker for CourseFlow's former Workbox/PWA worker.
// Keep this file at /sw.js for at least 30 days and two normal release cycles
// after it reaches both UAT and staging. It intentionally has no fetch handler:
// once active, all requests use the network and normal HTTP cache semantics.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim()

      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('workbox-'))
          .map((cacheName) => caches.delete(cacheName))
      )

      await self.registration.unregister()
    })()
  )
})
