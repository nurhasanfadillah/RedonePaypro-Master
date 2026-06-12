import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrasi Service Worker untuk PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let refreshing = false;

    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('PWA SW registered:', registration.scope);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller && !refreshing) {
              const update = confirm('Pembaruan tersedia — muat ulang sekarang?');
              if (update) {
                refreshing = true;
                newWorker.postMessage('SKIP_WAITING');
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('PWA SW registration failed:', error);
      });

    const showOfflineBanner = () => {
      const existing = document.getElementById('offline-banner');
      if (existing) return;
      const banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'fixed bottom-0 left-0 right-0 bg-amber-500 text-amber-900 text-center text-sm font-bold py-2 z-50';
      banner.textContent = 'Anda sedang offline — beberapa fitur tidak tersedia';
      document.body.appendChild(banner);
    };

    const hideOfflineBanner = () => {
      const banner = document.getElementById('offline-banner');
      if (banner) banner.remove();
    };

    window.addEventListener('offline', showOfflineBanner);
    window.addEventListener('online', hideOfflineBanner);

    if (!navigator.onLine) showOfflineBanner();
  });
}