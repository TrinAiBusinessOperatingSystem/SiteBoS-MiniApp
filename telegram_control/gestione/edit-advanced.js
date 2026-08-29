// --- GLOBAL CALCULATION LOGIC & STATE SYNCHRONISATION FOR SERVICES ---
// Riscritto 2026-08-25: allineato al nuovo schema di advanced_advisory_engine.workflow.ts
// (schema snello MongoDB "advanced": financial_advisory, fiscal_snapshot, territory_kpi, owner_overrides)
// Nessun calcolo BOM/fornitori/concorrenza/asset editabili qui - quei dati vivono nel Blueprint reale.
// Supporta tutti i 17 parametri di override manuale dell'owner con GENERATE_ADVANCED_DRAFT.

const currFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

let roomPhotos = [];
let initialRoomPhotosStr = '[]';
let initialRoomDesc = '';

function isHospitalityVertical() {
    const v = String(
        currentData?.vertical || 
        currentData?.identity?.vertical || 
        currentData?.owner?.vertical ||
        currentData?.owner_data?.vertical ||
        ''
    ).toLowerCase().trim();
    return v === 'hospitality' || v === 'hotel' || v === 'resort' || v === 'bb' || v === 'agriturismo' || v === 'glamping';
}

function populateRoomMedia() {
    const section = document.getElementById('section-room-media');
    if (!section) return;

    if (!isHospitalityVertical()) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');

    const rm = currentData?.room_media || {};
    const rawPhotos = Array.isArray(rm.photos) ? rm.photos : [];
    roomPhotos = rawPhotos.map(p => typeof p === 'string' ? { url: p } : p).filter(p => p && p.url);
    initialRoomPhotosStr = JSON.stringify(roomPhotos);

    const descInput = document.getElementById('in-room-description');
    if (descInput) {
        descInput.value = rm.description || '';
        initialRoomDesc = descInput.value;
    }

    renderRoomPhotosGallery();
}

function renderRoomPhotosGallery() {
    const grid = document.getElementById('room-photos-grid');
    const countBadge = document.getElementById('room-photos-count');
    if (!grid) return;

    grid.innerHTML = '';
    if (countBadge) {
        countBadge.innerText = `${roomPhotos.length} Foto`;
    }

    if (roomPhotos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-6 text-center text-gray-400 text-[10px] font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
                <i class="fas fa-images text-2xl text-gray-300 mb-1 block"></i>
                Nessuna fotografia presente nella galleria per questo ambiente.
            </div>
        `;
        return;
    }

    roomPhotos.forEach((photo, idx) => {
        const card = document.createElement('div');
        card.className = "relative rounded-2xl overflow-hidden aspect-video border border-gray-200 bg-gray-100 group shadow-xs";
        card.innerHTML = `
            <img src="${escapeHtml(photo.url)}" alt="Foto Ambiente ${idx + 1}" class="w-full h-full object-cover">
            <span class="absolute top-2 left-2 bg-black/80 text-white text-[8px] font-black px-2 py-0.5 rounded-md">Foto ${idx + 1}</span>
            <button type="button" onclick="removeRoomPhoto(${idx})" class="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-md active:scale-90 transition cursor-pointer" title="Rimuovi Foto">
                <i class="fas fa-times"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

function removeRoomPhoto(idx) {
    if (idx >= 0 && idx < roomPhotos.length) {
        roomPhotos.splice(idx, 1);
        renderRoomPhotosGallery();
        checkDirty();
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
    }
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

async function handleRoomPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const processed = await processAndCompressImageToJpeg(file);
        roomPhotos.push({ url: processed.dataUrl });
        renderRoomPhotosGallery();
        checkDirty();
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } catch (err) {
        console.error("Errore compressione foto:", err);
        const msg = err.message || "Foto troppo pesante anche dopo compressione, riprova con una foto piu' piccola.";
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert(msg);
        } else {
            alert(msg);
        }
    } finally {
        event.target.value = '';
    }
}

function promptAddRoomPhotoUrl() {
    const url = prompt("Inserisci l'indirizzo web completo della fotografia dell'ambiente:");
    if (url && (url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('data:image/'))) {
        roomPhotos.push({ url: url.trim() });
        renderRoomPhotosGallery();
        checkDirty();
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    } else if (url) {
        alert("L'indirizzo deve essere un URL valido (http:// o https://).");
    }
}

