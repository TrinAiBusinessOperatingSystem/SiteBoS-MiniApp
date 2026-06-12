// --- GLOBAL CALCULATION LOGIC & STATE SYNCHRONISATION ---

function calculateSubprocessStaffCosts(sub) {
    const staff = sub.calculation_breakdown?.staff_cost || 0;
    const stages = sub.stages || [];
    
    let hasSteps = false;
    let medicoCalc = 0;
    let asoCalc = 0;
    
    const rates = currentData.operating_benchmarks?.operators_hourly_rates || {};
    const defaultRates = {
        "Medico_Chirurgo_Odontoiatra": 62.4,
        "Assistente_ASO": 16.9,
        "Segretaria_Amministrativa": 14.95
    };
    
    stages.forEach(stg => {
        (stg.steps || []).forEach(step => {
            const time = parseFloat(step.estimated_time_minutes) || 0;
            if (time > 0) {
                const skills = step.required_skills || [];
                skills.forEach(skill => {
                    hasSteps = true;
                    const rate = parseFloat(rates[skill]) || parseFloat(defaultRates[skill]) || (skill.toLowerCase().includes("medico") || skill.toLowerCase().includes("odontoiatra") ? 62.4 : 16.9);
                    const cost = (rate / 60) * time;
                    
                    if (skill.toLowerCase().includes("medico") || skill.toLowerCase().includes("odontoiatra")) {
                        medicoCalc += cost;
                    } else {
                        asoCalc += cost;
                    }
                });
            }
        });
    });
    
    const totalCalc = medicoCalc + asoCalc;
    if (hasSteps && totalCalc > 0) {
        return {
            medico: staff * (medicoCalc / totalCalc),
            aso: staff * (asoCalc / totalCalc)
        };
    }
    
    // Fallback to name/sku classification
    const name = (sub.subprocess_name || "").toLowerCase();
    const sku = (sub.subprocess_sku || "").toLowerCase();
    const isStaff = name.includes("accoglienza") || name.includes("accettazione") || name.includes("check-in") ||
                    name.includes("consenso") || name.includes("consensi") || name.includes("privacy") || name.includes("gdpr") ||
                    name.includes("calibrazione") || name.includes("setup") || name.includes("vestizione") || name.includes("barriere") ||
                    name.includes("sanificazione") || name.includes("decontaminazione") || name.includes("pulizia") ||
                    sku.includes("adm") || sku.includes("prep") || sku.includes("sanit");
    if (isStaff) {
        return { medico: 0, aso: staff };
    } else {
        return { medico: staff, aso: 0 };
    }
}

function updateCompensoFromPct() {
    unit_tariffa = parseFloat(document.getElementById('in-tariffa').value) || 0;
    const pct = parseFloat(document.getElementById('in-compenso-pct').value) || 0;
    document.getElementById('in-compenso').value = ((unit_tariffa * pct) / 100).toFixed(2);
    recalculateAll();
}

function updateCompensoFromEuro() {
    unit_tariffa = parseFloat(document.getElementById('in-tariffa').value) || 0;
    const compenso = parseFloat(document.getElementById('in-compenso').value) || 0;
    document.getElementById('in-compenso-pct').value = unit_tariffa > 0 ? ((compenso / unit_tariffa) * 100).toFixed(2) : 0;
    recalculateAll(true);
}

