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
   * Porta la finestra specificata in primo piano ed accende il relit visivo
   */
  function bringToFront(winId) {
    const winData = openWindows.get(winId);
    if (!winData) return;

    zIndexCounter += 2;
    winData.element.style.zIndex = zIndexCounter;

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
      winData.element.style.top = winData.normalPos.top + 'px';
      winData.element.style.left = winData.normalPos.left + 'px';
      winData.element.style.width = winData.normalPos.width + 'px';
      winData.element.style.height = winData.normalPos.height + 'px';
      winData.element.classList.remove('rounded-none');
      winData.element.classList.add('rounded-2xl');
    } else {
      winData.normalPos = {
        top: winData.element.offsetTop,
        left: winData.element.offsetLeft,
        width: winData.element.offsetWidth,
        height: winData.element.offsetHeight
      };
      winData.isMaximized = true;
      winData.element.style.top = '10px';
      winData.element.style.left = '10px';
      winData.element.style.width = 'calc(100vw - 20px)';
      winData.element.style.height = 'calc(100vh - 70px)';
      winData.element.classList.remove('rounded-2xl');
      winData.element.classList.add('rounded-none');
    }
  }

  /**
   * Chiude e rimuove la finestra
   */
  function closeWindow(winId) {
    const winData = openWindows.get(winId);
    if (!winData) return;

    winData.element.remove();
    openWindows.delete(winId);
    updateTaskbar();
  }

  /**
   * Aggiorna la taskbar inferiore con i pill di tutte le finestre aperte
   */
  function updateTaskbar() {
    const taskbar = ensureTaskbar();
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

    taskbar.innerHTML = '';
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
   */
  function makeDraggable(winElem, headerElem) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;

    headerElem.style.cursor = 'grab';

    headerElem.onmousedown = function (e) {
      if (e.target.closest('button')) return; // Non trascinare se clicca sui pulsanti della barra
      isDragging = true;
      headerElem.style.cursor = 'grabbing';

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = winElem.offsetLeft;
      initialTop = winElem.offsetTop;

      document.onmousemove = function (ev) {
        if (!isDragging) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // Limiti schermo
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        newTop = Math.max(10, Math.min(screenH - 60, newTop));
        newLeft = Math.max(10 - winElem.offsetWidth + 100, Math.min(screenW - 100, newLeft));

        winElem.style.left = newLeft + 'px';
        winElem.style.top = newTop + 'px';
      };

      document.onmouseup = function () {
        isDragging = false;
        headerElem.style.cursor = 'grab';
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
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

    const defaultW = options.width || 860;
    const defaultH = options.height || 640;

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
    winElem.className = 'fixed z-[990000] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-150';
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
    minimizeWindow,
    maximizeWindow,
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
