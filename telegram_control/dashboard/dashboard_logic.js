        'use strict';
        const tg = window.Telegram?.WebApp;
        if (tg) {
            if (typeof tg.exitFullscreen === 'function') {
                try { tg.exitFullscreen(); } catch (_) {}
            }
            if (typeof tg.ready === 'function') tg.ready();
            if (typeof tg.expand === 'function') tg.expand();
        }

        // Disabilita lo swipe verticale nativo di Telegram per prevenire la chiusura accidentale dell'app
        if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
        if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

        // Color override to match platform light scheme
        if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#ffffff');

        // Action apertura Shop Bundles crediti
        window.openBundlesShop = function () {
            playMechanicalTick();
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            const shopUrl = 'https://dashboard.trinai.it/shop/bundles';
            if (tg && tg.openLink) {
                tg.openLink(shopUrl);
            } else {
                window.open(shopUrl, '_blank');
            }
        };


        // Logica Speech Audio Guide (Play / Stop)
        let dashboardAudio = null;
        let isAudioPlaying = false;

        function getDashboardAudioFile() {
            if (currentMenuLevel === 'main') {
                return 'dashboard.wav';
            }
            const parentMod = mainModules[parentActiveIdx];
            if (parentMod) {
                if (parentMod.id === 'identity_hub') {
                    return 'identity.wav';
                }
            }
            return 'dashboard.wav';
        }

        window.stopDashboardAudio = function () {
            if (isAudioPlaying && dashboardAudio) {
                dashboardAudio.pause();
                dashboardAudio.currentTime = 0;
            }
            isAudioPlaying = false;
            dashboardAudio = null;
            const btn = document.getElementById('btn-nav-audio');
            const icon = btn ? btn.querySelector('i') : null;
            if (icon) {
                icon.className = 'fas fa-volume-high text-[10px]';
            }
            if (btn) {
                btn.classList.remove('bg-slate-900/10', 'text-slate-900');
            }
        };

        window.openUserGuide = function (url) {
            const overlay = document.getElementById('userguide-drawer-overlay');
            const drawer = document.getElementById('userguide-drawer');
            const iframe = document.getElementById('userguide-iframe');
            if (!overlay || !drawer || !iframe) return;

            window.stopDashboardAudio();

            iframe.src = url;
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                drawer.classList.remove('translate-y-full');
            }, 10);
        };

        window.closeUserGuide = function () {
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

        window.toggleDashboardAudio = function () {
            const btn = document.getElementById('btn-nav-audio');
            const icon = btn ? btn.querySelector('i') : null;

            if (!dashboardAudio) {
                const audioFile = getDashboardAudioFile();
                dashboardAudio = new Audio(audioFile);
                dashboardAudio.addEventListener('ended', () => {
                    isAudioPlaying = false;
                    dashboardAudio.currentTime = 0;
                    if (icon) {
                        icon.className = 'fas fa-volume-high text-[10px]';
                        btn.classList.remove('bg-slate-900/10', 'text-slate-900');
                    }
                });
            }

            if (isAudioPlaying) {
                dashboardAudio.pause();
                dashboardAudio.currentTime = 0; // Ripristina all'inizio (Comportamento Stop)
                isAudioPlaying = false;
                if (icon) {
                    icon.className = 'fas fa-volume-high text-[10px]';
                    btn.classList.remove('bg-slate-900/10', 'text-slate-900');
                }
            } else {
                dashboardAudio.play().then(() => {
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

        // Admin allowlist logic
        const ADMIN_IDS = ["2041408875", "8305126267"];
        const userId = tg.initDataUnsafe?.user?.id ? tg.initDataUnsafe.user.id.toString() : "2041408875";
        const isAdmin = ADMIN_IDS.includes(userId);

        const adminBtn = document.getElementById('admin-panel-btn');
        if (isAdmin) {
            if (adminBtn) adminBtn.classList.remove('hidden');
            const roleEl = document.getElementById('user-role');
            if (roleEl) roleEl.innerText = "ADMINISTRATOR MODE";
        }

        // Voice Command Agent overlay logic & Webhook Integration (assistant.json: 81ab5292-43c3-4f93-afaf-7411b95fc010)
        let mediaRecorder = null;
        let audioChunks = [];
        let isRecording = false;
        let voiceCountdownTimer = null;

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
            return sessionStorage.getItem('dashboardViewMode') || '3d';
        }

        // Persistent View Mode Toggle (3D Mode / Flat List Mode)
        let dashboardViewMode = getViewModePreference();

        window.handleQuickListClick = function () {
            playMechanicalTick();
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            // Alterna la modalità di vista
            dashboardViewMode = (dashboardViewMode === '3d') ? 'flat' : '3d';
            setViewModePreference(dashboardViewMode);
            sessionStorage.setItem('dashboardViewMode', dashboardViewMode);
            applyViewMode();
        };

        function applyViewMode() {
            const stackEl = document.getElementById('stack-container');
            const flatEl = document.getElementById('flat-list-container');
            const navUp = document.getElementById('btn-nav-up');
            const navDown = document.getElementById('btn-nav-down');
            const dotWrapper = document.getElementById('dot-indicators-wrapper');
            const quickBtn = document.getElementById('btn-quick-list');
            const quickIcon = document.getElementById('btn-quick-list-icon');
            const helpBtn = document.getElementById('btn-help-gesture');
            const helpTip = document.getElementById('tooltip-wave-help');
            const tipUp = document.getElementById('tooltip-wave-up');
            const tipDown = document.getElementById('tooltip-wave-down');

            if (dashboardViewMode === 'flat') {
                if (stackEl) stackEl.classList.add('hidden');
                if (navUp) navUp.classList.add('hidden');
                if (navDown) navDown.classList.add('hidden');
                if (dotWrapper) dotWrapper.classList.add('hidden');
                if (helpBtn) helpBtn.classList.add('hidden');
                if (helpTip) helpTip.classList.add('hidden');
                if (tipUp) tipUp.classList.add('hidden');
                if (tipDown) tipDown.classList.add('hidden');

                if (flatEl) {
                    flatEl.classList.remove('hidden');
                    flatEl.classList.add('flex');
                    renderFlatList();
                }

                if (quickBtn) {
                    quickBtn.className = "btn-glass-minimal absolute -right-2 z-50 w-9 h-9 rounded-full flex items-center justify-center text-blue-600 border border-blue-300 bg-blue-50/80 shadow-xs";
                    quickBtn.title = "Passa a Vista 3D";
                }
                if (quickIcon) {
                    quickIcon.className = "fas fa-cubes text-[11px] text-blue-600";
                }
            } else {
                if (stackEl) stackEl.classList.remove('hidden');
                if (navUp) navUp.classList.remove('hidden');
                if (navDown) navDown.classList.remove('hidden');
                if (dotWrapper) dotWrapper.classList.remove('hidden');
                if (helpBtn) helpBtn.classList.remove('hidden');
                if (helpTip) helpTip.classList.remove('hidden');
                if (tipUp) tipUp.classList.remove('hidden');
                if (tipDown) tipDown.classList.remove('hidden');

                if (flatEl) {
                    flatEl.classList.add('hidden');
                    flatEl.classList.remove('flex');
                }

                if (quickBtn) {
                    quickBtn.className = "btn-glass-minimal absolute -right-2 z-50 w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:text-slate-900";
                    quickBtn.title = "Passa a Vista Lista Flat";
                }
                if (quickIcon) {
                    quickIcon.className = "fas fa-layer-group text-[11px] text-slate-700";
                }
            }
        }

        function renderFlatList() {
            const flatEl = document.getElementById('flat-list-container');
            if (!flatEl) return;

            flatEl.innerHTML = "";

            const currentList = modules || mainModules;
            currentList.forEach((mod, idx) => {
                const btn = document.createElement('button');

                // Tutti i bottoni centrali perfettamente uguali ed omogenei (senza evidenziatori azzurri)
                btn.className = "w-full p-3 bg-white/90 hover:bg-slate-50 border border-slate-200/90 rounded-2xl shadow-xs text-left flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer group shrink-0";
                btn.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-8.5 h-8.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-xs shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <i class="fas ${mod.icon}"></i>
                        </div>
                        <div class="overflow-hidden">
                            <h4 class="text-xs font-black uppercase tracking-tight text-slate-900 truncate">${mod.label}</h4>
                            <p class="text-[9px] font-semibold text-slate-500 truncate mt-0.5">${mod.desc || ''}</p>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right text-xs text-slate-400 group-hover:text-slate-900 shrink-0 ml-2"></i>
                `;

                btn.onclick = (e) => {
                    e.stopPropagation();
                    playMechanicalTick();
                    selectIdx(idx);
                    if (mod.sub) {
                        openModule(mod.id, mod.url);
                    } else if (mod.url && mod.url !== '#') {
                        openModule(mod.id, mod.url);
                    }
                };

                flatEl.appendChild(btn);
            });
        }

        window.handleVoiceAgentClick = function () {
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
            playMechanicalTick();
            toggleVoiceAgentOverlay(true);
        };

        window.openAssistantTarget = function (targetUrl, name, icon) {
            if (window.DesktopWhiteboard && typeof window.DesktopWhiteboard.handleTileClick === 'function') {
                window.DesktopWhiteboard.handleTileClick(targetUrl, name || 'Modulo', icon || 'fas fa-arrow-right');
            } else {
                const cleanPath = targetUrl.replace(/^\.\.\//, '');
                const p = cleanPath.includes('?') ? '&' : '?';
                window.location.href = `../${cleanPath}${ash ? p + 'ash=' + encodeURIComponent(ash) : ''}`;
            }
        };

        window.openUserGuide = function (targetUrl) {
            const url = targetUrl || '../userguide/01b_desktop_dashboard.html';
            if (window.DesktopWhiteboard && typeof window.DesktopWhiteboard.handleTileClick === 'function') {
                window.DesktopWhiteboard.handleTileClick(url, 'Manuale Utente Desktop', 'fa-globe');
            } else {
                const cleanPath = url.replace(/^\.\.\//, '');
                const p = cleanPath.includes('?') ? '&' : '?';
                window.location.href = `../${cleanPath}${ash ? p + 'ash=' + encodeURIComponent(ash) : ''}`;
            }
        };

        window.toggleVoiceAgentOverlay = function (show) {
            const overlay = document.getElementById('voice-agent-overlay');
            if (!overlay) return;
            if (show) {
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    overlay.classList.remove('opacity-0');
                    const content = overlay.querySelector('.voice-modal-content');
                    if (content) content.classList.remove('scale-95');
                }, 10);

                // 3 Scorciatoie Iniziali di Default (Stato a freddo)
                renderVoiceActions([
                    { label: "📦 Catalogo Master", action: () => openAssistantTarget('gestione/catalog.html', 'Catalogo Master', 'fa-store'), badge: "Naviga" },
                    { label: "🛡️ Assistente Sicurezza", action: () => openAssistantTarget('agents/assistente-sicurezza.html', 'Assistente Sicurezza', 'fa-shield-halved'), badge: "DVR AI" },
                    { label: "⚡ Piattaforma Cloud", action: () => openAssistantTarget('https://dashboard.trinai.it', 'TrinAi Cloud', 'fa-cloud'), badge: "Cloud" }
                ]);
            } else {
                stopVoiceRecording();
                if (voiceCountdownTimer) clearTimeout(voiceCountdownTimer);
                overlay.classList.add('opacity-0');
                const content = overlay.querySelector('.voice-modal-content');
                if (content) content.classList.add('scale-95');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
        };

        window.toggleVoiceRecording = function () {
            if (isRecording) {
                stopVoiceRecording();
            } else {
                startVoiceRecording();
            }
        };

        async function startVoiceRecording() {
            audioChunks = [];
            const orbPulse = document.getElementById('voice-orb-pulse');
            const orbIcon = document.getElementById('voice-orb-icon');
            const statusText = document.getElementById('voice-status-text');
            const optionText = document.getElementById('voice-option-text');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
                mediaRecorder.onstop = processVoiceAudioData;
                mediaRecorder.start();
                isRecording = true;

                if (orbPulse) orbPulse.classList.remove('hidden');
                if (orbIcon) orbIcon.className = "fas fa-stop text-red-500 animate-pulse";
                if (optionText) optionText.innerText = "Premi per inviare vocale";
                if (statusText) statusText.innerText = "Ascolto in corso... Parla ora";
                if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            } catch (err) {
                console.warn("Microfono non disponibile o permesso negato:", err);
                if (statusText) statusText.innerText = "Utilizza la ricerca testuale qui sopra";
            }
        }

        function stopVoiceRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                const orbPulse = document.getElementById('voice-orb-pulse');
                const orbIcon = document.getElementById('voice-orb-icon');
                const statusText = document.getElementById('voice-status-text');
                const optionText = document.getElementById('voice-option-text');
                if (orbPulse) orbPulse.classList.add('hidden');
                if (orbIcon) orbIcon.className = "fas fa-spinner fa-spin text-slate-700";
                if (optionText) optionText.innerText = "Elaborazione Vocale in corso...";
                if (statusText) statusText.innerText = "Elaborazione intelligenza AI...";
            }
        }

        function processVoiceAudioData() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = function () {
                const base64Audio = reader.result.split(',')[1];
                sendAudioToVoiceAssistant(base64Audio, "");
            };
        }

        window.submitVoiceTextFallback = function () {
            const input = document.getElementById('voice-input-fallback');
            if (!input || !input.value.trim()) return;
            const text = input.value.trim();
            input.value = "";
            sendAudioToVoiceAssistant("", text);
        };

        async function sendAudioToVoiceAssistant(base64Audio, textFallback) {
            const statusText = document.getElementById('voice-status-text');
            const transcriptText = document.getElementById('voice-transcript-text');
            if (statusText) statusText.innerText = "Analisi intenzione in corso...";
            if (transcriptText) transcriptText.innerText = `"${textFallback || 'Elaborazione traccia vocale...'}"`;

            const dynamicOwnerPages = window.getOwnerPagesRegistry ? window.getOwnerPagesRegistry() : [];
            const WH_URL = "https://prod.workflow.trinai.it/webhook/81ab5292-43c3-4f93-afaf-7411b95fc010";

            try {
                const response = await fetch(WH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        _auth: tg.initData || "",
                        ash: ash || "",
                        msg: msgId || "",
                        data: base64Audio || "",
                        text: textFallback || "",
                        owner_pages: dynamicOwnerPages,
                        minetype: "audio/webm;codecs=opus",
                        action: "voice_command"
                    })
                });

                const result = await response.json();

                // Passaggio diretto dell'oggetto/array senza blocchi condizionali che attivano il fallback locale
                handleVoiceAssistantResult(result, textFallback);

            } catch (err) {
                console.error("Errore Webhook Voice Assistant:", err);
                matchLocalSemanticIntent(textFallback || "catalogo");
            }
        }

        window.openModule = function (modId, targetUrl) {
            navigateOwnerUrl(targetUrl, modId);
        };

        window.isMobileDevice = function() {
            const tg = window.Telegram?.WebApp || window.parent?.Telegram?.WebApp;
            const platform = (tg?.platform || '').toLowerCase();
            if (['android', 'ios', 'mobile'].includes(platform)) return true;
            if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(platform)) return false;

            const ua = (navigator.userAgent || '').toLowerCase();
            if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return true;
            return (window.innerWidth < 768) || (window.screen.width < 768);
        };

        window.navigateOwnerUrl = function (targetUrl, modId) {
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            // ── DESKTOP: Apertura Diretta ──────────────────────────────────────────
            // Su PC Desktop ogni tasto apre DIRETTAMENTE la pagina specifica.
            // NESSUN menu intermedio. Il bottoncione IS il launcher, non un router.
            if (!window.isMobileDevice()) {
                const lowerTarget = (targetUrl || '').toLowerCase();

                // Caso speciale: Catalogo → overlay dati (non iframe)
                if (lowerTarget.includes('catalog')) {
                    let macro = 'SOP';
                    if (lowerTarget.includes('macro=ser')) macro = 'SER';
                    if (lowerTarget.includes('macro=pro')) macro = 'PRO';
                    if (window.DesktopCatalogOverlay) {
                        window.DesktopCatalogOverlay.open(macro);
                        return;
                    }
                }

                // Tutte le altre pagine → iframe flottante diretto
                const cleanPath = (targetUrl || '').replace(/^\.\.\//, '');
                const hasQuery = cleanPath.includes('?');
                const pChar = hasQuery ? '&' : '?';
                let finalUrl = `../${cleanPath}`;
                if (ash && !finalUrl.includes('ash=')) finalUrl += `${pChar}ash=${encodeURIComponent(ash)}`;
                if (msgId && !finalUrl.includes('msg=')) {
                    const p2 = finalUrl.includes('?') ? '&' : '?';
                    finalUrl += `${p2}msg=${encodeURIComponent(msgId)}`;
                }

                if (window.DesktopWindowManager && targetUrl && targetUrl !== '#') {
                    const lowerUrl = (finalUrl || '').toLowerCase();
                    const isWideTool = lowerUrl.includes('trinai');
                    const winWidth = isWideTool ? 960 : 460;
                    const winHeight = isWideTool ? 720 : 780;

                    window.DesktopWindowManager.openWindow({
                        title: modId || 'Modulo SiteBoS',
                        url: finalUrl,
                        icon: 'fas fa-mobile-screen-button',
                        width: winWidth,
                        height: winHeight
                    });
                    return;
                }
            }

            // ── MOBILE: sottomenu 3D nativo (es. operativita, identity_hub) ─────────
            const searchId = modId || targetUrl;
            const targetModIdx = mainModules.findIndex(m => m.id === searchId || m.url === targetUrl);

            if (targetModIdx !== -1 && mainModules[targetModIdx].sub) {
                const selectedMod = mainModules[targetModIdx];
                window.stopDashboardAudio();
                parentActiveIdx = targetModIdx;
                modules = selectedMod.sub;
                currentMenuLevel = 'sub';
                activeIdx = 0;

                const submenuHeader = document.getElementById('submenu-header');
                const submenuTitle = document.getElementById('submenu-title');
                const submenuIcon = document.getElementById('submenu-icon');
                if (submenuHeader && submenuTitle && submenuIcon) {
                    submenuTitle.innerText = selectedMod.label;
                    submenuIcon.className = `fas ${selectedMod.icon || 'fa-folder-open'} text-sm`;
                    submenuHeader.classList.remove('hidden');
                }

                if (tg && tg.BackButton) {
                    tg.BackButton.show();
                    tg.BackButton.onClick(handleTelegramBack);
                }

                buildStack();
                playMechanicalTick();
                return;
            }

            // ── Link Esterni ────────────────────────────────────────────────────────
            if (!targetUrl || targetUrl === '#') return;
            if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                if (tg && tg.openLink) {
                    tg.openLink(targetUrl);
                } else {
                    window.open(targetUrl, '_blank');
                }
                return;
            }

            // ── Fallback Mobile: Navigazione Normale ────────────────────────────────
            const cleanPath = targetUrl.replace(/^\.\.\//, '');
            const hasQuery = cleanPath.includes('?');
            const pChar = hasQuery ? '&' : '?';
            let finalUrl = `../${cleanPath}`;
            if (ash && !finalUrl.includes('ash=')) finalUrl += `${pChar}ash=${encodeURIComponent(ash)}`;
            if (msgId && !finalUrl.includes('msg=')) {
                const p2 = finalUrl.includes('?') ? '&' : '?';
                finalUrl += `${p2}msg=${encodeURIComponent(msgId)}`;
            }
            window.location.href = finalUrl;
        };

        function matchLocalSemanticIntent(query) {
            const q = query.toLowerCase();
            const statusText = document.getElementById('voice-status-text');
            const transcriptText = document.getElementById('voice-transcript-text');

            if (q.includes('prodotto') || q.includes('articolo') || q.includes('catalogo')) {
                if (statusText) statusText.innerText = "Trovato: Catalogo Prodotti";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Gestione Catalogo"`;
                renderVoiceActions([
                    { label: "📦 1. APRI CATALOGO", action: () => navigateOwnerUrl('gestione/catalog.html'), badge: "Naviga" },
                    { label: "➕ 2. NUOVO PRODOTTO", action: () => navigateOwnerUrl('gestione/add-product.html'), badge: "Azione" },
                    { label: "📋 3. NUOVA CATEGORIA", action: () => navigateOwnerUrl('gestione/add-category.html'), badge: "Azione" }
                ]);
            } else if (q.includes('agenda') || q.includes('appuntamento') || q.includes('orari')) {
                if (statusText) statusText.innerText = "Trovato: Agenda Aziendale";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Agenda & Calendario"`;
                renderVoiceActions([
                    { label: "📅 1. APRI AGENDA", action: () => navigateOwnerUrl('agents/agenda.html'), badge: "Naviga" },
                    { label: "🗓️ 2. PRENOTAZIONI LIVE", action: () => navigateOwnerUrl('agents/agenda.html'), badge: "Azione" }
                ]);
            } else if (q.includes('ordine') || q.includes('ordini') || q.includes('commessa') || q.includes('spedizione')) {
                if (statusText) statusText.innerText = "Trovato: Operatività Ordini";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Ordini & Delivery"`;
                renderVoiceActions([
                    { label: "📦 1. ORDINI LIVE", action: () => navigateOwnerUrl('operativita/orders-manager.html'), badge: "Naviga" },
                    { label: "⚙️ 2. PIANO LAVORI", action: () => navigateOwnerUrl('operativita/job-create.html'), badge: "Azione" },
                    { label: "🗺️ 3. LOGISTICA PERCORSI", action: () => navigateOwnerUrl('operativita/pianificazione_itinerari.html'), badge: "AI" }
                ]);
            } else if (q.includes('bot') || q.includes('titolare') || q.includes('azienda') || q.includes('iva')) {
                if (statusText) statusText.innerText = "Trovato: Configurazione Identity";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Identity & Bot Setup"`;
                renderVoiceActions([
                    { label: "⚙️ 1. SETUP BOT", action: () => navigateOwnerUrl('identity/bot_config.html'), badge: "Naviga" },
                    { label: "👤 2. DATI TITOLARE", action: () => navigateOwnerUrl('identity/edit_owner.html'), badge: "Azione" },
                    { label: "🏛️ 3. SETUP AVANZATO", action: () => navigateOwnerUrl('identity/advanced-setup.html'), badge: "Fiscal" }
                ]);
            } else if (q.includes('supporto') || q.includes('assistenza') || q.includes('help') || q.includes('ticket')) {
                if (statusText) statusText.innerText = "Trovato: Supporto & Ticket";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Supporto Tecnico & Bot"`;
                renderVoiceActions([
                    { label: "🎧 1. SUPPORT HUB", action: () => navigateOwnerUrl('supporto/support_hub.html'), badge: "Naviga" },
                    { label: "💬 2. BOT TELEGRAM (@TrinAi_Site_bot)", action: () => navigateOwnerUrl('https://t.me/TrinAi_Site_bot'), badge: "Direct" }
                ]);
            } else if (q.includes('crediti') || q.includes('saldo') || q.includes('ricarica')) {
                if (statusText) statusText.innerText = "Trovato: Saldo Crediti";
                if (transcriptText) transcriptText.innerText = `"Rilevata intenzione: Crediti & Billing"`;
                renderVoiceActions([
                    { label: "⚡ 1. RICARICA CREDITI", action: () => openBundlesShop(), badge: "Shop" },
                    { label: "📊 2. DETTAGLIO CONSUMI", action: () => openBundlesShop(), badge: "Info" }
                ]);
            } else if (q.includes('meteo') || q.includes('tempo') || q.includes('pioggia') || q.includes('sole') || q.includes('barzelletta')) {
                if (statusText) statusText.innerText = "Fuori Perimetro Operativo";
                if (transcriptText) transcriptText.innerText = `"Mi spiace, non posso aiutarti! Per il meteo o le chiacchiere chiedi a Gemini. Qui ci occupiamo di business e gestione aziendale!"`;
                renderVoiceActions([
                    { label: "📦 1. CATALOGO PRODOTTI", action: () => navigateOwnerUrl('gestione/catalog.html'), badge: "Business" },
                    { label: "📊 2. OPERATIVITÀ ORDINI", action: () => navigateOwnerUrl('operativita/orders-manager.html'), badge: "Business" },
                    { label: "⚙️ 3. CONFIGURAZIONE BOT", action: () => navigateOwnerUrl('identity/bot_config.html'), badge: "Setup" }
                ]);
            } else {
                if (statusText) statusText.innerText = "Come posso aiutarti?";
                if (transcriptText) transcriptText.innerText = `"${query}"`;
                renderVoiceActions([
                    { label: "📦 1. CATALOGO PRODOTTI", action: () => navigateOwnerUrl('gestione/catalog.html'), badge: "Naviga" },
                    { label: "📅 2. AGENDA AZIENDALE", action: () => navigateOwnerUrl('agents/agenda.html'), badge: "Naviga" },
                    { label: "⚙️ 3. CONFIGURAZIONE", action: () => navigateOwnerUrl('identity/bot_config.html'), badge: "Naviga" }
                ]);
            }
        }

        function handleVoiceAssistantResult(res, textFallback) {
            // 1. Unificazione Array/Oggetto
            let rootObj = Array.isArray(res) ? res[0] : res;

            // Se n8n restituisce un errore 500/501
            if (!rootObj || rootObj.error) {
                console.warn("Risposta Errore dal Backend n8n:", rootObj);
                matchLocalSemanticIntent(textFallback || "catalogo");
                return;
            }

            // 2. Estrazione sicura di response_output (Stringa o Oggetto)
            let payloadData = rootObj.response_output || rootObj;
            if (typeof payloadData === 'string') {
                try {
                    let cleanJson = payloadData.replace(/```json/g, '').replace(/```/g, '').trim();
                    payloadData = JSON.parse(cleanJson);
                } catch (e) {
                    console.warn("Parsing JSON error su response_output:", e);
                }
            }

            // 3. Aggiornamento Testi di Stato
            const statusText = document.getElementById('voice-status-text');
            const transcriptText = document.getElementById('voice-transcript-text');

            const title = payloadData.status_title || rootObj.status_title || "Comando Riconosciuto";
            const textMsg = payloadData.transcript || payloadData.message || rootObj.transcript || rootObj.message || "";

            if (statusText) statusText.innerText = title;
            if (transcriptText) transcriptText.innerText = textMsg ? `"${textMsg}"` : "";

            // 4. Estrazione dell'array azioni dal payload
            const actionsList = payloadData.actions || rootObj.actions;

            if (actionsList && Array.isArray(actionsList) && actionsList.length > 0) {
                const parsedActions = actionsList.map(act => {
                    const targetUrl = act.target_url || act.url || "";
                    const targetId = act.mod_id || act.id || "";
                    return {
                        label: act.label || "Azione",
                        badge: act.badge || "Naviga",
                        action: () => navigateOwnerUrl(targetUrl, targetId)
                    };
                });

                // Forzo il re-rendering immediato della griglia nel DOM
                renderVoiceActions(parsedActions);
            } else {
                matchLocalSemanticIntent(textFallback || "catalogo");
            }
        }

        function renderVoiceActions(actions) {
            const grid = document.getElementById('voice-actions-grid');
            if (!grid) return;
            grid.innerHTML = "";
            (actions || []).slice(0, 5).forEach((act, idx) => {
                const btn = document.createElement('button');
                btn.className = `w-full py-2 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${idx === 0 ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-950 border border-blue-200/90 shadow-sm' : 'bg-white/90 hover:bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm'}`;
                btn.innerHTML = `
                    <span class="truncate pr-2">${act.label}</span>
                    <span class="text-[8px] px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 text-slate-600 font-bold'} shrink-0 uppercase tracking-widest">${act.badge || 'Naviga'}</span>
                `;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    playMechanicalTick();
                    toggleVoiceAgentOverlay(false);
                    if (act.action) act.action();
                };
                grid.appendChild(btn);
            });
        }

        // Gestione Help Overlay Modal
        window.switchHelpTab = function (tab) {
            const btnButtons = document.getElementById('tab-btn-buttons');
            const btnMobile = document.getElementById('tab-btn-mobile');
            const btnDesktop = document.getElementById('tab-btn-desktop');
            const contentButtons = document.getElementById('tab-content-buttons');
            const contentMobile = document.getElementById('tab-content-mobile');
            const contentDesktop = document.getElementById('tab-content-desktop');
            if (!btnButtons || !btnMobile || !btnDesktop || !contentButtons || !contentMobile || !contentDesktop) return;

            [btnButtons, btnMobile, btnDesktop].forEach(b => {
                b.classList.remove('bg-white', 'text-slate-900', 'shadow-xs');
                b.classList.add('text-slate-400');
            });
            [contentButtons, contentMobile, contentDesktop].forEach(c => c.classList.add('hidden'));

            if (tab === 'buttons') {
                btnButtons.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
                btnButtons.classList.remove('text-slate-400');
                contentButtons.classList.remove('hidden');
            } else if (tab === 'mobile') {
                btnMobile.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
                btnMobile.classList.remove('text-slate-400');
                contentMobile.classList.remove('hidden');
            } else {
                btnDesktop.classList.add('bg-white', 'text-slate-900', 'shadow-xs');
                btnDesktop.classList.remove('text-slate-400');
                contentDesktop.classList.remove('hidden');
            }
        };

        window.toggleHelpModal = function (show) {
            const overlay = document.getElementById('help-overlay');
            if (!overlay) return;
            if (show) {
                window.switchHelpTab('buttons');
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.remove('opacity-0'), 10);
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
                    playMechanicalTick();
                    navigateStack(-1);
                } else if (e.key === 'ArrowDown') {
                    playMechanicalTick();
                    navigateStack(1);
                } else if (e.key === 'ArrowLeft' || e.key === 'Enter') {
                    playMechanicalTick();
                    // Entra nel sottomenu del modulo attivo
                    if (typeof modules !== 'undefined' && modules[activeIdx]) {
                        navigateOwnerUrl(modules[activeIdx].url, modules[activeIdx].id);
                    }
                } else if (e.key === 'ArrowRight' || e.key === 'Escape') {
                    playMechanicalTick();
                    // Torna indietro
                    handleTelegramBack();
                }
            }
        });

        // Parse token and messages
        const urlParams = new URLSearchParams(window.location.search);
        const ash = urlParams.get('ash');
        const msgId = urlParams.get('msg');

        // Dynamic modules setup - 5 moduli attivi con relativi sottomenu
        const mainModules = [
            {
                id: "identity_hub",
                label: "Identità & Configurazione",
                desc: "Gestisci l'anagrafica aziendale, la verticalizzazione del settore ed il setup dei conti finanziari.",
                url: "#",
                icon: "fa-id-card",
                sub: window.identitySubMenu
            },
            {
                id: "catalog",
                label: "Gestione",
                desc: "Il motore del business. Configura i prodotti, i servizi e la logica operativa delle SOP.",
                url: "gestione/catalog.html",
                icon: "fa-box-open"
            },
            {
                id: "operativita",
                label: "Operatività",
                desc: "Evasione degli ordini e-commerce, pianificazione dell'agenda ed avvio delle commesse lavorative.",
                url: "#",
                icon: "fa-clock",
                sub: [
                    { id: "orders", label: "Ordini Live", desc: "Gestisci in tempo reale gli ordini in entrata ed il tracking di spedizione.", url: "operativita/orders-manager.html", icon: "fa-shopping-cart" },
                    { id: "jobs", label: "Piano Lavori", desc: "Organizza le code di lavoro e pianifica le priorità operative.", url: "operativita/job-create.html", icon: "fa-tasks" },
                    { id: "solver", label: "Percorsi AI", desc: "Algoritmi predittivi di ottimizzazione percorsi e logistica consegne.", url: "operativita/pianificazione_itinerari.html", icon: "fa-route" },
                    { id: "stations_config", label: "Postazioni & Note Staff", desc: "Gestisci i nomi delle postazioni ed inserisci le note di manutenzione dello staff.", url: "identity/stations_config.html", icon: "fa-chair" }
                ]
            },
            {
                id: "intelligence_hub",
                label: "Analisi",
                desc: "Analisi di mercato territoriali, controllo di gestione CFO, risorse umane e conformità DVR.",
                url: "#",
                icon: "fa-chart-line",
                sub: [
                    { id: "intel_gen", label: "Intelligence Generale", desc: "Modulo di controllo direzionale e reportistica sintetica.", url: "agents/agent_intelligence.html", icon: "fa-brain" },
                    { id: "intel_market", label: "Analisi Concorrenza", desc: "Benchmarking automatizzato dei competitor territoriali.", url: "agents/analisi-mercato.html", icon: "fa-search-dollar" },
                    { id: "intel_safety", label: "Sicurezza e Conformità", desc: "Verifica DVR, sicurezza sul lavoro e adempimenti normativi.", url: "agents/assistente-sicurezza.html", icon: "fa-shield-halved" },
                    { id: "intel_mgmt", label: "Controllo Gestione", desc: "Monitoraggio flussi di cassa, bilancio e marginalità di studio.", url: "agents/controllo_gestione.html", icon: "fa-coins" },
                    { id: "intel_warehouse", label: "Magazzino AI", desc: "Gestione ed ottimizzazione automatizzata delle scorte di magazzino.", url: "agents/intelligent-warehouse.html", icon: "fa-warehouse" },
                    { id: "intel_agenda", label: "Analisi Agenda", desc: "Pianificazione dell'agenda ed ottimizzazione dei tempi dello staff.", url: "agents/agenda.html", icon: "fa-calendar-alt" },
                    { id: "dashboar_hub", label: "DashBoar Studio", desc: "Lo Swarm Agente 8 progetta cruscotti operativi su misura dai dati reali della tua azienda.", url: "agents/dashboar_hub.html", icon: "fa-gauge-high" }
                ]
            },
            {
                id: "support_hub",
                label: "Supporto",
                desc: "Gestione dei ticket di supporto tecnico e deviazione della chat ad operatori umani.",
                url: "supporto/support_hub.html",
                icon: "fa-headset"
            },
            {
                id: "fine_tuning",
                label: "Addestramento",
                desc: "Esporta i dati di SiteBoS in formato JSONL per addestrare modelli linguistici personalizzati.",
                url: "fine-tuning/fine-tuning.html",
                icon: "fa-brain"
            }
        ];

        window.mainModules = mainModules;
        let modules = [...mainModules];
        let currentMenuLevel = 'main';
        let parentActiveIdx = 0;
        let activeIdx = 0;
        let audioCtx = null;
        const container = document.getElementById('stack-container');
        const dotContainer = document.getElementById('dot-indicators');
        const dotWrapper = document.getElementById('dot-indicators-wrapper');

        // Handle Telegram native back button behavior
        function handleTelegramBack() {
            if (currentMenuLevel === 'sub') {
                window.stopDashboardAudio();
                modules = mainModules;
                currentMenuLevel = 'main';
                activeIdx = parentActiveIdx;

                // Hide Submenu Header
                const submenuHeader = document.getElementById('submenu-header');
                if (submenuHeader) {
                    submenuHeader.classList.add('hidden');
                }

                tg.BackButton.hide();
                tg.BackButton.offClick(handleTelegramBack);
                buildStack();
                playMechanicalTick();
            }
        }

        window.handleBackOrClose = function () {
            if (currentMenuLevel === 'main') {
                tg.close();
            } else {
                handleTelegramBack();
            }
        };

        // Play procedural mechanical tick tone using Web Audio API
        function playMechanicalTick() {
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;

                if (!audioCtx) {
                    audioCtx = new AudioCtx();
                }
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }

                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1700, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.03);

                gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 0.03);
            } catch (e) {
                console.warn("Audio Context error:", e);
            }
        }

        // Render Stack Cards and Dots
        function buildStack() {
            container.innerHTML = "";
            dotContainer.innerHTML = "";
            prevDiffMap.clear();

            modules.forEach((mod, idx) => {
                // Card Creation with Center Platform Theme Styling (White card + slate-900 icon box + centered text)
                const card = document.createElement('div');
                card.className = "platform-card-3d select-none";
                card.id = `card-${idx}`;
                card.innerHTML = `
                    <div class="my-auto flex items-center gap-4 w-full px-2 text-left">
                        <div class="card-icon-box w-11 h-11 bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl flex items-center justify-center text-lg shadow-2xs shrink-0 transition-all duration-300">
                            <i class="fas ${mod.icon}"></i>
                        </div>
                        <div class="overflow-hidden">
                            <h3 class="text-xs font-black tracking-tight text-slate-900 leading-tight uppercase mb-0.5">${mod.label}</h3>
                            <p class="card-desc text-[9px] text-slate-500 font-bold leading-normal mt-0.5 normal-case">${mod.desc}</p>
                        </div>
                    </div>
                `;

                // Swipe gesture isolation parameters
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

                    if (audioCtx && audioCtx.state === 'suspended') {
                        audioCtx.resume();
                    }

                    if (idx === activeIdx) {
                        openModule(mod.id, mod.url);
                    } else {
                        selectIdx(idx);
                    }
                });

                container.appendChild(card);

                // Dot Indicator inside vertical pill wrapper
                const dot = document.createElement('div');
                dot.id = `dot-${idx}`;
                dot.className = `w-2.5 h-2.5 rounded-full bg-slate-300 transition-all duration-300 cursor-pointer`;
                dot.onclick = () => selectIdx(idx);
                dotContainer.appendChild(dot);
            });

            updateStackLayout();
            applyViewMode();

            // Toggle 3D Back / Close Button state
            const backBtn3d = document.getElementById('btn-nav-back');
            const backIcon3d = document.getElementById('btn-nav-back-icon');
            if (backBtn3d && backIcon3d) {
                if (currentMenuLevel === 'main') {
                    backIcon3d.className = "fas fa-times text-[10px]";
                } else {
                    backIcon3d.className = "fas fa-chevron-left text-[10px]";
                }
            }
        }

        // Track previous positions for smooth cylinder entry
        const prevDiffMap = new Map();

        // Apply true 3D cylinder vertical transformations
        function updateStackLayout(direction = 1) {
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
                    // CARD ATTIVA (Centro - In Primo Piano Assoluto)
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
                    // CARD DOPO (Sotto: ALZATA A 110px e Rimpicciolita)
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

                // GESTIONE DIREZIONE UNIFORME PER TUTTE LE CARD (Elimina ogni scavalcamento al contrario)
                const prevDiff = prevDiffMap.get(idx);
                prevDiffMap.set(idx, diff);

                if (prevDiff !== undefined && prevDiff !== diff) {
                    if (direction > 0 && diff > 0 && prevDiff < 0) {
                        // QUANDO PREMI GIÙ (direction > 0): Qualsiasi card che passa da sopra a sotto 
                        // nasce a 180px (sotto lo schermo con opacità 0) e SALE VERSO L'ALTO nella direzione dello spin!
                        card.style.transition = 'none';
                        card.style.transform = `translate3d(0, 180px, -80px) rotateX(12deg) scale(0.65)`;
                        card.style.opacity = 0;
                        card.offsetHeight; // Force Reflow
                        card.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
                    } else if (direction < 0 && diff < 0 && prevDiff > 0) {
                        // QUANDO PREMI SU (direction < 0): Qualsiasi card che passa da sotto a sopra 
                        // nasce a -120px (sopra lo schermo con opacità 0) e SCENDE VERSO IL BASSO nella direzione dello spin!
                        card.style.transition = 'none';
                        card.style.transform = `translate3d(0, -120px, -80px) rotateX(-12deg) scale(0.65)`;
                        card.style.opacity = 0;
                        card.offsetHeight; // Force Reflow
                        card.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
                    }
                }

                // Applicazione stili GPU
                card.style.transform = `translate3d(0, ${translateY}px, ${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`;
                card.style.opacity = opacity;
                card.style.zIndex = zIndex;

                // Update dots - Tutti punti circolari uniformi (singolo punto nero per l'attivo)
                if (dot) {
                    if (idx === activeIdx) {
                        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-900 shadow-xs transition-all duration-300 scale-110";
                        setTimeout(() => {
                            dot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 50);
                    } else {
                        dot.className = "w-2.5 h-2.5 rounded-full bg-slate-300/80 transition-all duration-300";
                    }
                }
            });
        }

        // Helper locale per determinare se l'ambiente è Mobile (Smartphone) o PC Desktop
        function isMobileDevice() {
            const platform = (tg?.platform || '').toLowerCase();
            if (['android', 'ios', 'mobile'].includes(platform)) return true;
            if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(platform)) return false;
            const ua = (navigator.userAgent || '').toLowerCase();
            if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return true;
            return (window.innerWidth < 768);
        }

        // Index Selection and Sensory execution
        function selectIdx(idx, direction, opts = {}) {
            if (!modules || modules.length === 0) return;
            let targetIdx = (idx + modules.length) % modules.length;
            if (targetIdx === activeIdx) return;

            let dir = direction;
            if (dir === undefined) {
                let stepDiff = targetIdx - activeIdx;
                if (modules.length > 1) {
                    if (stepDiff > modules.length / 2) stepDiff -= modules.length;
                    else if (stepDiff < -modules.length / 2) stepDiff += modules.length;
                }
                dir = stepDiff >= 0 ? 1 : -1;
            }

            // Highlight side dot and play distinct feedback when wrapping around from start to end or end to start
            const isWrapping = (activeIdx === modules.length - 1 && targetIdx === 0) || (activeIdx === 0 && targetIdx === modules.length - 1);
            if (!opts.silent) {
                if (isWrapping) {
                    playMechanicalTick();
                    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                } else {
                    playMechanicalTick();
                    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                }
            }

            activeIdx = targetIdx;
            updateStackLayout(dir);
        }

        window.navigateStack = function (direction, opts = {}) {
            if (!modules || modules.length === 0) return;
            selectIdx(activeIdx + direction, direction, opts);
        };

        // Touch scrubbing logic for Dot Indicator wrapper
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
        }

        dotWrapper.addEventListener('mousedown', e => {
            isScrubbingMouse = true;
            handleMouseScrub(e);
        });

        window.addEventListener('mousemove', handleMouseScrub);
        window.addEventListener('mouseup', () => {
            isScrubbingMouse = false;
        });

        // Swipe scroll logic (Vertical AND Horizontal support)
        const mainViewport = document.querySelector('main') || container;
        let swipeStartX = 0;
        let swipeStartY = 0;
        let swipeEndX = 0;
        let swipeEndY = 0;

        mainViewport.addEventListener('touchstart', e => {
            swipeStartX = e.changedTouches[0].screenX;
            swipeStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        mainViewport.addEventListener('touchend', e => {
            swipeEndX = e.changedTouches[0].screenX;
            swipeEndY = e.changedTouches[0].screenY;

            const diffX = swipeEndX - swipeStartX;
            const diffY = swipeEndY - swipeStartY;
            const threshold = 35;

            // Determine dominant direction
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal Swipe
                if (Math.abs(diffX) > threshold) {
                    if (diffX < 0) {
                        // Swipe left -> enter next menu (active module subpage)
                        const activeMod = modules[activeIdx];
                        openModule(activeMod.id, activeMod.url);
                    } else {
                        // Swipe right -> return to previous menu (close Telegram WebApp or exit sub-menu)
                        if (currentMenuLevel === 'sub') {
                            handleTelegramBack();
                        } else {
                            tg.close();
                        }
                    }
                }
            } else {
                // Vertical Swipe
                if (Math.abs(diffY) > threshold) {
                    if (diffY < 0) {
                        navigateStack(1); // Swipe up -> advance
                    } else {
                        navigateStack(-1); // Swipe down -> go back
                    }
                }
            }
        }, { passive: true });

        // Wheel scroll
        window.addEventListener('wheel', e => {
            if (e.deltaY > 0) {
                navigateStack(1);
            } else {
                navigateStack(-1);
            }
        }, { passive: true });

        // Redirect URL logic or dynamic Sub-menu loading
        window.openModule = function (id, url) {
            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            const selectedMod = modules[activeIdx];
            if (selectedMod && selectedMod.sub) {
                window.stopDashboardAudio();
                // Save current main menu activeIdx
                parentActiveIdx = activeIdx;
                // Switch to sub-menu
                modules = selectedMod.sub;
                currentMenuLevel = 'sub';
                activeIdx = 0;

                // Update Submenu Header
                const submenuHeader = document.getElementById('submenu-header');
                const submenuTitle = document.getElementById('submenu-title');
                const submenuIcon = document.getElementById('submenu-icon');
                if (submenuHeader && submenuTitle && submenuIcon) {
                    submenuTitle.innerText = selectedMod.label;
                    submenuIcon.className = `fas ${selectedMod.icon || 'fa-folder-open'} text-sm`;
                    submenuHeader.classList.remove('hidden');
                }

                // Show Telegram Native Back Button
                tg.BackButton.show();
                tg.BackButton.onClick(handleTelegramBack);

                buildStack();
                playMechanicalTick();
                return;
            }

            // Check if this sub-module action is intercepted (e.g. external link confirmation)
            if (window.handleIdentityAction && window.handleIdentityAction(selectedMod, ash, msgId)) {
                return;
            }

            // Normal HTML page redirection
            window.location.href = `../${url}?ash=${ash}&msg=${msgId}`;
        };

        // Check if a specific sub-menu is requested via URL parameter
        const initialMenu = urlParams.get('menu');
        if (initialMenu === 'identity_hub') {
            const selectedMod = mainModules.find(m => m.id === 'identity_hub');
            if (selectedMod && selectedMod.sub) {
                parentActiveIdx = mainModules.indexOf(selectedMod);
                modules = selectedMod.sub;
                currentMenuLevel = 'sub';
                activeIdx = 0;

                // Update Submenu Header
                const submenuHeader = document.getElementById('submenu-header');
                const submenuTitle = document.getElementById('submenu-title');
                const submenuIcon = document.getElementById('submenu-icon');
                if (submenuHeader && submenuTitle && submenuIcon) {
                    submenuTitle.innerText = selectedMod.label;
                    submenuIcon.className = `fas ${selectedMod.icon || 'fa-folder-open'} text-sm`;
                    submenuHeader.classList.remove('hidden');
                }

                tg.BackButton.show();
                tg.BackButton.onClick(handleTelegramBack);
            }
        }

        async function fetchDashboardData() {
            if (!ash) return null;
            const WH_URL = "https://prod.workflow.trinai.it/webhook/83acc670-15ae-4da0-ae0e-3587c85bd5f4";
            try {
                const response = await fetch(WH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        _auth: tg.initData || "",
                        ash: ash,
                        msg: msgId || "",
                        action: 'get_owner_data'
                    })
                });
                if (!response.ok) {
                    throw new Error(`Risposta server non valida: ${response.status}`);
                }
                const result = await response.json();
                if (result.status === 'success' && result.owner_data) {
                    const data = result.owner_data;

                    if (data && data.access_token) {
                        try {
                            sessionStorage.setItem('sitebos_access_token', String(data.access_token));
                        } catch (_) {}
                    }

                    // Update company name
                    const tenantNameEl = document.getElementById('tenant-name');
                    if (tenantNameEl && data.ragione_sociale) {
                        tenantNameEl.innerText = data.ragione_sociale.toUpperCase();
                    }

                    // Update credits
                    const creditsEl = document.getElementById('credits-count');
                    if (creditsEl && data.credits_balance !== undefined) {
                        creditsEl.innerText = `${data.credits_balance} CREDITI`;
                    }

                    // Update logo if available — il logo reale vive nell'honeypot
                    // (assets.logo.url), non in owner_data: va recuperato con una
                    // chiamata separata a honeypot_editor/get_honeypot_data.
                    const vat = data.vat_number || data.fiscal_code;
                    const logoImg = document.getElementById('tenant-logo');
                    const logoFallback = document.getElementById('tenant-logo-fallback');
                    if (vat && logoImg && logoFallback) {
                        try {
                            const hpRes = await fetch('https://prod.workflow.trinai.it/webhook/48ee3cba-99dc-407a-98af-624e97b1e888', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'get_honeypot_data', vat_number: vat })
                            });
                            const hpResult = await hpRes.json();
                            const logoUrl = hpResult?.HoneyPot?.assets?.logo?.url;
                            if (logoUrl) {
                                logoImg.src = logoUrl;
                                logoImg.onload = () => {
                                    logoFallback.classList.add('hidden');
                                    logoImg.classList.remove('hidden');
                                };
                                logoImg.onerror = () => {
                                    logoImg.classList.add('hidden');
                                    logoFallback.classList.remove('hidden');
                                };
                            } else {
                                logoImg.classList.add('hidden');
                                logoFallback.classList.remove('hidden');
                            }
                        } catch (_) {
                            logoImg.classList.add('hidden');
                            logoFallback.classList.remove('hidden');
                        }
                    }

                    return data;
                } else {
                    return null;
                }
            } catch (error) {
                console.error("Errore recupero dati dashboard:", error);
                throw error;
            }
        }

        function showFatalAuthError(message) {
            const loadingScreen = document.getElementById('app-loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = `
                    <div class="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center text-xl mb-2 shadow-xs">
                        <i class="fas fa-triangle-exclamation"></i>
                    </div>
                    <h3 class="text-xs font-black uppercase tracking-wider text-red-600 mb-1">ERRORE GRAVE DI AUTENTICAZIONE</h3>
                    <p class="text-[10px] font-semibold text-slate-600 max-w-xs leading-relaxed mb-4">${message}</p>
                    <button onclick="window.location.reload()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-xs transition cursor-pointer">
                        <i class="fas fa-rotate-right mr-1.5"></i> Riprova
                    </button>
                `;
                loadingScreen.classList.remove('opacity-0');
                loadingScreen.style.display = 'flex';
            }
        }

        // Logica Onboarding Tooltip Wave (Accendi / Spegni Elegante con Soft Glow Azzurro)
        let isTooltipWaveActive = false;
        let waveScanInterval = null;
        let waveScanIdx = 0;

        // ─── LED TYPEWRITER STRIPS ───────────────────────────────────────
        // 4 strisce fisse: i caratteri appaiono uno alla volta (typewriter),
        // poi una sweepglow illumina tutta la striscia, poi fade out.
        // Il ciclo gira su tutte e 4 le strisce in loop.
        // ────────────────────────────────────────────────────────────────
        const STRIP_DEFS = [
            { id: 'swipe-strip-led', text: '↑ SWIPE ↑ SU ↑ PRECEDENTE ↑' },
            { id: 'swipe-strip-led', text: '→ SWIPE → DESTRA → ENTRA / APRI →' },
            { id: 'swipe-strip-led', text: '↓ SWIPE ↓ GIÙ ↓ SUCCESSIVO ↓' },
            { id: 'swipe-strip-led', text: '← SWIPE ← SINISTRA ← TORNA / ESCI ←' },
        ];

        const STRIP_CHAR_MS = 110;  // Tempo molto calmo tra carattere e carattere (typewriter)
        const STRIP_GLOW_MS = 1200; // Tempo di mantenimento glow pieno prima del fade
        const STRIP_SWEEP_MS = 45;   // Tempo di corsa sweep glow
        const STRIP_FADE_MS = 600;  // Pausa rilassata prima della striscia successiva

        let stripCycleTimer = null;
        let stripCycleIdx = 0;
        let isStripActive = false;

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

            // FASE 1 — Typewriter: chars appaiono uno alla volta
            let ci = 0;
            function typeNext() {
                if (!isStripActive) return;
                if (ci < spans.length) {
                    spans[ci].style.opacity = '0.45';
                    ci++;
                    stripCycleTimer = setTimeout(typeNext, STRIP_CHAR_MS);
                } else {
                    // FASE 2 — Sweep glow da sinistra a destra
                    stripCycleTimer = setTimeout(() => {
                        if (!isStripActive) return;
                        spans.forEach((s, i) => {
                            setTimeout(() => {
                                if (!isStripActive) return;
                                s.style.opacity = '1';
                                s.style.color = '#334155'; // slate-700
                            }, i * STRIP_SWEEP_MS);
                        });
                        // FASE 3 — Glow hold poi fade out
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
            const def = STRIP_DEFS[stripCycleIdx % STRIP_DEFS.length];
            stripCycleIdx++;
            runStripAnim(def, () => {
                if (!isStripActive) return;
                stripCycleTimer = setTimeout(runNextStrip, STRIP_FADE_MS);
            });
        }

        function startStripCycle() {
            if (isStripActive) return;
            isStripActive = true;
            stripCycleIdx = 0;
            runNextStrip();
        }

        function stopStripCycle() {
            isStripActive = false;
            clearTimeout(stripCycleTimer);
            STRIP_DEFS.forEach(d => clearStripEl(d.id));
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
            if (pair.badge) {
                if (active) {
                    pair.badge.classList.remove('opacity-0', 'opacity-40', 'text-slate-400');
                    pair.badge.classList.add('opacity-90', 'text-slate-700', 'font-semibold');
                } else {
                    pair.badge.classList.remove('opacity-90', 'text-slate-700', 'font-semibold');
                    if (isTooltipWaveActive) {
                        pair.badge.classList.remove('opacity-0');
                        pair.badge.classList.add('opacity-40', 'text-slate-400');
                    } else {
                        pair.badge.classList.remove('opacity-40', 'opacity-90');
                        pair.badge.classList.add('opacity-0', 'text-slate-400');
                    }
                }
            }
        }

        window.toggleTooltipWave = function (forceState) {
            const tooltips = document.querySelectorAll('.tooltip-wave-badge');
            if (!tooltips || tooltips.length === 0) return;

            const shouldShow = (forceState !== undefined) ? forceState : !isTooltipWaveActive;

            const wavePairs = [
                { btn: document.getElementById('btn-nav-back'), badge: document.getElementById('tooltip-wave-back') },
                { btn: document.getElementById('btn-nav-up'), badge: document.getElementById('tooltip-wave-up') },
                { btn: document.getElementById('btn-nav-guide'), badge: document.getElementById('tooltip-wave-guide') },
                { btn: document.getElementById('btn-nav-audio'), badge: document.getElementById('tooltip-wave-audio') },
                { btn: document.getElementById('btn-help-gesture'), badge: document.getElementById('tooltip-wave-help') },
                { btn: document.getElementById('btn-voice-agent'), badge: document.getElementById('tooltip-wave-bot') },
                { btn: document.getElementById('btn-quick-list'), badge: document.getElementById('tooltip-wave-list') },
                { btn: document.getElementById('btn-nav-down'), badge: document.getElementById('tooltip-wave-down') }
            ];

            if (shouldShow) {
                isTooltipWaveActive = true;
                playMechanicalTick();
                if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

                // Update exit/back tooltip text dynamically based on currentMenuLevel
                const backText = document.getElementById('tooltip-wave-back-text');
                if (backText) {
                    backText.textContent = (currentMenuLevel === 'main') ? 'Chiudi' : 'Indietro';
                }

                // Cascading Fade-In dall'alto verso il basso (50ms stagger)
                tooltips.forEach((el, idx) => {
                    setTimeout(() => {
                        if (!isTooltipWaveActive) return;
                        el.classList.remove('opacity-0');
                        el.classList.add('opacity-40');
                    }, idx * 50);
                });

                // Avvia ciclo LED typewriter strips
                startStripCycle();

                // Avvio dell'illuminazione a giro (Round-Robin soft cyan glow pulse ultra-calmo ogni 1400ms)
                if (waveScanInterval) clearInterval(waveScanInterval);
                waveScanIdx = 0;
                waveScanInterval = setInterval(() => {
                    if (!isTooltipWaveActive) {
                        clearInterval(waveScanInterval);
                        return;
                    }

                    // Reset all pairs to default
                    wavePairs.forEach(p => setPairHighlight(p, false));

                    // Highlight current active pair with cyan glow
                    const currentPair = wavePairs[waveScanIdx];
                    if (currentPair) {
                        setPairHighlight(currentPair, true);
                    }

                    waveScanIdx = (waveScanIdx + 1) % wavePairs.length;
                }, 2200);

            } else {
                isTooltipWaveActive = false;
                if (waveScanInterval) clearInterval(waveScanInterval);
                stopStripCycle();

                // Reset all pairs & fade out labels
                wavePairs.forEach(p => setPairHighlight(p, false));
            }
        };

        function triggerTooltipWave() {
            window.toggleTooltipWave(true);

            // Scomparsa morbida con Fade-Out alla prima qualsiasi interazione dell'utente
            const dismissOnFirstInteraction = (e) => {
                const helpBtn = document.getElementById('btn-help-gesture');
                if (helpBtn && helpBtn.contains(e.target)) return;

                window.toggleTooltipWave(false);
                window.removeEventListener('click', dismissOnFirstInteraction, true);
                window.removeEventListener('touchstart', dismissOnFirstInteraction, true);
                window.removeEventListener('keydown', dismissOnFirstInteraction, true);
                window.removeEventListener('wheel', dismissOnFirstInteraction, true);
            };

            setTimeout(() => {
                window.addEventListener('click', dismissOnFirstInteraction, true);
                window.addEventListener('touchstart', dismissOnFirstInteraction, true);
                window.addEventListener('keydown', dismissOnFirstInteraction, true);
                window.addEventListener('wheel', dismissOnFirstInteraction, true);
            }, 350);
        }

        async function initDashboard() {
            const loadingScreen = document.getElementById('app-loading-screen');

            // 1. Verificare la presenza di 'ash'
            if (!ash) {
                showFatalAuthError("Parametro di autenticazione 'ash' mancante. Impossibile verificare l'identità del tenant.");
                return;
            }

            // 2. Chiamata sincrona con await al Webhook get_owner_data
            try {
                const ownerData = await fetchDashboardData();
                if (!ownerData) {
                    showFatalAuthError("Nessun profilo Titolare / Owner registrato nel database per questa sessione. Accesso negato.");
                    return;
                }

                // 3. Owner valido e recuperato con successo -> Costruisci l'interfaccia e sblocca l'app
                buildStack();
                triggerTooltipWave();
                resetAttractIdle();

                if (loadingScreen) {
                    loadingScreen.classList.add('opacity-0');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 300);
                }
            } catch (err) {
                console.error("[InitError] Impossibile recuperare i dati dell'owner:", err);
                showFatalAuthError("Errore grave di rete o risposta non valida dal server durante il recupero del profilo Owner.");
            }
        }

        // Avvio bloccante con verifica identità Titolare / Owner
        initDashboard();

        // ───────────────────────────────────────────────────────
        // ATTRACT MODE — Auto-scorrimento card dopo inattività
        // Dopo 5 secondi senza interazione, le card scorrono da sole
        // ogni 2.5 secondi. Qualsiasi tocco/click/swipe ferma tutto.
        // ───────────────────────────────────────────────────────
        let attractIdleTimer = null;
        let attractInterval = null;
        let isAttractActive = false;

        const ATTRACT_IDLE_MS = 5000;   // 5s di inattività prima di avviarsi
        const ATTRACT_STEP_MS = 4200;   // una card ogni 4.2 secondi (ritmo calmo)

        function startAttractMode() {
            if (isAttractActive) return;
            // Se siamo su PC Desktop, NON avviare l'attract mode ed i click acustici in background
            if (!isMobileDevice()) {
                return;
            }
            isAttractActive = true;
            attractInterval = setInterval(() => {
                if (window.navigateStack) window.navigateStack(1, { silent: true });
            }, ATTRACT_STEP_MS);
        }

        function stopAttractMode() {
            if (!isAttractActive) return;
            isAttractActive = false;
            clearInterval(attractInterval);
            attractInterval = null;
        }

        function resetAttractIdle() {
            stopAttractMode();
            clearTimeout(attractIdleTimer);
            attractIdleTimer = setTimeout(startAttractMode, ATTRACT_IDLE_MS);
        }

        // Avvia il rilevamento inattività
        ['touchstart', 'touchend', 'click', 'keydown', 'wheel', 'pointermove'].forEach(evt => {
            window.addEventListener(evt, resetAttractIdle, { passive: true });
        });

        // Prima scadenza al caricamento
        resetAttractIdle();
