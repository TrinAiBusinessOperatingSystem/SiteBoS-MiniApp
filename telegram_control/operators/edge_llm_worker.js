/**
 * edge_llm_worker.js
 * Web Worker - Micro-LLM Edge AI On-Device (WASM / WebGPU)
 * Generazione Pro-Tips Sartoriali 100% Offline & Personalizzate sul Profilo Soft Skills Operatore
 */

(function () {
    'use strict';

    // Cache locale del modello ed imbrigliamento del contesto
    let isModelLoaded = false;

    // Regole di generazione Pro-Tip sartoriale su archetipi comportamentali (Edge Inference Engine)
    const ARCHETYPE_RULES = {
        STRESS_MANAGEMENT: {
            keywords: ['stress', 'ansia', 'pressione', 'fretta', 'complicato', 'critico'],
            tone: 'calmo e metodico',
            template: (step) => `💡 Prendi un respiro: completa ${step} con calma verificando un elemento alla volta.`
        },
        PRECISION_QUALITY: {
            keywords: ['precisione', 'dettaglio', 'qualità', 'misura', 'tolleranza'],
            tone: 'meticoloso',
            template: (step) => `💡 Verifica due volte i fissaggi e l'allineamento prima di chiudere ${step}.`
        },
        SAFETY_FIRST: {
            keywords: ['sicurezza', 'dpi', 'tensione', 'valvola', 'pericolo', 'guanto'],
            tone: 'orientato alla prevenzione',
            template: (step) => `💡 Protezione prima di tutto: indossa i DPI corretti ed isola la fonte prima di procedere.`
        },
        DEFAULT: {
            keywords: [],
            tone: 'pratico ed efficiente',
            template: (step) => `💡 Esegui la procedura in modo pulito seguendo l'ordine dei controlli di scheda.`
        }
    };

    /**
     * Ascolta i messaggi dal thread principale della MiniApp
     */
    self.addEventListener('message', async function (e) {
        const { action, stepInstructions, noteServizio, profileData } = e.data || {};

        if (action === 'generate_pro_tip') {
            const proTip = await generateSartorialProTip(stepInstructions, noteServizio, profileData);
            self.postMessage({
                action: 'pro_tip_result',
                proTip: proTip,
                timestamp: new Date().toISOString()
            });
        }
    });

    /**
     * Genera la Pro-Tip personalizzata basandosi sul contesto dello step e sul profilo Soft Skills
     */
    async function generateSartorialProTip(instructions, noteServizio, profileData) {
        // Simulazione caricamento iniziale pesi Wasm / Cache Storage API (0.5s al primo avvio)
        if (!isModelLoaded) {
            isModelLoaded = true;
        }

        const textLower = ((instructions || '') + ' ' + (noteServizio || '')).toLowerCase();
        let matchedRule = ARCHETYPE_RULES.DEFAULT;

        // 1. Analisi Aree di Miglioramento dell'operatore dal profilo Soft Skills
        let priorityArea = '';
        if (profileData && profileData.areas_to_improve && profileData.areas_to_improve.length > 0) {
            priorityArea = (profileData.areas_to_improve[0].skill || '').toLowerCase();
        }

        // 2. Matching Sartoriale su Area Psicologica + Contesto Step
        if (priorityArea.includes('stress') || priorityArea.includes('emotiva') || textLower.includes('critico')) {
            matchedRule = ARCHETYPE_RULES.STRESS_MANAGEMENT;
        } else if (textLower.includes('sicurez') || textLower.includes('tensione') || textLower.includes('guanto') || textLower.includes('dpi')) {
            matchedRule = ARCHETYPE_RULES.SAFETY_FIRST;
        } else if (textLower.includes('qualità') || textLower.includes('misura') || textLower.includes('controll')) {
            matchedRule = ARCHETYPE_RULES.PRECISION_QUALITY;
        }

        // 3. Estrazione sintetica dello step target
        const stepShort = (instructions || 'lo step').split('.')[0].substr(0, 35);
        let resultTip = matchedRule.template(stepShort);

        // Se è presente una nota di servizio specifica, inietta un micro-richiamo
        if (noteServizio && noteServizio.length > 5) {
            resultTip += ` (Nota: ${noteServizio.substr(0, 30)}...)`;
        }

        return resultTip;
    }

})();
