/**
 * Logica Operativa: template_editor_logic.js
 * Editor Modelli Documentali NoSQL (Owner Setup) + AI Autocompilation Prompt Engine
 */

document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }

    const btnBack = document.getElementById('btn-back');
    const aiPromptInput = document.getElementById('ai-prompt-input');
    const btnAiGenerate = document.getElementById('btn-ai-generate');
    const txtTemplateTitle = document.getElementById('txt-template-title');
    const txtTemplateId = document.getElementById('txt-template-id');
    const txtSopId = document.getElementById('txt-sop-id');
    const selLayoutType = document.getElementById('sel-layout-type');
    const txtHtmlRaw = document.getElementById('txt-html-raw');
    const livePreviewBox = document.getElementById('live-preview-box');
    const btnInsertVarClient = document.getElementById('btn-insert-var-client');
    const btnInsertVarStamp = document.getElementById('btn-insert-var-stamp');
    const btnSaveTemplate = document.getElementById('btn-save-template');

    btnBack.addEventListener('click', function () {
        window.history.back();
    });

    const sampleInitialHtml = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; font-size: 11pt; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
        .content { margin: 15px 0; line-height: 1.6; }
        .signature-box { border-top: 1px dashed #cbd5e1; margin-top: 20px; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Consenso Informato Trattamento</h2>
        <p>{{company_name}} - P.IVA {{company_vat}}</p>
    </div>
    <div class="content">
        <p>Io sottoscritto <strong>{{client_name}}</strong> autorizzo l'operatore <strong>{{operator_name}}</strong> all'esecuzione del servizio.</p>
        <p>Data e Ora: {{timestamp}}</p>
    </div>
    <div class="signature-box">
        <p>Firma Cliente: {{signature_placeholder}}</p>
    </div>
    <div id="ash_stamp_placeholder">
        {{ash_stamp_placeholder}}
    </div>
</body>
</html>`;

    txtHtmlRaw.value = sampleInitialHtml;
    updatePreview();

    txtHtmlRaw.addEventListener('input', updatePreview);

    function updatePreview() {
        let raw = txtHtmlRaw.value;
        raw = raw.replace(/\{\{\s*company_name\s*\}\}/g, 'Centro Servizi SiteBoS');
        raw = raw.replace(/\{\{\s*company_vat\s*\}\}/g, 'IT09876543210');
        raw = raw.replace(/\{\{\s*client_name\s*\}\}/g, 'Mario Rossi');
        raw = raw.replace(/\{\{\s*operator_name\s*\}\}/g, 'Giuseppe Garofalo');
        raw = raw.replace(/\{\{\s*timestamp\s*\}\}/g, new Date().toLocaleString('it-IT'));
        raw = raw.replace(/\{\{\s*signature_placeholder\s*\}\}/g, '<span style="font-family:cursive; color:#1e40af; font-size:16px;">Mario Rossi (Firma Touch)</span>');
        raw = raw.replace(/\{\{\s*ash_stamp_placeholder\s*\}\}/g, '<div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:8px; font-family:monospace; font-size:9px;">[TIMBRO CRITTOGRAFICO ASH SITEBOS]</div>');
        livePreviewBox.innerHTML = raw;
    }

    btnInsertVarClient.addEventListener('click', function () {
        insertAtCursor(txtHtmlRaw, '{{client_name}}');
        updatePreview();
    });

    btnInsertVarStamp.addEventListener('click', function () {
        insertAtCursor(txtHtmlRaw, '{{ash_stamp_placeholder}}');
        updatePreview();
    });

    function insertAtCursor(field, value) {
        if (document.selection) {
            field.focus();
            const sel = document.selection.createRange();
            sel.text = value;
        } else if (field.selectionStart || field.selectionStart === 0) {
            const startPos = field.selectionStart;
            const endPos = field.selectionEnd;
            field.value = field.value.substring(0, startPos) + value + field.value.substring(endPos, field.value.length);
            field.selectionStart = startPos + value.length;
            field.selectionEnd = startPos + value.length;
        } else {
            field.value += value;
        }
    }

    // Simulazione Generazione AI da Prompt
    btnAiGenerate.addEventListener('click', function () {
        const promptText = aiPromptInput.value.trim();
        if (!promptText) {
            if (tg?.showAlert) {
                tg.showAlert('Scrivi una breve descrizione del documento per generarlo con l\'AI.');
            } else {
                alert('Scrivi una breve descrizione del documento per generarlo con l\'AI.');
            }
            return;
        }

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        btnAiGenerate.disabled = true;
        btnAiGenerate.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Elaborazione AI...</span>`;

        setTimeout(function () {
            txtTemplateTitle.value = promptText.substring(0, 40);
            txtTemplateId.value = 'tpl_' + promptText.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
            txtSopId.value = 'SOP-DENT-052';

            txtHtmlRaw.value = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: system-ui, sans-serif; font-size: 11pt; color: #0f172a; padding: 15px; }
        .title { color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; font-size: 14pt; }
        .section { margin: 12px 0; }
        .legal { font-size: 9pt; color: #64748b; background: #f8fafc; padding: 10px; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="title">${promptText}</div>
    <p>Azienda: {{company_name}} - P.IVA {{company_vat}}</p>
    
    <div class="section">
        <p><strong>Paziente / Cliente:</strong> {{client_name}}</p>
        <p><strong>Operatore Incaricato:</strong> {{operator_name}} (ID: {{operator_id}})</p>
        <p><strong>Data/Ora:</strong> {{timestamp}}</p>
    </div>

    <div class="legal">
        <h3>Diritti dell'Interessato (GDPR Art. 15-22)</h3>
        <p>Il sottoscritto dichiara di aver ricevuto e compreso l'informativa legale prima della sottoscrizione.</p>
    </div>

    <div style="margin-top: 25px;">
        <p>Firma per Consenso:</p>
        <div>{{signature_placeholder}}</div>
    </div>

    <div style="margin-top: 20px;">
        {{ash_stamp_placeholder}}
    </div>
</body>
</html>`;

            updatePreview();
            btnAiGenerate.disabled = false;
            btnAiGenerate.innerHTML = `<i class="fa-solid fa-bolt"></i><span>Genera</span>`;

            if (tg?.showAlert) {
                tg.showAlert('✨ Modello generato dall\'AI con successo!');
            }
        }, 1200);
    });

    btnSaveTemplate.addEventListener('click', function () {
        const title = txtTemplateTitle.value.trim();
        const templateId = txtTemplateId.value.trim();
        const sopId = txtSopId.value.trim();
        const route = document.querySelector('input[name="compliance_route"]:checked').value;

        if (!title || !templateId) {
            if (tg?.showAlert) {
                tg.showAlert('Compila il Titolo ed il Codice Slug del Modello prima di salvare.');
            } else {
                alert('Compila il Titolo ed il Codice Slug del Modello prima di salvare.');
            }
            return;
        }

        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

        const payload = {
            template_id: templateId,
            sop_id: sopId,
            meta: {
                title: title,
                version: "1.0.0",
                created_at: new Date().toISOString()
            },
            compliance_route: route,
            layout_type: selLayoutType.value,
            html_template_raw: txtHtmlRaw.value
        };

        console.log("Salvataggio Template NoSQL su MongoDB TbosTemplates:", payload);

        btnSaveTemplate.disabled = true;
        btnSaveTemplate.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i><span>Salvataggio in corso...</span>`;

        setTimeout(function () {
            if (tg?.showAlert) {
                tg.showAlert(`✅ Modello "${title}" salvato con successo nel database TbosTemplates!`);
            } else {
                alert(`✅ Modello "${title}" salvato con successo nel database TbosTemplates!`);
            }
            btnSaveTemplate.disabled = false;
            btnSaveTemplate.innerHTML = `<i class="fa-solid fa-floppy-disk"></i><span>Salva Modello Documentale NoSQL</span>`;
        }, 1000);
    });
});
