/* serviceWorker.js */
// (参考) https://qiita.com/kaihar4/items/c09a6d73e190ab0b9b01
'use strict';

const CACHE_NAME = "bgKifuViewer-v20220308";
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const STATIC_FILES = [
  ORIGIN + '/bgKifuViewer-fa/',
  ORIGIN + '/bgKifuViewer-fa/index.html',
  ORIGIN + '/bgKifuViewer-fa/KifuViewer.html',
  ORIGIN + '/bgKifuViewer-fa/manifest.json',
  ORIGIN + '/bgKifuViewer-fa/icon/favicon.ico',
  ORIGIN + '/bgKifuViewer-fa/icon/apple-touch-icon.png',
  ORIGIN + '/bgKifuViewer-fa/icon/android-chrome-96x96.png',
  ORIGIN + '/bgKifuViewer-fa/icon/android-chrome-192x192.png',
  ORIGIN + '/bgKifuViewer-fa/icon/android-chrome-512x512.png',
  ORIGIN + '/bgKifuViewer-fa/css/KifuViewer.css',
  ORIGIN + '/bgKifuViewer-fa/js/BgMoveStrUtil_class.js',
  ORIGIN + '/bgKifuViewer-fa/js/BgGame_class.js',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/css/BgBoard.css',
  ORIGIN + '/css/FloatWindow2.css',
  ORIGIN + '/js/fontawesome-all.min.js',
  ORIGIN + '/js/jquery-3.6.0.min.js',
  ORIGIN + '/js/FloatWindow2.js',
  ORIGIN + '/js/BgBoard_class.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js'
];

const CACHE_KEYS = [
  CACHE_NAME
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        STATIC_FILES.map(url => {
          return fetch(new Request(url, { cache: 'no-cache', mode: 'no-cors' })).then(response => {
            return cache.put(url, response);
          });
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          return !CACHE_KEYS.includes(key);
        }).map(key => {
          return caches.delete(key);
        })
      );
    })
  );
});

