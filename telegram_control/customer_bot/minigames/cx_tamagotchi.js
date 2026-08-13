/**
 * cx_tamagotchi.js — Tamagotchi Express Pet Engine (Cibo 3pt, Accessori 10-20pt, Cura Ricorsiva)
 */

const CxTamagotchi = (() => {
    'use strict';

    let petState = {
        name: 'BoS-Bot',
        happiness: 50,
        hunger: 50,
        accessory: null,
        foodSpend: 0,
        accessorySpend: 0
    };

    function initPet(containerId) {
        petState = { name: 'BoS-Bot', happiness: 50, hunger: 50, accessory: null, foodSpend: 0, accessorySpend: 0 };
        renderPet(containerId);
    }

    function feedPet(containerId) {
        const cost = 3;
        if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(cost)) {
            alert("Punti insufficienti per il cibo! Guadagna punti prima.");
            return;
        }
        if (window.CxGamificationHub) {
            window.CxGamificationHub.spendPoints(cost, 'tamagotchi_food');
        }

        petState.hunger = Math.min(100, petState.hunger + 30);
        petState.happiness = Math.min(100, petState.happiness + 10);
        petState.foodSpend += cost;

        checkHappinessReward();
        renderPet(containerId);
    }

    function buyAccessory(containerId, accessoryName, cost) {
        cost = Number(cost) || 15;
        if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(cost)) {
            alert("Punti insufficienti per questo accessorio!");
            return;
        }
        if (window.CxGamificationHub) {
            window.CxGamificationHub.spendPoints(cost, `tamagotchi_acc_${accessoryName}`);
        }

        petState.accessory = accessoryName;
        petState.happiness = Math.min(100, petState.happiness + 25);
        petState.accessorySpend += cost;

        checkHappinessReward();
        renderPet(containerId);
    }

    function checkHappinessReward() {
        if (petState.happiness >= 90 && window.CxGamificationHub) {
            window.CxGamificationHub.addPoints(10, 'tamagotchi_happy_milestone');
        }
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }

    function renderPet(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let petIcon = '🤖';
        if (petState.accessory === 'cappellino') petIcon = '🎩🤖';
        if (petState.accessory === 'occhiali') petIcon = '🕶️🤖';

        container.innerHTML = `
            <div class="flex flex-col items-center justify-center p-4 bg-slate-900/90 border border-slate-800 rounded-3xl text-center">
                <div class="text-6xl mb-3 animate-bounce">${petIcon}</div>
                <h4 class="font-black text-white text-base mb-1">${petState.name}</h4>
                
                <div class="w-full max-w-xs space-y-2 my-3 text-xs">
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>Cibo</span><span>${petState.hunger}%</span></div>
                        <div class="w-full bg-slate-800 h-2 rounded-full"><div class="bg-amber-500 h-2 rounded-full transition-all" style="width:${petState.hunger}%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>Felicità</span><span>${petState.happiness}%</span></div>
                        <div class="w-full bg-slate-800 h-2 rounded-full"><div class="bg-pink-500 h-2 rounded-full transition-all" style="width:${petState.happiness}%"></div></div>
                    </div>
                </div>

                <div class="flex gap-2 mt-2 w-full justify-center">
                    <button onclick="CxTamagotchi.feedPet('${containerId}')" class="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition">
                        <span>🍔 Nutri (3 pt)</span>
                    </button>
                    <button onclick="CxTamagotchi.buyAccessory('${containerId}', 'cappellino', 15)" class="bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition">
                        <span>🎩 Cappello (15 pt)</span>
                    </button>
                </div>
            </div>
        `;
    }

    function getStats() {
        return {
            happiness: petState.happiness,
            hunger: petState.hunger,
            foodSpend: petState.foodSpend,
            accessorySpend: petState.accessorySpend,
            recurringCareAffinity: Math.min(1.0, (petState.foodSpend / 15))
        };
    }

    return { initPet, feedPet, buyAccessory, getStats };
})();

if (typeof window !== 'undefined') {
    window.CxTamagotchi = CxTamagotchi;
}
