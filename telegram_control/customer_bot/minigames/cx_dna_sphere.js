/**
 * cx_dna_sphere.js — Three.js 3D Rotating DNA Sphere Engine (27 Nodes, 3 Layers)
 * Sfera 3D multi-livello con auto-rotazione, stop su nodo frontale ogni 4.5s, pause/resume loop e 2D CSS Fallback.
 */

const CxDnaSphere = (() => {
    'use strict';

    let scene, camera, renderer, sphereGroup;
    let isInitialized = false;
    let animId = null;
    let isPaused = false;
    let containerRef = null;

    // 27 Nodi in 3 Strati
    const SPHERE_NODES = [
        // Strato 1: 5 Nodi DNA Principali
        { id: 'mente', layer: 1, color: 0x60a5fa, size: 0.22, pos: [0, 1.8, 0], icon: '🧠', subtitle: 'Quanto ci pensi prima di agire?' },
        { id: 'cuore', layer: 1, color: 0xf472b6, size: 0.22, pos: [-1.6, -0.8, 0.8], icon: '❤️', subtitle: 'Senti o ragioni?' },
        { id: 'energia', layer: 1, color: 0xfbbf24, size: 0.22, pos: [1.6, 0.5, 0.8], icon: '⚡', subtitle: 'A manetta o col pilota automatico?' },
        { id: 'guardia', layer: 1, color: 0x34d399, size: 0.22, pos: [0, -1.8, 0], icon: '🛡️', subtitle: 'Prudente come una nonna o temerario?' },
        { id: 'flusso', layer: 1, color: 0xa78bfa, size: 0.22, pos: [0, 0, -1.8], icon: '🌀', subtitle: 'Con la corrente o contro?' },

        // Strato 2: 10 Sub-Nodi Quiz
        { id: 'resilienza', layer: 2, parent: 'guardia', color: 0x059669, size: 0.14, pos: [-0.6, -1.2, 0.6], icon: '🧘', subtitle: 'Resilienza e Tenacia' },
        { id: 'finanza', layer: 2, parent: 'guardia', color: 0x047857, size: 0.14, pos: [0.6, -1.2, -0.6], icon: '💰', subtitle: 'Finanza e Rischio' },
        { id: 'empatia', layer: 2, parent: 'cuore', color: 0xdb2777, size: 0.14, pos: [-1.2, -0.4, 1.2], icon: '🎞️', subtitle: 'Empatia e Sensibilità' },
        { id: 'analisi', layer: 2, parent: 'mente', color: 0x2563eb, size: 0.14, pos: [-0.6, 1.2, 0.6], icon: '🧠', subtitle: 'Analisi e Razionalità' },
        { id: 'coraggio', layer: 2, parent: 'energia', color: 0xd97706, size: 0.14, pos: [1.2, 0.8, 0.4], icon: '🔥', subtitle: 'Coraggio e Visione' },
        { id: 'etica', layer: 2, parent: 'cuore', color: 0xbe185d, size: 0.14, pos: [-0.8, -0.2, -1.2], icon: '🛡️', subtitle: 'Etica e Trasparenza' },
        { id: 'adattabilita', layer: 2, parent: 'flusso', color: 0x7c3aed, size: 0.14, pos: [0.4, 0.2, -1.4], icon: '🌊', subtitle: 'Adattabilità e Flusso' },
        { id: 'leadership', layer: 2, parent: 'energia', color: 0xb45309, size: 0.14, pos: [1.0, -0.4, 0.8], icon: '⚡', subtitle: 'Energia e Carisma' },
        { id: 'focus', layer: 2, parent: 'mente', color: 0x1d4ed8, size: 0.14, pos: [0.6, 1.2, -0.6], icon: '🎯', subtitle: 'Focus e Concentrazione' },
        { id: 'mix_istinto', layer: 2, parent: 'flusso', color: 0xffffff, size: 0.14, pos: [-0.4, -0.2, 1.4], icon: '🌐', subtitle: 'Mix Istinto Totale' },

        // Strato 3: 12 Nodi Metrici Minigiochi
        { id: 'aggression_index', layer: 3, game: 'doom', color: 0xef4444, size: 0.09, pos: [1.4, 1.2, 0.2], icon: '💢', subtitle: 'Reattività Doom' },
        { id: 'cooperation_index', layer: 3, game: 'doom', color: 0xf472b6, size: 0.09, pos: [-1.4, -0.6, 0.4], icon: '🤝', subtitle: 'Cooperazione Doom' },
        { id: 'violence_propensity', layer: 3, game: 'gta', color: 0xd97706, size: 0.09, pos: [1.2, -1.0, 0.6], icon: '🚶', subtitle: 'Rispetto Pedoni GTA' },
        { id: 'rule_compliance', layer: 3, game: 'gta', color: 0x10b981, size: 0.09, pos: [-0.8, -1.4, -0.6], icon: '🛣️', subtitle: 'Semafori & Regole' },
        { id: 'financial_risk_tolerance', layer: 3, game: 'blackjack', color: 0xf59e0b, size: 0.09, pos: [0.8, -1.4, -0.4], icon: '💸', subtitle: 'Puntata Blackjack' },
        { id: 'price_sensitivity', layer: 3, game: 'blackjack', color: 0x60a5fa, size: 0.09, pos: [-0.4, 1.4, -0.8], icon: '💳', subtitle: 'Gestione Chip' },
        { id: 'perfectionism_score', layer: 3, game: 'precision_tower', color: 0x38bdf8, size: 0.09, pos: [0.2, 1.6, 0.6], icon: '🎯', subtitle: 'Precision Stack' },
        { id: 'frustration_tolerance', layer: 3, game: 'precision_tower', color: 0x34d399, size: 0.09, pos: [-0.6, -1.6, 0.2], icon: '😤', subtitle: 'Tolleranza Errori' },
        { id: 'recurring_care_affinity', layer: 3, game: 'tamagotchi', color: 0xa78bfa, size: 0.09, pos: [-0.2, -0.4, -1.6], icon: '🔄', subtitle: 'Cura Pet' },
        { id: 'visual_target_sku', layer: 3, game: 'memory', color: 0xec4899, size: 0.09, pos: [0.6, 0.4, 1.5], icon: '👁️', subtitle: 'SKU Memory' },
        { id: 'engagement_score', layer: 3, game: 'spin_win', color: 0xfbbf24, size: 0.09, pos: [1.5, -0.2, -0.6], icon: '🌀', subtitle: 'Spin Win' },
        { id: 'decision_speed', layer: 3, game: 'all', color: 0x64748b, size: 0.09, pos: [0, 0, 1.8], icon: '📊', subtitle: 'Velocità Decisione' }
    ];

    function isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    function render2DFallbackCard(container) {
        container.innerHTML = `
            <div class="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl text-white space-y-4 shadow-xl">
                <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 class="font-black text-sm uppercase tracking-tight flex items-center gap-2">
                        <i class="fas fa-brain text-cyan-400"></i> Istinto DNA Card
                    </h3>
                    <span class="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">2D MODE</span>
                </div>

                <div class="space-y-3 text-xs">
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>🧠 Mente (Analisi)</span><span>75%</span></div>
                        <div class="w-full bg-slate-800 h-2.5 rounded-full"><div class="bg-blue-500 h-2.5 rounded-full transition-all" style="width:75%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>❤️ Cuore (Empatia)</span><span>82%</span></div>
                        <div class="w-full bg-slate-800 h-2.5 rounded-full"><div class="bg-pink-500 h-2.5 rounded-full transition-all" style="width:82%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>⚡ Energia (Leadership)</span><span>68%</span></div>
                        <div class="w-full bg-slate-800 h-2.5 rounded-full"><div class="bg-amber-500 h-2.5 rounded-full transition-all" style="width:68%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>🛡️ Guardia (Prudenza)</span><span>90%</span></div>
                        <div class="w-full bg-slate-800 h-2.5 rounded-full"><div class="bg-emerald-500 h-2.5 rounded-full transition-all" style="width:90%"></div></div>
                    </div>
                    <div>
                        <div class="flex justify-between text-slate-300 mb-1"><span>🌀 Flusso (Adattabilità)</span><span>70%</span></div>
                        <div class="w-full bg-slate-800 h-2.5 rounded-full"><div class="bg-purple-500 h-2.5 rounded-full transition-all" style="width:70%"></div></div>
                    </div>
                </div>
            </div>
        `;
    }

    function initSphere(containerId) {
        containerRef = document.getElementById(containerId);
        if (!containerRef) return;

        if (!isWebGLAvailable() || !window.THREE) {
            console.warn('[CxDnaSphere] WebGL non supportato o Three.js non pronto. Avvio 2D Fallback Card.');
            render2DFallbackCard(containerRef);
            return;
        }

        try {
            const width = containerRef.clientWidth || 340;
            const height = containerRef.clientHeight || 340;

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            camera.position.z = 5.5;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            containerRef.innerHTML = '';
            containerRef.appendChild(renderer.domElement);

            sphereGroup = new THREE.Group();
            scene.add(sphereGroup);

            // Outer Wireframe Globe
            const wireGeo = new THREE.SphereGeometry(2.1, 16, 16);
            const wireMat = new THREE.MeshBasicMaterial({ color: 0x1e3a5f, wireframe: true, transparent: true, opacity: 0.2 });
            const wireMesh = new THREE.Mesh(wireGeo, wireMat);
            sphereGroup.add(wireMesh);

            // Add Nodes & Connections
            const nodeMeshes = [];
            SPHERE_NODES.forEach((nodeData) => {
                const geo = new THREE.SphereGeometry(nodeData.size, 16, 16);
                const mat = new THREE.MeshBasicMaterial({ color: nodeData.color });
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(...nodeData.pos);
                mesh.userData = nodeData;
                sphereGroup.add(mesh);
                nodeMeshes.push(mesh);
            });

            // Add Connection Lines
            for (let i = 0; i < nodeMeshes.length; i++) {
                for (let j = i + 1; j < nodeMeshes.length; j++) {
                    const p1 = nodeMeshes[i].position;
                    const p2 = nodeMeshes[j].position;
                    const dist = p1.distanceTo(p2);

                    if (dist < 1.8) {
                        const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                        const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.15 });
                        const line = new THREE.Line(lineGeo, lineMat);
                        sphereGroup.add(line);
                    }
                }
            }

            let lastStop = performance.now();
            let isStopped = false;

            function animate(now) {
                if (isPaused) return;
                animId = requestAnimationFrame(animate);

                if (!isStopped) {
                    sphereGroup.rotation.y += 0.005;
                    sphereGroup.rotation.x += 0.002;
                }

                if (now - lastStop > 4500) {
                    isStopped = true;
                    setTimeout(() => {
                        isStopped = false;
                        lastStop = performance.now();
                    }, 1500);
                    lastStop = now + 10000;
                }

                renderer.render(scene, camera);
            }

            isPaused = false;
            animate(performance.now());
            isInitialized = true;
        } catch (e) {
            console.error('[CxDnaSphere] Errore inizializzazione 3D:', e);
            render2DFallbackCard(containerRef);
        }
    }

    function pauseAnimation() {
        isPaused = true;
        if (animId) cancelAnimationFrame(animId);
    }

    function resumeAnimation() {
        if (isPaused && isInitialized) {
            isPaused = false;
            initSphere(containerRef?.id || 'cx-dna-sphere-container');
        }
    }

    return { initSphere, pauseAnimation, resumeAnimation, isWebGLAvailable };
})();

if (typeof window !== 'undefined') {
    window.CxDnaSphere = CxDnaSphere;
}