// --- MOTORE DI CALCOLO DINAMICO REATTIVO ---
function recalculateAll(drivenByEuro = false) {
    unit_tariffa = parseFloat(document.getElementById('in-tariffa').value) || 0;
    
    let compenso = parseFloat(document.getElementById('in-compenso').value) || 0;
    if (!drivenByEuro) {
        const pct = parseFloat(document.getElementById('in-compenso-pct').value) || 0;
        compenso = (unit_tariffa * pct) / 100;
        document.getElementById('in-compenso').value = compenso.toFixed(2);
    }

    const costoAso = parseFloat(document.getElementById('in-costo-aso').value) || 0;
    const materiali = parseFloat(document.getElementById('in-materiali').value) || 0;
    const lab = parseFloat(document.getElementById('in-lab').value) || 0;
    
    const tempoVal = parseFloat(document.getElementById('in-tempo').value) || 0;
    const costoOra = parseFloat(document.getElementById('in-poltrona').value) || 0;
    
    // Tassazione & ENPAM divisa e reattiva
    const tasseP = parseFloat(document.getElementById('in-tasse').value) || 0;
    const enpamEl = document.getElementById('select-enpam-rate');
    const enpamRate = enpamEl ? parseFloat(enpamEl.value) : 0.0;
    const aliquotaTotale = tasseP + enpamRate;

    // --- INTEGRAZIONE DEI BALZELLI LOCALI NEL COSTO SEDIA/POSTAZIONE ---
    const localBurdenHourly = parseFloat(currentData.market_and_fiscal_intelligence?.fiscal_analysis?.local_compliance_overhead_hourly) || 0.00;
    const costoSediaTotaleOrario = costoOra + localBurdenHourly;

    const varCosts = compenso + costoAso + materiali + lab;
    unit_mdc = unit_tariffa - varCosts;
    
    // Calcolo del costo sedia fisso allocato includendo la quota oraria dei balzelli territoriali
    unit_costofisso = (costoSediaTotaleOrario / 60) * tempoVal;
    const reddito = unit_mdc - unit_costofisso;
    
    // --- ACCANTONAMENTO FISCALE ANALITICO (S.r.l./STP) o FORFETTARIO / ORDINARIO ---
    let prelievoTotale = 0;
    const regimeLower = (currentData.market_and_fiscal_intelligence?.fiscal_analysis?.regime_name || "").toLowerCase();
    
    const detectedVertical = (currentData.vertical || 'generic').toLowerCase();
    if (detectedVertical === 'dental') {
        const isSocietario = regimeLower.includes("s.r.l.") || regimeLower.includes("srl") || regimeLower.includes("stp");
        if (isSocietario) {
            // S.r.l. STP (Analitico): Tasse (IRES) su Reddito Operativo + ENPAM su Fatturato Lordo
            const tasseVal = reddito > 0 ? (reddito * (tasseP / 100)) : 0;
            const enpamVal = unit_tariffa * (enpamRate / 100);
            prelievoTotale = tasseVal + enpamVal;
        } else {
            // Forfettario (Imponibile fittizio): Aliquota applicata sul 78% del fatturato
            prelievoTotale = (unit_tariffa * 0.78) * (aliquotaTotale / 100);
        }
    } else {
        // Regime Ordinario Generico
        prelievoTotale = reddito > 0 ? (reddito * (tasseP / 100)) : 0;
    }
    
    unit_utile = reddito - prelievoTotale;

    // Aggiorna DOM Sidebar
    document.getElementById('out-ricavi').innerText = currFmt.format(unit_tariffa);
    document.getElementById('out-costi-var').innerText = currFmt.format(varCosts);
    document.getElementById('out-mdc').innerText = currFmt.format(unit_mdc);
    document.getElementById('out-costo-fisso').innerText = currFmt.format(unit_costofisso);
    document.getElementById('out-reddito').innerText = currFmt.format(reddito);
    document.getElementById('out-tasse').innerText = currFmt.format(prelievoTotale);
    document.getElementById('out-utile').innerText = currFmt.format(unit_utile);
    
    // Aggiorna Header
    document.getElementById('header-mdc').innerText = currFmt.format(unit_mdc);
    document.getElementById('header-time').innerText = tempoVal + ' min';

    // Styling Sidebar Utile/Barra
    const utileEl = document.getElementById('out-utile');
    if (unit_utile < 0) {
        utileEl.className = 'text-xl font-black text-red-500';
        document.getElementById('margin-bar').className = 'h-full bg-red-500 transition-all duration-300';
    } else {
        utileEl.className = 'text-xl font-black text-green-600';
        document.getElementById('margin-bar').className = 'h-full bg-green-500 transition-all duration-300';
    }
    const mdcPct = unit_tariffa > 0 ? (unit_mdc / unit_tariffa) * 100 : 0;
    document.getElementById('margin-bar').style.width = Math.max(0, Math.min(100, mdcPct)) + '%';

    // Costi Fissi Dinamici letti dall'input della Tab Fiscale con attenuazione BEP
    const fixedCostsInput = parseFloat(document.getElementById('in-fissi-annui').value) || 50000;
    const bepAllocation = parseFloat(document.getElementById('select-bep-allocation').value) || 0.60;
    const allocatedFixedCosts = fixedCostsInput * bepAllocation;

    // Break-Even Point Dinamico
    const bepUnitsEl = document.getElementById('bep-units');
    const bepRationaleEl = document.getElementById('bep-rationale');
    if (unit_mdc > 0) {
        const bepVal = Math.ceil(allocatedFixedCosts / unit_mdc);
        bepUnitsEl.innerText = bepVal + " prestazioni / anno";
        if (detectedVertical === 'dental') {
            bepRationaleEl.innerHTML = `Con un Margine di Contribuzione unitario di <strong>${currFmt.format(unit_mdc)}</strong>, lo studio raggiunge il pareggio finanziario alla <strong>${bepVal}ª esecuzione annua</strong> per coprire la quota allocata del <strong>${(bepAllocation*100).toFixed(0)}%</strong> dei costi fissi strutturali allocati (${currFmt.format(allocatedFixedCosts)} su ${currFmt.format(fixedCostsInput)}).`;
        } else {
            bepRationaleEl.innerHTML = `Con un Margine di Contribuzione unitario di <strong>${currFmt.format(unit_mdc)}</strong>, l'attività raggiunge il pareggio finanziario alla <strong>${bepVal}ª esecuzione annua</strong> per coprire la quota allocata del <strong>${(bepAllocation*100).toFixed(0)}%</strong> delle spese fisse operative associate...`;
        }
    } else {
        bepUnitsEl.innerText = "Non Raggiungibile";
        if (detectedVertical === 'dental') {
            bepRationaleEl.innerHTML = "L'MDC è economico negativo. Aumenta la tariffa o abbassa i costi variabili clinici per poter ammortizzare la struttura.";
        } else {
            bepRationaleEl.innerHTML = "L'MDC è negativo. Aumenta la tariffa o abbassa i costi variabili per poter ammortizzare la struttura.";
        }
    }

    // CFO Advisory Card
    const healthBadge = document.getElementById('label-health');
    const healthDesc = document.getElementById('label-health-desc');
    const healthCard = document.getElementById('cfo-health-card');
    if (unit_utile > 20) {
        healthBadge.className = 'px-4 py-2 bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
        healthBadge.innerText = 'PROFITTEVOLE';
        healthDesc.innerText = "Ottimo. La prestazione copre i costi strutturali e garantisce utile.";
        healthCard.style.borderColor = '#22c55e';
    } else if (unit_utile >= 0) {
        healthBadge.className = 'px-4 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
        healthBadge.innerText = 'MARGINI BASSI';
        healthDesc.innerText = "Utile netto risicato. Utilizzare prevalentemente come servizio gancio.";
        healthCard.style.borderColor = '#f59e0b';
    } else {
        healthBadge.className = 'px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-md';
        healthBadge.innerText = 'IN PERDITA';
        if (detectedVertical === 'dental') {
            healthDesc.innerText = "Critico. La tariffa NON sostiene il costo di struttura e il prelievo fiscale/previdenziale.";
        } else {
            healthDesc.innerText = "Critico. La tariffa NON sostiene il costo di struttura e il prelievo fiscale.";
        }
        healthCard.style.borderColor = '#ef4444';
    }

    // --- CALCOLO COEFFICIENTE DI REDDITIVITÀ REALE (EBIT Margin / ROS) ---
    const coeffReale = unit_tariffa > 0 ? ((reddito / unit_tariffa) * 100) : 0;
    const coeffEl = document.getElementById('fiscal-coeff');
    
    const enpamLabelEl = document.getElementById('fiscal-enpam-label');
    if (enpamLabelEl) {
        enpamLabelEl.innerText = enpamRate.toFixed(2) + "%";
    }
    document.getElementById('fiscal-tax-rate').innerText = tasseP.toFixed(1) + "%";
    
    if (detectedVertical === 'dental') {
        const regimeName = enpamRate === 2.0 ? "S.r.l. Ordinaria Commerciale" : (enpamRate === 0.5 ? "S.r.l. STP" : "Regime Esente");
        document.getElementById('fiscal-regime-name').innerText = regimeName + " (con quota ENPAM " + enpamRate.toFixed(1) + "%)";

        // --- CALCOLO AFFIDABILITÀ FISCALE (ISA MODELLO DK21U) ---
        const isaBadge = document.getElementById('isa-badge');
        if (unit_tariffa > 0) {
            const ros = reddito / unit_tariffa;
            if (ros >= 0.40) {
                if (isaBadge) {
                    isaBadge.innerText = "CONGRUO (PREMIALE)";
                    isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-green-100 text-green-700";
                }
            } else if (ros >= 0.25) {
                if (isaBadge) {
                    isaBadge.innerText = "CONGRUO (COERENTE)";
                    isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-amber-100 text-amber-700";
                }
            } else {
                if (isaBadge) {
                    isaBadge.innerText = "RISCHIO ACCERTAMENTO";
                    isaBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-red-100 text-red-700";
                }
            }
        }

        let explanationText = "";
        if (isSocietario) {
            if (coeffEl) {
                coeffEl.innerHTML = `<span class="text-green-600 font-bold">${coeffReale.toFixed(1)}%</span><span class="text-[7px] text-gray-400 block font-bold uppercase tracking-wider mt-0.5">Margine Reale (ROS)</span>`;
            }

            let deltaSpreco = 78.0 - coeffReale;
            let utileFittizioImposto = unit_tariffa * 0.78;
            let differenzaImponibileTassabile = utileFittizioImposto - reddito;

            explanationText = `
                L'inquadramento come <strong>${regimeName}</strong> ti consente di pagare le imposte societarie sull'utile reale del <strong>${coeffReale.toFixed(1)}%</strong>, deducendo analiticamente tutti i costi di sedia, staff e materiali chirurgici.<br><br>
                ⚠️ <strong>Confronto con il Forfettario:</strong> Se utilizzassi il Regime Forfettario ordinario (ATECO 86.23.00), il Fisco applicherebbe un coefficiente legale fisso del <strong>78%</strong>, imponendoti di dichiarare un utile forzato di <strong>${currFmt.format(utileFittizioImposto)}</strong> su questa prestazione clinica.<br>
                Così facendo, <strong>pagheresti le tasse su un ${deltaSpreco.toFixed(1)}% di utile fittizio</strong> (pari a <strong>${currFmt.format(differenzaImponibileTassabile)}</strong> di costi effettivi che per il fisco non esistono). La struttura societaria elimina questa inefficienza.
            `;
        } else {
            if (coeffEl) {
                coeffEl.innerHTML = `<span>78.0%</span><span class="text-[7px] text-gray-400 block font-bold uppercase tracking-wider mt-0.5">Forfettario Legale</span>`;
            }
            explanationText = `
                Il regime configurato simula l'applicazione del <strong>Regime Forfettario</strong> con coefficiente legale al <strong>78,0%</strong>. Le imposte e l'ENPAM vengono calcolati su questa base imponibile presunta, ignorando l'incidenza reale dei tuoi costi clinici di sedia o dei consumabili chirurgici.
            `;
        }
        document.getElementById('fiscal-explanation').innerHTML = explanationText;
    } else {
        const regimeName = "Ordinario Societario";
        document.getElementById('fiscal-regime-name').innerText = regimeName;

        // --- INDICATORE DI SALUTE AZIENDALE (EBITDA / ROS) ---
        const genericHealthBadge = document.getElementById('isa-badge');
        if (unit_tariffa > 0) {
            const ros = reddito / unit_tariffa;
            if (ros >= 0.30) {
                if (genericHealthBadge) {
                    genericHealthBadge.innerText = "ROS ECCELLENTE";
                    genericHealthBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-green-100 text-green-700";
                }
            } else if (ros >= 0.15) {
                if (genericHealthBadge) {
                    genericHealthBadge.innerText = "ROS SODDISFACENTE";
                    genericHealthBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-amber-100 text-amber-700";
                }
            } else {
                if (genericHealthBadge) {
                    genericHealthBadge.innerText = "ROS DEBOLE";
                    genericHealthBadge.className = "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl bg-red-100 text-red-700";
                }
            }
        }

        let explanationText = `
            L'inquadramento ordinario societario consente di pagare le imposte sull'utile reale del <strong>${coeffReale.toFixed(1)}%</strong>, deducendo analiticamente tutti i costi di postazione, staff di supporto e lavorazioni esterne.
        `;
        document.getElementById('fiscal-explanation').innerHTML = explanationText;
    }

    // Aggiorna l'indicazione dei balzelli territoriali orari
    const localBurdenRateEl = document.getElementById('local-burden-rate');
    if (localBurdenRateEl) {
        localBurdenRateEl.innerText = `+ ${currFmt.format(localBurdenHourly)} / ora ${detectedVertical === 'dental' ? 'sedia' : 'postazione'}`;
    }

    updateSimulation();
}

