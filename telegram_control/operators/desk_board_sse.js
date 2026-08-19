/**
 * desk_board_sse.js
 * SiteBoS Operator Stream - Gestore Ably Realtime Client (Zero-PII)
 * Ricezione aggiornamenti in tempo reale sul Tabellone Kanban Operatori
 */

(function (window) {
    'use strict';

    const SSE_ENDPOINT = 'https://prod.workflow.trinai.it/webhook/sitebos-operator-sse-stream';
    const REALTIME_ENDPOINT = SSE_ENDPOINT;

    let ablyInstance = null;
    let currentChannel = null;
    let activeChannelName = null;
    let sseStatus = 'OFF'; // 'OFF' | 'CONNECTING' | 'LIVE'

    function getAuthAsh() {
        if (typeof window.getAshParam === 'function') {
            return window.getAshParam();
        }
        if (typeof getAshParam === 'function') {
            return getAshParam();
        }
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ash') || (window.TwaGuard?.requireAsh?.()) || '';
    }

    function initSSEConnection() {
        if (!window.Ably) {
            console.warn('⚠️ Ably JS SDK non disponibile. Utilizzo fallback Local-First.');
            updateSSEBadge('OFF');
            return;
        }

        if (ablyInstance) {
            try {
                ablyInstance.close();
            } catch (err) {
                console.warn('Avviso chiusura istanza Ably precedente:', err);
            }
            ablyInstance = null;
            currentChannel = null;
        }

        updateSSEBadge('CONNECTING');

        try {
            ablyInstance = new window.Ably.Realtime({
                authCallback: async function (tokenParams, callback) {
                    try {
                        const ash = getAuthAsh();
                        const response = await fetch(REALTIME_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'get_ably_token',
                                ash: ash
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error ${response.status} da get_ably_token`);
                        }

                        const data = await response.json();
                        if (data && data.token) {
                            if (data.channel) {
                                activeChannelName = data.channel;
                                subscribeToChannel(data.channel);
                            }
                            callback(null, data.token);
                        } else {
                            const errorMsg = data?.error || 'Token Ably non trovato nella risposta del server.';
                            console.error('❌ Errore token Ably:', errorMsg);
                            callback(new Error(errorMsg), null);
                        }
                    } catch (err) {
                        console.error('❌ Errore authCallback Ably:', err);
                        callback(err, null);
                    }
                }
            });

            ablyInstance.connection.on('connecting', function () {
                console.log('🟡 [Ably Live] Connessione in corso...');
                sseStatus = 'CONNECTING';
                updateSSEBadge('CONNECTING');
            });

            ablyInstance.connection.on('connected', function () {
                console.log('🟢 [Ably Live] Connessione realtime attivata.');
                sseStatus = 'LIVE';
                updateSSEBadge('LIVE');
                if (activeChannelName) {
                    subscribeToChannel(activeChannelName);
                }
            });

            ablyInstance.connection.on('disconnected', function () {
                console.warn('🟡 [Ably Live] Connessione interrotta. Riconnessione automatica...');
                sseStatus = 'CONNECTING';
                updateSSEBadge('CONNECTING');
            });

            ablyInstance.connection.on('suspended', function () {
                console.warn('🔴 [Ably Live] Connessione sospesa.');
                sseStatus = 'OFF';
                updateSSEBadge('OFF');
            });

            ablyInstance.connection.on('failed', function (err) {
                console.error('❌ [Ably Live] Errore critico connessione Ably:', err);
                sseStatus = 'OFF';
                updateSSEBadge('OFF');
            });

            ablyInstance.connection.on('closed', function () {
                console.log('⚪ [Ably Live] Connessione Ably chiusa.');
                sseStatus = 'OFF';
                updateSSEBadge('OFF');
            });

        } catch (err) {
            console.error('❌ Errore avvio Ably Realtime:', err);
            updateSSEBadge('OFF');
        }
    }

    function subscribeToChannel(channelName) {
        if (!ablyInstance || !channelName) return;
        if (currentChannel && currentChannel.name === channelName) return;

        if (currentChannel) {
            try {
                currentChannel.unsubscribe();
            } catch (e) {}
        }

        currentChannel = ablyInstance.channels.get(channelName);
        currentChannel.subscribe(handleIncomingRealtimeMessage);
        console.log(`📡 [Ably Live] Sottoscrizione al canale: ${channelName}`);
    }

    async function resolveEventRef(eventRef) {
        if (!eventRef) return null;
        try {
            const res = await fetch(REALTIME_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'resolve_event_ref',
                    event_ref: eventRef,
                    ash: getAuthAsh()
                })
            });

            if (!res.ok) {
                console.warn(`[Ably Live] HTTP error ${res.status} su resolve_event_ref`);
                return null;
            }

            const json = await res.json();
            if (json && json.success && json.data) {
                return json.data;
            }
            console.warn('[Ably Live] Risoluzione event_ref non riuscita:', json?.message);
            return null;
        } catch (err) {
            console.error('[Ably Live] Errore richiesta resolve_event_ref:', err);
            return null;
        }
    }

    async function handleIncomingRealtimeMessage(msg) {
        try {
            let envelope = msg.data;
            if (typeof envelope === 'string') {
                try {
                    envelope = JSON.parse(envelope);
                } catch (e) {
                    console.error('❌ Errore parsing messaggio Ably:', e);
                    return;
                }
            }

            if (!envelope || typeof envelope !== 'object') {
                console.warn('⚠️ Payload Ably non valido:', envelope);
                return;
            }

            const eventType = envelope.event_type || msg.name;
            const eventRef = envelope.event_ref;
            console.log(`⚡ [Ably Event] Ricevuto: ${eventType} (ref: ${eventRef || 'none'})`);

            let resolvedData = null;
            if (eventRef) {
                resolvedData = await resolveEventRef(eventRef);
            }

            const eventData = resolvedData || envelope;
            dispatchRealtimeEvent(eventType, eventData);
        } catch (err) {
            console.error('❌ Errore gestione evento realtime:', err);
        }
    }

    function dispatchRealtimeEvent(eventType, data) {
        switch (eventType) {
            // Evento 1: Job preso in carico da un operatore
            case 'job_claimed':
                console.log('⚡ [Ably Event] Job preso in carico:', data);
                handleJobClaimedEvent(data);
                break;

            // Evento 2: Job riassegnato a nuova colonna/postazione
            case 'job_reassigned':
                console.log('⚡ [Ably Event] Job riassegnato:', data);
                handleJobReassignedEvent(data);
                break;

            // Evento 3: Nuovo Job creato ed entrato nel tabellone
            case 'job_created':
                console.log('⚡ [Ably Event] Nuovo Job creato:', data);
                handleJobCreatedEvent(data);
                break;

            // Evento 4: Slot Lock su postazione da altro operatore
            case 'slot_locked':
                console.log('🔒 [Ably Event] Slot Lock attivo:', data);
                handleSlotLockedEvent(data);
                break;

            // Evento 5: Approvazione sblocco in remoto dalla segretaria (Push Bypass)
            case 'manual_bypass_approved':
                console.log('🔓 [Ably Push] Sblocco remoto approvato dalla segretaria!', data);
                if (window.JobSyncQueue) {
                    window.JobSyncQueue.updateVerification(data.timestamp || Date.now());
                }
                if (typeof window.unlockBoardUI === 'function') {
                    window.unlockBoardUI();
                }
                break;

            // Evento 6: Revoca operatore -> Wipe distruttivo locale (Anti-Frode)
            case 'operator_revoked':
                console.warn('🚨 [Ably Push] Operatore revocato dall\'Owner. Avvio Wipe...');
                if (window.JobSyncQueue) {
                    window.JobSyncQueue.performWipe();
                }
                break;

            // Evento 7: Check-in Wi-Fi Guest in sala d'attesa
            case 'wifi_guest_checkin':
                console.log('📶 [Ably Event] Check-in Wi-Fi Guest in Sala d\'Attesa:', data);
                handleWifiGuestCheckinEvent(data);
                break;

            // Evento 8: Job o Prenotazione Confermata dal Cliente (Verde)
            case 'job_status_confirmed':
            case 'job_confirmed':
                console.log('🟢 [Ably Event] Job/Prenotazione CONFERMATA dal cliente:', data);
                handleJobConfirmedEvent(data);
                break;

            // Evento 9: Job o Prenotazione Disdetta dal Cliente (Rosso / Slot Liberato)
            case 'job_status_cancelled':
            case 'job_cancelled':
                console.log('🔴 [Ably Event] Job/Prenotazione DISDETTA dal cliente (Slot Liberato):', data);
                handleJobCancelledEvent(data);
                break;

            // Evento NUOVO: Handover Triggered (Richiesta intervento/passaggio da Communication Hub)
            case 'handover_triggered':
                console.log('🔔 [Ably Event] Handover Triggered:', data);
                handleHandoverTriggeredEvent(data);
                break;

            // Evento NUOVO: Preventivo Approvato
            case 'quote_approved':
                console.log('🟢 [Ably Event] Preventivo Approvato:', data);
                handleQuoteApprovedEvent(data);
                break;

            // Evento NUOVO: Preventivo Rifiutato
            case 'quote_rejected':
                console.log('🔴 [Ably Event] Preventivo Rifiutato:', data);
                handleQuoteRejectedEvent(data);
                break;

            // Evento 10: Profilo Psicografico Customer aggiornato dalla Gamification Suite
            case 'cx_profile_update':
                console.log('🧠 [Ably Event] Profilo Psicografico Customer Aggiornato:', data);
                if (typeof window.handleCxProfileUpdateEvent === 'function') {
                    window.handleCxProfileUpdateEvent(data);
                }
                break;

            // Evento 11: Buono Sconto Addon applicato dal cliente in sala d'attesa
            case 'voucher_addon_applied':
                console.log('🎫 [Ably Event] Buono Sconto Addon Applicato dall\'Utente:', data);
                if (typeof window.handleVoucherAddonAppliedEvent === 'function') {
                    window.handleVoucherAddonAppliedEvent(data);
                }
                break;

            // Evento 12: Cambio stato pausa/disponibilità operatore
            case 'operator_status_changed':
                console.log('🟠/🟢 [Ably Event] Stato operatore modificato:', data);
                handleOperatorStatusChangedEvent(data);
                break;

            default:
                console.warn(`[Ably Event] Evento non gestito specificamente: ${eventType}`, data);
                if (typeof window.refreshBoard === 'function') {
                    window.refreshBoard(true);
                }
                break;
        }
    }

    // ── GESTIONE EVENTI IN-PAGE ─────────────────────────────────────────────
    function handleJobClaimedEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        // Se la funzione globale di refresh esiste sul Tabellone, aggiorna la vista
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true); // silent refresh
        }
    }

    function handleJobReassignedEvent(data) {
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function handleJobCreatedEvent(data) {
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function handleOperatorStatusChangedEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
        if (typeof window.handleOperatorStatusUpdate === 'function') {
            window.handleOperatorStatusUpdate(data);
        } else if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function handleSlotLockedEvent(data) {
        const stationEl = document.getElementById(`station-${data.station_id}`);
        if (stationEl) {
            stationEl.classList.add('border-amber-500', 'bg-amber-950/20');
            setTimeout(() => {
                stationEl.classList.remove('border-amber-500', 'bg-amber-950/20');
            }, 3000);
        }
    }

    function handleWifiGuestCheckinEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        showWifiCheckinToast(data.customer_name || 'Cliente');
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function showWifiCheckinToast(customerName) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-emerald-950 border border-emerald-700 text-emerald-100 rounded-2xl p-4 shadow-2xl z-[9999] flex items-center gap-3 animate-bounce';
        toast.innerHTML = `
            <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg shrink-0">
                <i class="fas fa-wifi"></i>
            </div>
            <div>
                <p class="font-black text-white text-xs uppercase tracking-tight">🟢 Check-In Sala d'Attesa</p>
                <p class="text-xs text-emerald-200">${customerName} è arrivato/a in sala d'attesa (connesso/a al Wi-Fi)</p>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
    }

    function handleJobConfirmedEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        showStatusToast(`🟢 ${data.customer_name || data.client_name || 'Cliente'} ha CONFERMATO l'appuntamento per domani!`, 'emerald');
        if (data.job_id) {
            highlightCardState(data.job_id, 'confirmed');
        }
    }

    function handleJobCancelledEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        showStatusToast(`🔴 ${data.customer_name || data.client_name || 'Cliente'} ha DISDETTO. Lo slot orario è stato LIBERATO!`, 'red');
        if (data.job_id) {
            highlightCardState(data.job_id, 'cancelled');
        }
    }

    function handleHandoverTriggeredEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        const clientName = data.customer_name || data.client_name || data.caller_name || 'Cliente';
        showStatusToast(`🔔 Richiesta Handover Operatore per ${clientName}!`, 'amber');
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function handleQuoteApprovedEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        const clientName = data.customer_name || data.client_name || 'Cliente';
        showStatusToast(`🟢 ${clientName} ha APPROVATO il preventivo!`, 'emerald');
        if (data.job_id) {
            highlightCardState(data.job_id, 'confirmed');
        } else if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function handleQuoteRejectedEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        const clientName = data.customer_name || data.client_name || 'Cliente';
        showStatusToast(`🔴 ${clientName} ha RIFIUTATO il preventivo.`, 'red');
        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function highlightCardState(jobId, state) {
        const card = document.querySelector(`[data-job-id="${jobId}"]`);
        if (!card) return;

        if (state === 'confirmed') {
            card.classList.remove('bg-gray-900', 'border-gray-800', 'bg-red-950/40', 'border-red-500');
            card.classList.add('bg-emerald-950/40', 'border-emerald-500', 'shadow-emerald-900/30');
        } else if (state === 'cancelled') {
            card.classList.remove('bg-gray-900', 'border-gray-800', 'bg-emerald-950/40', 'border-emerald-500');
            card.classList.add('bg-red-950/40', 'border-red-500', 'shadow-red-900/30');
            setTimeout(() => { if (card.parentNode) card.remove(); }, 5000);
        }

        if (typeof window.refreshBoard === 'function') {
            window.refreshBoard(true);
        }
    }

    function showStatusToast(message, color) {
        const toast = document.createElement('div');
        let bgClass = 'bg-emerald-950 border-emerald-700 text-emerald-100';
        let iconHtml = '<i class="fas fa-circle-check text-emerald-400"></i>';

        if (color === 'red') {
            bgClass = 'bg-red-950 border-red-700 text-red-100';
            iconHtml = '<i class="fas fa-circle-xmark text-red-400"></i>';
        } else if (color === 'amber') {
            bgClass = 'bg-amber-950 border-amber-700 text-amber-100';
            iconHtml = '<i class="fas fa-bell text-amber-400"></i>';
        }

        toast.className = `fixed top-4 right-4 ${bgClass} border rounded-2xl p-4 shadow-2xl z-[9999] flex items-center gap-3 animate-bounce`;
        toast.innerHTML = `
            <div class="text-lg shrink-0">
                ${iconHtml}
            </div>
            <div class="text-xs font-bold">${message}</div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 6000);
    }

    function updateSSEBadge(status) {
        const badgeEl = document.getElementById('sse-live-badge');
        if (!badgeEl) return;

        if (status === 'LIVE') {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-[10px] font-bold text-cyan-400';
            badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span> <span>🟢 LIVE SSE</span>`;
        } else if (status === 'CONNECTING') {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-[10px] font-bold text-amber-400';
            badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> <span>🟡 SYNCING...</span>`;
        } else {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-bold text-gray-500';
            badgeEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-gray-600"></span> <span>🔴 SSE OFF</span>`;
        }
    }

    window.DeskBoardSSE = {
        init: initSSEConnection,
        getStatus: () => sseStatus,
        updateBadge: updateSSEBadge
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.DeskBoardSSE.init);
    } else {
        window.DeskBoardSSE.init();
    }

})(window);

