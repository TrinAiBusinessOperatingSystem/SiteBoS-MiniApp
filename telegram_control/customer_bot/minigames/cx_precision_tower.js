/**
 * cx_precision_tower.js — Precision Tower Stack Engine (Canvas 2D, Perfezionismo & Tolleranza Errori)
 */

const CxPrecisionTower = (() => {
    'use strict';

    let animId = null;
    let stackHeight = 0;
    let perfectDrops = 0;
    let totalDrops = 0;
    let missedDrops = 0;

    function initGame(canvasId) {
        stackHeight = 0;
        perfectDrops = 0;
        totalDrops = 0;
        missedDrops = 0;

        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let blockWidth = 100;
        let currentBlock = { x: 0, y: canvas.height - 30, dx: 3, width: blockWidth };
        let stackedBlocks = [{ x: canvas.width / 2 - 50, y: canvas.height - 30, width: 100 }];

        function loop() {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Stacked Blocks
            stackedBlocks.forEach((b, i) => {
                ctx.fillStyle = i === stackedBlocks.length - 1 ? '#38bdf8' : '#334155';
                ctx.fillRect(b.x, b.y, b.width, 25);
                ctx.strokeStyle = '#0284c7';
                ctx.strokeRect(b.x, b.y, b.width, 25);
            });

            // Move Moving Block
            currentBlock.x += currentBlock.dx;
            if (currentBlock.x <= 0 || currentBlock.x + currentBlock.width >= canvas.width) {
                currentBlock.dx *= -1;
            }

            // Draw Moving Block
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(currentBlock.x, currentBlock.y, currentBlock.width, 25);

            // HUD
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`TORRE: ${stackHeight} PIANI | PERFETTI: ${perfectDrops}`, 15, 25);

            animId = requestAnimationFrame(loop);
        }

        function dropBlock() {
            if (stackedBlocks.length === 0) return;
            totalDrops++;
            const prevBlock = stackedBlocks[stackedBlocks.length - 1];
            const diff = currentBlock.x - prevBlock.x;
            const absDiff = Math.abs(diff);

            if (absDiff < 4) {
                // Perfect drop!
                perfectDrops++;
                currentBlock.x = prevBlock.x;
            } else if (absDiff >= currentBlock.width) {
                // Total miss!
                missedDrops++;
                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
                }
                return;
            } else {
                // Partial overlap
                currentBlock.width -= absDiff;
                if (diff > 0) {
                    currentBlock.x = prevBlock.x + absDiff;
                }
            }

            stackHeight++;
            stackedBlocks.push({ x: currentBlock.x, y: currentBlock.y - 28, width: currentBlock.width });
            currentBlock.y -= 28;
            currentBlock.dx *= 1.05; // Slightly faster each level

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }

            if (stackHeight >= 8 && window.CxGamificationHub) {
                window.CxGamificationHub.addPoints(15, 'tower_completion');
            }
        }

        canvas.onclick = dropBlock;
        canvas.ontouchstart = (e) => { e.preventDefault(); dropBlock(); };

        animId = requestAnimationFrame(loop);
    }

    function stopGame() {
        if (animId) cancelAnimationFrame(animId);
        const perfectionismScore = totalDrops > 0 ? (perfectDrops / totalDrops) : 0;
        const frustrationTolerance = missedDrops === 0 ? 1.0 : Math.max(0, 1.0 - (missedDrops * 0.3));

        return {
            stackHeight,
            perfectDrops,
            missedDrops,
            perfectionismScore,
            frustrationTolerance
        };
    }

    return { initGame, stopGame };
})();

if (typeof window !== 'undefined') {
    window.CxPrecisionTower = CxPrecisionTower;
}
