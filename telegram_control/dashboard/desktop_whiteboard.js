/**
 * SiteBoS MiniApp — Desktop Whiteboard & Shortcuts Cookie Manager
 * Modulo Chirurgico Isolato per la "Lavagna di Bottoncioni" Light Glassmorphic ad alta leggibilità
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
   * Struttura delle Macro-Categorie Principali (Ordinamento pulito per la vista Desktop Light)
   */
  const MACRO_CATEGORIES = [
    {
      id: "identity_hub",
      categoryKey: "identity",
      label: "Configurazione",
      desc: "Anagrafica aziendale, setup del bot, verticalizzazione di settore e conti finanziari.",
      icon: "fa-id-card",
      badge: "IDENTITY & SETUP"
    },
    {
      id: "catalog",
      categoryKey: "gestione",
      label: "Gestione & Catalogo",
      desc: "Listini master prodotti e servizi, schede SOP blueprint, articoli e categorie.",
      icon: "fa-box-open",
      badge: "PRODOTTI & SERVIZI"
    },
    {
      id: "operativita",
      categoryKey: "operativita",
      label: "Operatività & Commesse",
      desc: "Evasione ordini live, pianificazione del piano lavori e percorsi logistici AI.",
      icon: "fa-clock",
      badge: "LOGISTICA & COMMESSE"
    },
    {
      id: "intelligence_hub",
      categoryKey: "intelligence",
      label: "Analisi & Controllo",
      desc: "Intelligence direzionale, analisi concorrenza, sicurazza HSE, magazzino e CFO.",
      icon: "fa-chart-line",
      badge: "CFO & AUDIT"
    },
    {
      id: "support_hub",
      categoryKey: "supporto",
      label: "Supporto & Assistenza",
      desc: "Ticket di supporto tecnico e deviazione della chat ad operatori umani.",
      icon: "fa-headset",
      badge: "TICKET & HELP",
      directUrl: "../supporto/support_hub.html"
    },
    {
      id: "fine_tuning",
      categoryKey: "addestramento",
      label: "Addestramento AI",
      desc: "Esporta i dati di SiteBoS in formato JSONL per addestrare modelli LLM personalizzati.",
      icon: "fa-brain",
      badge: "JSONL EXPORT",
      directUrl: "../fine-tuning/fine-tuning.html"
    }
  ];

  /**
   * Mappatura completa e rigida di tutti i sottomenu e collegamenti per ciascuna categoria
   */
  const SUBMENU_MAP = {
    identity: [
      { name: "Setup Configurazione Bot", desc: "Personalizza le impostazioni ed il comportamento del bot.", url: "../identity/bot_config.html", icon: "fa-robot", category: "identity" },
      { name: "Dati Titolare & Azienda", desc: "Gestisci l'anagrafica, la firma ed i recapiti aziendali.", url: "../identity/edit_owner.html", icon: "fa-user-gear", category: "identity" },
      { name: "Setup Avanzato & Fiscale", desc: "Verticalizzazione del settore ed impostazioni dei conti finanziari.", url: "../identity/advanced-setup.html", icon: "fa-sliders", category: "identity" },
      { name: "Piattaforma TrinAi Cloud", desc: "Accedi alla suite cloud direzionale ed all'ecosistema di intelligenza aziendale TrinAi.", url: "https://dashboard.trinai.it", icon: "TrinAi_Logo.jpg", category: "identity" }
    ],
    gestione: [
      { name: "Catalogo Master Prodotti & Servizi", desc: "Listino unico di consultazione ed editing rapido.", url: "../gestione/catalog.html", icon: "fa-store", category: "gestione" },
      { name: "Macro Prodotti & Asset Digitali", desc: "Schede dei soli prodotti fisici e digitali.", url: "../gestione/catalog.html?macro=PRO", icon: "fa-box-open", category: "gestione" },
      { name: "Macro Servizi & Prestazioni", desc: "Schede dei soli servizi e trattamenti professionali.", url: "../gestione/catalog.html?macro=SER", icon: "fa-concierge-bell", category: "gestione" },
      { name: "Macro Procedure SOP & Blueprint", desc: "Istruzioni operative standard e ricette lavorative.", url: "../gestione/catalog.html?macro=SOP", icon: "fa-clipboard-list", category: "gestione" },
      { name: "Inserisci Nuovo Prodotto / Servizio", desc: "Form di creazione guidata per nuovi prodotti e servizi.", url: "../gestione/add-product.html", icon: "fa-plus-circle", category: "gestione" },
      { name: "Inserisci Nuova Categoria", desc: "Crea una nuova categoria merceologica nel listino.", url: "../gestione/add-category.html", icon: "fa-folder-plus", category: "gestione" },
      { name: "Gestione Blog & News", desc: "Pubblica articoli ed aggiornamenti sul canale aziendale.", url: "../gestione/edit-blog.html", icon: "fa-newspaper", category: "gestione" }
    ],
    operativita: [
      { name: "Ordini Live & Spedizioni", desc: "Monitoraggio in tempo reale degli ordini in entrata.", url: "../operativita/orders-manager.html", icon: "fa-truck-ramp-box", category: "operativita" },
      { name: "Piano Lavori & Priorità", desc: "Organizza le code di lavoro e pianifica l'evasione commesse.", url: "../operativita/job-create.html", icon: "fa-tasks", category: "operativita" },
      { name: "Percorsi AI Logistica", desc: "Algoritmi predittivi per l'ottimizzazione percorsi consegne.", url: "../operativita/pianificazione_itinerari.html", icon: "fa-route", category: "operativita" }
    ],
    intelligence: [
      { name: "Intelligence Generale Direzionale", desc: "Modulo di controllo direzionale e reportistica sintetica.", url: "../agents/agent_intelligence.html", icon: "fa-brain", category: "intelligence" },
      { name: "Analisi Concorrenza Territoriale", desc: "Benchmarking automatizzato dei competitor di settore.", url: "../agents/analisi-mercato.html", icon: "fa-search-dollar", category: "intelligence" },
      { name: "Sicurezza HSE & Conformità Normativa", desc: "Verifica DVR, sicurezza sul lavoro e adempimenti antinfortunistici.", url: "../agents/assistente-sicurezza.html", icon: "fa-shield-halved", category: "intelligence" },
      { name: "Controllo Gestione CFO & Marginalità", desc: "Monitoraggio flussi di cassa, bilancio e marginalità.", url: "../agents/controllo_gestione.html", icon: "fa-coins", category: "intelligence" },
      { name: "Magazzino AI & Ottimizzazione Scorte", desc: "Gestione ed ottimizzazione automatizzata delle scorte.", url: "../agents/intelligent-warehouse.html", icon: "fa-warehouse", category: "intelligence" },
      { name: "Analisi Agenda & Tempi Staff", desc: "Pianificazione agenda ed ottimizzazione tempi del personale.", url: "../agents/agenda.html", icon: "fa-calendar-days", category: "intelligence" },
      { name: "Supervisor Hub Auditing", desc: "Pannello supervisor per l'ispezione ed auditing delle SOP.", url: "../gestione/supervisor_hub.html", icon: "fa-user-check", category: "intelligence" }
    ],
    supporto: [
      { name: "Support Hub & Ticket", desc: "Centro di assistenza tecnica e gestione ticket.", url: "../supporto/support_hub.html", icon: "fa-headset", category: "supporto" }
    ],
    addestramento: [
      { name: "Fine-Tuning Export Dataset JSONL", desc: "Esporta le conversazioni ed i dati per l'addestramento LLM.", url: "../fine-tuning/fine-tuning.html", icon: "fa-brain", category: "addestramento" }
    ]
  };

  /**
   * Renderizza la Lavagna di Bottoncioni Desktop LIGHT GLASSMORPHIC
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

    const shortcuts = getPinnedShortcuts();

    let html = '';

    // 1. SEZIONE ⭐ LE MIE SCORCIATOIE PREFERITE (LIGHT THEME)
    if (shortcuts.length > 0 && !activeCategory) {
      html += `
        <div class="mb-8 select-none">
          <div class="flex items-center gap-2 mb-3.5 px-1">
            <i class="fas fa-star text-amber-500 text-sm"></i>
            <h2 class="text-xs font-black uppercase tracking-widest text-slate-800">⭐ LE MIE SCORCIATOIE PREFERITE</h2>
            <span class="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[9px] font-black text-amber-700">${shortcuts.length} PINNED</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      `;
      shortcuts.forEach(s => {
        html += `
          <div onclick="window.DesktopWhiteboard.handleTileClick('${s.url}', '${s.name.replace(/'/g, "\\'")}', '${s.icon}')"
               class="group relative bg-white/90 hover:bg-white border border-amber-300/80 hover:border-amber-500 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl">
            <button onclick="event.stopPropagation(); window.DesktopWhiteboard.togglePin('${s.url}')" 
                    class="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs hover:bg-amber-500 hover:text-white transition z-10"
                    title="Rimuovi dai preferiti">
              <i class="fas fa-star text-[10px]"></i>
            </button>
            <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition duration-300 shadow-xs">
              <i class="${s.icon}"></i>
            </div>
            <div>
              <span class="text-[9px] font-black uppercase tracking-wider text-amber-600 block mb-0.5">SCORCIATOIA RAPIDA</span>
              <h3 class="text-xs font-black uppercase text-slate-900 leading-snug group-hover:text-amber-700 transition">${s.name}</h3>
            </div>
          </div>
        `;
      });
      html += `</div></div>`;
    }

    // 2. HEADER BAR CON ALTA LEGGIBILITÀ TIPOGRAFICA & PULSANTI AZIONE (VOCALE + MANUALE)
    html += `
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 px-1 select-none border-b border-slate-200/80 pb-5">
        <div class="flex items-center gap-3">
          ${activeCategory ? `
            <button onclick="window.DesktopWhiteboard.render(null)" class="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-sm flex items-center justify-center text-xs transition cursor-pointer" title="Torna alle Macro-Categorie">
              <i class="fas fa-arrow-left"></i>
            </button>
          ` : ''}
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-widest text-blue-600">
                ${activeCategory ? 'SOTTOMENU STRUMENTI' : 'WORKSPACE DESKTOP AD ESPANSIONE'}
              </span>
            </div>
            <h1 class="text-xl font-black uppercase text-slate-900 tracking-tight mt-0.5">
              ${activeCategory ? `SEZIONE: ${activeCategory.toUpperCase()}` : 'MACRO CATEGORIE DI GESTIONE'}
            </h1>
            <p class="text-xs text-slate-600 font-bold mt-0.5">
              ${activeCategory ? 'Seleziona un modulo operativo per aprirlo in finestra trascinabile.' : 'Seleziona una Macro Categoria per esplorare gli strumenti e i moduli aziendali.'}
            </p>
          </div>
        </div>

        <!-- TOOLBAR AZIONI DESKTOP ESSENZIALI (ASSISTENTE BOT, MANUALE UTENTE, AUDIO GUIDA) -->
        <div class="flex items-center gap-2.5 shrink-0">
          
          <!-- 1. ASSISTENTE BOT (fas fa-robot) -->
          <button onclick="typeof window.handleVoiceAgentClick === 'function' ? window.handleVoiceAgentClick() : (window.toggleVoiceAgentOverlay ? window.toggleVoiceAgentOverlay(true) : null)" 
                  class="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200/90 text-slate-800 hover:text-blue-700 font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition active:scale-95"
                  title="Assistente Bot SiteBoS">
            <div class="w-6 h-6 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
              <i class="fas fa-robot"></i>
            </div>
            <span>Assistente Bot</span>
          </button>

          <!-- 2. MANUALE UTENTE GUIDA (fas fa-globe) -->
          <button onclick="window.openUserGuide ? window.openUserGuide('../userguide/01_intro.html') : null" 
                  class="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 hover:text-slate-900 font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition active:scale-95"
                  title="Manuale Utente & Guida Operativa">
            <div class="w-6 h-6 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center text-xs">
              <i class="fas fa-globe"></i>
            </div>
            <span>Manuale Utente</span>
          </button>

          <!-- 3. GUIDA AUDIO SYNTH (fas fa-volume-high) -->
          <button onclick="typeof window.toggleDashboardAudio === 'function' ? window.toggleDashboardAudio() : null" 
                  class="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200/90 text-slate-800 hover:text-emerald-700 font-black text-xs shadow-xs flex items-center gap-2 cursor-pointer transition active:scale-95"
                  title="Guida Vocale Audio Sintetizzato">
            <div class="w-6 h-6 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <i class="fas fa-volume-high"></i>
            </div>
            <span>Audio Guida</span>
          </button>

        </div>
      </div>
    `;

    // 3. VISTA 1: MACRO-CATEGORIE PRINCIPALI (LIGHT CARDS)
    if (!activeCategory) {
      html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">`;
      MACRO_CATEGORIES.forEach(macro => {
        const subCount = SUBMENU_MAP[macro.categoryKey] ? SUBMENU_MAP[macro.categoryKey].length : 1;

        html += `
          <div onclick="window.DesktopWhiteboard.handleMacroClick('${macro.id}', '${macro.categoryKey}', '${macro.directUrl || ''}', '${macro.label.replace(/'/g, "\\'")}', '${macro.icon}')"
               class="group relative bg-white/95 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-3xl p-6 flex flex-col justify-between shadow-md hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-2xl">
            
            <div>
              <div class="flex items-center justify-between mb-4">
                <div class="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300 shadow-sm">
                  <i class="fas ${macro.icon}"></i>
                </div>
                <span class="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[9px] font-black text-blue-700 uppercase tracking-widest">
                  ${macro.badge}
                </span>
              </div>
              
              <h3 class="text-base font-black uppercase text-slate-900 leading-tight mb-1.5 group-hover:text-blue-600 transition">
                ${macro.label}
              </h3>
              <p class="text-xs text-slate-600 font-medium leading-relaxed">
                ${macro.desc}
              </p>
            </div>

            <div class="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-slate-500 group-hover:text-blue-600 text-xs font-bold transition">
              <span class="text-[10px] font-black uppercase tracking-wider">
                ${macro.directUrl ? 'APRI MODULO DIRECT' : `ESPLORA SOTTOMENU (${subCount}) ➔`}
              </span>
              <i class="fas fa-chevron-right text-xs group-hover:translate-x-1 transition duration-200"></i>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    } 
    // 4. VISTA 2: SOTTOMENU ESPANSO PER LA CATEGORIA SELEZIONATA (LIGHT CARDS)
    else {
      const subList = SUBMENU_MAP[activeCategory] || [];

      html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">`;

      subList.forEach(page => {
        const pinned = isPinned(page.url);

        html += `
          <div onclick="window.DesktopWhiteboard.handleTileClick('${page.url}', '${page.name.replace(/'/g, "\\'")}', '${page.icon}')"
               class="group relative bg-white/95 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-3xl p-5 flex flex-col justify-between shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-2xl">
            
            <button onclick="event.stopPropagation(); window.DesktopWhiteboard.togglePin('${page.url}', '${page.name.replace(/'/g, "\\'")}', '${page.icon}', '${page.category}')" 
                    class="absolute top-3.5 right-3.5 w-7 h-7 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-600 flex items-center justify-center text-xs transition z-10"
                    title="${pinned ? 'Rimuovi dai preferiti' : 'Aggiungi alle scorciatoie'}">
              <i class="${pinned ? 'fas fa-star text-amber-500' : 'far fa-star'} text-xs"></i>
            </button>

            <div class="mb-4">
              <div class="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 text-blue-600 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition duration-300 shadow-sm p-1.5 overflow-hidden">
                ${page.icon && page.icon.includes('.') ? `
                  <img src="${page.icon}" alt="Logo" class="w-full h-full object-contain rounded-xl">
                ` : `
                  <i class="fas ${page.icon}"></i>
                `}
              </div>
              <span class="inline-block px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-widest mb-1.5">
                ${page.category ? page.category.toUpperCase() : 'MODULO'}
              </span>
              <h3 class="text-sm font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition">
                ${page.name}
              </h3>
              <p class="text-[11px] text-slate-500 font-medium leading-normal mt-1">
                ${page.desc || ''}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 group-hover:text-blue-600 text-xs font-bold transition">
              <span class="text-[10px] font-black uppercase tracking-wider">APRI IN FINESTRA</span>
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
   * Eccezione catalog: apre DIRETTAMENTE l'overlay senza passare per il sottomenu.
   */
  function handleMacroClick(id, categoryKey, directUrl, label, icon) {
    // Catalogo -> apre DIRETTAMENTE l'Overlay Catalogo Desktop (nessun sottomenu intermedio)
    if (categoryKey === 'gestione' || id === 'catalog') {
      if (window.DesktopCatalogOverlay) {
        window.DesktopCatalogOverlay.open('SOP');
        return;
      }
    }
    if (directUrl) {
      handleTileClick(directUrl, label, icon);
    } else {
      renderDesktopWhiteboard(categoryKey || id);
    }
  }

  /**
   * Replicazione 1-a-1 della logica di routing navigateOwnerUrl di dashboard.html (righe 870-882)
   * Costruisce il percorso relativo corretto ../ ed allega i token di sessione ash e msg
   */
  function buildFinalUrl(targetUrl) {
    if (!targetUrl || targetUrl === '#') return '#';
    if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) return targetUrl;

    const urlParams = new URLSearchParams(window.location.search);
    const ash = urlParams.get('ash');
    const msgId = urlParams.get('msg');

    const cleanPath = targetUrl.replace(/^\.\.\//, '');
    const hasQuery = cleanPath.includes('?');
    const p = hasQuery ? '&' : '?';
    let finalUrl = `../${cleanPath}`;

    if (ash && !finalUrl.includes('ash=')) {
      finalUrl += `${p}ash=${encodeURIComponent(ash)}`;
    }
    if (msgId && !finalUrl.includes('msg=')) {
      const p2 = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${p2}msg=${encodeURIComponent(msgId)}`;
    }
    return finalUrl;
  }

  /**
   * Gestione del click su una card modulo:
   * - Desktop: apre DIRETTAMENTE la pagina specifica in finestra iframe flottante (DesktopWindowManager).
   *   Eccezione: il Catalogo Master apre DesktopCatalogOverlay (overlay dati, non pagina HTML separata).
   * - Mobile: naviga normalmente via window.location.href.
   */
  function handleTileClick(url, name, icon) {
    if (!isMobileDevice()) {
      const lowerUrl = (url || '').toLowerCase();

      // Catalogo Master -> unica eccezione: overlay dati flottante (non iframe)
      if (lowerUrl.includes('catalog') || lowerUrl.includes('gestione/catalog')) {
        let macro = 'SOP';
        if (lowerUrl.includes('macro=ser')) macro = 'SER';
        if (lowerUrl.includes('macro=pro')) macro = 'PRO';
        if (window.DesktopCatalogOverlay) {
          window.DesktopCatalogOverlay.open(macro);
          return;
        }
      }

      // Tutte le altre pagine -> iframe flottante diretto a dimensione Smartphone Frame (460x780)
      const targetUrl = buildFinalUrl(url);
      const isWideTool = lowerUrl.includes('trinai');
      const winWidth = isWideTool ? 960 : 460;
      const winHeight = isWideTool ? 720 : 780;

      if (window.DesktopWindowManager) {
        window.DesktopWindowManager.openWindow({
          title: name,
          url: targetUrl,
          icon: icon || 'fas fa-mobile-screen-button',
          width: winWidth,
          height: winHeight
        });
      } else {
        window.location.href = targetUrl;
      }
    } else {
      window.location.href = buildFinalUrl(url);
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
