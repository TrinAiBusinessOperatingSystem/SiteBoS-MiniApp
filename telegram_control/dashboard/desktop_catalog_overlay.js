/**
 * SiteBoS MiniApp — Desktop Catalog Overlay Engine v3.1 (Tema Chiaro Light Glassmorphism + 60FPS Drag)
 * Modulo Standalone Flottante per l'Estensione del Catalogo Master sulla Scrivania
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
    'use strict';

    const WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e";
    let cachedCatalog = null;
    let overlayMacro = 'SOP'; // Default: Procedure
    let activeCategory = null;
    let overlaySearchQuery = '';
    let isMaximized = false;
    let normalPos = { top: '50px', left: '50%', transform: 'translate(-50%, 0)', width: '92vw', height: 'auto' };

    /**
     * Pulizia Tassativa Etichette (Rule 2.7: Divieto di [], (), o codici sporchi)
     */
    function cleanLabelText(str) {
        if (!str) return '';
        return str
            .replace(/\[.*?\]/g, '') // Rimuove [SOP], [SER], [PRO]
            .replace(/\(.*?\)/g, '') // Rimuove parentesi tonde
            .replace(/^[\s\-:_]+|[\s\-:_]+$/g, '')
            .trim();
    }

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
     * Recupera l'anagrafica del Catalogo via Webhook n8n
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
     * Motore di Trascendimento Smooth 60FPS a Accelerazione Hardware (requestAnimationFrame + translate3d)
     */
    function makeSmoothDraggable(overlayElem, headerElem) {
        let isDragging = false;
        let currentX = 0, currentY = 0;
        let initialX = 0, initialY = 0;
        let xOffset = 0, yOffset = 0;
        let rafId = null;

        headerElem.style.cursor = 'grab';

        headerElem.onmousedown = function (e) {
            if (e.target.closest('button') || e.target.closest('input')) return;
            isDragging = true;
            headerElem.style.cursor = 'grabbing';

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            document.onmousemove = onMouseMove;
            document.onmouseup = onMouseUp;
        };

        function onMouseMove(e) {
            if (!isDragging) return;
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;

            if (!rafId) {
                rafId = requestAnimationFrame(updatePosition);
            }
        }

        function updatePosition() {
            overlayElem.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            rafId = null;
        }

        function onMouseUp() {
            isDragging = false;
            headerElem.style.cursor = 'grab';
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }

    /**
     * Apre o commuta l'Overlay Flottante del Catalogo Master sulla Scrivania
     */
    async function openCatalogOverlay(initialMacro) {
        if (initialMacro && ['SOP', 'SER', 'PRO'].includes(initialMacro)) {
            overlayMacro = initialMacro;
        }
        activeCategory = null;
        
        let overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'desktop-catalog-overlay';
            overlay.className = 'fixed top-12 left-1/2 -translate-x-1/2 w-[92vw] max-w-6xl z-[999000] bg-white/95 border border-slate-200 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-slate-900 select-none flex flex-col space-y-5 transition-all duration-300';
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
     * Renderizza il contenuto dell'Overlay in Tema Chiaro Elegante (Light Glassmorphism)
     */
    async function renderOverlayContent() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;

        const catalog = await fetchCatalogData();

        let html = `
            <!-- HEADER OVERLAY DRAGGABLE -->
            <div id="catalog-overlay-header" class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-lg font-black shadow-xs">
                        <i class="fas fa-boxes-stacked"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-blue-600">SCRIVANIA CATALOGO MASTER</span>
                        </div>
                        <h2 class="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                            ${activeCategory ? `CATEGORIA: ${cleanLabelText(activeCategory.short_name || activeCategory.name)}` : 'LISTINO AZIENDALE — PROCEDURE, SERVIZI & PRODOTTI'}
                        </h2>
                    </div>
                </div>

                <!-- CONTROLLI FINESTRA OVERLAY -->
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="window.DesktopCatalogOverlay.openAddProduct()" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2 transition cursor-pointer active:scale-95">
                        <i class="fas fa-plus"></i>
                        <span>Nuova Voce</span>
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.toggleMaximize()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Ingrandisci / Ripristina">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.close()" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Chiudi Overlay">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- FILTRI MACRO & RICERCA (SENZA TASTO TUTTI) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs backdrop-blur-xl">
                <!-- MACRO TABS BOTTONCIONI -->
                <div class="flex items-center gap-2 flex-wrap">
                    ${activeCategory ? `
                        <button onclick="window.DesktopCatalogOverlay.backToCategories()" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-900 text-white shadow-xs flex items-center gap-2 transition cursor-pointer">
                            <i class="fas fa-arrow-left"></i>
                            <span>Torna alle Categorie</span>
                        </button>
                    ` : `
                        <button onclick="window.DesktopCatalogOverlay.setMacro('SOP')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${overlayMacro === 'SOP' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                            📋 PROCEDURE (${catalog.filter(c => c.macrocategories === 'SOP').length})
                        </button>
                        <button onclick="window.DesktopCatalogOverlay.setMacro('SER')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${overlayMacro === 'SER' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                            🛠️ SERVIZI (${catalog.filter(c => c.macrocategories === 'SER').length})
                        </button>
                        <button onclick="window.DesktopCatalogOverlay.setMacro('PRO')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${overlayMacro === 'PRO' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                            📦 PRODOTTI (${catalog.filter(c => c.macrocategories === 'PRO').length})
                        </button>
                    `}
                </div>

                <!-- CAMPO DI RICERCA REAL-TIME -->
                <div class="relative min-w-[240px]">
                    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" value="${overlaySearchQuery}" oninput="window.DesktopCatalogOverlay.setSearch(this.value)" placeholder="Cerca nel listino..." class="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-blue-500 outline-none transition">
                </div>
            </div>

            <!-- GRIGLIA CARD (STILE BOTTONCIONI LIGHT) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[62vh] overflow-y-auto pr-1">
        `;

        if (activeCategory) {
            // RENDER VOCI DELLA CATEGORIA SELEZIONATA (LIVELLO 2)
            const subitems = activeCategory.subcategories || [];
            const filteredItems = subitems.filter(item => {
                const name = cleanLabelText(item.name || item.short_name || '');
                return !overlaySearchQuery || name.toLowerCase().includes(overlaySearchQuery);
            });

            if (filteredItems.length === 0) {
                html += `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <i class="fas fa-box-open text-4xl mb-3 opacity-40"></i>
                        <p class="text-xs font-black uppercase tracking-widest">Nessuna voce presente in questa categoria</p>
                    </div>
                `;
            } else {
                filteredItems.forEach(item => {
                    const cleanName = cleanLabelText(item.short_name || item.name);
                    const cleanDesc = cleanLabelText(item.name || '');

                    html += `
                        <div class="group relative bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 backdrop-blur-xl cursor-pointer">
                            <div>
                                <div class="flex items-center justify-between mb-3">
                                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-lg flex items-center justify-center shadow-2xs group-hover:scale-105 transition duration-200">
                                        ${item.icon || '💡'}
                                    </div>
                                    <span class="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[8.5px] font-black uppercase tracking-widest">
                                        VOCE
                                    </span>
                                </div>

                                <h3 class="text-xs font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1">
                                    ${cleanName}
                                </h3>
                                <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                    ${cleanDesc}
                                </p>
                            </div>

                            <div class="pt-3.5 mt-3.5 border-t border-slate-200/80 flex items-center justify-between">
                                <span class="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                                    ATTIVO
                                </span>
                                <button onclick="window.DesktopCatalogOverlay.openEditProduct('${cleanName}')" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-black text-[9.5px] uppercase tracking-wider transition border border-slate-800">
                                    EDITA ➔
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
        } else {
            // RENDER CATEGORIE (LIVELLO 1)
            const filteredCategories = catalog.filter(cat => {
                const matchMacro = cat.macrocategories === overlayMacro;
                const cleanCatName = cleanLabelText(cat.name || cat.short_name || '');
                const matchSearch = !overlaySearchQuery || cleanCatName.toLowerCase().includes(overlaySearchQuery);
                return matchMacro && matchSearch;
            });

            if (filteredCategories.length === 0) {
                html += `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <i class="fas fa-folder-open text-4xl mb-3 opacity-40"></i>
                        <p class="text-xs font-black uppercase tracking-widest">Nessuna categoria trovata per questa macro-categoria</p>
                    </div>
                `;
            } else {
                filteredCategories.forEach(cat => {
                    const sub = cat.subcategories || [];
                    const macroLabel = cat.macrocategories === 'SOP' ? 'PROCEDURA' : (cat.macrocategories === 'SER' ? 'SERVIZIO' : 'PRODOTTO');
                    const macroBadge = cat.macrocategories === 'SOP' ? 'bg-blue-50 text-blue-700 border-blue-200' : (cat.macrocategories === 'SER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200');
                    const cleanCatName = cleanLabelText(cat.short_name || cat.name);
                    const cleanCatDesc = cleanLabelText(cat.name || '');

                    html += `
                        <div onclick="window.DesktopCatalogOverlay.selectCategory('${cleanCatName.replace(/'/g, "\\'")}')" class="group relative bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-2xl p-4.5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 backdrop-blur-xl cursor-pointer">
                            <div>
                                <div class="flex items-center justify-between mb-3">
                                    <div class="w-11 h-11 rounded-xl bg-white border border-slate-200 text-xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition duration-200">
                                        ${cat.icon || '📁'}
                                    </div>
                                    <span class="px-2 py-0.5 rounded-full border text-[8.5px] font-black uppercase tracking-widest ${macroBadge}">
                                        ${macroLabel}
                                    </span>
                                </div>

                                <h3 class="text-xs font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1">
                                    ${cleanCatName}
                                </h3>
                                <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                    ${cleanCatDesc}
                                </p>
                            </div>

                            <div class="pt-3.5 mt-3.5 border-t border-slate-200/80 flex items-center justify-between">
                                <span class="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                                    ${sub.length} VOCI
                                </span>
                                <button class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-black text-[9.5px] uppercase tracking-wider transition">
                                    APRI ➔
                                </button>
                            </div>
                        </div>
                    `;
                });
            }
        }

        html += `</div>`;
        overlay.innerHTML = html;

        const header = document.getElementById('catalog-overlay-header');
        if (header) makeSmoothDraggable(overlay, header);
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

    function openEditProductWindow(prodName) {
        if (window.DesktopWindowManager) {
            window.DesktopWindowManager.openWindow({
                title: 'Modifica — ' + prodName,
                url: '../gestione/edit-product.html',
                icon: 'fa-edit',
                width: 880,
                height: 640
            });
        } else {
            window.location.href = '../gestione/edit-product.html';
        }
    }

    // Esporta il controller globale per l'Overlay
    window.DesktopCatalogOverlay = {
        open: openCatalogOverlay,
        close: closeCatalogOverlay,
        toggleMaximize: toggleMaximizeOverlay,
        setMacro: function (m) { overlayMacro = m; activeCategory = null; renderOverlayContent(); },
        setSearch: function (q) { overlaySearchQuery = (q || '').toLowerCase(); renderOverlayContent(); },
        selectCategory: function (catName) {
            if (!cachedCatalog) return;
            const targetCat = cachedCatalog.find(c => cleanLabelText(c.name || c.short_name).toLowerCase() === catName.toLowerCase());
            if (targetCat) {
                activeCategory = targetCat;
                renderOverlayContent();
            }
        },
        backToCategories: function () {
            activeCategory = null;
            renderOverlayContent();
        },
        openAddProduct: openAddProductWindow,
        openEditProduct: openEditProductWindow
    };

})(window);
