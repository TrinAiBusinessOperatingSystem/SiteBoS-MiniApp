/**
 * SiteBoS Customer Master Passport (sitebos_passport.js)
 * Modulo Client-Side Condiviso Cross-Owner:
 * - TTL 15 minuti su cache locale (localStorage)
 * - Dual-write ottimistico (locale immediato + sync server background)
 * - Sconto Network SiteBoS (500pt -> 5%, 1000pt -> 10%, 1500pt -> 15%)
 * - Zero-PII (nessun dato anagrafico personale inviato/salvato server-side)
 */
(function (window) {
  'use strict';

  var TTL_MS = 15 * 60 * 1000; // 15 minuti di validità cache locale
  var WEBHOOK_URL = 'https://prod.workflow.trinai.it/webhook/sitebos-phygital-checkin';

  function getChatId() {
    var tg = window.Telegram && window.Telegram.WebApp;
    var user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (user && user.id) {
      return String(user.id);
    }
    // Fallback: parametro URL o sessione salvata
    var urlParams = new URLSearchParams(window.location.search);
    var paramChatId = urlParams.get('chat_id');
    if (paramChatId) return String(paramChatId);

    try {
      var lastChatId = localStorage.getItem('sitebos_last_active_chat_id');
      if (lastChatId) return String(lastChatId);
    } catch (e) {}

    return null;
  }

  function storageKey(chatId) {
    return 'sitebos_passport_' + chatId;
  }

  function loadLocal(chatId) {
    try {
      var raw = localStorage.getItem(storageKey(chatId));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('[SitebosPassport] Errore lettura locale:', e);
      return null;
    }
  }

  function saveLocal(chatId, passport) {
    try {
      var toStore = Object.assign({}, passport, { synced_at: new Date().toISOString() });
      localStorage.setItem(storageKey(chatId), JSON.stringify(toStore));
      localStorage.setItem('sitebos_last_active_chat_id', chatId);
      return true;
    } catch (e) {
      console.error('[SitebosPassport] Errore scrittura locale:', e);
      return false;
    }
  }

  function isStale(passport) {
    if (!passport || !passport.synced_at) return true;
    var diff = Date.now() - new Date(passport.synced_at).getTime();
    return diff > TTL_MS;
  }

  function resolveDiscountTier(points) {
    var p = parseInt(points, 10) || 0;
    if (p >= 1500) return '15%';
    if (p >= 1000) return '10%';
    if (p >= 500) return '5%';
    return null;
  }

  function resolveDiscountRate(tierOrPoints) {
    if (typeof tierOrPoints === 'string') {
      if (tierOrPoints === '15%') return 0.15;
      if (tierOrPoints === '10%') return 0.10;
      if (tierOrPoints === '5%') return 0.05;
      return 0.0;
    }
    var tier = resolveDiscountTier(tierOrPoints);
    return resolveDiscountRate(tier);
  }

  function fetchFromServer(chatId) {
    return fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_customer_passport',
        chat_id: chatId
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    }).then(function (data) {
      if (!data || !data.success || !data.passport) {
        throw new Error('Passaporto non disponibile');
      }
      return data.passport;
    });
  }

  function defaultPassport(chatId) {
    return {
      chat_id: chatId ? Number(chatId) : null,
      network_loyalty: {
        points_balance: 0,
        discount_tier_unlocked: null,
        points_earned_by_owner: {},
        updated_at: new Date().toISOString()
      },
      visited_owners: [],
      psychometric_profile: null,
      synced_at: new Date().toISOString()
    };
  }

  /**
   * Caricamento Passaporto:
   * Fast-path locale immediato se < TTL (15 min).
   * Altrimenti refresh server con fallback su cache locale in caso di offline.
   */
  function loadPassport() {
    var chatId = getChatId();
    if (!chatId) {
      return Promise.resolve(defaultPassport(null));
    }

    var local = loadLocal(chatId);
    if (local && !isStale(local)) {
      return Promise.resolve(local);
    }

    return fetchFromServer(chatId).then(function (fresh) {
      var merged = Object.assign(defaultPassport(chatId), fresh);
      if (merged.network_loyalty) {
        merged.network_loyalty.discount_tier_unlocked = resolveDiscountTier(merged.network_loyalty.points_balance);
      }
      saveLocal(chatId, merged);
      return merged;
    }).catch(function (err) {
      console.warn('[SitebosPassport] Refresh fallito, uso cache locale o default:', err);
      return local || defaultPassport(chatId);
    });
  }

  function applyOptimisticDelta(local, actionPayload) {
    var next = Object.assign({}, local);
    next.network_loyalty = Object.assign({ points_balance: 0, points_earned_by_owner: {} }, next.network_loyalty);

    if (actionPayload.network_loyalty_delta) {
      var delta = parseInt(actionPayload.network_loyalty_delta.points_change, 10) || 0;
      next.network_loyalty.points_balance = Math.max(0, (next.network_loyalty.points_balance || 0) + delta);
      next.network_loyalty.discount_tier_unlocked = resolveDiscountTier(next.network_loyalty.points_balance);
      next.network_loyalty.updated_at = new Date().toISOString();
    }

    if (actionPayload.owner_vat) {
      next.visited_owners = Array.isArray(next.visited_owners) ? next.visited_owners.slice() : [];
      var ownerIdx = -1;
      for (var i = 0; i < next.visited_owners.length; i++) {
        if (next.visited_owners[i].vat_number === actionPayload.owner_vat) {
          ownerIdx = i;
          break;
        }
      }

      var ownerRecord = ownerIdx >= 0 ? Object.assign({}, next.visited_owners[ownerIdx]) : {
        vat_number: actionPayload.owner_vat,
        ragione_sociale_cache: actionPayload.ragione_sociale || '',
        first_visit_at: new Date().toISOString(),
        purchases_mirror: []
      };

      ownerRecord.last_visit_at = new Date().toISOString();

      if (actionPayload.purchase) {
        ownerRecord.purchases_mirror = Array.isArray(ownerRecord.purchases_mirror) ? ownerRecord.purchases_mirror.slice() : [];
        ownerRecord.purchases_mirror.push(Object.assign({
          purchased_at: new Date().toISOString()
        }, actionPayload.purchase));
      }

      if (actionPayload.active_job_ref) {
        ownerRecord.active_job_ref = actionPayload.active_job_ref;
      }

      if (ownerIdx >= 0) {
        next.visited_owners[ownerIdx] = ownerRecord;
      } else {
        next.visited_owners.push(ownerRecord);
      }
    }

    // Aggiornamento psychometric_profile (proveniente dai minigiochi, vedi phygital_local_first.js submitCxProfile).
    // Merge non distruttivo: mantiene i campi precedenti se lo snapshot corrente non li fornisce.
    if (actionPayload.psychometric_snapshot) {
      var snap = actionPayload.psychometric_snapshot;
      next.psychometric_profile = Object.assign({}, next.psychometric_profile, {
        latest_archetype: snap.primary_archetype || (next.psychometric_profile && next.psychometric_profile.latest_archetype) || null,
        communication_style: snap.communication_style || (next.psychometric_profile && next.psychometric_profile.communication_style) || null,
        aggregated_scores: Object.assign({}, next.psychometric_profile && next.psychometric_profile.aggregated_scores, snap.metrics_scores),
        updated_at: new Date().toISOString()
      });
    }

    // Aggiornamento interest_profile (proveniente dal widget notizie, vedi §Interest Archetype Engine).
    if (actionPayload.interest_delta) {
      var interestDelta = actionPayload.interest_delta; // { category, engagement_score_delta }
      next.interest_profile = Object.assign({
        category_scores: {},
        engagement_metrics: { total_articles_opened: 0, avg_read_time_sec: 0 }
      }, next.interest_profile);
      next.interest_profile.category_scores = Object.assign({}, next.interest_profile.category_scores);
      var prevScore = next.interest_profile.category_scores[interestDelta.category] || 0;
      next.interest_profile.category_scores[interestDelta.category] = Math.min(100, prevScore + (interestDelta.engagement_score_delta || 0));
      next.interest_profile.engagement_metrics.total_articles_opened = (next.interest_profile.engagement_metrics.total_articles_opened || 0) + 1;
      if (typeof interestDelta.read_time_sec === 'number') {
        var prevAvg = next.interest_profile.engagement_metrics.avg_read_time_sec || 0;
        var prevCount = next.interest_profile.engagement_metrics.total_articles_opened - 1;
        next.interest_profile.engagement_metrics.avg_read_time_sec = ((prevAvg * prevCount) + interestDelta.read_time_sec) / next.interest_profile.engagement_metrics.total_articles_opened;
      }
      var scores = next.interest_profile.category_scores;
      var topCategory = Object.keys(scores).reduce(function (best, cat) {
        return (!best || scores[cat] > scores[best]) ? cat : best;
      }, null);
      next.interest_profile.primary_interest_archetype = topCategory ? resolveInterestArchetype(topCategory) : null;
      next.interest_profile.updated_at = new Date().toISOString();
    }

    return next;
  }

  function resolveInterestArchetype(category) {
    var map = {
      economia_finanza: 'PRAGMATICO_FINANZIARIO',
      tecnologia_innovazione: 'CURIOSO_TECNOLOGICO',
      salute_benessere: 'ATTENTO_AL_BENESSERE',
      sport_performance: 'COMPETITIVO_PERFORMANTE'
    };
    return map[category] || null;
  }

  /**
   * Dual-write: Scrittura locale immediata ottimistica + Sync server fire-and-forget
   * @param {Object} actionPayload { network_loyalty_delta, owner_vat, ragione_sociale, purchase, active_job_ref }
   */
  function persistAction(actionPayload) {
    var chatId = getChatId();
    if (!chatId) return Promise.resolve(null);

    var local = loadLocal(chatId) || defaultPassport(chatId);
    var merged = applyOptimisticDelta(local, actionPayload || {});
    saveLocal(chatId, merged);

    // Sync server in background (Fire-and-Forget con Zero-PII)
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({
        action: 'sync_customer_passport',
        chat_id: chatId
      }, actionPayload))
    }).catch(function (err) {
      console.warn('[SitebosPassport] Sync server fallita (sarà riallineata al prossimo refresh TTL):', err);
    });

    return Promise.resolve(merged);
  }

  // Esportazione Globale
  window.SitebosPassport = {
    load: loadPassport,
    persistAction: persistAction,
    getChatId: getChatId,
    resolveDiscountTier: resolveDiscountTier,
    resolveDiscountRate: resolveDiscountRate
  };

})(window);
