// --- GLOBAL CALCULATION LOGIC & STATE SYNCHRONISATION FOR PRODUCTS ---

const currFmt = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

async function loadData() {
    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                _auth: tg.initData,
                action: 'GET',
                type: 'PRODUCT',
                sop_id: sopId,
                message_id: messageId,
                ash: ash
            })
        });
        const rawData = await res.json();
        const d = Array.isArray(rawData) ? rawData[0] : rawData;
        const productData = d.catalog_item || d.catalog_item_draft || d;
        currentData = JSON.parse(JSON.stringify(productData));
        originalDataStr = JSON.stringify(collectDataForSaving());

        // Update headers & CFO view
        document.getElementById('header-subtitle').innerText = currentData.identity?.item_name || 'Prodotto';
        populateCFO();
        populateBOM();
        populateCompetitors();
        populateSuppliers();
        populateLocations();
        populateAssets();
        populateBlueprint();

        updateCalculations();
        document.getElementById('loader').classList.add('hidden');
    } catch (e) {
        console.error("Error loading product advanced data:", e);
        document.getElementById('loaderText').innerText = "Errore durante il caricamento dei dati.";
    }
}

function collectDataForSaving() {
    if (!currentData) return {};
    return {
        bom: currentData.bom || [],
        pricing: currentData.pricing || {},
        procurement: currentData.procurement || {},
        logistics: currentData.logistics || {},
        assets: currentData.assets || [],
        competitors: currentData.relations?.marketing_info?.competitors || []
    };
}

function checkDirty() {
    const currentStr = JSON.stringify(collectDataForSaving());
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.disabled = currentStr === originalDataStr;
    }
}

// --- CFO VIEW POPULATOR ---
function populateCFO() {
    const basePrice = parseFloat(currentData.pricing?.base_price) || 0;
    document.getElementById('cfo-base-price').innerText = currFmt.format(basePrice);
}

function updateCalculations() {
    const basePrice = parseFloat(currentData.pricing?.base_price) || 0;
    
    // Calculate total BOM cost (COGS)
    let totalCogs = 0;
    const bomItems = currentData.bom || [];
    bomItems.forEach(item => {
        const qty = parseFloat(item.qty || item.usage) || 0;
        const unitCost = parseFloat(item.unit_cost || item.cost) || 0;
        totalCogs += qty * unitCost;
    });

    const mdc = basePrice - totalCogs;
    const mdcPercent = basePrice > 0 ? (mdc / basePrice) * 100 : 0;
    
    // Break-even is fixed-cost / mdc. As standard template, we assume a static estimated fixed overhead
    const fixedOverhead = 2500; 
    const breakEvenUnits = mdc > 0 ? Math.ceil(fixedOverhead / mdc) : 0;

    document.getElementById('header-cost').innerText = currFmt.format(totalCogs);
    document.getElementById('header-mdc').innerText = currFmt.format(mdc);
    document.getElementById('cfo-cogs').innerText = currFmt.format(totalCogs);
    document.getElementById('cfo-mdc').innerText = currFmt.format(mdc);
    document.getElementById('cfo-mdc-percent').innerText = mdcPercent.toFixed(1) + "%";
    document.getElementById('cfo-break-even').innerText = breakEvenUnits > 0 ? breakEvenUnits : "-";

    updateSimulation();
}

function updateSimulation() {
    const val = parseInt(document.getElementById('volume-slider').value) || 0;
    document.getElementById('slider-val').innerText = val;

    const basePrice = parseFloat(currentData.pricing?.base_price) || 0;
    let totalCogs = 0;
    const bomItems = currentData.bom || [];
    bomItems.forEach(item => {
        const qty = parseFloat(item.qty || item.usage) || 0;
        const unitCost = parseFloat(item.unit_cost || item.cost) || 0;
        totalCogs += qty * unitCost;
    });

    const mdc = basePrice - totalCogs;
    const fatturato = basePrice * val;
    const margineTotale = mdc * val;
    const rendimentoEst = margineTotale - 2500; // Simulated yield minus estimated standard fix costs

    document.getElementById('sim-fatturato').innerText = currFmt.format(fatturato);
    document.getElementById('sim-margine').innerText = currFmt.format(margineTotale);
    document.getElementById('sim-rendimento').innerText = currFmt.format(rendimentoEst);
}

