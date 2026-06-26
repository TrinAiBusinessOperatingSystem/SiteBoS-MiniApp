const DVRPrintEngine = {
    // Helper interno per normalizzare le chiavi delle verticali (italiano ed inglese)
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

    // Metadati descrittivi per ciascun comparto
    metaLocal: {
        "comune": { emoji: "🏠", name: "Infrastruttura, Impianti e Antincendio" },
        "generic": { emoji: "💼", name: "Generico / Altro" },
        "dental": { emoji: "🦷", name: "Odontoiatria / Clinico" },
        "health": { emoji: "🏥", name: "Sanità / Studi Medici" },
        "beauty": { emoji: "💄", name: "Estetica e Benessere" },
        "food": { emoji: "🍳", name: "Ristorazione ed Ho.Re.Ca." },
        "hospitality": { emoji: "🛌", name: "Ospitalità e Hotel" },
        "professional": { emoji: "💼", name: "Servizi Professionali" },
        "workshop": { emoji: "🔧", name: "Officine e Artigianato" },
        "construction": { emoji: "🚧", name: "Edilizia e Impiantistica" }
    },

    // Parametri fisici fissi ereditati dai comparti
    parametriVerticali: {
        "comune": { D: 2, C: 1, desc_d: "Infortuni o patologie professionali generiche", normativa_rif: "D.Lgs. 81/08 Titolo II (Luoghi di lavoro)" },
        "generic": { D: 2, C: 1, desc_d: "Infortuni lievi (scivolamento, caduta in piano) o disturbi transitori", normativa_rif: "D.Lgs. 81/08 Titolo II (Luoghi di lavoro)" },
        "dental": { D: 3, C: 2, desc_d: "Patogeni ematogeni e respiratori a danno grave (HBV, HCV, HIV)", normativa_rif: "D.Lgs. 81/08 Titolo X (Agenti Biologici)" },
        "health": { D: 3, C: 2, desc_d: "Patogeni ematogeni e biologici a danno grave, rischi chimici da sterilizzanti", normativa_rif: "D.Lgs. 81/08 Titolo X (Agenti Biologici), Legge Gelli-Bianco" },
        "beauty": { D: 2, C: 2, desc_d: "Patogeni a danno moderato (infezioni micotiche, batteriche cutanee)", normativa_rif: "D.Lgs. 81/08 Titolo VIII Capo IV (Radiazioni Ottiche Laser)" },
        "food": { D: 3, C: 2, desc_d: "Tossinfezioni e infezioni a trasmissione alimentare (Salmonella, E. Coli)", normativa_rif: "Regolamento CE 852/2004 (HACCP)" },
        "hospitality": { D: 2, C: 1, desc_d: "Rischi da sovraccarico del rachide, rischio biologico da Legionellosi", normativa_rif: "D.Lgs. 81/08 Titolo VI (MMC), Linee Guida Legionellosi" },
        "professional": { D: 1, C: 1, desc_d: "Disturbi muscolo-scheletrici minori, affaticamento visivo", normativa_rif: "D.Lgs. 81/08 Titolo VII (Videoterminali)" },
        "workshop": { D: 3, C: 2, desc_d: "Schiacciamento, traumi gravi, esposizione chimica e rumore/vibrazioni", normativa_rif: "D.Lgs. 81/08 Titolo III (Attrezzature)" },
        "construction": { D: 3, C: 2, desc_d: "Cadute dall'alto, seppellimento, elettrocuzione e inalazione polveri", normativa_rif: "D.Lgs. 81/08 Titolo IV (Cantieri)" }
    },

    // ══════════════════════════════════════════════════════════════════════
    // GENERAZIONE CAPITOLO SINGOLO SERVIZIO (Enriched & Standalone)
    // ══════════════════════════════════════════════════════════════════════
    printSingleService: async function (tenant, service, checklistState) {
        if (window.showLoader) window.showLoader("Generazione PDF Servizio...");

        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

        const sku = service.service_sku;
        const state = checklistState[sku] || {};

        // Estrazione dati dal dossier
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
                    rawLaws = [
                        framework.medical_device_directive,
                        framework.professional_liability,
                        framework.deontology_rules,
                        framework.gdpr_compliance
                    ].filter(Boolean).join(', ');
                }
            }
        }

        // Calcolo parametri di rischio
        const vKey = typeof getVerticalForService === 'function' ? this.normalizeKey(getVerticalForService(service)) : 'comune';
        const param = this.parametriVerticali[vKey] || { D: 2, C: 1 };
        const dPartenza = param.D || 2;
        const rPartenza = 4 * dPartenza;

        // Recupero dei valori dinamici salvati nel DB
        const savedSkuData = (checklistState && checklistState[sku]) ? checklistState[sku] : null;
        const dVal = savedSkuData?.D || dPartenza;
        const pVal = savedSkuData?.P || 4;
        const rVal = savedSkuData?.R || rPartenza;
        const justVal = savedSkuData?.overall_justification || "";

        let rLabel = rVal >= 8 ? 'Alto' : (rVal >= 4 ? 'Medio' : 'Basso');
        const rBg = rVal >= 8 ? '#fee2e2' : (rVal >= 4 ? '#ffedd5' : '#dcfce7');
        const rColor = rVal >= 8 ? '#b91c1c' : (rVal >= 4 ? '#9a3412' : '#15803d');

        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a202c; line-height: 1.5; font-size: 11px; margin: 0; padding: 0; }
                    .page { width: 210mm; height: 297mm; padding: 20mm 15mm; box-sizing: border-box; background: #fff; }
                    .header-doc { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
                    .header-doc h2 { font-size: 14px; font-weight: 900; text-transform: uppercase; margin: 0; letter-spacing: 0.05em; }
                    .header-doc p { font-size: 9px; color: #718096; margin: 4px 0 0 0; font-weight: bold; }
                    .section-title { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #2b6cb0; border-left: 3px solid #2b6cb0; padding-left: 8px; margin-top: 20px; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
                    th { background-color: #edf2f7; font-weight: bold; font-size: 9px; text-transform: uppercase; }
                    ul { padding-left: 20px; margin-bottom: 10px; }
                    li { margin-bottom: 4px; }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="header-doc">
                        <span style="font-size: 8px; font-weight: bold; color: #718096; text-transform: uppercase; letter-spacing: 0.1em;">D.Lgs. 9 aprile 2008, n. 81 e s.m.i.</span>
                        <h2>Capitolo Specifico: ${service.service_name.toUpperCase()}</h2>
                        <p>Redatto per: ${tenant.ragioneSociale} — Sede: ${tenant.indirizzo}</p>
                    </div>

                    <div class="section-title">1. Descrizione del Servizio e Attività Clinico-Operativa</div>
                    <p style="text-align: justify;">${serviceDescription || "Prestazione specialistica erogata all'interno dei locali attrezzati dell'attività."}</p>

                    <div class="section-title">2. Quadro Normativo di Riferimento</div>
                    <p>Le procedure operative e i protocolli di prevenzione attuati fanno riferimento alle seguenti disposizioni legislative:</p>
                    <ul style="font-size: 10px;">
                        ${rawLaws.split(',').map(l => `<li><strong>${l.trim()}</strong></li>`).join('')}
                    </ul>

                    <div class="section-title">3. Valutazione d'Impatto e Mitigazione del Rischio (INAIL R = P x D)</div>
                    <p>Il confronto evidenzia l'efficacia delle misure applicate nel ridurre la probabilità d'accadimento rispetto allo scenario di partenza:</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0;">
                        <!-- Stato di Partenza -->
                        <div style="background:#fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                            <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #9ca3af; display:block;">1. Stato di Partenza (Senza Misure)</span>
                            <div style="font-size: 16px; font-weight: 900; color: #b91c1c; margin-top: 6px;">R = ${rPartenza}</div>
                            <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${dPartenza} | Probabilità: 4 (Max)</div>
                            <div style="font-size: 8px; font-weight: bold; color: #b91c1c; text-transform: uppercase; margin-top: 4px;">Rischio Iniziale Alto</div>
                        </div>
                        
                        <!-- Stato Residuo -->
                        <div style="background:#f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
                            <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #16a34a; display:block;">2. Stato Residuo (Con Misure)</span>
                            <div style="font-size: 16px; font-weight: 900; color: ${rColor}; margin-top: 6px;">R = ${rVal}</div>
                            <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${dVal} | Probabilità: ${pVal}</div>
                            <div style="font-size: 8px; font-weight: bold; color: ${rColor}; text-transform: uppercase; margin-top: 4px;">Rischio Attuale ${rLabel}</div>
                        </div>
                    </div>

                    ${justVal ? `
                    <div style="font-size: 9px; color: #374151; font-style: italic; margin-top: 12px; margin-bottom: 12px; line-height: 1.4; border-left: 2px solid #000; padding-left: 10px; text-align: justify;">
                        <strong>Giustificazione Tecnica della Mitigazione:</strong><br/>
                        ${justVal}
                    </div>
                    ` : ''}
                </div>

                <div class="page" style="page-break-before: always;">
                    <div class="section-title">4. Avvertenze di Rischio e Pericoli da Affrontare</div>
                    <p>Le seguenti vulnerabilità operative costituiscono i principali vettori di infortunio o sanzione da monitorare costantemente:</p>
                    <div style="margin: 12px 0;">
                        ${riskWarnings.length > 0 ? riskWarnings.map(w => `
                            <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 8px 12px; font-size: 9.5px; color: #7f1d1d; margin-bottom: 8px; display: flex; gap: 6px;">
                                <span>⚠️</span> <span style="font-weight: 600;">${w}</span>
                            </div>
                        `).join('') : '<p style="font-style: italic; color: #718096;">Nessuna avvertenza critica registrata per questo protocollo.</p>'}
                    </div>

                    <div class="section-title">5. Stato delle Misure e delle Spunte di Conformità</div>
                    <p>Si riporta lo stato reale delle barriere fisiche e procedurali verificate per questa prestazione:</p>
                    
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 10%;">ID</th>
                                <th style="width: 25%;">Area</th>
                                <th style="width: 50%;">Azione Prescritta</th>
                                <th style="width: 15%;">Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listItems.map(item => {
            const isDone = !!state[item.id || item.question_id];
            return `
                                    <tr>
                                        <td style="font-family: monospace; font-size: 9px; font-weight: bold;">${item.id || item.question_id}</td>
                                        <td style="font-size: 9.5px; font-weight: bold; color: #4a5568;">${item.area || 'Compliance'}</td>
                                        <td style="font-size: 9.5px; font-weight: 600;">${item.action || item.text || ""}</td>
                                        <td style="font-size: 9px; font-weight: bold; color: ${isDone ? '#16a34a' : '#dc2626'};">
                                            ${isDone ? 'ATTUATA ✓' : 'IN ATTESA'}
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;

        // Generazione fisica del PDF
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:16px;';
        overlay.innerHTML = '⏳ Generazione PDF Capitolo...';
        document.body.appendChild(overlay);

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:0;left:0;width:794px;opacity:0;pointer-events:none;z-index:99998;';
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
            await new Promise(r => setTimeout(r, 600));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.page');

            for (let i = 0; i < pages.length; i++) {
                overlay.innerHTML = `⏳ Pagina ${i + 1} di ${pages.length}...`;
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.88);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            }

            const tgApp = window.Telegram?.WebApp;
            const isMobile = (tgApp && (tgApp.platform === 'android' || tgApp.platform === 'ios')) ||
                /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                try {
                    const webhookUrl = typeof WEBHOOK_URL !== 'undefined' ? WEBHOOK_URL : 'https://prod.workflow.trinai.it/webhook/7f254dec-e28f-452a-afb9-2a2a90206cbb';
                    const sessionAsh = typeof ash !== 'undefined' ? ash : (new URLSearchParams(window.location.search)).get('ash') || 'dev';
                    const initData = tgApp?.initData || '';
                    const pdfBase64Uri = pdf.output('datauristring');
                    const base64Data = pdfBase64Uri.split(',')[1];
                    const filename = `DVR_Capitolo_${service.service_name.replace(/\s+/g, '_')}.pdf`;

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
                        tgApp.showAlert("✓ Capitolo generato con successo! Lo riceverai a breve nella chat del bot.");
                    } else {
                        alert("✓ Capitolo generato con successo ed inviato al server.");
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
                a.download = `DVR_Capitolo_${service.service_name.replace(/\s+/g, '_')}.pdf`;
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
    // GENERAZIONE LIBRO COMPLETO (Organically Integrating Active Services)
    // ══════════════════════════════════════════════════════════════════════
    generateAndPrint: async function (tenant, catalog, checklistState) {
        if (window.showLoader) window.showLoader("Generazione Libro DVR...");

        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

        // Costruzione dell'HTML
        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                <title>Libro DVR Completo - ${tenant.ragioneSociale}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a202c; line-height: 1.5; font-size: 11px; background: #fff; margin: 0; padding: 0; }
                    .page { width: 210mm; height: 297mm; padding: 20mm 15mm; box-sizing: border-box; position: relative; background: #fff; }
                    .cover { display: flex; flex-direction: column; justify-content: space-between; }
                    .cover-header { text-align: center; }
                    .cover-title { font-size: 24px; font-weight: 900; color: #1a365d; letter-spacing: -0.02em; margin-top: 40px; line-height: 1.2; text-transform: uppercase; }
                    .cover-subtitle { font-size: 11px; color: #4a5568; margin-top: 10px; font-weight: 600; }
                    .info-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 25px 0; }
                    .info-title { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #2b6cb0; border-bottom: 2px solid #edf2f7; padding-bottom: 6px; margin-bottom: 12px; letter-spacing: 0.05em; }
                    .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #edf2f7; }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: bold; color: #4a5568; }
                    .info-value { font-weight: 600; color: #1a202c; }
                    .chapter-title { font-size: 16px; font-weight: 900; color: #2b6cb0; border-bottom: 3px solid #3182ce; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; }
                    .section-subtitle { font-size: 11px; font-weight: 900; color: #4a5568; margin-top: 18px; margin-bottom: 8px; text-transform: uppercase; border-left: 3px solid #2b6cb0; padding-left: 8px; }
                    p { text-align: justify; margin-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #e2e8f0; padding: 7px; text-align: left; vertical-align: top; }
                    th { background-color: #edf2f7; font-weight: bold; font-size: 9px; text-transform: uppercase; }
                    .signature-area { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
                    .signature-box { border: 1px solid #cbd5e0; border-radius: 8px; padding: 12px; min-height: 50px; display: flex; flex-direction: column; justify-content: space-between; }
                    .signature-label { font-size: 7px; font-weight: bold; text-transform: uppercase; color: #718096; }
                </style>
            </head>
            <body>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 1: COPERTINA E ANAGRAFICA
        // ══════════════════════════════════════════════════════════════════════
        const mappedSectorNames = tenant.activeVerticals.map(v => {
            const normalized = this.normalizeKey(v);
            return this.metaLocal[normalized]?.name || v;
        }).join(', ');

        html += `
            <div class="page cover">
                <div class="cover-header">
                    <span style="font-size: 9px; font-weight: bold; letter-spacing: 0.15em; color: #718096; text-transform: uppercase;">D.Lgs. 9 aprile 2008, n. 81 e s.m.i.</span>
                    <h1 class="cover-title">Documento di Valutazione dei Rischi</h1>
                    <p class="cover-subtitle">Valutazione dei Rischi da Esposizione ad Agenti Biologici e da Ferite da Taglio e da Punta</p>
                </div>

                <div class="info-box">
                    <div class="info-title">Anagrafica Aziendale</div>
                    <div class="info-row"><span class="info-label">Ragione Sociale:</span><span class="info-value">${tenant.ragioneSociale}</span></div>
                    <div class="info-row"><span class="info-label">P.IVA / C.F.:</span><span class="info-value">${tenant.pIva}</span></div>
                    <div class="info-row"><span class="info-label">Sede Legale ed Operativa:</span><span class="info-value">${tenant.indirizzo}</span></div>
                    <div class="info-row"><span class="info-label">Settori di Attività Valutati:</span><span class="info-value">${mappedSectorNames}</span></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 10px;">
                    <div class="info-box" style="margin: 0; padding: 12px;">
                        <div class="info-title" style="font-size: 9px; margin-bottom: 6px;">Staff di Prevenzione</div>
                        <div style="margin-bottom: 4px;"><strong>RSPP:</strong> ${tenant.generalMetadata.rspp}</div>
                        <div><strong>RLS:</strong> ${tenant.generalMetadata.rls}</div>
                    </div>
                    <div class="info-box" style="margin: 0; padding: 12px;">
                        <div class="info-title" style="font-size: 9px; margin-bottom: 6px;">Sorveglianza e Emergenze</div>
                        <div style="margin-bottom: 4px;"><strong>Medico Competente:</strong> ${tenant.generalMetadata.medicoCompetente}</div>
                        <div><strong>Addetti Emergenze:</strong> ${tenant.generalMetadata.addettiEmergenza.join(', ')}</div>
                    </div>
                </div>

                <div style="text-align: center; font-size: 9px; color: #718096; margin-top: 20px;">
                    Documento generato digitalmente in data ${dateStr}. Conservare copia firmata presso la sede aziendale.
                </div>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 2: PREMESSA SCIENTIFICA E INQUADRAMENTO LEGISLATIVO
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page">
                <h2 class="chapter-title">Inquadramento Normativo e Premesse</h2>
                
                <div class="section-subtitle">Riferimenti Legislativi Applicati</div>
                <p>${this.preambles.riferimenti_legge}</p>
                <p>La valutazione copre la stima quantitativa dell'esposizione dei lavoratori a patogeni del sangue, secrezioni orali e bio-aerosol, unitamente alla protezione contro le punture accidentali, in conformità agli indirizzi tecnici forniti dall'Ente Bilaterale e dalle associazioni di categoria.</p>

                <div class="section-subtitle">Obiettivi della Prevenzione Aziendale</div>
                <p>${this.preambles.obiettivi}</p>

                <div class="section-subtitle">Inquadramento Medico-Scientifico dei Vettori</div>
                <p>Nelle attività ambulatoriali e commerciali, l'esposizione biologica non deriva da uso deliberato dei patogeni, ma dalla presenza accidentale degli stessi nei fluidi dei pazienti o nelle risorse ambientali comuni. La trasmissione può avvenire tramite contatto diretto (fluidi su mucose o cute lesionata), trasmissione semidiretta (bio-aerosol proiettato da strumenti rotanti) o inoculazione parenterale (punture o tagli con strumenti contaminati).</p>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 3: METODOLOGIE DI VALUTAZIONE
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page">
                <h2 class="chapter-title">Cap. 1 - Metodologie di Stima del Rischio</h2>
                
                <div class="section-subtitle">1.1 Metodologia Integrata INAIL (Algoritmo Bio-ritmo)</div>
                <p>${this.preambles.metodologia_inail}</p>
                <p>La stima del livello probabilistico risente direttamente delle condizioni strutturali della sede, delle buone pratiche igieniche formalizzate e dell'addestramento continuo all'uso dei DPI di III Categoria.</p>

                <div class="section-subtitle">1.2 Metodologia Sperimentale (Studi Aerosol)</div>
                <p>${this.preambles.metodologia_sperimentale}</p>

                <div class="section-subtitle">1.3 Metodologia Statistica (Analisi Infortuni Nazionale)</div>
                <p>${this.preambles.metodologia_statistica}</p>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // SEZIONI STRUTTURATE DEI SETTORI E RELATIVI SERVIZI CLINICI (SOP/SER)
        // ══════════════════════════════════════════════════════════════════════
        const activeSectors = [...new Set(['comune', ...tenant.activeVerticals.map(v => this.normalizeKey(v))])];

        activeSectors.forEach((vKey) => {
            const sec = this.sectorData[vKey];
            if (!sec) return;

            // Filtriamo tutti i servizi del catalogo appartenenti a questo specifico comparto
            const sectorServices = catalog.filter(s => {
                if (typeof getVerticalForService === 'function') {
                    const normalizedSvcKey = DVRPrintEngine.normalizeKey(getVerticalForService(s));
                    return normalizedSvcKey === vKey;
                }
                return vKey === 'comune';
            });

            // 1. CARICAMENTO DEL RISCHIO STRUTTURALE DEL COMPARTO PADRE
            const savedSectorData = (checklistState && checklistState[vKey]) ? checklistState[vKey] : null;

            let dPartenza = (vKey === 'dental' || vKey === 'health' || vKey === 'workshop' || vKey === 'construction' || vKey === 'food') ? 3 : 2;
            if (vKey === 'professional') dPartenza = 1;
            let rPartenza = 4 * dPartenza;

            let d = dPartenza;
            let p = 4;
            let r = rPartenza;
            let justification = "";

            if (savedSkuDataExists(savedSkuData)) {
                d = savedSkuData.D;
                p = savedSkuData.P || 4;
                r = savedSkuData.R || (d * p);
                justification = savedSkuData.overall_justification || "";
            } else {
                // Fallback proporzionale locale
                let totalChecks = 0;
                let checkedCount = 0;
                if (sectorServices.length > 0) {
                    sectorServices.forEach(s => {
                        const state = checklistState[s.service_sku] || {};
                        totalChecks += 3;
                        checkedCount += Object.values(state).filter(Boolean).length;
                    });
                } else {
                    const state = checklistState[vKey] || {};
                    totalChecks = 3;
                    checkedCount = Object.values(state).filter(Boolean).length;
                }
                const fraction = totalChecks > 0 ? (checkedCount / totalChecks) : 0;
                p = Math.max(1, Math.min(4, Math.round(4 - (3 * fraction))));
                r = p * d;
            }

            const rLabel = r >= 8 ? 'Alto' : (r >= 4 ? 'Medio' : 'Basso');
            const rColor = r >= 8 ? '#b91c1c' : (r >= 4 ? '#9a3412' : '#166534');

            html += `
                <div class="page" style="page-break-before: always;">
                    <h2 class="chapter-title">Sotto-Capitolo: ${sec.titolo}</h2>
                    <p style="font-size: 9px; color: #718096; margin-top: -10px; font-weight: bold; text-transform: uppercase;">Riferimento normativo: ${sec.riferimento}</p>
                    
                    <div class="section-subtitle">1. Analisi di Esposizione del Settore</div>
                    <p>${sec.scienza}</p>

                    <div class="section-subtitle">2. Stima del Rischio Strutturale di Sede (Metodo INAIL)</div>
                    <p>La valutazione basata sullo stato di attuazione delle misure e dei controlli generali della sede restituisce i seguenti indici:</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0;">
                        <div style="background:#fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                            <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #9ca3af; display:block;">1. Rischio Iniziale (Senza Misure)</span>
                            <div style="font-size: 16px; font-weight: 900; color: #b91c1c; margin-top: 6px;">R = ${rPartenza}</div>
                            <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${dPartenza} | Probabilità: 4</div>
                        </div>
                        <div style="background:#f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
                            <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #16a34a; display:block;">2. Rischio Residuo (Con Misure)</span>
                            <div style="font-size: 16px; font-weight: 900; color: ${rColor}; margin-top: 6px;">R = ${r}</div>
                            <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${d} | Probabilità: ${p}</div>
                        </div>
                    </div>

                    ${justification ? `
                    <div style="font-size: 9px; color: #374151; font-style: italic; margin-top: 12px; margin-bottom: 12px; line-height: 1.4; border-left: 2px solid #000; padding-left: 10px; text-align: justify;">
                        <strong>Giustificazione Tecnica della Mitigazione:</strong><br/>
                        ${justification}
                    </div>
                    ` : ''}

                    <div class="section-subtitle">3. Misure Generali Obbligatorie Prescritte</div>
                    <ul style="padding-left: 20px; font-size: 10.5px;">
                        ${sec.misure.map(m => `<li style="margin-bottom: 5px;">${m}</li>`).join('')}
                    </ul>
                </div>
            `;

            // ══════════════════════════════════════════════════════════════════════
            // INTEGRAZIONE DINAMICA DEI SINGOLI SERVIZI (SOP/SER) APPARTENENTI AL SETTORE
            // ══════════════════════════════════════════════════════════════════════
            if (vKey !== 'comune' && sectorServices.length > 0) {
                sectorServices.forEach((service) => {
                    const sSku = service.service_sku;
                    const sState = checklistState[sSku] || {};
                    const sDossier = getDossierBySku(sSku);

                    let sDescription = "Servizio clinico-operativo specializzato.";
                    let sWarnings = [];
                    let sListItems = [];
                    let sLaws = "D.Lgs. 81/08 (T.U. Sicurezza Lavoro), Linee Guida di settore.";

                    if (sDossier && sDossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE) {
                        const comp = sDossier.MODULE_4_PRODUCT_SERVICE_COMPLIANCE;
                        sDescription = comp.positioning || "";
                        sWarnings = comp.risk_warnings || [];
                        sListItems = comp.compliance_checklist || [];
                        if (comp.regulatory_framework) {
                            const framework = comp.regulatory_framework;
                            sLaws = [
                                framework.medical_device_directive,
                                framework.professional_liability,
                                framework.deontology_rules,
                                framework.gdpr_compliance
                            ].filter(Boolean).join(', ');
                        }
                    }

                    // Caricamento del rischio specifico di quel servizio salvato nel DB
                    const savedServiceData = (checklistState && checklistState[sSku]) ? checklistState[sSku] : null;

                    let sd = dPartenza;
                    let sp = 4;
                    let sr = rPartenza;
                    let sJustification = "";

                    if (savedSkuDataExists(savedServiceData)) {
                        sd = savedServiceData.D;
                        sp = savedServiceData.P || 4;
                        sr = savedServiceData.R || (sd * sp);
                        sJustification = savedServiceData.overall_justification || "";
                    } else {
                        // Fallback proporzionale locale se manca record nel DB
                        const total = sListItems.length;
                        const checkedCount = sListItems.filter(item => sState[item.id || item.question_id]).length;
                        if (total > 0 && checkedCount > 0) {
                            const fraction = checkedCount / total;
                            sp = Math.max(1, Math.min(4, Math.round(4 - (3 * fraction))));
                        }
                        sr = sp * sd;
                    }

                    const srLabel = sr >= 8 ? 'Alto' : (sr >= 4 ? 'Medio' : 'Basso');
                    const srColor = sr >= 8 ? '#b91c1c' : (sr >= 4 ? '#9a3412' : '#166534');

                    html += `
                        <div class="page" style="page-break-before: always;">
                            <h2 class="chapter-title">Scheda Tecnica: ${service.service_name.toUpperCase()}</h2>
                            <p style="font-size: 8px; color: #718096; margin-top: -10px; font-weight: bold; text-transform: uppercase;">SKU: ${sSku} — Categoria: ${service.categoria_padre || "Protocollo Clinico"}</p>
                            
                            <div class="section-subtitle">1. Inquadramento Operativo e Descrizione</div>
                            <p>${sDescription}</p>

                            <div class="section-subtitle">2. Riferimenti Normativi Specifici</div>
                            <p style="font-size: 10px; line-height: 1.4;">${sLaws}</p>

                            <div class="section-subtitle">3. Analisi Matematica del Rischio Residuo (R = P x D)</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0;">
                                <div style="background:#fafafa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">
                                    <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #9ca3af; display:block;">1. Rischio Iniziale (Senza Misure)</span>
                                    <div style="font-size: 16px; font-weight: 900; color: #b91c1c; margin-top: 6px;">R = ${rPartenza}</div>
                                    <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${sd} | Probabilità: 4</div>
                                </div>
                                <div style="background:#f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px;">
                                    <span style="font-size: 7px; font-weight: 900; text-transform: uppercase; color: #16a34a; display:block;">2. Rischio Residuo (Con Misure)</span>
                                    <div style="font-size: 16px; font-weight: 900; color: ${srColor}; margin-top: 6px;">R = ${sr}</div>
                                    <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Danno: ${sd} | Probabilità: ${sp}</div>
                                </div>
                            </div>

                            ${sJustification ? `
                            <div style="font-size: 9px; color: #374151; font-style: italic; margin-top: 12px; margin-bottom: 12px; line-height: 1.4; border-left: 2px solid #000; padding-left: 10px; text-align: justify;">
                                <strong>Giustificazione Tecnica della Mitigazione:</strong><br/>
                                ${sJustification}
                            </div>
                            ` : ''}

                            <div class="section-subtitle">4. Avvertenze di Rischio Obbligatorie</div>
                            <div style="margin: 10px 0;">
                                ${sWarnings.map(w => `
                                    <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 6px 10px; font-size: 9px; color: #7f1d1d; margin-bottom: 6px; display: flex; gap: 6px;">
                                        <span>⚠️</span> <span style="font-weight: 600;">${w}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="page" style="page-break-before: always;">
                            <div class="section-title" style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #2b6cb0; border-left: 3px solid #2b6cb0; padding-left: 8px; margin-bottom: 10px;">5. Tabella di Conformità e Stato delle Misure</div>
                            <p>Si riporta lo stato d'attuazione reale dei controlli e delle barriere fisiche per questo servizio:</p>
                            
                            <table style="font-size: 9.5px;">
                                <thead>
                                    <tr>
                                        <th style="width: 10%;">ID</th>
                                        <th style="width: 25%;">Area</th>
                                        <th style="width: 50%;">Azione di Conformità</th>
                                        <th style="width: 15%;">Stato</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sListItems.map(item => {
                        const isDone = !!sState[item.id || item.question_id];
                        return `
                                            <tr>
                                                <td style="font-family: monospace; font-weight: bold;">${item.id || item.question_id}</td>
                                                <td style="font-weight: bold; color: #4a5568;">${item.area || 'Compliance'}</td>
                                                <td style="font-weight: 600;">${item.action || item.text || ""}</td>
                                                <td style="font-weight: bold; color: ${isDone ? '#16a34a' : '#dc2626'};">
                                                    ${isDone ? 'ATTUATA ✓' : 'IN ATTESA'}
                                                </td>
                                            </tr>
                                        `;
                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                });
            }
        });

        // Helper interno per validazione
        function savedSkuDataExists(dataObj) {
            return (dataObj && dataObj.D !== undefined);
        }

        // ══════════════════════════════════════════════════════════════════════
        // ULTIMA PAGINA: PIANO DI MIGLIORAMENTO, CONCLUSIONI E FIRME (UNIFICATE)
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page" style="page-break-before: always;">
                <h2 class="chapter-title">Programma di Miglioramento e Firme</h2>
                
                <div class="section-subtitle">Pianificazione dei Controlli Periodici</div>
                <p>Per garantire l'efficacia costante nel tempo delle misure di prevenzione e decontaminazione, si adotta il seguente piano di scadenze e verifiche:</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Misura / Oggetto di Controllo</th>
                            <th>Frequenza</th>
                            <th>Operatore Responsabile</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Validazione cicli di sterilizzazione ed Helix/Vacuum test</td>
                            <td>Quotidiana / Ad ogni ciclo</td>
                            <td>Assistente di Studio / ASO / Personale Addetto</td>
                        </tr>
                        <tr>
                            <td>Manutenzione ordinaria ed igienizzazione filtri climatizzazione</td>
                            <td>Semestrale</td>
                            <td>Tecnico Esterno Qualificato</td>
                        </tr>
                        <tr>
                            <td>Sorveglianza Sanitaria e accertamenti del Medico Competente</td>
                            <td>Biennale / Triennale (in base alla mansione)</td>
                            <td>Medico Competente Nominato</td>
                        </tr>
                        <tr>
                            <td>Verifica e taratura strumenti diagnostici ed endorali</td>
                            <td>Annuale</td>
                            <td>Esperto di Radioprotezione</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-subtitle">Dichiarazione di Approvazione</div>
                <p>I sottoscritti attestano di aver collaborato attivamente all'analisi dei fattori di rischio e all'elaborazione del presente documento di valutazione, impegnandosi all'applicazione e alla verifica costante di quanto in esso prescritto.</p>

                <div class="signature-area">
                    <div class="signature-box">
                        <span class="signature-label">Il Datore di Lavoro</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.ragioneSociale}
                        </div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Medico Competente Nominato</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.medicoCompetente}
                        </div>
                    </div>
                </div>

                <div class="signature-area" style="margin-top: 20px;">
                    <div class="signature-box">
                        <span class="signature-label">Il Responsabile del Servizio Prevenzione (RSPP)</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.rspp}
                        </div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Rappresentante dei Lavoratori (RLS)</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.rls}
                        </div>
                    </div>
                </div>
            </div>
        `;

        html += `
            </body>
            </html>
        `;

        // Costruisci il container VISIBILE ma coperto da overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:sans-serif;font-size:16px;';
        overlay.innerHTML = '⏳ Generazione PDF in corso...';
        document.body.appendChild(overlay);

        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:0;left:0;width:794px;opacity:0;pointer-events:none;z-index:99998;';
        container.innerHTML = html;
        document.body.appendChild(container);

        try {
            await new Promise(r => setTimeout(r, 600));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.page');

            if (pages.length === 0) throw new Error('Nessuna pagina trovata nel documento.');

            for (let i = 0; i < pages.length; i++) {
                overlay.innerHTML = `⏳ Pagina ${i + 1} di ${pages.length}...`;
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.88);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            }

            const tgApp = window.Telegram?.WebApp;
            const isMobile = (tgApp && (tgApp.platform === 'android' || tgApp.platform === 'ios')) ||
                /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                try {
                    const webhookUrl = typeof WEBHOOK_URL !== 'undefined' ? WEBHOOK_URL : 'https://prod.workflow.trinai.it/webhook/7f254dec-e28f-452a-afb9-2a2a90206cbb';
                    const sessionAsh = typeof ash !== 'undefined' ? ash : (new URLSearchParams(window.location.search)).get('ash') || 'dev';
                    const initData = tgApp?.initData || '';
                    const pdfBase64Uri = pdf.output('datauristring');
                    const base64Data = pdfBase64Uri.split(',')[1];
                    const filename = `DVR_${tenant.ragioneSociale.replace(/\s+/g, '_')}.pdf`;

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
                    }).then(response => {
                        console.log('PDF mobile upload response:', response.status);
                    }).catch(uploadErr => {
                        console.error('PDF mobile upload fetch error:', uploadErr);
                    });

                    if (tgApp && tgApp.showAlert) {
                        tgApp.showAlert("✓ Documento generato con successo! Lo riceverai a breve nella chat del bot.");
                    } else {
                        alert("✓ Documento generato con successo ed inviato al server.");
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
                a.download = `DVR_${tenant.ragioneSociale.replace(/\s+/g, '_')}.pdf`;
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