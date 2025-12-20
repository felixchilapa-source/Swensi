// Service worker disabled to prevent caching conflicts during migration to Vite
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
