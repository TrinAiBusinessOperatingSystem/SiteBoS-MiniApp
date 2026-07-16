# 📐 PROGETTO NUOVA DASHBOARD MONOPULSANTE & ADMIN PANEL

## 📝 CONTESTO OPERATIVO
La richiesta punta a semplificare e rendere più manutenibile l'interfaccia utente di **SiteBoS**. Invece di una tastiera Telegram complessa con molteplici pulsanti (che richiedevano una gestione dello stato client-side complessa per i blocchi di concorrenza), la dashboard su Telegram diventa **monopulsante**. Il pulsante principale indirizzerà l'utente direttamente all'interno della Telegram MiniApp (Web App).

All'interno della MiniApp, la struttura dei moduli disponibili sarà configurabile in tempo reale tramite un **Admin Panel** integrato. Questo pannello sarà visibile esclusivamente agli account amministrativi (`admin`) predefiniti.

---

## 🎛️ 1. ARCHITETTURA MONOPULSANTE (Telegram Bot)
La dashboard inviata dal workflow n8n [dashboard.json](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/n8n_workflows/n8n_workflow/SiteBoS-App-Hook/dashboard/dashboard.json) al client Telegram non conterrà più l'intera griglia di bottoni statici.

### 🔌 Flusso Telegram-Bot:
1. **Comando `/start` o Richiesta Menu**: L'utente interagisce con il Bot.
2. **Generazione Risposta**: Il backend controlla lo stato dell'utente (onboarding completato, crediti sufficienti, ecc.).
3. **Pulsante Unico**: Viene inviato un messaggio di stato sintetico con **un solo bottone inline**:
   * **Testo**: `🚀 Apri Console SiteBoS` o `💻 Accedi alla Dashboard`
   * **Azione**: Apre la Telegram MiniApp puntando a un URL unico (es. `supervisor_hub.html` o un router principale `dashboard.html`).
   * **Parametri URL**: L'URL include l'autenticazione sicura `ash` (generata dinamicamente con HMAC sul backend) e i parametri contestuali.

```
+------------------------------------------+
|       🛠️ SiteBoS BUSINESS CONSOLE       |
|  🏢 AZIENDA: TRINAI SRL                  |
|  👤 UTENTE: Mario Rossi                  |
|  📊 STATO: OPERATIVO                     |
+------------------------------------------+
|          [ 🚀 APRI CONSOLE ]             | (MiniApp Link)
+------------------------------------------+
```

---

## 🔄 2. MECCANISMO DI BLOCCO SEMPLIFICATO (Backend-Only)
Il precedente sistema basato su semafori MongoDB (`ai_generation_lock` in `owner_sessions`) e polling asincrono (`setInterval` ogni 3 secondi sul client) viene **dismesso** per eliminare complessità e persistenza non necessaria.

### ⚙️ Nuova Logica di Blocco:
1. **Pressione del Tasto di Generazione**: L'utente avvia un'operazione pesante (es. generazione di un blueprint o configurazione assistente).
2. **Hiding Immediato (Backend)**: Il workflow n8n che riceve la richiesta esegue immediatamente una chiamata Telegram (`editMessageReplyMarkup` o `editMessageText`) eliminando i pulsanti inline o modificando il testo in `⏳ Generazione AI in corso... Attendere la fine del processo.`.
3. **Hiding nel Client (MiniApp)**: Nel frontend della MiniApp, all'invio della richiesta, il pulsante viene disabilitato via JS aggiungendo una classe di loading/spinner e rimuovendo i listener di click.
4. **Ripristino**: Una volta completato il flusso asincrono (es. in `dashboard_confirmBlueprintbuild.json` o `dashboard_confirmAssistant.json`), il backend:
   * Aggiorna il messaggio Telegram reinserendo il pulsante della console.
   * Invia una notifica di completamento all'operatore.
   * Il client MiniApp, ricevuta la risposta HTTP o ricaricato, torna allo stato standard.

---

