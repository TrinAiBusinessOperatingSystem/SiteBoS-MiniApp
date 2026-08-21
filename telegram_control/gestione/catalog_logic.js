        'use strict';
        const WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e";
        const tg = window.Telegram.WebApp;
        if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#ffffff');
        tg.ready(); tg.expand();
        if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
        if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

        // Logica Speech Audio Guide (Play / Stop)
        let catalogAudio = null;
        let isAudioPlaying = false;

        function getCatalogAudioFile() {
            if (currentViewLevel === 'items') {
                return 'catalog_add-product.wav';
            }
            if (currentViewLevel === 'actions') {
                return 'catalog_edit-product.wav';
            }
            return 'catalog.wav';
        }

        window.stopCatalogAudio = function() {
            if (isAudioPlaying && catalogAudio) {
                catalogAudio.pause();
                catalogAudio.currentTime = 0;
            }
            isAudioPlaying = false;
            catalogAudio = null;
            const btn = document.getElementById('btn-nav-audio');
            const icon = btn ? btn.querySelector('i') : null;
            if (icon) {
                icon.className = 'fas fa-volume-high text-[10px]';
            }
            if (btn) {
                btn.classList.remove('bg-slate-900/10', 'text-slate-900');
            }
        };

        window.openUserGuide = function(url) {
            const overlay = document.getElementById('userguide-drawer-overlay');
            const drawer = document.getElementById('userguide-drawer');
            const iframe = document.getElementById('userguide-iframe');
            if (!overlay || !drawer || !iframe) return;

            window.stopCatalogAudio();

            iframe.src = url;
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                drawer.classList.remove('translate-y-full');
            }, 10);
        };

        window.closeUserGuide = function() {
            const overlay = document.getElementById('userguide-drawer-overlay');
            const drawer = document.getElementById('userguide-drawer');
            if (!overlay || !drawer) return;

            overlay.classList.add('opacity-0');
            drawer.classList.add('translate-y-full');
            setTimeout(() => {
                overlay.classList.add('hidden');
                document.getElementById('userguide-iframe').src = "";
            }, 300);
        };

        window.toggleCatalogAudio = function() {
            const btn = document.getElementById('btn-nav-audio');
            const icon = btn ? btn.querySelector('i') : null;
            
            if (!catalogAudio) {
                const audioFile = getCatalogAudioFile();
                catalogAudio = new Audio(audioFile);
                catalogAudio.addEventListener('ended', () => {
                    isAudioPlaying = false;
                    catalogAudio.currentTime = 0;
                    if (icon) {
                        icon.className = 'fas fa-volume-high text-[10px]';
                        btn.classList.remove('bg-slate-900/10', 'text-slate-900');
                    }
                });
            }

            if (isAudioPlaying) {
                catalogAudio.pause();
                catalogAudio.currentTime = 0; // Ripristina all'inizio (Comportamento Stop)
                isAudioPlaying = false;
                if (icon) {
                    icon.className = 'fas fa-volume-high text-[10px]';
                    btn.classList.remove('bg-slate-900/10', 'text-slate-900');
                }
            } else {
                catalogAudio.play().then(() => {
                    isAudioPlaying = true;
                    if (icon) {
                        icon.className = 'fas fa-stop text-[10px]';
                        btn.classList.add('bg-slate-900/10', 'text-slate-900');
                    }
                }).catch(err => {
                    console.error("Errore riproduzione audio:", err);
                });
            }
        };

        // Gestione Help Overlay Modal
        window.switchHelpTab = function(tab) {
            const btnMobile = document.getElementById('tab-btn-mobile');
            const btnDesktop = document.getElementById('tab-btn-desktop');
            const contentMobile = document.getElementById('tab-content-mobile');
            const contentDesktop = document.getElementById('tab-content-desktop');
            if (!btnMobile || !btnDesktop || !contentMobile || !contentDesktop) return;

            if (tab === 'mobile') {
                btnMobile.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
                btnMobile.classList.remove('text-slate-400');
                btnDesktop.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
                btnDesktop.classList.add('text-slate-400');
                contentMobile.classList.remove('hidden');
                contentDesktop.classList.add('hidden');
            } else {
                btnDesktop.classList.add('bg-white', 'text-slate-900', 'shadow-sm');
                btnDesktop.classList.remove('text-slate-400');
                btnMobile.classList.remove('bg-white', 'text-slate-900', 'shadow-sm');
                btnMobile.classList.add('text-slate-400');
                contentDesktop.classList.remove('hidden');
                contentMobile.classList.add('hidden');
            }
        };

        window.toggleHelpModal = function(show) {
            const overlay = document.getElementById('help-overlay');
            if (!overlay) return;
            if (show) {
                // Auto-rilevamento dispositivo all'apertura
                const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window.Telegram?.WebApp && window.Telegram.WebApp.platform !== 'unknown' && window.Telegram.WebApp.platform !== 'tdesktop' && window.Telegram.WebApp.platform !== 'weba');
                window.switchHelpTab(isMobileDevice ? 'mobile' : 'desktop');

                overlay.classList.remove('hidden');
                setTimeout(() => {
                    overlay.classList.remove('opacity-0');
                    overlay.querySelector('.modal-content').classList.remove('scale-95');
                }, 10);
            } else {
                overlay.classList.add('opacity-0');
                overlay.querySelector('.modal-content').classList.add('scale-95');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
        };

        // Keyboard navigation control for Desktop
        window.addEventListener('keydown', e => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) {
                if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                
                if (e.key === 'ArrowUp') {
                    playTick(750, 0.03, 0.05);
                    navigateStack(-1);
                } else if (e.key === 'ArrowDown') {
                    playTick(750, 0.03, 0.05);
                    navigateStack(1);
                } else if (e.key === 'ArrowLeft' || e.key === 'Enter') {
                    playTick(750, 0.03, 0.05);
                    // Entra ed espande la card attiva
                    if (typeof handleActiveCardClick === 'function') {
                        handleActiveCardClick();
                    }
                } else if (e.key === 'ArrowRight' || e.key === 'Escape') {
                    playTick(750, 0.03, 0.05);
                    // Torna indietro
                    if (typeof handleTopBack === 'function') {
                        handleTopBack();
                    }
                }
            }
        });

        // Configurazione Loader e Stampa
        window.showLoader = (text) => {
            const loader = document.getElementById('loader');
            const loaderText = loader ? loader.querySelector('p') : null;
            if (loaderText) loaderText.innerText = text || "Caricamento...";
            if (loader) loader.classList.remove('hidden');
        };

        window.hideLoader = () => {
            const loader = document.getElementById('loader');
            if (loader) loader.classList.add('hidden');
        };

        window.getVerticalForService = function(service) {
            if (!service) return 'comune';
            const cat = (service.categoria_padre || '').toLowerCase();
            if (cat.includes('odontoiatria') || cat.includes('dentale')) return 'dentale';
            if (cat.includes('sanitario') || cat.includes('health')) return 'sanitario';
            return 'comune';
        };

        const urlParams = new URLSearchParams(window.location.search);
        let ash = urlParams.get('ash');
        let msg = urlParams.get('msg') || urlParams.get('message_id');

        if (ash && ash.includes('?msg=')) {
            const parts = ash.split('?msg=');
            ash = parts[0];
            if (!msg) msg = parts[1];
        }

        let fullCatalog = [];
        let currentMacro = 'SOP';
        let currentViewLevel = 'categories'; // 'categories', 'items' or 'actions'
        
        let activeCategory = null;
        let activeProduct = null;
        
        let modules = [];
        let activeIdx = 0;
        
        let parentCategoryActiveIdx = 0;
        let parentItemActiveIdx = 0;

        let currentEditingCatId = null;
        let currentProductData = null;
        let currentSopId = null;
        let currentVatNumber = null;
        let currentSocialData = null;
        let currentSecurityState = false;

        const container = document.getElementById('stack-container');
        const dotContainer = document.getElementById('dot-indicators');
        const dotWrapper = document.getElementById('dot-indicators-wrapper');

        // Audio Sensory Feedback
        let audioCtx = null;
        function playTick(freq = 800, dur = 0.03, vol = 0.05) {
            try {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + dur);
                osc.start();
                osc.stop(audioCtx.currentTime + dur);
            } catch (e) { console.warn(e); }
        }

        function cleanLabel(label) {
            if (!label) return "";
            return label.replace(/\[SOP\]|\[SER\]|\[PRO\]/gi, "").trim();
        }

        async function loadCatalog(force = false) {
            const loader = document.getElementById('loader');
            const content = document.getElementById('app-content');
            if (force) loader.classList.remove('hidden');

            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "get_catalog", _auth: tg.initData, ash: ash, msg: msg })
                });
                const raw = await res.json();
                const data = Array.isArray(raw) ? raw[0] : (raw.catalog || raw);
                fullCatalog = data.categories || data.catalog?.categories || [];

                // Parsing dei parametri URL per deep-linking da Agente Vocale (macro, cat, category)
                const initialMacro = urlParams.get('macro');
                if (initialMacro) {
                    const mUpper = initialMacro.toUpperCase();
                    if (['SOP', 'SER', 'PRO'].includes(mUpper)) {
                        currentMacro = mUpper;
                    } else if (mUpper.startsWith('PROD')) {
                        currentMacro = 'PRO';
                    } else if (mUpper.startsWith('SERV')) {
                        currentMacro = 'SER';
                    } else if (mUpper.startsWith('PROC') || mUpper.startsWith('SOP')) {
                        currentMacro = 'SOP';
                    }
                }

                const initialCat = urlParams.get('cat') || urlParams.get('category');
                if (initialCat) {
                    const targetCat = fullCatalog.find(c => (c.name || '').toLowerCase().includes(initialCat.toLowerCase()) || (c.short_name || '').toLowerCase().includes(initialCat.toLowerCase()));
                    if (targetCat) {
                        currentMacro = targetCat.macrocategories || currentMacro;
                        activeCategory = targetCat;
                        currentViewLevel = 'items';
                        activeIdx = 0;
                    }
                }

                renderCatalog();
                if (window.DesktopCatalogWhiteboard) window.DesktopCatalogWhiteboard.render();
            } catch (e) {
                console.error("Load Error:", e);
                tg.HapticFeedback.notificationOccurred("error");
            } finally {
                loader.classList.add('hidden');
                const isMobile = (window.innerWidth < 768) || /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
                if (isMobile) {
                    content.classList.remove('hidden');
                    content.style.display = '';
                } else {
                    content.classList.add('hidden');
                    content.style.display = 'none';
                }
                if (window.DesktopCatalogWhiteboard) window.DesktopCatalogWhiteboard.render();
            }
        }

        // Horizontal Macro Tabs Navigation
        function setMacro(macro) {
            if (currentMacro === macro && currentViewLevel === 'categories') return;
            window.stopCatalogAudio();
            playTick(700, 0.03, 0.05);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

            currentMacro = macro;
            currentViewLevel = 'categories';
            activeCategory = null;
            activeProduct = null;
            activeIdx = 0;

            renderCatalog();
            if (isFlatListView) renderFlatList();
        }

        window.navigateMacro = function(direction) {
            const macros = ['SOP', 'SER', 'PRO'];
            const currentIdx = macros.indexOf(currentMacro);
            const targetIdx = (currentIdx + direction + macros.length) % macros.length;
            setMacro(macros[targetIdx]);
        };

        function updateMacroLayout() {
            const macros = ['SOP', 'SER', 'PRO'];
            const activeMacroIdx = macros.indexOf(currentMacro);
            
            macros.forEach((macro, idx) => {
                const el = document.getElementById('card-macro-' + macro);
                if (!el) return;
                
                const diff = idx - activeMacroIdx;
                let rotateY = diff * 35; 
                let translateZ = -Math.abs(diff) * 50; 
                let translateX = diff * 125; 
                let opacity = 1 - Math.abs(diff) * 0.45;
                
                el.style.transform = `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg)`;
                el.style.opacity = Math.max(0.2, opacity);
                
                const icon = el.querySelector('span:first-child');
                const label = el.querySelector('span:last-child');

                if (diff === 0) {
                    el.className = "macro-tab-item-3d bg-white/90 border border-slate-300 shadow-md py-1.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none";
                    if (icon) icon.className = "text-base opacity-100";
                    if (label) label.className = "text-[10px] font-black uppercase tracking-wider text-slate-900";
                } else {
                    el.className = "macro-tab-item-3d bg-white/40 border border-slate-200/60 py-1.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none";
                    if (icon) icon.className = "text-base opacity-60";
                    if (label) label.className = "text-[10px] font-extrabold uppercase tracking-wider text-slate-400";
                }
            });
        }

        function renderCatalog() {
            container.innerHTML = "";
            dotContainer.innerHTML = "";

            updateMacroLayout();

            // Toggle 3D Back Button visibility
            const backBtn3d = document.getElementById('btn-nav-back');
            if (backBtn3d) {
                backBtn3d.classList.remove('hidden');
            }

            document.getElementById('macro-carousel-wrapper').classList.remove('hidden');

            if (currentViewLevel === 'categories') {
                document.getElementById('submenu-header').classList.add('hidden');
                document.getElementById('main-action-btn-text').innerText = "Nuova Categoria";
                if (!isFlatListView) document.getElementById('main-action-btn').classList.remove('hidden');
                
                modules = fullCatalog.filter(c => c.macrocategories === currentMacro);
                
                let activeTotal = 0, ghostTotal = 0;
                modules.forEach(cat => {
                    const sub = cat.subcategories || [];
                    activeTotal += sub.filter(p => p.blueprint_ready).length;
                    ghostTotal += sub.filter(p => !p.blueprint_ready).length;
                });
                document.getElementById('count-active').innerText = activeTotal;
                document.getElementById('count-ghost').innerText = ghostTotal;
            } else if (currentViewLevel === 'items') {
                document.getElementById('submenu-header').classList.remove('hidden');
                
                const categoryShort = activeCategory.short_name || activeCategory.name;
                const categoryFull = activeCategory.name;
                const cleanedShort = cleanLabel(categoryShort);
                const cleanedFull = cleanLabel(categoryFull);
                
                const iconBox = document.querySelector('#submenu-header .w-5');
                if (iconBox) {
                    iconBox.innerHTML = '<i class="fas fa-folder-open text-[8px]"></i>';
                }
                
                if (cleanedShort !== cleanedFull && cleanedFull) {
                    document.getElementById('submenu-title').innerHTML = `
                        <div class="flex flex-col text-left">
                            <span class="text-[9px] font-black uppercase tracking-widest text-slate-800 leading-tight">${cleanedShort}</span>
                            <span class="text-[7px] font-semibold text-slate-400 normal-case tracking-normal leading-none mt-0.5">${cleanedFull}</span>
                        </div>
                    `;
                } else {
                    document.getElementById('submenu-title').innerHTML = `
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-800 leading-none">${cleanedShort}</span>
                    `;
                }

                document.getElementById('submenu-back-text').innerText = "Categorie";
                document.getElementById('main-action-btn-text').innerText = "Aggiungi Voce";
                if (!isFlatListView) document.getElementById('main-action-btn').classList.remove('hidden');
                
                modules = activeCategory.subcategories || [];
                
                let activeTotal = modules.filter(p => p.blueprint_ready).length;
                let ghostTotal = modules.filter(p => !p.blueprint_ready).length;
                document.getElementById('count-active').innerText = activeTotal;
                document.getElementById('count-ghost').innerText = ghostTotal;
            } else { // 'actions'
                document.getElementById('submenu-header').classList.remove('hidden');
                
                const { icon, text: prodShort } = splitShortName(activeProduct.short_name || activeProduct.name || '');
                const prodFull = activeProduct.name || '';
                const cleanedShort = cleanLabel(prodShort);
                const cleanedFull = cleanLabel(prodFull);
                
                const displayIcon = icon || '💡';
                const iconBox = document.querySelector('#submenu-header .w-5');
                if (iconBox) {
                    iconBox.innerHTML = displayIcon;
                    iconBox.className = "w-5 h-5 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shadow-sm shrink-0 select-none";
                }
                
                if (cleanedShort !== cleanedFull && cleanedFull) {
                    document.getElementById('submenu-title').innerHTML = `
                        <div class="flex flex-col text-left">
                            <span class="text-[9px] font-black uppercase tracking-widest text-slate-800 leading-tight">${cleanedShort}</span>
                            <span class="text-[7px] font-semibold text-slate-400 normal-case tracking-normal leading-none mt-0.5">${cleanedFull}</span>
                        </div>
                    `;
                } else {
                    document.getElementById('submenu-title').innerHTML = `
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-800 leading-none">${cleanedShort}</span>
                    `;
                }

                document.getElementById('submenu-back-text').innerText = "Voci";
                document.getElementById('main-action-btn').classList.add('hidden'); // hidden for action menu
                
                modules = compileActionCards();
            }

            if (modules.length === 0) {
                document.getElementById("empty-state").classList.remove('hidden');
                dotWrapper.classList.add('hidden');
                return;
            }
            document.getElementById("empty-state").classList.add('hidden');
            dotWrapper.classList.remove('hidden');

            if (activeIdx >= modules.length) activeIdx = modules.length - 1;
            if (activeIdx < 0) activeIdx = 0;

            buildStack();
            if (typeof isFlatListView !== 'undefined' && isFlatListView) {
                renderFlatList();
            }
        }

        function compileActionCards() {
            if (!activeProduct || !currentProductData) return [];
            
            const list = [];
            
            // 1. Informazioni Base (Scheda Info)
            list.push({
                id: 'info',
                label: 'Informazioni Base',
                desc: 'Modifica i dettagli e le caratteristiche generali del prodotto/servizio.',
                icon: 'fa-edit',
                action: () => launchSubEditor('edit-product.html')
            });

            // 2. Informazioni Avanzate (Avanzate)
            const isSemi = activeProduct.item_type === 'SEMI_FINISHED' || 
                           activeProduct.item_type === 'semilavorato' || 
                           activeProduct.item_type === 'SEMI_FINISHED_PRODUCT' ||
                           currentProductData.blueprint_type === 'SOP_SEMILAVORATO' ||
                           (activeProduct.callback_data && activeProduct.callback_data.includes("SEMI"));
            
            if (currentMacro !== 'SOP' || isSemi) {
                list.push({
                    id: 'advanced',
                    label: 'Informazioni Avanzate',
                    desc: 'Gestisci la scomposizione dei costi, ricetta (BOM) e parametri avanzati.',
                    icon: 'fa-sliders',
                    action: () => openAdvancedManagement()
                });
            }

            // 3. Processo Aziendale (Blueprint SOP)
            list.push({
                id: 'blueprint',
                label: 'Processo Aziendale',
                desc: 'Configura la logica esecutiva passo-passo e la conformità di processo.',
                icon: 'fa-diagram-project',
                action: () => openBlueprintEditor()
            });

            // 4. Web Blog Page (Blog & Story)
            const hasBlog = currentProductData.blog_active;
            list.push({
                id: 'blog',
                label: hasBlog ? 'Web Blog Page' : 'Attiva Blog Page',
                desc: hasBlog ? 'Gestisci e modifica gli articoli generati dall\'IA per la tua vetrina.' : 'Attiva la generazione automatica di articoli per la vetrina con l\'AI.',
                icon: 'fa-pen-nib',
                color: hasBlog ? '' : 'text-blue-600',
                action: () => hasBlog ? launchSubEditor('edit-blog.html') : activateService('blog')
            });

            // 5. Social Post (Social Posts)
            const hasSocial = currentProductData.post;
            list.push({
                id: 'social',
                label: hasSocial ? 'Social Post' : 'Attiva Social',
                desc: hasSocial ? 'Visualizza e ottimizza i post pronti per la condivisione sui canali social.' : 'Attiva la scrittura automatica di post social ottimizzati per il marketing.',
                icon: 'fa-share-nodes',
                color: hasSocial ? '' : 'text-blue-600',
                action: () => hasSocial ? launchSubEditor('edit-post.html') : activateService('social')
            });

            // 6. Base Conoscenza AI
            list.push({
                id: 'knowledge',
                label: 'Base Conoscenza',
                desc: 'Istruisci l\'assistente virtuale inserendo FAQ, manuali e materiali di supporto.',
                icon: 'fa-brain',
                action: () => launchSubEditor('edit-knowledge.html')
            });

            // 7. Supervisor Hub
            list.push({
                id: 'supervisor',
                label: 'Supervisor Hub',
                desc: 'Monitora in tempo reale i task e lo stato di avanzamento operativo di questa voce.',
                icon: 'fa-user-gear',
                action: () => launchSubEditor('supervisor_hub.html')
            });

            // 8. Stampa Documento
            list.push({
                id: 'print',
                label: 'Stampa',
                desc: 'Genera e stampa il documento tecnico con la scheda del servizio.',
                icon: 'fa-print',
                action: async () => {
                    playTick(900, 0.04, 0.06);
                    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                    
                    window.showLoader("Richiesta dati di stampa...");
                    try {
                        const res = await fetch('https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'print',
                                sop_id: currentSopId,
                                ash: ash,
                                msg: msg,
                                _auth: tg.initData
                            })
                        });
                        
                        if (!res.ok) throw new Error("Errore risposta server");
                        const payload = await res.json();
                        
                        if (!payload || (!payload.service_catalog && !payload.process_blueprints)) {
                            throw new Error("Dati di stampa incompleti");
                        }
                        
                        // Chiama il print engine per generare e trasmettere il PDF
                        await CatalogPrintEngine.printSingleService(payload);
                    } catch (err) {
                        console.error('Errore durante la stampa:', err);
                        tg.showAlert("Errore durante la generazione della stampa: " + err.message);
                    } finally {
                        window.hideLoader();
                    }
                }
            });

            // 9. Crea la Guida con AI (Solo se Prodotto e categoria "Asset digitali")
            const isProduct = currentMacro === 'PRO' || (activeProduct && (activeProduct.item_type === 'PRODUCT' || activeProduct.item_type === 'product'));
            const isAssetDigitali = activeCategory && activeCategory.name && activeCategory.name.toLowerCase().includes('asset digitali');
            
            if (isProduct && isAssetDigitali) {
                list.push({
                    id: 'create_ai_guide',
                    label: 'Crea Guida con AI',
                    desc: 'Genera automaticamente la guida digitale con l\'intelligenza artificiale.',
                    icon: 'fa-brain',
                    action: () => {
                        // NOTA: questa azione puntava a create_guide_pdf.workflow.ts, uno stub
                        // Webhook→RespondToWebhook senza logica reale (rispondeva sempre {}),
                        // per cui mostrava "Guida creata con successo" senza aver mai generato
                        // o inviato nulla. Il vero builder di guide, completo e già wired
                        // (guideBuilder.workflow.ts, 14 nodi reali), vive in creatore-guide.html:
                        // qui apriamo quello, passando il contesto del prodotto selezionato.
                        playTick(900, 0.04, 0.06);
                        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

                        const params = new URLSearchParams({
                            ash: ash || '',
                            vat: currentVatNumber || '',
                            sku: currentSopId || '',
                            name: activeProduct.short_name || activeProduct.name || '',
                            cat: (activeCategory && activeCategory.name) || ''
                        });
                        window.location.href = `creatore-guide.html?${params.toString()}`;
                    }
                });
            }

            return list;
        }

        function buildStack() {
            container.innerHTML = "";
            dotContainer.innerHTML = "";

            modules.forEach((mod, idx) => {
                const card = document.createElement('div');
                card.id = `card-${idx}`;
                card.className = `platform-card-3d select-none`;
                
                if (currentViewLevel === 'categories') {
                    // Category Card - Clean rectangular layout
                    const subcats = mod.subcategories || [];
                    const activeSubcats = subcats.filter(p => p.blueprint_ready).length;
                    
                    card.innerHTML = `
                        <div class="w-full flex justify-between items-center shrink-0">
                            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Categoria</span>
                            <div class="flex gap-2">
                                <button class="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 transition active:scale-90" onclick="event.stopPropagation(); window.openEditModal('${mod.name}', '${mod.short_name || ''}', '${mod.callback_data}')">
                                    <i class="fas fa-pen text-[10px]"></i>
                                </button>
                                <button class="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 transition active:scale-90" onclick="event.stopPropagation(); window.deleteCategory('${mod.callback_data}', '${mod.name}')">
                                    <i class="fas fa-trash text-[10px]"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="my-auto w-full">
                            ${(() => {
                                const categoryShort = mod.short_name || mod.name;
                                const categoryFull = mod.name;
                                const cleanedShort = cleanLabel(categoryShort);
                                const cleanedFull = cleanLabel(categoryFull);
                                if (cleanedShort !== cleanedFull && cleanedFull) {
                                    return `
                                        <h2 class="text-sm font-black tracking-tight text-slate-900 leading-snug uppercase px-2">${cleanedShort}</h2>
                                        <p class="text-[9px] text-slate-500 font-bold leading-tight mt-1 px-4 text-center normal-case line-clamp-2">${cleanedFull}</p>
                                    `;
                                } else {
                                    return `<h2 class="text-sm font-black tracking-tight text-slate-900 leading-snug uppercase px-2">${cleanedShort}</h2>`;
                                }
                            })()}
                            <div class="flex justify-center items-center gap-1.5 mt-2">
                                <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[8.5px] font-black uppercase tracking-wider">${subcats.length} Voci</span>
                                ${activeSubcats > 0 ? `<span class="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[8.5px] font-black uppercase tracking-wider shadow-sm">${activeSubcats} Attive</span>` : ''}
                            </div>
                        </div>

                        <div class="w-full text-center shrink-0">
                            <span class="text-[7px] font-black uppercase tracking-widest text-blue-600 flex items-center justify-center gap-1 animate-pulse">
                                Espandi Categoria <i class="fas fa-chevron-right text-[6px]"></i>
                            </span>
                        </div>
                    `;
                } else if (currentViewLevel === 'items') {
                    // Item Card - Rectangular card acting as a trigger
                    const { icon, text } = splitShortName(mod.short_name || mod.name || '');
                    const cleanedShort = cleanLabel(text);
                    const cleanedFull = cleanLabel(mod.name || '');
                    const isSecurity = mod.show_in_security_assistant === true;
                    
                    card.innerHTML = `
                        <div class="w-full flex justify-between items-center shrink-0">
                            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">SKU Voce</span>
                            <div class="flex gap-2">
                                <button class="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 transition active:scale-90" onclick="event.stopPropagation(); window.openEditProductModal(mod)">
                                    <i class="fas fa-pen text-[10px]"></i>
                                </button>
                                <button class="w-7 h-7 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 transition active:scale-90" onclick="event.stopPropagation(); window.deleteProduct('${mod.callback_data}', '${mod.name}')">
                                    <i class="fas fa-trash text-[10px]"></i>
                                </button>
                            </div>
                        </div>

                        <div class="my-auto flex items-center gap-4 w-full px-2 text-left">
                            <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100 shrink-0">
                                ${icon || '💡'}
                            </div>
                            <div class="overflow-hidden">
                                <h3 class="text-xs font-black tracking-tight text-slate-900 leading-snug uppercase truncate">${cleanedShort}</h3>
                                ${cleanedShort !== cleanedFull && cleanedFull ? `
                                <p class="text-[9px] text-slate-500 font-bold leading-tight mt-0.5 normal-case line-clamp-2">${cleanedFull}</p>
                                ` : ''}
                                <p class="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate">ID: ${mod.callback_data}</p>
                            </div>
                        </div>

                        <div class="w-full flex justify-between items-center shrink-0">
                            <div class="flex gap-1.5">
                                <span class="px-2 py-0.5 ${mod.blueprint_ready ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'} rounded-full text-[7.5px] font-black uppercase tracking-widest">
                                    ${mod.blueprint_ready ? 'Attivo' : 'Suggerito'}
                                </span>
                                ${isSecurity ? `
                                <span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[7.5px] font-black uppercase tracking-widest flex items-center gap-0.5">
                                    <i class="fas fa-shield-halved text-[6px]"></i> Sicurezza
                                </span>` : ''}
                            </div>
                            <span class="text-[7px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1 animate-pulse">
                                ${mod.blueprint_ready ? 'Gestisci' : 'Attiva'} <i class="fas fa-chevron-right text-[6px]"></i>
                            </span>
                        </div>
                    `;
                } else {
                    // Action Option Card (Level 3 Sottomenu)
                    card.innerHTML = `
                        <div class="w-full text-left shrink-0">
                            <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 italic">Opzione Gestione</span>
                        </div>

                        <div class="my-auto flex items-center gap-4 w-full px-2 text-left">
                            <div class="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-xl shadow-sm shrink-0">
                                <i class="fas ${mod.icon} ${mod.color || ''}"></i>
                            </div>
                            <div class="overflow-hidden">
                                <h3 class="text-xs font-black tracking-tight text-slate-900 leading-none uppercase mb-1">${mod.label}</h3>
                                <p class="text-[10px] text-slate-600 font-bold leading-snug mt-1">${mod.desc}</p>
                            </div>
                        </div>

                        <div class="w-full text-right shrink-0">
                            <span class="text-[7px] font-black uppercase tracking-wider text-blue-600 flex items-center justify-end gap-1 animate-pulse">
                                Apri <i class="fas fa-chevron-right text-[6px]"></i>
                            </span>
                        </div>
                    `;
                }

                // Gestures trigger
                let touchStartX = 0;
                let touchStartY = 0;
                let isSwipeAction = false;

                card.addEventListener('touchstart', e => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    isSwipeAction = false;
                }, { passive: true });

                card.addEventListener('touchmove', e => {
                    const diffX = Math.abs(e.touches[0].clientX - touchStartX);
                    const diffY = Math.abs(e.touches[0].clientY - touchStartY);
                    if (diffX > 10 || diffY > 10) {
                        isSwipeAction = true;
                    }
                }, { passive: true });

                card.addEventListener('click', () => {
                    if (isSwipeAction) return;
                    playTick(800, 0.03, 0.05);
                    if (idx === activeIdx) {
                        handleActiveCardClick();
                    } else {
                        selectIdx(idx);
                    }
                });

                container.appendChild(card);

                // Dot indicator
                const dot = document.createElement('div');
                dot.id = `dot-${idx}`;
                dot.className = `w-2.5 h-2.5 rounded-full bg-slate-300 transition-all duration-300 cursor-pointer`;
                dot.onclick = () => selectIdx(idx);
                dotContainer.appendChild(dot);
            });

            updateStackLayout();
            setupTelegramBackButton();
        }

        function handleActiveCardClick() {
            if (currentViewLevel === 'categories') {
                enterCategory(modules[activeIdx]);
            } else if (currentViewLevel === 'items') {
                const prod = modules[activeIdx];
                if (!prod) return;
                if (prod.blueprint_ready) {
                    // Prodotto già attivo → apre il pannello di gestione
                    enterActions(prod);
                } else {
                    // Prodotto suggerito → va alla pagina di attivazione (equivale al vecchio pulsante "Attiva")
                    playTick(900, 0.04, 0.06);
                    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                    location.href = `add-product.html?ash=${ash}&msg=${msg || ''}&catId=${activeCategory.callback_data}&ghostId=${prod.callback_data}`;
                }
            } else {
                // Trigger option's custom action
                const opt = modules[activeIdx];
                if (opt && opt.action) {
                    opt.action();
                }
            }
        }

        function enterCategory(cat) {
            if (!cat) return;
            window.stopCatalogAudio();
            playTick(900, 0.04, 0.06);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            
            parentCategoryActiveIdx = activeIdx;
            activeCategory = cat;
            currentViewLevel = 'items';
            activeIdx = 0;
            renderCatalog();
        }

        function exitCategory() {
            window.stopCatalogAudio();
            playTick(600, 0.04, 0.06);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            currentViewLevel = 'categories';
            activeCategory = null;
            activeIdx = parentCategoryActiveIdx;
            renderCatalog();
        }

        async function enterActions(prod) {
            if (!prod) return;
            window.stopCatalogAudio();
            playTick(900, 0.04, 0.06);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            parentItemActiveIdx = activeIdx;
            activeProduct = prod;
            
            // Inline loader
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full w-full">
                    <div class="spinner"></div>
                    <p class="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-3">Caricamento moduli...</p>
                </div>
            `;
            dotWrapper.classList.add('hidden');

            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_ghost_info', sop_id: prod.callback_data, ash: ash, msg: msg, _auth: tg.initData })
                });
                const info = await res.json();
                const rawInfo = Array.isArray(info) ? info[0] : info;
                currentProductData = rawInfo;
                currentVatNumber = rawInfo.vat_number || rawInfo.vatnumber || rawInfo.vat || '';
                currentSopId = prod.callback_data;
                currentSecurityState = rawInfo.show_in_security_assistant === true || prod.show_in_security_assistant === true;

                currentViewLevel = 'actions';
                activeIdx = 0;
                renderCatalog();
            } catch (e) {
                console.error(e);
                tg.showAlert("Errore durante il caricamento dei dettagli.");
                currentViewLevel = 'items';
                renderCatalog();
            }
        }

        function exitActions() {
            window.stopCatalogAudio();
            playTick(600, 0.04, 0.06);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            currentViewLevel = 'items';
            activeProduct = null;
            activeIdx = parentItemActiveIdx;
            renderCatalog();
        }

        function handleTopBack() {
            if (currentViewLevel === 'actions') {
                exitActions();
            } else if (currentViewLevel === 'items') {
                exitCategory();
            } else {
                window.location.href = `../dashboard/dashboard.html?ash=${ash}&msg=${msg || ''}`;
            }
        }

        function selectIdx(idx) {
            if (!modules || modules.length === 0) return;
            let targetIdx = (idx + modules.length) % modules.length;
            if (targetIdx === activeIdx) return;

            // Highlight side dot and play distinct feedback when wrapping around from start to end or end to start
            const isWrapping = (activeIdx === modules.length - 1 && targetIdx === 0) || (activeIdx === 0 && targetIdx === modules.length - 1);
            if (isWrapping) {
                playTick(950, 0.05, 0.07);
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            } else {
                playTick(800 + (targetIdx - activeIdx) * 30, 0.02, 0.04);
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            }

            activeIdx = targetIdx;
            updateStackLayout();
        }

        window.navigateStack = function(direction) {
            if (!modules || modules.length === 0) return;
            selectIdx(activeIdx + direction);
        };

        function updateStackLayout() {
            const N = modules ? modules.length : 0;
            modules.forEach((_, idx) => {
                const card = document.getElementById(`card-${idx}`);
                const dot = document.getElementById(`dot-${idx}`);
                if (!card) return;

                let diff = idx - activeIdx;
                if (N > 1) {
                    if (diff > N / 2) diff -= N;
                    else if (diff < -N / 2) diff += N;
                }

                let translateY = 0;
                let translateZ = 0;
                let rotateX = 0;
                let scale = 1;
                let opacity = 0;
                let zIndex = 10;

                if (diff === 0) {
                    // CARD ATTIVA (Centro)
                    translateY = 0;
                    translateZ = 0;
                    rotateX = 0;
                    scale = 1.0;
                    opacity = 1.0;
                    zIndex = 100;
                    card.style.pointerEvents = 'auto';
                    card.classList.add('active');
                } else if (diff === -1) {
                    // CARD PRIMA (Sopra: Posizionata a -110px per uscire simmetrica da dietro la card centrale)
                    translateY = -110;
                    translateZ = -50;
                    rotateX = -6;
                    scale = 0.78;
                    opacity = 0.40;
                    zIndex = 20;
                    card.classList.remove('active');
                    card.style.pointerEvents = 'none';
                } else if (diff === 1) {
                    // CARD DOPO (Sotto: Posizionata a +110px)
                    translateY = 110;
                    translateZ = -50;
                    rotateX = 6;
                    scale = 0.78;
                    opacity = 0.40;
                    zIndex = 20;
                    card.classList.remove('active');
                    card.style.pointerEvents = 'none';
                } else if (diff < -1) {
                    // NASCOSTO IN ALTO
                    translateY = -120;
                    translateZ = -80;
                    rotateX = -12;
                    scale = 0.65;
                    opacity = 0;
                    zIndex = 5;
                    card.classList.remove('active');
                    card.style.pointerEvents = 'none';
                } else {
                    // NASCOSTO IN BASSO
                    translateY = 180;
                    translateZ = -80;
                    rotateX = 12;
                    scale = 0.65;
                    opacity = 0;
                    zIndex = 5;
                    card.classList.remove('active');
                    card.style.pointerEvents = 'none';
                }

                card.style.transform = `translate3d(0, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
                card.style.opacity = opacity;
                card.style.zIndex = zIndex;

                if (dot) {
                    if (idx === activeIdx) {
                        if (isFlatListView) {
                            // Barra 2: Vista Flat (Boomer) -> DOPPIO PUNTO / PILLOLA (w-2.5 h-6)
                            dot.className = "w-2.5 h-6 rounded-full bg-slate-900 shadow-xs transition-all duration-300";
                        } else {
                            // Barra 1: Vista 3D (Card) -> PUNTO SINGOLO (w-2.5 h-2.5)
                            dot.className = "w-2.5 h-2.5 rounded-full bg-slate-900 shadow-xs transition-all duration-300 scale-110";
                        }
                        setTimeout(() => {
                            dot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 50);
                    } else {
                        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-300/80 transition-all duration-300";
                    }
                }
            });
        }

        // Back Button click routing
        let backButtonHandler = null;
        function setupTelegramBackButton() {
            if (!tg.BackButton) return;
            tg.BackButton.show();
            if (backButtonHandler) {
                tg.BackButton.offClick(backButtonHandler);
            }
            backButtonHandler = () => {
                if (currentViewLevel === 'actions') {
                    exitActions();
                } else if (currentViewLevel === 'items') {
                    exitCategory();
                } else {
                    window.location.href = `../dashboard/dashboard.html?ash=${ash}&msg=${msg || ''}`;
                }
            };
            tg.BackButton.onClick(backButtonHandler);
        }

        // Touch Scrubbing for Dot indicators
        function handleDotScrub(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = dotWrapper.getBoundingClientRect();
            const relativeY = touch.clientY - rect.top;
            let ratio = relativeY / rect.height;
            ratio = Math.max(0, Math.min(0.99, ratio));
            const targetIdx = Math.floor(ratio * modules.length);
            if (targetIdx !== activeIdx) {
                selectIdx(targetIdx);
            }
            if (isFlatListView) {
                const flatEl = document.getElementById('flat-list-container');
                if (flatEl) {
                    flatEl.scrollTop = ratio * (flatEl.scrollHeight - flatEl.clientHeight);
                }
            }
        }
        dotWrapper.addEventListener('touchstart', handleDotScrub, { passive: false });
        dotWrapper.addEventListener('touchmove', handleDotScrub, { passive: false });

        // Mouse scrubbing logic for Desktop (Hold click & drag scroll)
        let isScrubbingMouse = false;

        function handleMouseScrub(e) {
            if (!isScrubbingMouse) return;
            const rect = dotWrapper.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            let ratio = relativeY / rect.height;
            ratio = Math.max(0, Math.min(0.99, ratio));
            const targetIdx = Math.floor(ratio * modules.length);
            if (targetIdx !== activeIdx) {
                selectIdx(targetIdx);
            }
            if (isFlatListView) {
                const flatEl = document.getElementById('flat-list-container');
                if (flatEl) {
                    flatEl.scrollTop = ratio * (flatEl.scrollHeight - flatEl.clientHeight);
                }
            }
        }

        dotWrapper.addEventListener('mousedown', e => {
            isScrubbingMouse = true;
            handleMouseScrub(e);
        });

        window.addEventListener('mousemove', handleMouseScrub);
        window.addEventListener('mouseup', () => {
            isScrubbingMouse = false;
        });

        // Swipe Scroll gestures (Horizontal and Vertical)
        const mainViewport = document.querySelector('main') || container;
        let swipeStartX = 0;
        let swipeStartY = 0;
        mainViewport.addEventListener('touchstart', e => {
            swipeStartX = e.changedTouches[0].screenX;
            swipeStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        mainViewport.addEventListener('touchend', e => {
            const endX = e.changedTouches[0].screenX;
            const endY = e.changedTouches[0].screenY;
            const diffX = endX - swipeStartX;
            const diffY = endY - swipeStartY;
            const threshold = 60;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX < 0) {
                    // Swipe Left -> Enter/Expand
                    handleActiveCardClick();
                } else {
                    // Swipe Right -> Go back
                    if (currentViewLevel === 'actions') {
                        exitActions();
                    } else if (currentViewLevel === 'items') {
                        exitCategory();
                    } else {
                        window.location.href = `../dashboard/dashboard.html?ash=${ash}&msg=${msg || ''}`;
                    }
                }
            } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > threshold) {
                if (diffY < 0) {
                    selectIdx(activeIdx + 1);
                } else {
                    selectIdx(activeIdx - 1);
                }
            }
        }, { passive: true });

        // Desktop Mouse Wheel support
        let wheelDebounce = null;
        container.addEventListener('wheel', e => {
            e.preventDefault();
            if (wheelDebounce) return;
            wheelDebounce = setTimeout(() => { wheelDebounce = null; }, 200);
            if (e.deltaY > 0) {
                selectIdx(activeIdx + 1);
            } else if (e.deltaY < 0) {
                selectIdx(activeIdx - 1);
            }
        }, { passive: false });

        // Horizontal Swipe for Macro tab Carousel (Entire Header Wrapper)
        let macroStartX = 0;
        const macroCarouselWrapper = document.getElementById('macro-carousel-wrapper');
        if (macroCarouselWrapper) {
            macroCarouselWrapper.addEventListener('touchstart', e => {
                macroStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            macroCarouselWrapper.addEventListener('touchend', e => {
                const endX = e.changedTouches[0].screenX;
                const diffX = endX - macroStartX;
                const threshold = 35;
                if (Math.abs(diffX) > threshold) {
                    if (diffX < 0) {
                        navigateMacro(1);
                    } else {
                        navigateMacro(-1);
                    }
                }
            }, { passive: true });
        }

        // Create new Category/Item action
        function handleNewAction() {
            playTick(900, 0.04, 0.07);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            if (currentViewLevel === 'categories') {
                goToAddCategory();
            } else {
                goToAddProduct(activeCategory.callback_data);
            }
        }

        window.goToAddCategory = () => { launchSubEditor(`add-category.html?macro=${currentMacro}`); };
        window.goToAddProduct = (catId) => { launchSubEditor(`add-product.html?catId=${catId}`); };

        // Open Sub-page inside quick editor drawer (Iframe)
        window.openProduct = async (page, pId, catId) => {
            // Seleziona la pagina corretta in base all'azione
            if (page === 'edit-blueprint.html') {
                // Inserita per compatibilità di richiamo da altri editor,
                // reindirizza al flusso Actions stack 3D
                const match = modules.find(p => p.callback_data === pId);
                if (match) {
                    enterActions(match);
                }
                return;
            }
            location.href = `${page}?ash=${ash}&msg=${msg || ''}&productId=${pId}&catId=${catId}&ghostId=${pId}`;
        };

        window.openAdvancedManagement = () => {
            const match = activeProduct;
            const itemType = currentProductData?.identity?.item_type || match?.item_type || '';
            const isSemi = itemType === 'SEMI_FINISHED' || itemType === 'semilavorato' || itemType === 'SEMI_FINISHED_PRODUCT' || currentProductData?.blueprint_type === 'SOP_SEMILAVORATO' || (currentSopId && currentSopId.includes("SEMI"));

            if (currentMacro === 'SOP' && !isSemi) {
                tg.showAlert("La Gestione Avanzata non è disponibile per le Procedure (SOP).");
                return;
            }
            const isAdvancedReady = (currentProductData?.ui_node_draft?.advanced_ready === true) || (match?.blueprint_ready === true);
            if (!isAdvancedReady) {
                launchSubEditor('edit-product.html?open_advanced=true');
            } else {
                const page = (currentMacro === 'PRO' || (currentMacro === 'SOP' && isSemi)) ? 'edit-advanced-product.html' : 'edit-advanced.html';
                launchSubEditor(page);
            }
        };

        window.openBlueprintEditor = () => {
            const match = activeProduct;
            const itemType = (currentProductData?.identity?.item_type || match?.item_type || '').toLowerCase();
            const category = (currentProductData?.identity?.category || match?.category || '').toLowerCase();
            const blueprintType = (currentProductData?.blueprint_type || '').toLowerCase();

            const isSemi = itemType.includes('semi') || 
                           category.includes('semi') || 
                           category.includes('semilavorat') || 
                           blueprintType.includes('semilavorat') || 
                           (currentSopId && currentSopId.toLowerCase().includes("semi"));

            const page = (currentMacro === 'PRO' || isSemi) ? 'edit-blueprint-product.html' : 'edit-blueprint.html';
            launchSubEditor(page);
        };

        window.activateService = async (type) => {
            const wh = type === 'blog' ? "https://prod.workflow.trinai.it/webhook/914bd78e-8a41-46d7-8935-7eb73cbbae66" : "https://prod.workflow.trinai.it/webhook/8fc050ca-41cd-4469-989c-269a113a00f9";
            const cost = 10;
            const actionValue = type === 'blog' ? 'create' : 'activate_social';
            tg.showConfirm(`Attivare ${type.toUpperCase()}? (Costo: ${cost} crediti). Il contenuto verrà generato e inviato su Telegram.`, ok => {
                if (ok) {
                    fetch(wh, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: actionValue, sop_id: currentSopId, ash: ash, msg: msg, _auth: tg.initData }),
                        keepalive: true
                    });
                    setTimeout(() => { tg.close(); }, 3000);
                }
            });
        };

        // Security toggle UI helper
        function updateSecurityBtnUI() {
            const btn = document.getElementById('security-assistant-btn');
            const dot = btn.querySelector('div');
            if (currentSecurityState) {
                btn.className = "w-12 h-7 bg-green-600 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center";
                dot.style.transform = "translateX(20px)";
            } else {
                btn.className = "w-12 h-7 bg-slate-200 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center";
                dot.style.transform = "translateX(0px)";
            }
        }

        window.toggleSecurityAssistant = async () => {
            currentSecurityState = !currentSecurityState;
            updateSecurityBtnUI();

            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'toggle_security',
                        product_id: currentSopId,
                        ash: ash,
                        msg: msg,
                        _auth: tg.initData
                    })
                });
                const result = await res.json();
                if (result && result.status === 'success') {
                    currentSecurityState = result.new_state === true;
                    updateSecurityBtnUI();
                    
                    if (activeProduct) activeProduct.show_in_security_assistant = currentSecurityState;
                } else {
                    currentSecurityState = !currentSecurityState;
                    updateSecurityBtnUI();
                    tg.showAlert("Errore durante il salvataggio.");
                }
            } catch (e) {
                console.error(e);
                currentSecurityState = !currentSecurityState;
                updateSecurityBtnUI();
                tg.showAlert("Errore di connessione.");
            }
        };

        function launchSubEditor(page) {
            const drawer = document.getElementById('quick-editor-drawer');
            const frame = document.getElementById('quickEditorFrame');
            const separator = page.includes('?') ? '&' : '?';
            const url = `${page}${separator}ash=${ash}&msg=${msg || ''}&sop_id=${currentSopId}&from_hub=true`;

            frame.src = url;
            drawer.classList.remove('hidden');
            setTimeout(() => drawer.classList.remove('translate-y-full'), 10);

            if (tg.BackButton) {
                tg.BackButton.onClick(closeSubEditor);
            }
        }

        function closeSubEditor() {
            const drawer = document.getElementById('quick-editor-drawer');
            drawer.classList.add('translate-y-full');
            setTimeout(() => {
                drawer.classList.add('hidden');
                document.getElementById('quickEditorFrame').src = 'about:blank';
            }, 300);

            setupTelegramBackButton();
        }

        // Modals & Emoji Picker
        // Estrae il tag tecnico [SOP]/[SER]/[PRO] da una stringa e restituisce { tag, clean }
        function extractDbTag(str) {
            const match = (str || '').match(/^\[?(SOP|SER|PRO)\]?\s*/i);
            if (match) return { tag: match[0].trim(), clean: str.slice(match[0].length).trim() };
            return { tag: '', clean: (str || '').trim() };
        }

        window.openEditModal = (n, s, id) => {
            currentEditingCatId = id;

            // Estrai il tag dal nome completo e preservalo
            const { tag, clean: cleanName } = extractDbTag(n);
            document.getElementById('edit-cat-tag').value = tag;
            document.getElementById('edit-cat-long').value = cleanName;

            // Popola icona e nome breve separati
            const { icon: shortIcon, text: shortText } = splitShortName(s || cleanName);
            document.getElementById('edit-cat-icon').value = shortIcon;
            document.getElementById('edit-cat-short').value = shortText;

            document.getElementById('edit-cat-modal').classList.remove('hidden');
        };

        window.closeEditModal = () => { document.getElementById('edit-cat-modal').classList.add('hidden'); };

        window.saveEditCategory = async () => {
            const id = currentEditingCatId;
            const tag = document.getElementById('edit-cat-tag').value;        // es. "[SOP]"
            const cleanLong = document.getElementById('edit-cat-long').value.trim();
            const icon = document.getElementById('edit-cat-icon').value.trim();
            const shortText = document.getElementById('edit-cat-short').value.trim();

            if (!cleanLong) { tg.showAlert("Il nome completo è obbligatorio."); return; }

            // Ricompone nome completo: [TAG] + nome pulito
            const name = tag ? `${tag} ${cleanLong}` : cleanLong;
            // Ricompone short_name: icona + nome breve
            const short_name = icon ? `${icon} ${shortText || cleanLong}` : (shortText || cleanLong);

            playTick(800, 0.03, 0.05);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "update_category", _auth: tg.initData, ash: ash, msg: msg, category_id: id, name, short_name })
                });
                if (res.ok) {
                    closeEditModal();
                    loadCatalog(true);
                }
            } catch (e) { console.error(e); }
        };

        let currentEditingProduct = null;
        function splitShortName(shortName) {
            if (!shortName) return { icon: '', text: '' };
            const match = shortName.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
            const icon = match ? match[1] : '';
            const text = match ? match[2] : shortName;
            return { icon, text: text.trim() };
        }

        window.openEditProductModal = (prod) => {
            currentEditingProduct = prod;
            const { icon, text } = splitShortName(prod.short_name || prod.name || '');
            document.getElementById('edit-prod-icon').value = icon;
            document.getElementById('edit-prod-text').value = text;
            document.getElementById('edit-prod-modal').classList.remove('hidden');
        };

        window.closeEditProdModal = () => {
            document.getElementById('edit-prod-modal').classList.add('hidden');
            currentEditingProduct = null;
        };


        let currentEmojiTarget = 'prod'; // 'prod' | 'cat'

        window.setPresetEmoji = (emoji) => {
            playTick(700, 0.02, 0.04);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
            const fieldId = currentEmojiTarget === 'cat' ? 'edit-cat-icon' : 'edit-prod-icon';
            document.getElementById(fieldId).value = emoji;
        };


        let isEmojiPickerScriptLoaded = false;
        window.openEmojiPickerDrawer = (target) => {
            currentEmojiTarget = target || 'prod';
            const drawer = document.getElementById('emoji-picker-drawer');
            drawer.classList.remove('hidden');
            setTimeout(() => drawer.classList.remove('translate-y-full'), 10);

            if (isEmojiPickerScriptLoaded) {
                renderEmojiPicker();
            } else {
                document.getElementById('emoji-picker-loader').classList.remove('hidden');
                const script = document.createElement('script');
                script.type = 'module';
                script.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@1/index.js';
                script.onload = () => {
                    isEmojiPickerScriptLoaded = true;
                    renderEmojiPicker();
                };
                document.head.appendChild(script);
            }
        };

        window.closeEmojiPickerDrawer = () => {
            const drawer = document.getElementById('emoji-picker-drawer');
            drawer.classList.add('translate-y-full');
            setTimeout(() => drawer.classList.add('hidden'), 300);
        };

        function renderEmojiPicker() {
            document.getElementById('emoji-picker-loader').classList.add('hidden');
            const container = document.getElementById('emoji-picker-container');
            container.innerHTML = '';
            const picker = document.createElement('emoji-picker');
            picker.style.width = '100%';
            picker.style.height = '320px';
            picker.addEventListener('emoji-click', event => {
                playTick(850, 0.02, 0.05);
                if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                const fieldId = currentEmojiTarget === 'cat' ? 'edit-cat-icon' : 'edit-prod-icon';
                document.getElementById(fieldId).value = event.detail.unicode;
                closeEmojiPickerDrawer();
            });
            container.appendChild(picker);
        }

        window.saveEditProduct = async () => {
            if (!currentEditingProduct) return;
            const icon = document.getElementById('edit-prod-icon').value.trim();
            const text = document.getElementById('edit-prod-text').value.trim();
            if (!text) { alert("Testo richiesto"); return; }
            const combinedShortName = icon ? `${icon} ${text}` : text;
            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "update_product",
                        _auth: tg.initData,
                        ash: ash,
                        msg: msg,
                        product_id: currentEditingProduct.callback_data,
                        name: currentEditingProduct.name,
                        short_name: combinedShortName
                    })
                });
                if (res.ok) {
                    closeEditProdModal();
                    loadCatalog(true);
                }
            } catch (e) { console.error(e); }
        };

        window.deleteCategory = (id, name) => {
            tg.showConfirm(`Eliminare categoria ${name}?`, async ok => {
                if (ok) {
                    try {
                        await fetch(WEBHOOK_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "delete_category", _auth: tg.initData, ash: ash, msg: msg, category_id: id })
                        });
                        loadCatalog(true);
                    } catch (e) { console.error(e); }
                }
            });
        };

        window.deleteProduct = (id, name) => {
            tg.showConfirm(`Eliminare prodotto ${name}?`, async ok => {
                if (ok) {
                    try {
                        await fetch(WEBHOOK_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "delete_product", _auth: tg.initData, ash: ash, msg: msg, product_id: id })
                        });
                        loadCatalog(true);
                    } catch (e) { console.error(e); }
                }
            });
        };

        // Social Hub functions (openSocialViewer, closeSocialViewer, savePrompts, generateImage, generateVideo)
        // have been migrated to gestione/edit-post.html (standalone page).
        // catalog.html now calls: launchSubEditor('edit-post.html')


        // ─── FLOATING BUTTON HANDLERS (ASSISTENTE & CAMBIA VISTA) ──────
        function handleVoiceAgentClick() {
            playTick(900, 0.04, 0.06);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            location.href = `assistente.html?ash=${ash}&msg=${msg || ''}`;
        }

        function setViewModePreference(mode) {
            try {
                document.cookie = `sitebos_view_mode=${mode}; max-age=31536000; path=/; SameSite=Lax`;
                localStorage.setItem('sitebos_view_mode', mode);
            } catch(e) {}
        }

        function getViewModePreference() {
            try {
                const match = document.cookie.match(/(?:^|; )sitebos_view_mode=([^;]*)/);
                if (match && match[1]) return match[1];
                const ls = localStorage.getItem('sitebos_view_mode');
                if (ls) return ls;
            } catch(e) {}
            return '3d';
        }

        let isFlatListView = false;
        function handleQuickListClick() {
            playTick(850, 0.03, 0.05);
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

            isFlatListView = !isFlatListView;
            setViewModePreference(isFlatListView ? 'flat' : '3d');

            const stackContainer = document.getElementById('stack-container');
            const flatContainer = document.getElementById('flat-list-container');
            const icon = document.getElementById('btn-quick-list-icon');
            const labelText = document.getElementById('tooltip-wave-list-text');

            const btnUp = document.getElementById('btn-nav-up');
            const btnDown = document.getElementById('btn-nav-down');
            const tipUp = document.getElementById('tooltip-wave-up');
            const tipDown = document.getElementById('tooltip-wave-down');
            const mainActionBtn = document.getElementById('main-action-btn');
            const helpBtn = document.getElementById('btn-help-gesture');
            const helpTip = document.getElementById('tooltip-wave-help');

            if (isFlatListView) {
                stackContainer.classList.add('hidden');
                flatContainer.classList.remove('hidden');
                flatContainer.classList.add('flex');
                if (btnUp) btnUp.classList.add('hidden');
                if (btnDown) btnDown.classList.add('hidden');
                if (tipUp) tipUp.classList.add('hidden');
                if (tipDown) tipDown.classList.add('hidden');
                if (helpBtn) helpBtn.classList.add('hidden');
                if (helpTip) helpTip.classList.add('hidden');
                if (mainActionBtn) mainActionBtn.classList.add('hidden');
                if (icon) icon.className = "fas fa-cubes text-[11px]";
                if (labelText) labelText.innerText = "Vista 3D";
                updateStackLayout();
                renderFlatList();
            } else {
                flatContainer.classList.add('hidden');
                flatContainer.classList.remove('flex');
                stackContainer.classList.remove('hidden');
                if (btnUp) btnUp.classList.remove('hidden');
                if (btnDown) btnDown.classList.remove('hidden');
                if (tipUp) tipUp.classList.remove('hidden');
                if (tipDown) tipDown.classList.remove('hidden');
                if (helpBtn) helpBtn.classList.remove('hidden');
                if (helpTip) helpTip.classList.remove('hidden');
                if (mainActionBtn && currentViewLevel !== 'actions') mainActionBtn.classList.remove('hidden');
                if (icon) icon.className = "fas fa-layer-group text-[11px]";
                if (labelText) labelText.innerText = "Cambia Vista";
                updateStackLayout();
            }
        }

        function renderFlatList() {
            const flatContainer = document.getElementById('flat-list-container');
            if (!flatContainer) return;
            flatContainer.innerHTML = '';
            modules.forEach((mod, idx) => {
                const item = document.createElement('div');
                // Tutti i bottoni centrali uguali ed omogenei (senza evidenziatori ring-1)
                item.className = "bg-white border border-slate-200 rounded-xl py-2 px-3.5 flex items-center justify-between cursor-pointer hover:border-slate-400 transition shadow-xs select-none";
                item.innerHTML = `
                    <div class="flex items-center gap-2.5 overflow-hidden">
                        <span class="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-700 shrink-0">${idx + 1}</span>
                        <span class="text-[11px] font-black uppercase text-slate-900 truncate">${cleanLabel(mod.short_name || mod.name || mod.label)}</span>
                    </div>
                    <i class="fas fa-chevron-right text-[9px] text-slate-400 shrink-0"></i>
                `;
                item.onclick = () => {
                    selectIdx(idx);
                    handleActiveCardClick();
                };
                flatContainer.appendChild(item);
            });
        }

        // ─── LED TYPEWRITER STRIP ENGINE & TOOLTIP WAVE ─────────────────
        let isTooltipWaveActive = false;
        let waveScanInterval = null;
        let waveScanIdx = 0;

        const STRIP_DEFS = [
            { id: 'swipe-strip-led', text: '↑ SWIPE ↑ SU ↑ PRECEDENTE ↑'          },
            { id: 'swipe-strip-led', text: '→ SWIPE → DESTRA → ENTRA / APRI →'     },
            { id: 'swipe-strip-led', text: '↓ SWIPE ↓ GIÙ ↓ SUCCESSIVO ↓'        },
            { id: 'swipe-strip-led', text: '← SWIPE ← SINISTRA ← TORNA / ESCI ←'   },
        ];

        const STRIP_CHAR_MS   = 110;
        const STRIP_GLOW_MS   = 1200;
        const STRIP_SWEEP_MS  = 45;
        const STRIP_FADE_MS   = 600;

        let stripCycleTimer = null;
        let stripCycleIdx   = 0;
        let isStripActive   = false;

        function clearStripEl(id) {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        }

        function runStripAnim(def, onDone) {
            const container = document.getElementById(def.id);
            if (!container) { onDone && onDone(); return; }
            container.innerHTML = '';

            const chars = def.text.split('');
            const spans = chars.map(ch => {
                const s = document.createElement('span');
                if (ch === '↑') {
                    s.innerHTML = '<i class="fas fa-arrow-up text-[9px] mx-0.5"></i>';
                } else if (ch === '→') {
                    s.innerHTML = '<i class="fas fa-arrow-right text-[9px] mx-0.5"></i>';
                } else if (ch === '↓') {
                    s.innerHTML = '<i class="fas fa-arrow-down text-[9px] mx-0.5"></i>';
                } else if (ch === '←') {
                    s.innerHTML = '<i class="fas fa-arrow-left text-[9px] mx-0.5"></i>';
                } else {
                    s.textContent = ch;
                }
                s.style.cssText = 'opacity:0; color:#94a3b8; font-size:9px; font-weight:600; letter-spacing:0.04em; transition:opacity 0.25s, color 0.35s;';
                container.appendChild(s);
                return s;
            });

            let ci = 0;
            function typeNext() {
                if (!isStripActive) return;
                if (ci < spans.length) {
                    spans[ci].style.opacity = '0.45';
                    ci++;
                    stripCycleTimer = setTimeout(typeNext, STRIP_CHAR_MS);
                } else {
                    stripCycleTimer = setTimeout(() => {
                        if (!isStripActive) return;
                        spans.forEach((s, i) => {
                            setTimeout(() => {
                                if (!isStripActive) return;
                                s.style.opacity = '1';
                                s.style.color   = '#334155';
                            }, i * STRIP_SWEEP_MS);
                        });
                        const holdDelay = spans.length * STRIP_SWEEP_MS + STRIP_GLOW_MS;
                        stripCycleTimer = setTimeout(() => {
                            if (!isStripActive) return;
                            spans.forEach(s => { s.style.opacity = '0'; });
                            stripCycleTimer = setTimeout(() => {
                                clearStripEl(def.id);
                                onDone && onDone();
                            }, 450);
                        }, holdDelay);
                    }, 250);
                }
            }
            typeNext();
        }

        function runNextStrip() {
            if (!isStripActive) return;
            const def = STRIP_DEFS[stripCycleIdx];
            runStripAnim(def, () => {
                if (!isStripActive) return;
                stripCycleIdx = (stripCycleIdx + 1) % STRIP_DEFS.length;
                stripCycleTimer = setTimeout(runNextStrip, STRIP_FADE_MS);
            });
        }

        function startStripCycle() {
            if (isStripActive) return;
            isStripActive  = true;
            stripCycleIdx  = 0;
            runNextStrip();
        }

        function stopStripCycle() {
            isStripActive = false;
            clearTimeout(stripCycleTimer);
            STRIP_DEFS.forEach(d => clearStripEl(d.id));
        }

        let wavePairs = [];

        function initWavePairs() {
            wavePairs = [
                { btn: document.getElementById('btn-nav-up'),      tip: document.getElementById('tooltip-wave-up') },
                { btn: document.getElementById('btn-nav-down'),    tip: document.getElementById('tooltip-wave-down') },
                { btn: document.getElementById('btn-nav-back'),    tip: document.getElementById('tooltip-wave-back') },
                { btn: document.getElementById('btn-nav-guide'),   tip: document.getElementById('tooltip-wave-guide') },
                { btn: document.getElementById('btn-nav-audio'),   tip: document.getElementById('tooltip-wave-audio') },
                { btn: document.getElementById('btn-help-gesture'),tip: document.getElementById('tooltip-wave-help') },
                { btn: document.getElementById('btn-voice-agent'), tip: document.getElementById('tooltip-wave-bot') },
                { btn: document.getElementById('btn-quick-list'),  tip: document.getElementById('tooltip-wave-list') }
            ].filter(p => p.btn && p.tip);
        }

        function setPairHighlight(pair, active) {
            if (!pair) return;
            if (pair.btn) {
                if (active) {
                    pair.btn.classList.add('ring-1', 'ring-sky-400/50');
                    pair.btn.style.boxShadow = '0 0 8px rgba(56, 189, 248, 0.4)';
                } else {
                    pair.btn.classList.remove('ring-1', 'ring-sky-400/50');
                    pair.btn.style.boxShadow = '';
                }
            }
            if (pair.tip) {
                if (active) {
                    pair.tip.classList.remove('opacity-0');
                    pair.tip.classList.add('opacity-100');
                } else {
                    pair.tip.classList.remove('opacity-100');
                    pair.tip.classList.add('opacity-0');
                }
            }
        }

        window.toggleHelpModal = function(forceShow) {
            initWavePairs();
            const modal = document.getElementById('help-overlay');
            if (modal) {
                if (forceShow) {
                    modal.classList.remove('hidden');
                    setTimeout(() => { modal.classList.remove('opacity-0'); }, 10);
                } else {
                    modal.classList.add('opacity-0');
                    setTimeout(() => { modal.classList.add('hidden'); }, 300);
                }
            }
            isTooltipWaveActive = (typeof forceShow === 'boolean') ? forceShow : !isTooltipWaveActive;
            if (isTooltipWaveActive) {
                waveScanIdx = 0;
                setPairHighlight(wavePairs[0], true);
                startStripCycle();
                clearInterval(waveScanInterval);
                waveScanInterval = setInterval(() => {
                    wavePairs.forEach(p => setPairHighlight(p, false));
                    waveScanIdx = (waveScanIdx + 1) % wavePairs.length;
                    setPairHighlight(wavePairs[waveScanIdx], true);
                }, 2200);
            } else {
                clearInterval(waveScanInterval);
                stopStripCycle();
                wavePairs.forEach(p => setPairHighlight(p, false));
            }
        };

        // ─── ATTRACT MODE (AUTO-SCROLL CALMO DOPO 5S IDLE) ──────────────
        let attractModeTimer = null;
        let attractStepTimer = null;
        let isAttractActive  = false;

        function resetAttractTimer() {
            stopAttractMode();
        }

        function startAttractMode() {
            return; // Auto-spin completamente disattivato
        }

        function stopAttractMode() {
            isAttractActive = false;
            if (attractModeTimer) clearTimeout(attractModeTimer);
            if (attractStepTimer) clearTimeout(attractStepTimer);
        }

        ['touchstart', 'click', 'keydown', 'wheel'].forEach(evt => {
            window.addEventListener(evt, resetAttractTimer, { passive: true });
        });

        setTimeout(resetAttractTimer, 2000);

        window.copyToClipboard = (elementId) => {
            const el = document.getElementById(elementId);
            const text = el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' ? el.value : el.innerText;
            navigator.clipboard.writeText(text).then(() => {
                tg.showAlert("Copiato negli appunti!");
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            });
        };

        if (!ash) {
            document.getElementById('loader').innerHTML = `<div class="font-black text-red-500">ASH MISSING</div>`;
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                loadCatalog();
                const savedViewMode = getViewModePreference();
                if (savedViewMode === 'flat' && !isFlatListView) {
                    handleQuickListClick();
                }
                const flatEl = document.getElementById('flat-list-container');
                if (flatEl) {
                    flatEl.addEventListener('scroll', () => {
                        if (!isFlatListView || !modules || modules.length === 0) return;
                        const maxScroll = flatEl.scrollHeight - flatEl.clientHeight;
                        if (maxScroll <= 0) return;
                        const scrollRatio = flatEl.scrollTop / maxScroll;
                        const targetIdx = Math.min(modules.length - 1, Math.floor(scrollRatio * modules.length));
                        if (targetIdx !== activeIdx) {
                            activeIdx = targetIdx;
                            updateStackLayout();
                        }
                    }, { passive: true });
                }
            });
        }