function openMediaStudio() {
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    const queryParams = new URLSearchParams();
    if (ash) queryParams.set('ash', ash);
    if (messageId) queryParams.set('msg', messageId);
    if (sopId) queryParams.set('sop_id', sopId);
    const descInput = document.getElementById('in-room-description');
    if (descInput && descInput.value.trim()) {
        queryParams.set('room_context', descInput.value.trim());
    }
    window.location.href = `../operators/realestate-utility.html?${queryParams.toString()}`;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function collectRoomMedia() {
    if (!isHospitalityVertical()) return null;
    const descInput = document.getElementById('in-room-description');
    const desc = descInput ? descInput.value.trim() : '';
    return {
        photos: roomPhotos || [],
        description: desc
    };
}

function isRoomMediaDirty() {
    if (!isHospitalityVertical()) return false;
    const currentPhotosStr = JSON.stringify(roomPhotos || []);
    const descInput = document.getElementById('in-room-description');
    const currentDesc = descInput ? descInput.value : '';
    return currentPhotosStr !== initialRoomPhotosStr || currentDesc !== initialRoomDesc;
}

window.populateRoomMedia = populateRoomMedia;
window.renderRoomPhotosGallery = renderRoomPhotosGallery;
window.removeRoomPhoto = removeRoomPhoto;
window.handleRoomPhotoUpload = handleRoomPhotoUpload;
window.promptAddRoomPhotoUrl = promptAddRoomPhotoUrl;
window.openMediaStudio = openMediaStudio;

// Nasconde tutti i tab e i menu obsoleti che non hanno più corrispondenza nel nuovo schema
function hideObsoleteTabs() {
    const obsoleteIds = [
        'menu-tab-bom', 'menu-tab-competitors', 'menu-tab-suppliers', 
        'menu-tab-locations', 'menu-tab-assets', 'menu-tab-meta', 'menu-tab-blueprint'
    ];
    obsoleteIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const obsoleteTabContentIds = [
        'tab-bom', 'tab-competitors', 'tab-suppliers', 
        'tab-locations', 'tab-assets', 'tab-meta', 'tab-blueprint'
    ];
    obsoleteTabContentIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Nasconde la riconciliazione di bilancio e la relativa tabella (vecchio schema rimosso)
    const reconCard = document.getElementById('reconciliation-card');
    if (reconCard) reconCard.classList.add('hidden');
    const balSection = document.getElementById('balance-sheet-table-section');
    if (balSection) balSection.classList.add('hidden');

    // Nasconde il vecchio saveBtn/save-btn se presente
    const saveBtn = document.getElementById('save-btn') || document.getElementById('saveBtn');
    if (saveBtn) saveBtn.classList.add('hidden');
}

// Visualizza stato vuoto se non c'è analisi generata
function showEmptyState() {
    const container = document.getElementById('tab-cfo');
    if (container) {
        container.innerHTML = `
            <div class="p-8 bg-gray-50 border border-gray-100 rounded-3xl text-xs text-gray-400 italic text-center space-y-3">
                <i class="fas fa-chart-line text-2xl text-gray-300 block mb-1"></i>
                <p class="font-bold text-gray-600">Nessuna analisi Advanced generata per questa prestazione.</p>
                <p class="text-[10px] text-gray-400">Clicca sul pulsante di ricalcolo o genera l'analisi dall'editor principale.</p>
                <button onclick="triggerAiAdvisoryRecalculation()" class="mt-2 px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition">
                    Genera Analisi con IA
                </button>
            </div>`;
    }
}

// Popolamento della sezione CFO con i dati reali generati dal backend
function populateCFO() {
    if (!currentData || !currentData.financial_advisory) return;

    const fa = currentData.financial_advisory || {};
    const cb = fa.cost_breakdown_unit || {};
    const ps = fa.pricing_summary || {};
    const fp = fa.fiscal_and_previdential_impact || {};
    const sim = fa.predictive_volume_simulation || {};
    const catalogPrice = parseFloat(ps.catalog_price) || 0;

    // 1. Header Metrics
    const totalVarCosts = parseFloat(cb.total_direct_variable_costs_unit) || 0;
    const mdc = parseFloat(cb.contribution_margin_unit) || 0;
    const headerCost = document.getElementById('header-cost');
    if (headerCost) headerCost.innerText = currFmt.format(totalVarCosts);
    const headerMdc = document.getElementById('header-mdc');
    if (headerMdc) headerMdc.innerText = currFmt.format(mdc);

    const headerTime = document.getElementById('header-time');
    if (headerTime) {
        if (currentData.blueprint?.summary?.estimated_total_time_minutes) {
            headerTime.innerText = `${currentData.blueprint.summary.estimated_total_time_minutes} min`;
        } else if (cb.workstation_time_cost_fixed !== null && cb.workstation_time_cost_fixed !== undefined) {
            headerTime.innerText = 'Incluso';
        } else {
            headerTime.innerText = '-';
        }
    }

    // 2. Health Rating Card
    const rating = fa.operations_financial_health_rating || 'NON_VALUTATO';
    const healthBadge = document.getElementById('label-health');
    const healthDesc = document.getElementById('label-health-desc');
    const healthCard = document.getElementById('cfo-health-card');

    if (healthBadge && healthDesc && healthCard) {
        if (rating === 'HIGH_PROFITABILITY') {
            healthBadge.className = 'px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'PROFITTEVOLE';
            healthDesc.innerText = "La prestazione garantisce ottimi margini operativi e alta redditività.";
            healthCard.style.borderColor = '#22c55e';
        } else if (rating === 'MODERATE_MARGINS') {
            healthBadge.className = 'px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'MARGINI MEDI';
            healthDesc.innerText = "I margini sono stabili ma monitorare i costi di erogazione e di staff.";
            healthCard.style.borderColor = '#f59e0b';
        } else if (rating === 'AT_RISK') {
            healthBadge.className = 'px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'A RISCHIO';
            healthDesc.innerText = "Margini insufficienti o negativi: rivedere tariffa o costi di postazione.";
            healthCard.style.borderColor = '#ef4444';
        } else {
            healthBadge.className = 'px-4 py-2 bg-zinc-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'NON VALUTATO';
            healthDesc.innerText = "Nessuna valutazione dello stato di salute finanziaria disponibile.";
            healthCard.style.borderColor = '#71717a';
        }
    }

    // 3. Strategy Advisory Text
    const advisoryEl = document.getElementById('pricing-advisory-text');
    if (advisoryEl) {
        advisoryEl.innerHTML = formatMarkdownText(fa.pricing_and_tariff_strategy_advisory || 'Nessuna raccomandazione strategica disponibile.');
    }

    // 4. Cost Optimization Recommendations
    const recsContainer = document.getElementById('cost-optimization-list');
    if (recsContainer) {
        recsContainer.innerHTML = '';
        const recs = fa.operations_cost_optimization_recommendations || [];
        if (recs.length === 0) {
            recsContainer.innerHTML = `<div class="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] text-gray-400 italic text-center">Nessuna raccomandazione operativa presente.</div>`;
        } else {
            recs.forEach(r => {
                recsContainer.innerHTML += `
                    <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-3">
                        <div class="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-[8px] mt-0.5 font-bold">✔</div>
                        <p class="text-[11px] text-gray-700 font-medium">${r}</p>
                    </div>`;
            });
        }
    }

    // 5. Sidebar - Sintesi Caratteristica
    const workstationFixedCost = (cb.workstation_time_cost_fixed !== null && cb.workstation_time_cost_fixed !== undefined) 
        ? cb.workstation_time_cost_fixed 
        : null;
    const operatingIncome = cb.operating_income_unit !== undefined ? cb.operating_income_unit : (mdc - (workstationFixedCost || 0));
    const taxBurden = fp.estimated_tax_and_previdential_burden_value !== null && fp.estimated_tax_and_previdential_burden_value !== undefined 
        ? fp.estimated_tax_and_previdential_burden_value 
        : null;
    const netIncome = taxBurden !== null ? (operatingIncome - taxBurden) : operatingIncome;

    const outRicavi = document.getElementById('out-ricavi');
    if (outRicavi) outRicavi.innerText = currFmt.format(catalogPrice);
    const outCostiVar = document.getElementById('out-costi-var');
    if (outCostiVar) outCostiVar.innerText = currFmt.format(totalVarCosts);
    const outMdc = document.getElementById('out-mdc');
    if (outMdc) outMdc.innerText = currFmt.format(mdc);
    const outCostoFisso = document.getElementById('out-costo-fisso');
    if (outCostoFisso) outCostoFisso.innerText = workstationFixedCost !== null ? currFmt.format(workstationFixedCost) : 'N/D';
    const outReddito = document.getElementById('out-reddito');
    if (outReddito) outReddito.innerText = currFmt.format(operatingIncome);
    const outTasse = document.getElementById('out-tasse');
    if (outTasse) outTasse.innerText = taxBurden !== null ? currFmt.format(taxBurden) : 'N/D';
    const outUtile = document.getElementById('out-utile');
    if (outUtile) {
        outUtile.innerText = currFmt.format(netIncome);
        if (netIncome < 0) {
            outUtile.className = 'text-xl font-black text-red-500';
        } else {
            outUtile.className = 'text-xl font-black text-green-600';
        }
    }

    const marginBar = document.getElementById('margin-bar');
    if (marginBar) {
        const mdcPct = catalogPrice > 0 ? (mdc / catalogPrice) * 100 : 0;
        marginBar.style.width = Math.max(0, Math.min(100, mdcPct)) + '%';
        marginBar.className = mdc < 0 ? 'h-full bg-red-500 transition-all duration-300' : 'h-full bg-green-500 transition-all duration-300';
    }

    // 6. Break Even
    const bepUnits = sim.break_even_units_annually;
    const bepUnitsEl = document.getElementById('bep-units');
    const bepRationaleEl = document.getElementById('bep-rationale');
    if (bepUnitsEl) {
        if (bepUnits !== null && bepUnits !== undefined) {
            bepUnitsEl.innerText = `${bepUnits} prestazioni / anno`;
            if (bepRationaleEl) {
                bepRationaleEl.innerHTML = `Con un Margine di Contribuzione di <strong>${currFmt.format(mdc)}</strong>, l'attività raggiunge il pareggio operativo alla <strong>${bepUnits}ª esecuzione annua</strong> per coprire i costi fissi strutturali allocati.`;
            }
        } else {
            bepUnitsEl.innerText = mdc > 0 ? 'Calcolato su overhead' : 'Non Raggiungibile (MDC ≤ 0)';
            if (bepRationaleEl) {
                bepRationaleEl.innerText = mdc > 0 
                    ? "Completa la configurazione costi aziendali per il calcolo esatto del BEP." 
                    : "Il margine unitario è negativo: aumentare il prezzo o ridurre i costi variabili.";
            }
        }
    }

    // 7. Rationale Modal Button
    const calcRationale = cb.cost_calculation_rationale || fp.fiscal_calculation_rationale;
    const rationaleBtn = document.getElementById('btn-rationale-simulazione');
    if (rationaleBtn) {
        if (calcRationale && calcRationale.trim() !== "") {
            rationaleBtn.classList.remove('hidden');
            rationaleBtn.onclick = (e) => {
                e.preventDefault();
                showRationale('Rationale Calcolo Finanziario', calcRationale);
            };
        } else {
            rationaleBtn.classList.add('hidden');
        }
    }

    // 8. Popola Simulazione Volumi Mensili
    populateVolumeSimulation(sim.scenarios || []);

    // 9. Precompila Placeholders/Valori nei controlli di Override
    prepopulateOverrideInputs();
}

// Simulatore di volumi predittivo: itera dinamicamente sugli scenari reali calcolati dall'AI
function populateVolumeSimulation(scenarios) {
    const slider = document.getElementById('volume-slider');
    const sliderValEl = document.getElementById('slider-val');
    const simFatturato = document.getElementById('sim-fatturato');
    const simMargine = document.getElementById('sim-margine');
    const simCosti = document.getElementById('sim-costi');
    const simUtile = document.getElementById('sim-utile');
    const simUtileCard = document.getElementById('sim-utile-card');
    const simUtileLabel = document.getElementById('sim-utile-label');

    if (!slider || !Array.isArray(scenarios) || scenarios.length === 0) return;

    const volumes = scenarios.map(s => s.monthly_volume);
    slider.min = Math.min(...volumes);
    slider.max = Math.max(...volumes);
    slider.value = scenarios[0].monthly_volume;

    const renderForVolume = (val) => {
        let closest = scenarios[0];
        scenarios.forEach(s => {
            if (Math.abs(s.monthly_volume - val) < Math.abs(closest.monthly_volume - val)) {
                closest = s;
            }
        });

        if (sliderValEl) sliderValEl.innerText = closest.monthly_volume;
        if (simFatturato) simFatturato.innerText = currFmt.format(closest.total_revenues || 0);
        if (simMargine) simMargine.innerText = currFmt.format(closest.total_contribution_margin || 0);
        
        const operatingIncome = closest.total_projected_operating_income || 0;
        const totalCosts = (closest.total_revenues || 0) - operatingIncome;
        if (simCosti) simCosti.innerText = currFmt.format(Math.max(0, totalCosts));
        
        if (simUtile) {
            simUtile.innerText = currFmt.format(operatingIncome);
            if (operatingIncome < 0) {
                if (simUtileCard) simUtileCard.className = 'bg-red-50 border border-red-200 p-3 rounded-2xl';
                if (simUtileLabel) {
                    simUtileLabel.className = 'block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1';
                    simUtileLabel.innerText = 'Risultato Operativo';
                }
                simUtile.className = 'text-base font-black text-red-700';
            } else {
                if (simUtileCard) simUtileCard.className = 'bg-green-50 border border-green-200 p-3 rounded-2xl';
                if (simUtileLabel) {
                    simUtileLabel.className = 'block text-[8px] font-black text-green-700 uppercase tracking-widest mb-1';
                    simUtileLabel.innerText = 'Risultato Operativo';
                }
                simUtile.className = 'text-base font-black text-green-700';
            }
        }
    };

    slider.oninput = () => renderForVolume(parseInt(slider.value) || 0);
    renderForVolume(slider.value);
}

// Popolamento del tab Inquadramento Fiscale (tab-fiscal) con fiscal_snapshot e territory_kpi reali
function populateFiscal() {
    if (!currentData) return;

    const fs = currentData.fiscal_snapshot || null;
    const tk = currentData.territory_kpi || null;
    const fa = currentData.financial_advisory || {};
    const fp = fa.fiscal_and_previdential_impact || {};

    // 1. Regime Fiscale Presunto
    const regimeEl = document.getElementById('fiscal-regime-name');
    if (regimeEl) {
        regimeEl.innerText = fp.assumed_taxation_regime || (fs ? "Regime Ordinario d'Impresa" : "Inquadramento Standard");
    }

    // 2. Health / Congruità Badge
    const isaBadge = document.getElementById('isa-badge');
    if (isaBadge) {
        const rating = fa.operations_financial_health_rating || 'MODERATE_MARGINS';
        if (rating === 'HIGH_PROFITABILITY') {
            isaBadge.innerText = "ELEVATA SOSTENIBILITÀ";
            isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-green-100 text-green-700";
        } else if (rating === 'MODERATE_MARGINS') {
            isaBadge.innerText = "SOSTENIBILITÀ MEDIA";
            isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-amber-100 text-amber-700";
        } else {
            isaBadge.innerText = "A RISCHIO MARGINI";
            isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-red-100 text-red-700";
        }
    }

    // 3. Parametri Territoriali & Fiscali (5 riquadri)
    const box1Val = document.getElementById('fiscal-ateco');
    if (box1Val) {
        box1Val.innerText = tk?.primary_operator_hourly_rate ? currFmt.format(tk.primary_operator_hourly_rate) + '/h' : 'N/D';
    }
    const box2Val = document.getElementById('fiscal-coeff');
    if (box2Val) {
        box2Val.innerText = tk?.secondary_operator_hourly_rate ? currFmt.format(tk.secondary_operator_hourly_rate) + '/h' : 'N/D';
    }
    const box3Val = document.getElementById('fiscal-tax-rate');
    if (box3Val) {
        box3Val.innerText = fs?.ires_rate || (fp.estimated_tax_and_previdential_burden_value ? 'Calcolato' : '24.0%');
    }
    const box4Val = document.getElementById('fiscal-enpam-label');
    if (box4Val) {
        box4Val.innerText = fs?.irap_rate || '3.9%';
    }
    const box5Val = document.getElementById('fiscal-chairs');
    if (box5Val) {
        box5Val.innerText = tk?.workstation_hourly_rate ? currFmt.format(tk.workstation_hourly_rate) + '/h' : 'N/D';
    }

    // 4. Accordion dei Balzelli & Obblighi Territoriali Reali
    const accordionContent = document.getElementById('fiscal-accordion-content');
    const localBurdenRate = document.getElementById('local-burden-rate');
    
    if (accordionContent) {
        let itemsHtml = '';

        if (tk?.summary) {
            itemsHtml += `
                <div class="py-2 border-b border-gray-150">
                    <span class="font-black text-black block mb-0.5">📊 Benchmark Territoriale Rilevato</span>
                    <p class="text-[9px] text-gray-700 leading-relaxed">${tk.summary}</p>
                </div>`;
        }

        if (fs) {
            if (fs.tari) {
                itemsHtml += `
                    <div class="flex justify-between items-start py-1.5 border-b border-gray-100">
                        <div>
                            <span class="font-bold text-gray-800">TARI Locale</span>
                            <p class="text-[8px] text-gray-400">Quota Fissa: ${fs.tari.quota_fissa || 'N/D'} · Quota Var: ${fs.tari.quota_variabile || 'N/D'} · TEFA: ${fs.tari.tefa_rate || 'N/D'}</p>
                        </div>
                        <span class="font-black text-black ml-4 whitespace-nowrap text-[10px]">${fs.tari.total_estimated_per_sqm ? fs.tari.total_estimated_per_sqm + '/mq' : 'Comunale'}</span>
                    </div>`;
            }

            if (fs.cciaa_fee) {
                itemsHtml += `
                    <div class="flex justify-between items-start py-1.5 border-b border-gray-100">
                        <div>
                            <span class="font-bold text-gray-800">Diritto Annuale CCIAA</span>
                            <p class="text-[8px] text-gray-400">Scadenza: ${fs.cciaa_fee.due_date || 'Annuale'}</p>
                        </div>
                        <span class="font-black text-black ml-4 whitespace-nowrap text-[10px]">${fs.cciaa_fee.amount || 'Standard'}</span>
                    </div>`;
            }

            if (fs.environmental_obligations) {
                const env = fs.environmental_obligations;
                const codes = Array.isArray(env.special_waste_codes) ? env.special_waste_codes.join(', ') : (env.special_waste_codes || 'Nessuno');
                itemsHtml += `
                    <div class="py-1.5 border-b border-gray-100 space-y-0.5">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-gray-800">Adempimenti Ambientali & RENTRI</span>
                            <span class="font-black text-black text-[9px]">${env.rentri_status || 'Conforme'}</span>
                        </div>
                        <p class="text-[8px] text-gray-500">Codici Rifiuti: <strong>${codes}</strong> ${env.rentri_annual_fee ? `· Contributo: ${env.rentri_annual_fee}` : ''}</p>
                        ${env.environmental_rules ? `<p class="text-[8px] text-gray-400 italic">${env.environmental_rules}</p>` : ''}
                    </div>`;
            }

            if (fs.regional_tariffs_permits) {
                const reg = fs.regional_tariffs_permits;
                itemsHtml += `
                    <div class="flex justify-between items-start py-1.5">
                        <div>
                            <span class="font-bold text-gray-800">Concessioni & Diritti Regionali</span>
                            <p class="text-[8px] text-gray-400">ASP/ASL: ${reg.asp_inspection_fee || 'N/D'}</p>
                        </div>
                        <span class="font-black text-black ml-4 whitespace-nowrap text-[10px]">${reg.concessione_governativa || 'Regolare'}</span>
                    </div>`;
            }
        }

        if (!itemsHtml) {
            accordionContent.innerHTML = `<div class="text-center text-gray-400 italic py-2">Nessun adempimento territoriale speciale registrato.</div>`;
        } else {
            accordionContent.innerHTML = itemsHtml;
        }
    }

    if (localBurdenRate) {
        if (fs?.cciaa_fee?.amount) {
            localBurdenRate.innerText = `CCIAA: ${fs.cciaa_fee.amount}`;
        } else if (tk?.workstation_hourly_rate) {
            localBurdenRate.innerText = `Postazione: ${currFmt.format(tk.workstation_hourly_rate)}/h`;
        } else {
            localBurdenRate.innerText = 'Rilevato';
        }
    }
}

// Precompilazione dei placeholder e pulizia campi di override
function prepopulateOverrideInputs() {
    if (!currentData || !currentData.financial_advisory) return;

    const fa = currentData.financial_advisory || {};
    const cb = fa.cost_breakdown_unit || {};
    const ps = fa.pricing_summary || {};
    const fp = fa.fiscal_and_previdential_impact || {};
    const tk = currentData.territory_kpi || {};
    const fs = currentData.fiscal_snapshot || {};

    const setPlaceholder = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (val !== null && val !== undefined && val !== '') {
            el.placeholder = typeof val === 'number' ? val.toFixed(2) : String(val);
        }
    };

    setPlaceholder('in-tariffa', ps.catalog_price || 0);
    setPlaceholder('in-primary-fee', cb.primary_operator_fee || 0);
    setPlaceholder('in-costo-aso', cb.secondary_operator_fee || 0);
    setPlaceholder('in-materiali', cb.direct_materials_cost || 0);
    setPlaceholder('in-lab', cb.external_processing_cost || 0);
    setPlaceholder('in-garanzia-val', cb.guarantee_provision || 0);
    setPlaceholder('in-poltrona', tk.workstation_hourly_rate || 25.0);
    setPlaceholder('in-tempo', 30);
    setPlaceholder('in-setup-tempo', 15);
    setPlaceholder('in-costo-postazione-fisso', cb.workstation_time_cost_fixed || 0);
    setPlaceholder('in-tasse', fs.ires_rate ? (parseFloat(fs.ires_rate) || 24.0) : 24.0);
    setPlaceholder('in-onere-fiscale-val', fp.estimated_tax_and_previdential_burden_value || 0);
    setPlaceholder('in-regime-fiscale', fp.assumed_taxation_regime || 'Ordinario');
    setPlaceholder('in-saturazione-pct', 70);
    setPlaceholder('in-fissi-annui', 50000);
}

