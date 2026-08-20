/**
 * offline_queue.js
 * Modulo Condiviso SiteBoS - Coda Locale Resiliente per Operatori Fuori Sede Senza Rete
 * 
 * Architettura:
 * - Storage Primario: IndexedDB (payload completo, comprese foto ed evidenze in base64)
 * - Storage Secondario: localStorage (backup ridondante dei soli metadati leggeri)
 * - Watcher Connettività: navigator.onLine combinato con ping leggero reale
 * - Flush Automatico: FIFO in ordine cronologico quando l'app è in primo piano e torna la rete
 * - Badge Visivo: Conteggio azioni in attesa con testi estesi e privi di abbreviazioni
 * - Protezione Chiusura: beforeunload e enableClosingConfirmation di Telegram WebApp
 */

(function (window) {
    'use strict';

    const DB_NAME = 'sitebos_offline_queue_db';
    const DB_VERSION = 1;
    const STORE_ACTIONS = 'offline_actions';
    const LOCAL_BACKUP_KEY = 'sitebos_offline_queue_backup_meta';

    let dbInstance = null;
    let isFlushing = false;
    let isCurrentlyOnline = navigator.onLine !== false;
    let lastKnownPendingCount = 0;
    let connectivityCheckTimer = null;

    // ── 1. INIZIALIZZAZIONE INDEXEDDB ─────────────────────────────────────────
    function initDatabase() {
        return new Promise((resolve, reject) => {
            if (dbInstance) return resolve(dbInstance);

            if (!window.indexedDB) {
                console.warn('⚠️ [OfflineQueue] IndexedDB non supportato su questo dispositivo. Uso fallback localStorage.');
                return resolve(null);
            }

            try {
                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onupgradeneeded = function (event) {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
                        const store = db.createObjectStore(STORE_ACTIONS, { keyPath: 'id' });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('action_type', 'action_type', { unique: false });
                    }
                };

                request.onsuccess = function (event) {
                    dbInstance = event.target.result;
                    console.log('💾 [OfflineQueue] Database IndexedDB connesso con successo.');
                    resolve(dbInstance);
                };

                request.onerror = function (event) {
                    console.error('❌ [OfflineQueue] Errore apertura IndexedDB:', event.target.error);
                    resolve(null);
                };
            } catch (err) {
                console.error('❌ [OfflineQueue] Eccezione apertura IndexedDB:', err);
                resolve(null);
            }
        });
    }

    // ── 2. GESTIONE BACKUP SECONDARIO SU LOCALSTORAGE (SOLO METADATI) ─────────
    function getLocalBackupMetadata() {
        try {
            const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalBackupMetadata(metaList) {
        try {
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(metaList));
            lastKnownPendingCount = metaList.length;
            updateClosingProtection();
        } catch (e) {
            console.warn('⚠️ [OfflineQueue] Impossibile scrivere backup localStorage:', e);
        }
    }

    function sanitizeMetadataForBackup(actionItem) {
        return {
            id: actionItem.id,
            action_type: actionItem.action_type || 'AZIONE_GENERICA',
            url: actionItem.url,
            method: actionItem.method || 'POST',
            timestamp: actionItem.timestamp || Date.now(),
            created_at: actionItem.created_at || new Date().toISOString(),
            job_id: actionItem.metadata?.job_id || actionItem.job_id || null,
            step_id: actionItem.metadata?.step_id || actionItem.step_id || null,
            has_heavy_payload: !!(typeof actionItem.body === 'string' ? actionItem.body.length > 5000 : false)
        };
    }

    // ── 3. OPERAZIONI CRUD SU INDEXEDDB CON RIDONDANZA ────────────────────────
    async function putActionToStorage(actionItem) {
        const db = await initDatabase();
        
        // Aggiorna sempre il backup dei soli metadati
        const currentMeta = getLocalBackupMetadata().filter(m => m.id !== actionItem.id);
        currentMeta.push(sanitizeMetadataForBackup(actionItem));
        saveLocalBackupMetadata(currentMeta);

        if (!db) {
            console.warn('⚠️ [OfflineQueue] IndexedDB non attivo: azione registrata solo nel backup dei metadati.');
            return actionItem;
        }

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_ACTIONS], 'readwrite');
                const store = tx.objectStore(STORE_ACTIONS);
                const req = store.put(actionItem);

                req.onsuccess = () => {
                    resolve(actionItem);
                };

                req.onerror = (e) => {
                    console.error('❌ [OfflineQueue] Errore inserimento azione su IndexedDB:', e);
                    resolve(actionItem);
                };
            } catch (err) {
                console.error('❌ [OfflineQueue] Eccezione transazione IndexedDB:', err);
                resolve(actionItem);
            }
        });
    }

    async function getAllActionsFromStorage() {
        const db = await initDatabase();
        if (!db) {
            return [];
        }

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_ACTIONS], 'readonly');
                const store = tx.objectStore(STORE_ACTIONS);
                const index = store.index('timestamp');
                const req = index.getAll();

                req.onsuccess = () => {
                    const list = req.result || [];
                    // Ordine rigorosamente cronologico (FIFO)
                    list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    resolve(list);
                };

                req.onerror = () => {
                    resolve([]);
                };
            } catch (e) {
                resolve([]);
            }
        });
    }

    async function deleteActionFromStorage(actionId) {
        // Rimuovi da backup localStorage
        const currentMeta = getLocalBackupMetadata().filter(m => m.id !== actionId);
        saveLocalBackupMetadata(currentMeta);

        const db = await initDatabase();
        if (!db) return true;

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_ACTIONS], 'readwrite');
                const store = tx.objectStore(STORE_ACTIONS);
                const req = store.delete(actionId);

                req.onsuccess = () => resolve(true);
                req.onerror = () => resolve(false);
            } catch (e) {
                resolve(false);
            }
        });
    }

    async function countPendingActions() {
        const db = await initDatabase();
        if (!db) {
            return getLocalBackupMetadata().length;
        }

        return new Promise((resolve) => {
            try {
                const tx = db.transaction([STORE_ACTIONS], 'readonly');
                const store = tx.objectStore(STORE_ACTIONS);
                const req = store.count();

                req.onsuccess = () => {
                    lastKnownPendingCount = req.result;
                    resolve(req.result);
                };

                req.onerror = () => {
                    resolve(getLocalBackupMetadata().length);
                };
            } catch (e) {
                resolve(getLocalBackupMetadata().length);
            }
        });
    }

    // ── 4. WATCHER DI CONNETTIVITÀ CON PING REALE LEGGERO ─────────────────────
    async function performLightweightPing(timeoutMs = 3500) {
        if (navigator.onLine === false) {
            return false;
        }

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

        // Tenta prima una risorsa leggera dello stesso dominio (o relative path), con fallback a endpoint pubblico
        const testUrls = [
            window.location.origin + window.location.pathname,
            'https://www.gstatic.com/generate_204',
            'https://cloudflare.com/cdn-cgi/trace'
        ];

        for (const testUrl of testUrls) {
            try {
                await fetch(testUrl, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-store',
                    signal: controller ? controller.signal : undefined
                });
                if (timeoutId) clearTimeout(timeoutId);
                return true;
            } catch (err) {
                // Continua con il fallback successivo
            }
        }

        if (timeoutId) clearTimeout(timeoutId);
        return false;
    }

    async function checkConnectivity() {
        const pingOk = await performLightweightPing();
        isCurrentlyOnline = pingOk;
        return pingOk;
    }

    // ── 5. API PER ACCODARE UN'AZIONE FALLITA PER ASSENZA DI RETE ───────────────
    async function enqueueAction(actionConfig) {
        if (!actionConfig || !actionConfig.url) {
            console.error('❌ [OfflineQueue] Configurazione azione non valida:', actionConfig);
            return null;
        }

        const actionId = actionConfig.id || ('offline_act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
        const timestamp = actionConfig.timestamp || Date.now();

        const actionItem = {
            id: actionId,
            action_type: actionConfig.action_type || actionConfig.actionType || 'GENERIC_WRITE',
            url: actionConfig.url,
            method: (actionConfig.method || 'POST').toUpperCase(),
            headers: actionConfig.headers || { 'Content-Type': 'application/json' },
            body: actionConfig.body || {},
            metadata: actionConfig.metadata || {},
            timestamp: timestamp,
            created_at: new Date(timestamp).toISOString(),
            retry_count: 0
        };

        await putActionToStorage(actionItem);
        const count = await countPendingActions();

        console.log(`📥 [OfflineQueue] Azione accodata per assenza di rete: ${actionItem.action_type} (ID: ${actionItem.id}). Totale in coda: ${count}`);

        updateBadge();
        updateClosingProtection();

        window.dispatchEvent(new CustomEvent('offline-action-enqueued', {
            detail: { action: actionItem, pendingCount: count }
        }));

        return actionItem;
    }

    // ── 6. ESECUZIONE RESILIENTE (WRAPPER FETCH CON FALLBACK CODA) ─────────────
    /**
     * Esegue una richiesta HTTP. Se fallisce per reale errore di rete (irraggiungibilità, timeout, offline),
     * accoda l'azione in locale e restituisce un oggetto informativo { queued: true }.
     * Se il server risponde con un errore applicativo o di validazione (HTTP 4xx/5xx),
     * restituisce la risposta normale e NON accoda nulla.
     */
    async function executeOrEnqueue(requestConfig) {
        const { url, method = 'POST', headers = { 'Content-Type': 'application/json' }, body, action_type } = requestConfig;

        // Se siamo già palesemente offline, accoda direttamente
        if (navigator.onLine === false) {
            console.warn(`📡 [OfflineQueue] Dispositivo offline: accodamento immediato di ${action_type || 'azione'}`);
            const queuedItem = await enqueueAction(requestConfig);
            return {
                ok: false,
                status: 0,
                network_error: true,
                queued: true,
                item: queuedItem,
                message: 'Azione salvata in memoria locale e in attesa di rete.'
            };
        }

        try {
            const fetchBody = (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob))
                ? JSON.stringify(body)
                : body;

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: fetchBody
            });

            // Il server ha risposto: restituisci la risposta naturale (anche in caso di errore 4xx o 5xx)
            // Non si accoda perché non è un fallimento di rete
            return {
                ok: response.ok,
                status: response.status,
                network_error: false,
                queued: false,
                response: response
            };

        } catch (networkError) {
            // Rilevato errore reale di rete (TypeError "Failed to fetch", timeout o interruzione connessione)
            console.warn(`⚠️ [OfflineQueue] Errore di rete durante la chiamata a ${url}. Accodamento azione in corso...`, networkError);

            const queuedItem = await enqueueAction(requestConfig);
            return {
                ok: false,
                status: 0,
                network_error: true,
                queued: true,
                item: queuedItem,
                message: 'Connessione di rete non disponibile. Azione salvata in memoria locale.'
            };
        }
    }

    // ── 7. FLUSH AUTOMATICO IN ORDINE CRONOLOGICO (FIFO) ──────────────────────
    async function flushQueue() {
        if (isFlushing) {
            console.log('⏳ [OfflineQueue] Svuotamento già in corso, richiesta ignorata.');
            return;
        }

        const pendingCount = await countPendingActions();
        if (pendingCount === 0) {
            updateBadge();
            return;
        }

        // Verifica che l'app sia in primo piano
        if (document.visibilityState && document.visibilityState !== 'visible') {
            console.log('⏸️ [OfflineQueue] App non in primo piano: sincronizzazione differita.');
            return;
        }

        // Verifica connettività effettiva prima del flush
        const isOnline = await checkConnectivity();
        if (!isOnline) {
            console.log('📡 [OfflineQueue] Connettività non ancora confermata dal ping.');
            updateBadge();
            return;
        }

        isFlushing = true;
        updateBadge('flushing');

        console.log(`🚀 [OfflineQueue] Avvio sincronizzazione di ${pendingCount} azioni in attesa...`);

        const actions = await getAllActionsFromStorage();
        let syncedCount = 0;
        let encounteredNetworkError = false;

        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];

            try {
                const fetchBody = (typeof action.body === 'object' && !(action.body instanceof FormData) && !(action.body instanceof Blob))
                    ? JSON.stringify(action.body)
                    : action.body;

                const response = await fetch(action.url, {
                    method: action.method || 'POST',
                    headers: action.headers || { 'Content-Type': 'application/json' },
                    body: fetchBody
                });

                if (response.ok || (response.status >= 200 && response.status < 300)) {
                    console.log(`✅ [OfflineQueue] Azione ${action.id} (${action.action_type}) sincronizzata con successo.`);
                    await deleteActionFromStorage(action.id);
                    syncedCount++;
                } else if (response.status >= 400 && response.status < 500) {
                    // Errore di validazione o richiesta non valida permanente da parte del backend
                    // Rimuovi dalla coda per evitare blocco infinito (poisoned queue) e segnala
                    console.warn(`⚠️ [OfflineQueue] Server ha rifiutato l'azione ${action.id} con stato HTTP ${response.status}. Rimossa dalla coda per evitare blocchi.`);
                    await deleteActionFromStorage(action.id);
                } else {
                    // Errore temporaneo del server (5xx): mantieni in coda per riprovare successivamente
                    console.warn(`⚠️ [OfflineQueue] Server ha restituito HTTP ${response.status} per ${action.id}. Mantenuta in coda.`);
                    action.retry_count = (action.retry_count || 0) + 1;
                    await putActionToStorage(action);
                    encounteredNetworkError = true;
                    break;
                }
            } catch (err) {
                // Rete caduta di nuovo durante il flush
                console.warn(`📡 [OfflineQueue] Interruzione di rete durante la sincronizzazione dell'azione ${action.id}.`, err);
                encounteredNetworkError = true;
                break;
            }
        }

        isFlushing = false;
        const remaining = await countPendingActions();

        if (syncedCount > 0 && remaining === 0) {
            updateBadge('just_synced');
            console.log('🎉 [OfflineQueue] Tutte le azioni in coda sono state sincronizzate con successo.');
            setTimeout(() => updateBadge(), 3500);
        } else {
            updateBadge();
        }

        updateClosingProtection();

        window.dispatchEvent(new CustomEvent('offline-queue-flushed', {
            detail: {
                syncedCount: syncedCount,
                remainingCount: remaining,
                interrupted: encounteredNetworkError
            }
        }));
    }

    // ── 8. GESTIONE BADGE VISIVO E STATO NELL'INTERFACCIA ─────────────────────
    function updateBadge(statusOverride) {
        countPendingActions().then((count) => {
            const badgeContainers = document.querySelectorAll('#offline-sync-badge, .offline-sync-badge, #cloud-sync-badge');
            if (!badgeContainers || badgeContainers.length === 0) return;

            badgeContainers.forEach((badgeEl) => {
                if (statusOverride === 'flushing') {
                    badgeEl.classList.remove('hidden');
                    badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700 animate-pulse shadow-xs';
                    badgeEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-xs"></i> <span>Sincronizzazione in corso...</span>`;
                    return;
                }

                if (statusOverride === 'just_synced') {
                    badgeEl.classList.remove('hidden');
                    badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-[10px] font-bold text-emerald-700 shadow-xs';
                    badgeEl.innerHTML = `<i class="fa-solid fa-circle-check text-xs"></i> <span>Sincronizzato con successo</span>`;
                    return;
                }

                if (count > 0) {
                    badgeEl.classList.remove('hidden');
                    badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-[10px] font-bold text-amber-800 shadow-xs';
                    const labelText = count === 1 ? '1 azione in attesa di rete' : `${count} azioni in attesa di rete`;
                    badgeEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-amber-600 text-xs animate-bounce"></i> <span>${labelText}</span>`;
                } else if (!isCurrentlyOnline) {
                    badgeEl.classList.remove('hidden');
                    badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 shadow-xs';
                    badgeEl.innerHTML = `<i class="fa-solid fa-plane text-xs"></i> <span>Modalità Fuori Sede Senza Rete</span>`;
                } else {
                    // Coda vuota e online: nascondi o mostra stato discreto
                    if (badgeEl.dataset.alwaysVisible === 'true') {
                        badgeEl.classList.remove('hidden');
                        badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700';
                        badgeEl.innerHTML = `<i class="fa-solid fa-cloud-check text-xs"></i> <span>Sincronizzato</span>`;
                    } else {
                        badgeEl.classList.add('hidden');
                    }
                }
            });
        });
    }

    // ── 9. PROTEZIONE CHIUSURA (BEFOREUNLOAD & TELEGRAM CONFIRMATION) ───────────
    function updateClosingProtection() {
        const count = getLocalBackupMetadata().length;
        const tg = window.Telegram?.WebApp;

        if (tg && typeof tg.enableClosingConfirmation === 'function') {
            if (count > 0) {
                tg.enableClosingConfirmation();
            }
        }
    }

    function setupBeforeUnloadProtection() {
        window.addEventListener('beforeunload', function (e) {
            const count = getLocalBackupMetadata().length;
            if (count > 0) {
                const message = `Attenzione: ci sono ${count} azioni salvate in attesa di rete non ancora sincronizzate. Se chiudi l'applicazione ora, i dati rimarranno memorizzati ma non saranno inviati al server fino alla prossima apertura.`;
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        });
    }

    // ── 10. SETUP EVENTI RETE E CICLO DI VITA APP ─────────────────────────────
    function setupNetworkLifecycleListeners() {
        // Evento nativo online
        window.addEventListener('online', async function () {
            console.log('🌐 [OfflineQueue] Evento online rilevato dal browser.');
            const isReallyOnline = await checkConnectivity();
            if (isReallyOnline) {
                flushQueue();
            }
        });

        // Evento nativo offline
        window.addEventListener('offline', function () {
            console.log('📡 [OfflineQueue] Evento offline rilevato dal browser.');
            isCurrentlyOnline = false;
            updateBadge();
        });

        // Quando l'app torna visibile in primo piano
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                checkConnectivity().then((online) => {
                    if (online) {
                        flushQueue();
                    } else {
                        updateBadge();
                    }
                });
            }
        });

        // Quando la finestra riceve il focus
        window.addEventListener('focus', function () {
            checkConnectivity().then((online) => {
                if (online) {
                    flushQueue();
                }
            });
        });

        // Controllo periodico discreto SOLO se ci sono elementi in coda e l'app è in primo piano
        if (connectivityCheckTimer) clearInterval(connectivityCheckTimer);
        connectivityCheckTimer = setInterval(async () => {
            if (document.visibilityState === 'visible') {
                const count = await countPendingActions();
                if (count > 0) {
                    const online = await checkConnectivity();
                    if (online) {
                        flushQueue();
                    }
                }
            }
        }, 15000);
    }

    // ── 11. INIZIALIZZAZIONE AUTOMATICA DEL MODULO ─────────────────────────────
    async function initOfflineQueue() {
        await initDatabase();
        setupBeforeUnloadProtection();
        setupNetworkLifecycleListeners();
        updateClosingProtection();

        // Controllo iniziale e tentativo di flush all'avvio
        setTimeout(async () => {
            const online = await checkConnectivity();
            if (online) {
                flushQueue();
            } else {
                updateBadge();
            }
        }, 1200);
    }

    // ── 12. ESPORTAZIONE INTERFACCIA GLOBALE ──────────────────────────────────
    window.OfflineQueue = {
        init: initOfflineQueue,
        enqueue: enqueueAction,
        executeOrEnqueue: executeOrEnqueue,
        flush: flushQueue,
        getPendingCount: countPendingActions,
        getPendingCountSync: () => getLocalBackupMetadata().length,
        getPendingActions: getAllActionsFromStorage,
        removeAction: deleteActionFromStorage,
        updateBadge: updateBadge,
        checkConnectivity: checkConnectivity,
        isOnline: () => isCurrentlyOnline
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOfflineQueue);
    } else {
        initOfflineQueue();
    }

})(window);
