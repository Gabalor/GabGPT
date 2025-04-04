// sw.js - Service Worker Básico para GabGPT

const CACHE_NAME = 'gabgpt-cache-v1.2'; // Cambia 'v1' si actualizas los archivos cacheados

// Lista de archivos esenciales para que la app funcione offline (el "App Shell")
const urlsToCache = [
  '/gabgpt/', // La página principal (index.html)
  '/gabgpt/manifest.json', // Cachear el manifest también es buena idea
  '/gabgpt/asistente/groqAPI.css',
  '/gabgpt/asistente/groqAPI.js',
  '/gabgpt/assets/microphone_button_trans.png',
  '/gabgpt/favicon.ico',
  '/gabgpt/icons/icon-192x192.png', // Asegúrate que las rutas a los iconos son correctas
  '/gabgpt/icons/icon-512x512.png'
  // Puedes añadir más archivos estáticos si los tienes (otras imágenes, fuentes, etc.)
];

// Evento 'install': Se dispara cuando el navegador instala el SW.
// Aquí es donde cacheamos los archivos estáticos principales.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil( // Espera a que la promesa se resuelva
    caches.open(CACHE_NAME) // Abre (o crea) nuestra caché específica
      .then(cache => {
        console.log('Service Worker: Cache abierta, añadiendo archivos del App Shell...');
        // Es importante que TODOS estos archivos existan y sean accesibles,
        // de lo contrario, la instalación fallará.
        // Nota: No incluimos las query strings (?v=...) aquí, cacheamos el archivo base.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Archivos del App Shell cacheados exitosamente.');
        return self.skipWaiting(); // Fuerza al SW a activarse inmediatamente (opcional, bueno para desarrollo)
      })
      .catch(error => {
        console.error('Service Worker: Falló el cacheo inicial de archivos:', error);
      })
  );
});

// Evento 'activate': Se dispara cuando el SW se activa.
// Útil para limpiar cachés antiguas si cambias CACHE_NAME.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activado y listo para controlar la página.');
        return self.clients.claim(); // Permite que el SW controle las páginas abiertas inmediatamente
    })
  );
});

// Evento 'fetch': Se dispara cada vez que la página pide un recurso (CSS, JS, imagen, fetch API, etc.).
// Estrategia: Cache first, falling back to network.
self.addEventListener('fetch', event => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith( // Interceptamos la petición y decidimos qué responder
    caches.match(event.request) // Buscamos la respuesta en la caché
      .then(cachedResponse => {
        // Si la encontramos en caché, la devolvemos
        if (cachedResponse) {
          // console.log('Service Worker: Sirviendo desde caché:', event.request.url);
          return cachedResponse;
        }

        // Si no está en caché, vamos a la red a buscarla
        // console.log('Service Worker: Buscando en red:', event.request.url);
        return fetch(event.request).then(networkResponse => {
            // (Opcional) Podrías clonar y guardar la respuesta de red en caché aquí si quisieras
            // para futuras peticiones, pero para el App Shell básico no es estrictamente necesario.
            if (networkResponse && networkResponse.status === 200 && urlsToCache.includes(new URL(event.request.url).pathname)) {
               // Clonar la respuesta para poder usarla y guardarla en caché
               const responseToCache = networkResponse.clone();
               caches.open(CACHE_NAME)
                 .then(cache => {
                   cache.put(event.request, responseToCache);
                 });
             }
             return networkResponse;
          }).catch(error => {
            // Manejo de error si falla la red Y no estaba en caché
            console.error('Service Worker: Fallo al buscar en red y no estaba en caché:', error);
            // Podrías devolver una página offline genérica aquí si la tuvieras cacheada
            // return caches.match('/offline.html');
          });
      })
  );
});