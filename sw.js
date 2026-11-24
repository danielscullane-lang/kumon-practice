var CACHE_NAME = 'aalm-v5';
var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_O1iVCN-GtZ1KHCPQSOlTLztUXeOFDddV2qq-R_veuosy4nUuDG1u_MnoDONRFCypCZa2Wj8q3UZ3/pub?output=csv';
var RESULTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbsDqmsPfz5xKu40gAkCDp5_IpM8QzKE-2vqLUnvm62KHEGoy0LXd8NmprJlsFgH-kib2y7ZBq0tRf/pub?output=csv';

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['./', './index.html']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // CSV data: network-first, fall back to cache
  if (url === CSV_URL || url === RESULTS_CSV_URL) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Google Apps Script POST (save results): let it pass through
  if (e.request.method === 'POST') {
    return;
  }

  // Everything else (the HTML page): network-first, fall back to cache
  if (e.request.mode === 'navigate' || url.indexOf('index.html') !== -1 || url.endsWith('/kumon-practice/')) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request) || caches.match('./index.html');
      })
    );
    return;
  }
});
