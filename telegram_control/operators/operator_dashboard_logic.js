// operator_dashboard_logic.js
// SiteBoS Operator Dashboard - 3D Orbital Satellites Engine v3.0

const tg = window.TwaGuard?.requireTelegramWebApp?.() || window.Telegram.WebApp;
const ash = window.TwaGuard?.requireAsh?.();
window.TwaGuard?.cleanupUrl?.(['ash']);

// Config API Endpoint
const API_ENDPOINT = 'https://trinai.api.workflow.dcmake.it/webhook/2e3376d7-6a5a-4fc1-a908-4b8b9501c583';

// Soft-required: ash is the only URL context
if (!ash) {
  try { tg.close(); } catch (_) {}
}

// State
let operatorData = null;
let animationFrameId = null;

// Satellites Configuration (6 Satelliti Operativi)
const satellitesData = [
  { id: 'tasks', label: 'TASK ATTIVI', icon: 'fa-tasks', color: '#3b82f6', url: 'operator_tasks.html' },
  { id: 'job-create', label: 'CREA NUOVO JOB', icon: 'fa-briefcase', color: '#8b5cf6', url: '../operativita/job-create.html' },
  { id: 'big5', label: 'PROFILO PERSONALITÀ', icon: 'fa-brain', color: '#a78bfa', action: 'showBigFiveDrawer' },
  { id: 'badges', label: 'BADGE & TROFEI', icon: 'fa-trophy', color: '#f59e0b', url: 'operator_badges.html' },
  { id: 'training', label: 'FORMAZIONE & SKILLS', icon: 'fa-graduation-cap', color: '#10b981', url: '../softskill/index.html' },
  { id: 'calendar', label: 'CALENDARIO TURNI', icon: 'fa-calendar-alt', color: '#ec4899', url: 'operator_calendar.html' }
];

// Orbital Engine Variables (6 Satellites -> Math.PI / 3 step)
const rx = 145; 
const ry = 100; 
let currentAngle = Math.PI / 2; 
let isDragging = false;
let startX = 0;
let baseAngle = 0;
let activeIdx = 0;

// Web Audio Mechanical Tick Sound
let audioCtx = null;
function playMechanicalTick() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.03);
    
    gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    console.warn("Audio Context error:", e);
  }
}

// ============================================
// INIT & SETUP
// ============================================

async function init() {
  showLoader();
  
  try {
    await loadOperatorData();
    populateHeader();
    buildSatellites();
    setupOrbitEvents();
    hideLoader();
    
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  } catch (error) {
    console.error('Init error:', error);
    hideLoader();
  }
}

// ============================================
// API CALLS & DATA MAPPER
// ============================================

async function loadOperatorData() {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_operator_dashboard',
        ash: ash,
        _auth: tg.initData
      })
    });
    
    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    
    if (data.status === 'success' && data.stakeholder) {
      operatorData = mapStakeholderToDashboard(data.stakeholder);
      sessionStorage.setItem('operator_data', JSON.stringify(operatorData));
      sessionStorage.setItem('stakeholder_raw', JSON.stringify(data.stakeholder));
      sessionStorage.setItem('operator_ash', ash);
    } else {
      throw new Error(data.message || 'Failed to load data');
    }
  } catch (error) {
    console.warn('Load operator API error, checking cache...', error);
    const cached = sessionStorage.getItem('operator_data');
    if (cached) {
      operatorData = JSON.parse(cached);
    } else {
      // Fallback mock per visualizzazione immediata
      operatorData = getFallbackOperatorData();
    }
  }
}