// Raccoglie ESATTAMENTE i campi valorizzati dall'owner per l'oggetto owner_overrides
// Un campo lasciato vuoto restituisce null (NON 0) per non sovrascrivere i calcoli AI reali.
function collectOwnerOverrides() {
    const overrides = {};
    let hasAny = false;

    const readNum = (id, divisor = 1) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const raw = el.value.trim();
        if (raw === "") return null;
        const n = parseFloat(raw);
        if (isNaN(n)) return null;
        hasAny = true;
        return n / divisor;
    };

    const readStr = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const raw = el.value.trim();
        if (raw === "") return null;
        hasAny = true;
        return raw;
    };

    // 17 campi esatti supportati dal backend
    overrides.catalog_price = readNum('in-tariffa');
    overrides.direct_materials_cost = readNum('in-materiali');
    overrides.external_processing_cost = readNum('in-lab');
    overrides.primary_operator_fee = readNum('in-primary-fee');
    overrides.secondary_operator_fee = readNum('in-costo-aso');
    overrides.guarantee_provision = readNum('in-garanzia-val');
    overrides.guarantee_provision_rate = readNum('in-garanzia-pct', 100);
    overrides.workstation_hourly_rate = readNum('in-poltrona');
    overrides.workstation_time_minutes = readNum('in-tempo');
    overrides.workstation_setup_minutes = readNum('in-setup-tempo');
    overrides.workstation_time_cost_fixed = readNum('in-costo-postazione-fisso');
    overrides.assumed_taxation_regime = readStr('in-regime-fiscale');
    overrides.income_tax_rate = readNum('in-tasse', 100);
    overrides.estimated_tax_and_previdential_burden_value = readNum('in-onere-fiscale-val');
    overrides.allocated_overhead_value = readNum('in-fissi-annui');

    const bepSelect = document.getElementById('select-bep-allocation');
    if (bepSelect && bepSelect.dataset.userChanged === 'true' && bepSelect.value !== "") {
        overrides.allocated_budget_percentage = parseFloat(bepSelect.value);
        hasAny = true;
    } else {
        overrides.allocated_budget_percentage = null;
    }

    overrides.agenda_saturation_target = readNum('in-saturazione-pct', 100);

    return { overrides, hasAny };
}

