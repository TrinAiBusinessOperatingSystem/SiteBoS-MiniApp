/**
 * cda_auth_gate.js
 * TrinAI CdA Security Gate — modulo di autenticazione riutilizzabile.
 *
 * Al Consiglio di Amministrazione di TrinAI S.r.l.
 * All'attenzione del Presidente & CEO / Solution Architect
 *
 * Perimetro: .agents/business/
 *
 * =============================================================================
 * NOTA VINCOLANTE — LEGGERE PRIMA DI ATTIVARE (ENABLED = true)
 * =============================================================================
 *
 * 1) QUESTO GATE NON E' RISERVATEZZA DEI DATI, E' UN DETERRENTE.
 *    Le pagine protette sono file HTML statici: il testo, le tabelle e le cifre
 *    del CdA sono gia presenti nel DOM al caricamento della pagina, prima ancora
 *    che questo script venga eseguito. Chiunque apra "Visualizza sorgente" o gli
 *    strumenti per sviluppatori del browser puo leggere il contenuto senza
 *    passare dal modal, indipendentemente da quanto sia solido il controllo
 *    password lato server. Questo meccanismo serve a: (a) scoraggiare la
 *    visione casuale o accidentale, (b) lasciare una traccia di accesso sul
 *    webhook (chi ha sbloccato, quando), (c) segnalare in modo visibile che il
 *    documento e riservato. NON e un sostituto di una vera distribuzione
 *    controllata dei file (es. non condividere il link/file con chi non deve
 *    vederlo, contando sul gate per fermarlo).
 *
 * 2) STATO DEL BACKEND — RISOLTO E VERIFICATO IN PRODUZIONE IL 21/09/2026.
 *    n8n_workflow/CDA_LogIn.workflow.ts corretto previa autorizzazione
 *    esplicita, validato con n8nac validate, pushato in produzione
 *    (PUT /api/v1/workflows/tcS6lTk5Z9cZNOkf, 200) e ritestato dal vivo via
 *    curl con Content-Type: application/x-www-form-urlencoded (lo stesso
 *    che invia verifyPassword() qui sotto):
 *      - password errata  → HTTP 200 {"success":false}
 *      - password corretta → HTTP 200 {"success":true}
 *      - header presenti su entrambe: Access-Control-Allow-Origin: *,
 *        Access-Control-Allow-Methods: POST, Access-Control-Allow-Headers:
 *        Content-Type.
 *    Cinque difetti risolti lato workflow: (a) confronto password che non
 *    leggeva l'input, (b) nessuno dei due rami impostava un campo di esito,
 *    (c) metodo POST non accettato, (d) nessun header CORS, (e) questa
 *    istanza n8n non ammette OPTIONS come httpMethod del nodo Webhook —
 *    percio' il preflight non e' gestito lato server ma evitato a monte:
 *    Content-Type: application/x-www-form-urlencoded (CORS-safelisted) invece
 *    di application/json, che non fa scattare alcun preflight nel browser.
 *    NOTA RESIDUA NON RISOLTA: la password ("KiPampini") resta scritta in
 *    chiaro nel nodo If_ del workflow anziche' in una credenziale n8n o
 *    variabile d'ambiente — non migrata perche' non verificabile da qui se
 *    l'accesso a $env e' abilitato su questa istanza. Intervento successivo
 *    consigliato, non bloccante per l'attivazione del gate.
 *    GATE ATTIVATO IL 21/09/2026 sulla base di questa verifica dal vivo.
 *
 * 3) CONTRATTO RICHIESTO AL WEBHOOK PRIMA DI ATTIVARE:
 *    - Metodo: POST, Content-Type: application/json, body { "password": "..." }
 *    - Risposta attesa in caso di password corretta:
 *        200 OK, body JSON { "success": true }
 *    - Risposta attesa in caso di password errata:
 *        200 o 401, body JSON { "success": false } (qualunque altra forma di
 *        risposta viene trattata come fallimento: il controllo e fail-closed)
 *    - Header CORS necessari nella risposta (incluso su eventuale preflight
 *      OPTIONS): Access-Control-Allow-Origin coerente con l'origine da cui le
 *      pagine vengono servite, Access-Control-Allow-Methods: POST, OPTIONS,
 *      Access-Control-Allow-Headers: Content-Type.
 *
 * =============================================================================
 */

