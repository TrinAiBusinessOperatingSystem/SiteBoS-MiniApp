/**
 * cx_gta_sandbox.js — GTA City Top-Down Micro-Sandbox (Canvas 2D, Pedoni, Auto Tier 1-3, Profilazione Regole)
 */

const CxGtaSandbox = (() => {
    'use strict';

    let animId = null;
    let carTier = 1; // 1: Sedan (free), 2: Sports (25pt), 3: Supercar (55pt)
    let startTime = 0;
    let redLightsPassed = 0;
    let pedestriansAvoided = 0;
    let pedestriansHit = 0;

    function initGame(canvasId, carBuyTier = 1) {
        carTier = carBuyTier;

        let carCost = 0;
        if (carTier === 2) carCost = 25;
        if (carTier === 3) carCost = 55;

        if (carCost > 0) {
            if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(carCost)) {
                alert("Punti insufficienti per questa vettura! Guidatore con auto base.");
                carTier = 1;
                carCost = 0;
            } else if (window.CxGamificationHub) {
                window.CxGamificationHub.spendPoints(carCost, `gta_car_t${carTier}`);
            }
        }

        startTime = Date.now();
        redLightsPassed = 0;
        pedestriansAvoided = 0;
        pedestriansHit = 0;

        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const speedMultiplier = carTier === 3 ? 2.5 : (carTier === 2 ? 1.8 : 1.0);
        let car = { x: canvas.width / 2, y: canvas.height - 60, width: 24, height: 40, speed: 2 * speedMultiplier };
        let pedestrians = [];
        let trafficLights = [{ y: 150, state: 'RED' }];
        let lastLightChange = 0;

        function spawnPedestrian() {
            pedestrians.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: Math.random() * (canvas.height - 200) + 50,
                dx: (Math.random() - 0.5) * 1.2
            });
        }

        for (let i = 0; i < 4; i++) spawnPedestrian();

        function loop(now) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Road Lines
            ctx.strokeStyle = '#f59e0b';
            ctx.setLineDash([15, 15]);
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Traffic Light Toggle
            if (now - lastLightChange > 4000) {
                trafficLights[0].state = trafficLights[0].state === 'RED' ? 'GREEN' : 'RED';
                lastLightChange = now;
            }

            // Draw Traffic Light Line
            const tl = trafficLights[0];
            ctx.fillStyle = tl.state === 'RED' ? '#ef4444' : '#10b981';
            ctx.fillRect(0, tl.y, canvas.width, 8);

            // Move & Draw Pedestrians
            pedestrians.forEach((p, pi) => {
                p.x += p.dx;
                if (p.x < 10 || p.x > canvas.width - 10) p.dx *= -1;

                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                ctx.fill();

                // Car Collision Check
                const dist = Math.hypot(car.x - p.x, car.y - p.y);
                if (dist < 18) {
                    pedestriansHit++;
                    pedestrians.splice(pi, 1);
                    spawnPedestrian();
                }
            });

            // Car Movement (Auto drive forward, touch steer)
            car.y -= car.speed * 0.4;
            if (car.y < -40) {
                car.y = canvas.height + 20;
                pedestriansAvoided += 3;
            }

            // Check Traffic Light Violation
            if (tl.state === 'RED' && Math.abs(car.y - tl.y) < 10) {
                redLightsPassed++;
            }

            // Draw Car
            ctx.fillStyle = carTier === 3 ? '#ec4899' : (carTier === 2 ? '#3b82f6' : '#94a3b8');
            ctx.fillRect(car.x - car.width / 2, car.y - car.height / 2, car.width, car.height);

            // HUD
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`AUTO T${carTier} | SEMAFORO: ${tl.state} | PEDONI EVITATI: ${pedestriansAvoided}`, 10, 20);

            animId = requestAnimationFrame(loop);
        }

        function handleSteer(e) {
            const rect = canvas.getBoundingClientRect();
            const touchX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            car.x = Math.max(20, Math.min(canvas.width - 20, touchX));
        }

        canvas.onmousemove = handleSteer;
        canvas.ontouchmove = handleSteer;

        animId = requestAnimationFrame(loop);
    }

    function stopGame() {
        if (animId) cancelAnimationFrame(animId);
        const durationSec = Math.round((Date.now() - startTime) / 1000);

        if (durationSec >= 45 && window.CxGamificationHub) {
            window.CxGamificationHub.addPoints(15, 'gta_completion');
        }

        return {
            carTier,
            durationSec,
            redLightsPassed,
            pedestriansHit,
            pedestriansAvoided,
            ruleCompliance: Math.max(0, 1.0 - (redLightsPassed * 0.3 + pedestriansHit * 0.4))
        };
    }

    return { initGame, stopGame };
})();

if (typeof window !== 'undefined') {
    window.CxGtaSandbox = CxGtaSandbox;
}