// --- BOM (DISTINTA BASE) ---
function populateBOM() {
    const container = document.getElementById('bom-table-body');
    container.innerHTML = '';
    const bomItems = currentData.bom || [];

    if (bomItems.length === 0) {
        container.innerHTML = `<tr><td colspan="6" class="py-6 text-center text-gray-400 italic">Distinta Base vuota.</td></tr>`;
        return;
    }

    bomItems.forEach((item, index) => {
        const qty = parseFloat(item.qty || item.usage) || 0;
        const unitCost = parseFloat(item.unit_cost || item.cost) || 0;
        const subtotal = qty * unitCost;

        const row = document.createElement('tr');
        row.className = "border-b border-gray-50 hover:bg-gray-50/50 transition-colors";
        row.innerHTML = `
            <td class="py-3">
                <input type="text" class="w-full bg-transparent border-none text-xs font-bold text-black focus:outline-none" value="${item.name || item.item_sku || ''}" onchange="updateBomItem(${index}, 'name', this.value)">
                <span class="text-[8px] text-gray-400 font-mono block">${item.item_sku || 'SKU ASSENTE'}</span>
            </td>
            <td class="py-3 text-center w-16">
                <input type="number" step="0.01" class="w-full bg-gray-50 border border-transparent rounded-md p-1 text-center font-black text-xs text-black" value="${qty}" onchange="updateBomItem(${index}, 'qty', this.value)">
            </td>
            <td class="py-3 text-center w-12 text-xs font-medium text-gray-400">
                <input type="text" class="w-full bg-transparent border-none text-center focus:outline-none text-xs" value="${item.unit_of_measure || 'pz'}" onchange="updateBomItem(${index}, 'unit_of_measure', this.value)">
            </td>
            <td class="py-3 text-right text-xs text-gray-500 w-24">
                <input type="number" step="0.01" class="w-full bg-gray-50 border border-transparent rounded-md p-1 text-right font-black text-xs text-black" value="${unitCost}" onchange="updateBomItem(${index}, 'unit_cost', this.value)">
            </td>
            <td class="py-3 text-right text-xs text-black w-24">${currFmt.format(subtotal)}</td>
            <td class="py-3 text-center w-12">
                <button onclick="removeBomRow(${index})" class="text-red-500 hover:text-red-700 active:scale-90 transition-transform"><i class="fas fa-trash-alt text-xs"></i></button>
            </td>
        `;
        container.appendChild(row);
    });
}

function updateBomItem(index, field, value) {
    if (!currentData.bom) currentData.bom = [];
    if (field === 'qty') value = parseFloat(value) || 0;
    if (field === 'unit_cost') value = parseFloat(value) || 0;
    
    currentData.bom[index][field] = value;
    if (field === 'qty') currentData.bom[index].usage = value;
    if (field === 'unit_cost') currentData.bom[index].cost = value;

    updateCalculations();
    populateBOM();
    checkDirty();
}

function addNewBomRow() {
    if (!currentData.bom) currentData.bom = [];
    const newSku = "SKU-PROD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    currentData.bom.push({
        item_sku: newSku,
        name: "Nuovo Componente",
        qty: 1,
        usage: 1,
        unit_of_measure: "pz",
        unit_cost: 0.00,
        cost: 0.00,
        relation_type: "semilavorato"
    });
    populateBOM();
    updateCalculations();
    checkDirty();
}

function removeBomRow(index) {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
    currentData.bom.splice(index, 1);
    populateBOM();
    updateCalculations();
    checkDirty();
}

// --- COMPETITORS ---
function populateCompetitors() {
    const container = document.getElementById('competitors-list-container');
    container.innerHTML = '';
    const compList = currentData.relations?.marketing_info?.competitors || [];

    if (compList.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Nessun competitor mappato dall'AI.</p>`;
        return;
    }

    compList.forEach((c, i) => {
        const el = document.createElement('div');
        el.className = "flex justify-between items-center bg-gray-50 border border-gray-100 p-4 rounded-2xl";
        el.innerHTML = `
            <div>
                <p class="text-xs font-black text-black">${c.competitor_name || 'Competitor'}</p>
                <a href="${c.source_url || '#'}" target="_blank" class="text-[9px] text-blue-500 font-bold hover:underline block truncate max-w-[200px]">${c.source_url || 'Link sorgente'}</a>
            </div>
            <div class="text-right">
                <span class="text-xs font-black text-black">${currFmt.format(c.price || 0)}</span>
                <span class="block text-[8px] font-black uppercase text-gray-400 mt-0.5">Prezzo Stimato</span>
            </div>
        `;
        container.appendChild(el);
    });
}

// --- SUPPLIERS ---
function populateSuppliers() {
    const container = document.getElementById('suppliers-list-container');
    container.innerHTML = '';
    const suppliers = currentData.procurement?.suppliers || [];

    if (suppliers.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Nessun fornitore mappato.</p>`;
        return;
    }

    suppliers.forEach((s, index) => {
        const el = document.createElement('div');
        el.className = "card rounded-2xl p-4 border border-gray-100 space-y-2";
        el.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="text-xs font-black text-black">${s.supplier_name || 'Fornitore'}</h4>
                    <p class="text-[9px] font-bold text-gray-400 uppercase mt-0.5">SKU Materiale: ${s.material_sku || 'N/D'}</p>
                </div>
                <div class="text-right">
                    <span class="text-xs font-black text-black">${currFmt.format(s.unit_cost || s.cost || 0)}</span>
                </div>
            </div>
        `;
        container.appendChild(el);
    });
}

