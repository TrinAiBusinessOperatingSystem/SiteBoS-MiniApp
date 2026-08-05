/**
 * SiteBoS MiniApp — Desktop Multi-Window Workspace Engine
 * Modulo Modulare Chirurgico per la gestione di Finestre Mobili Multi-Tasking & Anti-Collisione
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
  'use strict';

  let openWindows = new Map();
  let zIndexCounter = 990000;
  let cascadeIndex = 0;

  /**
   * Genera un ID univoco per la finestra in base all'URL o mod_id
   */
  function sanitizeWindowId(idOrUrl) {
    if (!idOrUrl) return 'win_' + Date.now();
    return 'win_' + idOrUrl.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  /**
   * Assicura la presenza del contenitore Taskbar in fondo allo schermo
   */
  function ensureTaskbar() {
    let taskbar = document.getElementById('desktop-taskbar');
    if (!taskbar) {
      taskbar = document.createElement('div');
      taskbar.id = 'desktop-taskbar';
      taskbar.className = 'hidden md:flex fixed bottom-0 inset-x-0 h-12 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl px-4 py-1.5 z-[999990] items-center gap-2 overflow-x-auto shadow-2xl select-none';
      document.body.appendChild(taskbar);
    }
    return taskbar;
  }

  /**
   * Calcola il posizionamento a cascata controllato (Prevenzione Collisioni Posizionali)
   */
  function calculateCascadePosition(defaultWidth, defaultHeight) {
    const screenW = window.innerWidth || 1200;
    const screenH = window.innerHeight || 800;

    const winW = Math.min(defaultWidth, screenW - 40);
    const winH = Math.min(defaultHeight, screenH - 100);

    let left = 60 + (cascadeIndex % 6) * 40;
    let top = 60 + (cascadeIndex % 6) * 32;
    cascadeIndex++;

    if (left + winW > screenW - 20) left = Math.max(20, screenW - winW - 20);
    if (top + winH > screenH - 60) top = Math.max(20, screenH - winH - 60);

    return { left, top, width: winW, height: winH };
  }

  /**
   * Restituisce ed incrementa lo Z-Index globale per la sincronizzazione delle finestre e degli overlay
   */
  function getNextZIndex() {
    zIndexCounter += 2;
    return zIndexCounter;
  }

  /**
   * Porta la finestra specificata in primo piano ed accende il relit visivo
   */
  function bringToFront(winId) {
    const winData = openWindows.get(winId);
    if (!winData) return;

    winData.element.style.zIndex = getNextZIndex();

    // Se era minimizzata, la ripristina
    if (winData.isMinimized) {
      winData.isMinimized = false;
      winData.element.classList.remove('hidden');
    }

    updateTaskbar();
  }

  /**
   * Minimizza la finestra
   */
  function minimizeWindow(winId) {
    const winData = openWindows.get(winId);
    if (!winData) return;

    winData.isMinimized = true;
    winData.element.classList.add('hidden');
    updateTaskbar();
  }

  /**
   * Alterna Ingrandisci / Ripristina la finestra
   */
  function toggleMaximize(winId) {
    const winData = openWindows.get(winId);
    if (!winData) return;

    if (winData.isMaximized) {
      winData.isMaximized = false;
      winData.element.style.top = (winData.normalPos ? winData.normalPos.top : 50) + 'px';
      winData.element.style.left = (winData.normalPos ? winData.normalPos.left : 50) + 'px';
      winData.element.style.transform = (winData.normalPos && winData.normalPos.transform) ? winData.normalPos.transform : 'none';
      winData.element.style.width = (winData.normalPos ? winData.normalPos.width : 460) + 'px';
      winData.element.style.height = (winData.normalPos ? winData.normalPos.height : 780) + 'px';
      winData.element.classList.remove('rounded-xl');
      winData.element.classList.add('rounded-2xl');
    } else {
      winData.normalPos = {
        top: winData.element.offsetTop,
        left: winData.element.offsetLeft,
        transform: winData.element.style.transform || 'none',
        width: winData.element.offsetWidth,
        height: winData.element.offsetHeight
      };
      winData.isMaximized = true;
      winData.element.style.top = '50%';
      winData.element.style.left = '50%';
      winData.element.style.transform = 'translate(-50%, -50%)';
      winData.element.style.width = 'calc(100vw - 40px)';
      winData.element.style.height = 'calc(100vh - 70px)';
      winData.element.classList.remove('rounded-2xl');
      winData.element.classList.add('rounded-xl');
    }
  }

  /**
   * Chiude e rimuove la finestra
   */
  function closeWindow(winId) {
    if (!winId) return;
    let winData = openWindows.get(winId);
    if (!winData) {
      const cleanId = sanitizeWindowId(winId);
      winData = openWindows.get(cleanId);
      if (winData) {
        winData.element.remove();
        openWindows.delete(cleanId);
      }
    } else {
      winData.element.remove();
      openWindows.delete(winId);
    }
    updateTaskbar();
  }

  /**
   * Aggiorna la taskbar inferiore con i pill di tutte le finestre aperte
   */
  function updateTaskbar() {
    const taskbar = ensureTaskbar();
    taskbar.innerHTML = ''; // SEMPRE pulisce l'innerHTML per evitare pill fantasma di finestre chiuse

    if (openWindows.size === 0) {
      taskbar.classList.add('hidden');
      return;
    }
    taskbar.classList.remove('hidden');

    // Trova l'ID con Z-Index massimo
    let maxZ = -1;
    let activeId = null;
    openWindows.forEach((winData, winId) => {
      if (!winData.isMinimized && parseInt(winData.element.style.zIndex || '0', 10) > maxZ) {
        maxZ = parseInt(winData.element.style.zIndex, 10);
        activeId = winId;
      }
    });

    openWindows.forEach((winData, winId) => {
      const isActive = winId === activeId && !winData.isMinimized;
      const pill = document.createElement('button');
      pill.className = `flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
        isActive
          ? 'bg-blue-600/90 text-white border-blue-400/60 shadow-lg shadow-blue-500/20 scale-102'
          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
      }`;
      pill.innerHTML = `
        <i class="${winData.icon || 'fas fa-window-maximize'} text-xs ${isActive ? 'text-white' : 'text-blue-400'}"></i>
        <span class="truncate max-w-[130px]">${winData.title}</span>
        ${winData.isMinimized ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>' : ''}
      `;
      pill.onclick = function () {
        if (winData.isMinimized) {
          bringToFront(winId);
        } else if (isActive) {
          minimizeWindow(winId);
        } else {
          bringToFront(winId);
        }
      };
      taskbar.appendChild(pill);
    });
  }

  /**
   * Rende l'elemento finestra trascinabile tramite l'header
   * Drag Engine: requestAnimationFrame + translate3d — zero reflow, 60 FPS smooth.
   * Stesso pattern del Catalog Overlay (desktop_catalog_overlay.js).
   */
  function makeDraggable(winElem, headerElem) {
    let isDragging = false;
    let currentX = 0, currentY = 0;
    let initialX = 0, initialY = 0;
    let xOffset = 0, yOffset = 0;
    let rafId = null;

    // Resetta l'offset basandosi sulla posizione corrente dell'elemento
    // (importante quando la finestra è stata già spostata via left/top)
    function syncOffsetFromCurrentPos() {
      xOffset = winElem.offsetLeft;
      yOffset = winElem.offsetTop;
      // Azzera left/top e passa tutto a transform per evitare conflitti
      winElem.style.left = '0px';
      winElem.style.top = '0px';
      winElem.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    }

    headerElem.style.cursor = 'grab';

    headerElem.onmousedown = function (e) {
      if (e.target.closest('button')) return;
      isDragging = true;
      headerElem.style.cursor = 'grabbing';

      // Sincronizza xOffset/yOffset dalla posizione reale all'inizio del drag
      const transform = new DOMMatrix(getComputedStyle(winElem).transform);
      xOffset = transform.m41 || winElem.offsetLeft;
      yOffset = transform.m42 || winElem.offsetTop;
      if (!winElem.style.transform || winElem.style.transform === 'none') {
        syncOffsetFromCurrentPos();
        xOffset = winElem.offsetLeft === 0 ? xOffset : 0;
        yOffset = winElem.offsetTop  === 0 ? yOffset : 0;
      }

      // Disabilita pointer-events su tutti gli iframe per evitare che catturino gli eventi del mouse durante il drag
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      document.onmousemove = onMouseMove;
      document.onmouseup   = onMouseUp;
    };

    function onMouseMove(e) {
      if (!isDragging) return;

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      // Limiti schermo
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const w = winElem.offsetWidth  || 800;
      const h = winElem.offsetHeight || 600;

      currentX = Math.max(10 - w + 100, Math.min(screenW - 100, currentX));
      currentY = Math.max(10, Math.min(screenH - 60, currentY));

      xOffset = currentX;
      yOffset = currentY;

      if (!rafId) {
        rafId = requestAnimationFrame(applyTransform);
      }
    }

    function applyTransform() {
      winElem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      rafId = null;
    }

    function onMouseUp() {
      isDragging = false;
      headerElem.style.cursor = 'grab';
      // Ripristina pointer-events sugli iframe al termine del drag
      document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'auto');
      document.onmousemove = null;
      document.onmouseup   = null;
    }
  }

  /**
   * Apre una nuova finestra mobile o porta in primo piano quella esistente (Prevenzione Duplicati)
   */
  function openWindow(options = {}) {
    const title = options.title || 'Modulo SiteBoS';
    const url = options.url || '#';
    const icon = options.icon || 'fas fa-window-maximize';
    const rawId = options.id || options.mod_id || url;
    const winId = sanitizeWindowId(rawId);

    const defaultW = options.width || 460;
    const defaultH = options.height || 780;

    // CHECK ANTI-DUPLICATO & COLLISIONE
    if (openWindows.has(winId)) {
      const existingWin = openWindows.get(winId);
      bringToFront(winId);

      // Effetto pulse visivo per segnalare che la finestra è già attiva
      existingWin.element.classList.add('ring-4', 'ring-blue-500/80', 'transition-all');
      setTimeout(() => {
        existingWin.element.classList.remove('ring-4', 'ring-blue-500/80');
      }, 600);

      return existingWin;
    }

    // Se non è aperta, calcola la posizione a cascata
    const pos = calculateCascadePosition(defaultW, defaultH);
    zIndexCounter += 2;

    const winElem = document.createElement('div');
    winElem.id = winId;
    winElem.className = 'fixed z-[990000] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl';
    winElem.style.left = pos.left + 'px';
    winElem.style.top = pos.top + 'px';
    winElem.style.width = pos.width + 'px';
    winElem.style.height = pos.height + 'px';
    winElem.style.zIndex = zIndexCounter;

    winElem.onmousedown = function () {
      bringToFront(winId);
    };

    winElem.innerHTML = `
      <!-- TITLEBAR WINDOW HEADER -->
      <div class="sitebos-win-header bg-slate-950/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between select-none shrink-0 cursor-grab">
        <div class="flex items-center gap-2.5 pointer-events-none">
          <div class="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs">
            <i class="${icon}"></i>
          </div>
          <span class="text-xs font-black uppercase tracking-wider text-slate-100">${title}</span>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Modulo Attivo"></span>
        </div>
        <div class="flex items-center gap-1.5 z-10">
          <button class="sitebos-win-minimize w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer" title="Riduci a icona">
            <i class="fas fa-minus"></i>
          </button>
          <button class="sitebos-win-maximize w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer" title="Ingrandisci/Ripristina">
            <i class="fas fa-expand"></i>
          </button>
          <button class="sitebos-win-close w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer ml-1" title="Chiudi finestra">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>
      <!-- WINDOW CONTENT CONTAINER -->
      <div class="flex-1 bg-slate-950 relative overflow-hidden">
        <iframe src="${url}" class="w-full h-full border-0 bg-transparent" title="${title}"></iframe>
      </div>
    `;

    document.body.appendChild(winElem);

    // ── DECAPITAZIONE HEADER INTERNO TWA ──────────────────────────────────────
    // Inietta immediatamente e tramite polling aggressivo a 50ms il CSS per nascondere
    // l'header interno (<header>) delle sotto-pagine aperte nella finestra.
    const iframeElem = winElem.querySelector('iframe');
    if (iframeElem) {
      const applyHeaderHider = function () {
        try {
          const doc = iframeElem.contentDocument || iframeElem.contentWindow?.document;
          if (doc && (doc.head || doc.documentElement)) {
            if (!doc.getElementById('sitebos-desktop-iframe-hider')) {
              const style = doc.createElement('style');
              style.id = 'sitebos-desktop-iframe-hider';
              style.innerHTML = `
                header, 
                .twa-header, 
                .mobile-header, 
                .page-top-header { 
                  display: none !important; 
                  height: 0 !important;
                  max-height: 0 !important;
                  overflow: hidden !important;
                  visibility: hidden !important;
                  opacity: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  pointer-events: none !important;
                }
                body { 
                  padding-top: 0 !important; 
                  margin-top: 0 !important; 
                }
                body:not(.is-wide-page) > div:first-child,
                body:not(.is-wide-page) > main,
                body:not(.is-wide-page) > form {
                  max-width: 620px !important;
                  margin-left: auto !important;
                  margin-right: auto !important;
                }
              `;
              (doc.head || doc.documentElement).appendChild(style);
            }
          }
        } catch (_) {}
      };

      // 1. Esegui subito
      applyHeaderHider();
      // 2. Aggancia all'onload
      iframeElem.onload = applyHeaderHider;
      // 3. Polling aggressivo ogni 50ms per 2 secondi (cattura qualsiasi caricamento rapido/cache)
      let pollCount = 0;
      const hiderInterval = setInterval(function () {
        pollCount++;
        applyHeaderHider();
        if (pollCount > 40) clearInterval(hiderInterval);
      }, 50);
    }

    const headerElem = winElem.querySelector('.sitebos-win-header');
    makeDraggable(winElem, headerElem);

    // Event listeners pulsanti finestra
    winElem.querySelector('.sitebos-win-minimize').onclick = (e) => {
      e.stopPropagation();
      minimizeWindow(winId);
    };
    winElem.querySelector('.sitebos-win-maximize').onclick = (e) => {
      e.stopPropagation();
      toggleMaximize(winId);
    };
    winElem.querySelector('.sitebos-win-close').onclick = (e) => {
      e.stopPropagation();
      closeWindow(winId);
    };

    const winData = {
      id: winId,
      title,
      url,
      icon,
      element: winElem,
      isMinimized: false,
      isMaximized: false,
      normalPos: pos
    };

    openWindows.set(winId, winData);
    updateTaskbar();

    return winData;
  }

  // Esporta nel namespace globale ed al contenitore genitore (per supporto iframe multi-tasking)
  const manager = {
    openWindow,
    bringToFront,
    getNextZIndex,
    minimizeWindow,
    maximizeWindow: toggleMaximize,  // alias corretto: toggleMaximize gestisce entrambe le direzioni
    closeWindow,
    getOpenWindows: () => openWindows
  };

  window.DesktopWindowManager = manager;
  try {
    if (window.parent && window.parent !== window) {
      window.parent.DesktopWindowManager = manager;
    }
    if (window.top && window.top !== window) {
      window.top.DesktopWindowManager = manager;
    }
  } catch (_) {}

})(window);
