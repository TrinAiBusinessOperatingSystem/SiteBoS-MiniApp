/**
 * SiteBoS MiniApp — Desktop Catalog Overlay Engine v3.2
 * Modulo Standalone Flottante a 3 Livelli (Categorie ➔ Voci ➔ Gestione Actions) per PC Desktop
 * Replica al 100% la macchina a stati ed i flag logici di catalog.html in una lavagna flottante ultra-smooth.
 * Protocollo v3.0 (Zero-Build, Mobile-First + Desktop Multi-Window OS)
 */
(function (window) {
    'use strict';

    const WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e";
    const OVERLAY_CROSS_LOCK_URL = "https://prod.workflow.trinai.it/webhook/17a1bf79-43cd-428b-a497-33745ca44857";

    /**
     * Tenta di acquisire il lock remoto n8n/MongoDB per l'overlay catalogo.
     * Ritorna false e mostra l'overlay di blocco se il lock è già occupato cross-platform.
     */
    async function tryOverlayCrossPlatformLock() {
        initSessionParams();
        if (!overlayAsh) return true; // Senza token non bloccare (fallback safe)
        try {
            const tg = window.Telegram?.WebApp;
            const platform = (function () {
                const p = (tg?.platform || '').toLowerCase();
                if (['android', 'ios', 'mobile'].includes(p)) return 'mobile';
                if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(p)) return 'desktop';
                const ua = (navigator.userAgent || '').toLowerCase();
                if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return 'mobile';
                return (window.innerWidth < 768) ? 'mobile' : 'desktop';
            })();

            const res = await fetch(OVERLAY_CROSS_LOCK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _auth: tg?.initData || '',
                    ash: overlayLockToken || overlayAsh,
                    scope: OVERLAY_LOCK_SCOPE,
                    platform: platform,
                    action: 'acquire',
                    ttl: 300
                })
            });
            const data = await res.json();
            if (data && data.blocked) {
                const otherPlatform = data.platform === 'desktop' ? 'PC Desktop' : 'Smartphone Mobile';
                showLockBlockedOverlay(
                    `Il Catalogo è attualmente aperto ed in uso su <b>${otherPlatform}</b>. Potrai modificarlo non appena la sessione sull'altro dispositivo verrà chiusa.`
                );
                return false;
            }
        } catch (e) {
            console.warn('[CatalogOverlay] Cross-platform lock check warn:', e);
        }
        return true;
    }

    // Stato Globale dell'Overlay
    let cachedCatalog = null;
    let overlayMacro = 'SOP';             // 'SOP' | 'SER' | 'PRO'
    let overlayViewLevel = 'categories';  // 'categories' | 'items' | 'actions'
    let activeCategory = null;           // Categoria selezionata al Livello 2
    let activeProduct = null;            // Voce selezionata al Livello 3
    let overlayProductData = null;      // Dati NoSQL estesi restituiti da get_ghost_info
    let overlaySopId = null;            // ID (callback_data) del prodotto attivo
    let overlaySearchQuery = '';
    let isMaximized = false;
    let normalPos = { top: '50px', left: '50%', transform: 'translate(-50%, 0)', width: '92vw', height: 'auto' };

    // Parametri di Sessione
    let overlayAsh = '';
    let overlayLockToken = '';
    let overlayMsg = '';

    // ─── GUARD ANTI-RACE-CONDITION (Fetch Async Interne) ────────────────────
    // Stessa filosofia del cross-tab lock in twa_global_launch.js,
    // ma applicata alle fetch async interne all'overlay (non cross-tab).
    //
    // isFetchingCatalog:  impedisce fetch parallele di get_catalog durante il
    //                     primo caricamento (click multipli veloci su open()).
    // _actionFetchToken:  token incrementale per get_ghost_info. Se il token
    //                     cambia prima che la risposta arrivi, la risposta viene
    //                     scartata (stale response da click precedente).
    // isFetchingActions:  blocca il doppio click su una voce mentre get_ghost_info
    //                     è già in volo per quella stessa voce.
    let isFetchingCatalog = false;
    let _catalogFetchPromise = null;  // Promise condivisa: tutti i chiamanti
                                      // attendono la stessa fetch in volo.
    let _actionFetchToken = 0;        // Versione corrente: confrontata al resolve
    let isFetchingActions = false;    // True: una fetch get_ghost_info è in volo
    // ─────────────────────────────────────────────────────────────────────────

    // ─── DOMAIN LOCK CROSS-TAB (stesso schema di twa_global_launch.js) ───────
    // L'overlay acquisisce il lock 'catalog' su localStorage esattamente come
    // farebbe la pagina catalog.html — così partecipa al sistema FCFS globale:
    //   • Se identity è aperta su un'altra scheda → l'overlay non si apre.
    //   • Se l'overlay è aperto → catalog.html su un'altra scheda viene bloccata.
    //   • Se l'overlay viene chiuso → il lock viene rilasciato immediatamente.
    const OVERLAY_LOCK_SCOPE = 'catalog';
    const OVERLAY_LOCK_KEY   = `sitebos_lock_${OVERLAY_LOCK_SCOPE}`;
    const OVERLAY_HB_KEY     = `sitebos_hb_${OVERLAY_LOCK_SCOPE}`;
    let _overlayTabId        = null;  // ID univoco di questo tab (generato all'apertura)
    let _overlayHbInterval   = null;  // Heartbeat interval (3s come twa_global_launch.js)

    /** Legge se un lock di un certo scope è ATTIVO su un'ALTRA scheda */
    function isLockActiveOnOtherTab(scopeKey) {
        const lockOwner     = localStorage.getItem(`sitebos_lock_${scopeKey}`);
        const lastHeartbeat = parseInt(localStorage.getItem(`sitebos_hb_${scopeKey}`) || '0', 10);
        const now           = Date.now();
        // Considera vivo il lock se il proprietario è diverso e il battito risale a < 8s
        return lockOwner && lockOwner !== _overlayTabId && (now - lastHeartbeat) < 8000;
    }

    /** Acquisisce il lock catalog e avvia il heartbeat */
    function acquireCatalogLock() {
        _overlayTabId = Date.now() + '_overlay_' + Math.random().toString(36).substr(2, 6);
        localStorage.setItem(OVERLAY_LOCK_KEY, _overlayTabId);
        localStorage.setItem(OVERLAY_HB_KEY, Date.now().toString());
        // Heartbeat ogni 3s (identico a twa_global_launch.js)
        _overlayHbInterval = setInterval(function () {
            if (_overlayTabId && localStorage.getItem(OVERLAY_LOCK_KEY) === _overlayTabId) {
                localStorage.setItem(OVERLAY_HB_KEY, Date.now().toString());
            }
        }, 3000);
    }

    /** Rilascia il lock catalog e stoppa il heartbeat */
    function releaseCatalogLock() {
        if (_overlayTabId && localStorage.getItem(OVERLAY_LOCK_KEY) === _overlayTabId) {
            localStorage.removeItem(OVERLAY_LOCK_KEY);
            localStorage.removeItem(OVERLAY_HB_KEY);
        }
        if (_overlayHbInterval) {
            clearInterval(_overlayHbInterval);
            _overlayHbInterval = null;
        }
        _overlayTabId = null;
    }

    /** Renderizza il lock overlay "Sezione in uso" (stesso stile di twa_global_launch.js) */
    function showLockBlockedOverlay(reasonText) {
        let blocker = document.getElementById('sitebos-catalog-overlay-lock-blocker');
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'sitebos-catalog-overlay-lock-blocker';
            blocker.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[9999999] flex items-center justify-center p-4';
            blocker.innerHTML = `
                <div class="bg-slate-900/95 border border-slate-700/80 p-6 rounded-3xl w-full max-w-sm shadow-2xl backdrop-blur-2xl text-center text-slate-100 flex flex-col items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-2xl shadow-lg">
                        <i class="fas fa-shield-halved"></i>
                    </div>
                    <div>
                        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400 mb-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                            SESSIONE IN USO SU UN ALTRO SCHERMO
                        </div>
                        <h3 class="text-sm font-extrabold uppercase text-white leading-tight">Sessione in corso su un altro dispositivo</h3>
                        <p class="text-xs text-slate-300 font-medium mt-2 leading-relaxed" id="catalog-lock-reason-text">${reasonText}</p>
                        <p class="text-[11px] text-slate-400 font-normal mt-2 leading-snug">Non appena la sessione sull'altro dispositivo verrà completata o chiusa, potrai lavorare qui in totale tranquillità.</p>
                    </div>
                    <button onclick="document.getElementById('sitebos-catalog-overlay-lock-blocker').remove()" class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-2">
                        <i class="fas fa-times text-xs"></i>
                        Chiudi
                    </button>
                </div>
            `;
            document.body.appendChild(blocker);
        } else {
            const reasonEl = blocker.querySelector('#catalog-lock-reason-text');
            if (reasonEl) reasonEl.textContent = reasonText;
            blocker.classList.remove('hidden');
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Inizializza i parametri di sessione ash e msg
     * Priorità 1: Parametro 'ash' dall'URL (Pattern identico a catalog.html mobile)
     * Priorità 2: Fallback sessionStorage solo se assente da URL
     */
    function initSessionParams() {
        const urlParams = new URLSearchParams(window.location.search);
        let paramAsh = urlParams.get('ash') || '';
        overlayMsg = urlParams.get('msg') || urlParams.get('message_id') || '';

        if (paramAsh.includes('?msg=')) {
            const parts = paramAsh.split('?msg=');
            paramAsh = parts[0];
            if (!overlayMsg) overlayMsg = parts[1];
        }

        // Priorità assoluta all'ash reale da URL
        if (paramAsh) {
            overlayAsh = paramAsh;
        } else {
            try {
                overlayAsh = sessionStorage.getItem('sitebos_ash') || sessionStorage.getItem('sitebos_access_token') || '';
            } catch (_) {
                overlayAsh = '';
            }
        }

        // Token dedicato esclusivamente al lock cross-platform
        try {
            overlayLockToken = sessionStorage.getItem('sitebos_access_token') || overlayAsh;
        } catch (_) {
            overlayLockToken = overlayAsh;
        }
    }

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
     * Separazione Emoji / Icona dal Testo Breve
     * Estrae pulitamente qualsiasi emoji iniziale per il box icona ed elimina l'emoji dal titolo
     */
    function splitShortName(shortName) {
        if (!shortName) return { icon: '📁', text: '' };
        // Regex robusta per isolare l'emoji/simbolo iniziale
        const emojiRegex = /^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{2000}-\u{32FF}]\uFE0F?)\s*/u;
        const match = shortName.match(emojiRegex);
        if (match) {
            const icon = match[1];
            const text = cleanLabelText(shortName.substring(match[0].length));
            return { icon, text };
        }
        return { icon: '📁', text: cleanLabelText(shortName) };
    }

    /**
     * Recupera l'anagrafica del Catalogo Master via Webhook n8n
     * Guard: se un fetch è già in volo, tutti i chiamanti attendono la stessa Promise
     * (nessuna fetch parallela doppia verso il webhook).
     */
    async function fetchCatalogData() {
        if (cachedCatalog) return cachedCatalog;

        // ── Race Guard: condividi la stessa Promise se fetch già in volo ──────
        if (isFetchingCatalog && _catalogFetchPromise) {
            return _catalogFetchPromise;
        }

        isFetchingCatalog = true;
        _catalogFetchPromise = (async () => {
            try {
                initSessionParams();
                const tg = window.Telegram?.WebApp;

                const res = await fetch(WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "get_catalog", _auth: tg?.initData, ash: overlayAsh, msg: overlayMsg })
                });
                const raw = await res.json();
                const data = Array.isArray(raw) ? raw[0] : (raw.catalog || raw);
                cachedCatalog = data.categories || data.catalog?.categories || [];
                return cachedCatalog;
            } catch (e) {
                console.error("Errore recupero catalogo per Overlay:", e);
                return [];
            } finally {
                isFetchingCatalog = false;
                _catalogFetchPromise = null;
            }
        })();

        return _catalogFetchPromise;
    }

    /**
     * Recupera i Dettagli Estesi della Voce (get_ghost_info)
     * Guard: token versione. Se il token cambia prima che la risposta arrivi
     * (utente ha cliccato su un'altra voce nel frattempo), la risposta viene
     * scartata silenziosamente — nessuna sovrascrittura di stato con dati stantii.
     */
    async function fetchProductGhostInfo(sopId, expectedToken) {
        try {
            initSessionParams();
            const tg = window.Telegram?.WebApp;

            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_ghost_info', sop_id: sopId, ash: overlayAsh, msg: overlayMsg, _auth: tg?.initData })
            });
            const info = await res.json();

            // ── Stale Response Guard: scarta se nel frattempo è stato avviato
            //    un fetch più recente (token incrementato da un click successivo)
            if (expectedToken !== _actionFetchToken) {
                console.warn('[CatalogOverlay] Risposta get_ghost_info scartata — token obsoleto:', expectedToken, '!== corrente:', _actionFetchToken);
                return null;
            }

            return Array.isArray(info) ? info[0] : info;
        } catch (e) {
            console.error("Errore recupero ghost info:", e);
            return null;
        }
    }

    /**
     * Motore di Trascendimento Smooth 60FPS ad Accelerazione Hardware (requestAnimationFrame + translate3d)
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
            
            // Disabilita pointer-events su tutti gli iframe per evitare cattura mouse
            document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none');

            startX = e.clientX;
            startY = e.clientY;

            // Legge l'attuale traslazione m41/m42 dalla matrice GPU
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
     * Porta l'Overlay del Catalogo in primo piano risincronizzandosi con il DesktopWindowManager
     */
    function bringOverlayToFront() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;
        const nextZ = (window.DesktopWindowManager && typeof window.DesktopWindowManager.getNextZIndex === 'function')
            ? window.DesktopWindowManager.getNextZIndex()
            : 995000;
        overlay.style.zIndex = nextZ;
    }

    /**
     * Apre o commuta l'Overlay Flottante del Catalogo Master sulla Scrivania.
     *
     * Lock Protocol (identico a twa_global_launch.js):
     *   1. Controlla se 'identity' è attiva su un'altra scheda → blocca apertura.
     *   2. Controlla se 'catalog' è già attivo su un'altra scheda → blocca apertura.
     *   3. Se via libera → acquisisce il lock 'catalog' + heartbeat.
     */
    async function openCatalogOverlay(initialMacro) {
        initSessionParams();

        // ── Check 1: Identity Master Lock (blocca tutto se identity aperta altrove) ──
        if (isLockActiveOnOtherTab('identity')) {
            showLockBlockedOverlay(
                'Per garantire la sincronizzazione dei dati, la gestione del Catalogo non può essere aperta mentre la sezione <b>Identity & Setup</b> è in uso su un altro dispositivo.'
            );
            return;
        }

        // ── Check 2: Catalog Domain Lock già attivo da un'altra scheda ─────────────
        if (isLockActiveOnOtherTab(OVERLAY_LOCK_SCOPE)) {
            showLockBlockedOverlay(
                'Per garantire l\'integrità del listino, il <b>Catalogo</b> è già aperto ed operativo su un altro schermo o dispositivo.'
            );
            return;
        }

        // ── Check 3: Remote Cross-Platform Lock (n8n/MongoDB) — PC vs Smartphone ──
        const crossPlatformAllowed = await tryOverlayCrossPlatformLock();
        if (!crossPlatformAllowed) return;

        // ── Acquisisce il lock catalog per questa sessione overlay ───────────────
        acquireCatalogLock();

        if (initialMacro && ['SOP', 'SER', 'PRO'].includes(initialMacro)) {
            overlayMacro = initialMacro;
        }
        overlayViewLevel = 'categories';
        activeCategory = null;
        activeProduct = null;
        overlayProductData = null;
        overlaySopId = null;

        let overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'desktop-catalog-overlay';
            overlay.className = 'fixed top-12 left-1/2 w-[92vw] max-w-6xl bg-white/95 border border-slate-200 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl text-slate-900 select-none flex flex-col space-y-5';
            overlay.style.transform = 'translate3d(-50%, 0, 0)';
            overlay.onmousedown = function () {
                bringOverlayToFront();
            };
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');
        bringOverlayToFront();

        await renderOverlayContent();
    }

    /**
     * Chiude l'Overlay Flottante e RILASCIA il lock catalog cross-tab.
     * Chiamata qui: catalog.html su un'altra scheda viene immediatamente sbloccata.
     */
    function closeCatalogOverlay() {
        const doClose = () => {
            const overlay = document.getElementById('desktop-catalog-overlay');
            if (overlay) overlay.classList.add('hidden');
            // Rilascio immediato del lock → altri tab/pagine catalog possono ora aprirsi
            releaseCatalogLock();
            // Rilascio del lock remoto n8n/MongoDB
            try {
                const tg = window.Telegram?.WebApp;
                const platform = window.innerWidth < 768 ? 'mobile' : 'desktop';
                const payload = JSON.stringify({
                    _auth: tg?.initData || '',
                    ash: overlayLockToken || overlayAsh,
                    scope: OVERLAY_LOCK_SCOPE,
                    platform: platform,
                    action: 'release'
                });
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(OVERLAY_CROSS_LOCK_URL, new Blob([payload], { type: 'application/json' }));
                } else {
                    fetch(OVERLAY_CROSS_LOCK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
                }
            } catch (_) {}
        };
        if (window.SiteBosDirtyGuard) {
            window.SiteBosDirtyGuard.requestNavigateAway(null, doClose);
        } else {
            doClose();
        }
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
            overlay.style.top = '50%';
            overlay.style.left = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.width = 'calc(100vw - 40px)';
            overlay.style.height = 'calc(100vh - 70px)';
            isMaximized = true;
        }
    }

    /**
     * Lanciatore di Sub-Editor in Finestra Flottante Multi-Tasking via DesktopWindowManager
     */
    function launchSubEditorDesktop(page, customTitle) {
        initSessionParams();
        const separator = page.includes('?') ? '&' : '?';
        let url = `../gestione/${page}${separator}ash=${encodeURIComponent(overlayAsh)}&msg=${encodeURIComponent(overlayMsg)}`;
        if (overlaySopId) url += `&sop_id=${encodeURIComponent(overlaySopId)}&ghostId=${encodeURIComponent(overlaySopId)}`;
        if (activeCategory?.callback_data) url += `&catId=${encodeURIComponent(activeCategory.callback_data)}`;
        url += `&from_hub=true`;

        // Solo la piattaforma TrinAi Cloud apre a 960x720, tutti gli altri moduli TWA in Smartphone Frame (460x780)
        const isWideTool = (page || '').toLowerCase().includes('trinai');
        const winWidth = isWideTool ? 960 : 460;
        const winHeight = isWideTool ? 720 : 780;

        if (window.DesktopWindowManager) {
            window.DesktopWindowManager.openWindow({
                title: customTitle || page.replace('.html', '').replace(/[\-_]/g, ' ').toUpperCase(),
                url: url,
                icon: 'fas fa-mobile-screen-button',
                width: winWidth,
                height: winHeight
            });
        } else {
            window.location.href = url;
        }
    }

    /**
     * Apertura Gestione Avanzata (Stessa logica di catalog.html)
     */
    function openAdvancedManagementDesktop() {
        const itemType = (overlayProductData?.identity?.item_type || activeProduct?.item_type || '').toLowerCase();
        const isSemi = itemType.includes('semi') || overlayProductData?.blueprint_type === 'SOP_SEMILAVORATO' || (overlaySopId && overlaySopId.toLowerCase().includes("semi"));

        if (overlayMacro === 'SOP' && !isSemi) {
            alert("La Gestione Avanzata non è disponibile per le Procedure (SOP).");
            return;
        }
        const isAdvancedReady = (overlayProductData?.ui_node_draft?.advanced_ready === true) || (activeProduct?.blueprint_ready === true);
        if (!isAdvancedReady) {
            launchSubEditorDesktop('edit-product.html?open_advanced=true', 'EDITA DETTAGLI BASE');
        } else {
            const page = (overlayMacro === 'PRO' || (overlayMacro === 'SOP' && isSemi)) ? 'edit-advanced-product.html' : 'edit-advanced.html';
            launchSubEditorDesktop(page, 'GESTIONE AVANZATA COSTI & BOM');
        }
    }

    /**
     * Apertura Processo Aziendale Blueprint (Stessa logica di catalog.html)
     */
    function openBlueprintEditorDesktop() {
        const itemType = (overlayProductData?.identity?.item_type || activeProduct?.item_type || '').toLowerCase();
        const category = (overlayProductData?.identity?.category || activeProduct?.category || '').toLowerCase();
        const blueprintType = (overlayProductData?.blueprint_type || '').toLowerCase();

        const isSemi = itemType.includes('semi') || category.includes('semi') || category.includes('semilavorat') || blueprintType.includes('semilavorat') || (overlaySopId && overlaySopId.toLowerCase().includes("semi"));

        const page = (overlayMacro === 'PRO' || isSemi) ? 'edit-blueprint-product.html' : 'edit-blueprint.html';
        launchSubEditorDesktop(page, 'PROCESSO AZIENDALE BLUEPRINT');
    }

    /**
     * Attivazione Servizio Blog / Social (Stessa logica di catalog.html)
     */
    function activateServiceDesktop(type) {
        const wh = type === 'blog' ? "https://prod.workflow.trinai.it/webhook/914bd78e-8a41-46d7-8935-7eb73cbbae66" : "https://prod.workflow.trinai.it/webhook/8fc050ca-41cd-4469-989c-269a113a00f9";
        const cost = 10;
        const actionValue = type === 'blog' ? 'create' : 'activate_social';
        if (confirm(`Attivare ${type.toUpperCase()}? (Costo: ${cost} crediti). Il contenuto verrà generato e inviato su Telegram.`)) {
            fetch(wh, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: actionValue, sop_id: overlaySopId, ash: overlayAsh, msg: overlayMsg }),
                keepalive: true
            });
            alert("Richiesta inviata! Riceverai l'aggiornamento su Telegram.");
        }
    }

    /**
     * Stampa Documento (Stessa logica di catalog.html)
     */
    async function printSingleServiceDesktop() {
        try {
            alert("Invio richiesta di stampa in corso...");
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'print',
                    sop_id: overlaySopId,
                    ash: overlayAsh,
                    msg: overlayMsg
                })
            });
            if (!res.ok) throw new Error("Errore risposta server");
            const payload = await res.json();
            if (!payload || (!payload.service_catalog && !payload.process_blueprints)) {
                throw new Error("Dati di stampa incompleti");
            }
            if (window.CatalogPrintEngine) {
                await window.CatalogPrintEngine.printSingleService(payload);
            } else {
                alert("Dati di stampa ricevuti con successo!");
            }
        } catch (err) {
            console.error('Errore stampa:', err);
            alert("Errore generazione stampa: " + err.message);
        }
    }

    /**
     * Helper unificato per dialog di conferma (Telegram WebApp showConfirm con fallback su confirm nativo)
     */
    function showConfirmation(message, onConfirm) {
        const tg = window.Telegram?.WebApp;
        if (tg && typeof tg.showConfirm === 'function') {
            tg.showConfirm(message, (ok) => {
                if (ok) onConfirm();
            });
        } else {
            if (window.confirm(message)) {
                onConfirm();
            }
        }
    }

    /**
     * Eliminazione Categoria (Stessa action webhook di catalog.html mobile)
     */
    async function deleteCategoryDesktop(categoryId, categoryName) {
        if (!categoryId) return;
        const displayName = categoryName || cleanLabelText(categoryId);
        showConfirmation(`Eliminare la categoria ${displayName}?`, async () => {
            initSessionParams();
            const tg = window.Telegram?.WebApp;
            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete_category',
                        _auth: tg?.initData || '',
                        ash: overlayAsh,
                        msg: overlayMsg,
                        category_id: categoryId
                    })
                });
                cachedCatalog = null;
                await renderOverlayContent();
            } catch (e) {
                console.error('[CatalogOverlay] Errore eliminazione categoria:', e);
                alert("Errore durante l'eliminazione della categoria.");
            }
        });
    }

    /**
     * Eliminazione Voce / Prodotto (Stessa action webhook di catalog.html mobile)
     */
    async function deleteProductDesktop(productId, productName) {
        if (!productId) return;
        const displayName = productName || cleanLabelText(productId);
        showConfirmation(`Eliminare la voce ${displayName}?`, async () => {
            initSessionParams();
            const tg = window.Telegram?.WebApp;
            try {
                const res = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete_product',
                        _auth: tg?.initData || '',
                        ash: overlayAsh,
                        msg: overlayMsg,
                        product_id: productId
                    })
                });
                cachedCatalog = null;
                const freshCatalog = await fetchCatalogData();
                if (activeCategory) {
                    const updatedCat = (freshCatalog || []).find(c =>
                        (c.callback_data && c.callback_data === activeCategory.callback_data) ||
                        (c.name && c.name === activeCategory.name)
                    );
                    activeCategory = updatedCat || null;
                    if (!activeCategory) {
                        overlayViewLevel = 'categories';
                    }
                }
                if (overlayViewLevel === 'actions') {
                    overlayViewLevel = 'items';
                    activeProduct = null;
                    overlayProductData = null;
                    overlaySopId = null;
                }
                await renderOverlayContent();
            } catch (e) {
                console.error('[CatalogOverlay] Errore eliminazione voce:', e);
                alert("Errore durante l'eliminazione della voce.");
            }
        });
    }

    /**
     * Compilazione della Lista delle Action Card per il Livello 3
     */
    function compileActionCardsOverlay() {
        if (!activeProduct || !overlayProductData) return [];
        const list = [];

        // 1. Informazioni Base
        list.push({
            id: 'info',
            label: 'Informazioni Base',
            desc: 'Modifica i dettagli e le caratteristiche generali della voce.',
            icon: 'fa-edit',
            badge: 'INFO BASE',
            action: () => launchSubEditorDesktop('edit-product.html', 'INFORMAZIONI BASE')
        });

        // 2. Informazioni Avanzate
        const itemType = (overlayProductData.identity?.item_type || activeProduct.item_type || '').toLowerCase();
        const isSemi = itemType.includes('semi') || overlayProductData.blueprint_type === 'SOP_SEMILAVORATO' || (overlaySopId && overlaySopId.toLowerCase().includes("semi"));

        if (overlayMacro !== 'SOP' || isSemi) {
            list.push({
                id: 'advanced',
                label: 'Informazioni Avanzate',
                desc: 'Gestisci la scomposizione dei costi, ricetta (BOM) e parametri avanzati.',
                icon: 'fa-sliders',
                badge: 'COSTI & BOM',
                action: () => openAdvancedManagementDesktop()
            });
        }

        // 3. Processo Aziendale (Blueprint SOP)
        list.push({
            id: 'blueprint',
            label: 'Processo Aziendale',
            desc: 'Configura la logica esecutiva passo-passo e la conformità di processo.',
            icon: 'fa-diagram-project',
            badge: 'BLUEPRINT SOP',
            action: () => openBlueprintEditorDesktop()
        });

        // 4. Web Blog Page
        const hasBlog = overlayProductData.blog_active;
        list.push({
            id: 'blog',
            label: hasBlog ? 'Web Blog Page' : 'Attiva Blog Page',
            desc: hasBlog ? 'Gestisci e modifica gli articoli generati dall\'IA per la tua vetrina.' : 'Attiva la generazione automatica di articoli per la vetrina con l\'AI.',
            icon: 'fa-pen-nib',
            badge: hasBlog ? 'ATTIVO' : 'DISPONIBILE',
            action: () => hasBlog ? launchSubEditorDesktop('edit-blog.html', 'WEB BLOG PAGE') : activateServiceDesktop('blog')
        });

        // 5. Social Post
        const hasSocial = overlayProductData.post;
        list.push({
            id: 'social',
            label: hasSocial ? 'Social Post' : 'Attiva Social',
            desc: hasSocial ? 'Visualizza e ottimizza i post pronti per la condivisione sui canali social.' : 'Attiva la scrittura automatica di post social ottimizzati per il marketing.',
            icon: 'fa-share-nodes',
            badge: hasSocial ? 'ATTIVO' : 'DISPONIBILE',
            action: () => hasSocial ? launchSubEditorDesktop('edit-post.html', 'SOCIAL POST') : activateServiceDesktop('social')
        });

        // 6. Base Conoscenza AI
        list.push({
            id: 'knowledge',
            label: 'Base Conoscenza AI',
            desc: 'Istruisci l\'assistente virtuale inserendo FAQ, manuali e materiali di supporto.',
            icon: 'fa-brain',
            badge: 'KNOWLEDGE BASE',
            action: () => launchSubEditorDesktop('edit-knowledge.html', 'BASE CONOSCENZA AI')
        });

        // 7. Supervisor Hub
        list.push({
            id: 'supervisor',
            label: 'Supervisor Hub',
            desc: 'Monitora in tempo reale i task e lo stato di avanzamento operativo di questa voce.',
            icon: 'fa-user-gear',
            badge: 'AUDITING AI',
            action: () => launchSubEditorDesktop('supervisor_hub.html', 'SUPERVISOR HUB')
        });

        // 8. Stampa Documento
        list.push({
            id: 'print',
            label: 'Stampa Documento',
            desc: 'Genera e stampa il documento tecnico con la scheda del servizio.',
            icon: 'fa-print',
            badge: 'PDF PRINT',
            action: () => printSingleServiceDesktop()
        });

        // 9. Elimina Voce
        list.push({
            id: 'delete',
            label: 'Elimina Voce',
            desc: 'Elimina definitivamente questo elemento dal catalogo aziendale.',
            icon: 'fa-trash-can',
            badge: 'ELIMINA',
            danger: true,
            action: () => deleteProductDesktop(overlaySopId, cleanLabelText(activeProduct.short_name || activeProduct.name))
        });

        return list;
    }


    /**
     * Ingresso al Livello 3 (Actions) per una Voce Attiva (blueprint_ready === true)
     * Guard:
     *   1. isFetchingActions → blocca doppio click su stessa voce mentre fetch in volo
     *   2. _actionFetchToken → se l'utente cambia voce più velocemente della rete,
     *      la risposta stantia viene scartata in fetchProductGhostInfo() via token check
     */
    async function enterActionsOverlay(prod) {
        if (!prod) return;

        // ── Guard doppio click / fetch in volo ───────────────────────────────
        if (isFetchingActions) {
            console.warn('[CatalogOverlay] enterActionsOverlay: fetch già in volo, skip.');
            return;
        }

        // Incrementa il token PRIMA di avviare la fetch: qualsiasi risposta con
        // token inferiore sarà considerata obsoleta e scartata automaticamente.
        const myToken = ++_actionFetchToken;
        isFetchingActions = true;

        activeProduct = prod;
        overlaySopId = prod.callback_data;
        overlayProductData = null;

        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) { isFetchingActions = false; return; }

        // Renderizza temporaneamente uno spinner di caricamento inline
        overlayViewLevel = 'actions';
        renderOverlayLoading("Caricamento moduli e dettagli estesi per " + cleanLabelText(prod.short_name || prod.name) + "...");

        try {
            const info = await fetchProductGhostInfo(prod.callback_data, myToken);

            // info === null significa che il token è diventato obsoleto durante la fetch
            // (l'utente ha già cliccato su un'altra voce — la nuova fetch si occuperà del render)
            if (info === null) return;

            overlayProductData = info;
            renderOverlayContent();
        } catch (e) {
            console.error('[CatalogOverlay] enterActionsOverlay error:', e);
            if (myToken === _actionFetchToken) {
                // Solo se ancora la richiesta corrente (non obsoleta) mostra l'errore
                overlayViewLevel = 'items';
                renderOverlayContent();
            }
        } finally {
            if (myToken === _actionFetchToken) {
                // Rilascia il lock solo se siamo ancora la fetch corrente
                isFetchingActions = false;
            }
        }
    }


    /**
     * Renderizza uno stato di caricamento inline pulito
     */
    function renderOverlayLoading(msgText) {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;
        overlay.innerHTML = `
            <div class="py-20 flex flex-col items-center justify-center space-y-4">
                <div class="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p class="text-xs font-black uppercase tracking-widest text-slate-500">${msgText || 'Caricamento in corso...'}</p>
            </div>
        `;
    }

    /**
     * Renderizza l'Overlay in Tema Chiaro Elegante (Light Glassmorphism)
     */
    async function renderOverlayContent() {
        const overlay = document.getElementById('desktop-catalog-overlay');
        if (!overlay) return;

        const catalog = await fetchCatalogData();

        // 1. HEADER E BREADCRUMB
        let titleText = 'LISTINO AZIENDALE — PROCEDURE, SERVIZI & PRODOTTI';
        if (overlayViewLevel === 'items' && activeCategory) {
            titleText = `CATEGORIA: ${cleanLabelText(activeCategory.short_name || activeCategory.name)}`;
        } else if (overlayViewLevel === 'actions' && activeProduct) {
            const { text: prodClean } = splitShortName(activeProduct.short_name || activeProduct.name);
            titleText = `VOCE: ${prodClean}`;
        }

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
                            ${titleText}
                        </h2>
                    </div>
                </div>

                <!-- CONTROLLI FINESTRA OVERLAY (PULSANTE CONTESTUALE: CATEGORIA vs VOCE) -->
                <div class="flex items-center gap-2 shrink-0">
                    ${overlayViewLevel === 'categories' ? `
                        <button onclick="window.DesktopCatalogOverlay.openAddCategory()" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2 transition cursor-pointer active:scale-95">
                            <i class="fas fa-folder-plus"></i>
                            <span>Nuova Categoria</span>
                        </button>
                    ` : `
                        <button onclick="window.DesktopCatalogOverlay.openAddProduct()" class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm flex items-center gap-2 transition cursor-pointer active:scale-95">
                            <i class="fas fa-plus"></i>
                            <span>Nuova Voce</span>
                        </button>
                    `}
                    <button onclick="window.DesktopCatalogOverlay.toggleMaximize()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Ingrandisci / Ripristina">
                        <i class="fas fa-window-maximize"></i>
                    </button>
                    <button onclick="window.DesktopCatalogOverlay.close()" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-600 border border-rose-200 text-rose-600 hover:text-white flex items-center justify-center text-xs transition cursor-pointer active:scale-95" title="Chiudi Overlay">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- FILTRI MACRO & BREADCRUMB BACK NAVIGATION -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 shadow-xs backdrop-blur-xl">
                <!-- BOTTONI MACRO O BREADCRUMB -->
                <div class="flex items-center gap-2 flex-wrap">
                    ${overlayViewLevel === 'actions' ? `
                        <button onclick="window.DesktopCatalogOverlay.backToItems()" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-900 text-white shadow-xs flex items-center gap-2 transition cursor-pointer hover:bg-blue-600">
                            <i class="fas fa-arrow-left"></i>
                            <span>⬅ Torna alle Voci</span>
                        </button>
                    ` : (overlayViewLevel === 'items' ? `
                        <button onclick="window.DesktopCatalogOverlay.backToCategories()" class="px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-900 text-white shadow-xs flex items-center gap-2 transition cursor-pointer hover:bg-blue-600">
                            <i class="fas fa-arrow-left"></i>
                            <span>⬅ Torna alle Categorie</span>
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
                    `)}
                </div>

                <!-- CAMPO DI RICERCA REAL-TIME -->
                <div class="relative min-w-[240px]">
                    <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input type="text" value="${overlaySearchQuery}" oninput="window.DesktopCatalogOverlay.setSearch(this.value)" placeholder="Cerca nel listino..." class="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-blue-500 outline-none transition">
                </div>
            </div>

            <!-- GRIGLIA CARD (STILE BOTTONCIONI LIGHT ARMONICI) -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[62vh] overflow-y-auto pr-1">
        `;

        if (overlayViewLevel === 'actions' && activeProduct && overlayProductData) {
            // ── LIVELLO 3: ACTION CARDS SPECIFICHE PER VOCE ──────────────────────
            const actionCards = compileActionCardsOverlay();
            const filteredActions = actionCards.filter(card => {
                return !overlaySearchQuery || card.label.toLowerCase().includes(overlaySearchQuery) || card.desc.toLowerCase().includes(overlaySearchQuery);
            });

            if (filteredActions.length === 0) {
                html += `
                    <div class="col-span-full py-16 text-center text-slate-400">
                        <i class="fas fa-sliders text-4xl mb-3 opacity-40"></i>
                        <p class="text-xs font-black uppercase tracking-widest">Nessun modulo trovato per questa voce</p>
                    </div>
                `;
            } else {
                filteredActions.forEach(card => {
                    const isDanger = card.danger === true;
                    html += `
                        <div onclick="window.DesktopCatalogOverlay.triggerAction('${card.id}')" class="group relative bg-white border ${isDanger ? 'border-rose-200 hover:border-rose-500/80' : 'border-slate-200 hover:border-blue-500/80'} rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                            <div>
                                <div class="flex items-center justify-between mb-3.5">
                                    <div class="w-11 h-11 rounded-xl ${isDanger ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-slate-900 text-white border border-slate-800'} text-lg flex items-center justify-center shadow-xs group-hover:scale-105 transition duration-200">
                                        <i class="fas ${card.icon}"></i>
                                    </div>
                                    <span class="px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isDanger ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'}">
                                        ${card.badge}
                                    </span>
                                </div>

                                <h3 class="text-xs font-black uppercase ${isDanger ? 'text-rose-600' : 'text-slate-900'} leading-tight group-hover:${isDanger ? 'text-rose-700' : 'text-blue-600'} transition mb-1.5">
                                    ${card.label}
                                </h3>
                                <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">
                                    ${card.desc}
                                </p>
                            </div>

                            <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    ${isDanger ? 'ELIMINAZIONE' : 'GESTISCI'}
                                </span>
                                <button class="px-3.5 py-1.5 rounded-xl ${isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-900 hover:bg-blue-600 text-white'} font-black text-[10px] uppercase tracking-wider transition shadow-xs">
                                    ${isDanger ? 'ELIMINA 🗑️' : 'APRI ➔'}
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

        } else if (overlayViewLevel === 'items' && activeCategory) {
            // ── LIVELLO 2: VOCI DELLA CATEGORIA SELEZIONATA ──────────────────────
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
                filteredItems.forEach((item, idx) => {
                    const { icon: prodIcon, text: prodShort } = splitShortName(item.short_name || item.name);
                    const cleanDesc = cleanLabelText(item.name || '');
                    const isReady = item.blueprint_ready === true;

                    html += `
                        <div onclick="window.DesktopCatalogOverlay.selectProduct(${idx})" class="group relative bg-white border border-slate-200 hover:border-blue-500/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                            <div>
                                <div class="flex items-center justify-between mb-3.5">
                                    <div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition duration-200">
                                        ${prodIcon || (item.icon || '💡')}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${isReady ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'}">
                                            ${isReady ? 'ATTIVO' : 'SUGGERITO'}
                                        </span>
                                        <button onclick="event.stopPropagation(); window.DesktopCatalogOverlay.deleteProduct('${(item.callback_data || '').replace(/'/g, "\\'")}', '${prodShort.replace(/'/g, "\\'")}')" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs transition cursor-pointer active:scale-90" title="Elimina Voce">
                                            <i class="fas fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>

                                <h3 class="text-xs font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1.5">
                                    ${prodShort}
                                </h3>
                                <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">
                                    ${cleanDesc}
                                </p>
                            </div>

                            <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    ${isReady ? 'GESTISCI' : 'ATTIVA ORA'}
                                </span>
                                <button class="px-3.5 py-1.5 rounded-xl ${isReady ? 'bg-slate-900 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-black text-[10px] uppercase tracking-wider transition shadow-xs">
                                    ${isReady ? 'GESTISCI ➔' : 'ATTIVA ➔'}
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

        } else {
            // ── LIVELLO 1: CATEGORIE ──────────────────────────────────────────────
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
                    const sub = cat.subcategories || cat.products || [];
                    const macroLabel = cat.macrocategories === 'SOP' ? 'PROCEDURA' : (cat.macrocategories === 'SER' ? 'SERVIZIO' : 'PRODOTTO');
                    const macroBadge = cat.macrocategories === 'SOP' ? 'bg-blue-50 text-blue-700 border-blue-200' : (cat.macrocategories === 'SER' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-amber-50 text-amber-700 border-amber-200');
                    
                    const { icon: extractedIcon, text: cleanCatTitle } = splitShortName(cat.short_name || cat.name);
                    const cleanCatDesc = cleanLabelText(cat.name || '');
                    const catIcon = (cat.icon && cat.icon !== '📁') ? cat.icon : extractedIcon;

                    // Usa callback_data o name per identificare in modo inequivocabile la categoria al click
                    const catKey = (cat.callback_data || cat.name || cat.short_name || '').replace(/'/g, "\\'");

                    html += `
                        <div onclick="window.DesktopCatalogOverlay.selectCategory('${catKey}')" class="group relative bg-white border border-slate-200 hover:border-blue-500/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                            <div>
                                <div class="flex items-center justify-between mb-3.5">
                                    <div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition duration-200">
                                        ${catIcon}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${macroBadge}">
                                            ${macroLabel}
                                        </span>
                                        <button onclick="event.stopPropagation(); window.DesktopCatalogOverlay.deleteCategory('${catKey}', '${cleanCatTitle.replace(/'/g, "\\'")}')" class="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs transition cursor-pointer active:scale-90" title="Elimina Categoria">
                                            <i class="fas fa-trash text-[10px]"></i>
                                        </button>
                                    </div>
                                </div>

                                <h3 class="text-xs font-black uppercase text-slate-900 leading-tight group-hover:text-blue-600 transition mb-1.5">
                                    ${cleanCatTitle}
                                </h3>
                                <p class="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">
                                    ${cleanCatDesc}
                                </p>
                            </div>

                            <div class="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    ${sub.length} VOCI
                                </span>
                                <button class="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider transition shadow-xs">
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

    /**
     * Intercetta i click sui pulsanti di aggiunta aprendo in Finestra Flottante Multi-Tasking (In Primo Piano)
     */
    function openAddCategoryWindow() {
        initSessionParams();
        let url = `../gestione/add-category.html?macro=${overlayMacro}&ash=${encodeURIComponent(overlayAsh)}&msg=${encodeURIComponent(overlayMsg)}`;

        if (window.DesktopWindowManager) {
            window.DesktopWindowManager.openWindow({
                title: 'Nuova Categoria Merceologica',
                url: url,
                icon: 'fa-folder-plus',
                width: 460,
                height: 780
            });
        } else {
            window.location.href = url;
        }
    }

    function openAddProductWindow() {
        initSessionParams();
        let url = `../gestione/add-product.html?macro=${overlayMacro}&ash=${encodeURIComponent(overlayAsh)}&msg=${encodeURIComponent(overlayMsg)}`;
        if (activeCategory?.callback_data) url += `&catId=${encodeURIComponent(activeCategory.callback_data)}`;

        if (window.DesktopWindowManager) {
            window.DesktopWindowManager.openWindow({
                title: 'Nuovo Prodotto / Servizio',
                url: url,
                icon: 'fa-plus-circle',
                width: 460,
                height: 780
            });
        } else {
            window.location.href = url;
        }
    }

    // Esporta il controller globale per l'Overlay
    window.DesktopCatalogOverlay = {
        open: openCatalogOverlay,
        close: closeCatalogOverlay,
        toggleMaximize: toggleMaximizeOverlay,

        setMacro: function (m) {
            overlayMacro = m;
            overlayViewLevel = 'categories';
            activeCategory = null;
            activeProduct = null;
            renderOverlayContent();
        },

        setSearch: function (q) {
            overlaySearchQuery = (q || '').toLowerCase();
            renderOverlayContent();
        },

        selectCategory: function (catKey) {
            if (!cachedCatalog) return;
            const targetCat = cachedCatalog.find(c =>
                (c.callback_data && c.callback_data === catKey) ||
                (c.name && c.name === catKey) ||
                (c.short_name && c.short_name === catKey) ||
                cleanLabelText(c.name || '').toLowerCase() === (catKey || '').toLowerCase() ||
                cleanLabelText(c.short_name || '').toLowerCase() === (catKey || '').toLowerCase()
            );
            if (targetCat) {
                activeCategory = targetCat;
                overlayViewLevel = 'items';
                overlaySearchQuery = '';
                renderOverlayContent();
            } else {
                console.warn('[CatalogOverlay] Categoria non trovata per chiave:', catKey);
            }
        },

        selectProduct: function (subIdx) {
            if (!activeCategory || !activeCategory.subcategories) return;
            const prod = activeCategory.subcategories[subIdx];
            if (!prod) return;

            if (prod.blueprint_ready === true) {
                // Voce già attiva ➔ entra nelle Action Cards (Livello 3)
                enterActionsOverlay(prod);
            } else {
                // Voce suggerita ➔ apre la pagina di attivazione diretta (add-product.html)
                initSessionParams();
                const url = `../gestione/add-product.html?ash=${encodeURIComponent(overlayAsh)}&msg=${encodeURIComponent(overlayMsg)}&catId=${encodeURIComponent(activeCategory.callback_data)}&ghostId=${encodeURIComponent(prod.callback_data)}`;
                if (window.DesktopWindowManager) {
                    window.DesktopWindowManager.openWindow({
                        title: 'Attiva Voce — ' + cleanLabelText(prod.short_name || prod.name),
                        url: url,
                        icon: 'fa-plus-circle',
                        width: 920,
                        height: 680
                    });
                } else {
                    window.location.href = url;
                }
            }
        },

        triggerAction: function (actionId) {
            const cards = compileActionCardsOverlay();
            const card = cards.find(c => c.id === actionId);
            if (card && card.action) {
                card.action();
            }
        },

        backToCategories: function () {
            overlayViewLevel = 'categories';
            activeCategory = null;
            activeProduct = null;
            overlaySearchQuery = '';
            renderOverlayContent();
        },

        backToItems: function () {
            overlayViewLevel = 'items';
            activeProduct = null;
            overlaySearchQuery = '';
            renderOverlayContent();
        },

        openAddCategory: openAddCategoryWindow,
        openAddProduct: openAddProductWindow,
        deleteCategory: deleteCategoryDesktop,
        deleteProduct: deleteProductDesktop,
        bringToFront: bringOverlayToFront
    };

})(window);
