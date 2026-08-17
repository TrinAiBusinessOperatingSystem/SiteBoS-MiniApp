# CLAUDE.md — SiteBoS-MiniApp

## Lingua
Con l'utente si comunica **sempre in Italiano**. Tutte le risposte, i riepiloghi e le domande di chiarimento devono essere in italiano, indipendentemente dalla lingua del codice o dei commit.

## Fonte di Verità del Progetto
Questo repository ha un intero sistema di regole, ruoli agentici e contesto tecnico già impostato nella cartella `.agents/`. **Prima di iniziare qualunque task, consultare:**

- `.agents/AGENTS.md` — Regole tassative di architettura, sicurezza, UI/UX e protocollo operativo (Antigravity Workspace Rules v3.0). È il documento principale e ha priorità su qualsiasi comportamento di default.
- `.agents/roles/` — Schede dei singoli agenti dello swarm (Agente 0 Master Orchestrator, Agente 1 Selettore, Agente 2 UI/UX, Agente 3 Frontend TWA, Agente 4 Backend n8n, Agente 5 Auditor, Agente 6 Self-Learning, Agente 7 Prompt Engineer).
- `.agents/context/` — Knowledge Base tecnica: struttura repository, indice semantico, mapping frontend/backend/DB, standard n8n, stato produzione, API esterne, schemi MongoDB (`database_structure/`).
- `.agents/tasks/` — Ordini di Servizio (OdS) in Markdown con frontmatter YAML, che tracciano stato e specifiche di ogni intervento.
- `.agents/skills/n8n-architect/SKILL.md` e `.github/agents/n8n-architect.agent.md` — Skill dedicata per lo sviluppo e la sincronizzazione dei workflow n8n tramite `n8nac`.
- `GRAPH_REPORT.md` e `graphify-out/graph.json` — Knowledge Graph della codebase, da consultare prima di ricerche estese sul codice.

## Regole Chiave da Rispettare Sempre
- **Zero Build Tools**: Frontend 100% Vanilla HTML5 + JS ES6+, Tailwind CDN, FontAwesome 6. Nessun bundler, nessun `node_modules`.
- **Mobile-First TWA**: Palette scura, glassmorphism, bottom navigation, `window.Telegram.WebApp` (theme, HapticFeedback).
- **Backend n8n**: modifiche ai workflow (`n8n_workflow/`) SOLO tramite `n8nac` (pull → editing → validate → approvazione utente → push).
- **Implementation Plan Obbligatorio**: nessuna modifica a file sorgente senza un `implementation_plan.md` approvato esplicitamente dall'utente, per ogni sviluppo, refactoring o restyling.
- **Zero-Assumption Rule**: non alterare mai la logica di routing/stato preesistente durante restyling o refactoring; leggere sempre integralmente il file prima di modificarlo.
- **Atomic Edits**: per modifiche minori, sostituzioni mirate riga per riga; mai replace massivi su template multilinea con backtick.
- **Nomi estesi**: mai abbreviazioni, mai parentesi `()`/`[]` nei titoli o nelle etichette visibili all'utente.

Per il dettaglio completo di ogni regola fare riferimento a `.agents/AGENTS.md`, che resta la fonte di verità autorevole e viene mantenuto aggiornato autonomamente dall'Agente 6.