// Verifica se l'utente ha inserito override per accendere il pulsante di ricalcolo
function checkDirty() {
    const { hasAny } = collectOwnerOverrides();
    const isRoomDirty = isRoomMediaDirty();
    const aiBtn = document.getElementById('ai-recalc-btn');
    if (aiBtn) {
        if (hasAny || isRoomDirty) {
            aiBtn.className = "w-full py-3.5 bg-black text-white hover:opacity-90 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-3 cursor-pointer";
        } else {
            aiBtn.className = "w-full py-3.5 bg-black text-white hover:opacity-90 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-3 cursor-pointer";
        }
    }
}

// Trigger per il ricalcolo AI con azione GENERATE_ADVANCED_DRAFT e owner_overrides
async function triggerAiAdvisoryRecalculation() {
    const aiLoader = document.getElementById('ai-loader-modal');
    const titleEl = document.getElementById('ai-loader-title');
    const descEl = document.getElementById('ai-loader-desc');
    if (titleEl) titleEl.innerText = "Ricalcolo Advisory IA";
    if (descEl) descEl.innerText = "Invio delle modifiche manuali e ricalcolo in corso...";

    if (aiLoader) {
        aiLoader.classList.remove('hidden');
        setTimeout(() => aiLoader.classList.add('opacity-100'), 10);
    }

    try {
        const { overrides } = collectOwnerOverrides();
        const roomMedia = collectRoomMedia();

        const reqPayload = {
            _auth: tg.initData,
            ash: ash,
            action: 'GENERATE_ADVANCED_DRAFT',
            sop_id: sopId,
            message_id: messageId,
            owner_overrides: overrides
        };
        if (roomMedia) {
            reqPayload.room_media = roomMedia;
        }

        const response = await fetch(ASYNC_AI_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqPayload)
        });

        if (!response.ok) throw new Error("Errore durante l'avvio del ricalcolo dell'advisory");

        // Polling asincrono per attendere l'aggiornamento
        if (descEl) descEl.innerText = "Elaborazione in background... Attendere la rigenerazione completa...";

        let attempts = 0;
        const maxAttempts = 6;
        const pollInterval = 3500;

        const pollData = async () => {
            attempts++;
            if (descEl) descEl.innerText = `Aggiornamento analisi in corso (${attempts * 4}s)...`;
            await new Promise(res => setTimeout(res, pollInterval));

            try {
                const getRes = await fetch(ASYNC_AI_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        _auth: tg.initData,
                        action: 'GET',
                        sop_id: sopId,
                        message_id: messageId,
                        ash: ash
                    })
                });
                const raw = await getRes.json();
                const d = Array.isArray(raw) ? raw[0] : raw;
                const doc = (d && (d.data || d.advanced_catalog_item || d.catalog_item || d.catalog_item_draft)) || d || {};

                if (doc.financial_advisory || doc.sop_id || doc.name) {
                    currentData = doc;
                    if (currentData.financial_advisory) {
                        populateCFO();
                        populateFiscal();
                    }
                    populateRoomMedia();
                    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                    tg.showAlert("✅ Analisi Advanced ricalcolata con successo!");
                    return true;
                }
            } catch (pollErr) {
                console.warn("Polling error attempt:", pollErr);
            }

            if (attempts < maxAttempts) {
                return await pollData();
            } else {
                await loadData();
                tg.showAlert("✅ Dati aggiornati.");
                return true;
            }
        };

        await pollData();

    } catch (err) {
        console.error("Errore ricalcolo IA:", err);
        tg.showAlert("❌ Errore IA: " + err.message);
    } finally {
        if (aiLoader) {
            aiLoader.classList.remove('opacity-100');
            setTimeout(() => aiLoader.classList.add('hidden'), 200);
        }
    }
}

