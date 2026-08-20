/**
 * Logica Operativa: document_sign_certified_logic.js
 * Compliance Route: CERTIFIED_API (Via B)
 * Flusso: Invio richiesta push al cliente + Sottoscrizione Ably Realtime (Zero GPS, Zero Local Canvas)
 */

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }

    const DOC_ENGINE_ENDPOINT = 'https://prod.workflow.trinai.it/webhook/doc-engine';
    const SSE_ENDPOINT = 'https://prod.workflow.trinai.it/webhook/sitebos-operator-sse-stream';
    const COMPLIANCE_ROUTE = 'CERTIFIED_API';

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id') || urlParams.get('execution_id') || ('JOB_' + Date.now().toString(16).toUpperCase());
    const templateId = urlParams.get('doc_template_id') || urlParams.get('template_id') || '';
    const customerChatId = urlParams.get('customer_chat_id') || urlParams.get('chat_id') || '';
    const ownerId = urlParams.get('owner_id') || urlParams.get('vat_number') || urlParams.get('vat') || 'TENANT_DEFAULT';
    const operatorId = urlParams.get('operator_id') || urlParams.get('operator_chat_id') || (tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : 'OP_DEFAULT');
    const stepName = urlParams.get('step_name') || urlParams.get('step_title') || urlParams.get('context') || 'Firma Elettronica Certificata';
    const clientName = urlParams.get('client_name') || urlParams.get('customer_name') || (customerChatId ? 'Cliente #' + customerChatId : 'Cliente');
    const ash = urlParams.get('ash') || (window.TwaGuard?.getAsh?.()) || ('0xASH' + Date.now().toString(16));

    // Elementi DOM
    const lblJobId = document.getElementById('lbl-job-id');
    const lblJobStatus = document.getElementById('lbl-job-status');
    const lblClientName = document.getElementById('lbl-client-name');
    const lblStepName = document.getElementById('lbl-step-name');
    const docTitle = document.getElementById('doc-title');
    const btnBack = document.getElementById('btn-back');
    const btnTogglePreview = document.getElementById('btn-toggle-preview');
    const docPreviewContainer = document.getElementById('document-preview-container');
    const previewContent = document.getElementById('preview-content');

    const stateReady = document.getElementById('state-ready');
    const stateWaiting = document.getElementById('state-waiting');
    const stateSigned = document.getElementById('state-signed');
    const ablyStatusText = document.getElementById('ably-status-text');
    const signedTimestampLbl = document.getElementById('signed-timestamp-lbl');
    const lblSignedRef = document.getElementById('lbl-signed-ref');

    const btnActionPrimary = document.getElementById('btn-action-primary');
    const btnActionText = document.getElementById('btn-action-text');

    let isSigned = false;
    let isWaiting = false;
    let ablyInstance = null;
    let currentChannel = null;

    // Popolamento iniziale UI
    lblJobId.innerText = jobId;
    lblClientName.innerText = clientName;
    lblStepName.innerText = stepName;
    docTitle.innerText = templateId ? 'Documento: ' + templateId : stepName;

    // Back button
    btnBack.addEventListener('click', function () {
        window.history.back();
    });

    // Toggle Preview
    if (btnTogglePreview && docPreviewContainer) {
        btnTogglePreview.addEventListener('click', function () {
            const isHidden = docPreviewContainer.classList.contains('hidden');
            if (isHidden) {
                docPreviewContainer.classList.remove('hidden');
                btnTogglePreview.innerText = 'Nascondi Dettaglio';
            } else {
                docPreviewContainer.classList.add('hidden');
                btnTogglePreview.innerText = 'Mostra Dettaglio';
            }
        });
    }

    // Caricamento Documento Reale
    async function loadDocumentPreview() {
        if (!templateId) {
            previewContent.innerHTML = `
                <div class="p-3 text-gray-700 bg-white rounded-lg border border-gray-200">
                    <p class="font-bold text-slate-900 mb-1">Documento per Firma Elettronica Certificata</p>
                    <p>Procedura a norma di legge per l'attività: <strong>${stepName}</strong> (Job ${jobId}).</p>
                </div>
            `;
            return;
        }

        try {
            const response = await fetch(DOC_ENGINE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_doc_template',
                    doc_template_id: templateId,
                    owner_id: ownerId,
                    ash: ash
                })
            });

            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            const template = data?.data || data?.template || {};

            if (template.body_html || template.rendered_html) {
                previewContent.innerHTML = template.body_html || template.rendered_html;
                if (template.name) {
                    docTitle.innerText = template.name;
                }
            } else {
                previewContent.innerHTML = `<p class="text-gray-500 italic">Template ${templateId} caricato senza testo formattato.</p>`;
            }
        } catch (err) {
            console.warn('Avviso caricamento anteprima template:', err);
            previewContent.innerHTML = `<p class="text-gray-500 italic">Documento associato allo step: ${stepName}</p>`;
        }
    }

    loadDocumentPreview();

    // Sottoscrizione Ably Realtime
    function initAblyRealtime() {
        if (!window.Ably) {
            console.warn('⚠️ Ably Realtime SDK non presente. Il fallback rimarrà in ascolto manuale.');
            if (ablyStatusText) ablyStatusText.innerText = 'Realtime Offline';
            return;
        }

        try {
            ablyInstance = new window.Ably.Realtime({
                authCallback: async function (tokenParams, callback) {
                    try {
                        const response = await fetch(SSE_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'get_ably_token',
                                ash: ash
                            })
                        });

                        if (!response.ok) throw new Error('HTTP error ' + response.status + ' su get_ably_token');
                        const data = await response.json();
                        if (data && data.token) {
                            callback(null, data.token);
                        } else {
                            callback(new Error(data?.error || 'Token Ably non trovato'), null);
                        }
                    } catch (e) {
                        console.error('❌ Errore authCallback Ably:', e);
                        callback(e, null);
                    }
                }
            });

            const channelName = 'owner:' + ownerId;
            currentChannel = ablyInstance.channels.get(channelName);
            currentChannel.subscribe(function (msg) {
                handleAblyMessage(msg);
            });

            ablyInstance.connection.on('connected', function () {
                console.log('🟢 [Ably Live] Connesso al canale:', channelName);
                if (ablyStatusText) ablyStatusText.innerText = 'Sincronizzazione Realtime Attiva';
            });

            ablyInstance.connection.on('disconnected', function () {
                console.warn('🟡 [Ably Live] Disconnesso da Ably.');
                if (ablyStatusText) ablyStatusText.innerText = 'Riconnessione Realtime...';
            });
        } catch (err) {
            console.error('❌ Errore inizializzazione Ably:', err);
        }
    }

    function handleAblyMessage(msg) {
        try {
            let payload = msg.data;
            if (typeof payload === 'string') {
                try { payload = JSON.parse(payload); } catch (_) {}
            }

            const eventType = payload?.event_type || msg.name;
            const eventRef = payload?.event_ref;

            console.log('⚡ [Ably Msg Ricevuto]', eventType, eventRef);

            if (eventType === 'DOCUMENT_SIGNED' && (!eventRef || eventRef === jobId || eventRef.includes(jobId))) {
                setSignedState(payload);
            }
        } catch (e) {
            console.error('Errore elaborazione messaggio Ably:', e);
        }
    }

    initAblyRealtime();

    // Invio Richiesta Firma al Cliente
    async function requestCustomerSignature() {
        if (!customerChatId) {
            const promptChatId = prompt('Inserisci il Chat ID Telegram del cliente:', '');
            if (!promptChatId) {
                if (tg?.showAlert) tg.showAlert('È necessario specificare il cliente per inviare la richiesta di firma.');
                else alert('È necessario specificare il cliente per inviare la richiesta di firma.');
                return;
            }
        }

        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        btnActionPrimary.disabled = true;
        btnActionPrimary.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Invio Notifica Telegram in corso...</span>`;

        const requestPayload = {
            action: 'request_customer_signature',
            job_id: jobId,
            doc_template_id: templateId || null,
            customer_chat_id: customerChatId,
            owner_id: ownerId,
            vat_number: ownerId,
            step_name: stepName,
            compliance_route: COMPLIANCE_ROUTE,
            operator_id: operatorId,
            ash: ash
        };

        if (window.OfflineQueue && typeof window.OfflineQueue.executeOrEnqueue === 'function') {
            const result = await window.OfflineQueue.executeOrEnqueue({
                url: DOC_ENGINE_ENDPOINT,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: requestPayload,
                action_type: 'REQUEST_CUSTOMER_SIGNATURE',
                metadata: {
                    job_id: jobId,
                    doc_template_id: templateId,
                    customer_chat_id: customerChatId,
                    compliance_route: COMPLIANCE_ROUTE
                }
            });

            if (result.queued) {
                isWaiting = true;
                stateReady.classList.add('hidden');
                stateWaiting.classList.remove('hidden');
                lblJobStatus.innerText = 'Salvato in Memoria Locale';
                lblJobStatus.className = 'text-amber-600 font-bold';

                if (ablyStatusText) ablyStatusText.innerText = 'In attesa di connessione di rete';

                btnActionPrimary.disabled = true;
                btnActionPrimary.className = 'w-full py-4 bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center space-x-2 text-sm tracking-wide';
                btnActionPrimary.innerHTML = `<i class="fa-solid fa-cloud-arrow-up text-amber-700 animate-pulse"></i><span>Richiesta in Coda di Sincronizzazione</span>`;

                if (tg?.showAlert) {
                    tg.showAlert('Connessione di rete non disponibile. La richiesta di firma è stata salvata in memoria locale e verrà inviata non appena la rete torna disponibile.');
                } else {
                    alert('Connessione di rete non disponibile. La richiesta di firma è stata salvata in memoria locale e verrà inviata non appena la rete torna disponibile.');
                }
                return;
            }

            if (result.ok) {
                // Transizione standard a stato in attesa
                isWaiting = true;
                stateReady.classList.add('hidden');
                stateWaiting.classList.remove('hidden');
                lblJobStatus.innerText = 'In Attesa Cliente...';
                lblJobStatus.className = 'text-amber-600 font-bold animate-pulse';

                btnActionPrimary.disabled = true;
                btnActionPrimary.className = 'w-full py-4 bg-slate-200 text-slate-500 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center space-x-2 text-sm tracking-wide';
                btnActionPrimary.innerHTML = `<i class="fa-solid fa-clock"></i><span>In Attesa della Firma del Cliente...</span>`;

                if (tg?.showAlert) {
                    tg.showAlert('✅ Richiesta di firma inviata con successo al cliente via Telegram!');
                }
                return;
            }

            // Errore reale dal server (HTTP 4xx o 5xx)
            btnActionPrimary.disabled = false;
            btnActionPrimary.innerHTML = `<i class="fa-solid fa-paper-plane text-cyan-400"></i><span>Invia Richiesta di Firma al Cliente</span>`;
            const errMsg = 'Il server ha restituito un errore (Stato ' + result.status + '). Verifica i dati e riprova.';
            if (tg?.showAlert) tg.showAlert(errMsg);
            else alert(errMsg);
            return;
        }

        try {
            const response = await fetch(DOC_ENGINE_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            const result = await response.json();

            if (!response.ok || result?.success === false) {
                throw new Error(result?.error || result?.message || 'Errore durante la richiesta di firma');
            }

            // Transizione a stato "In attesa"
            isWaiting = true;
            stateReady.classList.add('hidden');
            stateWaiting.classList.remove('hidden');
            lblJobStatus.innerText = 'In Attesa Cliente...';
            lblJobStatus.className = 'text-amber-600 font-bold animate-pulse';

            btnActionPrimary.disabled = true;
            btnActionPrimary.className = 'w-full py-4 bg-slate-200 text-slate-500 font-bold rounded-2xl cursor-not-allowed flex items-center justify-center space-x-2 text-sm tracking-wide';
            btnActionPrimary.innerHTML = `<i class="fa-solid fa-clock"></i><span>In Attesa della Firma del Cliente...</span>`;

            if (tg?.showAlert) {
                tg.showAlert('✅ Richiesta di firma inviata con successo al cliente via Telegram!');
            }
        } catch (err) {
            console.error('❌ Errore invio richiesta firma:', err);
            btnActionPrimary.disabled = false;
            btnActionPrimary.innerHTML = `<i class="fa-solid fa-paper-plane text-cyan-400"></i><span>Invia Richiesta di Firma al Cliente</span>`;
            if (tg?.showAlert) {
                tg.showAlert('Errore invio richiesta: ' + (err.message || 'Riprova tra poco.'));
            } else {
                alert('Errore invio richiesta: ' + (err.message || 'Riprova tra poco.'));
            }
        }
    }

    // Passaggio a stato Firmato (Chiamato via Ably Realtime)
    function setSignedState(payload) {
        if (isSigned) return;
        isSigned = true;

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        stateReady.classList.add('hidden');
        stateWaiting.classList.add('hidden');
        stateSigned.classList.remove('hidden');

        lblJobStatus.innerText = 'Firmato ✅';
        lblJobStatus.className = 'text-emerald-700 font-bold';

        if (lblSignedRef) lblSignedRef.innerText = jobId;
        if (signedTimestampLbl) {
            const timeStr = payload?.timestamp ? new Date(payload.timestamp).toLocaleTimeString('it-IT') : new Date().toLocaleTimeString('it-IT');
            signedTimestampLbl.innerText = 'Confermato e notarizzato in tempo reale alle ' + timeStr;
        }

        btnActionPrimary.disabled = false;
        btnActionPrimary.className = 'w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 text-sm tracking-wide';
        btnActionPrimary.innerHTML = `<i class="fa-solid fa-circle-check"></i><span>Torna al Tabellone Operativo</span>`;

        btnActionPrimary.onclick = function () {
            window.location.href = 'desk_board.html';
        };
    }

    btnActionPrimary.addEventListener('click', function () {
        if (!isWaiting && !isSigned) {
            requestCustomerSignature();
        }
    });
});

