/**
 * cx_spin_win.js — Spin & Win Wheel Game (Puntata 5-50 pt, Profilazione Rischio)
 */

const CxSpinWin = (() => {
    'use strict';

    const SECTORS = [
        { label: '🎉 VITTORIA 2X', multiplier: 2, color: '#10b981' },
        { label: '💔 NIENTE', multiplier: 0, color: '#ef4444' },
        { label: '🔄 RAGGIUNTO', multiplier: 1, color: '#f59e0b' },
        { label: '🎉 VITTORIA 2X', multiplier: 2, color: '#10b981' },
        { label: '💔 NIENTE', multiplier: 0, color: '#6b7280' },
        { label: '🔥 SUPER 2.5X', multiplier: 2.5, color: '#8b5cf6' }
    ];

    let isSpinning = false;
    let betsHistory = [];

    function spin(canvasId, betAmount, onComplete) {
        if (isSpinning) return;
        betAmount = Math.max(5, Math.min(50, Number(betAmount) || 10));

        // Deduce puntata dal bilancio hub
        if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(betAmount)) {
            alert("Punti insufficienti per questa puntata! Guadagna punti con i quiz o altri giochi.");
            return;
        }

        if (window.CxGamificationHub) {
            window.CxGamificationHub.spendPoints(betAmount, 'spin_bet');
        }

        isSpinning = true;
        betsHistory.push(betAmount);

        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        let currentAngle = 0;
        const totalRotation = Math.PI * 2 * (5 + Math.random() * 3); // 5-8 giri
        const duration = 3500;
        const startTime = performance.now();

        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            currentAngle = easeOut * totalRotation;

            // Draw Wheel
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const numSectors = SECTORS.length;
            const sliceAngle = (Math.PI * 2) / numSectors;

            for (let i = 0; i < numSectors; i++) {
                const angle = currentAngle + i * sliceAngle;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
                ctx.fillStyle = SECTORS[i].color;
                ctx.fill();
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Text
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(angle + sliceAngle / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText(SECTORS[i].label, radius - 15, 4);
                ctx.restore();
            }

            // Pointer Top
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(centerX - 12, 10);
            ctx.lineTo(centerX + 12, 10);
            ctx.lineTo(centerX, 28);
            ctx.closePath();
            ctx.fill();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isSpinning = false;
                // Calcola settore vincente sotto il pointer top (3PI/2)
                const finalNormalizedAngle = (Math.PI * 1.5 - (currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                const winIndex = Math.floor(finalNormalizedAngle / sliceAngle) % numSectors;
                const wonSector = SECTORS[winIndex];
                const payout = Math.round(betAmount * wonSector.multiplier);

                if (payout > 0 && window.CxGamificationHub) {
                    window.CxGamificationHub.addPoints(payout, 'spin_win');
                }

                if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.notificationOccurred(payout > 0 ? 'success' : 'warning');
                }

                if (typeof onComplete === 'function') {
                    onComplete({
                        bet: betAmount,
                        multiplier: wonSector.multiplier,
                        payout: payout,
                        label: wonSector.label
                    });
                }
            }
        }

        requestAnimationFrame(animate);
    }

    function getStats() {
        const totalBets = betsHistory.length;
        const avgBet = totalBets > 0 ? betsHistory.reduce((a, b) => a + b, 0) / totalBets : 0;
        return { avgBet, totalBets };
    }

    return { spin, getStats };
})();

if (typeof window !== 'undefined') {
    window.CxSpinWin = CxSpinWin;
}
