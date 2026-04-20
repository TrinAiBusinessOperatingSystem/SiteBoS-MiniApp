# Telegram Control: Management & Runtime UI

Questa cartella contiene i componenti dell'interfaccia utente (UI) per la gestione dei bot Telegram e le sessioni di runtime. Il sistema utilizza le **Telegram Web Apps (TWA)** per offrire un'esperienza premium direttamente all'interno della chat.

## Struttura della Cartella

### 1. WebApp di Gestione (Owner)
Queste pagine permettono all'Owner di configurare il proprio sistema:
- `edit_owner.html`: Dashboard principale per la gestione del profilo, P.IVA e chiavi API.
- `bot_config.html`: Pannello di controllo per le personalità e le restrizioni del bot clienti.
- `edit-product.html` & `edit-blueprint.html`: Interfacce per la gestione del catalogo servizi e delle procedure (SOP).
- `edit-knowledge.html`: Editor per la Knowledge Base aziendale.
- `edit-blog.html` & `minisite.html`: Strumenti di design e pubblicazione per la presenza online.

### 2. Strumenti Operativi
- `assistant.html`: Hub per il controllo degli agenti e il billing dei crediti.
- `certificator.html`: Wizard per la certificazione guidata dei processi aziendali.
- `handover.html`: Gestione del passaggio della chat da AI a operatore umano.
- `ticket.html`: Sistema di ticketing e supporto tecnico.

### 3. Moduli Specializzati
- `softskill/`: Un sottomodulo interattivo (150 domande) per la valutazione delle competenze trasversali.
- `legal.html`: Centro di conformità legale (Privacy Policy, GDPR, AI Act disclaimer).

## Sviluppo & Design
Tutte le interfacce seguono lo stile **`dark-tech`** definito nel `project_dna.md`:
- **Framework**: Tailwind CSS.
- **Font**: Plus Jakarta Sans.
- **Pattern**: Glassmorphism e bordi arrotondati (radius 24px).
- **Integrazione**: Utilizzo del `Telegram.WebApp` SDK per l'autenticazione e il ritorno dei dati ai workflow n8n.

## Workflow Correlati
La maggior parte delle azioni compiute in queste pagine invia un Webhook al workflow `processor` o alla `dashboard` su n8n, che poi instrada la richiesta verso i database persistenti (`MemoryManager`, `AssetLake`).

---
> [!TIP]
> Per testare localmente una WebApp, utilizzare un server HTTP (es. `python -m http.server`) e un tunnel (es. ngrok) per permettere a Telegram di caricare l'URL HTTPS.