function mapStakeholderToDashboard(stakeholder) {
  return {
    identity: {
      name: stakeholder.identity?.full_name?.split(' ')[0] || 'Operatore',
      full_name: stakeholder.identity?.full_name || 'Operatore',
      email: stakeholder.identity?.primary_contact?.email || ''
    },
    professional_profile: {
      current_role: stakeholder.identity?.professional_background?.current_role || 'Operatore',
      years_experience: stakeholder.professional_profile?.years_experience || '0',
      hard_skills: stakeholder.professional_profile?.hard_skills || []
    },
    big_five: {
      openness: stakeholder.behavioral_profile?.big_five?.openness_to_experience || 75,
      conscientiousness: stakeholder.behavioral_profile?.big_five?.conscientiousness || 85,
      extraversion: stakeholder.behavioral_profile?.big_five?.extraversion || 65,
      agreeableness: stakeholder.behavioral_profile?.big_five?.agreeableness || 80,
      neuroticism: stakeholder.behavioral_profile?.big_five?.neuroticism || 25
    },
    gamification: {
      xp: stakeholder.gamification?.xp || 1250,
      level: stakeholder.gamification?.level || 3,
      badges: stakeholder.gamification?.badges || ['Speedy', 'Task Master', 'Compliance Hero']
    },
    tasks: {
      active: stakeholder.tasks?.active || 2,
      completed_today: stakeholder.tasks?.completed_today || 4
    },
    system_access: {
      linked_owner: {
        vat_number: stakeholder.system_access?.linked_owner?.vat_number || '',
        company_name: stakeholder.system_access?.linked_owner?.company_name || 'Studio BoS'
      }
    }
  };
}

function getFallbackOperatorData() {
  return {
    identity: { name: 'Operatore', full_name: 'Operatore Operativo', email: 'op@sitebos.it' },
    professional_profile: { current_role: 'Specialista di Team', years_experience: '3', hard_skills: ['Gnatologia', 'Sterilizzazione'] },
    big_five: { openness: 80, conscientiousness: 90, extraversion: 70, agreeableness: 85, neuroticism: 20 },
    gamification: { xp: 1500, level: 3, badges: ['Primo Accesso', 'Task Master'] },
    tasks: { active: 3, completed_today: 5 },
    system_access: { linked_owner: { vat_number: '', company_name: 'Studio BoS' } }
  };
}

// ============================================
// HEADER & CORE POPULATE
// ============================================

function populateHeader() {
  if (!operatorData) return;
  
  const opNameEl = document.getElementById('operatorName');
  if (opNameEl) opNameEl.innerText = operatorData.identity.full_name;
  
  const opRoleEl = document.getElementById('operatorRole');
  if (opRoleEl) opRoleEl.innerText = operatorData.professional_profile.current_role;
  
  const compEl = document.getElementById('companyName');
  if (compEl) compEl.innerText = operatorData.system_access.linked_owner.company_name;
  
  // Set avatar initials or logo
  const avatarDiv = document.getElementById('operator-avatar');
  if (avatarDiv) {
    const initials = operatorData.identity.name.substring(0, 2).toUpperCase();
    avatarDiv.innerText = initials || '👤';
  }
}

// ============================================
// 3D ORBITAL SATELLITES CAROUSEL ENGINE
// ============================================

function buildSatellites() {
  const orbitContainer = document.getElementById('satellites-orbit');
  if (!orbitContainer) return;
  
  orbitContainer.innerHTML = "";
  const total = satellitesData.length; // 6 Satelliti
  
  satellitesData.forEach((sat, idx) => {
    const div = document.createElement('div');
    div.className = "satellite-item pointer-events-auto";
    div.id = `sat-${idx}`;
    div.innerHTML = `
      <div class="satellite-btn" style="border-color:${sat.color}">
        <i class="fas ${sat.icon} text-lg" style="color:${sat.color}"></i>
      </div>
      <div class="satellite-label" style="border-left: 2px solid ${sat.color}">
        ${sat.label}
      </div>
    `;
    
    div.addEventListener('click', () => {
      if (idx === activeIdx) {
        playMechanicalTick();
        triggerSatelliteAction(sat);
      } else {
        const stepAngle = (2 * Math.PI) / total;
        let rawDiff = (Math.PI / 2 - (idx * stepAngle)) - currentAngle;
        let shortestDiff = Math.atan2(Math.sin(rawDiff), Math.cos(rawDiff));
        let targetAngle = currentAngle + shortestDiff;
        playMechanicalTick();
        animateTo(targetAngle);
      }
    });
    orbitContainer.appendChild(div);
  });
  
  updateSatellites();
  findActiveSatellite();
}

