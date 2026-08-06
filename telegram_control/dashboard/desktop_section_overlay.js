/**
 * SiteBoS MiniApp — Desktop Section Overlay Whiteboard Engine v3.1
 * Modulo Standalone Flottante per l'Apertura Diretta delle Sezioni dal Main Menu (Stile Bottoncioni Light)
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
    'use strict';

    let currentSectionKey = 'identity';
    let sectionSearchQuery = '';
    let isMaximized = false;
    let normalPos = { top: '50px', left: '50%', transform: 'translate(-50%, 0)', width: '92vw', height: 'auto' };

    /**
     * Mappatura Completa dei Moduli e Strumenti per Ciascuna Sezione del Main Menu
     */
    const SECTIONS_DATA = {
        identity: {
            title: "IDENTITY & SETUP AZIENDALE",
            subtitle: "Configura la personalità del Bot Telegram, i dati del titolare, la conformità fiscale e la piattaforma cloud.",
            badge: "CONFIGURAZIONE",
            color: "blue",
            items: [
                { id: "bot_config", name: "Setup Bot Telegram", desc: "Definisci nome, ruolo, tono di voce, istruzioni e capacità AI dell'assistente.", icon: "🤖", url: "../identity/bot_config.html", badge: "AI BOT" },
                { id: "edit_owner", name: "Dati Titolare & Azienda", desc: "Gestisci l'anagrafica aziendale, contatti, indirizzi e dati fiscali master.", icon: "👤", url: "../identity/edit_owner.html", badge: "ANAGRAFICA" },
                { id: "advanced_setup", name: "Setup Avanzato & Compliance", desc: "Configura parametri fiscali avanzati, moduli IVA e contratti aziendali.", icon: "🏛️", url: "../identity/advanced-setup.html", badge: "FISCAL" },
                { id: "trinai_platform", name: "Piattaforma TrinAi Cloud", desc: "Accedi alla suite di intelligenza direzionale ed ecosistema cloud TrinAi.", icon: "TrinAi_Logo.jpg", url: "https://dashboard.trinai.it", badge: "TRINAI CLOUD" }
            ]
        },
        operativita: {
            title: "OPERATIVITÀ, ORDINI & LOGISTICA",
            subtitle: "Monitora gli ordini live, pianifica gli itinerari e gestisci il magazzino intelligente.",
            badge: "OPERATIVITÀ",
            color: "purple",
            items: [
                { id: "orders_manager", name: "Gestione Ordini Live", desc: "Dashboard di controllo in tempo reale per ordini ricevuti, in lavorazione e chiusi.", icon: "📦", url: "../operativita/orders-manager.html", badge: "LIVE" },
                { id: "job_create", name: "Piano Lavori & Commesse", desc: "Crea e assegna nuove schede lavoro ed itinerari operativi ai collaboratori.", icon: "⚙️", url: "../operativita/job-create.html", badge: "COMMESSE" },
                { id: "itinerari", name: "Logistica & Percorsi AI", desc: "Ottimizzazione automatica delle rotte di consegna e trasferte con IA.", icon: "🗺️", url: "../operativita/pianificazione_itinerari.html", badge: "ROUTING AI" },
                { id: "intelligent_warehouse", name: "Magazzino Intelligente", desc: "Controllo scorte, inventario automatico e riordino materie prime.", icon: "🏭", url: "../agents/intelligent-warehouse.html", badge: "INVENTARIO" }
            ]
        },
        agents: {
            title: "SICUREZZA, AGENDA & SUPERVISIONE",
            subtitle: "Gestisci la sicurezza DVR (D.Lgs. 81/08), l'agenda appuntamenti ed il Supervisor Hub.",
            badge: "SICUREZZA & AGENTI",
            color: "emerald",
            items: [
                { id: "assistente_sicurezza", name: "Assistente Sicurezza DVR", desc: "Verifiche DPI, conformità D.Lgs. 81/08, registro infortuni e DVR aziendale.", icon: "🛡️", url: "../agents/assistente-sicurezza.html", badge: "HSE COMPLIANCE" },
                { id: "agenda", name: "Agenda Aziendale & Appuntamenti", desc: "Pianificazione calendario, prenotazioni clienti e gestione slot orari.", icon: "📅", url: "../agents/agenda.html", badge: "CALENDARIO" },
                { id: "supervisor_hub", name: "Supervisor Hub & Auditing", desc: "Controllo scrutinabile delle azioni agentiche e registro storico NoSQL.", icon: "👁️", url: "../agents/supervisor_hub.html", badge: "AUDITING AI" }
            ]
        },
        supporto: {
            title: "ASSISTENZA & USERGUIDE",
            subtitle: "Consulta il manuale operativo, accedi all'assistenza diretta ed attiva i bot di supporto.",
            badge: "SUPPORTO",
            color: "amber",
            items: [
                { id: "support_hub", name: "Support Hub Aziendale", desc: "Centro assistenza tecnica, apertura ticket e guida alla risoluzione problemi.", icon: "🎧", url: "../supporto/support_hub.html", badge: "TICKETS" },
                { id: "userguide", name: "Manuale Utente & UserGuide", desc: "Guida completa all'uso dell'intero ecosistema SiteBoS MiniApp.", icon: "🌐", url: "../userguide/index.html", badge: "DOCS" },
                { id: "bot_telegram", name: "Bot Telegram Diretto", desc: "Avvia la conversazione con il bot di assistenza aziendale su Telegram.", icon: "💬", url: "https://t.me/TrinAi_Site_bot", badge: "DIRECT" }
            ]
        }
    };

    /**
     * Motore di Trascendimento Smooth 60FPS ad Accelerazione Hardware
     */
    function makeSmoothDraggable(overlayElem, headerElem) {
        if (!overlayElem || !headerElem) return;
        let isDragging = false;
        let startX = 0, startY = 0;
        let origX = 0, origY = 0;
        let rafId = null;

        headerElem.style.cursor = 'grab';

        headerElem.onmousedown = function (e) {
            if (e.target.closest('button') || e.target.closest('input')) return;
            isDragging = true;
            headerElem.style.cursor = 'grabbing';
            overlayElem.style.transition = 'none';
            overlayElem.style.willChange = 'transform';
            
            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');

            startX = e.clientX;
            startY = e.clientY;

            const transformStr = getComputedStyle(overlayElem).transform;
            if (transformStr && transformStr !== 'none') {
                const matrix = new DOMMatrix(transformStr);
                origX = matrix.m41 || 0;
                origY = matrix.m42 || 0;
            } else {
                origX = 0;
                origY = 0;
            }

            document.onmousemove = onMouseMove;
            document.onmouseup = onMouseUp;
        };

        function onMouseMove(e) {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            const nextX = origX + deltaX;
            const nextY = origY + deltaY;

            if (!rafId) {
                rafId = requestAnimationFrame(function () {
                    overlayElem.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
                    rafId = null;
                });
            }
        }

        function onMouseUp() {
            isDragging = false;
            headerElem.style.cursor = 'grab';
            overlayElem.style.willChange = 'auto';
            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'auto');
            document.onmousemove = null;
            document.onmouseup = null;
        }
    }

    /**
     * Apre l'Overlay Flottante per la Sezione Specifica
     */
    function openSectionOverlay(sectionKey) {
        if (sectionKey && SECTIONS_DATA[sectionKey]) {
            currentSectionKey = sectionKey;
        }
        
        let overlay = document.getElementById('desktop-section-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'desktop-section-overlay';
            overlay.className = 'fixed top-12 left-1/2 w-[92vw] max-w-6xl z-[999000] bg-white/95 border border-slate-200 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-slate-900 select-none flex flex-col space-y-5';
            overlay.style.transform = 'translate3d(-50%, 0, 0)';
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');

        renderSectionOverlayContent();
    }

    /**
     * Chiude l'Overlay
     */
    function closeSectionOverlay() {
        const doClose = () => {
            const overlay = document.getElementById('desktop-section-overlay');
            if (overlay) overlay.classList.add('hidden');
        };
        if (window.SiteBosDirtyGuard) {
            window.SiteBosDirtyGuard.requestNavigateAway(null, doClose);
        } else {
            doClose();
        }
    }

    /**
     * Ingrandisci / Ripristina
     */
    function toggleMaximizeOverlay() {
        const overlay = document.getElementById('desktop-section-overlay');
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
            overlay.style.top = '50%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.width = 'calc(100vw - 40px)';
            overlay.style.height = 'calc(100vh - 70px)';
            isMaximized = true;
        }
    }

    /**
     * Renderizza il contenuto della Sezione in Tema Chiaro Light Glassmorphism
     */
    function renderSectionOverlayContent() {
        const overlay = document.getElementById('desktop-section-overlay');
        if (!overlay) return;

        const sec = SECTIONS_DATA[currentSectionKey] || SECTIONS_DATA.identity;

        let html = `
            <!-- HEADER OVERLAY DRAGGABLE -->
            <div id="section-overlay-header" class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-lg font-black shadow-xs">
                        <i class="fas fa-layer-group"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                            <span class="text-[9px] font-black uppercase tracking-widest text-blue-600">${sec.badge}</span>
                        </div>
                        <h2 class="text-lg font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                            ${sec.title}
                        </h2>
                    </div>
                </div>

                <!-- CONTROLLI FINESTRA OVERLAY -->
                <div class="flex items-center gap-2 shrink-0">
                    <button onclick="window.DesktopSectionOverlay.toggleMaximize()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Ingrandisci / Ripristina">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button onclick="window.DesktopSectionOverlay.close()" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Chiudi Overlay">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- SELETORE SEZIONI MAIN MENU & RICERCA -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs backdrop-blur-xl">
                <!-- PILLS CAMBIO SEZIONE -->
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="window.DesktopCatalogOverlay ? window.DesktopCatalogOverlay.open('SOP') : null" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer bg-white text-slate-600 border border-slate-200 hover:bg-slate-100">
                        📋 CATALOGO MASTER
                    </button>
                    <button onclick="window.DesktopSectionOverlay.open('identity')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${currentSectionKey === 'identity' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                        ⚙️ IDENTITY & SETUP
                    </button>
                    <button onclick="window.DesktopSectionOverlay.open('operativita')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${currentSectionKey === 'operativita' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                        📦 OPERATIVITÀ
                    </button>
                    <button onclick="window.DesktopSectionOverlay.open('agents')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${currentSectionKey === 'agents' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                        🛡️ SICUREZZA & AGENDA
                    </button>
                    <button onclick="window.DesktopSectionOverlay.open('supporto')" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${currentSectionKey === 'supporto' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                        🎧 SUPPORTO
                    </button>
                </div>

                <!-- CAMPO DI RICERCA REAL-TIME -->
                <div class="relative min-w-[240px]">
                    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" value="${sectionSearchQuery}" oninput="window.DesktopSectionOverlay.setSearch(this.value)" placeholder="Cerca modulo..." class="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-blue-500 outline-none transition">
                </div>
            </div>

            <!-- GRIGLIA CARD STRUMENTI SEZIONE -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[62vh] overflow-y-auto pr-1">
        `;

        const filteredItems = sec.items.filter(item => {
            return !sectionSearchQuery || item.name.toLowerCase().includes(sectionSearchQuery) || item.desc.toLowerCase().includes(sectionSearchQuery);
        });

        if (filteredItems.length === 0) {
            html += `
                <div class="col-span-full py-16 text-center text-slate-400">
                    <i class="fas fa-search text-4xl mb-3 opacity-40"></i>
                    <p class="text-xs font-black uppercase tracking-widest">Nessun modulo trovato per la ricerca effettuata</p>
                </div>
            `;
        } else {
            filteredItems.forEach(item => {
                html += `
                    <div onclick="window.DesktopSectionOverlay.launchTool('${item.url}', '${item.name}', '${item.icon}')" class="group relative bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-blue-500/60 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 backdrop-blur-xl cursor-pointer">
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <div class="w-12 h-12 rounded-xl bg-white border border-slate-200 text-2xl flex items-center justify-center shadow-2xs group-hover:scale-105 transition duration-200 p-1 overflow-hidden">
                                    ${item.icon && item.icon.includes('.') ? `
                                        <img src="${item.icon}" alt="${item.name}" class="w-full h-full object-contain rounded-lg">
                                    ` : `
                                        ${item.icon}
                                    `}
                                </div>
                                <span class="px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-[8.5px] font-black uppercase tracking-widest">
                                    ${item.badge}
                                </span>
                            </div>

                            <h3 class="text-xs font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1">
                                ${item.name}
                            </h3>
                            <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                ${item.desc}
                            </p>
                        </div>

                        <div class="pt-3.5 mt-3.5 border-t border-slate-200/80 flex items-center justify-between">
                            <span class="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                                APRI MODULO
                            </span>
                            <button class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-black text-[9.5px] uppercase tracking-wider transition">
                                APRI ➔
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        overlay.innerHTML = html;

        const header = document.getElementById('section-overlay-header');
        if (header) makeSmoothDraggable(overlay, header);
    }

    /**
     * Lancia uno strumento aprendolo in una Finestra Flottante Multi-Tasking
     */
    function launchTool(url, name, icon) {
        const lowerUrl = (url || '').toLowerCase();
        if (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) {
            const tg = window.Telegram?.WebApp;
            if (tg && typeof tg.openLink === 'function') {
                tg.openLink(url);
            } else {
                window.open(url, '_blank');
            }
            return;
        }

        if (window.DesktopWindowManager) {
            const isWideTool = lowerUrl.includes('trinai');
            const winWidth = isWideTool ? 960 : 460;
            const winHeight = isWideTool ? 720 : 780;

            window.DesktopWindowManager.openWindow({
                title: name,
                url: url,
                icon: icon || 'fa-cloud',
                width: winWidth,
                height: winHeight
            });
        } else {
            window.location.href = url;
        }
    }

    // Esporta il controller globale
    window.DesktopSectionOverlay = {
        open: openSectionOverlay,
        close: closeSectionOverlay,
        toggleMaximize: toggleMaximizeOverlay,
        setSearch: function (q) { sectionSearchQuery = (q || '').toLowerCase(); renderSectionOverlayContent(); },
        launchTool: launchTool
    };

})(window);
