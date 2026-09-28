/* Lv.OPS サービスワーカー：電波がなくてもアプリを開けるようにする */
const V = 'lvops-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon.svg', './favicon-32.png', './favicon-48.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (/(^|\.)google\.com$|googleusercontent\.com$/.test(u.hostname)) return; // データの通信はキャッシュしない
  // 画面本体：まずネットから最新を取り、だめなら保存しておいたものを使う（更新がすぐ反映される）
  if (req.mode === 'navigate' || u.pathname.endsWith('/index.html') || u.pathname.endsWith('/')) {
    e.respondWith(fetch(req, { cache: 'no-store' }).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html').then(m => m || caches.match('./'))));
    return;
  }
  // アイコン・フォントなど：保存しておいたものを使い、なければ取りに行って保存
  e.respondWith(caches.match(req).then(m => m || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
    return r;
  })));
});
