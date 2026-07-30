/**
 * SiteBoS - Supervisor Hub Print Engine
 * Motor di Stampa PDF & Audit Trail Documentale per Telegram WebApp (TWA)
 * Generazione Report A4 ad Alta Definizione (html2canvas + jsPDF)
 * Supporto Cross-Platform: Download Diretto Desktop / Webhook Delivery Mobile Telegram Bot
 */

(function () {
    'use strict';

    // Helper per avvisi nativi o fallback
    function showAlert(msg) {
        const tg = window.Telegram?.WebApp;
        if (tg && typeof tg.showAlert === 'function') {
            tg.showAlert(msg);
        } else {
            alert(msg);
        }
    }

    // Helper per notifiche Haptic Feedback
    function triggerHaptic(type = 'success') {
        const tg = window.Telegram?.WebApp;
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred(type);
        }
    }

    // Modalita loader overlay per la stampa
    function showPrintOverlay(text) {
        let overlay = document.getElementById('supervisor-print-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'supervisor-print-overlay';
            overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-xs z-[99999] flex flex-col items-center justify-center text-white space-y-4 font-sans';
            overlay.innerHTML = `
                <div class="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <div id="supervisor-print-overlay-text" class="text-xs font-black uppercase tracking-widest text-white text-center px-6">Generazione Documento PDF...</div>
            `;
            document.body.appendChild(overlay);
        } else {
            document.getElementById('supervisor-print-overlay-text').innerText = text;
            overlay.classList.remove('hidden');
        }
    }

    function hidePrintOverlay() {
        const overlay = document.getElementById('supervisor-print-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UTILITY DI SANIFICAZIONE E FORMATTAZIONE
    // ══════════════════════════════════════════════════════════════════════════
    function sanitizeString(str) {
        if (!str) return 'Procedura';
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Rimuove accenti
            .replace(/[^a-zA-Z0-9]/g, '_')   // Sostituisce caratteri speciali e spazi con _
            .replace(/_+/g, '_')             // Riduce _ multipli a singolo _
            .replace(/^_+|_+$/g, '');        // Rimuove _ iniziali e finali
    }

    function formatDateFormatted(dateInput) {
        const d = dateInput ? new Date(dateInput) : new Date();
        if (isNaN(d.getTime())) return new Date().toLocaleDateString('it-IT').replace(/\//g, '_');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}_${month}_${year}`;
    }

    function formatDateTimeString(dateInput) {
        if (!dateInput) return '---';
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return String(dateInput);
        return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function generatePdfFilename(sopTitle, dateInput) {
        const cleanTitle = sanitizeString(sopTitle || 'Supervisione_Audit');
        const formattedDate = formatDateFormatted(dateInput);
        return `${cleanTitle}_${formattedDate}.pdf`;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MOTORE DI RENDERING & CONVERSIONE PDF
    // ══════════════════════════════════════════════════════════════════════════
    async function renderHtmlToPdfAndDeliver(htmlPages, filename, sopTitle) {
        // Container nascosto ma renderizzabile a larghezza A4 (794px = 96 DPI A4 portrait)
        const container = document.createElement('div');
        container.style.cssText = 'position:absolute;top:0;left:-9999px;width:794px;opacity:1;z-index:99998;background:#ffffff;';
        container.innerHTML = htmlPages.join('');
        document.body.appendChild(container);

        try {
            // Breve attesa per consentire ai font e alle risorse web di caricarsi
            await new Promise(resolve => setTimeout(resolve, 600));

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.a4-page');

            for (let i = 0; i < pages.length; i++) {
                showPrintOverlay(`Renderizzazione Pagina ${i + 1} di ${pages.length}...`);

                const canvas = await html2canvas(pages[i], {
                    scale: 2.5,
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
            const isMobile = (tgApp && (tgApp.platform === 'android' || tgApp.platform === 'ios')) ||
                             /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isMobile) {
                showPrintOverlay('Invio documento via Telegram Bot...');
                
                // Estrazione parametri di sessione dall'URL o da variabili globali
                const urlParams = new URLSearchParams(window.location.search);
                const currentAsh = typeof ash !== 'undefined' && ash ? ash : (urlParams.get('ash') || 'dev');
                const currentMsg = typeof msg !== 'undefined' && msg ? msg : (urlParams.get('msg') || '');
                const targetWebhook = typeof WEBHOOK_URL !== 'undefined' && WEBHOOK_URL ? 
                                      WEBHOOK_URL : "https://prod.workflow.trinai.it/webhook/0fff7fa2-bcb2-4b50-a26b-589b7054952e";

                const pdfDataUri = pdf.output('datauristring');
                const base64Data = pdfDataUri.split(',')[1] || '';

                const payload = {
                    action: 'deliver_pdf',
                    ash: currentAsh,
                    msg: currentMsg,
                    _auth: tgApp?.initData || '',
                    filename: filename,
                    filedata: base64Data,
                    mimeType: 'application/pdf',
                    title: sopTitle || 'Report Supervisione'
                };

                const response = await fetch(targetWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                hidePrintOverlay();
                triggerHaptic('success');
                if (response.ok) {
                    showAlert(`📋 Documento PDF "${filename}" generato con successo! È stato inviato direttamente nella chat del bot Telegram.`);
                } else {
                    // Fallback a download se il webhook non risponde ok
                    pdf.save(filename);
                    showAlert(`✅ Documento PDF generato e scaricato localmente (${filename}).`);
                }

            } else {
                // Ambiente Desktop - Download Diretto
                showPrintOverlay('Download del PDF in corso...');
                pdf.save(filename);
                hidePrintOverlay();
                triggerHaptic('success');
                showAlert(`✅ Documento PDF "${filename}" scaricato con successo.`);
            }

        } catch (error) {
            console.error('[SupervisorPrintEngine] Errore durante la generazione PDF:', error);
            hidePrintOverlay();
            triggerHaptic('error');
            showAlert('❌ Si è verificato un errore durante la creazione del file PDF. Riprova.');
        } finally {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // METODO 1: REGISTRO GLOBALE DI SUPERVISIONE E AUDIT
    // ══════════════════════════════════════════════════════════════════════════
    async function printGlobalReport(tenantData = {}, allSessions = [], blueprint = null) {
        showPrintOverlay('Preparazione Registro Globale...');

        const tenantName = tenantData.company_name || tenantData.name || 'Azienda Cliente SiteBoS';
        const tenantVat = tenantData.vat || tenantData.piva || 'IT-----------';
        const sopTitle = blueprint?.blueprint_name || 'Supervisione Processi';
        const sku = blueprint?.service_sku || 'SOP-GLOBAL';
        const category = blueprint?.category_name || 'Gestione Catalogo';

        const totalSessions = allSessions.length;
        const completedSessions = allSessions.filter(s => s.status === 'COMPLETED').length;
        const successRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
        const totalHits = allSessions.reduce((acc, s) => acc + (s.total_steps_executed || 0), 0);

        // Calcolo Rank Globale
        let globalRank = 'B', rankColor = '#10b981';
        if (successRate >= 95) { globalRank = 'S'; rankColor = '#eab308'; }
        else if (successRate >= 85) { globalRank = 'A'; rankColor = '#3b82f6'; }
        else if (successRate >= 70) { globalRank = 'B'; rankColor = '#10b981'; }
        else { globalRank = 'C'; rankColor = '#6b7280'; }

        const currentDateStr = new Date().toLocaleDateString('it-IT');
        const filename = generatePdfFilename(sopTitle, new Date());

        // Generazione HTML Pagina 1 (Copertina & Analytics)
        const pages = [];

        let page1Html = `
        <div class="a4-page" style="width:794px;height:1123px;padding:40px;box-sizing:border-box;font-family:'Inter',sans-serif;background:#ffffff;color:#0f172a;position:relative;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
                <!-- HEADER AZIENDALE -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:20px;margin-bottom:24px;">
                    <div>
                        <div style="font-size:18px;font-weight:900;letter-spacing:-0.5px;color:#0f172a;text-transform:uppercase;">${tenantName}</div>
                        <div style="font-size:9px;font-weight:700;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">P.IVA / C.F.: ${tenantVat}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="display:inline-block;padding:4px 12px;background:#0f172a;color:#ffffff;border-radius:12px;font-size:9px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">SiteBoS Audit Engine</div>
                        <div style="font-size:8px;font-weight:700;color:#94a3b8;margin-top:4px;">Data Emissione: ${currentDateStr}</div>
                    </div>
                </div>

                <!-- TITOLO DEL DOCUMENTO -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:24px;margin-bottom:24px;">
                    <div style="font-size:9px;font-weight:900;color:#3b82f6;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">${category} • SKU: ${sku}</div>
                    <div style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;text-transform:uppercase;">REGISTRO DI SUPERVISIONE E AUDIT GLOBALE</div>
                    <div style="font-size:11px;font-weight:600;color:#475569;margin-top:6px;">Procedura Operativa: ${sopTitle}</div>
                </div>

                <!-- QUADRO AUDIT ANALYTICS -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:28px;">
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;text-align:center;">
                        <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Audit Rating</div>
                        <div style="font-size:28px;font-weight:900;color:${rankColor};line-height:1;margin-top:6px;">${globalRank}</div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;text-align:center;">
                        <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Sessioni Totali</div>
                        <div style="font-size:22px;font-weight:900;color:#0f172a;line-height:1;margin-top:8px;">${totalSessions}</div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;text-align:center;">
                        <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Step Eseguiti</div>
                        <div style="font-size:22px;font-weight:900;color:#0f172a;line-height:1;margin-top:8px;">${totalHits}</div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;text-align:center;">
                        <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Tasso di Successo</div>
                        <div style="font-size:22px;font-weight:900;color:#10b981;line-height:1;margin-top:8px;">${successRate}%</div>
                    </div>
                </div>

                <!-- TABELLA SESSIONI (PRIMA PARTE) -->
                <div style="font-size:10px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Cronologia Audit e Sessioni</div>
                <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:left;">
                    <thead>
                        <tr style="background:#f1f5f9;color:#475569;text-transform:uppercase;font-size:7.5px;font-weight:900;letter-spacing:1px;">
                            <th style="padding:10px 12px;border-top-left-radius:10px;border-bottom-left-radius:10px;">ID Sessione</th>
                            <th style="padding:10px 12px;">Data / Ora</th>
                            <th style="padding:10px 12px;">Stato</th>
                            <th style="padding:10px 12px;">Passi Completati</th>
                            <th style="padding:10px 12px;border-top-right-radius:10px;border-bottom-right-radius:10px;text-align:right;">Efficienza</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        const sessionsPerPage = 12;
        const initialChunk = allSessions.slice(0, sessionsPerPage);

        initialChunk.forEach((s, idx) => {
            const isEven = idx % 2 === 0;
            const bgRow = isEven ? '#ffffff' : '#f8fafc';
            const statusBadge = s.status === 'COMPLETED' 
                ? '<span style="color:#059669;font-weight:800;">COMPLETATA</span>'
                : '<span style="color:#d97706;font-weight:800;">IN CORSO</span>';
            
            page1Html += `
                <tr style="background:${bgRow};border-bottom:1px solid #f1f5f9;">
                    <td style="padding:10px 12px;font-weight:800;font-family:monospace;color:#0f172a;">${s.id || s.session_id || 'SES-00' + (idx+1)}</td>
                    <td style="padding:10px 12px;color:#475569;font-weight:600;">${formatDateTimeString(s.created_at || s.timestamp)}</td>
                    <td style="padding:10px 12px;">${statusBadge}</td>
                    <td style="padding:10px 12px;font-weight:700;color:#334155;">${s.total_steps_executed || s.steps?.length || 0} Step</td>
                    <td style="padding:10px 12px;font-weight:900;color:#0f172a;text-align:right;">${s.efficiency_score || s.score || 100}%</td>
                </tr>
            `;
        });

        page1Html += `
                    </tbody>
                </table>
            </div>

            <!-- FOOTER CON FIRME (SE PAGINA UNICA) -->
            ${allSessions.length <= sessionsPerPage ? renderSignatureBlock() : ''}
        </div>
        `;

        pages.push(page1Html);

        // Se ci sono ulteriori sessioni, generiamo pagine successive
        for (let p = sessionsPerPage; p < allSessions.length; p += sessionsPerPage) {
            const chunk = allSessions.slice(p, p + sessionsPerPage);
            const isLastPage = (p + sessionsPerPage) >= allSessions.length;

            let nextPageHtml = `
            <div class="a4-page" style="width:794px;height:1123px;padding:40px;box-sizing:border-box;font-family:'Inter',sans-serif;background:#ffffff;color:#0f172a;position:relative;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;padding-bottom:12px;margin-bottom:20px;">
                        <span style="font-size:9px;font-weight:900;text-transform:uppercase;color:#64748b;letter-spacing:1px;">Registro Audit • ${sopTitle}</span>
                        <span style="font-size:8px;font-weight:700;color:#94a3b8;">Pagina ${Math.floor(p/sessionsPerPage) + 1}</span>
                    </div>

                    <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:left;">
                        <thead>
                            <tr style="background:#f1f5f9;color:#475569;text-transform:uppercase;font-size:7.5px;font-weight:900;letter-spacing:1px;">
                                <th style="padding:10px 12px;border-top-left-radius:10px;border-bottom-left-radius:10px;">ID Sessione</th>
                                <th style="padding:10px 12px;">Data / Ora</th>
                                <th style="padding:10px 12px;">Stato</th>
                                <th style="padding:10px 12px;">Passi Completati</th>
                                <th style="padding:10px 12px;border-top-right-radius:10px;border-bottom-right-radius:10px;text-align:right;">Efficienza</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            chunk.forEach((s, idx) => {
                const isEven = idx % 2 === 0;
                const bgRow = isEven ? '#ffffff' : '#f8fafc';
                const statusBadge = s.status === 'COMPLETED' 
                    ? '<span style="color:#059669;font-weight:800;">COMPLETATA</span>'
                    : '<span style="color:#d97706;font-weight:800;">IN CORSO</span>';

                nextPageHtml += `
                    <tr style="background:${bgRow};border-bottom:1px solid #f1f5f9;">
                        <td style="padding:10px 12px;font-weight:800;font-family:monospace;color:#0f172a;">${s.id || s.session_id || 'SES-00' + (p+idx+1)}</td>
                        <td style="padding:10px 12px;color:#475569;font-weight:600;">${formatDateTimeString(s.created_at || s.timestamp)}</td>
                        <td style="padding:10px 12px;">${statusBadge}</td>
                        <td style="padding:10px 12px;font-weight:700;color:#334155;">${s.total_steps_executed || s.steps?.length || 0} Step</td>
                        <td style="padding:10px 12px;font-weight:900;color:#0f172a;text-align:right;">${s.efficiency_score || s.score || 100}%</td>
                    </tr>
                `;
            });

            nextPageHtml += `
                        </tbody>
                    </table>
                </div>

                ${isLastPage ? renderSignatureBlock() : ''}
            </div>
            `;

            pages.push(nextPageHtml);
        }

        await renderHtmlToPdfAndDeliver(pages, filename, sopTitle);
    }

    // Helper per renderizzare i blocchi di firma formali in calce
    function renderSignatureBlock() {
        return `
        <div style="border-top:2px dashed #e2e8f0;padding-top:24px;margin-top:auto;">
            <div style="font-size:9px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Approvazione e Validazione Formali dell'Audit</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;">
                <div style="border:1px solid #cbd5e1;border-radius:16px;padding:16px;background:#fafafa;">
                    <div style="font-size:8px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:1px;">Il Supervisore di Processo</div>
                    <div style="height:45px;border-bottom:1px solid #94a3b8;margin-top:12px;margin-bottom:6px;"></div>
                    <div style="display:flex;justify-between;font-size:7.5px;color:#64748b;font-weight:700;">
                        <span>Data: ____/____/________</span>
                        <span>Firma Autografa</span>
                    </div>
                </div>
                <div style="border:1px solid #cbd5e1;border-radius:16px;padding:16px;background:#fafafa;">
                    <div style="font-size:8px;font-weight:900;color:#475569;text-transform:uppercase;letter-spacing:1px;">Il Datore di Lavoro / Legale Rappresentante</div>
                    <div style="height:45px;border-bottom:1px solid #94a3b8;margin-top:12px;margin-bottom:6px;"></div>
                    <div style="display:flex;justify-between;font-size:7.5px;color:#64748b;font-weight:700;">
                        <span>Data: ____/____/________</span>
                        <span>Firma Autografa</span>
                    </div>
                </div>
            </div>
            <div style="font-size:7px;color:#94a3b8;text-align:center;margin-top:16px;font-weight:600;">Documento generato dall'ecosistema SiteBoS MiniApp - Conforme alle direttive di Tracciabilità e Controllo Qualità</div>
        </div>
        `;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // METODO 2: STAMPA CERTIFICATO DI SINGOLA SESSIONE AUDIT
    // ══════════════════════════════════════════════════════════════════════════
    async function printSessionAudit(tenantData = {}, session = null, blueprint = null) {
        if (!session) {
            showAlert('⚠️ Nessuna sessione selezionata per la stampa.');
            return;
        }

        showPrintOverlay('Generazione Certificato Sessione...');

        const tenantName = tenantData.company_name || tenantData.name || 'Azienda Cliente SiteBoS';
        const tenantVat = tenantData.vat || tenantData.piva || 'IT-----------';
        const sopTitle = blueprint?.blueprint_name || 'Procedura Operativa';
        const sku = blueprint?.service_sku || session.sop_id || 'SOP-001';
        const category = blueprint?.category_name || 'Supervisione Operativa';

        const sessionId = session.id || session.session_id || 'SES-CURRENT';
        const startTimeStr = formatDateTimeString(session.started_at || session.created_at);
        const endTimeStr = session.completed_at ? formatDateTimeString(session.completed_at) : 'In corso';
        const efficiencyScore = session.efficiency_score || session.score || 100;
        
        const steps = session.steps || (session.audit_trail ? session.audit_trail : []);
        const totalSteps = steps.length || (blueprint?.stages ? blueprint.stages.reduce((a, st) => a + (st.steps?.length || 0), 0) : 1);
        const completedStepsCount = steps.filter(s => s.completed || s.status === 'COMPLETED' || s.evidence).length;
        const complianceScore = Math.round((completedStepsCount / Math.max(1, totalSteps)) * 100);

        const filename = generatePdfFilename(`${sopTitle}_Sessione_${sessionId}`, session.started_at || new Date());

        let sessionPageHtml = `
        <div class="a4-page" style="width:794px;height:1123px;padding:40px;box-sizing:border-box;font-family:'Inter',sans-serif;background:#ffffff;color:#0f172a;position:relative;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
                <!-- HEADER AZIENDALE -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;">
                    <div>
                        <div style="font-size:16px;font-weight:900;letter-spacing:-0.5px;color:#0f172a;text-transform:uppercase;">${tenantName}</div>
                        <div style="font-size:8.5px;font-weight:700;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">P.IVA / C.F.: ${tenantVat}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="display:inline-block;padding:4px 10px;background:#059669;color:#ffffff;border-radius:10px;font-size:8.5px;font-weight:900;letter-spacing:1px;text-transform:uppercase;">CERTIFICATO AUDIT</div>
                        <div style="font-size:8px;font-weight:700;color:#94a3b8;margin-top:4px;">Session ID: ${sessionId}</div>
                    </div>
                </div>

                <!-- INFO SESSIONE -->
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;padding:20px;margin-bottom:20px;">
                    <div style="font-size:8.5px;font-weight:900;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;">${category} • SKU: ${sku}</div>
                    <div style="font-size:18px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;text-transform:uppercase;">${sopTitle}</div>
                    
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:14px;pt-14px;border-top:1px solid #cbd5e1;">
                        <div>
                            <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Avvio Sessione</div>
                            <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:2px;">${startTimeStr}</div>
                        </div>
                        <div>
                            <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Completamento</div>
                            <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:2px;">${endTimeStr}</div>
                        </div>
                        <div>
                            <div style="font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Operatore / Evaluator</div>
                            <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:2px;">${session.operator || 'Supervisore AI'}</div>
                        </div>
                    </div>
                </div>

                <!-- QUADRO PERFORMANCE EFFICIENZA & COMPLIANCE -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
                        <div>
                            <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Punteggio Efficienza</div>
                            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">Tempo Reale vs Target SOP</div>
                        </div>
                        <div style="font-size:26px;font-weight:900;color:#0f172a;">${efficiencyScore}%</div>
                    </div>
                    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
                        <div>
                            <div style="font-size:8px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Compliance di Processo</div>
                            <div style="font-size:9px;color:#94a3b8;margin-top:2px;">${completedStepsCount} su ${totalSteps} Step Eseguiti</div>
                        </div>
                        <div style="font-size:26px;font-weight:900;color:#10b981;">${complianceScore}%</div>
                    </div>
                </div>

                <!-- TABELLA AUDIT TRAIL STEP-BY-STEP -->
                <div style="font-size:10px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">Audit Trail Dettagliato degli Step</div>
                <table style="width:100%;border-collapse:collapse;font-size:8.5px;text-align:left;">
                    <thead>
                        <tr style="background:#f1f5f9;color:#475569;text-transform:uppercase;font-size:7.5px;font-weight:900;letter-spacing:1px;">
                            <th style="padding:8px 10px;border-top-left-radius:8px;border-bottom-left-radius:8px;">Step & Descrizione</th>
                            <th style="padding:8px 10px;">Evidenza</th>
                            <th style="padding:8px 10px;">Esito</th>
                            <th style="padding:8px 10px;border-top-right-radius:8px;border-bottom-right-radius:8px;">Valutazione & Responso AI</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (steps.length === 0) {
            sessionPageHtml += `
                <tr>
                    <td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;font-style:italic;">Nessuno step registrato nell'audit trail per questa sessione.</td>
                </tr>
            `;
        } else {
            steps.forEach((st, idx) => {
                const isEven = idx % 2 === 0;
                const bgRow = isEven ? '#ffffff' : '#f8fafc';
                const evidenceType = st.quality_check?.evidence_type || st.type || 'LOG';
                const stepTitle = st.step_name || st.title || `Step ${idx + 1}`;
                const stepDesc = st.description || st.instruction || '';

                // Estrazione proprietà AI NoSQL reali con fallback
                const aiRationale = st.ai_rationale || st.rationale || st.ai_feedback || '';
                const aiFiscalLegal = st.ai_fiscal_legal_status || st.fiscal_legal_status || '';
                const aiInsight = st.ai_strategic_insight || st.strategic_insight || '';

                const hasAiData = Boolean(aiRationale || aiFiscalLegal || aiInsight);

                let aiCellContent = '';
                if (hasAiData) {
                    let blocks = [];
                    if (aiRationale) {
                        blocks.push(`<div style="margin-bottom:4px;"><span style="font-weight:900;color:#0f172a;font-size:7.5px;text-transform:uppercase;">RAZIONALE AI:</span> <span style="color:#334155;font-size:8px;">${aiRationale}</span></div>`);
                    }
                    if (aiFiscalLegal) {
                        blocks.push(`<div style="margin-bottom:4px;"><span style="font-weight:900;color:#0f172a;font-size:7.5px;text-transform:uppercase;">INQUADRAMENTO:</span> <span style="color:#334155;font-size:8px;">${aiFiscalLegal}</span></div>`);
                    }
                    if (aiInsight) {
                        blocks.push(`<div><span style="font-weight:900;color:#0f172a;font-size:7.5px;text-transform:uppercase;">CONSIGLIO:</span> <span style="color:#334155;font-size:8px;">${aiInsight}</span></div>`);
                    }
                    aiCellContent = `
                        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;line-height:1.3;">
                            ${blocks.join('')}
                        </div>
                    `;
                } else {
                    aiCellContent = `<div style="color:#64748b;font-size:8px;font-style:italic;">Controllo qualificato ed eseguito in conformità.</div>`;
                }

                sessionPageHtml += `
                    <tr style="background:${bgRow};border-bottom:1px solid #f1f5f9;">
                        <td style="padding:10px;vertical-align:top;">
                            <div style="font-weight:800;color:#0f172a;text-transform:uppercase;">${stepTitle}</div>
                            ${stepDesc ? `<div style="font-size:7.5px;color:#64748b;margin-top:2px;">${stepDesc}</div>` : ''}
                        </td>
                        <td style="padding:10px;vertical-align:top;font-weight:800;color:#475569;text-transform:uppercase;font-size:7.5px;">
                            ${evidenceType}
                        </td>
                        <td style="padding:10px;vertical-align:top;">
                            <span style="display:inline-block;padding:2px 6px;background:#ecfdf5;color:#047857;border-radius:6px;font-weight:900;font-size:7px;text-transform:uppercase;">CONFORME</span>
                        </td>
                        <td style="padding:10px;vertical-align:top;">
                            ${aiCellContent}
                        </td>
                    </tr>
                `;
            });
        }

        sessionPageHtml += `
                    </tbody>
                </table>
            </div>

            <!-- FIRMA FORMALE SESSIONE -->
            ${renderSignatureBlock()}
        </div>
        `;

        await renderHtmlToPdfAndDeliver([sessionPageHtml], filename, sopTitle);
    }

    // Export public API
    window.supervisorPrintEngine = {
        sanitizeString,
        formatDateFormatted,
        generatePdfFilename,
        printGlobalReport,
        printSessionAudit
    };

    console.log('[SupervisorPrintEngine] Motore di Stampa PDF inizializzato con successo.');

})();
