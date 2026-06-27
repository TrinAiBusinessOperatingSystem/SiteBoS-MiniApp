const DVRPrintEngine = {
    // ════ HELPER DI BASE ════
    normalizeKey: function (key) {
        const k = (key || '').toLowerCase().trim();
        if (k === 'common' || k === 'comune') return 'comune';
        if (k === 'dental' || k === 'dentale') return 'dental';
        if (k === 'health' || k === 'sanita' || k === 'sanità') return 'health';
        if (k === 'beauty' || k === 'estetica') return 'beauty';
        if (k === 'food' || k === 'ristorazione') return 'food';
        if (k === 'hospitality' || k === 'ospitalita' || k === 'ospitalità') return 'hospitality';
        if (k === 'professional' || k === 'ufficio' || k === 'uffici') return 'professional';
        if (k === 'workshop' || k === 'officina' || k === 'artigianato') return 'workshop';
        if (k === 'construction' || k === 'cantiere' || k === 'edilizia') return 'construction';
        return 'generic';
    },

    metaLocal: {
        "comune": { name: "Infrastruttura, Impianti e Antincendio" },
        "generic": { name: "Generico / Altro" },
        "dental": { name: "Odontoiatria / Clinico" },
        "health": { name: "Sanità / Studi Medici" },
        "beauty": { name: "Estetica e Benessere" },
        "food": { name: "Ristorazione ed Ho.Re.Ca." },
        "hospitality": { name: "Ospitalità e Hotel" },
        "professional": { name: "Servizi Professionali" },
        "workshop": { name: "Officine e Artigianato" },
        "construction": { name: "Edilizia e Impiantistica" }
    },

    parametriVerticali: {
        "comune": { D: 2, C: 1, desc_d: "Infortuni o patologie professionali generiche", normativa_rif: "D.Lgs. 81/08 Titolo II" },
        "generic": { D: 2, C: 1, desc_d: "Infortuni lievi (scivolamento, caduta in piano)", normativa_rif: "D.Lgs. 81/08 Titolo II" },
        "dental": { D: 3, C: 2, desc_d: "Patogeni ematogeni e respiratori a danno grave", normativa_rif: "D.Lgs. 81/08 Titolo X" },
        "health": { D: 3, C: 2, desc_d: "Patogeni biologici a danno grave, rischi chimici", normativa_rif: "D.Lgs. 81/08 Titolo X, Legge Gelli-Bianco" },
        "beauty": { D: 2, C: 2, desc_d: "Patogeni a danno moderato, lesioni cutanee", normativa_rif: "D.Lgs. 81/08 Titolo VIII, D.M. 206/2015" },
        "food": { D: 3, C: 2, desc_d: "Tossinfezioni, trasmissione alimentare, tagli, ustioni", normativa_rif: "Regolamento CE 852/2004 (HACCP)" }
    },

    // ══════════════════════════════════════════════════════════════════════
    // 1. STAMPA DEL SINGOLO SERVIZIO / CAPITOLO (ALTA QUALITÀ)
    // ══════════════════════════════════════════════════════════════════════
    printSingleService: async function (tenant, service, checklistState, mitigationControls, serverChecklistState) {
        if (window.showLoader) window.showLoader("Generazione PDF Alta Qualità...");

        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

        const sku = service.service_sku;
        const state = checklistState[sku] || {};

        let serviceDescription = "Servizio clinico-operativo specializzato.";
        let riskWarnings = [];
        let listItems = [];
        let rawLaws = "D.Lgs. 81/08 (T.U. Sicurezza Lavoro), Linee Guida di settore.";

        if (typeof getDossierBySku === 'function') {
            const dossier = getDossierBySku(sku);
            if (dossier && dossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE) {
                const comp = dossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE;
                serviceDescription = comp.positioning || "";
                riskWarnings = comp.risk_warnings || [];
                listItems = comp.compliance_checklist || [];
                if (comp.regulatory_framework) {
                    const framework = comp.regulatory_framework;
                    rawLaws = [framework.medical_device_directive, framework.professional_liability, framework.gdpr_compliance].filter(Boolean).join('; ');
                }
            }
        }

        // --- NUOVO: SE È UN COMPARTO MACRO, PRENDE LE DOMANDE DAL REGISTRO VERTICALI ---
        if (listItems.length === 0 && typeof verticalsRegistry !== 'undefined' && verticalsRegistry[sku]) {
            verticalsRegistry[sku].risks.forEach(risk => {
                risk.checklist.forEach(q => {
                    listItems.push({
                        id: q.question_id,
                        area: risk.name,
                        action: q.text,
                        owner: 'Datore di Lavoro'
                    });
                });
            });
            serviceDescription = "Valutazione dei rischi strutturali, impiantistici e operativi del comparto.";
            rawLaws = verticalsRegistry[sku].law_references || rawLaws;
        }

        const vKey = typeof getVerticalForService === 'function' ? this.normalizeKey(getVerticalForService(service)) : 'comune';
        const param = this.parametriVerticali[vKey] || { D: 2, C: 1 };
        const dPartenza = param.D || 2;
        const rPartenza = 4 * dPartenza;

        // --- IL FIX È QUI ---
        const savedSkuData = (serverChecklistState && serverChecklistState[sku]) ? serverChecklistState[sku] : null;
        let dVal = dPartenza; let pVal = 4; let rVal = rPartenza; let justVal = "";

        if (savedSkuData && savedSkuData.D !== undefined) {
            dVal = savedSkuData.D; pVal = savedSkuData.P || 4; rVal = savedSkuData.R || (dVal * pVal); justVal = savedSkuData.overall_justification || "";
        } else {
            const total = listItems.length;
            const checkedCount = listItems.filter(item => state[item.id || item.question_id]).length;
            if (total > 0) pVal = Math.max(1, Math.min(4, Math.round(4 - (3 * (checkedCount / total)))));
            rVal = pVal * dVal;
            justVal = "Valutazione elaborata in tempo reale in base alle spunte applicate dal responsabile.";
        }

        const rLabel = rVal >= 8 ? 'ALTO' : (rVal >= 4 ? 'MEDIO' : 'BASSO');
        const rColor = rVal >= 8 ? '#e11d48' : (rVal >= 4 ? '#d97706' : '#16a34a');

        // Estrazione Mitigazioni per il singolo foglio
        const mitigationData = (mitigationControls || []).find(m => m.service_sku === sku);

        // Costruzione HTML Foglio Singolo
        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 10pt; background: #fff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
                    .page { width: 210mm; height: 297mm; padding: 18mm 15mm; box-sizing: border-box; background: #fff; position: relative; page-break-after: always; }
                    .header-doc { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 25px; }
                    .header-doc h2 { font-size: 18pt; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.05em; color: #1e3a8a; }
                    .header-doc p { font-size: 9pt; color: #64748b; margin: 4px 0 0 0; font-weight: bold; }
                    .section-subtitle { font-size: 12pt; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 10px; page-break-after: avoid; }
                    p { text-align: justify; margin-bottom: 12px; font-size: 10pt; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 9pt; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
                    th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; color: #334155; border-bottom: 2px solid #94a3b8; }
                    tbody tr:nth-child(even) { background-color: #f8fafc; }
                    
                    .risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; page-break-inside: avoid; }
                    .risk-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                    .risk-card.initial { background: #fafafa; border-left: 4px solid #94a3b8; }
                    .risk-card.residual { background: #f0fdf4; border-left: 4px solid #22c55e; border-color: #bbf7d0; }
                    .risk-val { font-size: 20pt; font-weight: 900; margin: 10px 0 5px 0; }
                    
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
                    .warning-box { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; padding: 12px 15px; font-size: 9.5pt; color: #9f1239; margin-bottom: 10px; page-break-inside: avoid; }
                    .justification-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; font-style: italic; font-size: 9.5pt; color: #0369a1; margin-bottom: 20px; page-break-inside: avoid; }
                    .footer-page { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
                <!-- Pagina 1: Analisi e Rischio -->
                <div class="page">
                    <div class="header-doc">
                        <span style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">Estratto Documento Valutazione Rischi (D.Lgs. 81/08)</span>
                        <h2>SCHEDA PROTOCOLLO: ${service.service_name.toUpperCase()}</h2>
                        <p>Redatto per: ${tenant.ragioneSociale} — Data: ${dateStr}</p>
                    </div>

                    <div class="section-subtitle">1. Inquadramento Operativo e Normativo</div>
                    <p><strong>Descrizione:</strong> ${serviceDescription}</p>
                    <p><strong>Riferimenti Legislativi:</strong> ${rawLaws}</p>

                    <div class="section-subtitle">2. Analisi d'Impatto e Mitigazione del Rischio (Matrice INAIL)</div>
                    <div class="risk-grid">
                        <div class="risk-card initial">
                            <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase;">1. Rischio Potenziale (Assenza Misure)</div>
                            <div class="risk-val" style="color: #94a3b8;">R = ${rPartenza}</div>
                            <div style="font-size: 9pt; color: #475569;">Danno (D): <strong>${dPartenza}</strong> &nbsp;|&nbsp; Probabilità: <strong>4</strong></div>
                        </div>
                        <div class="risk-card residual">
                            <div style="font-size: 8pt; font-weight: bold; color: #16a34a; text-transform: uppercase;">2. Rischio Residuo (Con Misure)</div>
                            <div class="risk-val" style="color: ${rColor};">R = ${rVal} <span style="font-size:12pt;">(${rLabel})</span></div>
                            <div style="font-size: 9pt; color: #475569;">Danno (D): <strong>${dVal}</strong> &nbsp;|&nbsp; Probabilità (P): <strong>${pVal}</strong></div>
                        </div>
                    </div>
                    
                    ${justVal ? `<div class="justification-box"><strong>Ratio della Mitigazione:</strong> ${justVal}</div>` : ''}

                    ${riskWarnings.length > 0 ? `
                        <div class="section-subtitle">3. Avvertenze e Pericoli Critici Operativi</div>
                        ${riskWarnings.map(w => `<div class="warning-box">⚠️ ${w}</div>`).join('')}
                    ` : ''}

                    <div class="footer-page"><span>${tenant.ragioneSociale} - Scheda Singola</span><span>Estratto DVR</span></div>
                </div>

                <!-- Pagina 2: Misure e Checklist -->
                <div class="page">
                    <div class="section-subtitle">4. Stato delle Conformità Strutturali (Checklist)</div>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 15%;">ID</th>
                                <th style="width: 25%;">Area</th>
                                <th style="width: 45%;">Azione di Conformità Requisita</th>
                                <th style="width: 15%; text-align:center;">Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listItems.map(item => {
            const isDone = !!state[item.id || item.question_id];
            return `
                                    <tr>
                                        <td style="font-family: monospace; font-size: 8pt; font-weight: bold;">${item.id || item.question_id}</td>
                                        <td><strong>${item.area || 'Compliance'}</strong></td>
                                        <td>${item.action || item.text || ""}</td>
                                        <td style="text-align:center;">
                                            ${isDone
                    ? '<span class="badge" style="background:#dcfce7; color:#16a34a;">ATTUATA ✓</span>'
                    : '<span class="badge" style="background:#fee2e2; color:#dc2626;">IN ATTESA ✗</span>'}
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>

                    ${(mitigationData && mitigationData.controlli_mitigazione) ? `
                        <div class="section-subtitle" style="margin-top:30px;">5. Protocollo Specifico di Mitigazione Fase per Fase</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:25%">Fase Operativa</th>
                                    <th style="width:30%">Check / Evidenza Richiesta</th>
                                    <th style="width:25%">Criterio di Accettazione</th>
                                    <th style="width:20%">Responsabile</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${mitigationData.controlli_mitigazione.map(mit => `
                                    <tr>
                                        <td><strong>${mit.fase_operativa}</strong></td>
                                        <td>${mit.check_prestabilito}<br><span class="badge" style="background:#e0f2fe; color:#0369a1; margin-top:4px;">Tipo: ${mit.tipo_evidenza}</span></td>
                                        <td style="color:#1e3a8a; font-weight:600;">${mit.criterio_accettazione}</td>
                                        <td>${mit.operatore_responsabile}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}

                    <div style="margin-top:40px; border-top:1px solid #e2e8f0; padding-top:10px; font-size:8pt; color:#64748b; text-align:center;">
                        La presente scheda costituisce parte integrante e sostanziale del Documento di Valutazione dei Rischi aziendale.
                    </div>
                    
                    <div class="footer-page"><span>${tenant.ragioneSociale} - Scheda Singola</span><span>Estratto DVR</span></div>
                </div>
            </body>
            </html>
        `;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.98);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;';
        overlay.innerHTML = '<div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #1e3a8a;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div><div id="pdf-progress" style="font-weight:bold;font-size:14px;color:#1e293b;">Digitalizzazione Alta Definizione...</div><style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>';
        document.body.appendChild(overlay);

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;top:0;left:-9999px;width:794px;opacity:1;z-index:99998;';
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
            await new Promise(r => setTimeout(r, 800));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.page');
            const progressText = document.getElementById('pdf-progress');

            for (let i = 0; i < pages.length; i++) {
                if (progressText) progressText.innerText = `Elaborazione Pagina ${i + 1} di ${pages.length}...`;

                const canvas = await html2canvas(pages[i], {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
            }

            const tgApp = window.Telegram?.WebApp;
            const isMobile = (tgApp && (tgApp.platform === 'android' || tgApp.platform === 'ios')) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (progressText) progressText.innerText = `Invio in corso...`;

            if (isMobile) {
                try {
                    const webhookUrl = typeof WEBHOOK_URL !== 'undefined' ? WEBHOOK_URL : 'https://prod.workflow.trinai.it/webhook/7f254dec-e28f-452a-afb9-2a2a90206cbb';
                    const sessionAsh = typeof ash !== 'undefined' ? ash : (new URLSearchParams(window.location.search)).get('ash') || 'dev';
                    const initData = tgApp?.initData || '';
                    const pdfBase64Uri = pdf.output('datauristring');
                    const base64Data = pdfBase64Uri.split(',')[1];
                    const filename = `DVR_Scheda_${service.service_name.replace(/\s+/g, '_')}.pdf`;

                    const webhookPayload = {
                        action: 'document_to_valut',
                        base64: base64Data,
                        mimetype: 'application/pdf',
                        filename: filename,
                        ash: sessionAsh,
                        _auth: initData
                    };

                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookPayload)
                    });

                    if (tgApp && tgApp.showAlert) {
                        tgApp.showAlert("✅ Scheda Protocollo generata in Alta Qualità! In arrivo nella chat.");
                    } else {
                        alert("✅ Documento generato e inviato al server.");
                    }
                } catch (err) {
                    console.error('Error mobile single print:', err);
                }
            } else {
                const pdfBytes = pdf.output('arraybuffer');
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `DVR_Scheda_${service.service_name.replace(/\s+/g, '_')}.pdf`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
        } catch (err) {
            console.error('Single PDF Error:', err);
            alert('Errore generazione capitolo: ' + err.message);
        } finally {
            document.body.removeChild(container);
            document.body.removeChild(overlay);
            if (window.hideLoader) window.hideLoader();
        }
    },


    // ══════════════════════════════════════════════════════════════════════
    // 2. STAMPA DEL LIBRO COMPLETO DVR (ALTA QUALITÀ)
    // ══════════════════════════════════════════════════════════════════════
    generateAndPrint: async function (tenant, catalog, checklistState, ownerData, mitigationControls, serverChecklistState) {
        if (window.showLoader) window.showLoader("Generazione Documento Tecnico...");

        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

        const operators = ownerData.operators || [];
        const machinery = ownerData.machinery || [];
        let pianoDiMiglioramento = [];

        // Costruzione HTML Libro Intero
        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; font-size: 10pt; background: #fff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
                    .page { width: 210mm; height: 297mm; padding: 18mm 15mm; box-sizing: border-box; background: #fff; position: relative; page-break-after: always;}
                    h1, h2, h3 { color: #0f172a; margin-top: 0; }
                    .cover-title { font-size: 26pt; font-weight: 900; letter-spacing: -0.5px; margin-top: 60px; line-height: 1.1; text-transform: uppercase; color: #1e3a8a; }
                    .cover-subtitle { font-size: 14pt; color: #475569; margin-top: 15px; font-weight: 600; border-top: 2px solid #e2e8f0; padding-top: 15px;}
                    .chapter-title { font-size: 16pt; font-weight: 900; color: #1e3a8a; border-bottom: 3px solid #3b82f6; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; }
                    .section-subtitle { font-size: 12pt; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 10px; border-left: 4px solid #3b82f6; padding-left: 10px; page-break-after: avoid; }
                    
                    .info-box { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; margin: 20px 0; page-break-inside: avoid; }
                    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 11pt; }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: bold; color: #64748b; }
                    .info-value { font-weight: 600; color: #0f172a; text-align: right; max-width: 65%; }
                    p { text-align: justify; margin-bottom: 12px; font-size: 10pt; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 9pt; page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
                    th { background-color: #f1f5f9; font-weight: bold; text-transform: uppercase; color: #334155; border-bottom: 2px solid #94a3b8; }
                    tbody tr:nth-child(even) { background-color: #f8fafc; }
                    
                    .risk-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; page-break-inside: avoid; }
                    .risk-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                    .risk-card.initial { background: #fafafa; border-left: 4px solid #94a3b8; }
                    .risk-card.residual { background: #f0fdf4; border-left: 4px solid #22c55e; border-color: #bbf7d0; }
                    .risk-val { font-size: 20pt; font-weight: 900; margin: 10px 0 5px 0; }
                    
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
                    .warning-box { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; padding: 12px 15px; font-size: 9.5pt; color: #9f1239; margin-bottom: 10px; page-break-inside: avoid; }
                    .justification-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; font-style: italic; font-size: 9.5pt; color: #0369a1; margin-bottom: 20px; page-break-inside: avoid; }
                    
                    .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; page-break-inside: avoid; }
                    .signature-box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; min-height: 80px; display: flex; flex-direction: column; justify-content: flex-end; }
                    .signature-label { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;}
                    .footer-page { position: absolute; bottom: 15mm; left: 15mm; right: 15mm; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px; display: flex; justify-content: space-between; }
                </style>
            </head>
            <body>
        `;

        const mappedSectorNames = tenant.activeVerticals.map(v => this.metaLocal[this.normalizeKey(v)]?.name || v).join(', ');

        // Pagina 1
        html += `
            <div class="page cover">
                <div>
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span class="badge" style="background: #1e3a8a; color: white;">DOCUMENTO UFFICIALE DI VALUTAZIONE</span>
                        <div style="font-size: 9pt; font-weight: bold; color: #64748b; margin-top: 10px; letter-spacing: 1px;">EX D.LGS. 81/2008 E S.M.I.</div>
                    </div>
                    <h1 class="cover-title">Documento di Valutazione dei Rischi (D.V.R.)</h1>
                    <p class="cover-subtitle">Valutazione Specialistica dei Rischi Biologici, Meccanici e Strutturali inerenti ai Processi Operativi Aziendali</p>
                </div>

                <div class="info-box" style="margin-top: 40px;">
                    <div class="info-title" style="font-size: 12pt; color: #1e3a8a;">Anagrafica Aziendale</div>
                    <div class="info-row"><span class="info-label">Ragione Sociale:</span><span class="info-value">${tenant.ragioneSociale}</span></div>
                    <div class="info-row"><span class="info-label">P.IVA / C.F.:</span><span class="info-value">${tenant.pIva}</span></div>
                    <div class="info-row"><span class="info-label">Sede Operativa:</span><span class="info-value">${tenant.indirizzo}</span></div>
                    <div class="info-row"><span class="info-label">Aree di Rischio Mappate:</span><span class="info-value">${mappedSectorNames}</span></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="info-box" style="margin: 0;">
                        <div class="info-title">Figure della Sicurezza</div>
                        <div style="margin-bottom: 8px;"><strong>RSPP:</strong><br>${tenant.generalMetadata.rspp}</div>
                        <div><strong>RLS:</strong><br>${tenant.generalMetadata.rls}</div>
                    </div>
                    <div class="info-box" style="margin: 0;">
                        <div class="info-title">Sorveglianza Sanitaria e Emergenze</div>
                        <div style="margin-bottom: 8px;"><strong>Medico Competente:</strong><br>${tenant.generalMetadata.medicoCompetente}</div>
                        <div><strong>Addetti Emergenze:</strong><br>${tenant.generalMetadata.addettiEmergenza.join(', ')}</div>
                    </div>
                </div>

                <div class="footer-page">
                    <span>Generato digitalmente in data ${dateStr}</span>
                    <span>Pagina 1</span>
                </div>
            </div>
        `;

        // Pagina 2
        html += `
            <div class="page">
                <h2 class="chapter-title">I. Metodologia e Risorse Aziendali</h2>
                
                <div class="section-subtitle">1.1 Metodologia di Valutazione (Algoritmo INAIL)</div>
                <p>La valutazione del rischio per ogni comparto e protocollo clinico è stata effettuata adottando il modello a matrice (<strong>R = P × D</strong>). Il <strong>Danno (D)</strong> valuta la magnitudo clinica/legale della lesione attesa. La <strong>Probabilità (P)</strong> stima la frequenza di accadimento in base allo stato delle misure preventive attuate dall'azienda. La mitigazione mira ad abbattere il parametro P.</p>

                <div class="section-subtitle">1.2 Organigramma Operativo e Mansioni Esaminate</div>
                <p>Mappatura del personale direttamente coinvolto nelle procedure operative e soggetto a sorveglianza sanitaria/formazione:</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width:40%">Nominativo</th>
                            <th style="width:35%">Qualifica / Ruolo</th>
                            <th style="width:25%">Contratto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${operators.length > 0 ? operators.map(op => `
                            <tr>
                                <td><strong>${op.OperatorName}</strong></td>
                                <td>${op.Job} <br><span style="font-size:8pt; color:#64748b">${op.specialization || '-'}</span></td>
                                <td>${op.contract || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="3">Nessun operatore specificato in anagrafica.</td></tr>'}
                    </tbody>
                </table>

                <div class="section-subtitle" style="margin-top:30px;">1.3 Registro Attrezzature e Impiantistica (D.Lgs. 81/08 Titolo III)</div>
                <p>Elenco delle attrezzature critiche presenti in struttura, soggette a direttive macchine o protocolli di manutenzione:</p>
                <table>
                    <thead>
                        <tr>
                            <th style="width:45%">Tipologia Macchinario / Dispositivo</th>
                            <th style="width:20%">Reparto d'uso</th>
                            <th style="width:15%">Acquisizione</th>
                            <th style="width:20%">Status Giuridico</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${machinery.length > 0 ? machinery.map(mac => `
                            <tr>
                                <td><strong>${mac.type}</strong></td>
                                <td><span class="badge" style="background:#e2e8f0; color:#475569;">${mac.vertical.toUpperCase()}</span></td>
                                <td>${mac.year || '-'}</td>
                                <td>${mac.ownership || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4">Nessun macchinario rilevante censito.</td></tr>'}
                    </tbody>
                </table>
                <div class="footer-page">
                    <span>${tenant.ragioneSociale} - DVR Operativo</span>
                    <span>Pagina 2</span>
                </div>
            </div>
        `;

        // Pagine Servizi
        const activeSectors = [...new Set(['comune', ...tenant.activeVerticals.map(v => this.normalizeKey(v))])];
        let pageCount = 3;

        activeSectors.forEach((vKey) => {
            const sectorServices = catalog.filter(s => {
                const normalizedSvcKey = typeof getVerticalForService === 'function' ? this.normalizeKey(getVerticalForService(s)) : 'comune';
                return normalizedSvcKey === vKey;
            });

            if (vKey !== 'comune' && sectorServices.length > 0) {
                sectorServices.forEach((service) => {
                    const sSku = service.service_sku;
                    const sState = checklistState[sSku] || {};
                    const sDossier = typeof getDossierBySku === 'function' ? getDossierBySku(sSku) : null;
                    const mitigationData = (mitigationControls || []).find(m => m.service_sku === sSku);

                    let sDescription = "Procedura standard.";
                    let sWarnings = [];
                    let sListItems = [];
                    let rawLaws = "D.Lgs. 81/08 e linee guida di settore.";

                    if (sDossier && sDossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE) {
                        const comp = sDossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE;
                        sDescription = comp.positioning || sDescription;
                        sWarnings = comp.risk_warnings || [];
                        sListItems = comp.compliance_checklist || [];
                        if (comp.regulatory_framework) {
                            const framework = comp.regulatory_framework;
                            rawLaws = [framework.medical_device_directive, framework.professional_liability, framework.gdpr_compliance].filter(Boolean).join('; ');
                        }
                    }

                    const param = this.parametriVerticali[vKey] || { D: 2 };
                    const dPartenza = param.D;
                    const rPartenza = 4 * dPartenza;
                    // --- IL FIX È QUI ---
                    const savedServiceData = (serverChecklistState && serverChecklistState[sSku]) ? serverChecklistState[sSku] : null;

                    let sd = dPartenza; let sp = 4; let sr = rPartenza; let sJustification = "";

                    if (savedServiceData && savedServiceData.D !== undefined) {
                        sd = savedServiceData.D; sp = savedServiceData.P || 4; sr = savedServiceData.R || (sd * sp); sJustification = savedServiceData.overall_justification || "";
                    } else {
                        const total = sListItems.length;
                        const checkedCount = sListItems.filter(item => sState[item.id || item.question_id]).length;
                        if (total > 0) sp = Math.max(1, Math.min(4, Math.round(4 - (3 * (checkedCount / total)))));
                        sr = sp * sd;
                        sJustification = "Valutazione elaborata in tempo reale in base alle spunte applicate.";
                    }

                    const srColor = sr >= 8 ? '#e11d48' : (sr >= 4 ? '#d97706' : '#16a34a');
                    const srLabel = sr >= 8 ? 'ALTO' : (sr >= 4 ? 'MEDIO' : 'BASSO');

                    sListItems.forEach(item => {
                        if (!sState[item.id || item.question_id]) {
                            pianoDiMiglioramento.push({ serviceName: service.service_name, area: item.area || 'Compliance', action: item.action || item.text, owner: item.owner || 'Non specificato' });
                        }
                    });

                    html += `
                        <div class="page">
                            <h2 class="chapter-title">${service.service_name}</h2>
                            
                            <div class="info-box" style="margin-top:0;">
                                <div class="info-row"><span class="info-label">ID Protocollo:</span><span class="info-value" style="font-family:monospace;">${sSku}</span></div>
                                <div class="info-row"><span class="info-label">Inquadramento:</span><span class="info-value">${sDescription}</span></div>
                                <div class="info-row"><span class="info-label">Normativa applicata:</span><span class="info-value">${rawLaws}</span></div>
                            </div>

                            <div class="section-subtitle">Stima del Rischio Specifico (INAIL)</div>
                            <div class="risk-grid">
                                <div class="risk-card initial">
                                    <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase;">Rischio Potenziale (Senza Misure)</div>
                                    <div class="risk-val" style="color: #94a3b8;">R = ${rPartenza}</div>
                                    <div style="font-size: 9pt; color: #475569;">Danno (D): <strong>${dPartenza}</strong> &nbsp;|&nbsp; Probabilità (P): <strong>4</strong> (Max)</div>
                                </div>
                                <div class="risk-card residual">
                                    <div style="font-size: 8pt; font-weight: bold; color: #16a34a; text-transform: uppercase;">Rischio Residuo Attuale (Mitigato)</div>
                                    <div class="risk-val" style="color: ${srColor};">R = ${sr} <span style="font-size:12pt;">(${srLabel})</span></div>
                                    <div style="font-size: 9pt; color: #475569;">Danno (D): <strong>${sd}</strong> &nbsp;|&nbsp; Probabilità (P): <strong>${sp}</strong></div>
                                </div>
                            </div>
                            
                            ${sJustification ? `<div class="justification-box"><strong>Ratio della Mitigazione:</strong> ${sJustification}</div>` : ''}

                            ${sWarnings.length > 0 ? `
                                <div class="section-subtitle">Vulnerabilità e Avvertenze Critiche</div>
                                ${sWarnings.map(w => `<div class="warning-box">${w}</div>`).join('')}
                            ` : ''}

                            <div class="section-subtitle">Stato Misure di Prevenzione (Checklist)</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:15%">ID</th>
                                        <th style="width:20%">Area</th>
                                        <th style="width:50%">Azione Prescritta</th>
                                        <th style="width:15%; text-align:center;">Stato</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sListItems.map(item => {
                        const isDone = !!sState[item.id || item.question_id];
                        return `
                                            <tr>
                                                <td style="font-family:monospace; font-size:8pt;">${item.id || item.question_id}</td>
                                                <td><strong>${item.area || 'N/A'}</strong></td>
                                                <td>${item.action || item.text || ""}</td>
                                                <td style="text-align:center;">
                                                    ${isDone
                                ? '<span class="badge" style="background:#dcfce7; color:#16a34a;">ATTUATA ✓</span>'
                                : '<span class="badge" style="background:#fee2e2; color:#dc2626;">IN ATTESA ✗</span>'}
                                                </td>
                                            </tr>
                                        `;
                    }).join('')}
                                </tbody>
                            </table>
                    `;

                    if (mitigationData && mitigationData.controlli_mitigazione) {
                        html += `
                            <div class="section-subtitle" style="page-break-before: auto; margin-top:30px;">Procedure di Verifica e Mitigazione Fase per Fase</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:25%">Fase Operativa</th>
                                        <th style="width:30%">Check / Evidenza Richiesta</th>
                                        <th style="width:30%">Criterio di Accettazione</th>
                                        <th style="width:15%">Responsabile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${mitigationData.controlli_mitigazione.map(mit => `
                                        <tr>
                                            <td><strong>${mit.fase_operativa}</strong></td>
                                            <td>${mit.check_prestabilito}<br><span class="badge" style="background:#e0f2fe; color:#0369a1; margin-top:4px;">Tipo: ${mit.tipo_evidenza}</span></td>
                                            <td style="color:#1e3a8a; font-weight:600;">${mit.criterio_accettazione}</td>
                                            <td>${mit.operatore_responsabile}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    }

                    html += `
                            <div class="footer-page">
                                <span>${tenant.ragioneSociale} - DVR Operativo</span>
                                <span>Pagina ${pageCount++}</span>
                            </div>
                        </div>
                    `;
                });
            }
        });

        // Pagina Finale
        html += `
            <div class="page">
                <h2 class="chapter-title">Piano di Miglioramento Aziendale</h2>
                
                <div class="section-subtitle">Azioni Correttive Programmate (Non ancora attuate)</div>
                <p>Ai sensi del D.Lgs. 81/08, di seguito si formalizza il piano delle misure di prevenzione identificate ma attualmente <strong>non completate</strong>. La direzione si impegna a stanziare le risorse per la loro chiusura.</p>
                
                ${pianoDiMiglioramento.length > 0 ? `
                    <table>
                        <thead>
                            <tr>
                                <th style="width:30%">Protocollo / Servizio Affetto</th>
                                <th style="width:15%">Area</th>
                                <th style="width:40%">Azione da Attuare</th>
                                <th style="width:15%">Assegnata A</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pianoDiMiglioramento.map(azione => `
                                <tr>
                                    <td><strong>${azione.serviceName}</strong></td>
                                    <td><span class="badge" style="background:#f1f5f9; color:#475569;">${azione.area}</span></td>
                                    <td style="color:#b91c1c; font-weight:600;">${azione.action}</td>
                                    <td>${azione.owner}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="info-box" style="background:#f0fdf4; border-color:#bbf7d0; text-align:center;">
                        <h3 style="color:#16a34a; margin:0;">Tutte le misure di prevenzione previste risultano regolarmente attuate.</h3>
                        <p style="margin:5px 0 0 0; color:#15803d;">Il piano di miglioramento si esaurisce nel mantenimento e controllo dei protocolli in essere.</p>
                    </div>
                `}

                <div class="section-subtitle" style="margin-top: 50px;">Firme e Approvazione Formale del Documento</div>
                <p>I sottoscritti attestano di aver collaborato all'analisi dei fattori di rischio, all'elaborazione del documento e alla definizione del piano di miglioramento.</p>

                <div class="signature-area">
                    <div class="signature-box">
                        <span class="signature-label">Il Datore di Lavoro (Titolare)</span>
                        <div style="font-size: 10pt; font-weight: bold; text-align: center;">${tenant.ragioneSociale}</div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Medico Competente Nominato</span>
                        <div style="font-size: 10pt; font-weight: bold; text-align: center;">${tenant.generalMetadata.medicoCompetente}</div>
                    </div>
                </div>

                <div class="signature-area" style="margin-top: 20px;">
                    <div class="signature-box">
                        <span class="signature-label">Il Responsabile S.P.P. (RSPP)</span>
                        <div style="font-size: 10pt; font-weight: bold; text-align: center;">${tenant.generalMetadata.rspp}</div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Rappresentante Lavoratori (RLS)</span>
                        <div style="font-size: 10pt; font-weight: bold; text-align: center;">${tenant.generalMetadata.rls}</div>
                    </div>
                </div>
                
                <div class="footer-page">
                    <span>${tenant.ragioneSociale} - DVR Operativo</span>
                    <span>Pagina ${pageCount}</span>
                </div>
            </div>
        </body></html>`;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.98);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;';
        overlay.innerHTML = '<div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #2b6cb0;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div><div id="pdf-progress" style="font-weight:bold;font-size:14px;color:#1e293b;">Compilazione Documento Tecnico...</div><style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>';
        document.body.appendChild(overlay);

        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;top:0;left:-9999px;width:794px;opacity:1;z-index:99998;';
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
            await new Promise(r => setTimeout(r, 1200));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.page');
            const progressText = document.getElementById('pdf-progress');

            for (let i = 0; i < pages.length; i++) {
                if (progressText) progressText.innerText = `Elaborazione in Alta Definizione: Pagina ${i + 1} di ${pages.length}...`;

                const canvas = await html2canvas(pages[i], {
                    scale: 3,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
            }

            const tgApp = window.Telegram?.WebApp;
            const isMobile = (tgApp && (tgApp.platform === 'android' || tgApp.platform === 'ios')) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (progressText) progressText.innerText = `Invio al server in corso...`;

            if (isMobile) {
                try {
                    const webhookUrl = typeof WEBHOOK_URL !== 'undefined' ? WEBHOOK_URL : 'https://prod.workflow.trinai.it/webhook/7f254dec-e28f-452a-afb9-2a2a90206cbb';
                    const sessionAsh = typeof ash !== 'undefined' ? ash : (new URLSearchParams(window.location.search)).get('ash') || 'dev';
                    const initData = tgApp?.initData || '';
                    const pdfBase64Uri = pdf.output('datauristring');
                    const base64Data = pdfBase64Uri.split(',')[1];
                    const filename = `DVR_${tenant.ragioneSociale.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

                    const webhookPayload = {
                        action: 'document_to_valut',
                        base64: base64Data,
                        mimetype: 'application/pdf',
                        filename: filename,
                        ash: sessionAsh,
                        _auth: initData
                    };

                    fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(webhookPayload)
                    });

                    if (tgApp && tgApp.showAlert) {
                        tgApp.showAlert("✅ Elaborato DVR generato con successo! Lo riceverai a breve in chat.");
                    } else {
                        alert("✅ Documento generato e inviato al server.");
                    }
                } catch (err) {
                    console.error('Mobile upload process error:', err);
                }
            } else {
                const pdfBytes = pdf.output('arraybuffer');
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `DVR_Valutazione_${tenant.ragioneSociale.replace(/\s+/g, '_')}.pdf`;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }

        } catch (err) {
            console.error('DVR PDF Error:', err);
            alert('Errore generazione PDF: ' + err.message);
        } finally {
            document.body.removeChild(container);
            document.body.removeChild(overlay);
            if (window.hideLoader) window.hideLoader();
        }
    }
};