// Helpers di navigazione e modali
function toggleMenu() {
    const backdrop = document.getElementById('menu-backdrop');
    const drawer = document.getElementById('menu-drawer');
    if (!backdrop || !drawer) return;
    if (drawer.classList.contains('-translate-x-full')) {
        backdrop.classList.remove('hidden');
        setTimeout(() => backdrop.classList.add('opacity-100'), 10);
        drawer.classList.remove('-translate-x-full');
    } else {
        backdrop.classList.remove('opacity-100');
        setTimeout(() => backdrop.classList.add('hidden'), 300);
        drawer.classList.add('-translate-x-full');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(tabId);
    if (target) target.classList.remove('hidden');
}

function selectMenuSection(tabId, sectionTitle) {
    toggleMenu();
    switchTab(tabId);
    const titleEl = document.getElementById('active-section-title');
    if (titleEl) titleEl.innerHTML = sectionTitle;
    document.querySelectorAll('.menu-link').forEach(el => {
        el.classList.remove('bg-black', 'text-white');
        el.classList.add('text-gray-400', 'hover:bg-gray-50', 'hover:text-black');
    });
    const activeLink = document.getElementById('menu-' + tabId);
    if (activeLink) {
        activeLink.classList.remove('text-gray-400', 'hover:bg-gray-50', 'hover:text-black');
        activeLink.classList.add('bg-black', 'text-white');
    }
}

function toggleFiscalAccordion() {
    const content = document.getElementById('fiscal-accordion-content');
    const arrow = document.getElementById('fiscal-accordion-arrow');
    if (!content) return;
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}

function showRationale(title, text) {
    if (!text || text.trim() === "") return;
    const modal = document.getElementById('rationale-modal');
    if (!modal) return;
    const box = modal.querySelector('div');

    const titleEl = document.getElementById('rationale-modal-title');
    const textEl = document.getElementById('rationale-modal-text');
    if (titleEl) titleEl.innerText = title;
    if (textEl) textEl.innerText = text;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (box) box.classList.remove('scale-95');
    }, 10);
}