function recalculateConsolidatedChairRate() {
    let primaryLocationRate = 0;
    const locations = currentData.environments || [];
    
    // Individua la tariffa dell'ambulatorio clinico principale
    locations.forEach((loc, idx) => {
        const inputEl = document.getElementById(`input-loc-rate-${idx}`);
        const rate = inputEl ? parseFloat(inputEl.value) : (loc.estimated_internal_cost_rate || 0);
        
        const name = (loc.loc_name || "").toLowerCase();
        if (name.includes("studio") || name.includes("ambulatorio") || name.includes("clinico")) {
            primaryLocationRate = rate;
        }
    });
    
    // Fallback sulla prima area se nessun nome corrisponde
    if (primaryLocationRate === 0 && locations.length > 0) {
        const firstInput = document.getElementById('input-loc-rate-0');
        primaryLocationRate = firstInput ? parseFloat(firstInput.value) : (locations[0].estimated_internal_cost_rate || 0);
    }

    // Somma la quota oraria di ammortamento dei dispositivi sedia fisici
    let totalAssetsRate = 0;
    const assets = currentData.assets || [];
    assets.forEach((ast, idx) => {
        const inputEl = document.getElementById(`input-ast-cost-${idx}`);
        const rate = inputEl ? parseFloat(inputEl.value) : (ast.estimated_internal_cost || 0);
        
        const name = (ast.asset_name || "").toLowerCase();
        if (name.includes("riunito") || name.includes("autoclave") || name.includes("compressore") || name.includes("aspirazione") || name.includes("depurazione") || name.includes("poltrona")) {
            totalAssetsRate += rate;
        }
    });

    const consolidatedRate = primaryLocationRate + totalAssetsRate;
    if (consolidatedRate > 0) {
        document.getElementById('in-poltrona').value = consolidatedRate.toFixed(2);
    }
}

