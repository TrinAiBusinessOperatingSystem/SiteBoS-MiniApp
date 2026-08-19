// Telegram WebApp Guard + ASH helper (operators only)
(function () {
  'use strict';

  function getTg() {
    return (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  }

  function renderDenied(msg) {
    document.body.innerHTML = `
      <div style="
        min-height: 100vh; display:flex; align-items:center; justify-content:center;
        background:#fafafa; color:#000000; padding:24px; text-align:center;
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background:white; border:1px solid #eeeeee; border-radius:24px; padding:32px; max-width:380px; width:100%; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="font-size:44px; margin-bottom:12px;">🚫</div>
          <div style="font-weight:900; letter-spacing:0.08em; text-transform:uppercase; font-size:12px; color:#000000;">
            Accesso Negato
          </div>
          <div style="margin-top:10px; font-size:13px; color:#64748b; font-weight:500;">${msg}</div>
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
    try { if (autoExpand && typeof tg.expand === 'function') tg.expand(); } catch (_) {}
    try { if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes(); } catch (_) {}
    try { if (typeof tg.setHeaderColor === 'function') tg.setHeaderColor('#ffffff'); } catch (_) {}
    try { if (typeof tg.setBackgroundColor === 'function') tg.setBackgroundColor('#ffffff'); } catch (_) {}
    return tg;
  }

  function getUrlParams() {
    return new URLSearchParams(window.location.search || '');
  }

  function getAsh() {
    return getUrlParams().get('ash');
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

  function cleanupUrl(allowedKeys = ['ash']) {
    try {
      const url = new URL(window.location.href);
      const next = new URLSearchParams();
      allowedKeys.forEach((k) => {
        const v = url.searchParams.get(k);
        if (v !== null && v !== undefined && v !== '') next.set(k, v);
      });
      const nextUrl = `${url.pathname}${next.toString() ? '?' + next.toString() : ''}${url.hash || ''}`;
      window.history.replaceState({}, '', nextUrl);
    } catch (_) {}
  }

  function authPayload(extra = {}) {
    const tg = requireTelegramWebApp();
    const ash = getAsh();
    return {
      _auth: tg ? tg.initData : undefined,
      ...(ash ? { ash } : {}),
      ...extra
    };
  }

  function patchFetchJson(extra = {}) {
    const _fetch = window.fetch;
    window.fetch = async function (input, init = {}) {
      const method = (init.method || 'GET').toUpperCase();
      const isJson = init.headers && (
        (init.headers['Content-Type'] || init.headers['content-type']) === 'application/json'
      );
      if (method !== 'POST' || !isJson || !init.body || typeof init.body !== 'string') {
        return _fetch(input, init);
      }
      try {
        const parsed = JSON.parse(init.body);
        const next = { ...authPayload(extra), ...parsed };
        return _fetch(input, { ...init, body: JSON.stringify(next) });
      } catch (_) {
        return _fetch(input, init);
      }
    };
  }

  window.TwaGuard = {
    getTg,
    requireTelegramWebApp,
    getAsh,
    requireAsh,
    cleanupUrl,
    authPayload,
    patchFetchJson
  };
})();

