/**
 * SiteBoS - Dedicated Real Estate Property Editor Logic (edit_property_logic.js)
 * Manages comprehensive property data according to property_details schema,
 * Gemini Media Studio navigation, and portal multiposting feeds.
 */
'use strict';

(function () {
    const WEBHOOK_URL = "https://prod.workflow.trinai.it/webhook/2c6416b1-32c6-4661-bd8f-b175d24fd035";
    const tg = window.Telegram?.WebApp;

    if (tg) {
        if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#fafafa');
        tg.ready();
        tg.expand();
        if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const ash = urlParams.get('ash') || '';
    const messageId = urlParams.get('msg') || urlParams.get('message_id') || '';
    const sopId = urlParams.get('sop_id') || urlParams.get('productId') || urlParams.get('pId') || '';

    let currentItemData = null;
    let currentPhotos = [];
    let currentVatNumber = 'TENANT';

    document.addEventListener('DOMContentLoaded', async () => {
        setupBackButton();
        if (!sopId) {
            showError("Identificativo dell'immobile mancante nell'indirizzo URL.");
            return;
        }
        await loadPropertyData();
    });

    function setupBackButton() {
        if (tg && tg.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(() => goBackToMenu());
        }
    }

    window.goBackToMenu = function () {
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        if (window.parent && typeof window.parent.closeSubEditor === 'function') {
            window.parent.closeSubEditor();
        } else {
            window.location.href = `catalog.html?ash=${encodeURIComponent(ash)}&msg=${encodeURIComponent(messageId)}`;
        }
    };

    window.openUserGuide = function (url) {
        if (window.parent && typeof window.parent.openUserGuide === 'function') {
            window.parent.openUserGuide(url);
        } else {
            window.open(url, '_blank');
        }
    };

    function showError(message) {
        const loaderText = document.getElementById('loaderText');
        const loaderSpinner = document.querySelector('#loader .spinner');
        const errorBox = document.getElementById('loaderErrorBox');
        const errorText = document.getElementById('loaderErrorText');

        if (loaderText) loaderText.classList.add('hidden');
        if (loaderSpinner) loaderSpinner.classList.add('hidden');
        if (errorText) errorText.innerText = message || "Errore sconosciuto.";
        if (errorBox) errorBox.classList.remove('hidden');

        if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    }

    async function loadPropertyData() {
        const loader = document.getElementById('loader');
        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _auth: tg?.initData || '',
                    ash: ash,
                    action: 'GET',
                    type: 'PRODUCT',
                    sop_id: sopId,
                    message_id: messageId
                })
            });

            if (!res.ok) {
                throw new Error(`Risposta server non valida (Codice ${res.status}).`);
            }

            const rawData = await res.json();
            const d = Array.isArray(rawData) ? rawData[0] : rawData;
            const productData = d.catalog_item || d.catalog_item_draft || d.data || d;

            if (!productData || (!productData.identity && !productData.name && !productData.sop_id && !productData.callback_data)) {
                throw new Error("Scheda immobile non trovata nel database aziendale.");
            }

            currentItemData = JSON.parse(JSON.stringify(productData));
            currentVatNumber = d.owner_data?.vat_number || d.vat_number || productData.vat_number || 'TENANT';

            populateFormWithPropertyData(currentItemData);
            if (loader) loader.classList.add('hidden');
        } catch (err) {
            console.error("Errore caricamento dati immobile:", err);
            showError("Impossibile caricare i dati reali dell'immobile dal server. Verifica la connessione e riprova.");
        }
    }

    function populateFormWithPropertyData(item) {
        const identity = item.identity || {};
        const pd = item.property_details || {};
        const cat = pd.cadastral || {};
        const phys = pd.physical || {};
        const amen = pd.amenities || {};
        const energy = pd.energy || {};
        const tx = pd.transaction || {};
        const loc = pd.location || {};
        const media = pd.media || {};
        const mp = pd.multiposting || {};

        // 1. Identità
        const nameVal = item.name || identity.item_name || '';
        document.getElementById('propName').value = nameVal;
        document.getElementById('headerPropertyTitle').innerText = nameVal || 'Nuovo Immobile';
        document.getElementById('propSku').value = item.sku || identity.sku || item.callback_data || sopId || '';
        document.getElementById('propShortDesc').value = item.short_name || identity.description?.short || '';
        document.getElementById('propLongDesc').value = identity.description?.long || item.description || '';

        // 2. Dati Catastali
        document.getElementById('catFoglio').value = cat.foglio || '';
        document.getElementById('catParticella').value = cat.particella || '';
        document.getElementById('catSubalterno').value = cat.subalterno || '';
        document.getElementById('catCategoria').value = cat.categoria || '';
        document.getElementById('catRendita').value = cat.rendita_catastale !== undefined ? cat.rendita_catastale : '';
        document.getElementById('catAnnoCostruzione').value = cat.anno_costruzione || '';

        // 3. Parametri Fisici
        document.getElementById('physMqCommerciali').value = phys.mq_commerciali !== undefined ? phys.mq_commerciali : '';
        document.getElementById('physMqCalpestabili').value = phys.mq_calpestabili !== undefined ? phys.mq_calpestabili : '';
        document.getElementById('physNumeroVani').value = phys.numero_vani !== undefined ? phys.numero_vani : '';
        document.getElementById('physCamere').value = phys.camere !== undefined ? phys.camere : '';
        document.getElementById('physBagni').value = phys.bagni !== undefined ? phys.bagni : '';
        document.getElementById('physPiano').value = phys.piano !== undefined ? phys.piano : '';
        document.getElementById('physAscensore').checked = phys.ascensore === true;
        if (phys.riscaldamento) document.getElementById('physRiscaldamento').value = phys.riscaldamento;
        document.getElementById('physEsposizione').value = phys.esposizione || '';

        // 4. Dotazioni
        document.getElementById('amenBalcone').checked = amen.balcone === true;
        document.getElementById('amenTerrazzo').checked = amen.terrazzo === true;
        document.getElementById('amenBoxAuto').checked = amen.box_auto === true;
        document.getElementById('amenPostoAuto').checked = amen.posto_auto === true;
        document.getElementById('amenCantina').checked = amen.cantina === true;
        document.getElementById('amenClimatizzazione').checked = amen.climatizzazione === true;
        document.getElementById('amenAllarme').checked = amen.allarme === true;
        document.getElementById('amenGiardinoMq').value = amen.giardino_mq !== undefined ? amen.giardino_mq : '';

        // 5. Prestazione Energetica
        if (energy.classe_energetica) document.getElementById('energyClasse').value = energy.classe_energetica;
        document.getElementById('energyIpe').value = energy.ipe_kwh_mq_anno !== undefined ? energy.ipe_kwh_mq_anno : '';
        document.getElementById('energyCodiceApe').value = energy.codice_ape || '';

        // 6. Economica e Transazione
        const basePrice = item.pricing?.base_price || item.price || tx.prezzo_richiesto || '';
        document.getElementById('txPrezzoRichiesto').value = basePrice;
        if (tx.tipo_contratto) document.getElementById('txContractType').value = tx.tipo_contratto;
        if (tx.stato) document.getElementById('txStato').value = tx.stato;
        document.getElementById('txSpeseCondominiali').value = tx.spese_condominiali_mensili !== undefined ? tx.spese_condominiali_mensili : '';
        document.getElementById('txProvvigionePct').value = tx.provvigione_target_pct !== undefined ? tx.provvigione_target_pct : '';
        document.getElementById('txDeposito').value = tx.deposito_cauzionale !== undefined ? tx.deposito_cauzionale : '';

        // 7. Localizzazione Geografica
        document.getElementById('locIndirizzo').value = loc.indirizzo || '';
        document.getElementById('locComune').value = loc.comune || '';
        document.getElementById('locProvincia').value = loc.provincia || '';
        document.getElementById('locCap').value = loc.cap || '';
        document.getElementById('locQuartiere').value = loc.quartiere || '';
        document.getElementById('locLat').value = loc.lat !== undefined ? loc.lat : '';
        document.getElementById('locLng').value = loc.lng !== undefined ? loc.lng : '';

        // 8. Media
        currentPhotos = Array.isArray(media.photos) ? media.photos.map(p => typeof p === 'string' ? { url: p } : p).filter(p => p && p.url) : [];
        renderPhotosGallery();
        document.getElementById('mediaFloorplanUrl').value = media.floorplan_3d_url || '';
        document.getElementById('mediaVideoTeaserUrl').value = media.video_teaser_url || '';

        // 9. Multiposting
        document.getElementById('portalImmobiliare').checked = mp.immobiliare_it !== false;
        document.getElementById('portalIdealista').checked = mp.idealista !== false;
        document.getElementById('portalCasait').checked = mp.casa_it !== false;
        document.getElementById('portalSubito').checked = mp.subito_it !== false;
        document.getElementById('portalMeta').checked = mp.meta_catalog !== false;

        // Feed XML URLs
        document.getElementById('feedMlsUrl').value = `https://prod.workflow.trinai.it/webhook/realestate-feed/${currentVatNumber}.xml`;
        document.getElementById('feedMetaUrl').value = `https://prod.workflow.trinai.it/webhook/realestate-feed-meta/${currentVatNumber}.xml`;
    }

    function renderPhotosGallery() {
        const container = document.getElementById('photosGalleryContainer');
        if (!container) return;
        container.innerHTML = '';

        if (currentPhotos.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 py-6 text-center text-gray-400 text-[10px] font-medium">
                    <i class="fas fa-image text-xl text-gray-300 mb-1 block"></i>
                    Nessuna fotografia caricata. Genera nuovi scatti con il Media Studio o aggiungi URL.
                </div>
            `;
            return;
        }

        currentPhotos.forEach((photo, idx) => {
            const card = document.createElement('div');
            card.className = "relative rounded-xl overflow-hidden aspect-square border border-gray-200 bg-black/5 group";
            card.innerHTML = `
                <img src="${photo.url}" alt="Foto Immobile ${idx + 1}" class="w-full h-full object-cover">
                <span class="absolute top-1 left-1 bg-black/80 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">#${idx + 1}</span>
                <button type="button" onclick="removePhotoAt(${idx})" class="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm active:scale-90 transition">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(card);
        });
    }

    const MAX_IMAGE_BYTES = 16 * 1024 * 1024; // 16 MB

    async function processAndCompressImageToJpeg(fileOrBlobOrDataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                const qualitySteps = [0.92, 0.85, 0.75, 0.65, 0.50];
                let bestDataUrl = null;
                let bestByteSize = 0;

                for (let q of qualitySteps) {
                    const dataUrl = canvas.toDataURL('image/jpeg', q);
                    const base64Str = dataUrl.split(',')[1] || '';
                    const byteSize = Math.round(base64Str.length * 0.75);

                    if (byteSize <= MAX_IMAGE_BYTES) {
                        bestDataUrl = dataUrl;
                        bestByteSize = byteSize;
                        break;
                    }
                }

                // Se ancora supera il limite, riduce progressivamente la risoluzione
                if (!bestDataUrl) {
                    let scale = 0.8;
                    while (scale >= 0.3) {
                        const scaledCanvas = document.createElement('canvas');
                        scaledCanvas.width = Math.round(width * scale);
                        scaledCanvas.height = Math.round(height * scale);
                        const sCtx = scaledCanvas.getContext('2d');
                        sCtx.fillStyle = '#FFFFFF';
                        sCtx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
                        sCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);

                        for (let q of [0.8, 0.6, 0.5]) {
                            const dataUrl = scaledCanvas.toDataURL('image/jpeg', q);
                            const base64Str = dataUrl.split(',')[1] || '';
                            const byteSize = Math.round(base64Str.length * 0.75);
                            if (byteSize <= MAX_IMAGE_BYTES) {
                                bestDataUrl = dataUrl;
                                bestByteSize = byteSize;
                                break;
                            }
                        }
                        if (bestDataUrl) break;
                        scale -= 0.2;
                    }
                }

                if (!bestDataUrl) {
                    reject(new Error("Foto troppo pesante anche dopo compressione, riprova con una foto piu' piccola o a risoluzione inferiore."));
                    return;
                }

                const base64WithoutPrefix = bestDataUrl.split(',')[1] || '';
                resolve({
                    dataUrl: bestDataUrl,
                    base64: base64WithoutPrefix,
                    mimeType: 'image/jpeg',
                    byteSize: bestByteSize
                });
            };
            img.onerror = () => {
                reject(new Error("Impossibile elaborare il file immagine selezionato."));
            };

            if (typeof fileOrBlobOrDataUrl === 'string') {
                img.src = fileOrBlobOrDataUrl;
            } else {
                const reader = new FileReader();
                reader.onload = (e) => { img.src = e.target.result; };
                reader.onerror = () => { reject(new Error("Errore durante la lettura del file.")); };
                reader.readAsDataURL(fileOrBlobOrDataUrl);
            }
        });
    }

    window.removePhotoAt = function (index) {
        currentPhotos.splice(index, 1);
        renderPhotosGallery();
    };

    window.handlePropertyLocalPhotoUpload = async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const processed = await processAndCompressImageToJpeg(file);
            currentPhotos.push({ url: processed.dataUrl });
            renderPhotosGallery();
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } catch (err) {
            console.error("Errore compressione foto:", err);
            const msg = err.message || "Foto troppo pesante anche dopo compressione, riprova con una foto piu' piccola o a risoluzione inferiore.";
            if (tg && tg.showAlert) tg.showAlert(msg); else alert(msg);
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        } finally {
            event.target.value = '';
        }
    };

    window.promptAddPhotoUrl = async function () {
        const url = prompt("Inserisci l'URL completo della fotografia dell'immobile (o data URI):");
        if (url && (url.trim().startsWith('http') || url.trim().startsWith('data:image/'))) {
            const cleanUrl = url.trim();
            if (cleanUrl.startsWith('data:image/')) {
                try {
                    const processed = await processAndCompressImageToJpeg(cleanUrl);
                    currentPhotos.push({ url: processed.dataUrl });
                    renderPhotosGallery();
                } catch (err) {
                    const msg = err.message || "Foto troppo pesante anche dopo compressione, riprova con una foto piu' piccola o a risoluzione inferiore.";
                    if (tg && tg.showAlert) tg.showAlert(msg); else alert(msg);
                }
            } else {
                currentPhotos.push({ url: cleanUrl });
                renderPhotosGallery();
            }
        } else if (url) {
            alert("L'indirizzo deve essere un URL valido (http:// o https://) oppure un data URI immagine.");
        }
    };

    window.openMediaStudioUtility = function () {
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        const queryParams = new URLSearchParams({
            ash: ash,
            msg: messageId,
            sop_id: sopId
        });
        window.location.href = `../operators/realestate-utility.html?${queryParams.toString()}`;
    };

    window.openRenovationCostEstimator = function () {
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

        const locIndirizzo = document.getElementById('locIndirizzo')?.value?.trim() || '';
        const locComune = document.getElementById('locComune')?.value?.trim() || '';
        const locProvincia = document.getElementById('locProvincia')?.value?.trim() || '';
        const locCap = document.getElementById('locCap')?.value?.trim() || '';
        const fullAddress = [locIndirizzo, locComune, locProvincia, locCap].filter(Boolean).join(', ');

        const mqComm = document.getElementById('physMqCommerciali')?.value?.trim() || '';
        const mqCalp = document.getElementById('physMqCalpestabili')?.value?.trim() || '';
        const sqm = mqComm || mqCalp || '';

        const queryParams = new URLSearchParams({
            ash: ash,
            msg: messageId,
            sop_id: sopId,
            tab: 'renovation',
            address: fullAddress,
            sqm: sqm
        });
        window.location.href = `../operators/realestate-utility.html?${queryParams.toString()}`;
    };

    window.copyFieldValue = function (elementId) {
        const el = document.getElementById(elementId);
        if (!el || !el.value) return;
        navigator.clipboard.writeText(el.value).then(() => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            if (tg && tg.showAlert) {
                tg.showAlert("Indirizzo copiato negli appunti!");
            } else {
                alert("Indirizzo copiato negli appunti!");
            }
        }).catch(() => {
            alert("Seleziona e copia manualmente il testo.");
        });
    };

    function collectPropertyDetailsFromForm() {
        const priceNum = parseFloat(document.getElementById('txPrezzoRichiesto').value) || 0;
        const ipeNum = parseFloat(document.getElementById('energyIpe').value) || 0;
        const renditaNum = parseFloat(document.getElementById('catRendita').value) || 0;
        const annoConstNum = parseInt(document.getElementById('catAnnoCostruzione').value, 10) || null;
        const mqComm = parseFloat(document.getElementById('physMqCommerciali').value) || 0;
        const mqCalp = parseFloat(document.getElementById('physMqCalpestabili').value) || 0;
        const numVani = parseInt(document.getElementById('physNumeroVani').value, 10) || 0;
        const numCamere = parseInt(document.getElementById('physCamere').value, 10) || 0;
        const numBagni = parseInt(document.getElementById('physBagni').value, 10) || 0;
        const giardinoMq = parseFloat(document.getElementById('amenGiardinoMq').value) || 0;
        const speseCondo = parseFloat(document.getElementById('txSpeseCondominiali').value) || 0;
        const provvigionePct = parseFloat(document.getElementById('txProvvigionePct').value) || 0;
        const deposito = parseFloat(document.getElementById('txDeposito').value) || 0;
        const lat = parseFloat(document.getElementById('locLat').value) || null;
        const lng = parseFloat(document.getElementById('locLng').value) || null;

        return {
            cadastral: {
                foglio: document.getElementById('catFoglio').value.trim(),
                particella: document.getElementById('catParticella').value.trim(),
                subalterno: document.getElementById('catSubalterno').value.trim(),
                categoria: document.getElementById('catCategoria').value.trim().toUpperCase(),
                rendita_catastale: renditaNum,
                anno_costruzione: annoConstNum
            },
            physical: {
                mq_commerciali: mqComm,
                mq_calpestabili: mqCalp,
                numero_vani: numVani,
                camere: numCamere,
                bagni: numBagni,
                piano: document.getElementById('physPiano').value.trim(),
                ascensore: document.getElementById('physAscensore').checked,
                riscaldamento: document.getElementById('physRiscaldamento').value,
                esposizione: document.getElementById('physEsposizione').value.trim()
            },
            amenities: {
                balcone: document.getElementById('amenBalcone').checked,
                terrazzo: document.getElementById('amenTerrazzo').checked,
                giardino_mq: giardinoMq,
                box_auto: document.getElementById('amenBoxAuto').checked,
                posto_auto: document.getElementById('amenPostoAuto').checked,
                cantina: document.getElementById('amenCantina').checked,
                climatizzazione: document.getElementById('amenClimatizzazione').checked,
                allarme: document.getElementById('amenAllarme').checked
            },
            energy: {
                classe_energetica: document.getElementById('energyClasse').value,
                ipe_kwh_mq_anno: ipeNum,
                codice_ape: document.getElementById('energyCodiceApe').value.trim()
            },
            transaction: {
                prezzo_richiesto: priceNum,
                spese_condominiali_mensili: speseCondo,
                provvigione_target_pct: provvigionePct,
                deposito_cauzionale: deposito,
                stato: document.getElementById('txStato').value,
                tipo_contratto: document.getElementById('txContractType').value
            },
            location: {
                indirizzo: document.getElementById('locIndirizzo').value.trim(),
                comune: document.getElementById('locComune').value.trim(),
                provincia: document.getElementById('locProvincia').value.trim().toUpperCase(),
                cap: document.getElementById('locCap').value.trim(),
                lat: lat,
                lng: lng,
                quartiere: document.getElementById('locQuartiere').value.trim()
            },
            media: {
                photos: currentPhotos,
                virtual_staging_urls: currentItemData?.property_details?.media?.virtual_staging_urls || [],
                floorplan_3d_url: document.getElementById('mediaFloorplanUrl').value.trim(),
                video_teaser_url: document.getElementById('mediaVideoTeaserUrl').value.trim()
            },
            multiposting: {
                immobiliare_it: document.getElementById('portalImmobiliare').checked,
                idealista: document.getElementById('portalIdealista').checked,
                casa_it: document.getElementById('portalCasait').checked,
                subito_it: document.getElementById('portalSubito').checked,
                meta_catalog: document.getElementById('portalMeta').checked
            }
        };
    }

    window.handleSaveProperty = async function (event) {
        event.preventDefault();
        const saveBtn = document.getElementById('savePropertyBtn');
        const saveBtnText = document.getElementById('savePropertyBtnText');

        if (saveBtn) saveBtn.disabled = true;
        if (saveBtnText) saveBtnText.innerText = "Salvataggio In Corso...";

        const propName = document.getElementById('propName').value.trim();
        const shortDesc = document.getElementById('propShortDesc').value.trim();
        const longDesc = document.getElementById('propLongDesc').value.trim();
        const propertyDetails = collectPropertyDetailsFromForm();

        const payload = currentItemData || {};
        payload.name = propName;
        payload.short_name = shortDesc;
        payload.vertical = 'realestate';
        payload.price = propertyDetails.transaction.prezzo_richiesto;

        if (!payload.identity) payload.identity = {};
        payload.identity.item_name = propName;
        payload.identity.item_type = 'SERVICE';
        payload.identity.vertical = 'realestate';
        if (!payload.identity.description) payload.identity.description = {};
        payload.identity.description.short = shortDesc;
        payload.identity.description.long = longDesc;

        if (!payload.pricing) payload.pricing = {};
        payload.pricing.base_price = propertyDetails.transaction.prezzo_richiesto;
        payload.pricing.currency = 'EUR';

        payload.property_details = propertyDetails;

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _auth: tg?.initData || '',
                    ash: ash,
                    action: 'SAVE',
                    type: 'PRODUCT',
                    sop_id: sopId,
                    message_id: messageId,
                    payload: payload
                })
            });

            if (!res.ok) {
                throw new Error(`Errore durante il salvataggio remoto (Codice ${res.status}).`);
            }

            if (saveBtn) saveBtn.classList.replace('bg-black', 'bg-emerald-600');
            if (saveBtnText) saveBtnText.innerText = "Scheda Immobile Salvata";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

            setTimeout(() => {
                goBackToMenu();
            }, 1200);
        } catch (err) {
            console.error("Errore salvataggio immobile:", err);
            if (saveBtn) saveBtn.disabled = false;
            if (saveBtnText) saveBtnText.innerText = "Salva Scheda Immobile";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
            const msg = "Si e verificato un errore durante il salvataggio della scheda. Riprova tra poco.";
            if (tg && tg.showAlert) {
                tg.showAlert(msg);
            } else {
                alert(msg);
            }
        }
    };
})();