function updateBOMFromInputs() {
    let totalMedico = 0;
    let totalASO = 0;
    let totalConsumables = 0;
    let totalChairTime = 0;

    const rates = currentData.operating_benchmarks?.operators_hourly_rates || {};
    const defaultRates = {
        "Medico_Chirurgo_Odontoiatra": 62.4,
        "Assistente_ASO": 16.9,
        "Segretaria_Amministrativa": 14.95
    };

    const steps = currentData.bill_of_materials?.bom_steps || [];
    steps.forEach((sub, idx) => {
        let stepSum = 0;
        let calculatedStaffCost = 0;

        // 1. Ricalcola le durate e i costi del personale partendo dai singoli step operativi
        (sub.stages || []).forEach((stg, stageIdx) => {
            (stg.steps || []).forEach((step, stepIdx) => {
                const el = document.getElementById(`input-bom-step-time-${idx}-${stageIdx}-${stepIdx}`);
                if (el) {
                    const stepTime = parseFloat(el.value) || 0;
                    step.estimated_time_minutes = stepTime;
                    stepSum += stepTime;

                    // Calcolo del costo del personale dello step in base alle tariffe orarie
                    const skills = step.required_skills || [];
                    skills.forEach(skill => {
                        const rate = parseFloat(rates[skill]) || parseFloat(defaultRates[skill]) || 
                                     (skill.toLowerCase().includes("medico") || skill.toLowerCase().includes("odontoiatra") ? 62.4 : 16.9);
                        calculatedStaffCost += (rate / 60) * stepTime;
                    });
                }
            });
        });

        // Aggiorna l'input di durata totale del sottoprocesso
        const timeInput = document.getElementById(`input-bom-time-${idx}`);
        if (timeInput) {
            timeInput.value = stepSum;
            sub.estimated_total_time_minutes = stepSum;
        }

        // Se sono stati modificati i singoli step, adegua dinamicamente l'input del costo operatore della fase
        const staffInput = document.getElementById(`input-bom-staff-${idx}`);
        if (staffInput && stepSum > 0) {
            staffInput.value = calculatedStaffCost.toFixed(2);
        }

        // Lettura delle altre componenti economiche della fase
        const consumables = parseFloat(document.getElementById(`input-bom-consumables-${idx}`).value) || 0;
        const depr = parseFloat(document.getElementById(`input-bom-depr-${idx}`).value) || 0;
        const staff = parseFloat(document.getElementById(`input-bom-staff-${idx}`).value) || 0;
        const time = parseFloat(document.getElementById(`input-bom-time-${idx}`).value) || 0;
        const chairTime = parseFloat(document.getElementById(`input-bom-chair-time-${idx}`).value) || 0;

        if (!sub.calculation_breakdown) sub.calculation_breakdown = {};
        sub.calculation_breakdown.consumables = consumables;
        sub.calculation_breakdown.depreciation = depr;
        sub.calculation_breakdown.staff_cost = staff;
        sub.calculation_breakdown.chair_time_mins = chairTime;
        sub.estimated_total_time_minutes = time;

        const singleCost = consumables + depr + staff;
        sub.estimated_internal_cost = singleCost;
        
        const labelCostEl = document.getElementById(`label-bom-cost-${idx}`);
        if (labelCostEl) {
            labelCostEl.innerText = `€ ${singleCost.toFixed(2)}`;
        }

        // Calcolo della ripartizione medico / staff di supporto
        const split = calculateSubprocessStaffCosts(sub);
        totalMedico += split.medico;
        totalASO += split.aso;

        totalConsumables += consumables;
        totalChairTime += chairTime; 
    });

    // Se non sono presenti sottoprocessi, verifica se esistono contributi dai meta-operatori
    if (totalASO === 0) {
        const metaList = currentData.market_and_fiscal_intelligence?.meta_operators_overhead || currentData.qualitative_parser_output?.meta_operators_overhead || [];
        metaList.forEach(op => {
            const role = (op.role || "").toLowerCase();
            if (!role.includes("medico") && !role.includes("odontoiatra")) {
                totalASO += op.allocated_cost || 0;
            }
        });
    }

    // 2. Propaga i nuovi valori aggregati agli input della sidebar
    document.getElementById('in-compenso').value = totalMedico.toFixed(2);
    const currentTariffa = parseFloat(document.getElementById('in-tariffa').value) || 0;
    document.getElementById('in-compenso-pct').value = currentTariffa > 0 ? ((totalMedico / currentTariffa) * 100).toFixed(2) : 0;
    document.getElementById('in-costo-aso').value = totalASO.toFixed(2);
    document.getElementById('in-tempo').value = totalChairTime;

    recalculateAll();
    checkDirty();
}

