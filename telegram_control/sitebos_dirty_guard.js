/**
 * SiteBoS MiniApp — Dirty-State Guard & Generation Lock Controller v6.0
 * Protocollo Zero-Build (Vanilla ES6+ UI, Cross-Window & Cross-Platform Protection)
 * v6.0: trasporto anti-doppia-sessione migrato da Lock-Manager/Mongo (TTL manuale,
 * mai realmente enforced) ad Ably Presence (rilevamento disconnessione automatico,
 * enforcement reale via checkOccupied). Il Lock-Manager Mongo resta invariato e
 * separato, usato solo dal mutex interno di fatturazione Gemini.
 */
(function (window) {
    'use strict';

    const ABLY_SDK_URL = 'https://cdn.ably.com/lib/ably.min.js';
    const REALTIME_ENDPOINT = "https://prod.workflow.trinai.it/webhook/sitebos-operator-sse-stream";

    const _dirtyMap = new Map();       // scope -> { saveCallback, ttlSeconds }
    const _generatingMap = new Map();  // scope -> { label, conflictScopes, ttlSeconds }
    const _acquiredScopes = new Set(); // scope -> presenza già inviata via Ably per questo scope (dirty)
    const _presentScopes = new Set();  // scope -> presenza incondizionata (markPresent/markAbsent)
    const _channels = new Map();       // scope -> Ably RealtimeChannel già pronto

    let _clientId = null;
    let _ablyLoadingPromise = null;

    function getAsh() {
        try {
            const stored = sessionStorage.getItem('sitebos_access_token');
            if (stored) return stored;
        } catch (_) {}
        try {
            const urlParams = new URLSearchParams(window.location.search || '');
            const urlAsh = urlParams.get('ash');
            if (urlAsh) return urlAsh;
        } catch (_) {}
        try {
            return window.Telegram?.WebApp?.initDataUnsafe?.start_param || '';
        } catch (_) { return ''; }
    }

    function isMobilePlatform() {
        const tg = window.Telegram?.WebApp;
        const platform = (tg?.platform || '').toLowerCase();
        if (['android', 'ios', 'mobile'].includes(platform)) return true;
        if (['tdesktop', 'desktop', 'macos', 'weba', 'webk'].includes(platform)) return false;
        const ua = (navigator.userAgent || '').toLowerCase();
        if (/android|iphone|ipad|ipod|windows phone|iemobile|mobile/i.test(ua)) return true;
        return (window.innerWidth < 768);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TRASPORTO ABLY PRESENCE (sostituisce il vecchio acquire/release su Mongo)
    // ──────────────────────────────────────────────────────────────────────────

    function getClientId() {
        if (_clientId) return _clientId;
        try {
            let id = sessionStorage.getItem('sitebos_presence_client_id');
            if (!id) {
                id = (window.crypto?.randomUUID)
                    ? window.crypto.randomUUID()
                    : ('sess_' + Date.now() + '_' + Math.random().toString(36).slice(2));
                sessionStorage.setItem('sitebos_presence_client_id', id);
            }
            _clientId = id;
        } catch (_) {
            _clientId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2);
        }
        return _clientId;
    }

    function loadAblySdk() {
        if (window.Ably) return Promise.resolve();
        if (_ablyLoadingPromise) return _ablyLoadingPromise;
        _ablyLoadingPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = ABLY_SDK_URL;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Impossibile caricare Ably SDK'));
            document.head.appendChild(script);
        });
        return _ablyLoadingPromise;
    }

    async function fetchAblyToken(scope) {
        const ash = getAsh();
        if (!ash) throw new Error('ASH non disponibile per la richiesta token Ably.');
        const response = await fetch(REALTIME_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_ably_token', ash: ash, scope: scope })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} da get_ably_token`);
        const data = await response.json();
        if (!data || !data.token || !data.channel) {
            throw new Error(data?.error || 'Risposta get_ably_token incompleta.');
        }
        return data;
    }

    /**
     * Restituisce (creandolo se serve) il canale Ably Presence per uno scope.
     * Un client Realtime dedicato per scope: ogni token emesso dal backend è
     * già limitato a quel singolo canale, niente da condividere fra scope diversi.
     */
    async function getPresenceChannel(scope) {
        if (_channels.has(scope)) return _channels.get(scope);

        await loadAblySdk();
        const bootstrap = await fetchAblyToken(scope);
        const channelName = bootstrap.channel;

        const client = new window.Ably.Realtime({
            clientId: getClientId(),
            token: bootstrap.token,
            authCallback: async function (tokenParams, callback) {
                try {
                    const data = await fetchAblyToken(scope);
                    callback(null, data.token);
                } catch (err) {
                    callback(err, null);
                }
            }
        });

        const channel = client.channels.get(channelName);
        _channels.set(scope, channel);
        return channel;
    }

    /**
     * Entra in presenza su uno scope, dopo aver verificato che nessun'altra
     * sessione (clientId diverso) sia già presente. Fail-open su errori di
     * rete/Ably: non deve mai bloccare l'operatività per un problema di
     * connessione al canale realtime.
     */
    async function presenceEnter(scope, extraData) {
        try {
            const channel = await getPresenceChannel(scope);
            const members = await channel.presence.get();
            const others = (members || []).filter(m => m.clientId !== getClientId());
            if (others.length > 0) {
                return { occupied: true, by: others[0].data || null };
            }
            await channel.presence.enter(Object.assign({
                platform: isMobilePlatform() ? 'mobile' : 'desktop',
                entered_at: new Date().toISOString()
            }, extraData || {}));
            return { occupied: false };
        } catch (e) {
            console.warn('[SiteBosDirtyGuard] presenceEnter warn:', e);
            return { occupied: false };
        }
    }

    async function presenceLeave(scope) {
        try {
            const channel = _channels.get(scope);
            if (!channel) return;
            await channel.presence.leave();
        } catch (e) {
            console.warn('[SiteBosDirtyGuard] presenceLeave warn:', e);
        }
    }

    /**
     * Controllo reale, senza entrare in presenza: "questo scope è occupato da
     * un'altra sessione adesso?" — prima assente nel sistema (il vecchio
     * acquire era fire-and-forget, mai verificato).
     */
    async function checkOccupied(scope) {
        try {
            const channel = await getPresenceChannel(scope);
            const members = await channel.presence.get();
            const others = (members || []).filter(m => m.clientId !== getClientId());
            if (others.length > 0) {
                return { occupied: true, by: others[0].data || null };
            }
            return { occupied: false, by: null };
        } catch (e) {
            console.warn('[SiteBosDirtyGuard] checkOccupied warn:', e);
            return { occupied: false, by: null };
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // API PUBBLICA
    // ──────────────────────────────────────────────────────────────────────────

    function markDirty(scope, saveCallback, ttlSeconds = 300) {
        if (!scope) scope = 'default_scope';

        // Se lo scope è già marcato dirty o è già in presenza, ignoriamo la chiamata duplicata!
        if (_acquiredScopes.has(scope) || _dirtyMap.has(scope)) {
            _dirtyMap.set(scope, { saveCallback, ttlSeconds });
            return;
        }

        _dirtyMap.set(scope, { saveCallback, ttlSeconds });
        _acquiredScopes.add(scope);

        presenceEnter(scope, { type: 'dirty' });

        // Propaga al parent window se siamo in un iframe (SENZA rieseguire la chiamata dal parent!)
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard._syncIframeDirty(scope, true);
            }
        } catch (_) {}
    }

    function markClean(scope) {
        if (!scope) scope = 'default_scope';
        _dirtyMap.delete(scope);
        _acquiredScopes.delete(scope);
        presenceLeave(scope);

        // Propaga al parent window se siamo in un iframe
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard._syncIframeDirty(scope, false);
            }
        } catch (_) {}
    }

    function markGenerating(scope, label, conflictScopes = [], ttlSeconds = 600) {
        if (!scope) scope = 'default_gen';
        _generatingMap.set(scope, { label: label || 'Operazione IA', conflictScopes, ttlSeconds });
        presenceEnter(scope, { type: 'generating', label, conflictScopes });
        renderGeneratingBadge();

        // Propaga al parent window
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard.markGenerating(scope, label, conflictScopes, ttlSeconds);
            }
        } catch (_) {}
    }

    function markGeneratingDone(scope) {
        if (!scope) scope = 'default_gen';
        _generatingMap.delete(scope);
        presenceLeave(scope);
        renderGeneratingBadge();

        // Propaga al parent window
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard.markGeneratingDone(scope);
            }
        } catch (_) {}
    }

    /**
     * Presenza incondizionata: a differenza di markDirty (che scatta solo alla
     * prima modifica di un form), qui il blocco vale dalla semplice apertura
     * della pagina — per superfici come la Desk Board.
     */
    function markPresent(scope) {
        if (!scope) scope = 'default_scope';
        if (_presentScopes.has(scope)) return;
        _presentScopes.add(scope);
        presenceEnter(scope, { type: 'present' });
    }

    function markAbsent(scope) {
        if (!scope) scope = 'default_scope';
        _presentScopes.delete(scope);
        presenceLeave(scope);
    }

    function isAnyDirty() {
        return _dirtyMap.size > 0;
    }

    function isAnyGenerating() {
        return _generatingMap.size > 0;
    }

    function getConflictingGeneration(targetScope) {
        if (!targetScope) return null;
        for (let [scope, info] of _generatingMap.entries()) {
            if (scope === targetScope || (info.conflictScopes && info.conflictScopes.includes(targetScope))) {
                return { scope, ...info };
            }
        }
        return null;
    }

    // Interfaccia di sincronizzazione per i parent
    function _syncIframeDirty(scope, isDirty) {
        if (isDirty) {
            _dirtyMap.set(scope, { saveCallback: null, ttlSeconds: 300 });
        } else {
            _dirtyMap.delete(scope);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // INTERFACCIA VISIVA: MODALE DIRTY & SOFT TOAST CONFLITTO & MINI BADGE
    // ──────────────────────────────────────────────────────────────────────────

    function renderGeneratingBadge() {
        let badgeEl = document.getElementById('sitebos-generating-badge');
        if (_generatingMap.size === 0) {
            if (badgeEl) badgeEl.remove();
            return;
        }

        const activeGen = Array.from(_generatingMap.values())[0];
        const labelText = activeGen ? activeGen.label : 'Generazione in corso';

        if (!badgeEl) {
            badgeEl = document.createElement('div');
            badgeEl.id = 'sitebos-generating-badge';
            badgeEl.className = 'fixed top-4 right-4 z-[99990] flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-400 backdrop-blur-md shadow-lg text-[10px] font-black uppercase tracking-widest transition animate-bounce-subtle cursor-pointer';
            badgeEl.title = 'Generazione IA in corso in background';
            document.body.appendChild(badgeEl);
        }

        badgeEl.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <i class="fas fa-gear animate-spin text-cyan-400 text-xs"></i>
            <span>${labelText}</span>
        `;
    }

    function requestNavigateAway(targetScope, proceedCallback) {
        // 1. Check Se ci sono modifiche non salvate (DIRTY STATE) -> Modale Bloccante
        if (isAnyDirty()) {
            renderDirtyModal(proceedCallback);
            return false;
        }

        // 2. Check Se lo targetScope va in CONFLITTO DIRETTO con una generazione attiva -> Toast Soft Non-Bloccante
        const conflict = getConflictingGeneration(targetScope);
        if (conflict) {
            renderConflictToast(conflict, proceedCallback);
            return false;
        }

        // Nessun blocco -> Procedi liberamente
        if (typeof proceedCallback === 'function') proceedCallback();
        return true;
    }

    function renderDirtyModal(proceedCallback) {
        let overlay = document.getElementById('sitebos-dirty-modal-overlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'sitebos-dirty-modal-overlay';
        overlay.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[999999] flex items-center justify-center p-4 transition-opacity duration-200';
        overlay.innerHTML = `
            <div class="bg-white/95 border border-slate-200/80 p-6 rounded-3xl w-full max-w-sm shadow-2xl backdrop-blur-2xl text-center text-slate-900 flex flex-col items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-2xl shadow-sm">
                    <i class="fas fa-pen-to-square"></i>
                </div>
                <div>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 border border-amber-200 text-[9px] font-black uppercase tracking-widest text-amber-800 mb-2">
                        MODIFICHE NON SALVATE
                    </div>
                    <h3 class="text-xs font-black uppercase tracking-wide text-slate-900 leading-tight">Attenzione: Dati non salvati</h3>
                    <p class="text-xs text-slate-600 font-semibold mt-2 leading-relaxed">
                        Hai effettuato delle modifiche in questa pagina. Se esci ora, le informazioni inserite andranno perse.
                    </p>
                </div>
                <div class="w-full flex flex-col gap-2">
                    <button id="sitebos-save-and-leave-btn" class="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2">
                        <i class="fas fa-floppy-disk text-xs"></i> Salva e Continua
                    </button>
                    <button id="sitebos-abandon-btn" class="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2">
                        <i class="fas fa-trash-arrow-up text-xs text-red-500"></i> Abbandona Modifiche
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const saveBtn = overlay.querySelector('#sitebos-save-and-leave-btn');
        const abandonBtn = overlay.querySelector('#sitebos-abandon-btn');

        saveBtn.addEventListener('click', async function () {
            // Esegui i save callback di tutti gli scope dirty
            for (let [scope, info] of _dirtyMap.entries()) {
                if (typeof info.saveCallback === 'function') {
                    try { await info.saveCallback(); } catch (e) { console.error('Error during save:', e); }
                }
                markClean(scope);
            }
            overlay.remove();
            if (typeof proceedCallback === 'function') proceedCallback();
        });

        abandonBtn.addEventListener('click', function () {
            const scopesToClean = Array.from(new Set([..._dirtyMap.keys(), ..._acquiredScopes]));
            scopesToClean.forEach(scope => markClean(scope));
            _dirtyMap.clear();
            _acquiredScopes.clear();
            overlay.remove();
            if (typeof proceedCallback === 'function') proceedCallback();
        });
    }

    function renderConflictToast(conflictInfo, proceedCallback) {
        let toast = document.getElementById('sitebos-conflict-toast');
        if (toast) toast.remove();

        toast = document.createElement('div');
        toast.id = 'sitebos-conflict-toast';
        toast.className = 'fixed bottom-6 right-6 z-[999995] bg-slate-900/95 border border-cyan-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-white w-80 max-w-[90vw] flex flex-col gap-3 transition-all duration-300 animate-slide-up';
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <i class="fas fa-triangle-exclamation text-sm"></i>
                </div>
                <div class="flex-1">
                    <h4 class="text-[10px] font-black uppercase tracking-wider text-cyan-400">Generazione in Corso</h4>
                    <p class="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                        <b>${conflictInfo.label}</b> è attualmente in corso. Aprire questo strumento potrebbe interromperla.
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button id="sitebos-toast-wait-btn" class="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider text-slate-200 transition cursor-pointer">
                    ⏳ Aspetta
                </button>
                <button id="sitebos-toast-continue-btn" class="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer">
                    → Continua
                </button>
            </div>
        `;
        document.body.appendChild(toast);

        toast.querySelector('#sitebos-toast-wait-btn').addEventListener('click', function () {
            toast.remove();
        });

        toast.querySelector('#sitebos-toast-continue-btn').addEventListener('click', function () {
            markGeneratingDone(conflictInfo.scope);
            toast.remove();
            if (typeof proceedCallback === 'function') proceedCallback();
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // HOOKS NATIVI (BEFOREUNLOAD, TELEGRAM BACK BUTTON, POPSTATE)
    // ──────────────────────────────────────────────────────────────────────────

    // 1. Release automatico alla chiusura pagina. Ably rileva comunque la
    // disconnessione da sola entro pochi secondi anche se questo non arriva
    // a completarsi in tempo — a differenza del vecchio TTL manuale, qui è
    // solo un'ottimizzazione per il rilascio immediato, non l'unica rete di sicurezza.
    window.addEventListener('beforeunload', function (e) {
        if (isAnyDirty()) {
            e.preventDefault();
            e.returnValue = 'Hai modifiche non salvate.';
        }
        const allScopes = new Set([..._dirtyMap.keys(), ..._acquiredScopes, ..._presentScopes]);
        for (let scope of allScopes) presenceLeave(scope);
        for (let scope of _generatingMap.keys()) presenceLeave(scope);
    });

    window.addEventListener('pagehide', function () {
        const allScopes = new Set([..._dirtyMap.keys(), ..._acquiredScopes, ..._presentScopes]);
        for (let scope of allScopes) presenceLeave(scope);
        for (let scope of _generatingMap.keys()) presenceLeave(scope);
    });

    // 2. Intercettazione Telegram Back Button su Mobile
    function setupTelegramBackButtonHandler() {
        const tg = window.Telegram?.WebApp;
        if (!tg || !tg.BackButton) return;

        tg.BackButton.onClick(function () {
            if (isAnyDirty()) {
                requestNavigateAway(null, function () {
                    window.history.back();
                });
            } else {
                window.history.back();
            }
        });
    }

    /**
     * Blocco reale all'apertura di una sezione guardata: prima d'ora il
     * sistema registrava solo "sto modificando questo" senza mai verificare
     * se qualcun altro lo stava già facendo. Fail-open per costruzione.
     */
    async function checkAndBlockIfOccupied(scope) {
        const { occupied } = await checkOccupied(scope);
        if (!occupied) return;

        let overlay = document.getElementById('sitebos-occupied-overlay');
        if (overlay) return; // già mostrato

        overlay = document.createElement('div');
        overlay.id = 'sitebos-occupied-overlay';
        overlay.className = 'fixed inset-0 z-[999998] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center text-slate-900';
        overlay.innerHTML = `
            <div class="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto animate-pulse">
                    <i class="fa-solid fa-user-group text-3xl"></i>
                </div>
                <div class="space-y-2">
                    <h2 class="text-lg font-black text-slate-900">Sezione già aperta altrove</h2>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Questa sezione risulta già aperta su un altro dispositivo o un'altra scheda. Per evitare di sovrascrivere modifiche, chiudi l'altra sessione prima di continuare.
                    </p>
                </div>
                <div class="space-y-3 pt-2">
                    <button id="sitebos-occupied-recheck-btn" class="w-full bg-slate-900 hover:bg-black active:scale-95 text-white font-black text-xs py-3.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-2">
                        <i class="fa-solid fa-rotate text-base"></i>
                        <span>Ricontrolla adesso</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#sitebos-occupied-recheck-btn').addEventListener('click', async function () {
            const result = await checkOccupied(scope);
            if (!result.occupied) overlay.remove();
        });
    }

    // 3. Auto-Attach per catturare automaticamente qualsiasi modifica nei form
    function autoAttachFormListeners() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/userguide/') || path.includes('/customer_bot/') || path.includes('/dashboard/dashboard.html')) return;

        const scope = (function () {
            if (path.includes('/identity/') || path.includes('bot_config') || path.includes('edit_owner') || path.includes('advanced-setup')) return 'identity';
            if (path.includes('catalog') || path.includes('add-') || path.includes('edit-')) return 'catalog';
            if (path.includes('supervisor')) return 'supervisor';
            if (path.includes('orders')) return 'orders';
            if (path.includes('job') || path.includes('itinerari')) return 'jobs';
            if (path.includes('safety') || path.includes('sicurezza')) return 'agents_safety';
            if (path.includes('controllo') || path.includes('gestione')) return 'agents_control';
            if (path.includes('fine-tuning')) return 'fine_tuning';
            return 'generic_edit';
        })();

        checkAndBlockIfOccupied(scope);

        document.addEventListener('input', function (e) {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                if (!target.dataset.noGuard && target.type !== 'hidden' && target.type !== 'search') {
                    markDirty(scope);
                }
            }
        }, true);

        document.addEventListener('change', function (e) {
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                if (!target.dataset.noGuard && target.type !== 'hidden' && target.type !== 'search') {
                    markDirty(scope);
                }
            }
        }, true);

        document.addEventListener('click', function (e) {
            const btn = e.target.closest('button, input[type="submit"], a');
            if (!btn) return;
            const btnText = (btn.innerText || btn.value || btn.id || btn.className || '').toLowerCase();
            if (btnText.includes('salva') || btnText.includes('conferma') || btnText.includes('save') || btnText.includes('submit')) {
                markClean(scope);
            }
        }, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            setupTelegramBackButtonHandler();
            autoAttachFormListeners();
        });
    } else {
        setupTelegramBackButtonHandler();
        autoAttachFormListeners();
    }

    // Esporta nel namespace globale
    window.SiteBosDirtyGuard = {
        markDirty,
        markClean,
        markGenerating,
        markGeneratingDone,
        markPresent,
        markAbsent,
        checkOccupied,
        isAnyDirty,
        isAnyGenerating,
        getConflictingGeneration,
        requestNavigateAway,
        _syncIframeDirty
    };

})(window);
