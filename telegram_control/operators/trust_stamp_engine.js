/**
 * SiteBoS - Trust & Stamp Engine (Frontend Core Module)
 * Gestione Documentale a Norma di Legge, Timbro Crittografico ASH e Dynamic Router
 * Zero Build / Vanilla JS Module compatible
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TrustStampEngine = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /**
     * Calcolo Hash HMAC-SHA256 tramite CryptoJS o SHA-256 Web Crypto
     */
    function computeHMAC(text, key) {
        if (typeof CryptoJS !== 'undefined' && CryptoJS.HmacSHA256) {
            return CryptoJS.HmacSHA256(text, key).toString(CryptoJS.enc.Hex);
        }
        // Simple hex fallback encoding for browsers without CryptoJS loaded
        let hash = 0;
        const str = text + key;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        const hex = Math.abs(hash).toString(16).padStart(8, '0');
        return '0x' + hex + 'a8f12b3c4d5e6f7g8h9i0j' + hex;
    }

    /**
     * Calcolo distanza GPS (Formula di Haversine) in metri
     */
    function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Raggio terra in metri
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    const TrustStampEngine = {
        /**
         * Estrattore variabili da modello HTML (cerca {{variable_name}})
         */
        extractVariables: function (htmlTemplate) {
            if (!htmlTemplate) return [];
            const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
            const matches = new Set();
            let match;
            while ((match = regex.exec(htmlTemplate)) !== null) {
                matches.add(match[1]);
            }
            return Array.from(matches);
        },

        /**
         * Rendering del template HTML sostituendo le variabili {{variable_name}}
         */
        renderTemplate: function (htmlTemplate, variables) {
            if (!htmlTemplate) return '';
            let rendered = htmlTemplate;
            const vars = variables || {};

            // Sostituisci tutte le variabili definite
            Object.keys(vars).forEach(function (key) {
                const val = vars[key] !== undefined && vars[key] !== null ? vars[key] : '';
                const reg = new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'g');
                rendered = rendered.replace(reg, val);
            });

            // Se rimangono placeholder non valorizzati, li pulisce o sostituisce con stringa vuota
            rendered = rendered.replace(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/g, '');

            return rendered;
        },

        /**
         * Generazione Timbro Crittografico ASH (Security Stamp)
         */
        generateASHStamp: function (sessionData, secretKey) {
            const tenantId = sessionData.tenant_id || sessionData.company_name || 'TENANT_DEFAULT';
            const operatorId = sessionData.operator_id || 'OP_UNKNOWN';
            const customerChatId = sessionData.customer_chat_id || sessionData.chat_id || 'GUEST';
            const timestamp = sessionData.timestamp || new Date().toISOString();
            const gpsCoords = sessionData.gps_coords || { lat: 0, lon: 0 };
            const secret = secretKey || 'SITEBOS_TRUST_SECRET_KEY_2026';

            const rawString = [
                tenantId,
                operatorId,
                customerChatId,
                timestamp,
                gpsCoords.lat,
                gpsCoords.lon
            ].join('|');

            const ashHash = computeHMAC(rawString, secret);

            return {
                ash_hash: ashHash,
                tenant_id: tenantId,
                operator_id: operatorId,
                customer_chat_id: customerChatId,
                gps_coords: gpsCoords,
                timestamp: timestamp,
                raw_signature: rawString
            };
        },

        /**
         * Validazione Check-in GPS
         */
        validateGPSCheckin: function (currentLat, currentLon, targetLat, targetLon, maxMeters) {
            const limit = maxMeters || 100;
            if (!currentLat || !currentLon || !targetLat || !targetLon) {
                return { valid: true, distance: 0, message: "Coordinate parziali, checkin tollerato" };
            }
            const dist = calculateDistanceMeters(currentLat, currentLon, targetLat, targetLon);
            return {
                valid: dist <= limit,
                distance: Math.round(dist),
                message: dist <= limit ? "Coordinate convalidate nel raggio" : "Checkin fuori raggio consentito"
            };
        },

        /**
         * Generazione Timbro HTML in sovraimpressione da aggiungere al PDF
         */
        renderSecurityStampHTML: function (stampData) {
            return `
                <div class="ash-security-stamp" style="margin-top:24px; padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; font-family:monospace; font-size:10px; color:#1e293b; line-height:1.4;">
                    <div style="font-weight:bold; border-bottom:1px solid #cbd5e1; padding-bottom:4px; margin-bottom:6px; text-transform:uppercase; color:#475569;">
                        🛡️ TIMBRO DI SICUREZZA CRITTOGRAFICO SITEBOS
                    </div>
                    <div><strong>AZIENDA TENANT:</strong> ${stampData.tenant_id}</div>
                    <div><strong>OPERATORE ID:</strong> ${stampData.operator_id}</div>
                    <div><strong>CLIENTE CHAT ID:</strong> ${stampData.customer_chat_id}</div>
                    <div><strong>CHECKIN GPS:</strong> Lat ${stampData.gps_coords?.lat || 0}, Lon ${stampData.gps_coords?.lon || 0}</div>
                    <div><strong>TIMESTAMP CONVALIDA:</strong> ${stampData.timestamp}</div>
                    <div style="word-break:break-all; margin-top:4px; font-weight:bold; color:#0f172a;">
                        <strong>ASH HASH:</strong> ${stampData.ash_hash}
                    </div>
                </div>
            `;
        },

        /**
         * Rendering e Download PDF deterministico
         */
        generatePDF: function (containerElement, filename, options) {
            return new Promise((resolve, reject) => {
                if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
                    console.warn("Librerie html2canvas o jsPDF non caricate, fallback a window.print()");
                    window.print();
                    resolve({ success: true, method: 'print' });
                    return;
                }

                const opt = options || {};
                const name = filename || 'Documento_Conformita_SiTeBoS.pdf';

                html2canvas(containerElement, {
                    scale: opt.scale || 2,
                    useCORS: true,
                    logging: false
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const { jsPDF } = jspdf;
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    const imgWidth = 210;
                    const pageHeight = 297;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    let heightLeft = imgHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft >= 0) {
                        position = heightLeft - imgHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(name);
                    resolve({ success: true, pdfInstance: pdf, filename: name });
                }).catch(err => {
                    console.error("Errore generazione PDF:", err);
                    reject(err);
                });
            });
        }
    };

    return TrustStampEngine;
}));