function updateSuppliersFromInputs() {
    const suppliersList = currentData.market_and_fiscal_intelligence?.suppliers || currentData.suppliers_output?.suppliers || currentData.suppliers || [];
    
    // Check if flat format
    if (suppliersList.length > 0 && !suppliersList[0].required_material) {
        updateFlatSuppliersFromInputs();
        return;
    }

    let totalSuppliersCost = 0;
    let totalLabCost = 0;

    suppliersList.forEach((mat, matIdx) => {
        const selectedName = selectedSuppliers[mat.required_material];
        (mat.providers || []).forEach((prov, provIdx) => {
            const el = document.getElementById(`input-supplier-cost-${matIdx}-${provIdx}`);
            if (el) {
                prov.cost = parseFloat(el.value) || 0;
            }
            if (prov.supp_name === selectedName) {
                if (mat.required_material.toLowerCase().includes("laboratorio")) {
                    totalLabCost += prov.cost;
                } else {
                    totalSuppliersCost += prov.cost;
                }
            }
        });
    });

    const bomConsumables = (currentData.bill_of_materials?.bom_steps || []).reduce((acc, curr) => acc + (curr.calculation_breakdown?.consumables || 0), 0);
    
    document.getElementById('in-materiali').value = (bomConsumables + totalSuppliersCost).toFixed(2);
    document.getElementById('in-lab').value = totalLabCost.toFixed(2);

    recalculateAll();
    checkDirty();
}

function updateFlatSuppliersFromInputs() {
    const suppliersList = currentData.market_and_fiscal_intelligence?.suppliers || currentData.suppliers_output?.suppliers || currentData.suppliers || [];
    let totalSuppliersCost = 0;
    suppliersList.forEach((s, idx) => {
        const el = document.getElementById(`input-supplier-flat-cost-${idx}`);
        if (el) {
            const val = parseFloat(el.value) || 0;
            if (s.cost_of_goods !== undefined) s.cost_of_goods = val;
            else s.cost = val;
            totalSuppliersCost += val;
        }
    });
    
    const bomConsumables = (currentData.bill_of_materials?.bom_steps || []).reduce((acc, curr) => acc + (curr.calculation_breakdown?.consumables || 0), 0);
    document.getElementById('in-materiali').value = (bomConsumables + totalSuppliersCost).toFixed(2);
    
    recalculateAll();
    checkDirty();
}

function updateLocationsFromInputs() {
    const locations = currentData.environments || [];
    locations.forEach((loc, idx) => {
        const rate = parseFloat(document.getElementById(`input-loc-rate-${idx}`).value) || 0;
        const time = parseFloat(document.getElementById(`input-loc-time-${idx}`).value) || 0;

        loc.estimated_internal_cost_rate = rate;
        loc.estimated_internal_cost = (rate / 60) * time;
        document.getElementById(`label-loc-cost-${idx}`).innerText = `€ ${loc.estimated_internal_cost.toFixed(2)}`;
    });

    // Ricalcola dinamicamente la tariffa oraria consolidata sedia
    recalculateConsolidatedChairRate();

    recalculateAll();
    checkDirty();
}

function updateAssetsFromInputs() {
    const assets = currentData.assets || [];
    assets.forEach((ast, idx) => {
        const el = document.getElementById(`input-ast-cost-${idx}`);
        if (el) {
            ast.estimated_internal_cost = parseFloat(el.value) || 0;
        }
        document.getElementById(`label-ast-cost-${idx}`).innerText = `€ ${ast.estimated_internal_cost.toFixed(2)} /h`;
    });

    // Ricalcola dinamicamente la tariffa oraria consolidata sedia
    recalculateConsolidatedChairRate();

    recalculateAll();
    checkDirty();
}

