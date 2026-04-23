// Telegram WebApp Guard (softskill only)
(function () {
  'use strict';

  function getTg() {
    return (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  }

  function renderDenied(msg) {
    document.body.innerHTML = `
      <div style="
        min-height: 100vh; display:flex; align-items:center; justify-content:center;
        background:#000; color:#fff; padding:24px; text-align:center;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div>
          <div style="font-size:44px; margin-bottom:12px;">🚫</div>
          <div style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase; font-size:12px; opacity:0.85;">
            Accesso negato
          </div>
          <div style="margin-top:10px; font-size:14px; opacity:0.9;">${msg}</div>
        </div>
      </div>
    `;
  }

  function requireTelegramWebApp({ autoExpand = true } = {}) {
    const tg = getTg();
    if (!tg || !tg.initData) {
      renderDenied('Apri questa pagina solo dentro Telegram.');
      try { window.stop(); } catch (_) {}
      return null;
    }
    try { tg.ready(); } catch (_) {}
    try { if (autoExpand) tg.expand(); } catch (_) {}
    return tg;
  }

  function getAsh() {
    return new URLSearchParams(window.location.search || '').get('ash');
  }

  function requireAsh() {
    const ash = getAsh();
    if (!ash) {
      renderDenied('Parametro di sessione mancante (ash). Avvia la miniapp dal bot.');
      try { window.stop(); } catch (_) {}
      return null;
    }
    return ash;
  }

  function cleanupUrl() {
    try {
      const url = new URL(window.location.href);
      const ash = url.searchParams.get('ash');
      const nextUrl = `${url.pathname}${ash ? `?ash=${encodeURIComponent(ash)}` : ''}${url.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
    } catch (_) {}
  }

  window.TwaSoftskillGuard = { requireTelegramWebApp, getAsh, requireAsh, cleanupUrl };
})();