// --- LOCATIONS ---
function populateLocations() {
    const container = document.getElementById('locations-list-container');
    container.innerHTML = '';
    const locations = currentData.logistics?.locations || [];

    if (locations.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Nessuna area logistica mappata.</p>`;
        return;
    }

    locations.forEach(l => {
        const el = document.createElement('div');
        el.className = "bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center";
        el.innerHTML = `
            <div>
                <p class="text-xs font-black text-black uppercase">${l.loc_name || 'Area'}</p>
                <span class="text-[8px] font-black text-gray-400 uppercase mt-0.5">${l.purpose || 'Impiego'}</span>
            </div>
            <div class="text-right">
                <span class="text-xs font-black text-black">${l.estimated_internal_cost_rate ? currFmt.format(l.estimated_internal_cost_rate) + '/ora' : '-'}</span>
            </div>
        `;
        container.appendChild(el);
    });
}

// --- ASSETS ---
function populateAssets() {
    const container = document.getElementById('assets-list-container');
    container.innerHTML = '';
    const assets = currentData.assets || [];

    if (assets.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Nessun macchinario o asset mappato.</p>`;
        return;
    }

    assets.forEach(a => {
        const el = document.createElement('div');
        el.className = "bg-gray-50 border border-gray-100 p-4 rounded-2xl flex justify-between items-center";
        el.innerHTML = `
            <div>
                <p class="text-xs font-black text-black uppercase">${a.asset_name || 'Macchinario'}</p>
                <span class="text-[8px] font-black text-gray-400 uppercase mt-0.5">SKU: ${a.asset_sku || 'N/D'}</span>
            </div>
            <div class="text-right">
                <span class="text-xs font-black text-black">${a.estimated_internal_cost_rate ? currFmt.format(a.estimated_internal_cost_rate) + '/ora' : '-'}</span>
            </div>
        `;
        container.appendChild(el);
    });
}

// --- BLUEPRINT REQUISITI (READ-ONLY VISUALIZATION) ---
function populateBlueprint() {
    const container = document.getElementById('blueprint-steps-container');
    container.innerHTML = '';
    
    // Look for stages in currentData.blueprint or messages
    const stages = currentData.blueprint?.stages || [];
    
    if (stages.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-4">Nessuna sequenza di assemblaggio disponibile.</p>`;
        return;
    }

    stages.forEach((stage, i) => {
        const stageEl = document.createElement('div');
        stageEl.className = "space-y-2";
        
        let stepsHTML = "";
        (stage.steps || []).forEach(step => {
            stepsHTML += `
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5">
                    <div class="flex justify-between items-start">
                        <h5 class="text-xs font-black text-black uppercase">${step.step_name || 'Step'}</h5>
                        <span class="text-[8px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">${step.estimated_time_minutes || 0} min</span>
                    </div>
                    <p class="text-[10px] text-gray-500 font-medium leading-relaxed">${step.instructions || ''}</p>
                </div>
            `;
        });

        stageEl.innerHTML = `
            <div class="border-l-2 border-l-black pl-3 py-1 mb-4">
                <span class="text-[8px] font-black text-gray-400 uppercase">Fase ${stage.stage_order || i+1}</span>
                <h4 class="text-xs font-black uppercase text-black leading-none mt-0.5">${stage.stage_name || 'Fase'}</h4>
            </div>
            <div class="space-y-2 pl-3">
                ${stepsHTML}
            </div>
        `;
        container.appendChild(stageEl);
    });
}

// --- SAVE FUNCTION ---
async function saveProductAdvancedData() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn || saveBtn.disabled) return;
    
    saveBtn.disabled = true;
    const initialText = saveBtn.querySelector('span').innerText;
    saveBtn.querySelector('span').innerText = "Salvataggio in corso...";

    try {
        const payload = {
            _auth: tg.initData,
            action: 'SAVE',
            type: 'PRODUCT',
            sop_id: sopId,
            message_id: messageId,
            ash: ash,
            payload: currentData
        };

        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            saveBtn.className = saveBtn.className.replace('bg-black', 'bg-green-600');
            saveBtn.querySelector('span').innerText = "Salvato con Successo!";
            originalDataStr = JSON.stringify(collectDataForSaving());
            setTimeout(() => {
                tg.close();
            }, 1200);
        } else {
            throw new Error("Failed response from server");
        }
    } catch (e) {
        console.error("Save product advanced error:", e);
        saveBtn.disabled = false;
        saveBtn.querySelector('span').innerText = initialText;
        tg.showAlert("Errore durante il salvataggio dei dati.");
        if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    }
}

document.addEventListener('DOMContentLoaded', loadData);
