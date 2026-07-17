const dvrCommonStyles = `
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            color: #0f172a;
            line-height: 1.5;
            font-size: 9.5pt;
            background: #fff;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
        
        .page {
            width: 210mm;
            height: 297mm;
            padding: 20mm 18mm;
            box-sizing: border-box;
            background: #fff;
            position: relative;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        /* Cover page style */
        .cover {
            justify-content: space-between;
            padding: 24mm 18mm;
        }
        
        .cover-header {
            text-align: center;
        }
        
        .cover-title {
            font-size: 24pt;
            font-weight: 900;
            letter-spacing: -0.03em;
            line-height: 1.15;
            color: #0f172a;
            margin-top: 50px;
            text-transform: uppercase;
        }
        
        .cover-subtitle {
            font-size: 12pt;
            color: #475569;
            margin-top: 20px;
            font-weight: 500;
            line-height: 1.5;
            border-top: 2px solid #0f172a;
            padding-top: 20px;
        }

        /* Common Headers & Text */
        .header-doc {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        
        .header-doc h2 {
            font-size: 11pt;
            font-weight: 900;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 0.05em;
            color: #0f172a;
        }
        
        .header-doc span {
            font-size: 8pt;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .chapter-title {
            font-size: 14pt;
            font-weight: 900;
            color: #0f172a;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 6px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: -0.01em;
        }
        
        .section-subtitle {
            font-size: 9.5pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-left: 3px solid #0f172a;
            padding-left: 8px;
        }
        
        p {
            text-align: justify;
            margin-bottom: 10px;
            font-size: 9pt;
            color: #334155;
        }
        
        /* Info Box */
        .info-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 16px;
            margin: 15px 0;
        }
        
        .info-title {
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 8.5pt;
        }
        
        .info-row:last-child {
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: #64748b;
        }
        
        .info-value {
            font-weight: 700;
            color: #0f172a;
            text-align: right;
            max-width: 65%;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            font-size: 8.5pt;
        }
        
        th, td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background-color: #f8fafc;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
            letter-spacing: 0.03em;
            font-size: 8pt;
            border-bottom: 2px solid #e2e8f0;
        }
        
        tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        
        /* Risk Grid & Badges */
        .risk-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 14px 0;
        }
        
        .risk-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
        }
        
        .risk-card.initial {
            background: #f8fafc;
            border-left: 4px solid #64748b;
        }
        
        .risk-card.residual {
            border-left: 4px solid;
        }
        
        .risk-card.residual.low {
            background: #f0fdf4;
            border-color: #bbf7d0;
            border-left-color: #16a34a;
            color: #166534;
        }
        
        .risk-card.residual.mid {
            background: #fff7ed;
            border-color: #fed7aa;
            border-left-color: #d97706;
            color: #9a3412;
        }
        
        .risk-card.residual.high {
            background: #fef2f2;
            border-color: #fecdd3;
            border-left-color: #e11d48;
            color: #991b1b;
        }
        
        .risk-val {
            font-size: 16pt;
            font-weight: 900;
            margin: 6px 0 2px 0;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 6px;
            font-size: 7.5pt;
            font-weight: 800;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }
        
        .badge-success {
            background: #dcfce7;
            color: #16a34a;
        }
        
        .badge-danger {
            background: #fee2e2;
            color: #dc2626;
        }
        
        .badge-info {
            background: #e0f2fe;
            color: #0369a1;
        }
        
        .warning-box {
            background: #fff1f2;
            border: 1px solid #fecdd3;
            border-left: 4px solid #e11d48;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 8.5pt;
            color: #9f1239;
            margin-bottom: 8px;
        }
        
        .justification-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-left: 4px solid #0284c7;
            border-radius: 8px;
            padding: 12px;
            font-style: italic;
            font-size: 8.5pt;
            color: #0369a1;
            margin-bottom: 16px;
        }
        
        /* Footer & Signatures */
        .signature-area {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }
        
        .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px;
            min-height: 70px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            background: #f8fafc;
        }
        
        .signature-label {
            font-size: 7.5pt;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 30px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            letter-spacing: 0.05em;
        }
        
        .footer-page {
            font-size: 7.5pt;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-weight: 600;
        }
    </style>
`;

