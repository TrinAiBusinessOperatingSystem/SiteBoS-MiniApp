/**
 * SiteBoS MiniApp — Global Telegram WebApp Launch & Fullscreen Controller
 * Protocollo v3.0 (Zero-Build, Mobile-First, Bot API 8.0+ Support)
 */
(function (window) {
  'use strict';

  function initSiteBosTwaLaunch(options = {}) {
    const defaultOptions = {
      headerColor: '#090d16',
      backgroundColor: '#090d16',
      disableVerticalSwipes: true,
      enableFullscreen: true
    };
    const opts = Object.assign({}, defaultOptions, options);

    const tg = window.Telegram?.WebApp;
    if (!tg) {
      return null;
    }

    try {
      // 1. Inizializzazione SDK Telegram
      if (typeof tg.ready === 'function') {
        tg.ready();
      }

      // 2. Fullscreen Launch Mode con Fallback morbido a expand()
      if (opts.enableFullscreen) {
        if (typeof tg.requestFullscreen === 'function') {
          try {
            tg.requestFullscreen();
          } catch (err) {
            console.warn('[TWA Launch] requestFullscreen failed, fallbacking to expand():', err);
            if (typeof tg.expand === 'function') tg.expand();
          }
        } else if (typeof tg.expand === 'function') {
          tg.expand();
        }
      }

      // 3. Blocco Swipe Verticale per proteggere Caroselli 3D e gesture
      if (opts.disableVerticalSwipes && typeof tg.disableVerticalSwipes === 'function') {
        try {
          tg.disableVerticalSwipes();
        } catch (_) {}
      }

      // 4. Personalizzazione Colori Tema (Header & Background)
      if (opts.headerColor && typeof tg.setHeaderColor === 'function') {
        try {
          tg.setHeaderColor(opts.headerColor);
        } catch (_) {}
      }
      if (opts.backgroundColor && typeof tg.setBackgroundColor === 'function') {
        try {
          tg.setBackgroundColor(opts.backgroundColor);
        } catch (_) {}
      }

    } catch (e) {
      console.error('[TWA Launch] Error during TWA initialization:', e);
    }

    return tg;
  }

  // Esporta nel namespace globale
  window.initSiteBosTwaLaunch = initSiteBosTwaLaunch;

  // Auto-esecuzione soft al DOMContentLoaded se Telegram SDK è caricato
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.Telegram?.WebApp?.initData) {
        initSiteBosTwaLaunch();
      }
    });
  } else {
    if (window.Telegram?.WebApp?.initData) {
      initSiteBosTwaLaunch();
    }
  }
})(window);
