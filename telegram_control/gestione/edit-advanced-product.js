// --- GLOBAL CALCULATION LOGIC & STATE SYNCHRONISATION FOR PRODUCTS ---
// Riscritto 2026-08-25: allineato al nuovo schema di advanced_advisory_engine.workflow.ts
// (2 chiamate reali, niente più BOM/fornitori/concorrenza/asset editabili qui - quei dati
// vivono ora nel Blueprint reale, editabile da edit-blueprint-product.html). Questa pagina
// e' un cruscotto di sola lettura sull'advisory finanziario generato dall'AI.
// Vedi .agents/tasks/ods_advanced_advisory_engine_redesign.md.

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
        console.log("Dati ricevuti dal server:", rawData);

        const d = Array.isArray(rawData) ? rawData[0] : rawData;
        const doc = (d && (d.data || d.advanced_catalog_item || d.catalog_item || d.catalog_item_draft)) || d || {};

        currentData = doc.financial_advisory ? doc : null;

        hideObsoleteTabs();

        if (!currentData) {
            document.getElementById('header-subtitle').innerText = 'Nessuna analisi disponibile';
            showEmptyState();
            document.getElementById('loader').classList.add('hidden');
            return;
        }

        document.getElementById('header-subtitle').innerText = currentData.sop_id || 'Prodotto';
        populateCFO();
        document.getElementById('loader').classList.add('hidden');
    } catch (e) {
        console.error("Error loading product advanced data:", e);
        document.getElementById('loaderText').innerText = "Errore durante il caricamento dei dati.";
        const loader = document.getElementById('loader');
        if (loader) loader.classList.add('hidden');
    }
}

// Le sezioni BOM/Concorrenza/Fornitori/Aree/Asset/Blueprint non hanno più dati propri qui:
// la distinta base e le location vivono nel Blueprint reale (edit-blueprint-product.html),
// la concorrenza è stata rimossa dal motore su richiesta esplicita dell'Architetto.
function hideObsoleteTabs() {
    ['menu-tab-bom', 'menu-tab-competitors', 'menu-tab-suppliers', 'menu-tab-locations', 'menu-tab-assets', 'menu-tab-blueprint'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) saveBtn.classList.add('hidden');
}

function showEmptyState() {
    const container = document.getElementById('tab-cfo');
    if (container) {
        container.innerHTML = `<div class="p-6 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-400 italic text-center">Nessuna analisi Advanced generata per questo prodotto. Riprova più tardi o rigenera l'analisi.</div>`;
    }
}

function populateCFO() {
    const fa = currentData.financial_advisory || {};
    const cb = fa.cost_breakdown_unit || {};
    const catalogPrice = parseFloat(fa.pricing_summary?.catalog_price) || 0;

    document.getElementById('cfo-base-price').innerText = currFmt.format(catalogPrice);

    // 1. Health Rating
    const rating = fa.operations_financial_health_rating || 'NON_VALUTATO';
    const healthBadge = document.getElementById('label-health');
    const healthDesc = document.getElementById('label-health-desc');
    const healthCard = document.getElementById('cfo-health-card');

    if (healthBadge && healthDesc && healthCard) {
        if (rating === 'HIGH_PROFITABILITY') {
            healthBadge.className = 'px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'PROFITTEVOLE';
            healthDesc.innerText = "Il prodotto garantisce ottimi margini operativi e alta redditività.";
            healthCard.style.borderColor = '#22c55e';
        } else if (rating === 'MODERATE_MARGINS') {
            healthBadge.className = 'px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'MARGINI MEDI';
            healthDesc.innerText = "I margini sono stabili ma monitorare i costi dei materiali.";
            healthCard.style.borderColor = '#f59e0b';
        } else if (rating === 'AT_RISK') {
            healthBadge.className = 'px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'A RISCHIO';
            healthDesc.innerText = "Margini insufficienti o negativi: rivedere prezzo o costi.";
            healthCard.style.borderColor = '#ef4444';
        } else {
            healthBadge.className = 'px-4 py-2 bg-zinc-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
            healthBadge.innerText = 'NON VALUTATO';
            healthDesc.innerText = "Nessuna valutazione dello stato di salute finanziaria disponibile.";
            healthCard.style.borderColor = '#71717a';
        }
    }

    // 2. Strategy Advisory Text
    const advisoryEl = document.getElementById('pricing-advisory-text');
    if (advisoryEl) {
        advisoryEl.innerHTML = formatMarkdownText(fa.pricing_and_tariff_strategy_advisory || 'Nessuna raccomandazione disponibile.');
    }

    // 3. Cost Optimization Recommendations
    const container = document.getElementById('cost-optimization-list');
    if (container) {
        container.innerHTML = '';
        const recs = fa.operations_cost_optimization_recommendations || [];
        if (recs.length === 0) {
            container.innerHTML = `<div class="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] text-gray-400 italic text-center">Nessuna raccomandazione operativa presente.</div>`;
        } else {
            recs.forEach(r => {
                container.innerHTML += `
                    <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex gap-3">
                        <div class="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-[8px] mt-0.5 font-bold">✔</div>
                        <p class="text-[11px] text-gray-700">${r}</p>
                    </div>`;
            });
        }
    }

    // 4. Cost breakdown reale (mai ricalcolato client-side - viene gia' dal backend)
    const totalCogs = parseFloat(cb.direct_materials_cost) || 0;
    const totalVariableCosts = parseFloat(cb.total_direct_variable_costs_unit) || 0;
    const mdc = parseFloat(cb.contribution_margin_unit) || 0;
    const mdcPercent = catalogPrice > 0 ? (mdc / catalogPrice) * 100 : 0;
    const breakEvenUnits = fa.predictive_volume_simulation?.break_even_units_annually;

    document.getElementById('header-cost').innerText = currFmt.format(totalVariableCosts);
    document.getElementById('header-mdc').innerText = currFmt.format(mdc);
    document.getElementById('cfo-cogs').innerText = currFmt.format(totalCogs);
    document.getElementById('cfo-mdc').innerText = currFmt.format(mdc);
    document.getElementById('cfo-mdc-percent').innerText = mdcPercent.toFixed(1) + "%";
    document.getElementById('cfo-break-even').innerText = (breakEvenUnits !== null && breakEvenUnits !== undefined) ? breakEvenUnits : "-";

    // 5. Simulazione volumi - scenari reali gia' calcolati dal backend, non ricalcolati qui
    populateVolumeSimulation(fa.predictive_volume_simulation?.scenarios || []);

    // 6. Contesto fiscale e territoriale reale (sola lettura)
    populateFiscalAndKpi(currentData.fiscal_snapshot, currentData.territory_kpi);
}

