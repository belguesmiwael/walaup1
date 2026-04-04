/* ============================================================
   HiveApp — sw.js  v1.0
   Service Worker : cache-first shell + network-first data
   ============================================================ */
var CACHE_SHELL = 'hive-shell-v1';
var CACHE_DATA  = 'hive-data-v1';

var SHELL_ASSETS = [
  '/',
  '/index.html',
  '/marketplace.html',
  '/estimateur.html',
  '/client.html',
  '/admin.html',
  '/offline.html',
  '/css/main.css',
  '/css/effects.css',
  '/css/index.css',
  '/css/marketplace.css',
  '/css/estimateur.css',
  '/css/client.css',
  '/css/admin.css',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/js/sound.js',
  '/js/effects.js',
  '/js/index.js',
  '/js/marketplace.js',
  '/js/estimateur.js',
  '/js/client.js',
  '/js/admin.js',
];

/* ─── INSTALL — cache shell ──────────────────────────────── */
self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_SHELL).then(function(cache) {
      return cache.addAll(SHELL_ASSETS).catch(function(err) {
        console.warn('[SW] Some shell assets failed to cache:', err);
      });
    })
  );
});

/* ─── ACTIVATE — clean old caches ───────────────────────── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_SHELL && k !== CACHE_DATA; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

/* ─── FETCH — strategy routing ───────────────────────────── */
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Skip non-GET & cross-origin (Firebase, Google Fonts CDN, etc.)
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin &&
      !url.hostname.endsWith('googleapis.com') &&
      !url.hostname.endsWith('gstatic.com') &&
      !url.hostname.endsWith('phosphor-icons')) return;

  // Firebase Auth/Firestore — network only
  if (url.hostname.includes('firestore') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('identitytoolkit')) return;

  // HTML pages — network-first, fallback to cache, then offline
  if (e.request.headers.get('Accept') && e.request.headers.get('Accept').includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_SHELL).then(function(c) { c.put(e.request, clone); });
          return res;
        })
        .catch(function() {
          return caches.match(e.request)
            .then(function(r) { return r || caches.match('/offline.html'); });
        })
    );
    return;
  }

  // CSS / JS / Fonts — cache-first
  if (url.pathname.match(/\.(css|js|woff2|woff|ttf)$/) ||
      url.hostname.endsWith('googleapis.com') ||
      url.hostname.endsWith('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_SHELL).then(function(c) { c.put(e.request, clone); });
          return res;
        }).catch(function() { return cached; });
      })
    );
    return;
  }

  // Images — stale-while-revalidate
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/)) {
    e.respondWith(
      caches.open(CACHE_DATA).then(function(cache) {
        return cache.match(e.request).then(function(cached) {
          var fetched = fetch(e.request).then(function(res) {
            cache.put(e.request, res.clone());
            return res;
          });
          return cached || fetched;
        });
      })
    );
    return;
  }
});

/* ─── PUSH NOTIFICATIONS ─────────────────────────────────── */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch(ex) {}
  var title   = data.title   || 'HiveApp';
  var options = {
    body:    data.body    || 'Nouveau message de votre équipe.',
    icon:    data.icon    || '/icons/icon-192.png',
    badge:   data.badge   || '/icons/badge-96.png',
    tag:     data.tag     || 'hive-notif',
    data:    { url: data.url || '/client.html' },
    actions: data.actions || [],
    vibrate: [120, 60, 120],
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/client.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cls) {
      for (var i = 0; i < cls.length; i++) {
        if (cls[i].url === target && 'focus' in cls[i]) return cls[i].focus();
      }
      return clients.openWindow(target);
    })
  );
});