## 🛡️ 3. ADMIN PANEL & LIVE CUSTOMIZATION
Per dare agli amministratori la possibilità di aggiornare e strutturare dinamicamente la dashboard della MiniApp direttamente in-app, viene introdotta la modalità **Admin Panel**.

### 👥 Ruoli ed Autorizzazioni:
* **Admin (Lavorano su GitHub + In-App)**: I programmatori ed amministratori di sistema gestiscono il codice sorgente su GitHub. I loro `chat_id` o `user_id` di Telegram sono inseriti in una lista di amministratori consentiti (allowlist).
* **Utente Standard**: Vede la dashboard strutturata in moduli configurati dall'Admin. Non ha visibilità dei comandi di configurazione layout.

### 📐 Funzionamento del Pannello:
1. **Rilevamento Admin**:
   All'apertura della MiniApp, il client valida l'`initData` di Telegram. Se l'ID utente fa parte della lista admin consentita:
   ```javascript
   const ADMIN_IDS = ["2041408875", "123456789"]; // Configurabile da env o collezione DB
   const isAdmin = ADMIN_IDS.includes(tg.initDataUnsafe.user.id.toString());
   ```
2. **Attivazione UI Amministrativa**:
   Se `isAdmin === true`, in cima alla MiniApp compare un'icona ad ingranaggio `⚙️ Struttura` o un badge `Admin Mode`.