(function () {
  "use strict";

  var CDA_GATE_CONFIG = {
    // Interruttore principale. Backend verificato dal vivo il 21/09/2026,
    // vedi nota (2) sopra.
    enabled: true,

    webhookUrl: "https://prod.workflow.trinai.it/webhook/e9b68c4d-ff5c-4f76-bd17-a426247944b9",
    cookieName: "trinai_cda_auth",
    cookieMaxAgeSeconds: 7776000, // 90 giorni / 3 mesi
    requestTimeoutMs: 12000
  };

  function log(msg) {
    // eslint-disable-next-line no-console
    console.warn("[cda_auth_gate] " + msg);
  }

  function getCookie(name) {
    var match = document.cookie.match(
      new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    var isSecureContext = window.location.protocol === "https:";
    var parts = [
      name + "=" + encodeURIComponent(value),
      "max-age=" + maxAgeSeconds,
      "path=/",
      "SameSite=Lax"
    ];
    // L'attributo Secure impedisce al cookie di essere impostato su pagine
    // aperte via file:// o http://: lo si aggiunge solo in contesto https.
    if (isSecureContext) parts.push("Secure");
    document.cookie = parts.join("; ");
  }

  function isAuthenticated() {
    return getCookie(CDA_GATE_CONFIG.cookieName) === "true";
  }

  function buildModal() {
    var overlay = document.createElement("div");
    overlay.className = "cda-gate-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "TrinAI CdA Security Gate");

    overlay.innerHTML =
      '<div class="cda-gate-modal">' +
      '  <span class="cda-gate-badge">TrinAI &middot; CdA Security Gate</span>' +
      '  <h2 class="cda-gate-title">Documento riservato del Consiglio</h2>' +
      '  <p class="cda-gate-subtitle">Inserire la password di accesso per visualizzare questo documento. L’accesso viene registrato.</p>' +
      '  <form class="cda-gate-form" autocomplete="off">' +
      '    <div class="cda-gate-field">' +
      '      <input class="cda-gate-input" type="password" name="cda_password" placeholder="Password" autocomplete="current-password" required />' +
      "    </div>" +
      '    <button type="submit" class="cda-gate-submit">' +
      '      <span class="cda-gate-spinner" aria-hidden="true"></span>' +
      '      <span class="cda-gate-submit-label">Accedi</span>' +
      "    </button>" +
      '    <div class="cda-gate-error" role="alert"></div>' +
      "  </form>" +
      '  <div class="cda-gate-footer">Al Consiglio di Amministrazione di TrinAI S.r.l. &mdash; ad uso esclusivo del Presidente & CEO / Solution Architect e dei membri autorizzati.</div>' +
      "</div>";

    return overlay;
  }

  function withTimeout(promise, ms) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timeoutId = setTimeout(function () {
      if (controller) controller.abort();
    }, ms);
    return { promise: promise, controller: controller, clear: function () { clearTimeout(timeoutId); } };
  }

  function verifyPassword(password) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
    var timeoutId = setTimeout(function () {
      if (controller) controller.abort();
    }, CDA_GATE_CONFIG.requestTimeoutMs);

    // Content-Type volutamente application/x-www-form-urlencoded, non
    // application/json: e' uno dei content-type "CORS-safelisted" che il
    // browser NON fa precedere da una richiesta OPTIONS di preflight.
    // Il webhook n8n di destinazione (CDA_LogIn.workflow.ts) non puo'
    // registrare OPTIONS come metodo (limite verificato dell'istanza), quindi
    // il preflight va evitato a monte, non gestito a valle. n8n instrada
    // comunque il body urlencoded sotto $json.body.password, come per JSON.
    return fetch(CDA_GATE_CONFIG.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "password=" + encodeURIComponent(password),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        clearTimeout(timeoutId);
        if (!response.ok) return { success: false };
        return response.json().catch(function () {
          return { success: false };
        });
      })
      .then(function (data) {
        // Fail-closed: solo { success: true } esplicito sblocca. Qualunque
        // altra forma di risposta (vuota, ambigua, malformata) e trattata
        // come fallimento — vedi nota (2)/(3) in testata.
        return !!(data && data.success === true);
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        log("Verifica fallita (rete/CORS/timeout): " + err);
        return false;
      });
  }

  function unlock(root) {
    root.classList.remove("cda-gate-locked");
    var overlay = root.querySelector(".cda-gate-overlay");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function showError(overlay, message) {
    var box = overlay.querySelector(".cda-gate-error");
    box.textContent = message;
    box.classList.add("is-visible");
  }

  function hideError(overlay) {
    var box = overlay.querySelector(".cda-gate-error");
    box.classList.remove("is-visible");
    box.textContent = "";
  }

  function setLoading(overlay, loading) {
    var btn = overlay.querySelector(".cda-gate-submit");
    btn.disabled = loading;
    btn.classList.toggle("is-loading", loading);
  }

  function attachModal(root) {
    var overlay = buildModal();
    document.body.appendChild(overlay);

    var form = overlay.querySelector(".cda-gate-form");
    var input = overlay.querySelector(".cda-gate-input");

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      var password = input.value;
      if (!password) return;

      hideError(overlay);
      setLoading(overlay, true);

      verifyPassword(password).then(function (ok) {
        setLoading(overlay, false);
        if (ok) {
          setCookie(CDA_GATE_CONFIG.cookieName, "true", CDA_GATE_CONFIG.cookieMaxAgeSeconds);
          unlock(root);
        } else {
          showError(overlay, "Password non corretta, oppure il servizio di verifica non e al momento raggiungibile. Riprovare.");
          input.value = "";
          input.focus();
        }
      });
    });
  }

  function init() {
    var root = document.body;

    if (!CDA_GATE_CONFIG.enabled) {
      log(
        "Gate disattivato (CDA_GATE_CONFIG.enabled = false). Il contenuto resta visibile. " +
          "Vedi la nota in testata di questo file per i tre requisiti backend da soddisfare prima di attivarlo."
      );
      return;
    }

    if (isAuthenticated()) {
      // Gia autenticato in una sessione precedente (cookie valido): nessun modal.
      return;
    }

    root.classList.add("cda-gate-locked");
    attachModal(root);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
