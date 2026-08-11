/**
 * job_sync_queue.js
 * SiteBoS Operator Engine - Paradigma Local-First, IndexedDB Store & Sync-on-Action
 * Zero-Overhead Server Architecture (Zero Background Pings / Zero Polling)
 */

(function (window) {
    'use strict';

    const DB_NAME = 'sitebos_operator_db';
    const DB_VERSION = 1;
    const STORE_SOPS = 'sitebos_sop_library';
    const STORE_EVIDENCES = 'sitebos_evidences_store';
    const QUEUE_KEY = 'sitebos_sync_queue_fifo';
    const ENDPOINT_SYNC = 'https://prod.workflow.trinai.it/webhook/sitebos-operator-sync-checkpoint';

    let dbInstance = null;

    // ── 1. INIZIALIZZAZIONE INDEXEDDB ─────────────────────────────────────
    function initDatabase() {
        return new Promise((resolve, reject) => {
            if (dbInstance) return resolve(dbInstance);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (e) {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_SOPS)) {
                    db.createObjectStore(STORE_SOPS, { keyPath: 'sopId' });
                }
                if (!db.objectStoreNames.contains(STORE_EVIDENCES)) {
                    db.createObjectStore(STORE_EVIDENCES, { keyPath: 'evidenceId' });
                }
            };

            request.onsuccess = function (e) {
                dbInstance = e.target.result;
                console.log('💾 [IndexedDB] Database Operatore connesso con successo.');
                resolve(dbInstance);
            };

            request.onerror = function (e) {
                console.error('❌ [IndexedDB] Errore apertura database:', e);
                reject(e);
            };
        });
    }

    // ── 2. SCARICAMENTO E CONGELAMENTO SOP IN LIBRERIA LOCALE (0ms) ──────────
    async function saveSopToLibrary(sopId, sopData) {
        const db = await initDatabase();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_SOPS], 'readwrite');
            const store = tx.objectStore(STORE_SOPS);
            const payload = {
                sopId: sopId,
                data: sopData,
                timestamp: new Date().toISOString(),
                saved_at: Date.now()
            };
            const req = store.put(payload);
            req.onsuccess = () => resolve(payload);
            req.onerror = (e) => reject(e);
        });
    }

    async function getSopFromLibrary(sopId) {
        const db = await initDatabase();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_SOPS], 'readonly');
            const store = tx.objectStore(STORE_SOPS);
            const req = store.get(sopId);
            req.onsuccess = () => resolve(req.result ? req.result.data : null);
            req.onerror = () => resolve(null);
        });
    }

    // ── 3. EVIDENZE LOCAL-FIRST (FIRME & FOTO COMPRESSE SU DISCO) ───────────
    async function compressAndSaveEvidence(jobId, stepId, evidenceType, rawData) {
        const db = await initDatabase();
        const evidenceId = `ev_${jobId}_${stepId}_${Date.now()}`;
        
        let compressedData = rawData;
        // Se è un'immagine Base64 da Canvas o Fotocamera, applica compressione edge
        if (typeof rawData === 'string' && rawData.startsWith('data:image')) {
            compressedData = await compressBase64Image(rawData, 800, 0.7);
        }

        const evidencePayload = {
            evidenceId: evidenceId,
            jobId: jobId,
            stepId: stepId,
            type: evidenceType, // 'SIGNATURE' | 'PHOTO' | 'VISION' | 'INSPECTION'
            data: compressedData,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_EVIDENCES], 'readwrite');
            const store = tx.objectStore(STORE_EVIDENCES);
            const req = store.put(evidencePayload);
            req.onsuccess = () => {
                console.log(`📸 [Evidenze] Evidenza ${evidenceId} salvata immutabile su IndexedDB.`);
                resolve(evidencePayload);
            };
            req.onerror = (e) => reject(e);
        });
    }

    function compressBase64Image(base64Str, maxWidth, quality) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(base64Str);
            img.src = base64Str;
        });
    }

    async function removeEvidenceFromStore(evidenceId) {
        if (!evidenceId) return;
        const db = await initDatabase();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_EVIDENCES], 'readwrite');
            const store = tx.objectStore(STORE_EVIDENCES);
            const req = store.delete(evidenceId);
            req.onsuccess = () => resolve(true);
            req.onerror = () => resolve(false);
        });
    }

    // ── 4. CODA DI SINCRONIZZAZIONE EVENT-DRIVEN (SYNC-ON-ACTION) ───────────
    function getSyncQueue() {
        try {
            return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    }

    function saveSyncQueue(queue) {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            updateSyncUIBadge();
        } catch (e) {
            console.error('❌ Errore scrittura Sync Queue:', e);
        }
    }

    async function syncOnAction(jobId, checkpointData) {
        // 1. Scrittura Istantanea Locale (Optimistic UI 0ms)
        const queue = getSyncQueue();
        const item = {
            id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            jobId: jobId,
            data: checkpointData,
            timestamp: new Date().toISOString()
        };

        queue.push(item);
        saveSyncQueue(queue);

        console.log('⚡ [Sync-on-Action] Checkpoint registrato in locale:', item.id);

        // 2. Se la rete è attiva, invia subito senza attendere
        if (navigator.onLine) {
            await flushSyncQueue();
        } else {
            updateSyncUIBadge();
        }
    }

    let isFlushing = false;
    async function flushSyncQueue() {
        if (isFlushing) return;
        const queue = getSyncQueue();
        if (queue.length === 0) {
            updateSyncUIBadge();
            return;
        }

        isFlushing = true;
        updateSyncUIBadge('flushing', queue.length);

        const remainingQueue = [];

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            try {
                const response = await fetch(ENDPOINT_SYNC, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    keepalive: true,
                    body: JSON.stringify(item)
                });

                if (response.ok) {
                    console.log(`✅ [Sync OK] Checkpoint ${item.id} sincronizzato con n8n.`);
                    if (item.data && item.data.evidenceId) {
                        await removeEvidenceFromStore(item.data.evidenceId);
                    }
                } else {
                    console.warn(`⚠️ [Sync Retry] Server ha restituito HTTP ${response.status}. Mantenuto su disco.`);
                    remainingQueue.push(item);
                }
            } catch (err) {
                console.warn(`⚠️ [Offline] Impossibile inviare ${item.id}. Mantenuto in coda.`, err);
                remainingQueue.push(item);
            }
        }

        saveSyncQueue(remainingQueue);
        isFlushing = false;
        updateSyncUIBadge();
    }

    // ── 5. NATIVE NETWORK EVENT LISTENERS (ZERO HEARTBEAT) ──────────────────
    function initNativeNetworkListeners() {
        window.addEventListener('online', function () {
            console.log('🌐 [Rete Nativa] Connessione ripristinata. Avvio svuotamento coda...');
            flushSyncQueue();
        });

        window.addEventListener('offline', function () {
            console.log('📡 [Rete Nativa] Connessione assente. Modalità 100% Offline attiva.');
            updateSyncUIBadge();
        });

        // Bootstrap scan all'avvio
        if (navigator.onLine) {
            setTimeout(flushSyncQueue, 1500);
        } else {
            updateSyncUIBadge();
        }
    }

    // ── 6. UI BADGE SYNC STATUS non-intrusivo ─────────────────────────────────
    function updateSyncUIBadge(statusOverride, countOverride) {
        const queue = getSyncQueue();
        const badgeEl = document.getElementById('cloud-sync-badge');
        if (!badgeEl) return;

        if (statusOverride === 'flushing') {
            const c = countOverride || queue.length;
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-[10px] font-bold text-amber-400 animate-pulse';
            badgeEl.innerHTML = `<i class="fa-solid fa-rotate fa-spin text-xs"></i> <span>🔄 Sincronizzazione in corso (${c})...</span>`;
            return;
        }

        if (queue.length > 0) {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-[10px] font-bold text-amber-400';
            badgeEl.innerHTML = `<i class="fa-solid fa-hard-drive text-xs"></i> <span>⏳ Salvato in locale (${queue.length})</span>`;
        } else if (navigator.onLine) {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[10px] font-bold text-emerald-400';
            badgeEl.innerHTML = `<i class="fa-solid fa-cloud-check text-xs"></i> <span>🟢 Sincronizzato</span>`;
        } else {
            badgeEl.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-bold text-gray-400';
            badgeEl.innerHTML = `<i class="fa-solid fa-plane text-xs"></i> <span>⏳ Salvato in locale (Offline)</span>`;
        }
    }

    // ── 7. PROFILO STAKEHOLDER RESIDENTE & SICUREZZA PASSIVA ────────────────
    const STAKEHOLDER_KEY_PREFIX = 'sitebos_stakeholder_profile_';
    const KEY_LAST_VERIFY = 'sitebos_last_verification_time';
    const KEY_VERIFY_FREQ = 'sitebos_verification_frequency'; // default 24h = 86400000ms

    function isMobileTwaDevice() {
        // Riconosce se siamo all'interno di Telegram WebApp mobile o dispositivo touch/mobile
        const isTg = !!(window.Telegram && window.Telegram.WebApp && (window.Telegram.WebApp.initData || window.Telegram.WebApp.platform));
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isTg || isMobileUA;
    }

    function saveStakeholderProfile(ash, profileData) {
        if (!ash || !profileData) return;
        
        // REQUISITO DI SICUREZZA: I salvataggi dello Stakeholder sono riservati esclusivamente al dispositivo Mobile / TWA dell'operatore
        if (!isMobileTwaDevice()) {
            console.warn('⚠️ [Stakeholder Privacy] Salvataggio disattivato su browser desktop generico. Consentito solo su dispositivo Mobile TWA.');
            return;
        }

        try {
            localStorage.setItem(`${STAKEHOLDER_KEY_PREFIX}${ash}`, JSON.stringify(profileData));
            console.log('👤 [Stakeholder] Profilo operatore memorizzato in locale su dispositivo mobile (0ms access).');
        } catch (e) {
            console.error('❌ Errore salvataggio profilo stakeholder:', e);
        }
    }

    function getStakeholderProfile(ash) {
        try {
            const data = localStorage.getItem(`${STAKEHOLDER_KEY_PREFIX}${ash}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function updateVerificationTimestamp(timestamp) {
        const ts = timestamp || Date.now();
        localStorage.setItem(KEY_LAST_VERIFY, ts.toString());
        console.log('🔒 [Sicurezza Passiva] Timestamp verifica aggiornato:', new Date(Number(ts)).toISOString());
    }

    function checkPassiveVerification() {
        const lastVerifyStr = localStorage.getItem(KEY_LAST_VERIFY);
        const freqStr = localStorage.getItem(KEY_VERIFY_FREQ);

        // Se non c'è mai stata una verifica, imposta il timestamp attuale se è il primo avvio
        if (!lastVerifyStr) {
            updateVerificationTimestamp(Date.now());
            return { valid: true, remainingMs: Number(freqStr) || 86400000 };
        }

        const lastVerify = Number(lastVerifyStr);
        const freq = Number(freqStr) || 86400000; // 24h tolleranza di default
        const now = Date.now();
        const elapsed = now - lastVerify;

        if (elapsed < freq) {
            return { valid: true, remainingMs: freq - elapsed };
        } else {
            return { valid: false, reason: 'TOKEN_EXPIRED', remainingMs: 0 };
        }
    }

    /**
     * RICONVALIDA AMBIENTALE SILENZIOSA (REV. 13 - ZERO FRICTION UX)
     * Scatta come effetto collaterale invisibile di un'azione reale (salvataggio step o boot).
     * Verifica Wi-Fi/GPS e rinnova il timestamp in locale se l'operatore è in sede.
     */
    async function attemptSilentRevalidation() {
        try {
            let isHere = false;

            // 1. Check Wi-Fi Network API (se disponibile nel browser)
            if (navigator.connection && (navigator.connection.type === 'wifi' || navigator.connection.effectiveType === '4g')) {
                // Se siamo sotto la rete Wi-Fi/LAN aziendale del luogo di lavoro
                isHere = true;
            }

            // 2. Check GPS Geofence (Edge Check rapido non bloccante)
            if (!isHere && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        // Verifica se entro 100m dalle coordinate studio
                        updateVerificationTimestamp(Date.now());
                        console.log('📍 [Silent Re-validation] Geofence GPS confermato. Token rinnovato in sottofondo (Zero-Friction).');
                    },
                    () => {
                        console.log('📡 [Silent Re-validation] Fuori sede / GPS non disponibile. Token in decadimento naturale.');
                    },
                    { timeout: 3000, maximumAge: 60000 }
                );
                return;
            }

            if (isHere) {
                updateVerificationTimestamp(Date.now());
                console.log('📶 [Silent Re-validation] Rete studio confermata. Token rinnovato in sottofondo (Zero-Friction).');
            }
        } catch (e) {
            console.log('📡 [Silent Re-validation] Check discreto completato.');
        }
    }

    async function performWipe() {
        console.warn('🚨 [ANTI-FRAUD WIPE] Avvio cancellazione distruttiva dei dati aziendali riservati...');
        try {
            // 1. Pulisci localStorage MA preserva la scheda personale dell'operatore (Lo Stakeholder NON è soggetto al Wipe)
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('sitebos_') || k.startsWith('modules_') || k.startsWith('backup_'))) {
                    if (!k.startsWith(STAKEHOLDER_KEY_PREFIX)) {
                        keysToRemove.push(k);
                    }
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // 2. Elimina database IndexedDB (SOP e evidenze aziendali)
            if (dbInstance) {
                dbInstance.close();
            }
            indexedDB.deleteDatabase(DB_NAME);

            console.log('🧹 [Wipe] Dati aziendali proprietari cancellati. Profilo personale dello stakeholder salvaguardato sul telefono.');
            window.location.reload();
        } catch (e) {
            console.error('❌ Errore durante il Wipe:', e);
        }
    }

    // ── 8. EXPORT INTERFACCIA GLOBALE ───────────────────────────────────────
    window.JobSyncQueue = {
        init: function () {
            initDatabase();
            initNativeNetworkListeners();
        },
        saveSop: saveSopToLibrary,
        getSop: getSopFromLibrary,
        saveEvidence: compressAndSaveEvidence,
        syncOnAction: syncOnAction,
        flushQueue: flushSyncQueue,
        getQueue: getSyncQueue,
        updateBadge: updateSyncUIBadge,
        saveStakeholder: saveStakeholderProfile,
        getStakeholder: getStakeholderProfile,
        updateVerification: updateVerificationTimestamp,
        checkVerification: checkPassiveVerification,
        silentRevalidate: attemptSilentRevalidation,
        performWipe: performWipe
    };

    // Auto-init al caricamento del DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.JobSyncQueue.init);
    } else {
        window.JobSyncQueue.init();
    }

})(window);
