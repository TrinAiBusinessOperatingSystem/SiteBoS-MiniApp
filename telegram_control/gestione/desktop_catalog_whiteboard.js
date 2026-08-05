/**
 * SiteBoS MiniApp — Desktop Catalog Whiteboard Engine
 * Modulo Chirurgico Isolato per la "Scrivania Flat Catalogo" (Prodotti, Servizi & Procedure SOP)
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
    'use strict';

    let desktopFilter = 'ALL';
    let desktopSearchQuery = '';

    /**
     * Determina se la vista attiva deve essere Desktop o Mobile
     */
    function isMobileDevice() {
        const tg = window.Telegram?.WebApp || window.parent?.Telegram?.WebApp;
        const platform = (tg?.platform || '').toLowerCase();
        if (['android', 'ios', 'mobile'].includes(platform)) return true;
        if (['tdesktop', 'desktop', 'macos'].includes(platform)) return false;
        
        const ua = (navigator.userAgent || '').toLowerCase();
        if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return true;
        return (window.innerWidth < 768) || (window.screen.width < 768);
    }

    window.setDesktopCatalogFilter = function (filter) {
        desktopFilter = filter;
        renderDesktopCatalogWorkspace();
    };

    window.handleDesktopCatalogSearch = function (query) {
        desktopSearchQuery = (query || '').toLowerCase();
        renderDesktopCatalogWorkspace();
    };

    window.selectDesktopCatalogCategory = function (catName) {
        if (!window.fullCatalog) return;
        const targetCat = window.fullCatalog.find(c => (c.name || '').toLowerCase() === catName.toLowerCase() || (c.short_name || '').toLowerCase() === catName.toLowerCase());
        if (targetCat) {
            window.currentMacro = targetCat.macrocategories || window.currentMacro;
            window.activeCategory = targetCat;
            window.currentViewLevel = 'items';
            window.activeIdx = 0;
            if (typeof window.renderCatalog === 'function') window.renderCatalog();
        }
    };

    /**
     * Renderizza la Scrivania Flat Desktop per Catalogo Prodotti, Servizi & Procedure SOP
     */
    function renderDesktopCatalogWorkspace() {
        const isMobile = isMobileDevice();
        let desktopContainer = document.getElementById('desktop-catalog-workspace');
        const appContent = document.getElementById('app-content');

        if (isMobile) {
            if (desktopContainer) desktopContainer.classList.add('hidden');
            if (appContent) appContent.classList.remove('hidden');
            return;
        }

        // Su Desktop -> Nasconde il carosello 3D mobile e mostra la Scrivania Flat Desktop
        if (appContent) appContent.classList.add('hidden');

        if (!desktopContainer) {
            desktopContainer = document.createElement('div');
            desktopContainer.id = 'desktop-catalog-workspace';
            desktopContainer.className = 'w-full max-w-7xl mx-auto px-6 py-6 flex flex-col space-y-6 select-none';
            document.body.appendChild(desktopContainer);
        }
        desktopContainer.classList.remove('hidden');

        const fullCatalog = window.fullCatalog || [];

        let html = `
            <!-- HEADER SCRIVANIA FLAT CATALOGO -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 border border-slate-200/90 rounded-3xl p-6 shadow-sm backdrop-blur-2xl">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                        <span class="text-[10px] font-black uppercase tracking-widest text-blue-600">SCRIVANIA FLAT CATALOGO</span>
                    </div>
                    <h1 class="text-xl font-black uppercase text-slate-900 tracking-tight">
                        LISTINO MASTER — PRODOTTI, SERVIZI & PROCEDURE (SOP)
                    </h1>
                    <p class="text-xs text-slate-600 font-bold mt-0.5">
                        Gestisci l'anagrafica del listino, organizza le categorie ed esplora i blueprint operativi.
                    </p>
                </div>

                <!-- PULSANTI AZIONE DESKTOP -->
                <div class="flex items-center gap-3 shrink-0">
                    <button onclick="window.handleNewAction ? window.handleNewAction() : null" class="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md flex items-center gap-2 transition cursor-pointer active:scale-95">
                        <i class="fas fa-plus"></i>
                        <span>Nuova Categoria / Voce</span>
                    </button>
                    <button onclick="window.openUserGuide ? window.openUserGuide('../userguide/03_catalog.html') : null" class="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-black text-xs shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95">
                        <i class="fas fa-globe text-slate-500"></i>
                        <span>Manuale Utente</span>
                    </button>
                </div>
            </div>

            <!-- FILTRI MACRO & RICERCA -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-xs backdrop-blur-xl">
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="window.setDesktopCatalogFilter('ALL')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${desktopFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                        TUTTI (${fullCatalog.length})
                    </button>
                    <button onclick="window.setDesktopCatalogFilter('SOP')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${desktopFilter === 'SOP' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                        📋 PROCEDURE (${fullCatalog.filter(c => c.macrocategories === 'SOP').length})
                    </button>
                    <button onclick="window.setDesktopCatalogFilter('SER')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${desktopFilter === 'SER' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                        🛠️ SERVIZI (${fullCatalog.filter(c => c.macrocategories === 'SER').length})
                    </button>
                    <button onclick="window.setDesktopCatalogFilter('PRO')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition ${desktopFilter === 'PRO' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                        📦 PRODOTTI (${fullCatalog.filter(c => c.macrocategories === 'PRO').length})
                    </button>
                </div>

                <div class="relative min-w-[240px]">
                    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" id="desktop-search-input" value="${desktopSearchQuery}" oninput="window.handleDesktopCatalogSearch(this.value)" placeholder="Cerca categoria o prodotto..." class="w-full bg-slate-50 border border-slate-200/90 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 outline-none transition">
                </div>
            </div>

            <!-- GRIGLIA SCRIVANIA FLAT CARD -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        `;

        const filteredCategories = fullCatalog.filter(cat => {
            const matchMacro = desktopFilter === 'ALL' || cat.macrocategories === desktopFilter;
            const matchSearch = !desktopSearchQuery || (cat.name || '').toLowerCase().includes(desktopSearchQuery) || (cat.short_name || '').toLowerCase().includes(desktopSearchQuery);
            return matchMacro && matchSearch;
        });

        filteredCategories.forEach(cat => {
            const sub = cat.subcategories || [];
            const macroLabel = cat.macrocategories === 'SOP' ? 'PROCEDURA' : (cat.macrocategories === 'SER' ? 'SERVIZIO' : 'PRODOTTO');
            const macroBadge = cat.macrocategories === 'SOP' ? 'bg-blue-50 text-blue-700 border-blue-200' : (cat.macrocategories === 'SER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200');

            html += `
                <div class="group relative bg-white/95 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 backdrop-blur-2xl cursor-pointer">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-2xl flex items-center justify-center shadow-xs group-hover:scale-110 transition duration-300">
                                ${cat.icon || '📁'}
                            </div>
                            <span class="px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${macroBadge}">
                                ${macroLabel}
                            </span>
                        </div>

                        <h3 class="text-sm font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1">
                            ${cat.short_name || cat.name}
                        </h3>
                        <p class="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            ${cat.name || ''}
                        </p>
                    </div>

                    <div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                        <span class="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            ${sub.length} VOCI INSERITE
                        </span>
                        <button onclick="window.selectDesktopCatalogCategory('${cat.name.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-bold text-[10px] uppercase tracking-wider transition">
                            ESPANDI ➔
                        </button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        desktopContainer.innerHTML = html;
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderDesktopCatalogWorkspace();
        window.addEventListener('resize', renderDesktopCatalogWorkspace);
    });

    // Esporta nel namespace globale
    window.DesktopCatalogWhiteboard = {
        render: renderDesktopCatalogWorkspace
    };

})(window);
