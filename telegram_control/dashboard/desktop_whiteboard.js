/**
 * SiteBoS MiniApp — Desktop Whiteboard & Shortcuts Cookie Manager
 * Modulo Chirurgico Isolato per la "Lavagna di Bottoncioni" a tutto schermo e Pin Scorciatoie
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
  'use strict';

  const STORAGE_KEY = 'sitebos_desktop_shortcuts';

  /**
   * Gestione Cookie & LocalStorage per le Scorciatoie
   */
  function getPinnedShortcuts() {
    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) return JSON.parse(rawLocal);

      const cookies = document.cookie.split(';');
      for (let c of cookies) {
        const [name, val] = c.trim().split('=');
        if (name === STORAGE_KEY) return JSON.parse(decodeURIComponent(val));
      }
    } catch (_) {}
    return [];
  }

  function savePinnedShortcuts(shortcuts) {
    try {
      const jsonStr = JSON.stringify(shortcuts);
      localStorage.setItem(STORAGE_KEY, jsonStr);
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(jsonStr)}; path=/; max-age=31536000`;
    } catch (_) {}
  }

  function isPinned(url) {
    if (!url) return false;
    const shortcuts = getPinnedShortcuts();
    return shortcuts.some(s => s.url === url);
  }

  function togglePinShortcut(pageObj) {
    let shortcuts = getPinnedShortcuts();
    if (isPinned(pageObj.url)) {
      shortcuts = shortcuts.filter(s => s.url !== pageObj.url);
    } else {
      shortcuts.push({
        name: pageObj.name || pageObj.label || 'Pagina',
        url: pageObj.url,
        icon: pageObj.icon || 'fas fa-link',
        category: pageObj.category || 'generale'
      });
    }
    savePinnedShortcuts(shortcuts);
    renderDesktopWhiteboard();
  }

  /**
   * Rileva le icone più adatte per ciascuna pagina/categoria
   */
  function resolveIconForPage(name, category, url) {
    const lower = (name + ' ' + (url || '')).toLowerCase();
    if (lower.includes('catalogo') || lower.includes('listino')) return 'fas fa-store';
    if (lower.includes('prodotto') || lower.includes('prodotti')) return 'fas fa-box-open';
    if (lower.includes('servizio') || lower.includes('servizi')) return 'fas fa-concierge-bell';
    if (lower.includes('sop') || lower.includes('blueprint') || lower.includes('procedur')) return 'fas fa-clipboard-list';
    if (lower.includes('sicurezza') || lower.includes('hse')) return 'fas fa-shield-halved';
    if (lower.includes('magazzino') || lower.includes('warehouse')) return 'fas fa-warehouse';
    if (lower.includes('agenda') || lower.includes('calendar')) return 'fas fa-calendar-days';
    if (lower.includes('marketing') || lower.includes('social')) return 'fas fa-bullhorn';
    if (lower.includes('ordine') || lower.includes('ordini')) return 'fas fa-truck-ramp-box';
    if (lower.includes('assistente') || lower.includes('chat')) return 'fas fa-robot';
    if (lower.includes('guida') || lower.includes('manuale')) return 'fas fa-book-open';
    return 'fas fa-layer-group';
  }

  /**
   * Determina in modo inequivocabile se l'utente si trova su uno Smartphone / Tablet Mobile
   * oppure su PC Desktop (Telegram Desktop, Web Browser PC).
   */
  function isMobileDevice() {
    const tg = window.Telegram?.WebApp;
    const platform = (tg?.platform || '').toLowerCase();

    // 1. Telegram App Nativa Mobile (android / ios / mobile) -> Sempre MOBILE
    if (['android', 'ios', 'mobile'].includes(platform)) {
      return true;
    }

    // 2. Telegram Desktop Client Nativo PC (tdesktop / desktop / macos) -> Sempre DESKTOP
    if (['tdesktop', 'desktop', 'macos'].includes(platform)) {
      return false;
    }

    // 3. Check UserAgent per Smartphone / Tablet (Android, iPhone, iPad, Mobile)
    const ua = (navigator.userAgent || '').toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua);
    if (isMobileUA) {
      return true;
    }

    // 4. Touch screen + Schermo Smartphone (< 768px) -> Sempre MOBILE
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = (window.innerWidth < 768) || (window.screen.width < 768);
    if (hasTouch && isSmallScreen) {
      return true;
    }

    // 5. Default per qualsiasi ambiente PC Desktop (Browser Windows / Mac / Linux) -> DESKTOP
    return false;
  }

  /**
   * Struttura delle Macro-Categorie Principali (Ordinamento pulito per la vista Desktop)
   */
  const MACRO_CATEGORIES = [
    {
      id: "identity_hub",
      categoryKey: "identity",
      label: "Configurazione",
      desc: "Anagrafica aziendale, verticalizzazione di settore e setup dei conti finanziari.",
      icon: "fa-id-card",
      badge: "IDENTITY & SETUP"
    },
    {
      id: "catalog",
      categoryKey: "gestione",
      label: "Gestione & Catalogo",
      desc: "Configura i prodotti, i servizi e le istruzioni operative delle SOP.",
      icon: "fa-box-open",
      badge: "PRODOTTI & SERVIZI"
    },
    {
      id: "operativita",
      categoryKey: "operativita",
      label: "Operatività & Commesse",
      desc: "Evasione ordini live, pianificazione agenda e percorsi logistici AI.",
      icon: "fa-clock",
      badge: "LOGISTICA & COMMESSE"
    },
    {
      id: "intelligence_hub",
      categoryKey: "intelligence",
      label: "Analisi & Controllo",
      desc: "Intelligence direzionale, analisi concorrenza, sicurazza HSE e CFO.",
      icon: "fa-chart-line",
      badge: "CFO & AUDIT"
    },
    {
      id: "support_hub",
      categoryKey: "supporto",
      label: "Supporto & Assistenza",
      desc: "Ticket di supporto tecnico e deviazione chat ad operatori umani.",
      icon: "fa-headset",
      badge: "TICKET & HELP",
      directUrl: "supporto/support_hub.html"
    },
    {
      id: "fine_tuning",
      categoryKey: "addestramento",
      label: "Addestramento AI",
      desc: "Esporta i dati di SiteBoS in formato JSONL per addestrare modelli LLM.",
      icon: "fa-brain",
      badge: "JSONL EXPORT",
      directUrl: "fine-tuning/fine-tuning.html"
    }
  ];

  /**
   * Renderizza la Lavagna di Bottoncioni Desktop (Ordinata per Macro-Categorie ed Espansione)
   */
  function renderDesktopWhiteboard(activeCategory = null) {
    const whiteboardContainer = document.getElementById('desktop-whiteboard-container');
    const mainCarousel = document.querySelector('main');
    if (!whiteboardContainer) return;

    const isMobile = isMobileDevice();

    // Se l'utente è su SMARTPHONE -> Mostra solo il Carosello 3D TWA e nasconde la lavagna desktop
    if (isMobile) {
      whiteboardContainer.classList.add('hidden');
      whiteboardContainer.classList.remove('flex');
      if (mainCarousel) {
        mainCarousel.classList.remove('hidden');
        mainCarousel.classList.add('flex');
      }
      return;
    }

    // Se l'utente è su PC DESKTOP -> Mostra la Lavagna e nasconde il carosello mobile
    whiteboardContainer.classList.remove('hidden');
    whiteboardContainer.classList.add('flex');
    if (mainCarousel) {
      mainCarousel.classList.add('hidden');
      mainCarousel.classList.remove('flex');
    }

    const registry = window.getOwnerPagesRegistry ? window.getOwnerPagesRegistry() : [];
    const shortcuts = getPinnedShortcuts();

    let html = '';

    // 1. SEZIONE ⭐ LE MIE SCORCIATOIE (se presenti item salvati nel cookie)
    if (shortcuts.length > 0 && !activeCategory) {
      html += `
        <div class="mb-8 select-none">
          <div class="flex items-center gap-2 mb-3.5 px-1">
            <i class="fas fa-star text-amber-400 text-sm"></i>
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-200">⭐ LE MIE SCORCIATOIE PREFERITE</h2>
            <span class="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[9px] font-black text-amber-400">${shortcuts.length} PINNED</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      `;
      shortcuts.forEach(s => {
        html += `
          <div onclick="window.DesktopWhiteboard.handleTileClick('${s.url}', '${s.name.replace(/'/g, "\\'")}', '${s.icon}')"
               class="group relative bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl">
            <button onclick="event.stopPropagation(); window.DesktopWhiteboard.togglePin('${s.url}')" 
                    class="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs hover:bg-amber-500 hover:text-white transition z-10"
                    title="Rimuovi dai preferiti">
              <i class="fas fa-star text-[10px]"></i>
            </button>
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition duration-300">
              <i class="${s.icon}"></i>
            </div>
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-amber-400/90 block mb-0.5">SCORCIATOIA RAPIDA</span>
              <h3 class="text-xs font-black uppercase text-slate-100 leading-snug group-hover:text-white">${s.name}</h3>
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    // 2. BREADCRUMB HEADER ("Dove siamo" Sync)
    html += `
      <div class="flex items-center justify-between mb-6 px-1 select-none">
        <div class="flex items-center gap-3">
          ${activeCategory ? `
            <button onclick="window.DesktopWhiteboard.render(null)" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs transition cursor-pointer shadow-md" title="Torna alle Macro-Categorie">
              <i class="fas fa-arrow-left"></i>
            </button>
          ` : ''}
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-widest text-blue-400">
                ${activeCategory ? 'SOTTOMENU SEZIONE' : 'VISTA AD ESPANSIONE — MACRO CATEGORIE'}
              </span>
            </div>
            <h1 class="text-lg font-black uppercase text-white tracking-tight">
              ${activeCategory ? `SEZIONE: ${activeCategory.toUpperCase()}` : 'SELEZIONA UNA MACRO CATEGORIA'}
            </h1>
          </div>
        </div>
      </div>
    `;

    // 3. VISTA 1: MACRO-CATEGORIE PRINCIPALI (Home della Lavagna Desktop)
    if (!activeCategory) {
      html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">`;
      MACRO_CATEGORIES.forEach(macro => {
        html += `
          <div onclick="window.DesktopWhiteboard.handleMacroClick('${macro.id}', '${macro.categoryKey}', '${macro.directUrl || ''}', '${macro.label.replace(/'/g, "\\'")}', '${macro.icon}')"
               class="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-6 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-2xl">
            
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-500/20 transition duration-300 shadow-md">
                  <i class="fas ${macro.icon}"></i>
                </div>
                <span class="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  ${macro.badge}
                </span>
              </div>
              
              <h3 class="text-base font-black uppercase text-slate-100 leading-tight mb-2 group-hover:text-white transition">
                ${macro.label}
              </h3>
              <p class="text-xs text-slate-400 font-medium leading-relaxed">
                ${macro.desc}
              </p>
            </div>

            <div class="pt-4 mt-6 border-t border-slate-800/80 flex items-center justify-between text-slate-400 group-hover:text-blue-400 text-xs font-bold transition">
              <span class="text-[10px] uppercase tracking-wider">
                ${macro.directUrl ? 'APRI MODULO DIRECT' : 'ESPLORA SOTTOMENU ➔'}
              </span>
              <i class="fas fa-chevron-right text-xs group-hover:translate-x-1 transition duration-200"></i>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } 
    // 4. VISTA 2: SOTTOMENU ESPANSO PER LA CATEGORIA SELEZIONATA
    else {
      let filteredPages = registry.filter(p => p.category === activeCategory || p.category === activeCategory.replace('_hub', ''));
      if (filteredPages.length === 0) {
        filteredPages = registry.filter(p => (p.url || '').includes(activeCategory));
      }

      html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">`;

      filteredPages.forEach(page => {
        const pageIcon = resolveIconForPage(page.name, page.category, page.url);
        const pinned = isPinned(page.url);

        html += `
          <div onclick="window.DesktopWhiteboard.handleTileClick('${page.url}', '${page.name.replace(/'/g, "\\'")}', '${pageIcon}')"
               class="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-5 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-2xl">
            
            <button onclick="event.stopPropagation(); window.DesktopWhiteboard.togglePin('${page.url}', '${page.name.replace(/'/g, "\\'")}', '${pageIcon}', '${page.category}')" 
                    class="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 flex items-center justify-center text-xs transition z-10"
                    title="${pinned ? 'Rimuovi dai preferiti' : 'Aggiungi alle scorciatoie'}">
              <i class="${pinned ? 'fas fa-star text-amber-400' : 'far fa-star'} text-xs"></i>
            </button>

            <div class="mb-4">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition duration-300 shadow-md">
                <i class="${pageIcon}"></i>
              </div>
              <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-black text-[9px] uppercase tracking-widest mb-1.5">
                ${page.category ? page.category.toUpperCase() : 'MODULO'}
              </span>
              <h3 class="text-sm font-black uppercase text-slate-100 leading-tight group-hover:text-white transition">
                ${page.name}
              </h3>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-slate-400 group-hover:text-blue-400 text-xs font-bold transition">
              <span class="text-[10px] uppercase tracking-wider">APRI MODULO</span>
              <i class="fas fa-arrow-up-right-from-square text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-200"></i>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    whiteboardContainer.innerHTML = html;
  }

  /**
   * Gestione del click su una Macro-Categoria
   */
  function handleMacroClick(id, categoryKey, directUrl, label, icon) {
    if (directUrl) {
      handleTileClick(directUrl, label, icon);
    } else {
      renderDesktopWhiteboard(categoryKey || id);
    }
  }

  /**
   * Gestione del click su una card modulo
   */
  function handleTileClick(url, name, icon) {
    if (!isMobileDevice() && window.DesktopWindowManager) {
      window.DesktopWindowManager.openWindow({
        title: name,
        url: url,
        icon: icon,
        width: 880,
        height: 640
      });
    } else {
      window.location.href = url;
    }
  }

  // Inizializzazione al caricamento
  document.addEventListener('DOMContentLoaded', function () {
    renderDesktopWhiteboard();
    window.addEventListener('resize', function () {
      renderDesktopWhiteboard();
    });
  });

  // Esporta nel namespace globale
  window.DesktopWhiteboard = {
    render: renderDesktopWhiteboard,
    handleMacroClick: handleMacroClick,
    handleTileClick: handleTileClick,
    togglePin: function (url, name, icon, category) {
      togglePinShortcut({ url, name, icon, category });
    }
  };

})(window);
