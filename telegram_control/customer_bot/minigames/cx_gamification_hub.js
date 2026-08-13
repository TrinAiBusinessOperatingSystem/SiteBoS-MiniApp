/**
 * cx_gamification_hub.js — Customer Gamification Master Orchestrator
 * Gestione Micro-Economia Punti, Wi-Fi Gate, Modali Premio Coriandoli (100/250/500pt), Lazy Loading e Loop Pause.
 */

const CxGamificationHub = (() => {
    'use strict';

    const INITIAL_WELCOME_POINTS = 20;
    const loadedScripts = new Set();

    let state = {
        totalEarned: 0,
        totalSpent: 0,
        netBalance: INITIAL_WELCOME_POINTS,
        welcomeSpentImmediately: false,
        gamesPlayed: [],
        prizesAwarded: [],
        activeGame: null,
        cxProfile: {
            perfectionism_score: 0.5,
            financial_risk_tolerance: 'MEDIUM',
            visual_target_sku: 'Sanificazione Idroterapica',
            decision_speed: 0.5
        },
        economyProfile: {
            avg_bet_size: 0,
            preferred_upgrade: 'none',
            gambler_index: 0
        }
    };

    const IRONIC_SUBTITLES = [
        "Stai diventando irresistibile.",
        "Continuare a giocare è quasi illegale.",
        "Chi ferma uno come te?",
        "Un talento naturale nel collezionare vantaggi.",
        "Il desk stenderà il tappeto rosso."
    ];

    const GAME_SCRIPTS = {
        sphere: ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'minigames/cx_dna_sphere.js'],
        spin_win: ['minigames/cx_spin_win.js'],
        quiz: ['minigames/cx_quiz_softskills.js'],
        doom: ['minigames/cx_doom_arena.js'],
        gta: ['minigames/cx_gta_sandbox.js'],
        blackjack: ['minigames/cx_blackjack.js'],
        precision_tower: ['minigames/cx_precision_tower.js'],
        tamagotchi: ['minigames/cx_tamagotchi.js'],
        memory: ['minigames/cx_memory_match.js']
    };

    /**
     * Helper per Lazy Loading dinamico degli script (0ms initial payload)
     */
    function loadScript(url) {
        if (loadedScripts.has(url)) return Promise.resolve();
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = () => {
                loadedScripts.add(url);
                resolve();
            };
            script.onerror = (err) => reject(err);
            document.head.appendChild(script);
        });
    }

    async function loadGameScripts(gameId) {
        const urls = GAME_SCRIPTS[gameId] || [];
        for (const url of urls) {
            await loadScript(url);
        }
    }

    function initHub() {
        loadLocalState();
        checkWifiGuestGate();
        setInterval(checkWifiGuestGate, 300000); // Check gate every 5m
    }

    async function openHubModal(containerId = 'cx-dna-sphere-container') {
        try {
            await loadGameScripts('sphere');
            if (window.CxDnaSphere) {
                window.CxDnaSphere.initSphere(containerId);
            }
        } catch (e) {
            console.error('[CxGamificationHub] Errore caricamento pigro Sfera DNA:', e);
        }
    }

    async function launchGame(gameId, canvasOrContainerId, param) {
        try {
            // 1. Sospendi animazione 3D Sfera per evitare surriscaldamento ed FPS drops
            if (window.CxDnaSphere && typeof window.CxDnaSphere.pauseAnimation === 'function') {
                window.CxDnaSphere.pauseAnimation();
            }

            // 2. Caricamento Pigro dello script di gioco
            await loadGameScripts(gameId);
            state.activeGame = gameId;

            // 3. Inizializza il gioco specifico
            if (gameId === 'doom' && window.CxDoomArena) {
                window.CxDoomArena.initGame(canvasOrContainerId, param || 1);
            } else if (gameId === 'gta' && window.CxGtaSandbox) {
                window.CxGtaSandbox.initGame(canvasOrContainerId, param || 1);
            } else if (gameId === 'blackjack' && window.CxBlackjack) {
                window.CxBlackjack.startHand(param || 10);
            } else if (gameId === 'spin_win' && window.CxSpinWin) {
                window.CxSpinWin.spin(canvasOrContainerId, param || 10);
            } else if (gameId === 'precision_tower' && window.CxPrecisionTower) {
                window.CxPrecisionTower.initGame(canvasOrContainerId);
            } else if (gameId === 'tamagotchi' && window.CxTamagotchi) {
                window.CxTamagotchi.initPet(canvasOrContainerId);
            } else if (gameId === 'memory' && window.CxMemoryMatch) {
                window.CxMemoryMatch.initGame(canvasOrContainerId);
            } else if (gameId === 'quiz' && window.CxQuizEngine) {
                window.CxQuizEngine.startSet(param || 0);
            }
        } catch (e) {
            console.error(`[CxGamificationHub] Errore avvio gioco ${gameId}:`, e);
        }
    }

    function closeActiveGame() {
        if (state.activeGame === 'doom' && window.CxDoomArena) {
            window.CxDoomArena.stopGame();
        } else if (state.activeGame === 'gta' && window.CxGtaSandbox) {
            window.CxGtaSandbox.stopGame();
        } else if (state.activeGame === 'precision_tower' && window.CxPrecisionTower) {
            window.CxPrecisionTower.stopGame();
        }

        state.activeGame = null;

        // Riattiva animazione Sfera 3D al ritorno all'Hub principale
        if (window.CxDnaSphere && typeof window.CxDnaSphere.resumeAnimation === 'function') {
            window.CxDnaSphere.resumeAnimation();
        }
    }

    function loadLocalState() {
        try {
            const raw = localStorage.getItem('sitebos_cx_gamification_hub_state');
            if (raw) {
                state = { ...state, ...JSON.parse(raw) };
            }
        } catch (e) {}
    }

    function saveLocalState() {
        try {
            localStorage.setItem('sitebos_cx_gamification_hub_state', JSON.stringify(state));
        } catch (e) {}
    }

    function checkWifiGuestGate() {
        const proximity = window.PhygitalLocalFirst ? window.PhygitalLocalFirst.loadDraft() : null;
        const isWifiGuest = proximity ? !!proximity.proximity_validated : true;

        const gateBanner = document.getElementById('cx-wifi-gate-banner');
        if (!isWifiGuest && gateBanner) {
            gateBanner.classList.remove('hidden');
        } else if (gateBanner) {
            gateBanner.classList.add('hidden');
        }
        return isWifiGuest;
    }

    function canSpend(cost) {
        return state.netBalance >= cost;
    }

    function spendPoints(cost, reason) {
        if (!canSpend(cost)) return false;
        state.totalSpent += cost;
        state.netBalance -= cost;

        if (state.totalSpent === cost && state.totalEarned === 0) {
            state.welcomeSpentImmediately = true;
        }

        saveLocalState();
        updateHubUI();
        return true;
    }

    function addPoints(pts, reason) {
        state.totalEarned += pts;
        state.netBalance += pts;

        state.gamesPlayed.push({ game: reason, points: pts, time: new Date().toISOString() });

        saveLocalState();
        updateHubUI();
        checkMilestones();
    }

    function recordQuizCompletion(quizId, pts, scores) {
        addPoints(pts, quizId);
        state.cxProfile = { ...state.cxProfile, ...scores };

        if (window.PhygitalLocalFirst) {
            window.PhygitalLocalFirst.submitCxProfile(state.cxProfile, state.economyProfile, state.gamesPlayed, state.prizesAwarded);
        }
    }

    function checkMilestones() {
        const net = state.netBalance;

        if (net >= 100 && !hasAwarded(5)) {
            triggerPrizeModal(5, 100);
        } else if (net >= 250 && !hasAwarded(10)) {
            triggerPrizeModal(10, 250);
        } else if (net >= 500 && !hasAwarded(15)) {
            triggerPrizeModal(15, 500);
        }
    }

    function hasAwarded(percent) {
        return state.prizesAwarded.some(p => p.percent === percent);
    }

    function triggerPrizeModal(percent, milestonePts) {
        const rewardId = `DNA${percent}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        state.prizesAwarded.push({
            percent,
            milestonePts,
            coupon_code: rewardId,
            awardedAt: new Date().toISOString()
        });
        saveLocalState();

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        showConfettiOverlay(percent, rewardId);
    }

    function showConfettiOverlay(percent, rewardId) {
        const modal = document.createElement('div');
        modal.id = 'cx-prize-modal-overlay';
        modal.className = 'fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[99999] flex flex-col items-center justify-center p-6 text-center text-white animate-fade-in';

        const randomSub = IRONIC_SUBTITLES[Math.floor(Math.random() * IRONIC_SUBTITLES.length)];

        modal.innerHTML = `
            <canvas id="confetti-canvas" class="absolute inset-0 pointer-events-none w-full h-full"></canvas>
            <div class="relative z-10 max-w-sm bg-slate-900/90 border border-amber-500/60 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 flex flex-col items-center">
                <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-3xl mb-3 animate-bounce">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3 class="font-black text-2xl bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent uppercase tracking-tight mb-1">
                    🎉 Hai Vinto! Buono -${percent}%
                </h3>
                <p class="text-xs text-amber-200/90 font-medium italic mb-4">"${randomSub}"</p>
                <p class="text-xs text-slate-300 mb-5 leading-relaxed">
                    Hai sbloccato un <strong>Buono Sconto del ${percent}%</strong>! Scegli l'Addon che desideri arricchire sulla tua scheda ordine per applicare subito lo sconto.
                </p>
                <button onclick="document.getElementById('cx-prize-modal-overlay').remove(); CxGamificationHub.openVoucherRedemptionModal(${percent}, '${rewardId}')" class="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest active:scale-95 transition shadow-lg shadow-amber-500/30">
                    Scegli l'Addon Scontato (-${percent}%) <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        `;
        document.body.appendChild(modal);

        runConfettiAnimation('confetti-canvas');
    }

    /**
     * Apre il modale di selezione dell'Addon da applicare all'ordine con il Buono Sconto
     */
    function openVoucherRedemptionModal(discountPct, rewardId) {
        const existing = document.getElementById('cx-voucher-redemption-modal');
        if (existing) existing.remove();

        const catalogAddons = window.SITEBOS_CATALOG_ADDONS || [
            { id: 'ADDON_SANIF', name: 'Sanificazione Idroterapica Premium', price: 50, icon: 'fa-spray-can', desc: 'Trattamento igienizzante profondo ad alta pressione.' },
            { id: 'ADDON_CHECKUP', name: 'Checkup Tecnico & Misurazione Avanzata', price: 40, icon: 'fa-microchip', desc: 'Diagnostica digitale completa con report dettagliato.' },
            { id: 'ADDON_PROTECT', name: 'Trattamento Protettivo Nanotecnologico', price: 60, icon: 'fa-shield-halved', desc: 'Protezione idrorepellente di lunga durata.' },
            { id: 'ADDON_MAINT', name: 'Manutenzione Guidata HV', price: 45, icon: 'fa-tools', desc: 'Check ed allineamento componenti ad alta efficienza.' }
        ];

        const overlay = document.createElement('div');
        overlay.id = 'cx-voucher-redemption-modal';
        overlay.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex flex-col justify-end md:justify-center items-center p-4 animate-fade-in';

        let itemsHtml = '';
        catalogAddons.forEach(item => {
            const discountedPrice = Math.round(item.price * (1 - discountPct / 100));
            itemsHtml += `
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-blue-400 transition">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 text-lg font-bold">
                            <i class="fas ${item.icon}"></i>
                        </div>
                        <div class="min-w-0">
                            <h4 class="text-xs font-black text-slate-900 uppercase truncate m-0">${item.name}</h4>
                            <p class="text-[10px] text-slate-500 m-0 truncate font-medium">${item.desc}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-slate-400 line-through">€ ${item.price}</span>
                                <span class="text-xs font-black text-emerald-600">€ ${discountedPrice}</span>
                                <span class="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">- ${discountPct}%</span>
                            </div>
                        </div>
                    </div>
                    <button onclick="CxGamificationHub.applyVoucherToAddon('${item.id}', ${discountPct}, '${rewardId}', '${item.name}', ${item.price}, ${discountedPrice})" class="shrink-0 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl transition active:scale-95 shadow-md">
                        Applica
                    </button>
                </div>
            `;
        });

        overlay.innerHTML = `
            <div class="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                            <i class="fas fa-ticket-alt"></i>
                        </div>
                        <div>
                            <h3 class="text-xs font-black uppercase text-slate-900 m-0 tracking-wider">Riscatto Buono Sconto ${discountPct}%</h3>
                            <p class="text-[10px] text-slate-500 m-0 font-medium">Seleziona l'Addon da applicare al tuo ordine</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('cx-voucher-redemption-modal').remove()" class="w-7 h-7 bg-slate-100 text-slate-500 hover:text-black rounded-full flex items-center justify-center text-xs">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="overflow-y-auto space-y-2.5 pr-1 py-1 flex-1">
                    ${itemsHtml}
                </div>

                <div class="pt-3 border-t border-slate-100 mt-3 text-center">
                    <p class="text-[10px] text-slate-400 m-0">L'Addon scontato verrà trasmesso direttamente al tabellone della reception.</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    /**
     * Esegue l'applicazione del Buono all'Addon ed invia la bozza aggiornata a PhygitalLocalFirst
     */
    function applyVoucherToAddon(addonId, discountPct, rewardId, name, originalPrice, discountedPrice) {
        const modal = document.getElementById('cx-voucher-redemption-modal');
        if (modal) modal.remove();

        const addonPayload = {
            addon_id: addonId,
            name: name,
            original_price: originalPrice,
            discounted_price: discountedPrice,
            discount_pct: discountPct,
            reward_id: rewardId,
            appliedAt: new Date().toISOString()
        };

        if (window.PhygitalLocalFirst && typeof window.PhygitalLocalFirst.redeemAddonVoucher === 'function') {
            window.PhygitalLocalFirst.redeemAddonVoucher(addonPayload);
        } else {
            console.log('[CxGamificationHub] Buono Addon riscattato:', addonPayload);
        }

        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        // Toast di conferma
        showConfirmationToast(`🎉 Addon "${name}" inserito in ordine con Sconto del ${discountPct}%! Inviato alla Reception.`);
    }

    function showConfirmationToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl z-[99999] flex items-center gap-2 animate-bounce border border-slate-700';
        toast.innerHTML = `<i class="fas fa-check-circle text-emerald-400 text-base"></i> <span>${msg}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function runConfettiAnimation(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');

        const particles = Array.from({ length: 70 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
            vy: Math.random() * 3 + 2,
            vx: (Math.random() - 0.5) * 2
        }));

        let frame = 0;
        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.y += p.vy;
                p.x += p.vx;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            if (frame++ < 180) requestAnimationFrame(render);
        }
        render();
    }

    function updateHubUI() {
        const netEl = document.getElementById('cx-net-balance-display');
        if (netEl) netEl.innerText = `${state.netBalance} PT`;
    }

    function getState() {
        return state;
    }

    return {
        initHub,
        openHubModal,
        launchGame,
        closeActiveGame,
        canSpend,
        spendPoints,
        addPoints,
        recordQuizCompletion,
        openVoucherRedemptionModal,
        applyVoucherToAddon,
        getState
    };
})();


if (typeof window !== 'undefined') {
    window.CxGamificationHub = CxGamificationHub;
    document.addEventListener('DOMContentLoaded', CxGamificationHub.initHub);
}