function updateSatellites() {
  const orbitContainer = document.getElementById('satellites-orbit');
  if (!orbitContainer) return;
  
  const centerX = orbitContainer.clientWidth / 2;
  const centerY = orbitContainer.clientHeight / 2;
  const total = satellitesData.length;
  const stepAngle = (2 * Math.PI) / total;

  satellitesData.forEach((_, idx) => {
    const satElement = document.getElementById(`sat-${idx}`);
    if (!satElement) return;

    let angle = currentAngle + (idx * stepAngle);
    let x = rx * Math.cos(angle);
    let y = ry * Math.sin(angle);

    let sin = Math.sin(angle);
    let scale = 0.70 + 0.30 * ((sin + 1) / 2);
    let opacity = 0.30 + 0.70 * ((sin + 1) / 2);
    let zIndex = Math.round((sin + 1) * 100);

    satElement.style.transform = `translate3d(${centerX + x - 35}px, ${centerY + y - 35}px, 0) scale(${scale})`;
    satElement.style.opacity = opacity;
    satElement.style.zIndex = zIndex;

    if (idx === activeIdx) {
      satElement.classList.add('focused');
    } else {
      satElement.classList.remove('focused');
    }
  });
}

function findActiveSatellite() {
  const total = satellitesData.length;
  const stepAngle = (2 * Math.PI) / total;
  let rawIdx = Math.round((Math.PI / 2 - currentAngle) / stepAngle);
  activeIdx = ((rawIdx % total) + total) % total;
}

function executeActiveModule() {
  const target = satellitesData[activeIdx];
  if (target) {
    playMechanicalTick();
    triggerSatelliteAction(target);
  }
}

function triggerSatelliteAction(sat) {
  if (sat.action === 'showBigFiveDrawer') {
    renderBigFiveDrawerContent();
    toggleDrawer(true);
  } else if (sat.url) {
    openModule(sat.url);
  }
}

function openModule(url) {
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  window.location.href = `${url}?ash=${encodeURIComponent(ash)}`;
}

function handleCoreClick() {
  playMechanicalTick();
  renderOperatorOverviewDrawerContent();
  toggleDrawer(true);
}

// ============================================
// TOUCH DRAG & SWIPE ENGINE
// ============================================

function setupOrbitEvents() {
  const orbitViewport = document.getElementById('orbit-viewport');
  if (!orbitViewport) return;

  function onDragStart(clientX) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isDragging = true;
    startX = clientX;
    baseAngle = currentAngle;
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    const dx = clientX - startX;
    currentAngle = baseAngle - (dx * 0.006);
    updateSatellites();
    findActiveSatellite();
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    snapToNearest();
  }

  orbitViewport.addEventListener('touchstart', e => { onDragStart(e.touches[0].clientX); }, { passive: true });
  orbitViewport.addEventListener('touchmove', e => { onDragMove(e.touches[0].clientX); }, { passive: true });
  orbitViewport.addEventListener('touchend', onDragEnd, { passive: true });

  orbitViewport.addEventListener('mousedown', e => { onDragStart(e.clientX); });
  window.addEventListener('mousemove', e => { onDragMove(e.clientX); });
  window.addEventListener('mouseup', onDragEnd);
}

function snapToNearest() {
  const total = satellitesData.length;
  const stepAngle = (2 * Math.PI) / total;
  let rawDiff = Math.round((currentAngle - Math.PI / 2) / stepAngle) * stepAngle + Math.PI / 2 - currentAngle;
  let shortestDiff = Math.atan2(Math.sin(rawDiff), Math.cos(rawDiff));
  let targetAngle = currentAngle + shortestDiff;
  animateTo(targetAngle);
}

function animateTo(target) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }

  function step() {
    let diff = target - currentAngle;
    if (Math.abs(diff) < 0.004) {
      currentAngle = target;
      updateSatellites();
      findActiveSatellite();
      animationFrameId = null;
    } else {
      currentAngle += diff * 0.18;
      updateSatellites();
      findActiveSatellite();
      animationFrameId = requestAnimationFrame(step);
    }
  }
  animationFrameId = requestAnimationFrame(step);
}

// ============================================
// DRAWER CONTROL & DYNAMIC CONTENT RENDERING
// ============================================

