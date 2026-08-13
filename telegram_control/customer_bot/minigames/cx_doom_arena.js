/**
 * cx_doom_arena.js — Doom Arena Protocol (Canvas 2D Shooter, Armi Tier 1-3, Profilazione Aggressività)
 */

const CxDoomArena = (() => {
    'use strict';

    let animId = null;
    let kills = 0;
    let weaponTier = 1; // 1: Pistol (free), 2: Shotgun (20pt), 3: Rocket Launcher (45pt)
    let startTime = 0;

    function initGame(canvasId, weaponBuyTier = 1) {
        weaponTier = weaponBuyTier;

        // Deduzione costo arma se Tier > 1
        let weaponCost = 0;
        if (weaponTier === 2) weaponCost = 20;
        if (weaponTier === 3) weaponCost = 45;

        if (weaponCost > 0) {
            if (window.CxGamificationHub && !window.CxGamificationHub.canSpend(weaponCost)) {
                alert("Punti insufficienti per sbloccare questa arma! Utilizzi l'arma base.");
                weaponTier = 1;
                weaponCost = 0;
            } else if (window.CxGamificationHub) {
                window.CxGamificationHub.spendPoints(weaponCost, `doom_weapon_t${weaponTier}`);
            }
        }

        kills = 0;
        startTime = Date.now();
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let player = { x: canvas.width / 2, y: canvas.height - 40, size: 20 };
        let bullets = [];
        let enemies = [];
        let lastEnemySpawn = 0;

        function spawnEnemy() {
            enemies.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: -20,
                speed: 1.5 + Math.random() * 2,
                hp: weaponTier === 3 ? 1 : (Math.random() > 0.5 ? 2 : 1),
                isBoss: Math.random() < 0.2
            });
        }

        function loop(now) {
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Grid background pattern
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }

            // Spawn Enemies
            if (now - lastEnemySpawn > 1200) {
                spawnEnemy();
                lastEnemySpawn = now;
            }

            // Move Bullets
            bullets.forEach((b, bi) => {
                b.y -= b.speed;
                ctx.fillStyle = weaponTier === 3 ? '#a855f7' : (weaponTier === 2 ? '#f59e0b' : '#38bdf8');
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
            });
            bullets = bullets.filter(b => b.y > 0);

            // Move & Draw Enemies
            enemies.forEach((e, ei) => {
                e.y += e.speed;
                ctx.fillStyle = e.isBoss ? '#ef4444' : '#f97316';
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.isBoss ? 16 : 10, 0, Math.PI * 2);
                ctx.fill();

                // Bullet Collision
                bullets.forEach((b, bi) => {
                    const dist = Math.hypot(b.x - e.x, b.y - e.y);
                    if (dist < 15) {
                        e.hp -= (weaponTier === 3 ? 3 : (weaponTier === 2 ? 2 : 1));
                        bullets.splice(bi, 1);
                        if (e.hp <= 0) {
                            kills++;
                            if (window.CxGamificationHub) {
                                window.CxGamificationHub.addPoints(2, 'doom_kill');
                            }
                        }
                    }
                });
            });
            enemies = enemies.filter(e => e.y < canvas.height && e.hp > 0);

            // Draw Player
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
            ctx.fill();

            // HUD Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`KILLS: ${kills} | WEAPON TIER: T${weaponTier}`, 15, 25);

            animId = requestAnimationFrame(loop);
        }

        // Tap/Click Shoot & Move
        function handleInput(e) {
            const rect = canvas.getBoundingClientRect();
            const touchX = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            player.x = Math.max(20, Math.min(canvas.width - 20, touchX));

            // Fire Bullet
            if (weaponTier === 2) {
                // Shotgun Spread
                bullets.push({ x: player.x - 8, y: player.y - 15, speed: 7, size: 4 });
                bullets.push({ x: player.x, y: player.y - 15, speed: 8, size: 5 });
                bullets.push({ x: player.x + 8, y: player.y - 15, speed: 7, size: 4 });
            } else if (weaponTier === 3) {
                // Rocket
                bullets.push({ x: player.x, y: player.y - 15, speed: 10, size: 8 });
            } else {
                // Pistol
                bullets.push({ x: player.x, y: player.y - 15, speed: 7, size: 4 });
            }
        }

        canvas.onclick = handleInput;
        canvas.ontouchstart = handleInput;

        animId = requestAnimationFrame(loop);
    }

    function stopGame() {
        if (animId) cancelAnimationFrame(animId);
        const durationSec = Math.round((Date.now() - startTime) / 1000);
        
        // Base completion reward (if played at least 45s)
        if (durationSec >= 45 && window.CxGamificationHub) {
            window.CxGamificationHub.addPoints(15, 'doom_completion');
        }

        return {
            kills,
            weaponTier,
            durationSec,
            aggressionIndex: Math.min(1.0, (kills / Math.max(1, durationSec)) * 2)
        };
    }

    return { initGame, stopGame };
})();

if (typeof window !== 'undefined') {
    window.CxDoomArena = CxDoomArena;
}
