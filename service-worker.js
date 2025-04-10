const CACHE_NAME = 'pokemon-tcg-tracker-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Agrega aquí otros recursos estáticos que quieras cachear
];

// Instalar el Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Eliminar caché antiguos
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de caché: Primero caché, luego red con actualización de caché
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a API o externos
  if (
    event.request.url.includes('/api/') || 
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Intentar obtener de caché primero
        if (response) {
          // En segundo plano, actualizar el caché
          fetch(event.request).then((fetchResponse) => {
            if (fetchResponse && fetchResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone());
              });
            }
          });
          return response;
        }
        
        // Si no está en caché, obtener de la red
        return fetch(event.request)
          .then((fetchResponse) => {
            // No cachear respuestas fallidas
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }
            
            // Cachear la respuesta obtenida
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return fetchResponse;
          })
          .catch((error) => {
            // Para peticiones de navegación, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            console.error('Error en fetch:', error);
            throw error;
          });
      })
  );
});

// Sincronizar datos cuando se recupera la conexión
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pokemon-data') {
    event.waitUntil(syncPokemonData());
  }
});

// Función para sincronizar datos pendientes
async function syncPokemonData() {
  try {
    // Aquí iría la lógica para sincronizar con un backend
    // Por ahora solo registramos en el log
    console.log('Sincronizando datos...');
    
    // Obtenemos clientes para notificar
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().toISOString()
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error sincronizando datos:', error);
    return false;
  }
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Notificación de Pokémon TCG Tracker',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Pokémon TCG Tracker', 
        options
      )
    );
  } catch (error) {
    console.error('Error procesando notificación push:', error);
  }
});

// Abrir URL al hacer clic en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
