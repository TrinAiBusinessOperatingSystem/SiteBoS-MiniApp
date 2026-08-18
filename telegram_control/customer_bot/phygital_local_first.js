/**
 * phygital_local_first.js — SiTeBoS Phygital Onboarding Local-First Engine
 * 
 * Regola Architetturale: Nessuna chiamata o bozza inviata al server MongoDB prima di SUBMIT o SKIP_TO_DESK espliciti.
 * Tutta la bozza risiede in localStorage con chiave sitebos_{tenant_id}_{chat_id}_intake_draft.
 * Tutte le chiamate backend sono consolidate sull'endpoint canonico:
 * https://prod.workflow.trinai.it/webhook/sitebos-phygital-checkin
 */

const PhygitalLocalFirst = (() => {
    'use strict';

    const WEBHOOK_BASE = 'https://prod.workflow.trinai.it/webhook/sitebos-phygital-checkin';

    const chatId = (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) 
        ? String(window.Telegram.WebApp.initDataUnsafe.user.id) 
        : (new URLSearchParams(window.location.search).get('chat_id') || 'guest_user');
    
    const tenantId = window.SITEBOS_TENANT_ID 
        || (new URLSearchParams(window.location.search).get('vat')) 
        || 'default_tenant';

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

    function checkOnlineGate() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            showOfflineGateBanner();
            return false;
        }
        return true;
    }

    function showOfflineGateBanner() {
        const existing = document.getElementById('sitebos-offline-gate-banner');
        if (existing) return;

        const banner = document.createElement('div');
        banner.id = 'sitebos-offline-gate-banner';
        banner.className = 'fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-6 text-center text-white';
        banner.innerHTML = `
            <div class="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4">
                <i class="fas fa-wifi-slash text-2xl text-red-400"></i>
            </div>
            <h2 class="text-xl font-black uppercase tracking-tight mb-2">Connessione Internet Richiesta</h2>
            <p class="text-xs text-slate-300 max-w-xs leading-relaxed mb-6">
                L'applicazione SiTeBoS richiede una connessione internet attiva per sincronizzare i tuoi dati. Collegati ad una rete per procedere.
            </p>
            <button onclick="window.location.reload()" class="bg-white text-slate-950 font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition">
                <i class="fas fa-rotate-right mr-2"></i> Riprova Connessione
            </button>
        `;
        document.body.appendChild(banner);
    }

    /* ── EVENTO A: SUBMIT ESPLICITO DAL CLIENTE ── */
    async function submitIntake(proximityResult) {
        const draft = loadDraft();
        if (!draft || !draft.selected_services || draft.selected_services.length === 0) {
            return { ok: false, error: 'DRAFT_EMPTY', message: 'Seleziona almeno un servizio prima di inviare.' };
        }

        const reward = loadReward();
        const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : ('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));

        const payload = {
            action: 'submit_intake',
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            proximity_validated: !!(proximityResult && proximityResult.validated),
            station_id: (proximityResult && proximityResult.station_id) || null,
            proximity_method: (proximityResult && proximityResult.method) || 'UNKNOWN',
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
                const response = await fetch(WEBHOOK_BASE, {
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

        // Fallback Offline: salva il payload in localStorage
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
            action: 'skip_to_desk',
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            status: 'DESK_ASSIST',
            selected_services: draft.selected_services,
            submitted_at: new Date().toISOString()
        };

        try {
            const response = await fetch(WEBHOOK_BASE, {
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

    /* ── EVENTO C: CHECK-IN AUTOMATICO VIA PROBE PROSSIMITÀ IP DESK BOARD ── */
    async function checkWifiGuestProximity() {
        try {
            const response = await fetch(WEBHOOK_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'wifi_proximity_probe',
                    chat_id: String(chatId),
                    tenant_id: String(tenantId)
                })
            });
            if (response.ok) {
                const result = await response.json();
                if (result && result.is_wifi_guest) {
                    return { validated: true, method: 'IP_MATCH', is_wifi_guest: true };
                }
            }
        } catch (e) {
            console.warn('[PhygitalLocalFirst] Probe Wi-Fi Prossimità IP non disponibile:', e);
        }
        return { validated: false, method: 'NONE', is_wifi_guest: false };
    }

    /* ── EVENTO D: INOLTRO CHECK-IN AL DESK BOARD ── */
    async function submitWifiCheckin(wifiInfo) {
        if (!checkOnlineGate()) return { ok: false, error: 'OFFLINE' };

        const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
        const fullName = user?.first_name 
            ? `${user.first_name} ${user.last_name || ''}`.trim()
            : 'Cliente in Sala d\'Attesa';

        const payload = {
            action: 'wifi_guest_checkin',
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            customer_name: fullName,
            proximity_validated: true,
            proximity_method: wifiInfo?.method || 'IP_MATCH',
            submitted_at: new Date().toISOString()
        };

        const ashHeader = generateASHHeader(payload);
        try {
            const response = await fetch(WEBHOOK_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorized-Session-Hash': ashHeader
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return { ok: true, data };
            }
        } catch (err) {
            console.error('[PhygitalLocalFirst] Errore submit Wi-Fi check-in:', err);
        }
        return { ok: false };
    }

    /* ── PROFILO PSICOMETRICO / GAMIFICATION TELEMETRIA ── */
    const CX_PROFILE_KEY = `sitebos_${tenantId}_${chatId}_cx_profile`;

    function saveCxProfile(cxProfileObj, economyProfileObj) {
        try {
            const data = {
                cx_profile: cxProfileObj,
                economy_profile: economyProfileObj,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(CX_PROFILE_KEY, JSON.stringify(data));
            return data;
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore salvataggio cx_profile:', e);
            return null;
        }
    }

    function loadCxProfile() {
        try {
            const raw = localStorage.getItem(CX_PROFILE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    async function submitCxProfile(cxProfileObj, economyProfileObj, gamesPlayed, prizesAwarded) {
        saveCxProfile(cxProfileObj, economyProfileObj);

        // Sincronizzazione sul Passaporto Cliente cross-owner (network_loyalty + psychometric_profile).
        // +150pt per minigioco completato, flat e non legato al punteggio (AGENTS.md §2.11: profilazione
        // esclusivamente motivazionale, mai punitiva). Un solo evento anche a fronte di più giochi in sessione.
        if (window.SitebosPassport) {
            const gamesCount = Array.isArray(gamesPlayed) && gamesPlayed.length > 0 ? gamesPlayed.length : 1;
            window.SitebosPassport.persistAction({
                network_loyalty_delta: { points_change: gamesCount * 150 },
                owner_vat: String(tenantId),
                psychometric_snapshot: cxProfileObj || {}
            });
        }

        if (!checkOnlineGate()) return { ok: false, error: 'OFFLINE' };

        const payload = {
            action: 'gamification_telemetry',
            chat_id: String(chatId),
            tenant_id: String(tenantId),
            proximity_method: 'IP_MATCH',
            cx_profile_snapshot: cxProfileObj || {},
            economy_profile: economyProfileObj || {},
            games_played: gamesPlayed || [],
            prizes_awarded: prizesAwarded || [],
            submitted_at: new Date().toISOString()
        };

        try {
            const response = await fetch(WEBHOOK_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                return { ok: true, data };
            }
        } catch (err) {
            console.error('[PhygitalLocalFirst] Errore submitCxProfile:', err);
        }
        return { ok: false };
    }

    async function redeemAddonVoucher(addonPayload) {
        try {
            const draft = loadDraft() || {};
            const appliedAddons = draft.applied_addons || [];
            appliedAddons.push(addonPayload);
            const updatedDraft = saveDraft({ applied_addons: appliedAddons });

            saveReward(addonPayload);

            if (checkOnlineGate()) {
                await fetch(WEBHOOK_BASE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'voucher_addon_applied',
                        chat_id: String(chatId),
                        tenant_id: String(tenantId),
                        applied_addon: addonPayload,
                        full_draft: updatedDraft
                    })
                });
            }
            return { ok: true, updatedDraft };
        } catch (e) {
            console.error('[PhygitalLocalFirst] Errore redeemAddonVoucher:', e);
            return { ok: false, error: e };
        }
    }

    return {
        saveDraft,
        loadDraft,
        clearDraft,
        saveReward,
        loadReward,
        saveCxProfile,
        loadCxProfile,
        submitCxProfile,
        redeemAddonVoucher,
        submitIntake,
        skipToDesk,
        showTurnoAttivoMessage,
        checkWifiGuestProximity,
        submitWifiCheckin,
        checkOnlineGate
    };
})();

if (typeof window !== 'undefined') {
    window.PhygitalLocalFirst = PhygitalLocalFirst;
}