function updateMetaFromInputs() {
    const metaList = currentData.market_and_fiscal_intelligence?.meta_operators_overhead || currentData.qualitative_parser_output?.meta_operators_overhead || [];
    metaList.forEach((op, idx) => {
        const el = document.getElementById(`input-meta-cost-${idx}`);
        if (el) {
            op.allocated_cost = parseFloat(el.value) || 0;
        }
        document.getElementById(`label-meta-cost-${idx}`).innerText = `€ ${op.allocated_cost.toFixed(2)}`;
    });

    // If BOM has no steps/subprocesses or ASO cost is 0, we can update in-costo-aso from metaList
    const steps = currentData.bill_of_materials?.bom_steps || [];
    if (steps.length === 0) {
        let fallbackASO = 0;
        metaList.forEach(op => {
            const role = (op.role || "").toLowerCase();
            if (!role.includes("medico") && !role.includes("odontoiatra")) {
                fallbackASO += op.allocated_cost || 0;
            }
        });
        document.getElementById('in-costo-aso').value = fallbackASO.toFixed(2);
    }

    recalculateAll();
    checkDirty();
}

function updateSimulation() {
    const volume = parseInt(document.getElementById('volume-slider').value);
    document.getElementById('slider-val').innerText = volume;

    document.getElementById('sim-fatturato').innerText = currFmt.format(volume * unit_tariffa);
    document.getElementById('sim-margine').innerText = currFmt.format(volume * unit_mdc);
    document.getElementById('sim-costi').innerText = currFmt.format(volume * unit_costofisso);
    
    const totUtile = volume * unit_utile;
    const valUtile = document.getElementById('sim-utile');
    valUtile.innerText = currFmt.format(totUtile);

    const cardUtile = document.getElementById('sim-utile-card');
    const labelUtile = document.getElementById('sim-utile-label');
    if(totUtile < 0) {
        cardUtile.className = 'bg-red-50 border border-red-200 p-3 rounded-2xl';
        labelUtile.className = 'block text-[8px] font-black text-red-500 uppercase tracking-widest mb-1';
        valUtile.className = 'text-base font-black text-red-700';
    } else {
        cardUtile.className = 'bg-green-50 border border-green-200 p-3 rounded-2xl';
        labelUtile.className = 'block text-[8px] font-black text-green-600 uppercase tracking-widest mb-1';
        valUtile.className = 'text-base font-black text-green-700';
    }
}

function updateBalanceSheetFromInputs() {
    const ob = currentData.operating_benchmarks || {};
    const raccordo = ob.balance_sheet_raccordo || {};
    
    // 1. Cattura i totali originari per poter calcolare i rapporti di variazione
    const originalFacilityTot = (raccordo.costi_gestione_stanza_IIC139 || 0) + (raccordo.canone_figurativo_immobile_IIC012 || 0);
    const originalEquipmentTot = (raccordo.canoni_leasing_annui_IIC133 || 0) + (raccordo.ammortamenti_materiali_annui_IIC138 || 0);

    // 2. Legge i nuovi valori inseriti dall'utente e li salva in memoria
    for (let key in raccordo) {
        const inputEl = document.getElementById(`input-raccordo-${key}`);
        if (inputEl) {
            raccordo[key] = parseFloat(inputEl.value) || 0;
        }
    }

    // 3. Calcola i nuovi totali di bilancio modificati
    const newFacilityTot = (raccordo.costi_gestione_stanza_IIC139 || 0) + (raccordo.canone_figurativo_immobile_IIC012 || 0);
    const newEquipmentTot = (raccordo.canoni_leasing_annui_IIC133 || 0) + (raccordo.ammortamenti_materiali_annui_IIC138 || 0);

    // 4. Ricalibra proporzionalmente i costi orari degli ambienti in base ai nuovi costi di gestione stanza/mura
    if (originalFacilityTot > 0) {
        const facilityRatio = newFacilityTot / originalFacilityTot;
        const locations = currentData.environments || [];
        locations.forEach((loc, idx) => {
            const inputEl = document.getElementById(`input-loc-rate-${idx}`);
            if (inputEl) {
                const originalRate = loc.estimated_internal_cost_rate || 0;
                const newRate = originalRate * facilityRatio;
                inputEl.value = newRate.toFixed(2);
                
                loc.estimated_internal_cost_rate = newRate;
                const time = parseFloat(document.getElementById(`input-loc-time-${idx}`).value) || 0;
                loc.estimated_internal_cost = (newRate / 60) * time;
                document.getElementById(`label-loc-cost-${idx}`).innerText = `€ ${loc.estimated_internal_cost.toFixed(2)}`;
            }
        });
    }

    // 5. Ricalibra proporzionalmente gli ammortamenti orari degli asset in base ai nuovi leasing/ammortamenti
    if (originalEquipmentTot > 0) {
        const equipmentRatio = newEquipmentTot / originalEquipmentTot;
        const assets = currentData.assets || [];
        assets.forEach((ast, idx) => {
            const inputEl = document.getElementById(`input-ast-cost-${idx}`);
            if (inputEl) {
                const originalRate = ast.estimated_internal_cost || 0;
                const newRate = originalRate * equipmentRatio;
                inputEl.value = newRate.toFixed(2);
                
                ast.estimated_internal_cost = newRate;
                document.getElementById(`label-ast-cost-${idx}`).innerText = `€ ${newRate.toFixed(2)} /h`;
            }
        });
    }

    // 6. Ricalcola la tariffa oraria consolidata sedia risultante
    recalculateConsolidatedChairRate();

    // 7. Aggiorna l'input dei Costi Fissi Strutturali Annui nella barra laterale
    const newTotalOverhead = (raccordo.canoni_leasing_annui_IIC133 || 0) + 
                             (raccordo.ammortamenti_materiali_annui_IIC138 || 0) + 
                             (raccordo.canone_figurativo_immobile_IIC012 || 0) + 
                             (raccordo.costi_gestione_stanza_IIC139 || 0);
    
    document.getElementById('in-fissi-annui').value = newTotalOverhead.toFixed(2);

    // 8. Esegue il ricalcolo generale dei margini, BEP e tasse
    recalculateAll();
    checkDirty();
}

