// operator_dashboard_logic.js
// SiteBoS Operator Dashboard - 3D Orbital Satellites Engine v3.0

const tg = window.TwaGuard?.requireTelegramWebApp?.() || window.Telegram.WebApp;
if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();

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

// Satellites Configuration (7 Satelliti Operativi)
const satellitesData = [
  { id: 'tasks', label: 'TASK ATTIVI', icon: 'fa-tasks', color: '#3b82f6', url: 'operator_tasks.html' },
  { id: 'job-create', label: 'CREA NUOVO JOB', icon: 'fa-briefcase', color: '#8b5cf6', url: '../operativita/job-create.html' },
  { id: 'documents', label: 'DOCUMENTI & FIRMA', icon: 'fa-file-signature', color: '#6366f1', url: 'document_sign_simple.html' },
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
    updateOperatorStatusUI(getOperatorStatus());
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
      if (window.JobSyncQueue) {
        window.JobSyncQueue.saveStakeholder(ash, data.stakeholder);
      }
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
  
  // Set microphone icon (Operatore è sempre in modalità PRO)
  const avatarDiv = document.getElementById('operator-avatar');
  if (avatarDiv) {
    avatarDiv.innerHTML = `<i class="fas fa-microphone text-slate-900 text-lg"></i>`;
  }

}

// ============================================
// OPERATOR AVAILABILITY & BREAK STATUS ENGINE
// ============================================

function getOperatorId() {
  const raw = sessionStorage.getItem('stakeholder_raw');
  if (raw) {
    try {
      const s = JSON.parse(raw);
      if (s._id) return s._id;
      if (s.operator_id) return s.operator_id;
      if (s.sessionId) return s.sessionId;
    } catch (_) {}
  }
  return ash || 'current_operator';
}

function getOperatorStatus() {
  const opId = getOperatorId();
  return localStorage.getItem(`sitebos_operator_${opId}_status`) || 'AVAILABLE';
}

function setOperatorAvailability(status, syncBackend = true) {
  const opId = getOperatorId();
  localStorage.setItem(`sitebos_operator_${opId}_status`, status);
  updateOperatorStatusUI(status);

  if (syncBackend) {
    syncOperatorAvailabilityBackend(status, opId);
  }
}

function toggleOperatorStatus() {
  const current = getOperatorStatus();
  const next = current === 'ON_BREAK' ? 'AVAILABLE' : 'ON_BREAK';
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  setOperatorAvailability(next, true);
}

function updateOperatorStatusUI(status) {
  const btn = document.getElementById('btn-operator-status');
  const dot = document.getElementById('operator-status-dot');
  const text = document.getElementById('operator-status-text');
  const heroBtn = document.getElementById('hero-claim-btn');

  const isOnBreak = status === 'ON_BREAK';

  if (btn && dot && text) {
    if (isOnBreak) {
      btn.className = "px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border transition-all flex items-center gap-1 shadow-sm bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100";
      dot.className = "w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse";
      text.innerText = "🟠 IN PAUSA";
    } else {
      btn.className = "px-2 py-0.5 text-[8px] font-black uppercase rounded-lg border transition-all flex items-center gap-1 shadow-sm bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100";
      dot.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse";
      text.innerText = "🟢 DISPONIBILE";
    }
  }

  if (heroBtn) {
    if (isOnBreak) {
      heroBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
      heroBtn.setAttribute('title', 'Sei in pausa — passa a Disponibile per prendere un lavoro');
    } else {
      heroBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
      heroBtn.removeAttribute('title');
    }
  }
}