function toggleDrawer(show) {
  playMechanicalTick();
  const overlay = document.getElementById('drawer-overlay');
  const drawer = document.getElementById('nav-drawer');
  if (!overlay || !drawer) return;
  
  if (show) {
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.remove('opacity-0');
      drawer.classList.remove('-translate-x-full');
    }, 10);
  } else {
    overlay.classList.add('opacity-0');
    drawer.classList.add('-translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function renderOperatorOverviewDrawerContent() {
  const titleEl = document.getElementById('drawer-header-title');
  if (titleEl) titleEl.innerText = "PANORAMICA OPERATORE";
  
  const contentEl = document.getElementById('drawer-content-body');
  if (!contentEl || !operatorData) return;
  
  contentEl.innerHTML = `
    <div class="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
      <div class="text-[9px] font-black tracking-widest text-slate-400 uppercase">Identità Operatore</div>
      <div class="text-base font-black mt-1">${operatorData.identity.full_name}</div>
      <div class="text-xs text-slate-300">${operatorData.professional_profile.current_role}</div>
      <div class="text-[10px] text-slate-400 mt-2">🏢 ${operatorData.system_access.linked_owner.company_name}</div>
    </div>
    
    <div class="grid grid-cols-2 gap-3">
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Task Attivi</div>
        <div class="text-lg font-black text-blue-600 mt-1">${operatorData.tasks.active}</div>
      </div>
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="text-[9px] font-bold uppercase text-slate-400">Badge Sbloccati</div>
        <div class="text-lg font-black text-amber-500 mt-1">${operatorData.gamification.badges.length}</div>
      </div>
    </div>

    <div class="p-4 border border-slate-200 rounded-2xl bg-white space-y-2">
      <div class="text-[9px] font-black uppercase tracking-wider text-slate-400">Competenze Tecniche</div>
      <div class="flex flex-wrap gap-1.5 pt-1">
        ${operatorData.professional_profile.hard_skills.map(s => `<span class="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700">${s}</span>`).join('') || '<span class="text-xs text-slate-400">Nessuna skill inserita</span>'}
      </div>
    </div>
  `;
}

function renderBigFiveDrawerContent() {
  const titleEl = document.getElementById('drawer-header-title');
  if (titleEl) titleEl.innerText = "PROFILO COMPORTAMENTALE (BIG FIVE)";
  
  const contentEl = document.getElementById('drawer-content-body');
  if (!contentEl || !operatorData) return;
  
  const bf = operatorData.big_five;
  
  contentEl.innerHTML = `
    <div class="p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
      <h3 class="text-xs font-black uppercase tracking-wider text-purple-400">Analisi della Personalità</h3>
      <p class="text-[11px] text-slate-300 mt-1 leading-relaxed">Punteggi del modello dei Big Five rilevati durante le attività operative e l'onboarding.</p>
    </div>

    <div class="space-y-3 pt-2">
      <!-- Apertura -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="flex justify-between items-center text-xs font-bold mb-1">
          <span class="text-slate-800">🌈 Apertura all'Esperienza</span>
          <span class="text-purple-600 font-black">${bf.openness}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-purple-500 rounded-full" style="width:${bf.openness}%"></div>
        </div>
      </div>

      <!-- Coscienziosità -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="flex justify-between items-center text-xs font-bold mb-1">
          <span class="text-slate-800">📋 Coscienziosità</span>
          <span class="text-emerald-600 font-black">${bf.conscientiousness}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full" style="width:${bf.conscientiousness}%"></div>
        </div>
      </div>

      <!-- Estroversione -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="flex justify-between items-center text-xs font-bold mb-1">
          <span class="text-slate-800">🎉 Estroversione</span>
          <span class="text-amber-600 font-black">${bf.extraversion}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-amber-500 rounded-full" style="width:${bf.extraversion}%"></div>
        </div>
      </div>

      <!-- Amichevolezza -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="flex justify-between items-center text-xs font-bold mb-1">
          <span class="text-slate-800">🤝 Amichevolezza</span>
          <span class="text-blue-600 font-black">${bf.agreeableness}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full" style="width:${bf.agreeableness}%"></div>
        </div>
      </div>

      <!-- Nevroticismo -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
        <div class="flex justify-between items-center text-xs font-bold mb-1">
          <span class="text-slate-800">⚡ Stabilità Emotiva</span>
          <span class="text-rose-600 font-black">${100 - bf.neuroticism}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div class="h-full bg-rose-500 rounded-full" style="width:${100 - bf.neuroticism}%"></div>
        </div>
      </div>
    </div>
  `;
}

function openSettings() {
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  window.location.href = `edit_operator.html?ash=${encodeURIComponent(ash)}`;
}

// ============================================
// LOADER UTILS
// ============================================

function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.remove('hidden');
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.classList.add('hidden');
}

// Init on DOM Content Loaded
document.addEventListener('DOMContentLoaded', init);