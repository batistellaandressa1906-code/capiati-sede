// Ao publicar uma versão nova do app, aumente o número abaixo para os celulares baixarem a atualização.
const CACHE = 'capiati-sede-v4';
const ARQUIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icones/icone-192.png', './icones/icone-512.png', './icones/icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Envio de dados para o servidor da fazenda nunca passa pelo cache.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/config.js')) {
    // Página: tenta a rede (pega atualização), cai para o cache sem sinal.
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); const chave = req.mode === 'navigate' ? './index.html' : './config.js'; caches.open(CACHE).then(c => c.put(chave, copia)); return r; })
        .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : './config.js'))
    );
    return;
  }

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(achado => achado || fetch(req).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    }))
  );
});