function populateVolumeSimulation(scenarios) {
    const slider = document.getElementById('volume-slider');
    if (!slider || !Array.isArray(scenarios) || scenarios.length === 0) return;

    const renderForVolume = (val) => {
        // Trova lo scenario più vicino tra quelli reali calcolati dal backend (nessuna invenzione client-side)
        let closest = scenarios[0];
        scenarios.forEach(s => {
            if (Math.abs(s.monthly_volume - val) < Math.abs(closest.monthly_volume - val)) closest = s;
        });
        document.getElementById('slider-val').innerText = closest.monthly_volume;
        const fatturatoEl = document.getElementById('sim-fatturato');
        const margineEl = document.getElementById('sim-margine');
        const rendimentoEl = document.getElementById('sim-rendimento');
        if (fatturatoEl) fatturatoEl.innerText = currFmt.format(closest.total_revenues || 0);
        if (margineEl) margineEl.innerText = currFmt.format(closest.total_contribution_margin || 0);
        if (rendimentoEl) rendimentoEl.innerText = currFmt.format(closest.total_projected_operating_income || 0);
    };

    slider.min = Math.min(...scenarios.map(s => s.monthly_volume));
    slider.max = Math.max(...scenarios.map(s => s.monthly_volume));
    slider.value = scenarios[0].monthly_volume;
    slider.oninput = () => renderForVolume(parseInt(slider.value) || 0);
    renderForVolume(slider.value);
}

function populateFiscalAndKpi(fiscalSnapshot, territoryKpi) {
    const container = document.getElementById('tab-cfo');
    if (!container) return;

    let extra = document.getElementById('cfo-fiscal-kpi-block');
    if (!extra) {
        extra = document.createElement('div');
        extra.id = 'cfo-fiscal-kpi-block';
        extra.className = 'space-y-4 mt-6';
        container.appendChild(extra);
    }
    extra.innerHTML = '';

    if (territoryKpi?.summary) {
        extra.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h4 class="text-[10px] font-black uppercase text-gray-500 mb-1.5">📊 Benchmark Territoriale</h4>
                <p class="text-[11px] text-gray-700">${territoryKpi.summary}</p>
            </div>`;
    }

    if (fiscalSnapshot) {
        extra.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <h4 class="text-[10px] font-black uppercase text-gray-500 mb-1.5">🏛️ Profilo Fiscale Territoriale</h4>
                <p class="text-[11px] text-gray-700">IRES: ${fiscalSnapshot.ires_rate || 'N/D'} · IRAP: ${fiscalSnapshot.irap_rate || 'N/D'}</p>
            </div>`;
    } else {
        extra.innerHTML += `
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-[10px] text-gray-400 italic">
                Profilo fiscale non ancora disponibile - completa la Configurazione Avanzata dell'attività per un'analisi fiscale completa.
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', loadData);

// Helper function for rendering markdown texts
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
                // Ignore parse error, use original text string
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