const CatalogPrintEngine = {
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

    
    parametriVerticali: {
        "comune": { D: 2, C: 1, desc_d: "Infortuni o patologie professionali generiche", normativa_rif: "D.Lgs. 81/08 Titolo II" },
        "generic": { D: 2, C: 1, desc_d: "Infortuni lievi (scivolamento, caduta in piano)", normativa_rif: "D.Lgs. 81/08 Titolo II" },
        "dental": { D: 3, C: 2, desc_d: "Patogeni ematogeni e respiratori a danno grave", normativa_rif: "D.Lgs. 81/08 Titolo X" },
        "health": { D: 3, C: 2, desc_d: "Patogeni biologici a danno grave, rischi chimici", normativa_rif: "D.Lgs. 81/08 Titolo X, Legge Gelli-Bianco" },
        "beauty": { D: 2, C: 2, desc_d: "Patogeni a danno moderato, lesioni cutanee", normativa_rif: "D.Lgs. 81/08 Titolo VIII, D.M. 206/2015" },
        "food": { D: 3, C: 2, desc_d: "Tossinfezioni, trasmissione alimentare, tagli, ustioni", normativa_rif: "Regolamento CE 852/2004 (HACCP)" }
    },

    
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

        // --- SE È UN COMPARTO MACRO, PRENDE LE DOMANDE DAL REGISTRO VERTICALI ---
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

        const vKey = typeof getVerticalForService === 'function' ? DVRPrintEngine.normalizeKey(getVerticalForService(service)) : 'comune';
        const param = DVRPrintEngine.parametriVerticali[vKey] || { D: 2, C: 1 };
        const dPartenza = param.D || 2;
        const rPartenza = 4 * dPartenza;

        // --- LETTURA VALORI DATABASE ---
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
        const rSeverityClass = rVal >= 8 ? 'high' : (rVal >= 4 ? 'mid' : 'low');

        const mitigationData = (mitigationControls || []).find(m => m.service_sku === sku);
        const operatoriCoinvolti = mitigationData?.operatori_coinvolti || [];
        const attrezzatureCoinvolte = mitigationData?.attrezzature_coinvolte || [];

        let singlePageCount = 1;

        // Costruzione HTML Foglio Singolo (Diviso in Pagine separate per evitare spaginazione)
        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                ${dvrCommonStyles}
            </head>
            <body>
                <!-- Pagina 1: Analisi e Rischio -->
                <div class="page">
                    <div class="page-content">
                        <div class="header-doc">
                            <span>Estratto DVR — D.Lgs. 81/08</span>
                            <h2>SCHEDA PROTOCOLLO</h2>
                        </div>
                        
                        <h2 class="chapter-title">${service.service_name.toUpperCase()}</h2>

                        <div class="section-subtitle">1. Inquadramento Operativo e Normativo</div>
                        <div class="info-box" style="margin-top: 0;">
                            <div class="info-row"><span class="info-label">ID Identificativo:</span><span class="info-value" style="font-family: monospace;">${sku}</span></div>
                            <div class="info-row"><span class="info-label">Inquadramento:</span><span class="info-value">${serviceDescription}</span></div>
                            <div class="info-row"><span class="info-label">Riferimenti Normativi:</span><span class="info-value">${rawLaws}</span></div>
                        </div>

                        <div class="section-subtitle">2. Analisi d'Impatto e Mitigazione del Rischio (Matrice INAIL)</div>
                        <div class="risk-grid">
                            <div class="risk-card initial">
                                <div style="font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">1. Rischio Potenziale (Senza Misure)</div>
                                <div class="risk-val" style="color: #64748b;">R = ${rPartenza}</div>
                                <div style="font-size: 8.5pt; color: #475569;">Danno (D): <strong>${dPartenza}</strong> &nbsp;|&nbsp; Probabilità (P): <strong>4</strong></div>
                            </div>
                            <div class="risk-card residual ${rSeverityClass}">
                                <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">2. Rischio Residuo (Con Misure)</div>
                                <div class="risk-val">R = ${rVal} <span style="font-size: 10pt; font-weight: 800;">(${rLabel})</span></div>
                                <div style="font-size: 8.5pt;">Danno (D): <strong>${dVal}</strong> &nbsp;|&nbsp; Probabilità (P): <strong>${pVal}</strong></div>
                            </div>
                        </div>
                        
                        ${justVal ? `<div class="justification-box"><strong>Ratio della Mitigazione:</strong> ${justVal}</div>` : ''}

                        ${riskWarnings.length > 0 ? `
                            <div class="section-subtitle">3. Avvertenze e Pericoli Critici Operativi</div>
                            ${riskWarnings.map(w => `<div class="warning-box">⚠️ ${w}</div>`).join('')}
                        ` : ''}
                    </div>

                    <div class="footer-page">
                        <span>${tenant.ragioneSociale}</span>
                        <span>Estratto DVR — Pagina ${singlePageCount++}</span>
                    </div>
                </div>

                <!-- Pagina Risorse Specifiche del Protocollo (Operatori + Attrezzature) -->
                ${(operatoriCoinvolti.length > 0 || attrezzatureCoinvolte.length > 0) ? `
                <div class="page">
                    <div class="page-content">
                        <div class="header-doc">
                            <span>Estratto DVR — D.Lgs. 81/08</span>
                            <h2>SCHEDA PROTOCOLLO</h2>
                        </div>
                        
                        <h2 class="chapter-title">${service.service_name.toUpperCase()}</h2>
                        
                        <div class="section-subtitle">Risorse Specifiche del Protocollo</div>
                        <p>Elenco delle figure professionali necessarie e delle attrezzature/macchinari di reparto impiegati nello svolgimento delle mansioni associate:</p>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; height: 350px;">
                            <div class="info-box" style="margin: 0; display: flex; flex-direction: column;">
                                <div class="info-title" style="color:#0f172a; border-bottom: 2px solid #0f172a; font-size: 9pt;">👥 Operatori e Figure</div>
                                ${operatoriCoinvolti.length > 0 ? `
                                    <ul style="margin: 0; padding-left: 18px; font-size: 9pt; color: #334155; line-height: 1.6; flex: 1;">
                                        ${operatoriCoinvolti.map(op => `<li style="margin-bottom: 6px;"><strong>${op}</strong></li>`).join('')}
                                    </ul>
                                ` : `
                                    <div style="font-size: 9pt; color: #94a3b8; font-style: italic; padding: 20px 10px;">Nessun operatore specifico.</div>
                                `}
                            </div>
                            <div class="info-box" style="margin: 0; display: flex; flex-direction: column;">
                                <div class="info-title" style="color:#0f172a; border-bottom: 2px solid #0f172a; font-size: 9pt;">⚙️ Attrezzature di Reparto</div>
                                ${attrezzatureCoinvolte.length > 0 ? `
                                    <ul style="margin: 0; padding-left: 18px; font-size: 9pt; color: #334155; line-height: 1.6; flex: 1;">
                                        ${attrezzatureCoinvolte.map(eq => `<li style="margin-bottom: 6px;"><strong>${eq}</strong></li>`).join('')}
                                    </ul>
                                ` : `
                                    <div style="font-size: 9pt; color: #94a3b8; font-style: italic; padding: 20px 10px;">Nessuna attrezzatura specifica.</div>
                                `}
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-page">
                        <span>${tenant.ragioneSociale}</span>
                        <span>Estratto DVR — Pagina ${singlePageCount++}</span>
                    </div>
                </div>
                ` : ''}
        `;

        // Pagine Checklist (Chunked per evitare overflow su capitoli lunghi)
        const checklistChunks = DVRPrintEngine.chunkArray(listItems, 10);
        checklistChunks.forEach((chunk, index) => {
            const isFirst = index === 0;
            html += `
                <!-- Pagina Checklist -->
                <div class="page">
                    <div class="page-content">
                        <div class="header-doc">
                            <span>Estratto DVR — D.Lgs. 81/08</span>
                            <h2>SCHEDA PROTOCOLLO</h2>
                        </div>
                        
                        <h2 class="chapter-title">${service.service_name.toUpperCase()} ${isFirst ? '' : '(Continua)'}</h2>
                        
                        <div class="section-subtitle">4. Stato delle Conformità Strutturali (Checklist) ${isFirst ? '' : '(Continua)'}</div>
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
                                ${chunk.map(item => {
                                    const isDone = !!state[item.id || item.question_id];
                                    return `
                                        <tr>
                                            <td style="font-family: monospace; font-size: 8pt; font-weight: bold;">${item.id || item.question_id}</td>
                                            <td><strong>${item.area || 'Compliance'}</strong></td>
                                            <td>${item.action || item.text || ""}</td>
                                            <td style="text-align:center;">
                                                ${isDone
                                                    ? '<span class="badge badge-success">ATTUATA ✓</span>'
                                                    : '<span class="badge badge-danger">IN ATTESA ✗</span>'}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>

                        <div style="margin-top:30px; border-top:1px solid #e2e8f0; padding-top:12px; font-size:8pt; color:#64748b; text-align:center;">
                            La presente scheda costituisce parte integrante e sostanziale del Documento di Valutazione dei Rischi aziendale.
                        </div>
                    </div>
                    
                    <div class="footer-page">
                        <span>${tenant.ragioneSociale}</span>
                        <span>Estratto DVR — Pagina ${singlePageCount++}</span>
                    </div>
                </div>
            `;
        });

        // Pagine Mitigazione (Chunked per evitare overflow)
        if (mitigationData && mitigationData.controlli_mitigazione && mitigationData.controlli_mitigazione.length > 0) {
            const mitigationChunks = DVRPrintEngine.chunkArray(mitigationData.controlli_mitigazione, 5);
            mitigationChunks.forEach((chunk, index) => {
                const isFirst = index === 0;
                html += `
                    <!-- Pagina Protocollo Specifico di Mitigazione -->
                    <div class="page">
                        <div class="page-content">
                            <div class="header-doc">
                                <span>Estratto DVR — D.Lgs. 81/08</span>
                                <h2>SCHEDA PROTOCOLLO</h2>
                            </div>
                            
                            <h2 class="chapter-title">${service.service_name.toUpperCase()} ${isFirst ? '' : '(Continua)'}</h2>
                            
                            <div class="section-subtitle">5. Protocollo Specifico di Mitigazione Fase per Fase ${isFirst ? '' : '(Continua)'}</div>
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
                                    ${chunk.map(mit => `
                                        <tr>
                                            <td><strong>${mit.fase_operativa}</strong></td>
                                            <td>${mit.check_prestabilito}<br><span class="badge badge-info" style="margin-top:4px;">Tipo: ${mit.tipo_evidenza}</span></td>
                                            <td style="color:#0f172a; font-weight:600;">${mit.criterio_accettazione}</td>
                                            <td>${mit.operatore_responsabile}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            
                            <div style="margin-top:30px; border-top:1px solid #e2e8f0; padding-top:12px; font-size:8pt; color:#64748b; text-align:center;">
                                La presente scheda costituisce parte integrante e sostanziale del Documento di Valutazione dei Rischi aziendale.
                            </div>
                        </div>
                        
                        <div class="footer-page">
                            <span>${tenant.ragioneSociale}</span>
                            <span>Estratto DVR — Pagina ${singlePageCount++}</span>
                        </div>
                    </div>
                `;
            });
        }

        html += `</body></html>`;

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.98);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;';
        overlay.innerHTML = '<div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #0f172a;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:20px;"></div><div id="pdf-progress" style="font-weight:bold;font-size:14px;color:#0f172a;">Digitalizzazione Alta Definizione...</div><style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>';
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
};

window.CatalogPrintEngine = CatalogPrintEngine;
