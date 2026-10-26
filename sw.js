// Ao publicar uma versão nova do app, aumente o número abaixo para os celulares baixarem a atualização.
const CACHE = 'capiati-sede-v9';
// O config.js não entra nesta lista: ele existe só no GitHub e, se faltar, o app continua funcionando sem sinal.
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icones/icone-192.png', './icones/icone-512.png', './icones/icone-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS).then(() => c.add('./config.js').catch(() => {})))
      .then(() => self.skipWaiting())
  );
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

  const ehPagina = req.mode === 'navigate';
  if (ehPagina || url.pathname.endsWith('/config.js')) {
    // Página e ligação: tenta a rede para pegar atualizações; sem sinal ou com erro, usa a última cópia boa.
    const chave = ehPagina ? './index.html' : './config.js';
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(chave, copia)); return r; }
          return caches.match(chave).then(c => c || r);
        })
        .catch(() => caches.match(chave))
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
