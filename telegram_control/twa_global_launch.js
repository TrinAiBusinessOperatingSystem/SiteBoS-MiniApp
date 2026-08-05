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
   * Mostra l'overlay visivo calmo, elegante e distensivo
   */
  function renderFriendlyLockOverlay(reasonText) {
    let overlay = document.getElementById('sitebos-friendly-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sitebos-friendly-lock-overlay';
      overlay.className = 'fixed inset-0 bg-slate-950/85 backdrop-blur-lg z-[999999] flex items-center justify-center p-4 transition-opacity duration-300';
      overlay.innerHTML = `
        <div class="bg-slate-900/95 border border-slate-700/80 p-6 rounded-3xl w-full max-w-sm shadow-2xl backdrop-blur-2xl text-center text-slate-100 flex flex-col items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl shadow-lg">
            <i class="fas fa-shield-halved"></i>
          </div>
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              SESSIONE IN USO SU UN ALTRO SCHERMO
            </div>
            <h3 class="text-sm font-extrabold uppercase text-white leading-tight">Sessione in corso su un altro dispositivo</h3>
            <p class="text-xs text-slate-300 font-medium mt-2 leading-relaxed">
              ${reasonText}
            </p>
            <p class="text-[11px] text-slate-400 font-normal mt-2 leading-snug">
              Non appena la sessione sull'altro dispositivo verrà completata o chiusa, potrai lavorare qui in totale tranquillità.
            </p>
          </div>
          <button id="sitebos-go-home-btn" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2">
            <i class="fas fa-house text-xs"></i>
            Torna alla Dashboard
          </button>
        </div>
      `;
      document.body.appendChild(overlay);

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

  /**
   * Avvia il Lock First-Come First-Served Strict
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

    // Check 3: Same Module Lock attivo da un'altra scheda?
    if (isLockActiveOnOtherTab(scope)) {
      renderFriendlyLockOverlay(`Per garantire la sincronizzazione dei dati ed evitare sovrascritture accidentali, questa sezione (<b>${scope}</b>) è attualmente aperta ed operativa su un altro schermo.`);
      return false;
    }

    // Se non ci sono conflitti: PRENDE IL LOCK (First-Come)
    activeScope = scope;
    localStorage.setItem(`sitebos_lock_${scope}`, currentTabId);
    localStorage.setItem(`sitebos_hb_${scope}`, Date.now().toString());

    // Avvia Heartbeat ogni 3 secondi per segnalare che la scheda è viva
    heartbeatInterval = setInterval(function () {
      if (activeScope) {
        localStorage.setItem(`sitebos_hb_${activeScope}`, Date.now().toString());
      }
    }, 3000);

    // Rilascio immediato del lock alla chiusura della pagina
    const releaseLock = function () {
      if (activeScope && localStorage.getItem(`sitebos_lock_${activeScope}`) === currentTabId) {
        localStorage.removeItem(`sitebos_lock_${activeScope}`);
        localStorage.removeItem(`sitebos_hb_${activeScope}`);
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };

    window.addEventListener('beforeunload', releaseLock);
    window.addEventListener('unload', releaseLock);
    window.addEventListener('pagehide', releaseLock);

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

      // 3. Launch Mode: FullScreen su Desktop, FullSize (expand) su Mobile
      const platform = (tg.platform || '').toLowerCase();
      const isDesktopPlatform = ['tdesktop', 'weba', 'webk', 'desktop', 'macos'].includes(platform) || (window.innerWidth >= 768 && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent));

      if (isDesktopPlatform) {
        // Su PC Desktop -> FullScreen totale per sfruttare la Lavagna ed il Window Manager
        if (typeof tg.requestFullscreen === 'function') {
          try { tg.requestFullscreen(); } catch (_) {}
        }
        if (typeof tg.expand === 'function') {
          try { tg.expand(); } catch (_) {}
        }
      } else {
        // Su Mobile Smartphone -> Solo FullSize (tg.expand) per evitare la sovrapposizione sul notch
        if (typeof tg.exitFullscreen === 'function') {
          try { tg.exitFullscreen(); } catch (_) {}
        }
        if (typeof tg.expand === 'function') {
          try { tg.expand(); } catch (_) {}
        }
      }

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
})(window);
