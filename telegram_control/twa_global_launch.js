/**
 * SiteBoS MiniApp — Global Telegram WebApp Launch & First-Come First-Served Lock Controller
 * Protocollo v3.0 (Zero-Build, Mobile-First, Bot API 8.0+ Support)
 */
(function (window) {
  'use strict';

  let currentTabId = null;
  let activeScope = null;
  let heartbeatInterval = null;

  /**
   * Identifica il tipo ed il livello di blocco della pagina corrente
   */
  function analyzePageScope() {
    const path = window.location.pathname.toLowerCase();

    // 1. PAGINE CONSULTANTI (Sola Lettura / Navigazione -> Zero Blocchi)
    if (
      path.includes('/userguide/') ||
      path.includes('dashboard/dashboard.html') ||
      path.includes('operators/catalog.html') ||
      path.includes('operators/legal.html') ||
      path.includes('softskill/index.html') ||
      path.includes('/customer_bot/')
    ) {
      return { isConsultant: true, scope: null, type: 'CONSULTANTE' };
    }

    // 2. MASTER GLOBAL LOCK (identity) -> Se aperta, blocca TUTTE le altre Editanti
    if (
      path.includes('/identity/') ||
      path.includes('bot_config.html') ||
      path.includes('edit_owner.html') ||
      path.includes('advanced-setup.html')
    ) {
      return { isConsultant: false, scope: 'identity', type: 'MASTER_GLOBAL' };
    }

    // 3. DOMAIN MASTER LOCK (catalog) -> Se aperta, blocca le dipendenze catalogo
    if (
      path.includes('catalog.html') ||
      path.includes('add-product') ||
      path.includes('edit-product') ||
      path.includes('add-category') ||
      path.includes('edit-advanced-product') ||
      path.includes('edit-blueprint') ||
      path.includes('edit-advanced') ||
      path.includes('edit-blog') ||
      path.includes('edit-knowledge') ||
      path.includes('edit-post') ||
      path.includes('edit-semilavorati') ||
      path.includes('assistente.html')
    ) {
      return { isConsultant: false, scope: 'catalog', type: 'DOMAIN_MASTER' };
    }

    // 4. MODULE LOCKS (First-Come First-Served Scoped)
    if (path.includes('supervisor_hub.html')) return { isConsultant: false, scope: 'supervisor', type: 'MODULE' };
    if (path.includes('orders-manager.html') || path.includes('order-viewer.html')) return { isConsultant: false, scope: 'orders', type: 'MODULE' };
    if (path.includes('job-create.html') || path.includes('pianificazione_itinerari.html')) return { isConsultant: false, scope: 'jobs', type: 'MODULE' };
    if (path.includes('agent_marketing.html')) return { isConsultant: false, scope: 'marketing', type: 'MODULE' };
    if (path.includes('assistente-sicurezza.html')) return { isConsultant: false, scope: 'agents_safety', type: 'MODULE' };
    if (path.includes('controllo_gestione.html') || path.includes('analisi-mercato.html') || path.includes('intelligent-warehouse.html') || path.includes('agenda.html') || path.includes('agent_intelligence.html') || path.includes('risorse_umane.html')) {
      return { isConsultant: false, scope: 'agents_control', type: 'MODULE' };
    }
    if (path.includes('fine-tuning.html')) return { isConsultant: false, scope: 'fine_tuning', type: 'MODULE' };
    if (path.includes('operator_dashboard.html') || path.includes('operator_onboarding.html')) return { isConsultant: false, scope: 'operators', type: 'MODULE' };
    if (path.includes('softskill')) return { isConsultant: false, scope: 'softskills', type: 'MODULE' };

    // Default per altre pagine non censite -> Modulo generico
    return { isConsultant: false, scope: 'generic_edit', type: 'MODULE' };
  }

  /**
   * Verifica se una chiave di lock è attualmente viva su un'altra scheda
   */
  function isLockActiveOnOtherTab(scopeKey) {
    if (!scopeKey) return false;
    const lockOwner = localStorage.getItem(`sitebos_lock_${scopeKey}`);
    const lastHeartbeat = parseInt(localStorage.getItem(`sitebos_hb_${scopeKey}`) || '0', 10);
    const now = Date.now();

    // Se c'è un proprietario diverso ed il battito cardiaco risale a meno di 8 secondi fa
    if (lockOwner && lockOwner !== currentTabId && (now - lastHeartbeat) < 8000) {
      return true;
    }
    return false;
  }

  /**
   * Genera dinamicamente l'overlay di blocco adattandosi al tipo di lock (Concorrente o Generazione AI)
   */
  function renderFriendlyLockOverlay(reasonText, isGenerating = false) {
    let overlay = document.getElementById('sitebos-friendly-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sitebos-friendly-lock-overlay';
      overlay.className = 'fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[999999] flex items-center justify-center p-4 transition-opacity duration-300';
      document.body.appendChild(overlay);
    }

    if (isGenerating) {
      // Schermata di congelamento per Generazione AI attiva (Senza pulsanti di uscita)
      overlay.innerHTML = `
        <div class="bg-white border border-gray-200 p-8 rounded-3xl w-full max-w-sm shadow-2xl text-center text-slate-900 flex flex-col items-center gap-6">
          <div class="relative flex items-center justify-center">
            <div class="w-16 h-16 rounded-full border-4 border-slate-200 border-t-black animate-spin"></div>
            <div class="absolute text-xl text-black">
              <i class="fas fa-brain animate-pulse"></i>
            </div>
          </div>
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700 mb-3">
              <span class="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
              ELABORAZIONE INTELLIGENZA ARTIFICIALE
            </div>
            <h3 class="text-sm font-extrabold uppercase text-black leading-tight">Scrittura in corso...</h3>
            <p class="text-xs text-slate-600 font-medium mt-3 leading-relaxed">
              ${reasonText}
            </p>
          </div>
          <div class="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
            L'editor si sbloccherà automaticamente al termine
          </div>
        </div>
      `;
    } else {
      // Schermata di blocco standard per concorrenza cross-tab o cross-platform (Con pulsante Home)
      overlay.innerHTML = `
        <div class="bg-white border border-gray-200 p-6 rounded-3xl w-full max-w-sm shadow-2xl backdrop-blur-2xl text-center text-slate-900 flex flex-col items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-black flex items-center justify-center text-2xl shadow-sm">
            <i class="fas fa-shield-halved"></i>
          </div>
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-700 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
              SESSIONE IN USO SU UN ALTRO SCHERMO
            </div>
            <h3 class="text-sm font-extrabold uppercase text-black leading-tight">Sessione in corso su un altro dispositivo</h3>
            <p class="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
              ${reasonText}
            </p>
          </div>
          <button id="sitebos-go-home-btn" class="w-full py-3 px-4 rounded-xl bg-black hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-2">
            <i class="fas fa-house text-xs"></i>
            Torna alla Dashboard
          </button>
        </div>
      `;

      const homeBtn = overlay.querySelector('#sitebos-go-home-btn');
      if (homeBtn) {
        homeBtn.addEventListener('click', function () {
          const pathParts = window.location.pathname.split('/telegram_control/');
          if (pathParts.length > 1) {
            window.location.href = window.location.origin + window.location.pathname.substring(0, window.location.pathname.indexOf('/telegram_control/')) + '/telegram_control/dashboard/dashboard.html';
          } else {
            window.history.back();
          }
        });
      }
    }
    overlay.classList.remove('hidden');
  }

  const CROSS_LOCK_WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/17a1bf79-43cd-428b-a497-33745ca44857";

  function getAshFromUrl() {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      return urlParams.get('ash') || (window.Telegram?.WebApp?.initDataUnsafe?.start_param || '');
    } catch (_) { return ''; }
  }

  function getLockManagerAsh() {
    try {
      const token = sessionStorage.getItem('sitebos_access_token');
      if (token) return token;
    } catch (_) {}
    return getAshFromUrl();
  }

  function getPlatformType() {
    const tg = window.Telegram?.WebApp;
    const platform = (tg?.platform || '').toLowerCase();
    if (['android', 'ios', 'mobile'].includes(platform)) return 'mobile';
    if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(platform)) return 'desktop';
    const ua = (navigator.userAgent || '').toLowerCase();
    if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return 'mobile';
    return (window.innerWidth < 768) ? 'mobile' : 'desktop';
  }

  /**
   * Tenta di acquisire il lock remoto (Intercetta lo scope 'generating')
   */
  async function tryAcquireCrossPlatformLock(scope, ttlSeconds = 300) {
    const ash = getLockManagerAsh();
    if (!ash || !scope) return true;
    try {
      const res = await fetch(CROSS_LOCK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _auth: window.Telegram?.WebApp?.initData || '',
          ash: ash,
          scope: scope,
          platform: getPlatformType(),
          action: 'acquire',
          ttl: ttlSeconds
        })
      });
      const data = await res.json();
      if (data && data.blocked) {
        if (data.scope === 'generating') {
          // Attivazione dell'overlay No-Edit per elaborazione AI attiva
          renderFriendlyLockOverlay(
            `L'assistente sta scrivendo ed elaborando i tuoi dati (es. ${data.label || 'Sincronizzazione'}). Per evitare sovrascritture, l'editor rimarrà temporaneamente congelato.`,
            true
          );
        } else {
          // Attivazione dell'overlay standard per concorrenza
          const remainingMin = Math.max(1, Math.ceil((data.remainingSeconds || 300) / 60));
          const otherPlatform = data.platform === 'desktop' ? 'PC Desktop' : 'Smartphone Mobile';
          const labelStr = data.label ? `<b>${data.label}</b>` : `sezione <b>${data.scope || scope}</b>`;
          renderFriendlyLockOverlay(
            `Questa sessione è in uso su <b>${otherPlatform}</b> (${labelStr}).<br><br>Sblocco automatico stimato: ⏱️ <b>circa ${remainingMin} minuti</b> o non appena l'altra sessione verrà chiusa.`
          );
        }
        return false;
      }
    } catch (e) {
      console.warn('[CrossPlatformLock] acquire check warn:', e);
    }
    return true;
  }

  /**
   * Rilascia il lock cross-platform tramite sendBeacon
   */
  function sendBeaconCrossRelease(scope) {
    const ash = getLockManagerAsh();
    if (!ash || !scope) return;
    try {
      const payload = JSON.stringify({
        _auth: window.Telegram?.WebApp?.initData || '',
        ash: ash,
        scope: scope,
        platform: getPlatformType(),
        action: 'release'
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CROSS_LOCK_WEBHOOK_URL, new Blob([payload], { type: 'application/json' }));
      } else {
        fetch(CROSS_LOCK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (_) {}
  }

  /**
   * Avvia il Lock First-Come First-Served Strict (Local Cross-Tab + Remote Cross-Platform)
   */
  function setupFirstComeLock(pageAnalysis) {
    if (pageAnalysis.isConsultant) return true; // CONSULTANTI -> Zero blocchi

    currentTabId = Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const scope = pageAnalysis.scope;

    // Check 1: Master Global Lock (identity) attivo da un'altra scheda?
    if (scope !== 'identity' && isLockActiveOnOtherTab('identity')) {
      renderFriendlyLockOverlay('Per garantire la sincronizzazione dei dati ed evitare sovrascritture accidentali, le modifiche sono temporaneamente in pausa perché la sezione <b>Identity & Setup</b> è aperta su un altro schermo.');
      return false;
    }

    // Check 2: Domain Master Lock (catalog) attivo da un'altra scheda?
    if (scope !== 'catalog' && pageAnalysis.type === 'DOMAIN_MASTER' && isLockActiveOnOtherTab('catalog')) {
      renderFriendlyLockOverlay('Per garantire l\'integrità dei dati del listino, la gestione del <b>Catalogo</b> è attualmente aperta ed in uso su un altro dispositivo.');
      return false;
    }

    // Check 3: Same Module Lock attivo da un'altra scheda localmente?
    if (isLockActiveOnOtherTab(scope)) {
      renderFriendlyLockOverlay(`Per garantire la sincronizzazione dei dati ed evitare sovrascritture accidentali, questa sezione (<b>${scope}</b>) è attualmente aperta ed operativa su un altro schermo.`);
      return false;
    }

    // Check 4: Remote Cross-Platform Lock (n8n/MongoDB)
    tryAcquireCrossPlatformLock(scope, scope === 'blueprint' ? 1200 : 300);

    // Se non ci sono conflitti: PRENDE IL LOCK (First-Come)
    activeScope = scope;
    localStorage.setItem(`sitebos_lock_${scope}`, currentTabId);
    localStorage.setItem(`sitebos_hb_${scope}`, Date.now().toString());

    // Avvia Heartbeat locale ogni 3 secondi per segnalare che la scheda è viva
    heartbeatInterval = setInterval(function () {
      if (activeScope) {
        localStorage.setItem(`sitebos_hb_${activeScope}`, Date.now().toString());
      }
    }, 3000);

    // Rilascio immediato del lock alla chiusura della pagina (Local + Remote sendBeacon)
    const releaseLock = function () {
      if (activeScope) {
        if (localStorage.getItem(`sitebos_lock_${activeScope}`) === currentTabId) {
          localStorage.removeItem(`sitebos_lock_${activeScope}`);
          localStorage.removeItem(`sitebos_hb_${activeScope}`);
        }
        sendBeaconCrossRelease(activeScope);
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };

    window.addEventListener('beforeunload', releaseLock);
    window.addEventListener('unload', releaseLock);
    window.addEventListener('pagehide', releaseLock);
    window.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') releaseLock();
    });

    return true;
  }

  /**
   * Inizializzatore Globale Launch & Fullscreen TWA
   */
  function initSiteBosTwaLaunch(options = {}) {
    const defaultOptions = {
      headerColor: '#ffffff',
      backgroundColor: '#ffffff',
      disableVerticalSwipes: true,
      enableFullscreen: false
    };
    const opts = Object.assign({}, defaultOptions, options);

    const tg = window.Telegram?.WebApp;

    // ── IFRAME DETECTION ────────────────────────────────────────────────────────
    // Se questa pagina è caricata dentro un iframe (DesktopWindowManager openWindow),
    // non deve competere per lock cross-tab, non deve richiedere fullscreen e non
    // deve bloccare le swipe. La finestra è già gestita dal workspace parent.
    const isEmbeddedInIframe = (function () {
      try { return window !== window.top; } catch (_) { return true; }
    })();

    if (isEmbeddedInIframe) {
      // Espone DesktopWindowManager del parent per poter aprire sub-finestre da dentro l'iframe
      try {
        if (window.parent && window.parent.DesktopWindowManager) {
          window.DesktopWindowManager = window.parent.DesktopWindowManager;
        }
      } catch (_) {}

      // ── TAGLIA LA TESTA AL TORO: NASCONDE L'HEADER INTERNO IN MODALITÀ DESKTOP IFRAME ──
      // La finestra DesktopWindowManager ha già la sua barra del titolo con pulsante Chiudi (X).
      // Nascondere l'header della pagina elimina la doppia barra, il tasto indietro e risparmia spazio.
      (function injectDesktopHeaderHider() {
        const styleEl = document.createElement('style');
        styleEl.id = 'sitebos-desktop-header-hider';
        styleEl.innerHTML = `
          header, 
          .twa-header, 
          .mobile-header, 
          .page-top-header { 
            display: none !important; 
          }
          body { 
            padding-top: 0 !important; 
            margin-top: 0 !important; 
          }
        `;
        const target = document.head || document.documentElement;
        if (target) target.appendChild(styleEl);
        else document.addEventListener('DOMContentLoaded', () => document.head.appendChild(styleEl));
      })();

      // ── INTERCETTA NAVIGAZIONE A DASHBOARD / BACK DENTRO L'IFRAME ─────────────
      // Evita l'effetto Inception (dashboard dentro la mini-finestra).
      // Se una pagina dentro l'iframe naviga a dashboard.html o preme un tasto indietro
      // che porta alla dashboard, chiude la finestra dell'iframe anziché ricaricare la dashboard!
      function closeParentWindowIfEmbedded() {
        try {
          if (window.parent && window.parent.DesktopWindowManager) {
            const parentIframes = Array.from(window.parent.document.querySelectorAll('iframe'));
            const myIframe = parentIframes.find(f => f.contentWindow === window);
            if (myIframe) {
              const winElem = myIframe.closest('[id^="win_"]');
              if (winElem) {
                window.parent.DesktopWindowManager.closeWindow(winElem.id);
                return true;
              }
            }
          }
        } catch (_) {}
        return false;
      }

      // Intercetta click su pulsanti o link indietro diretti a dashboard.html
      document.addEventListener('click', function (e) {
        const targetEl = e.target.closest('a, button, [onclick], div');
        if (!targetEl) return;

        const onclickAttr = (targetEl.getAttribute('onclick') || '').toLowerCase();
        const hrefAttr = (targetEl.getAttribute('href') || '').toLowerCase();

        if (onclickAttr.includes('dashboard.html') || hrefAttr.includes('dashboard.html')) {
          e.preventDefault();
          e.stopPropagation();
          closeParentWindowIfEmbedded();
        }
      }, true);

      // Nessun lock, nessun fullscreen, nessun blocco swipe — tutto gestito dal parent
      return tg || null;
    }
    // ────────────────────────────────────────────────────────────────────────────

    // 1. Analisi Pagina & Inizializzazione Lock First-Come First-Served
    const pageAnalysis = analyzePageScope();
    const isAllowed = setupFirstComeLock(pageAnalysis);

    if (!isAllowed) {
      // Se bloccato, ferma l'esecuzione di script secondari
      return null;
    }


    if (!tg) {
      return null;
    }

    try {
      // 2. Inizializzazione SDK Telegram
      if (typeof tg.ready === 'function') {
        tg.ready();
      }

      // 3. Launch Mode: Ripristina la preferenza utente salvata (Schermo Intero vs Finestra)
      const savedFsPref = (function () {
        try {
          const local = localStorage.getItem('sitebos_desktop_fullscreen_pref');
          if (local !== null) return local === 'true';
          const cookies = document.cookie.split(';');
          for (let c of cookies) {
            const [name, val] = c.trim().split('=');
            if (name === 'sitebos_desktop_fullscreen_pref') return val === 'true';
          }
        } catch (_) {}
        return false;
      })();

      if ((opts.enableFullscreen || savedFsPref) && typeof tg.requestFullscreen === 'function') {
        try { tg.requestFullscreen(); } catch (_) {}
      }
      if (typeof tg.expand === 'function') {
        try { tg.expand(); } catch (_) {}
      }

      // Helper Globale per commutare tra Schermo Intero Widescreen e Finestra Normale con Persistenza
      window.updateTelegramFullscreenUi = function () {
        const tg = window.Telegram?.WebApp;
        const isFs = Boolean(tg && (tg.isFullscreen || window._sitebosManualFs || savedFsPref));
        const labelEl = document.getElementById('label-fullscreen-toggle');
        const btnEl = document.getElementById('btn-toggle-telegram-fullscreen');
        if (labelEl) labelEl.textContent = isFs ? 'Ripristina Finestra' : 'Schermo Intero';
        if (btnEl) {
          const iconEl = btnEl.querySelector('i');
          if (iconEl) iconEl.className = isFs ? 'fas fa-compress' : 'fas fa-expand';
        }
      };

      window.toggleTelegramFullscreen = function () {
        const tg = window.Telegram?.WebApp;
        let isCurrentlyFs = Boolean(tg && (tg.isFullscreen || window._sitebosManualFs));
        let nextFs = !isCurrentlyFs;

        window._sitebosManualFs = nextFs;
        try {
          localStorage.setItem('sitebos_desktop_fullscreen_pref', nextFs ? 'true' : 'false');
          document.cookie = `sitebos_desktop_fullscreen_pref=${nextFs}; path=/; max-age=31536000`;
        } catch (_) {}

        if (tg) {
          if (nextFs) {
            if (typeof tg.requestFullscreen === 'function') {
              try { tg.requestFullscreen(); } catch (_) {}
            }
            if (typeof tg.expand === 'function') {
              try { tg.expand(); } catch (_) {}
            }
          } else {
            if (typeof tg.exitFullscreen === 'function') {
              try { tg.exitFullscreen(); } catch (_) {}
            }
          }
        }

        window.updateTelegramFullscreenUi();
        setTimeout(window.updateTelegramFullscreenUi, 120);
        return nextFs;
      };

      // Listener per eventi nativi Telegram di cambio fullscreen e ridimensionamento
      if (tg && typeof tg.onEvent === 'function') {
        try { tg.onEvent('fullscreenChanged', window.updateTelegramFullscreenUi); } catch (_) {}
        try { tg.onEvent('viewportChanged', window.updateTelegramFullscreenUi); } catch (_) {}
      }
      window.addEventListener('resize', window.updateTelegramFullscreenUi);

      // 4. Blocco Swipe Verticale per proteggere Caroselli 3D e gesture
      if (opts.disableVerticalSwipes && typeof tg.disableVerticalSwipes === 'function') {
        try {
          tg.disableVerticalSwipes();
        } catch (_) {}
      }

      // 5. Personalizzazione Colori Tema (Header & Background Bianchi)
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

  // Auto-esecuzione soft al DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSiteBosTwaLaunch();
    });
  } else {
    initSiteBosTwaLaunch();
  }

  // Auto-Inject sitebos_dirty_guard.js in qualsiasi pagina se non già caricata nel DOM
  (function autoLoadDirtyGuard() {
    if (window.SiteBosDirtyGuard) return;
    const script = document.createElement('script');
    script.src = (function () {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/dashboard/') || path.includes('/gestione/') || path.includes('/identity/') || path.includes('/operativita/') || path.includes('/agents/') || path.includes('/softskill/') || path.includes('/supporto/') || path.includes('/fine-tuning/')) {
        return '../sitebos_dirty_guard.js';
      }
      return './sitebos_dirty_guard.js';
    })();
    document.head.appendChild(script);
  })();
})(window);
