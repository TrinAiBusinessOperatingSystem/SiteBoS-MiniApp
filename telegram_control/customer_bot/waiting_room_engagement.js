/**
 * waiting_room_engagement.js — Layer di Ingaggio Sala d'Attesa SiTeBoS
 * 
 * - Modale Minigiochi Temu-Style con timer ~3 secondi dopo l'ingresso
 * - Trigger attivo SOLO quando onsite=true ("Sono Qui" in sala d'attesa)
 * - Frequency capping: massimo 1 volta al giorno per singolo owner (localStorage)
 * - CTA verso l'Arcade Hub dei Minigiochi (minigames/index.html?vat=...)
 */
(function (window) {
  'use strict';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function todayKey(tenantId, chatId) {
    var today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return 'sitebos_waitingroom_modal_' + tenantId + '_' + chatId + '_' + today;
  }

  function shouldShowModalToday(tenantId, chatId) {
    try {
      return !localStorage.getItem(todayKey(tenantId, chatId));
    } catch (e) {
      return true;
    }
  }

  function markModalShownToday(tenantId, chatId) {
    try {
      localStorage.setItem(todayKey(tenantId, chatId), '1');
    } catch (e) {}
  }

  function buildModal() {
    var overlay = document.createElement('div');
    overlay.id = 'sitebos-waitingroom-modal';
    overlay.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm transition-all duration-300';
    overlay.innerHTML = [
      '<div class="relative w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl overflow-hidden border border-amber-300/40" ',
      'style="background: linear-gradient(135deg, #FF6B35 0%, #F7C948 100%); animation: sitebosPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);">',
      
      // Floating light glow
      '<div style="position:absolute; top:-50px; left:-50px; width:120px; height:120px; background:rgba(255,255,255,0.3); border-radius:9999px; filter:blur(20px);"></div>',
      
      // Pulsante Chiusura X
      '<button id="sitebos-waitingroom-close" aria-label="Chiudi" ',
      'style="position:absolute; top:14px; right:14px; width:34px; height:34px; border-radius:9999px; ',
      'background:rgba(0,0,0,0.15); color:#1a1200; font-weight:900; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px;">✕</button>',
      
      // Icona Regalo Animata
      '<div style="font-size:46px; margin-bottom:10px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">🎁</div>',
      
      // Titolo & Testo ad Alto Impatto
      '<h2 style="font-weight:900; font-size:22px; color:#1a1200; margin-bottom:8px; line-height:1.2; letter-spacing:-0.5px;">',
      'Guadagna punti mentre aspetti!</h2>',
      '<p style="font-size:13px; color:#3a2a00; font-weight:600; margin-bottom:20px; line-height:1.45; padding:0 4px;">',
      'Gioca e leggi le notizie in sala d\'attesa: accumula punti e sblocca fino al <strong>15% di sconto</strong> su tutti i servizi della rete SiteBoS.</p>',
      
      // Badge Vantaggio
      '<div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.35); padding:6px 14px; border-radius:9999px; font-size:11px; font-weight:800; color:#1a1200; margin-bottom:20px;">',
      '<span>⚡ +150 PT per gioco</span> · <span>📰 +30 PT a notizia</span>',
      '</div>',
      
      // Bottone CTA
      '<button id="sitebos-waitingroom-cta" style="width:100%; padding:15px; border-radius:18px; ',
      'background:#1a1200; color:#ffffff; font-weight:800; border:none; font-size:15px; box-shadow:0 8px 20px rgba(0,0,0,0.25); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">',
      '<span>Inizia a Giocare</span> <span style="font-size:18px;">➔</span></button>',
      
      '</div>'
    ].join('');

    // Style animation
    var style = document.createElement('style');
    style.innerHTML = `
      @keyframes sitebosPopIn {
        0% { opacity: 0; transform: scale(0.85) translateY(20px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
    `;
    document.head.appendChild(style);

    return overlay;
  }

  function showModal(onCtaClick) {
    var existing = document.getElementById('sitebos-waitingroom-modal');
    if (existing) return;

    var modal = buildModal();
    document.body.appendChild(modal);

    document.getElementById('sitebos-waitingroom-close').addEventListener('click', function () {
      modal.remove();
    });

    document.getElementById('sitebos-waitingroom-cta').addEventListener('click', function () {
      modal.remove();
      if (typeof onCtaClick === 'function') onCtaClick();
    });
  }

  function init() {
    var urlParams = new URLSearchParams(window.location.search);
    var onsite = urlParams.get('onsite') === 'true';
    
    // Se non è esplicitamente in sala d'attesa (onsite), non mostrare il modale invadente
    if (!onsite) return;

    var chatId = window.SitebosPassport ? window.SitebosPassport.getChatId() : null;
    var tenantId = window.SITEBOS_TENANT_ID || urlParams.get('vat') || 'default_tenant';

    if (!chatId || !tenantId) return;

    // Frequenza massima: 1 volta al giorno per owner
    if (!shouldShowModalToday(tenantId, chatId)) return;

    setTimeout(function () {
      showModal(function () {
        markModalShownToday(tenantId, chatId);
        var arcadeUrl = 'minigames/index.html?vat=' + encodeURIComponent(tenantId) + '&chat_id=' + encodeURIComponent(chatId) + '&onsite=true';
        window.location.href = arcadeUrl;
      });
      markModalShownToday(tenantId, chatId);
    }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SitebosWaitingRoomEngagement = {
    showModal: showModal,
    init: init
  };

})(window);
