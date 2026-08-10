/**
 * Logica Operativa: document_sign_pad_logic.js
 * Via A (EXTERNAL_PAD) - Generazione PDF + Convalida Visiva Operatore Desk (Zero Image Upload)
 */

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job_id') || 'JOB_PAD_4410';
    const templateId = urlParams.get('template_id') || 'tpl_consenso_sbiancamento_01';
    const operatorId = urlParams.get('operator_id') || 'OP-8821';
    const deskId = urlParams.get('desk_id') || 'BANCO-01';

    const lblJobId = document.getElementById('lbl-job-id');
    const lblDeskId = document.getElementById('lbl-desk-id');
    const lblClientName = document.getElementById('lbl-client-name');
    const lblOperatorId = document.getElementById('lbl-operator-id');
    const docTitle = document.getElementById('doc-title');
    const btnBack = document.getElementById('btn-back');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnConfirmVisual = document.getElementById('btn-confirm-visual');
    const verificationBox = document.getElementById('verification-box');

    let isPdfDownloaded = false;

    lblJobId.innerText = jobId;
    lblDeskId.innerText = deskId;
    lblClientName.innerText = 'Mario Rossi';
    lblOperatorId.innerText = operatorId;
    docTitle.innerText = 'Consenso Informato Clinico (Tavoletta)';

    btnBack.addEventListener('click', function () {
        window.history.back();
    });

    const padTemplateRaw = `
        <div style="font-family: system-ui, sans-serif; padding: 20px; color: #0f172a;">
            <h2 style="color: #d97706; border-bottom: 2px solid #fef3c7; padding-bottom: 8px;">Consenso Informato Clinico per Tavoletta Biometrica</h2>
            <p><strong>Riferimento Pratica:</strong> {{job_id}}</p>
            <p><strong>Cliente:</strong> {{client_name}}</p>
            <p><strong>Postazione Desk:</strong> {{desk_id}}</p>
            <p><strong>Operatore Responsabile:</strong> {{operator_id}}</p>
            <div style="margin: 20px 0; padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b;">
                Il cliente rilascia il proprio consenso mediante la sottoscrizione grafometrica sulla tavoletta hardware di postazione.
            </div>
            <div style="margin-top: 40px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
                <p>Spazio Firma Biometrica Hardware (Spazio Riservato Tavoletta Esterna):</p>
                <div style="height: 80px; border: 1px dashed #94a3b8; border-radius: 8px; display: flex; items-center; justify-center; color: #94a3b8;">
                    Firma Hardware Wacom / Topaz
                </div>
            </div>
        </div>
    `;

    btnDownloadPdf.addEventListener('click', async function () {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.width = '210mm';
        wrapper.style.background = '#ffffff';

        let renderedHTML = padTemplateRaw
            .replace(/\{\{\s*job_id\s*\}\}/g, jobId)
            .replace(/\{\{\s*client_name\s*\}\}/g, 'Mario Rossi')
            .replace(/\{\{\s*desk_id\s*\}\}/g, deskId)
            .replace(/\{\{\s*operator_id\s*\}\}/g, operatorId);

        wrapper.innerHTML = renderedHTML;
        document.body.appendChild(wrapper);

        btnDownloadPdf.disabled = true;
        btnDownloadPdf.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Preparazione Documento in corso...</span>`;

        try {
            if (window.TrustStampEngine) {
                await window.TrustStampEngine.generatePDF(wrapper, `Documento_Tavoletta_${jobId}.pdf`);
            }
            document.body.removeChild(wrapper);

            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i><span>PDF Scaricato - Invia a Tavoletta Esterna</span>`;
            btnDownloadPdf.classList.replace('bg-gray-800', 'bg-emerald-950/40');
            btnDownloadPdf.classList.add('border-emerald-500/40');

            // Abilita Passo 2
            isPdfDownloaded = true;
            verificationBox.classList.remove('opacity-60', 'pointer-events-none');
            verificationBox.classList.add('border-amber-500/40');

            btnConfirmVisual.disabled = false;
            btnConfirmVisual.classList.remove('bg-gray-800', 'text-gray-500', 'cursor-not-allowed');
            btnConfirmVisual.classList.add('bg-gradient-to-r', 'from-amber-600', 'to-orange-600', 'text-white', 'shadow-lg', 'shadow-amber-600/30', 'hover:opacity-95');

            if (tg?.showAlert) {
                tg.showAlert('PDF scaricato! Ora puoi procedere con la firma del cliente su tavoletta e la Verifica Visiva.');
            }
        } catch (err) {
            console.error("Errore generazione PDF tavoletta:", err);
            btnDownloadPdf.disabled = false;
            btnDownloadPdf.innerHTML = `<i class="fa-solid fa-file-pdf text-red-400 text-base"></i><span>Riprova Scarico PDF</span>`;
            if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
        }
    });

    btnConfirmVisual.addEventListener('click', function () {
        if (!isPdfDownloaded) return;

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        const verificationPayload = {
            job_id: jobId,
            template_id: templateId,
            operator_id: operatorId,
            visual_verification_confirmed: true,
            signed_at: new Date().toISOString(),
            compliance_route: 'EXTERNAL_PAD'
        };

        console.log("Notifica Convalida Visiva registrata:", verificationPayload);

        btnConfirmVisual.disabled = true;
        btnConfirmVisual.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Registrazione Convalida su NoSQL...</span>`;

        setTimeout(function () {
            if (tg?.showAlert) {
                tg.showAlert('✅ Firma su Tavoletta convalidata visivamente con successo! Job pronto per la chiusura.');
            } else {
                alert('✅ Firma su Tavoletta convalidata visivamente con successo! Job pronto per la chiusura.');
            }
            window.location.href = 'desk_board.html';
        }, 1000);
    });
});
