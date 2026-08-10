/**
 * Logica Operativa: document_sign_simple_logic.js
 * Firma Semplice Touch + Timbro ASH Crittografico + Rendering PDF
 */

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id') || 'JOB_DEMO_9981';
    const templateId = urlParams.get('template_id') || 'tpl_consenso_ordinario_01';
    const chatId = urlParams.get('chat_id') || tg?.initDataUnsafe?.user?.id || '76543210';
    const operatorId = urlParams.get('operator_id') || 'OP-8821';

    // Riferimenti DOM
    const lblJobId = document.getElementById('lbl-job-id');
    const lblClientName = document.getElementById('lbl-client-name');
    const lblSopId = document.getElementById('lbl-sop-id');
    const docTitle = document.getElementById('doc-title');
    const docPreviewContainer = document.getElementById('document-preview-container');
    const btnBack = document.getElementById('btn-back');
    const btnClearCanvas = document.getElementById('btn-clear-canvas');
    const btnSubmitStamp = document.getElementById('btn-submit-stamp');
    const hashVal = document.getElementById('hash-val');
    const canvasPlaceholder = document.getElementById('canvas-placeholder-text');

    // Canvas Firma
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let hasSigned = false;

    // Imposta dimensioni Canvas in base al contenitore
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Gestione Eventi Touch / Mouse per Canvas
    function startDrawing(e) {
        isDrawing = true;
        hasSigned = true;
        if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
        ctx.beginPath();
        const pos = getPos(e);
        ctx.moveTo(pos.x, pos.y);
        updateLiveHash();
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: true });
    canvas.addEventListener('touchmove', draw, { passive: true });
    canvas.addEventListener('touchend', stopDrawing);

    btnClearCanvas.addEventListener('click', function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
        if (canvasPlaceholder) canvasPlaceholder.style.display = 'flex';
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        hashVal.innerText = 'Generazione al tocco...';
    });

    btnBack.addEventListener('click', function () {
        window.history.back();
    });

    // Dati Sessione & Modello
    let activeTemplateRaw = `
        <div style="font-family: system-ui, sans-serif; padding: 15px; color: #1e293b;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px;">Consenso Informato Semplice</h2>
            <p><strong>Azienda Tenant:</strong> {{company_name}}</p>
            <p><strong>Cliente:</strong> {{client_name}}</p>
            <p><strong>Operatore Incaricato:</strong> {{operator_name}} (ID: {{operator_id}})</p>
            <div style="margin: 15px 0; padding: 12px; background: #f8fafc; border-left: 4px solid #4f46e5;">
                Il sottoscritto dichiara di aver preso visione delle condizioni di erogazione del servizio in data {{timestamp}}.
            </div>
            <div style="margin-top: 20px;">
                <p>Firma del Cliente:</p>
                <div id="signature_placeholder" style="border: 1px dashed #94a3b8; padding: 10px; min-height: 50px;">
                    {{signature_placeholder}}
                </div>
            </div>
        </div>
    `;

    const sampleVariables = {
        company_name: 'Centro Servizi SiteBoS',
        client_name: 'Mario Rossi',
        operator_name: 'Giuseppe Garofalo',
        operator_id: operatorId,
        timestamp: new Date().toLocaleString('it-IT')
    };

    // Popolamento iniziale UI
    lblJobId.innerText = jobId;
    lblClientName.innerText = sampleVariables.client_name;
    lblSopId.innerText = 'SOP-SERV-012';
    docTitle.innerText = 'Consenso Informato Semplice';

    // Render anteprima
    if (window.TrustStampEngine) {
        docPreviewContainer.innerHTML = window.TrustStampEngine.renderTemplate(activeTemplateRaw, sampleVariables);
    } else {
        docPreviewContainer.innerHTML = activeTemplateRaw;
    }

    function updateLiveHash() {
        if (!window.TrustStampEngine) return;
        const stamp = window.TrustStampEngine.generateASHStamp({
            tenant_id: sampleVariables.company_name,
            operator_id: operatorId,
            customer_chat_id: chatId,
            timestamp: new Date().toISOString(),
            gps_coords: { lat: 38.1157, lon: 13.3614 }
        });
        hashVal.innerText = stamp.ash_hash.substring(0, 18) + '...';
    }

    // Invio e Firma
    btnSubmitStamp.addEventListener('click', async function () {
        if (!hasSigned) {
            if (tg?.showAlert) {
                tg.showAlert('Per favore, traccia la tua firma nel riquadro bianco prima di proseguire.');
            } else {
                alert('Per favore, traccia la tua firma nel riquadro bianco prima di proseguire.');
            }
            return;
        }

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        const signatureBase64 = canvas.toDataURL('image/png');
        const stampData = window.TrustStampEngine ? window.TrustStampEngine.generateASHStamp({
            tenant_id: sampleVariables.company_name,
            operator_id: operatorId,
            customer_chat_id: chatId,
            timestamp: new Date().toISOString(),
            gps_coords: { lat: 38.1157, lon: 13.3614 }
        }) : { ash_hash: '0xASH9981DEMO' };

        // Costruisce documento finale completo di Firma + Timbro
        let finalVariables = { ...sampleVariables };
        finalVariables.signature_placeholder = `<img src="${signatureBase64}" style="max-height: 60px;" alt="Firma Cliente">`;
        
        let finalHTML = window.TrustStampEngine.renderTemplate(activeTemplateRaw, finalVariables);
        if (window.TrustStampEngine) {
            finalHTML += window.TrustStampEngine.renderSecurityStampHTML(stampData);
        }

        // Genera elemento temporaneo per download PDF
        const pdfWrapper = document.createElement('div');
        pdfWrapper.style.position = 'absolute';
        pdfWrapper.style.left = '-9999px';
        pdfWrapper.style.width = '210mm';
        pdfWrapper.style.background = '#ffffff';
        pdfWrapper.innerHTML = finalHTML;
        document.body.appendChild(pdfWrapper);

        btnSubmitStamp.disabled = true;
        btnSubmitStamp.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Generazione PDF e Notarizzazione...</span>`;

        try {
            if (window.TrustStampEngine) {
                await window.TrustStampEngine.generatePDF(pdfWrapper, `Documento_FIRMATA_${jobId}.pdf`);
            }
            document.body.removeChild(pdfWrapper);

            // Simula notifica backend n8n
            console.log("Notifica Webhook Signature inviata con successo:", stampData);

            if (tg?.showAlert) {
                tg.showAlert('✅ Documento firmato, timbrato e scaricato con successo!');
            } else {
                alert('✅ Documento firmato, timbrato e scaricato con successo!');
            }

            window.location.href = 'operator_dashboard.html';
        } catch (err) {
            console.error("Errore firma:", err);
            btnSubmitStamp.disabled = false;
            btnSubmitStamp.innerHTML = `<i class="fa-solid fa-lock"></i><span>Applica Timbro Crittografico e Convalida</span>`;
            if (document.body.contains(pdfWrapper)) document.body.removeChild(pdfWrapper);
        }
    });
});