function closeRationaleModal() {
    const modal = document.getElementById('rationale-modal');
    if (!modal) return;
    const box = modal.querySelector('div');

    modal.classList.add('opacity-0');
    if (box) box.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function showCustomConfirm(title, message, onConfirm) {
    const modal = document.getElementById('custom-confirm-modal');
    const box = document.getElementById('confirm-modal-box');
    const titleEl = document.getElementById('confirm-modal-title');
    const descEl = document.getElementById('confirm-modal-desc');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = message;

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (box) box.classList.remove('scale-95');
    }, 10);

    const closeModal = () => {
        modal.classList.add('opacity-0');
        if (box) box.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 200);
        if (okBtn) okBtn.removeEventListener('click', handleOk);
        if (cancelBtn) cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleOk = () => { closeModal(); onConfirm(true); };
    const handleCancel = () => { closeModal(); onConfirm(false); };

    if (okBtn) okBtn.addEventListener('click', handleOk);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
}

function initBackButton() {
    if (window.Telegram?.WebApp?.BackButton) {
        const tb = window.Telegram.WebApp.BackButton;
        tb.show();
        tb.onClick(() => {
            const productUrl = `edit-product.html?sop_id=${sopId}&ash=${ash || ''}&message_id=${messageId || ''}`;
            window.location.href = productUrl;
        });
    }
}

