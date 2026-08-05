/**
 * SiteBoS MiniApp — Desktop Catalog Overlay Whiteboard Engine
 * Modulo Standalone Flottante per l'Estensione del Catalogo Master sulla Scrivania
 * Garantisce la continuità di visione e di concetto con la Dashboard Principale (Stile Bottoncioni)
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
    'use strict';

    const WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e";
    let cachedCatalog = null;
    let overlayMacro = 'ALL';
    let overlayCategory = null;
    let overlaySearchQuery = '';
    let isMaximized = false;
    let normalPos = { top: '60px', left: '50%', transform: 'translateX(-50%)', width: '92vw', height: 'auto' };

    /**
     * Determina se l'utente si trova su PC Desktop
     */
    function isMobileDevice() {
        const tg = window.Telegram?.WebApp || window.parent?.Telegram?.WebApp;
        const platform = (tg?.platform || '').toLowerCase();
        if (['android', 'ios', 'mobile'].includes(platform)) return true;
        if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(platform)) return false;
        
        const ua = (navigator.userAgent || '').toLowerCase();
        if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return true;
        return (window.innerWidth < 768) || (window.screen.width < 768);
    }

    /**
     * Recupera l'anagrafica completa del Catalogo via Webhook n8n
     */
    async function fetchCatalogData() {
        if (cachedCatalog) return cachedCatalog;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const ash = urlParams.get('ash');
            const msg = urlParams.get('msg');
            const tg = window.Telegram?.WebApp;

            const res = await fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "get_catalog", _auth: tg?.initData, ash: ash, msg: msg })
            });
            const raw = await res.json();
            const data = Array.isArray(raw) ? raw[0] : (raw.catalog || raw);
            cachedCatalog = data.categories || data.catalog?.categories || [];
            return cachedCatalog;
        } catch (e) {
            console.error("Errore recupero catalogo per Overlay:", e);
            return [];
        }
    }

    /**
     * Rende l'overlay trascinabile sullo schermo
     */
    function makeDraggable(overlayElem, headerElem) {
        let isDragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

        headerElem.style.cursor = 'grab';

        headerElem.onmousedown = function (e) {
            if (e.target.closest('button') || e.target.closest('input')) return;
            isDragging = true;
            headerElem.style.cursor = 'grabbing';

            startX = e.clientX;
            startY = e.clientY;
            initialLeft = overlayElem.offsetLeft;
            initialTop = overlayElem.offsetTop;

            document.onmousemove = function (ev) {
                if (!isDragging) return;
                const dx = ev.clientX - startX;
                const dy = ev.clientY - startY;

                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                overlayElem.style.left = newLeft + 'px';
                overlayElem.style.top = newTop + 'px';
                overlayElem.style.transform = 'none';
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
     * Apre o commuta l'Overlay Flottante del Catalogo Master sulla Scrivania
     */
    async function openCatalogOverlay(initialMacro) {
        if (initialMacro) overlayMacro = initialMacro;
        
        let overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'desktop-catalog-overlay';
            overlay.className = 'fixed top-12 left-1/2 -translate-x-1/2 w-[92vw] max-w-6xl z-[999000] bg-slate-950/95 border border-slate-800/90 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-white select-none flex flex-col space-y-5 transition-all duration-300';
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');

        await renderOverlayContent();
    }

    /**
     * Chiude l'Overlay Flottante
     */
    function closeCatalogOverlay() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    /**
     * Massimizza o Ripristina la dimensione dell'Overlay
     */
    function toggleMaximizeOverlay() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;

        if (isMaximized) {
            overlay.style.top = normalPos.top;
            overlay.style.left = normalPos.left;
            overlay.style.transform = normalPos.transform;
            overlay.style.width = normalPos.width;
            overlay.style.height = normalPos.height;
            isMaximized = false;
        } else {
            normalPos = {
                top: overlay.style.top || '48px',
                left: overlay.style.left || '50%',
                transform: overlay.style.transform || 'translateX(-50%)',
                width: overlay.style.width || '92vw',
                height: overlay.style.height || 'auto'
            };
            overlay.style.top = '10px';
            overlay.style.left = '10px';
            overlay.style.transform = 'none';
            overlay.style.width = 'calc(100vw - 20px)';
            overlay.style.height = 'calc(100vh - 70px)';
            isMaximized = true;
        }
    }

    /**
     * Renderizza il contenuto completo dell'Overlay nello Stile Bottoncioni Dashboard
     */
    async function renderOverlayContent() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;

        const catalog = await fetchCatalogData();

        let html = `
            <!-- HEADER OVERLAY DRAGGABLE -->
            <div id="catalog-overlay-header" class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-lg font-black shadow-inner">
                        <i class="fas fa-boxes-stacked"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-blue-400">ESTENSIONE SCRIVANIA AZIENDALE</span>
                        </div>
                        <h2 class="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
                            CATALOGO MASTER — PROCEDURE, SERVIZI & PRODOTTI
                        </h2>
                    </div>
                </div>

                <!-- CONTROLLI FINESTRA OVERLAY -->
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="window.DesktopCatalogOverlay.toggleMaximize()" class="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Ingrandisci / Ripristina">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.close()" class="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Chiudi Overlay">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- FILTRI MACRO & RICERCA (STILE BOTTONCIONI DASHBOARD) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-lg backdrop-blur-xl">
                <!-- MACRO TABS BOTTONCIONI -->
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="window.DesktopCatalogOverlay.setMacro('ALL')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${overlayMacro === 'ALL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/60' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'}">
                        TUTTI (${catalog.length})
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.setMacro('SOP')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${overlayMacro === 'SOP' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/60' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'}">
                        📋 PROCEDURE (${catalog.filter(c => c.macrocategories === 'SOP').length})
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.setMacro('SER')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${overlayMacro === 'SER' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 border border-purple-400/60' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'}">
                        🛠️ SERVIZI (${catalog.filter(c => c.macrocategories === 'SER').length})
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.setMacro('PRO')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${overlayMacro === 'PRO' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 border border-amber-400/60' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'}">
                        📦 PRODOTTI (${catalog.filter(c => c.macrocategories === 'PRO').length})
                    </button>
                </div>

                <!-- CAMPO DI RICERCA REAL-TIME -->
                <div class="relative min-w-[240px]">
                    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input type="text" value="${overlaySearchQuery}" oninput="window.DesktopCatalogOverlay.setSearch(this.value)" placeholder="Cerca categoria o prodotto..." class="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:border-blue-500 outline-none transition">
                </div>
            </div>

            <!-- GRIGLIA SCRIVANIA BOTTONCIONI (CONCETTO DASHBOARD) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[62vh] overflow-y-auto pr-1">
        `;

        const filteredCategories = catalog.filter(cat => {
            const matchMacro = overlayMacro === 'ALL' || cat.macrocategories === overlayMacro;
            const matchSearch = !overlaySearchQuery || (cat.name || '').toLowerCase().includes(overlaySearchQuery) || (cat.short_name || '').toLowerCase().includes(overlaySearchQuery);
            return matchMacro && matchSearch;
        });

        if (filteredCategories.length === 0) {
            html += `
                <div class="col-span-full py-16 text-center text-slate-500">
                    <i class="fas fa-box-open text-4xl mb-3 opacity-40"></i>
                    <p class="text-xs font-black uppercase tracking-widest">Nessuna categoria trovata per i filtri selezionati</p>
                </div>
            `;
        } else {
            filteredCategories.forEach(cat => {
                const sub = cat.subcategories || [];
                const macroLabel = cat.macrocategories === 'SOP' ? 'PROCEDURA' : (cat.macrocategories === 'SER' ? 'SERVIZIO' : 'PRODOTTO');
                const macroBadge = cat.macrocategories === 'SOP' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : (cat.macrocategories === 'SER' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30');

                html += `
                    <div class="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-blue-500/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-xl cursor-pointer">
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <div class="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 text-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition duration-300">
                                    ${cat.icon || '📁'}
                                </div>
                                <span class="px-2 py-0.5 rounded-full border text-[8.5px] font-black uppercase tracking-widest ${macroBadge}">
                                    ${macroLabel}
                                </span>
                            </div>

                            <h3 class="text-xs font-black uppercase text-white leading-tight group-hover:text-blue-400 transition mb-1">
                                ${cat.short_name || cat.name}
                            </h3>
                            <p class="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                                ${cat.name || ''}
                            </p>
                        </div>

                        <div class="pt-3.5 mt-3.5 border-t border-slate-800/80 flex items-center justify-between">
                            <span class="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                                ${sub.length} VOCI
                            </span>
                            <button onclick="window.DesktopCatalogOverlay.openAddProduct()" class="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-blue-600 text-slate-300 hover:text-white font-black text-[9.5px] uppercase tracking-wider transition border border-slate-800">
                                GESTISCI ➔
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        overlay.innerHTML = html;

        const header = document.getElementById('catalog-overlay-header');
        if (header) makeDraggable(overlay, header);
    }

    // Intercetta i click sui pulsanti di aggiunta e sottomoduli aprendo in Finestra Flottante Multi-Tasking
    function openAddProductWindow() {
        if (window.DesktopWindowManager) {
            window.DesktopWindowManager.openWindow({
                title: 'Nuovo Prodotto / Servizio',
                url: '../gestione/add-product.html',
                icon: 'fa-plus-circle',
                width: 880,
                height: 640
            });
        } else {
            window.location.href = '../gestione/add-product.html';
        }
    }

    // Esporta il controller globale per l'Overlay
    window.DesktopCatalogOverlay = {
        open: openCatalogOverlay,
        close: closeCatalogOverlay,
        toggleMaximize: toggleMaximizeOverlay,
        setMacro: function (m) { overlayMacro = m; renderOverlayContent(); },
        setSearch: function (q) { overlaySearchQuery = (q || '').toLowerCase(); renderOverlayContent(); },
        openAddProduct: openAddProductWindow
    };

})(window);
