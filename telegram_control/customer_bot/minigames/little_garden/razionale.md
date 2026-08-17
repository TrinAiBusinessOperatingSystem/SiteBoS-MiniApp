# 🍎 Razionale Scientifico & Architettura — SiTeBoS Frutteto Incantato 2D

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)
> **Componente:** `telegram_control/customer_bot/minigames/little_garden/`
> **Modello di Gioco:** Ecosistema Ciclico 2D — Acqua → Crescita Automatica & Rischio Vermi → Frutta Caduta → Caprette Richiamabili → Concime → Crescita Accelerata → Raccolta a 1 Punto per Frutto.
> **Scopo:** Come tutti gli altri minigiochi della suite, la profilazione è puramente strumentale al **Pre-Job Briefing per Gemini Staff alla Desk Board**: ogni vettore non descrive solo un tratto comportamentale astratto, ma un segnale diretto su **tono di accoglienza e leva commerciale/upsell** da usare col cliente quando si alza dalla sala d'attesa.

---

### ⚡ Il Ciclo dell'Ecosistema

| Componente | Meccanica | Conseguenza / Beneficio |
| :--- | :--- | :--- |
| **🚿 Annaffiatoio** | Attrezzo impugnabile, tocco libero sullo schermo | Mantiene alta l'acqua dell'albero; sopra il 45% la crescita automatica dei frutti procede da sola nel tempo |
| **🐛 Vermi** | Comparsa spontanea, probabilità maggiore con acqua > 60% | Mangiano un frutto maturo, che cade a terra rovinato invece di sparire |
| **🧴 Spruzzino** | Attrezzo impugnabile, elimina i vermi in un raggio di 90px dal tocco | Prevenzione, ma con un costo: ogni uso stressa la pianta (-acqua); se abusato di fila (stress chimico ≥ 60/100) un frutto cade e il danno raddoppia — dosare, non spammare |
| **🍂 Frutta Caduta** | Frutto rovinato a terra, non raccoglibile col Cestino | Si decompone da sola dopo 30s se nessuno interviene |
| **🐐 Caprette** | Attrezzo richiamabile, si dirigono da sole verso la frutta caduta più vicina e la mangiano | Lasciano un mucchietto di concime dopo aver mangiato |
| **💩 Concime** | Raccoglibile con un tocco (qualunque attrezzo impugnato) | Accelera il timer di ricrescita del prossimo frutto |
| **🧺 Cestino** | Attrezzo impugnabile, raccoglie i frutti MATURI in un raggio di 65px dal tocco | **Unica fonte di punteggio: +1 Punto per ogni frutto raccolto** |

---

### 📊 I 5 Vettori Psicometrici (0-100)

1. **`organizational_resource_score`** (Organizzazione & Gestione delle Risorse): media e uniformità del livello d'acqua mantenuto sui 5 alberi durante la sessione — punteggio alto indica un giardiniere metodico che non trascura nessun albero.
2. **`proactive_prevention_score`** (Prevenzione Proattiva): quota di bruchi eliminati con lo spruzzino PRIMA che danneggiassero un frutto, rispetto al totale delle minacce affrontate.
3. **`circular_sustainability_score`** (Economia Circolare & Sostenibilità): quota di frutta caduta effettivamente riciclata in concime richiamando le caprette, invece di lasciarla decomporre.
4. **`harvest_diligence_score`** (Diligenza di Raccolta): quota di frutta effettivamente raccolta sul totale generato durante la sessione (raccolta + persa ai vermi) — segnala un cliente che nota subito se manca qualcosa e non tollera valore lasciato sul tavolo.
5. **`calm_pacing_score`** (Calma & Ritmo di Gioco): tocchi al minuto nella vista albero — ritmo disteso e riflessivo vs frenetico e compulsivo.

---

### 🎭 Matrice degli Archetipi & Direttive Desk Reception

| Archetipo | Trigger | Tono di Accoglienza | Leva Commerciale / Upsell |
| :--- | :--- | :--- | :--- |
| **`ORGANIZZATORE_METODICO_DEL_FRUTTETO`** | `organizational_resource_score >= 80` | Rassicurante e strutturato, passaggi chiari e conferme esplicite | Documentazione completa, processi tracciabili, garanzie scritte |
| **`GUARDIANO_PREVENTIVO_VIGILE`** | `proactive_prevention_score >= 80` | Diretto e concreto, valorizza chi previene i problemi | Pacchetti di manutenzione preventiva, controlli periodici, garanzie estese |
| **`CUSTODE_CIRCOLARE_ECOLOGICO`** | `circular_sustainability_score >= 75` | Attento alla sostenibilità, apprezza trasparenza sull'impatto | Opzioni eco-friendly, programmi di riuso/riciclo, materiali a basso impatto |
| **`RACCOGLITORE_INSTANCABILE`** | `harvest_diligence_score >= 80` | Puntuale e dettagliato: nota subito se manca un'informazione | Pacchetti "tutto incluso" elencati per intero — la percezione di completezza è la leva più efficace |
| **`ANIMO_ZEN_CONTEMPLATIVO`** | `calm_pacing_score >= 90` | Calmo e senza fretta, spazio per riflettere | Presentazione morbida, follow-up leggero invece di chiusura forzata |
| **`GIARDINIERE_EQUILIBRATO`** | default, nessuna soglia superata | Colloquiale ed equilibrato | Presentazione standard, nessuna leva dominante |

Il payload `generateTelemetry()` restituisce anche `communication_style` e `reception_actionable_directives` (tono + proposta commerciale) accanto ai punteggi grezzi, così l'operatore alla desk board riceve un'istruzione già pronta all'uso, non solo numeri da interpretare.