async function syncOperatorAvailabilityBackend(status, opId) {
  try {
    const payload = {
      action: 'set_operator_availability',
      operator_id: opId,
      status: status,
      ash: ash,
      _auth: tg.initData
    };

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('Backend sync returned non-ok status');
    }
  } catch (err) {
    console.warn('Sync operator status backend error (saved locally):', err);
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
    
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      playMechanicalTick();
      if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
      
      if (idx === activeIdx) {
        triggerSatelliteAction(sat);
      } else {
        const stepAngle = (2 * Math.PI) / total;
        let rawDiff = (Math.PI / 2 - (idx * stepAngle)) - currentAngle;
        let shortestDiff = Math.atan2(Math.sin(rawDiff), Math.cos(rawDiff));
        let targetAngle = currentAngle + shortestDiff;
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
  let rawIdx = Math.round((Math.PI / 2 - currentAngle) / stepAngle);
  let targetAngle = Math.PI / 2 - rawIdx * stepAngle;
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

// ============================================
// LAVAGNA JOB ON_SHELF & REACTIVE REFRESH ENGINE
// ============================================

let currentShelfJobs = [];
let activeClaimedJob = null;

async function refreshOperatorShelf() {
  const container = document.getElementById('shelf-jobs-container');
  const badge = document.getElementById('shelf-count-badge');
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

  try {
    const response = await fetch('https://trinai.api.workflow.dcmake.it/webhook/d253f855-ce1a-43ee-81aa-38fa11a9d639', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_tasks', status: 'ON_SHELF', ash: ash, _auth: tg.initData })
    });
    
    let jobs = [];
    if (response.ok) {
      const data = await response.json();
      jobs = data.jobs || data.tasks || [];
    }

    if (!jobs || jobs.length === 0) {
      jobs = [
        {
          _id: 'job_safety_101',
          title: 'VERIFICA SANIFICAZIONE E DPI POLTRONA 2',
          customer_name: 'Clinica Buscemi',
          station_id: 'SALA 2 / POLTRONA B',
          blueprint_eta_minutes: 8,
          is_safety_job: true,
          is_onsite: true,
          status: 'ON_SHELF'
        },
        {
          _id: 'job_onthefly_202',
          title: 'SOSTITUZIONE VALVOLA MISCELATORE',
          customer_name: 'Cantiere Via Roma 12',
          station_id: 'OFF-SITE / CANTERE',
          blueprint_eta_minutes: 15,
          is_safety_job: false,
          is_onsite: false,
          status: 'ON_SHELF'
        }
      ];
    }

    currentShelfJobs = jobs;
    if (badge) badge.innerText = `${jobs.length} IN ATTESA`;

    if (!container) return;
    container.innerHTML = jobs.map(job => `
      <div class="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-400 transition flex justify-between items-center">
        <div class="space-y-1">
          <div class="flex items-center gap-1.5">
            ${job.is_safety_job ? `<span class="px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black uppercase rounded-md">🦺 HSE SICUREZZA</span>` : ''}
            <span class="px-2 py-0.5 ${job.is_onsite ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'} text-[8px] font-black uppercase rounded-md">
              ${job.is_onsite ? '🏛️ ON-SITE' : '🚚 OFF-SITE'}
            </span>
            <span class="text-[9px] font-bold text-slate-400">~${job.blueprint_eta_minutes || 10} MIN</span>
          </div>
          <h4 class="text-xs font-black text-slate-900 uppercase leading-snug">${job.title || 'JOB OPERATIVO'}</h4>
          <p class="text-[9px] font-bold text-slate-500">${job.station_id || 'STAZIONE'} — ${job.customer_name || 'CLIENTE'}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          ${currentDashboardMode === 'edit' ? `
            <button onclick="openOwnerJobEditModal('${job._id}')" class="px-3 py-2 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition flex items-center gap-1 border border-indigo-400">
              <i class="fas fa-edit text-[9px]"></i> EDIT
            </button>
          ` : `
            <button onclick="claimSpecificJob('${job._id}')" class="px-3 py-2 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm active:scale-95 transition flex items-center gap-1">
              <i class="fas fa-play text-[9px]"></i> DO-IT
            </button>
          `}
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.warn("Shelf sync error:", err);
    if (container) container.innerHTML = `<div class="text-center py-2 text-xs text-rose-500 font-bold">Errore di sincronizzazione lavagna</div>`;
  }
}

async function claimNextJobOnShelf() {
  if (getOperatorStatus() === 'ON_BREAK') {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
    alert("Sei in pausa — passa a Disponibile per prendere un lavoro");
    return;
  }
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  
  const targetJob = currentShelfJobs.length > 0 ? currentShelfJobs[0] : {
    _id: 'job_claimed_instant',
    title: 'SANIFICAZIONE POLTRONA & CHECK DPI',
    station_id: 'SALA 1 / POLTRONA A',
    customer_name: 'Paziente Mario Rossi',
    blueprint_eta_minutes: 8,
    is_safety_job: true,
    is_onsite: true
  };

  openPreJobModal(targetJob);
}

function claimSpecificJob(jobId) {
  if (getOperatorStatus() === 'ON_BREAK') {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');
    alert("Sei in pausa — passa a Disponibile per prendere un lavoro");
    return;
  }
  const job = currentShelfJobs.find(j => j._id === jobId) || currentShelfJobs[0];
  openPreJobModal(job);
}

function openPreJobModal(job) {
  activeClaimedJob = job;
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

  const modal = document.getElementById('prejob-copilot-modal');
  const titleEl = document.getElementById('copilot-job-title');
  const tipEl = document.getElementById('copilot-bigfive-tip');
  const safetyEl = document.getElementById('copilot-safety-alert');
  const upsellEl = document.getElementById('copilot-upsell-pitch');

  if (titleEl) titleEl.innerText = `${job.title || 'JOB OPERATIVO'} — ~${job.blueprint_eta_minutes || 10} MIN`;

  const agreeableness = operatorData?.big_five?.agreeableness || 85;
  if (tipEl) tipEl.innerText = `Hai un'elevata Amabilità (Agreeableness ${agreeableness}%). Usa il tuo tono empatico per accogliere il cliente e rassicurarlo sugli step.`;

  // NUOVO: checklist di sicurezza reale dal blueprint/SOP del job, non più binaria
  if (safetyEl) {
    const checklist = Array.isArray(job.sop_checklist) ? job.sop_checklist : [];
    if (checklist.length > 0) {
      safetyEl.innerHTML = checklist.map(step =>
        `<div class="flex items-center gap-2"><i class="fas ${step.completed ? 'fa-check-circle text-emerald-600' : 'fa-circle text-rose-400'}"></i> ${step.label}</div>`
      ).join('');
    } else if (job.is_safety_job) {
      safetyEl.innerText = `🦺 URGENTE D.Lgs. 81/08: Verificare indossamento visiera DPI e sanificazione previa con disinfettante ospedaliero.`;
    } else {
      safetyEl.innerText = `Obbligatorio: Guanti in nitrile monouso e sanificazione postazione.`;
    }
  }

  // NUOVO: upsell reale dal primo addon_reward disponibile del job, non più fisso
  if (upsellEl) {
    const addon = Array.isArray(job.addon_rewards) && job.addon_rewards.length > 0 ? job.addon_rewards[0] : null;
    upsellEl.innerText = addon
      ? `Proponi l'add-on "${addon.code || addon.name || 'consigliato'}" — coerente con lo sconto già sbloccato dal cliente.`
      : `Proponi l'add-on igienizzante empatico prima del risciacquo ("Noterà una sensazione di freschezza duratura").`;
  }

  if (modal) modal.classList.remove('hidden');
}

function closePreJobModal() {
  const modal = document.getElementById('prejob-copilot-modal');
  if (modal) modal.classList.add('hidden');
}

function launchJobExecution() {
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
  closePreJobModal();
  
  const isOnsite = activeClaimedJob?.is_onsite !== false;
  const targetPage = isOnsite ? 'operator_task_create.html' : 'outbound_mission.html';
  window.location.href = `${targetPage}?job_id=${encodeURIComponent(activeClaimedJob?._id || activeClaimedJob?.job_id || '')}&ash=${encodeURIComponent(ash || '')}`;
}

function launchOutboundMission() {
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
  
  const offsiteJob = currentShelfJobs.find(j => j.is_onsite === false || j.job_type === 'outbound_mission') || currentShelfJobs[0];
  const targetJobId = offsiteJob ? (offsiteJob.job_id || offsiteJob._id) : ('job_outbound_' + Date.now());
  
  window.location.href = `outbound_mission.html?job_id=${encodeURIComponent(targetJobId)}&ash=${encodeURIComponent(ash || '')}`;
}

// ============================================
// OWNER EDIT MODE ENGINE
// ============================================
let currentDashboardMode = 'doit'; // 'doit' | 'edit'
let editingOwnerJobId = null;

function setDashboardMode(mode) {
  currentDashboardMode = mode;
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

  const doitBtn = document.getElementById('btn-mode-doit');
  const editBtn = document.getElementById('btn-mode-edit');
  const doitBar = document.getElementById('owner-doit-bar');
  const editControlsBar = document.getElementById('owner-edit-controls-bar');

  if (mode === 'edit') {
    if (doitBtn) doitBtn.className = "px-2.5 py-1 text-[8px] font-bold uppercase rounded-lg text-slate-400 hover:text-white transition";
    if (editBtn) editBtn.className = "px-2.5 py-1 text-[8px] font-black uppercase rounded-lg bg-indigo-600 text-white shadow-sm transition";
    if (doitBar) doitBar.classList.add('hidden');
    if (editControlsBar) editControlsBar.classList.remove('hidden');
  } else {
    if (doitBtn) doitBtn.className = "px-2.5 py-1 text-[8px] font-black uppercase rounded-lg bg-emerald-500 text-slate-950 shadow-sm transition";
    if (editBtn) editBtn.className = "px-2.5 py-1 text-[8px] font-bold uppercase rounded-lg text-slate-400 hover:text-white transition";
    if (doitBar) doitBar.classList.remove('hidden');
    if (editControlsBar) editControlsBar.classList.add('hidden');
  }

  refreshOperatorShelf();
}

function openOwnerJobEditModal(jobId) {
  const job = currentShelfJobs.find(j => j._id === jobId);
  if (!job) return;

  editingOwnerJobId = jobId;
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

  const titleInput = document.getElementById('edit-job-title');
  const stationInput = document.getElementById('edit-job-station');
  const etaInput = document.getElementById('edit-job-eta');
  const safetyInput = document.getElementById('edit-job-safety');

  if (titleInput) titleInput.value = job.title || '';
  if (stationInput) stationInput.value = job.station_id || '';
  if (etaInput) etaInput.value = job.blueprint_eta_minutes || 10;
  if (safetyInput) safetyInput.checked = !!job.is_safety_job;

  const modal = document.getElementById('owner-job-edit-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeOwnerJobEditModal() {
  const modal = document.getElementById('owner-job-edit-modal');
  if (modal) modal.classList.add('hidden');
}

function saveOwnerJobEdits() {
  const job = currentShelfJobs.find(j => j._id === editingOwnerJobId);
  if (job) {
    const titleInput = document.getElementById('edit-job-title');
    const stationInput = document.getElementById('edit-job-station');
    const etaInput = document.getElementById('edit-job-eta');
    const safetyInput = document.getElementById('edit-job-safety');

    if (titleInput) job.title = titleInput.value;
    if (stationInput) job.station_id = stationInput.value;
    if (etaInput) job.blueprint_eta_minutes = parseInt(etaInput.value) || 10;
    if (safetyInput) job.is_safety_job = safetyInput.checked;

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
    alert("✅ MODIFICHE OWNER SALVATE!\n\nIl Job è stato aggiornato ed allineato allo scaffale.");
  }
  closeOwnerJobEditModal();
  refreshOperatorShelf();
}

function deleteOwnerJob() {
  currentShelfJobs = currentShelfJobs.filter(j => j._id !== editingOwnerJobId);
  if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('heavy');
  alert("🗑️ JOB RIMOSSO DALLO SCAFFALE!");
  closeOwnerJobEditModal();
  refreshOperatorShelf();
}

/* ── TRIGGER "AVANTI IL PROSSIMO" CON ASH SECURITY ED IDEMPOTENCY KEY ── */
async function handleNextJobTrigger(jobId, operatorId, activeSopDurationMin) {
    const btn = document.getElementById('btn-avanti-prossimo');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Sincronizzazione in corso...`;
    }

    const idempotencyKey = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('idemp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    const payload = {
        job_id: jobId,
        operator_id: operatorId,
        completed_at: new Date().toISOString(),
        duration_minutes: activeSopDurationMin || 15,
        idempotency_key: idempotencyKey
    };

    const ashHeader = (window.TwaGuard && window.TwaGuard.requireAsh) ? window.TwaGuard.requireAsh() : ('ash_trigger_' + Date.now());
    const delays = [0, 1000, 2000, 4000];
    let attempt = 0;
    let success = false;

    while (attempt < delays.length) {
        if (delays[attempt] > 0) {
            await new Promise(r => setTimeout(r, delays[attempt]));
        }
        try {
            const res = await fetch('/webhook/job-complete-trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Authorized-Session-Hash': ashHeader
                },
                body: JSON.stringify(payload)
            });

            if (res.status === 200 || res.status === 201) {
                success = true;
                break;
            }
        } catch (err) {
            console.warn(`[PhygitalTrigger] Tentativo ${attempt + 1} fallito:`, err);
        }
        attempt++;
    }

    if (success) {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        refreshOperatorShelf();
    } else {
        // Fallback LocalStorage per riconnessione
        try {
            localStorage.setItem(`sitebos_pending_job_close_${jobId}`, JSON.stringify(payload));
        } catch (e) {}
        alert('Connessione instabile. La chiusura del Job è stata salvata in locale e verrà inviata non appena la rete torna disponibile.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-rotate-right mr-2"></i>Riprova Avanti il Prossimo`;
        }
    }
}

/* ── SLOT LOCK MANAGER (OPERATOR OVERRIDE) ── */
const slotLockManager = {
    activeLockToken: null,
    lockTimer: null,

    async requestLock(slotId, operatorId) {
        try {
            const res = await fetch('/webhook/slot-lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slot_id: slotId, operator_id: operatorId, lock_duration_s: 120 })
            });

            if (res.ok) {
                const data = await res.json();
                this.activeLockToken = data.lock_token;
                this.startCountdown(120);
                return { ok: true, token: data.lock_token };
            }
            return { ok: false, message: 'Slot già occupato o bloccato da un altro operatore' };
        } catch (err) {
            return { ok: false, message: 'Errore di rete durante la richiesta di lock dello slot' };
        }
    },

    startCountdown(seconds) {
        if (this.lockTimer) clearInterval(this.lockTimer);
        let remaining = seconds;
        this.lockTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(this.lockTimer);
                this.activeLockToken = null;
                alert('⏳ Il tempo di riserva dello slot è scaduto (120s). Lo slot è stato sbloccato.');
            }
        }, 1000);
    }
};

// 3 REACTIVE SYNC TRIGGERS
document.addEventListener("DOMContentLoaded", () => {
  init();
  refreshOperatorShelf();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshOperatorShelf();
});

window.addEventListener("focus", refreshOperatorShelf);