function getPayloadToSave() {
    if (!currentData) return null;

    // 1. Sidebar values
    const tariffa = parseFloat(document.getElementById('in-tariffa').value) || 0;
    const compenso = parseFloat(document.getElementById('in-compenso').value) || 0;
    const costoAso = parseFloat(document.getElementById('in-costo-aso').value) || 0;
    const materiali = parseFloat(document.getElementById('in-materiali').value) || 0;
    const lab = parseFloat(document.getElementById('in-lab').value) || 0;
    const tempo = parseFloat(document.getElementById('in-tempo').value) || 0;
    const poltrona = parseFloat(document.getElementById('in-poltrona').value) || 0;
    const tasse = parseFloat(document.getElementById('in-tasse').value) || 0;
    
    const enpamEl = document.getElementById('select-enpam-rate');
    const enpam = enpamEl ? parseFloat(enpamEl.value) : 0;
    
    const fissiAnnui = parseFloat(document.getElementById('in-fissi-annui').value) || 0;

    // Update financial simulations summary
    if (!currentData.financial_simulations) currentData.financial_simulations = {};
    
    if (!currentData.financial_simulations.pricing_summary) {
        currentData.financial_simulations.pricing_summary = {};
    }
    currentData.financial_simulations.pricing_summary.catalog_price = tariffa;

    if (!currentData.financial_simulations.cost_breakdown_unit) {
        currentData.financial_simulations.cost_breakdown_unit = {};
    }
    currentData.financial_simulations.cost_breakdown_unit.medical_collaborator_fee = compenso;
    currentData.financial_simulations.cost_breakdown_unit.aso_fee = costoAso;
    currentData.financial_simulations.cost_breakdown_unit.direct_materials_cost = materiali;
    currentData.financial_simulations.cost_breakdown_unit.dental_lab_cost = lab;
    
    const detectedVertical = (currentData.vertical || 'generic').toLowerCase();
    const localBurdenHourly = parseFloat(currentData.market_and_fiscal_intelligence?.fiscal_analysis?.local_compliance_overhead_hourly) || 0.00;
    const costOfPostazioneFixed = ((poltrona + localBurdenHourly) / 60) * tempo;
    
    currentData.financial_simulations.cost_breakdown_unit.chair_time_cost_fixed = costOfPostazioneFixed;
    currentData.financial_simulations.cost_breakdown_unit.total_direct_variable_costs_unit = compenso + costoAso + materiali + lab;
    currentData.financial_simulations.cost_breakdown_unit.contribution_margin_unit = tariffa - (compenso + costoAso + materiali + lab);
    currentData.financial_simulations.cost_breakdown_unit.total_operating_clinical_cost_unit = (compenso + costoAso + materiali + lab) + costOfPostazioneFixed;
    
    const operatingIncome = tariffa - ((compenso + costoAso + materiali + lab) + costOfPostazioneFixed);
    currentData.financial_simulations.cost_breakdown_unit.operating_income_unit = operatingIncome;

    if (!currentData.financial_simulations.fiscal_and_previdential_impact) {
        currentData.financial_simulations.fiscal_and_previdential_impact = {};
    }
    currentData.financial_simulations.fiscal_and_previdential_impact.enpam_previdential_rate = enpam / 100;
    currentData.financial_simulations.fiscal_and_previdential_impact.estimated_tax_burden_ratio_on_revenue = tasse / 100;
    
    let taxesVal = 0;
    if (detectedVertical === 'dental') {
        taxesVal = tariffa * ((tasse + enpam) / 100);
    } else {
        taxesVal = operatingIncome > 0 ? (operatingIncome * (tasse / 100)) : 0;
    }
    currentData.financial_simulations.fiscal_and_previdential_impact.estimated_tax_and_previdential_burden_value = taxesVal;

    if (!currentData.financial_simulations.predictive_volume_simulation) {
        currentData.financial_simulations.predictive_volume_simulation = {};
    }
    if (!currentData.financial_simulations.predictive_volume_simulation.break_even_point_metrics) {
        currentData.financial_simulations.predictive_volume_simulation.break_even_point_metrics = {};
    }
    const bepAllocation = parseFloat(document.getElementById('select-bep-allocation').value) || 1.00;
    currentData.financial_simulations.predictive_volume_simulation.break_even_point_metrics.allocated_overhead_value = fissiAnnui * bepAllocation;
    currentData.financial_simulations.predictive_volume_simulation.break_even_point_metrics.allocated_budget_percentage = bepAllocation;

    // Update operating benchmarks
    if (!currentData.operating_benchmarks) currentData.operating_benchmarks = {};
    currentData.operating_benchmarks.chair_hourly_rate_consolidated = poltrona;

    // 2. Tab: BOM
    const steps = currentData.bill_of_materials?.bom_steps || [];
    if (Array.isArray(steps)) {
        steps.forEach((sub, idx) => {
            (sub.stages || []).forEach((stg, stageIdx) => {
                (stg.steps || []).forEach((step, stepIdx) => {
                    const el = document.getElementById(`input-bom-step-time-${idx}-${stageIdx}-${stepIdx}`);
                    if (el) {
                        step.estimated_time_minutes = parseFloat(el.value) || 0;
                    }
                });
            });

            const consumables = parseFloat(document.getElementById(`input-bom-consumables-${idx}`).value) || 0;
            const depr = parseFloat(document.getElementById(`input-bom-depr-${idx}`).value) || 0;
            const staff = parseFloat(document.getElementById(`input-bom-staff-${idx}`).value) || 0;
            const time = parseFloat(document.getElementById(`input-bom-time-${idx}`).value) || 0;
            const chairTime = parseFloat(document.getElementById(`input-bom-chair-time-${idx}`).value) || 0;

            if (!sub.calculation_breakdown) sub.calculation_breakdown = {};
            sub.calculation_breakdown.consumables = consumables;
            sub.calculation_breakdown.depreciation = depr;
            sub.calculation_breakdown.staff_cost = staff;
            sub.calculation_breakdown.chair_time_mins = chairTime;
            sub.estimated_total_time_minutes = time;
            sub.estimated_internal_cost = consumables + depr + staff;
        });
    }

    // 3. Tab: Suppliers
    const suppliersList = currentData.market_and_fiscal_intelligence?.suppliers || currentData.suppliers_output?.suppliers || currentData.suppliers || [];
    if (Array.isArray(suppliersList) && suppliersList.length > 0) {
        if (!suppliersList[0].required_material) {
            suppliersList.forEach((s, idx) => {
                const el = document.getElementById(`input-supplier-flat-cost-${idx}`);
                if (el) {
                    const val = parseFloat(el.value) || 0;
                    if (s.cost_of_goods !== undefined) s.cost_of_goods = val;
                    else s.cost = val;
                }
            });
        } else {
            suppliersList.forEach((mat, matIdx) => {
                (mat.providers || []).forEach((prov, provIdx) => {
                    const el = document.getElementById(`input-supplier-cost-${matIdx}-${provIdx}`);
                    if (el) {
                        prov.cost = parseFloat(el.value) || 0;
                    }
                });
            });
        }
    }

    // 4. Tab: Locations
    const locations = currentData.environments || [];
    if (Array.isArray(locations)) {
        locations.forEach((loc, idx) => {
            const rateEl = document.getElementById(`input-loc-rate-${idx}`);
            const timeEl = document.getElementById(`input-loc-time-${idx}`);
            if (rateEl && timeEl) {
                const rate = parseFloat(rateEl.value) || 0;
                const time = parseFloat(timeEl.value) || 0;
                loc.estimated_internal_cost_rate = rate;
                loc.estimated_internal_cost = (rate / 60) * time;
            }
        });
    }

    // 5. Tab: Assets
    const assets = currentData.assets || [];
    if (Array.isArray(assets)) {
        assets.forEach((ast, idx) => {
            const el = document.getElementById(`input-ast-cost-${idx}`);
            if (el) {
                ast.estimated_internal_cost = parseFloat(el.value) || 0;
            }
        });
    }

    // 6. Tab: Meta Operators
    const metaList = currentData.market_and_fiscal_intelligence?.meta_operators_overhead || currentData.qualitative_parser_output?.meta_operators_overhead || [];
    if (Array.isArray(metaList)) {
        metaList.forEach((op, idx) => {
            const el = document.getElementById(`input-meta-cost-${idx}`);
            if (el) {
                op.allocated_cost = parseFloat(el.value) || 0;
            }
        });
    }

    // 7. Fiscal Analysis regime/tax
    if (currentData.market_and_fiscal_intelligence && currentData.market_and_fiscal_intelligence.fiscal_analysis) {
        currentData.market_and_fiscal_intelligence.fiscal_analysis.income_tax_rate = tasse / 100;
        currentData.market_and_fiscal_intelligence.fiscal_analysis.social_security_rate = enpam / 100;
        currentData.market_and_fiscal_intelligence.fiscal_analysis.total_estimated_tax_burden_ratio = (tasse + enpam) / 100;
    }

    return currentData;
}

function isDirty() {
    if (!currentData) return false;
    try {
        return JSON.stringify(getPayloadToSave()) !== originalDataStr;
    } catch (e) {
        console.error("Error in isDirty:", e);
        return false;
    }
}

function checkDirty() {
    const dirty = isDirty();
    const saveBtn = document.getElementById('save-btn');
    const aiBtn = document.getElementById('ai-recalc-btn');
    
    // Gestione Bottone Salva
    if (saveBtn) {
        saveBtn.disabled = !dirty;
        if (dirty) saveBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        else saveBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Gestione Bottone IA (Si accende quando i dati sono stati modificati)
    if (aiBtn) {
        aiBtn.disabled = !dirty;
        if (dirty) {
            aiBtn.className = "w-full py-2.5 mb-3 bg-black text-white hover:opacity-90 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer shadow-md";
        } else {
            aiBtn.className = "w-full py-2.5 mb-3 bg-zinc-100 text-zinc-400 border border-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 cursor-not-allowed";
        }
    }
}
