/**
 * phygital_local_first.js — SiTeBoS Phygital Onboarding Local-First Engine
 * 
 * Regola Architetturale: Nessuna chiamata o bozza inviata al server MongoDB prima di SUBMIT o SKIP_TO_DESK espliciti.
 * Tutta la bozza risiede in localStorage con chiave sitebos_{tenant_id}_{chat_id}_intake_draft.
 */

const PhygitalLocalFirst = (() => {
    const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest_user';
    const tenantId = window.SITEBOS_TENANT_ID || 'default_tenant';
    const DRAFT_KEY = `sitebos_${tenantId}_${chatId}_intake_draft`;
    const REWARD_KEY = `sitebos_${tenantId}_${chatId}_reward_draft`;

    /* ── READ / WRITE / CLEAR DRAFT LOCAL-FIRST ── */
    function saveDraft(data) {
        try {
            const current = loadDraft() || {};
            const updated = { ...current, ...data, updatedAt: Date.now() };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore salvataggio localStorage draft:', e);
            return null;
        }
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore lettura localStorage draft:', e);
            return null;
        }
    }

    function clearDraft() {
        try {
            localStorage.removeItem(DRAFT_KEY);
            localStorage.removeItem(REWARD_KEY);
            console.log('[PhygitalLocalFirst] Draft locale svuotato con successo.');
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore cancellazione draft:', e);
        }
    }

    /* ── SALVATAGGIO / RISCOSSIONE REWARD GAMIFICATION ── */
    function saveReward(rewardObj) {
        try {
            localStorage.setItem(REWARD_KEY, JSON.stringify({ ...rewardObj, savedAt: Date.now() }));
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore salvataggio reward:', e);
        }
    }

    function loadReward() {
        try {
            const raw = localStorage.getItem(REWARD_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    /* ── GENERAZIONE ASH HEADER DI SICUREZZA LOCAL-FIRST ── */
    function generateASHHeader(payload) {
        // Generazione hash di sessione autorizzato
        const secret = window.Telegram?.WebApp?.initData || 'SITEBOS_LOCAL_SESSION_SECRET';
        const str = JSON.stringify(payload) + secret;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return 'ash_v3_' + Math.abs(hash).toString(16);
    }

    /* ── EVENTO A: SUBMIT ESPLICITO DAL CLIENTE ── */
    async function submitIntake(proximityResult) {
        const draft = loadDraft();
        if (!draft || !draft.selected_services || draft.selected_services.length === 0) {
            return { ok: false, error: 'DRAFT_EMPTY', message: 'Seleziona almeno un servizio prima di inviare.' };
        }

        const reward = loadReward();
        const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

        const payload = {
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            proximity_validated: !!proximityResult.validated,
            station_id: proximityResult.station_id || null,
            proximity_method: proximityResult.method || 'UNKNOWN',
            selected_services: draft.selected_services,
            gpctba_answers: draft.gpctba_answers || {},
            loop_guard_counter: draft.loop_guard_counter || 0,
            addon_rewards: reward ? [reward] : [],
            idempotency_key: idempotencyKey,
            submitted_at: new Date().toISOString()
        };

        const ashHeader = generateASHHeader(payload);
        const delays = [0, 1000, 2000, 4000];
        let attempt = 0;

        while (attempt < delays.length) {
            if (delays[attempt] > 0) {
                await new Promise(r => setTimeout(r, delays[attempt]));
            }
            try {
                const response = await fetch('/webhook/sitebos-phygital-submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Authorized-Session-Hash': ashHeader
                    },
                    body: JSON.stringify(payload)
                });

                if (response.status === 200) {
                    const data = await response.json();
                    clearDraft();
                    return { ok: true, data };
                }
                
                if (response.status === 409) {
                    // Turno attivo già esistente per questo chat_id
                    showTurnoAttivoMessage();
                    return { ok: false, error: 'TURNO_ATTIVO_ESISTENTE', message: 'Hai già un turno attivo.' };
                }

                if (response.status === 403) {
                    return { ok: false, error: 'ASH_INVALID', message: 'Firma di sessione non valida.' };
                }
            } catch (err) {
                console.warn(`[PhygitalLocalFirst] Tentativo submit ${attempt + 1} fallito:`, err);
            }
            attempt++;
        }

        // Fallback Offline: salva il payload completo in localStorage per sincronizzazione differita alla riconnessione
        try {
            localStorage.setItem(`sitebos_${tenantId}_${chatId}_pending_submit`, JSON.stringify(payload));
        } catch (e) {}

        return { ok: false, error: 'NETWORK_OFFLINE', offlineSaved: true, message: 'Connessione assente. Invio salvato in locale.' };
    }

    /* ── EVENTO B: SKIP TO DESK (INTERVISTA ASSISTITA AL DESK) ── */
    async function skipToDesk() {
        const draft = loadDraft();
        if (!draft || !draft.selected_services || draft.selected_services.length === 0) {
            return { ok: false, error: 'NO_SERVICES_SELECTED', message: 'Seleziona almeno un servizio prima di richiedere l\'assistenza al desk.' };
        }

        const payload = {
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            status: 'DESK_ASSIST',
            selected_services: draft.selected_services,
            submitted_at: new Date().toISOString()
        };

        try {
            const response = await fetch('/webhook/sitebos-desk-assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                clearDraft();
                return { ok: true };
            }
            return { ok: false, error: 'SERVER_ERROR' };
        } catch (err) {
            console.error('[PhygitalLocalFirst] Errore skipToDesk:', err);
            return { ok: false, error: 'NETWORK_OFFLINE' };
        }
    }

    /* ── MOSTRA AVVISO 409 CONFLICT ("Il Cliente Propone, il Desk Dispone") ── */
    function showTurnoAttivoMessage() {
        const existing = document.getElementById('phygital-409-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'phygital-409-banner';
        banner.className = 'fixed bottom-20 left-4 right-4 bg-amber-950 border border-amber-700 rounded-2xl p-4 z-[999] text-sm text-amber-100 shadow-2xl flex items-start gap-3 animate-bounce';
        banner.innerHTML = `
            <i class="fa-solid fa-circle-info text-amber-400 text-lg mt-0.5 flex-shrink-0"></i>
            <div class="flex-1">
                <p class="font-bold text-white mb-1">Turno Già Attivo</p>
                <p class="text-xs text-amber-200/90 leading-relaxed">
                    Hai già un turno attivo sul tabellone. Se vuoi modificarlo o cancellarlo, rivolgiti alla nostra segreteria — ci pensiamo noi!
                </p>
            </div>
            <button onclick="this.parentElement.remove()" class="text-amber-400 text-xs font-bold px-2 py-1 bg-amber-900/60 rounded-lg">OK</button>
        `;
        document.body.appendChild(banner);
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 8000);
    }

    return {
        saveDraft,
        loadDraft,
        clearDraft,
        saveReward,
        loadReward,
        submitIntake,
        skipToDesk,
        showTurnoAttivoMessage
    };
})();

if (typeof window !== 'undefined') {
    window.PhygitalLocalFirst = PhygitalLocalFirst;
}
