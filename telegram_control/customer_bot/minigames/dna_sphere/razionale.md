# 🔮 Razionale Scientifico & Architettura Sinaptica 3D — Sfera Neurale DNA

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/dna_sphere/`  
> **Scopo:** Visualizzazione olistica tridimensionale interattiva (28 Nodi Geodetici Sinaptici) di tutte le metriche psicometriche estratte dai minigiochi e salvate in `localStorage` / `sessionStorage`, pronte per la Desk Board della Reception.

---

### ⚡ Come funziona in 3 passaggi

1. **Aggregazione Dati Real-Time**: All'apertura, il motore 3D esegue una scansione e deserializzazione di tutti i payload di gioco presenti nel client (`SITEBOS_DNA_MODULES_STATE_V1`, `SITEBOS_PACHINKO_RESCUE_STATE_V1`, `SITEBOS_SPIN_WIN_STATE_V1`, `SITEBOS_SPACE_SHOOTER_STATE_V1`, `SITEBOS_PIZZA_NOCTURNA_V1`, `SITEBOS_POCKET_PET_V1`, `SITEBOS_LITTLE_GARDEN_V1`).
2. **Mappatura Geodetica Sferica & Sinapsi**:
   - I **28 nodi** vengono posizionati secondo la spirale geodetica di **Fibonacci** su una sfera tridimensionale.
   - Ogni nodo possiede un raggio ed un'intensità emissiva proporzionali allo score ottenuto (0-100).
   - **Linee Sinaptiche Dinamiche** (`THREE.LineSegments`) collegano i nodi affini per categoria e per prossimità topologica.
3. **Ispezione & Sintesi Reception**: Il cliente o l'operatore possono ruotare la sfera in 3D con gesture touch / mouse orbit, toccare un nodo per aprire la scheda di dettaglio e sincronizzare la mappa finale con la segreteria.

---

### 🌐 I 5 Cluster Sinaptici (28 Nodi Totali)

| Cluster | Colore | Nodi Principali | Origine Dati |
| :--- | :---: | :--- | :--- |
| **🟣 DNA Core** | Viola | Mente, Cuore, Energia, Guardia, Flusso | `indovino_chi_sei` |
| **💖 Empatia & Cura** | Rosa/Fucsia | Nurturing Empathy, Affectionate Warmth, Relational Empathy, Emotional Patience, Care Taking | `pocket_tamagotchi`, `pizza_dev` |
| **🟡 Rischio & Greed** | Ambra | Financial Risk, Expansion Greed, Upsell Appetite, Loss Chasing, Tactical Greed | `spin_win`, `space_shooter`, `pizza_dev`, `pachinko_rescue` |
| **🟢 Calma & Mindfulness** | Smeraldo | Mindfulness Focus, Stress De-Escalation (98/100), Somatic Calm, Organic Patience, Tactical Patience | `little_garden`, `pocket_tamagotchi`, `pachinko_rescue` |
| **⚪ Precisione & Regole** | Ciano/Blu | Perfectionism, Fine Precision Tuning, Aesthetic Harmony, Process Compliance, Rule Adherence | `little_garden`, `pizza_dev`, `space_shooter`, `pachinko_rescue` |