3. **Interfaccia di Modifica Layout**:
   Cliccando su `⚙️ Struttura`, l'admin accede a una vista di configurazione live dove può:
   * **Abilitare / Disabilitare** moduli (es. nascondere temporaneamente la sezione "Marketing" o "Team").
   * **Ordinare** i moduli tramite drag-and-drop o pulsanti su/giù.
   * **Modificare Testi e Icone** dei moduli (es. cambiare l'icona FontAwesome o rinominare "Gestione Aziendale" in "Catalogo Prodotti").
   * **Aggiungere Nuovi Collegamenti**: Aggiungere un nuovo pulsante che punta a una specifica WebApp o a un'azione callback Telegram personalizzata.
4. **Salvataggio e Push**:
   Cliccando su "Salva Struttura", viene effettuata una chiamata POST al backend (`dashboard.json`) per salvare il nuovo schema.

---

## 💾 4. SCHEMA DI PERSISTENZA (MongoDB)
La struttura dinamica della dashboard viene salvata in una nuova collezione MongoDB `dashboard_layouts` nel database `MemoryManager`, oppure in un campo specifico della sessione del tenant in `owner_sessions`.

### 📂 Struttura del Documento JSON (`dashboard_layouts`):
```json
{
  "tenant_id": "IT12345678901", // Partita IVA o identificatore univoco del tenant
  "last_updated_by": "2041408875",
  "updated_at": "2026-07-16T12:35:00Z",
  "modules": [
    {
      "id": "identity_hub",
      "label": "🏢 Identità & Setup",
      "type": "web_app",
      "url_path": "identity_hub.html",
      "roles_allowed": ["admin"],
      "enabled": true,
      "order": 1
    },
    {
      "id": "catalog",
      "label": "📋 Gestione Aziendale",
      "type": "web_app",
      "url_path": "catalog.html",
      "roles_allowed": ["admin", "operator"],
      "enabled": true,
      "order": 2
    },
    {
      "id": "logistics_operations",
      "label": "⏳ Logistica & Operazioni",
      "type": "callback_menu",
      "callback_data": "tm_menu",
      "roles_allowed": ["admin", "operator"],
      "enabled": true,
      "order": 3
    },
    {
      "id": "intelligence_hub",
      "label": "📊 Intelligence Aziendale",
      "type": "callback_menu",
      "callback_data": "int_",
      "roles_allowed": ["admin"],
      "enabled": true,
      "order": 4
    },
    {
      "id": "support_hub",
      "label": "💬 Centro Supporto",
      "type": "web_app",
      "url_path": "support_hub.html",
      "roles_allowed": ["admin", "operator"],
      "enabled": true,
      "order": 5
    }
  ]
}
```

### 📲 Rendering Dinamico sul Client:
Quando un utente accede alla MiniApp, il frontend effettua una richiesta API al caricamento:
1. Recupera la configurazione del modulo per il proprio `tenant_id`.
2. Se non esiste una configurazione ad-hoc per il tenant, carica un layout di **default** (hardcoded o globale).
3. Cicla sui moduli con `enabled === true` e in cui l'utente possiede i permessi richiesti.
4. Genera dinamicamente gli elementi HTML della griglia/lista dei bottoni all'interno della dashboard.

---

## 🎛️ 5. CLASSIFICAZIONE E ORGANIZZAZIONE DELLE INTERFACCE (`telegram_control`)
Per eliminare ridondanze (rimuovendo il pulsante **SuperVisor Hub** dalla griglia principale della dashboard, ma **mantenendolo regolarmente attivo** all'interno di `catalog.html` per la supervisione dei singoli SKU) e strutturare l'intero workspace, i file presenti in [telegram_control](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control) vengono organizzati secondo questa tassonomia:

### 🏢 1. AREA IMPOSTAZIONI & IDENTITÀ CORE (Setup del Tenant)
Questi file gestiscono i dati anagrafici, fiscali e l'identità del proprietario. Sulla dashboard sono riassunti sotto la voce **Identità & Setup** (accessibile principalmente ad Admin).
*   [identity_hub.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/identity_hub.html): Selettore iniziale per la verticalizzazione del settore merceologico.
*   [edit_owner.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit_owner.html): Anagrafica proprietario e associazione del token del Bot Telegram.
*   [advanced-setup.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/advanced-setup.html) / [advanced-setup-dental.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/advanced-setup-dental.html): Setup avanzato, scomposizione finanziaria dei costi aziendali e link di invito staff.

### 📋 2. AREA GESTIONE AZIENDALE (Il Portale Unico Catalogo)
**Scelta Architetturale**: [catalog.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/catalog.html) funge da *Product Hub* unico. Tutti i file correlati alla gestione dei singoli prodotti/servizi/SOP vengono lanciati unicamente tramite cassetti o frame da qui, evitando di ingolfare la dashboard principale.
*   **Creazione e Inserimento**:
    *   [add-category.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/add-category.html): Creazione nuova categoria merceologica.
    *   [add-product.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/add-product.html): Creazione nuova voce (prodotto/SOP/servizio).
*   **Modifica Dettagli e Contenuti**:
    *   [edit-product.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-product.html) / [edit-semilavorati.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-semilavorati.html) / [edit-article.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-article.html): Edit dei prezzi, delle schede tecniche o delle materie prime (BOM).
    *   [edit-knowledge.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-knowledge.html): Modifica FAQ e manuali per la base di conoscenza AI.
    *   [edit-blueprint.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-blueprint.html) / [edit-blueprint-product.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-blueprint-product.html): Diagramma della logica esecutiva e conformità.
*   **Marketing & Vetrine**:
    *   [edit-blog.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/edit-blog.html): Stesura e modifica degli articoli per il blog.
    *   [minisite.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/minisite.html): Creazione offerte promozionali e landing page.
*   **Supervisione di Dettaglio**:
    *   [supervisor_hub.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/supervisor_hub.html): Esecuzione e monitoraggio dei task associati al *singolo SKU* selezionato dal catalogo (non globale).

### ⏳ 3. AREA LOGISTICA & OPERAZIONI (Time & Logistics Hub)
Gestisce i flussi di evasione temporale e fisica delle attività aziendali. Inizializzato tramite il callback `tm_menu` di Telegram.
*   [orders-manager.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/orders-manager.html) / [order-viewer.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/order-viewer.html): Evasione ed analisi degli ordini e-commerce ricevuti.
*   [job-create.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/job-create.html): Assegnazione e avvio di una nuova commessa lavorativa collegandola al database clienti.
*   [agenda.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agenda.html): Calendario aziendale degli appuntamenti, pianificazione orari staff e prenotazioni.
*   [solver.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/solver.html): Risoluzione guidata delle anomalie o calcolo dei percorsi operativi ("Percorsi AI").

### 📊 4. SUITE DI INTELLIGENCE (Business Analysis Hub)
Aggrega i moduli di analisi strategica, compliance ed esame delle risorse umane a livello globale dell'azienda. Inizializzato dal callback `int_` di Telegram.
*   [agents/agent_intelligence.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/agent_intelligence.html): Dossier di ricerca strategica e benchmark marketing.
*   [agents/analisi-mercato.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/analisi-mercato.html): Scouting geografico e analisi dei competitor territoriali.
*   [agents/controllo_gestione.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/controllo_gestione.html): Controllo di gestione CFO, calcolo margini, distinte base, tassazione ed ENPAM (per verticali dental).
*   [agents/assistente-sicurezza.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/assistente-sicurezza.html) (coadiuvato da [dvr-print-engine.js](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/dvr-print-engine.js) e [dizionario8108.js](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/dizionario8108.js)): Assistente sicurezza sul lavoro, checklist DPI e stampa DVR.
*   **Risorse Umane & Selezione (Sola Lettura Owner)**:
    *   *Nota di Evoluzione*: In futuro, questo blocco verrà unificato nella nuova MiniApp dedicata [agents/risorse_umane.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/agents/risorse_umane.html) per la valutazione complessiva del personale.
    *   [softskill/complete-profile.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/softskill/complete-profile.html) / [onboarding.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/softskill/onboarding.html): Visualizzazione dei profili attitudinali, test comportamentali e mappe delle soft-skill dei candidati (legacy).
    *   [operators/operator_onboarding.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/operators/operator_onboarding.html): Consultazione delle schede anagrafiche dei nuovi operatori ed esame del report del CV analizzato tramite AI (legacy).

### ⚙️ 5. AREA CONTATTO CLIENTE (External Channels Setup)
Configurazione dei canali esterni di vendita e prenotazione.
*   [bot_config.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/bot_config.html): Configurazione del Bot Telegram rivolto ai clienti.
*   [booking.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/booking.html): Portale di prenotazione autonomo esposto al pubblico.
*   [ecommerce.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/ecommerce.html) / [preventivi.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/preventivi.html): Carrello vendite e calcolatore preventivi.

### 💬 6. AREA SUPPORTO & MANUTENZIONE (Support & System)
*   [support_hub.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/support_hub.html) / [handover.html](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/telegram_control/handover.html): Presa in carico manuale della chat clienti e ticket di assistenza.
*   `open_agent_control_center`: Sincronizzazione e allineamento database.

---

## 🛠️ PROSSIMI PASSI PER L'IMPLEMENTAZIONE
Per avviare lo sviluppo sui file fisici una volta approvato l'OdS:
1. **Modificare [dashboard.json](file:///c:/Users/garof/Desktop/TrinAi/SiteBoS-MiniApp/n8n_workflows/n8n_workflow/SiteBoS-App-Hook/dashboard/dashboard.json)**:
   * Ridurre la tastiera inline generata a un singolo pulsante WebApp.
   * Implementare l'endpoint API `/api/dashboard/layout` (GET per caricare, POST per aggiornare).
2. **Creare la Logica Client in MiniApp**:
   * Modificare l'entrypoint della MiniApp per caricare dinamicamente il layout tramite AJAX/Fetch.
   * Costruire l'Admin Panel (visibile solo per `isAdmin === true`) con form di editing e salvataggio dei moduli.
3. **Aggiornare la Sincronizzazione**:
   * Rimuovere i nodi MongoDB di lock/unlock nei flussi asincroni e sostituirli con nodi di modifica dei messaggi Telegram (`editMessageReplyMarkup`).