// Markdown text renderer
function formatMarkdownText(text) {
    if (!text) return "";

    if (typeof text === 'string') {
        const trimmed = text.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object') {
                    text = parsed.text_content || parsed.content || parsed.raw_text || text;
                }
            } catch (e) {
                // Ignore parse error
            }
        }
    }

    if (typeof text !== 'string') {
        if (text && typeof text === 'object') {
            text = text.text_content || text.content || text.raw_text || JSON.stringify(text);
        } else {
            text = String(text);
        }
    }

    let clean = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    clean = clean.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-black underline font-semibold">$1</a>');
    clean = clean.replace(/^### (.*$)/gim, '<h4 class="text-xs font-black uppercase text-black mt-4 mb-1.5 flex items-center gap-1.5"><span class="w-1.5 h-1.5 bg-black rounded-full"></span>$1</h4>');
    clean = clean.replace(/^## (.*$)/gim, '<h3 class="text-xs font-black uppercase text-gray-800 mt-5 border-b pb-1">$1</h3>');
    clean = clean.replace(/^# (.*$)/gim, '<h2 class="text-sm font-black uppercase text-black mt-6 border-b-2 pb-1.5">$1</h2>');
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/^\s*[\-\*]\s+(.*$)/gim, '<div class="flex gap-2 items-start text-xs text-gray-700 pl-2 py-0.5"><span class="text-black">•</span><span>$1</span></div>');

    return clean;
}
