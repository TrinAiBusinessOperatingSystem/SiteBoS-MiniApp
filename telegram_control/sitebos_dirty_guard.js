/**
 * SiteBoS MiniApp — Dirty-State Guard & Generation Lock Controller v5.3
 * Protocollo Zero-Build (Vanilla ES6+ UI, Cross-Window & Cross-Platform Protection)
 */
(function (window) {
    'use strict';

    const LOCK_WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/17a1bf79-43cd-428b-a497-33745ca44857";

    const _dirtyMap = new Map();       // scope -> { saveCallback, ttlSeconds }
    const _generatingMap = new Map();  // scope -> { label, conflictScopes, ttlSeconds }
    const _renewalTimers = new Map();  // scope -> timerId

    function getAsh() {
        try {
            const urlParams = new URLSearchParams(window.location.search || '');
            return urlParams.get('ash') || (window.Telegram?.WebApp?.initDataUnsafe?.start_param || '');
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

    /**
     * Invia evento 'acquire' o 'extend' al backend n8n / MongoDB
     */
    async function postLockAcquire(scope, ttlSeconds, extraData = {}) {
        const ash = getAsh();
        if (!ash || !scope) return;
        try {
            const payload = {
                _auth: window.Telegram?.WebApp?.initData || '',
                ash: ash,
                scope: scope,
                platform: isMobilePlatform() ? 'mobile' : 'desktop',
                action: 'acquire',
                ttl: ttlSeconds || 300,
                ...extraData
            };
            await fetch(LOCK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.warn('[SiteBosDirtyGuard] postLockAcquire warn:', e);
        }
    }

    /**
     * Invia evento 'release' tramite sendBeacon (affidabile anche in beforeunload)
     */
    function sendBeaconRelease(scope) {
        const ash = getAsh();
        if (!ash || !scope) return;
        try {
            const payload = JSON.stringify({
                _auth: window.Telegram?.WebApp?.initData || '',
                ash: ash,
                scope: scope,
                platform: isMobilePlatform() ? 'mobile' : 'desktop',
                action: 'release'
            });
            if (navigator.sendBeacon) {
                navigator.sendBeacon(LOCK_WEBHOOK_URL, new Blob([payload], { type: 'application/json' }));
            } else {
                fetch(LOCK_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(() => {});
            }
        } catch (e) {
            console.warn('[SiteBosDirtyGuard] sendBeaconRelease warn:', e);
        }
    }

    /**
     * Programma il renewal automatico del lock a 80% del TTL
     */
    function scheduleRenewal(scope, ttlSeconds, isGenerating = false) {
        clearTimeout(_renewalTimers.get(scope));
        const renewAt = Math.max(10, Math.floor((ttlSeconds || 300) * 0.80)) * 1000;
        const timerId = setTimeout(() => {
            if (isGenerating && _generatingMap.has(scope)) {
                const info = _generatingMap.get(scope);
                postLockAcquire(scope, info.ttlSeconds, { label: info.label, conflictScopes: info.conflictScopes });
                scheduleRenewal(scope, info.ttlSeconds, true);
            } else if (!isGenerating && _dirtyMap.has(scope)) {
                const info = _dirtyMap.get(scope);
                postLockAcquire(scope, info.ttlSeconds);
                scheduleRenewal(scope, info.ttlSeconds, false);
            }
        }, renewAt);
        _renewalTimers.set(scope, timerId);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // API PUBBLICA
    // ──────────────────────────────────────────────────────────────────────────

    function markDirty(scope, saveCallback, ttlSeconds = 300) {
        if (!scope) scope = 'default_scope';
        _dirtyMap.set(scope, { saveCallback, ttlSeconds });
        postLockAcquire(scope, ttlSeconds, { type: 'dirty' });
        scheduleRenewal(scope, ttlSeconds, false);

        // Propaga al parent window se siamo in un iframe
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard._syncIframeDirty(scope, true);
            }
        } catch (_) {}
    }

    function markClean(scope) {
        if (!scope) scope = 'default_scope';
        _dirtyMap.delete(scope);
        clearTimeout(_renewalTimers.get(scope));
        _renewalTimers.delete(scope);
        sendBeaconRelease(scope);

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
        postLockAcquire(scope, ttlSeconds, { type: 'generating', label, conflictScopes });
        scheduleRenewal(scope, ttlSeconds, true);
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
        clearTimeout(_renewalTimers.get(scope));
        _renewalTimers.delete(scope);
        sendBeaconRelease(scope);
        renderGeneratingBadge();

        // Propaga al parent window
        try {
            if (window.parent && window.parent !== window && window.parent.SiteBosDirtyGuard) {
                window.parent.SiteBosDirtyGuard.markGeneratingDone(scope);
            }
        } catch (_) {}
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
            _dirtyMap.clear();
            _renewalTimers.forEach(t => clearTimeout(t));
            _renewalTimers.clear();
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

    // 1. Release automatico al prima della chiusura pagina
    window.addEventListener('beforeunload', function (e) {
        if (isAnyDirty()) {
            e.preventDefault();
            e.returnValue = 'Hai modifiche non salvate.';
        }
        for (let scope of _dirtyMap.keys()) sendBeaconRelease(scope);
        for (let scope of _generatingMap.keys()) sendBeaconRelease(scope);
    });

    window.addEventListener('pagehide', function () {
        for (let scope of _dirtyMap.keys()) sendBeaconRelease(scope);
        for (let scope of _generatingMap.keys()) sendBeaconRelease(scope);
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

    // 3. Auto-Attach per catturare automaticamente qualsiasi modifica nei form
    function autoAttachFormListeners() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/userguide/') || path.includes('/customer_bot/')) return;

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
        isAnyDirty,
        isAnyGenerating,
        getConflictingGeneration,
        requestNavigateAway,
        _syncIframeDirty
    };

})(window);
