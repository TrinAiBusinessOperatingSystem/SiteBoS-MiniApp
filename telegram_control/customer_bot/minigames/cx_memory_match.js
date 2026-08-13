/**
 * cx_memory_match.js — Memory Pairs Match Engine (SKU Catalogo, Attrazione Visiva Target)
 */

const CxMemoryMatch = (() => {
    'use strict';

    const SKU_ITEMS = [
        { id: 'sanificazione_idroterapica', name: 'Sanificazione Idroterapica', icon: 'fa-droplet-degree' },
        { id: 'trattamento_ceramico', name: 'Trattamento Ceramico Pro', icon: 'fa-shield-sparkles' },
        { id: 'sanificazione_ozono', name: 'Sanificazione Ozono Pure', icon: 'fa-wind' },
        { id: 'lucidatura_specchio', name: 'Lucidatura a Specchio', icon: 'fa-wand-magic-sparkles' },
        { id: 'checkup_completo', name: 'Check-Up Completo 360°', icon: 'fa-car-side' },
        { id: 'ricarica_clima_nano', name: 'Ricarica Clima NanoTech', icon: 'fa-snowflake' }
    ];

    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let skuInterests = {};

    function initGame(containerId) {
        matchedPairs = 0;
        flippedCards = [];
        skuInterests = {};

        // Duplicate items to form pairs
        const deckItems = [...SKU_ITEMS, ...SKU_ITEMS];
        deckItems.sort(() => Math.random() - 0.5);

        cards = deckItems.map((item, index) => ({
            index,
            skuId: item.id,
            name: item.name,
            icon: item.icon,
            isFlipped: false,
            isMatched: false
        }));

        renderBoard(containerId);
    }

    function handleCardClick(containerId, cardIndex) {
        const card = cards[cardIndex];
        if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;

        card.isFlipped = true;
        flippedCards.push(card);

        // Track visual interest time
        skuInterests[card.skuId] = (skuInterests[card.skuId] || 0) + 1;

        if (flippedCards.length === 2) {
            const [c1, c2] = flippedCards;
            if (c1.skuId === c2.skuId) {
                // Match!
                c1.isMatched = true;
                c2.isMatched = true;
                matchedPairs++;
                flippedCards = [];

                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }

                if (matchedPairs === SKU_ITEMS.length) {
                    // Full completion reward (+15 pt)
                    if (window.CxGamificationHub) {
                        window.CxGamificationHub.addPoints(15, 'memory_completion');
                    }
                }
                renderBoard(containerId);
            } else {
                // No match, flip back after 800ms
                renderBoard(containerId);
                setTimeout(() => {
                    c1.isFlipped = false;
                    c2.isFlipped = false;
                    flippedCards = [];
                    renderBoard(containerId);
                }, 800);
            }
        } else {
            renderBoard(containerId);
        }
    }

    function renderBoard(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-cols-4 gap-2.5 p-3 bg-slate-900/90 border border-slate-800 rounded-3xl">
                ${cards.map(c => `
                    <button onclick="CxMemoryMatch.handleCardClick('${containerId}', ${c.index})" 
                            class="h-20 rounded-2xl border flex flex-col items-center justify-center text-xs transition-all duration-300 ${
                                c.isFlipped || c.isMatched 
                                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-lg shadow-cyan-950/50' 
                                : 'bg-slate-800/80 border-slate-700 text-slate-500 active:scale-95'
                            }">
                        ${
                            c.isFlipped || c.isMatched 
                            ? `<i class="fas ${c.icon} text-lg mb-1"></i><span class="text-[9px] font-bold text-center leading-tight px-1">${c.name.split(' ')[0]}</span>`
                            : `<i class="fas fa-question text-base"></i>`
                        }
                    </button>
                `).join('')}
            </div>
        `;
    }

    function getStats() {
        let topSku = 'sanificazione_idroterapica';
        let maxViews = 0;
        Object.keys(skuInterests).forEach(sku => {
            if (skuInterests[sku] > maxViews) {
                maxViews = skuInterests[sku];
                topSku = sku;
            }
        });

        return {
            matchedPairs,
            totalPairs: SKU_ITEMS.length,
            visualTargetSku: topSku
        };
    }

    return { initGame, handleCardClick, getStats };
})();

if (typeof window !== 'undefined') {
    window.CxMemoryMatch = CxMemoryMatch;
}
