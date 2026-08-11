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

    function handleSlotLockedEvent(data) {
        const stationEl = document.getElementById(`station-${data.station_id}`);
        if (stationEl) {
            stationEl.classList.add('border-amber-500', 'bg-amber-950/20');
            setTimeout(() => {
                stationEl.classList.remove('border-amber-500', 'bg-amber-950/20');
            }, 3000);
        }
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
