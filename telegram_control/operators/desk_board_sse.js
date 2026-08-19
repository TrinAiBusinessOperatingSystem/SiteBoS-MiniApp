/**
 * desk_board_sse.js
 * SiteBoS Operator Stream - Gestore Server-Sent Events (SSE) Client
 * Ricezione aggiornamenti in tempo reale sul Tabellone Kanban Operatori
 */

(function (window) {
    'use strict';

    const SSE_ENDPOINT = 'https://prod.workflow.trinai.it/webhook/sitebos-operator-sse-stream';
    let eventSourceInstance = null;
    let reconnectDelay = 1000;
    const MAX_RECONNECT_DELAY = 15000;
    let sseStatus = 'OFF'; // 'OFF' | 'CONNECTING' | 'LIVE'

    function initSSEConnection() {
        if (!window.EventSource) {
            console.warn('⚠️ Server-Sent Events (SSE) non supportati da questo browser. Utilizzo fallback Local-First.');
            updateSSEBadge('OFF');
            return;
        }

        if (eventSourceInstance) {
            eventSourceInstance.close();
        }

        updateSSEBadge('CONNECTING');

        try {
            eventSourceInstance = new EventSource(SSE_ENDPOINT);

            eventSourceInstance.onopen = function () {
                console.log('🟢 [SSE Live] Connessione stream al server n8n attivata.');
                sseStatus = 'LIVE';
                reconnectDelay = 1000; // Reset backoff
                updateSSEBadge('LIVE');
            };

            // Evento 1: Job preso in carico da un operatore
            eventSourceInstance.addEventListener('job_claimed', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('⚡ [SSE Event] Job preso in carico:', data);
                    handleJobClaimedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE job_claimed:', err);
                }
            });

            // Evento 2: Job riassegnato a nuova colonna/postazione
            eventSourceInstance.addEventListener('job_reassigned', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('⚡ [SSE Event] Job riassegnato:', data);
                    handleJobReassignedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE job_reassigned:', err);
                }
            });

            // Evento 3: Nuovo Job creato ed entrato nel tabellone
            eventSourceInstance.addEventListener('job_created', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('⚡ [SSE Event] Nuovo Job creato:', data);
                    handleJobCreatedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE job_created:', err);
                }
            });

            // Evento 4: Slot Lock su postazione da altro operatore
            eventSourceInstance.addEventListener('slot_locked', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🔒 [SSE Event] Slot Lock attivo:', data);
                    handleSlotLockedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE slot_locked:', err);
                }
            });

            // Evento 5: Approvazione sblocco in remoto dalla segretaria (Push Bypass)
            eventSourceInstance.addEventListener('manual_bypass_approved', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🔓 [SSE Push] Sblocco remoto approvato dalla segretaria!', data);
                    if (window.JobSyncQueue) {
                        window.JobSyncQueue.updateVerification(data.timestamp || Date.now());
                    }
                    if (typeof window.unlockBoardUI === 'function') {
                        window.unlockBoardUI();
                    }
                } catch (err) {
                    console.error('❌ Errore parsing manual_bypass_approved:', err);
                }
            });

            // Evento 6: Revoca operatore -> Wipe distruttivo locale (Anti-Frode)
            eventSourceInstance.addEventListener('operator_revoked', function (e) {
                console.warn('🚨 [SSE Push] Operatore revocato dall\'Owner. Avvio Wipe...');
                if (window.JobSyncQueue) {
                    window.JobSyncQueue.performWipe();
                }
            });

            // Evento 7: Check-in Wi-Fi Guest in sala d'attesa
            eventSourceInstance.addEventListener('wifi_guest_checkin', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('📶 [SSE Event] Check-in Wi-Fi Guest in Sala d\'Attesa:', data);
                    handleWifiGuestCheckinEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE wifi_guest_checkin:', err);
                }
            });

            // Evento 8: Job o Prenotazione Confermata dal Cliente (Verde)
            eventSourceInstance.addEventListener('job_status_confirmed', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🟢 [SSE Event] Job/Prenotazione CONFERMATA dal cliente:', data);
                    handleJobConfirmedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE job_status_confirmed:', err);
                }
            });

            // Evento 9: Job o Prenotazione Disdetta dal Cliente (Rosso / Slot Liberato)
            eventSourceInstance.addEventListener('job_status_cancelled', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🔴 [SSE Event] Job/Prenotazione DISDETTA dal cliente (Slot Liberato):', data);
                    handleJobCancelledEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE job_status_cancelled:', err);
                }
            });

            // Evento 10: Profilo Psicografico Customer aggiornato dalla Gamification Suite
            eventSourceInstance.addEventListener('cx_profile_update', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🧠 [SSE Event] Profilo Psicografico Customer Aggiornato:', data);
                    if (typeof window.handleCxProfileUpdateEvent === 'function') {
                        window.handleCxProfileUpdateEvent(data);
                    }
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE cx_profile_update:', err);
                }
            });

            // Evento 11: Buono Sconto Addon applicato dal cliente in sala d'attesa
            eventSourceInstance.addEventListener('voucher_addon_applied', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🎫 [SSE Event] Buono Sconto Addon Applicato dall\'Utente:', data);
                    if (typeof window.handleVoucherAddonAppliedEvent === 'function') {
                        window.handleVoucherAddonAppliedEvent(data);
                    }
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE voucher_addon_applied:', err);
                }
            });

            // Evento 12: Cambio stato pausa/disponibilità operatore
            eventSourceInstance.addEventListener('operator_status_changed', function (e) {
                try {
                    const data = JSON.parse(e.data);
                    console.log('🟠/🟢 [SSE Event] Stato operatore modificato:', data);
                    handleOperatorStatusChangedEvent(data);
                } catch (err) {
                    console.error('❌ Errore parsing evento SSE operator_status_changed:', err);
                }
            });



            eventSourceInstance.onerror = function () {
                console.warn('🟡 [SSE Warning] Connessione stream interrotta. Riconnessione in corso...');
                sseStatus = 'OFF';
                updateSSEBadge('CONNECTING');
                eventSourceInstance.close();

                // Exponential backoff
                setTimeout(initSSEConnection, reconnectDelay);
                reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
            };

        } catch (err) {
            console.error('❌ Errore avvio SSE:', err);
            updateSSEBadge('OFF');
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
        showStatusToast(`🟢 ${data.customer_name || 'Cliente'} ha CONFERMATO l'appuntamento per domani!`, 'emerald');
        highlightCardState(data.job_id, 'confirmed');
    }

    function handleJobCancelledEvent(data) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        showStatusToast(`🔴 ${data.customer_name || 'Cliente'} ha DISDETTO. Lo slot orario è stato LIBERATO!`, 'red');
        highlightCardState(data.job_id, 'cancelled');
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
        const bgClass = color === 'emerald' ? 'bg-emerald-950 border-emerald-700 text-emerald-100' : 'bg-red-950 border-red-700 text-red-100';
        toast.className = `fixed top-4 right-4 ${bgClass} border rounded-2xl p-4 shadow-2xl z-[9999] flex items-center gap-3 animate-bounce`;
        toast.innerHTML = `
            <div class="text-lg shrink-0">
                <i class="fas fa-${color === 'emerald' ? 'circle-check text-emerald-400' : 'circle-xmark text-red-400'}"></i>
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
