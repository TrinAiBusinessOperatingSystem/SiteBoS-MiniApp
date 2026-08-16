# 🧠 Razionale Scientifico & Architettura Customer — Indovino Chi Sei! (10 Tappe & Scheda Chi Sei!)

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/production/indovino_chi_sei/`  
> **Scopo:** Esperienza d'intrattenimento customer in sala d'attesa su **70 quesiti distribuiti in 10 tappe tematiche**, con scheda grafica **"Chi sei!" a sfondo bianco con icone fluttuanti**, singola chiamata webhook per Gemini AI (`action: "customer_evaluation"`), calcolo delle **sfaccettature del carattere** e montepremi fino a **+500 PT**.

---

### 🎨 Tono di Voce & Esperienza Customer (Zero Linguaggio Corporate)

L'interfaccia adotta un registro fresco, accogliente e piacevole per il cliente:

- **Nome del Gioco**: *"Indovino chi sei!"*
- **Sottotitolo**: *"Scopri i tuoi superpoteri in 10 tappe e vinci fino a +500 Punti!"*
- **Le 3 Viste di Navigazione**:
  - `[ 📋 I 10 Capitoli ]`: La griglia delle 10 card per scegliere quale tappa affrontare.
  - `[ ✏️ Domande ]`: Le 7 scelte istintive per ciascun capitolo.
  - `[ ✨ Chi sei! ]`: La scheda finale con la costellazione 3D a sfondo bianco e le tue caratteristiche uniche.

---

### 🌟 La Rete Geometrica "Chi sei!" a Sfondo Bianco

Sostituisce il vecchio rendering scuro con una visualizzazione pulita e luminosa:

1. **Sfondo Bianco Puro (`#ffffff`)**: Design accattivante e moderno in Three.js con costellazione geometrica chiara.
2. **I 5 Nodi con Icone Vettoriali Fluttuanti**:
   - 🧠 **Mente** (Ciano `#0284c7`): *Logica, curiosità e intuito strategico*
   - ❤️ **Cuore** (Rosa/Rosso `#e11d48`): *Empatia, ascolto e calore umano*
   - ⚡ **Energia** (Ambra `#d97706`): *Grinta, passione e leadership*
   - 🛡️ **Guardia** (Smeraldo `#059669`): *Affidabilità, tutela e sicurezza*
   - 🌊 **Flusso** (Indaco `#4f46e5`): *Flessibilità, spontaneità e creatività*
3. **Archi di Connessione delle Sfaccettature**: Linee geometriche eleganti collegano i nodi nello spazio per evidenziare i legami tra i diversi tratti del cliente.

---

### 🔗 Matrice delle 6 Sfaccettature del Carattere (Customer-Friendly)

Con tutte le 70 risposte inviate in un'unica chiamata, l'engine individua le sfumature incrociate:

1. 🔹 **Mente + Guardia**: *Stratega Prudente* (Pondera bene e non sbaglia un colpo).
2. 🔹 **Energia + Flusso**: *Spirito Innovativo* (Trova soluzioni brillanti e fuori dagli schemi).
3. 🔹 **Cuore + Guardia**: *Amico Leale* (Un punto di riferimento solido e fidato).
4. 🔹 **Mente + Energia**: *Guida Risoluta* (Trasforma le idee in risultati concreti).
5. 🔹 **Cuore + Flusso**: *Armonia Spontanea* (Porta serenità e fa sentire tutti a proprio agio).
6. 🔹 **Guardia + Flusso**: *Resilienza Positiva* (Supera ogni imprevisto con agilità e buonumore).

---

### 📡 Singola Chiamata Webhook a Gemini AI (`action: "customer_evaluation"`)

Al termine dei 10 capitoli (o al tap su "Sblocca il Premio Finale"), la MiniApp invia la richiesta POST verso l'endpoint di produzione:  
`https://prod.workflow.trinai.it/webhook/80d663ea-be4b-4d42-8cc1-05f4ada52ced`

```json
{
  "action": "customer_evaluation",
  "game_id": "dna_quiz_sphere",
  "total_questions": 70,
  "total_modules": 10,
  "completed_modules_count": 10,
  "accumulated_scores": { "mente": 140, "cuore": 60, "energia": 50, "guardia": 115, "flusso": 70 },
  "normalized_dna_scores": { "mente": 88, "cuore": 52, "energia": 42, "guardia": 78, "flusso": 60 },
  "character_facets": {
    "strategia_prudente": 83,
    "spirito_innovativo": 51,
    "cuore_leale": 65,
    "leadership_attiva": 65,
    "armonia_creativa": 56,
    "resilienza_positiva": 69
  },
  "choice_rationales": [ ...tutti i 70 razionali delle scelte... ],
  "timestamp": "2026-08-14T13:15:00.000Z"
}
```

- **Responso di Gemini Flash Lite**:
  - **Per il Cliente (`evaluation`)**: Proiettato nella card **`💡 Cosa dice il tuo profilo`** con il titolo dell'archetipo, il ritratto psicologico, i 3 superpoteri e il consiglio di evoluzione.
  - **Per la Reception Desk Board (`upsell_intelligence`)**: Dati psicometrici e commerciali riservati con i 5 punteggi quantitativi assoluti (`certainty_and_safety_score`, `tactical_patience_score`, `upsell_greed_score`, `rule_compliance_score`, `somatic_relaxation_score`), tag semantici senza `#`, tono di approccio consigliato, driver di vendita e gestione obiezioni.
- **Sblocco Premi**: Sblocca il Mega Premio finale di **`+500 PT`** per la Desk Board.
