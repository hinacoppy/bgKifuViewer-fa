/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'bgKifuViewer-v20240611';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
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
  ORIGIN + '/css/FloatWindow4.css',
  ORIGIN + '/js/fontawesome-inuse.min.js',
  ORIGIN + '/js/jquery-3.7.1.min.js',
  ORIGIN + '/js/FloatWindow4.js',
  ORIGIN + '/js/BgBoard_class.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(contentToCache);
    })
  );
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          if (e.request.url.startsWith('http')) { //ignore chrome-extention: request (refuse error msg)
            cache.put(e.request, response.clone());
          }
          return response;
        });
      });
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        const [kyappname, kyversion] = key.split('-');
        const [cnappname, cnversion] = cacheName.split('-');
        if (kyappname === cnappname && kyversion !== cnversion) {
          return caches.delete(key);
        }
      }));
    })
  );
});
