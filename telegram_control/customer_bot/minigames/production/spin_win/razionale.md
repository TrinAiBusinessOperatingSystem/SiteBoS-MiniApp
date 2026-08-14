# 🧠 Razionale Scientifico & Architettura Psicometrica — La Ruota della Fortuna

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/production/spin_win/`  
> **Scopo:** Decodifica della propensione al rischio finanziario, tolleranza alla volatilità e comportamento di rilancio (*Loss Chasing*) del cliente in sala d'attesa.

---

### ⚡ Come funziona in 3 passaggi

1. **L'azione fisica:** Il cliente parte con un budget iniziale di **250 PT** e seleziona la puntata (1 PT fino a 100% del budget via Gauge, oppure chip rapide MIN/25%/50%/ALL-IN) per girare la ruota con fisica ad inerzia.
2. **L'estrazione del segnale:** L'engine misura l'aggressività delle puntate rispetto al capitale, l'eventuale reazione emotiva post-perdita (*Loss Chasing* = aumento puntata subito dopo un esito negativo), la frequenza dei giri al minuto e la resilienza ai moltiplicatori bassi.
3. **La sintesi semantica:** L'algoritmo converte il comportamento in **5 punteggi quantitativi assoluti (0-100)**, tag semantici puliti (senza `#`) e descrittori comportamentali puri, trasmettendoli in tempo reale a Gemini AI per il Pre-Job Briefing alla reception.

---

### 📊 Distribuzione a Campana Ricalibrata & Effetto Near-Miss (16 Spicchi: 1, 2, 3, 3, 3, 3, 1)

La ruota adotta **16 spicchi** con una sequenza simmetrica a doppio rilancio attorno al Jackpot (Spicchi 14-15-0-1-2):

| Moltiplicatore | Numero Spicchi | Probabilità | Fascia Gaussiana | Tipo Esito | Rilevanza Psicometrica & Near-Miss |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **x2.50** | **1** | **6.25%** | Coda Destra (Raro) | MAX WIN (Jackpot) | **Spicchio 0 (Ore 12)**: Massima ambizione |
| **x1.75** | **2** | **12.50%** | Coda Destra | WIN Solido | **Spicchio 2 (Ore 2) e Spicchio 14 (Ore 10)**: Rilancio simmetrico |
| **x1.25** | **3** | **18.75%** | Fianco Destro | WIN Moderato | Guadagno calibrato frequente |
| **x1.00** | **3** | **18.75%** | **Picco Campana** | NEUTRAL | Preservazione del capitale senza oscillazioni |
| **x0.75** | **3** | **18.75%** | Spalla Sinistra | SOFT LOSS | Piccola erosione: verifica la costanza della puntata |
| **x0.50** | **3** | **18.75%** | Fianco Sinistro | LOSS Sensibile | **Spicchio 15 (Ore 11)**, **Spicchio 3 (Ore 3)** e Spicchio 10 |
| **x0.25** | **1** | **6.25%** | Coda Sinistra (Unico) | MAX LOSS | **Spicchio 1 (Ore 1)**: Trappola Near-Miss a destra di x2.50 |

- **Valore Atteso (EV):**  
  $$E[X] = \frac{1(2.50) + 2(1.75) + 3(1.25) + 3(1.00) + 3(0.75) + 3(0.50) + 1(0.25)}{16} = \frac{16.75}{16} = \mathbf{1.0469}$$  
  Il valore atteso garantisce un ritorno positivo del **+4.69%**, ideale per un gioco fluido e premiante in sala d'attesa.

---

### 🔬 Mappatura Psicometrica & Formule Matematiche

#### 1. Bisogno di Sicurezza Finanziaria (`certaintyScore`)
- **Formula:**
  $$\text{CertaintyScore} = \max\left(0, \min\left(100, \text{round}\left(100 - (\text{avgBetPct} \times 0.7 + \text{chasingCount} \times 15)\right)\right)\right)$$
- **Significato:** Chi scommette quote minime fisse (MIN) e non reagisce alle perdite ha un bisogno di certezza assoluto. Alla reception richiede preventivi a prezzo bloccato e garanzie chiare.

#### 2. Propensione all'Upsell & High-Yield (`upsellGreedScore`)
- **Formula:**
  $$\text{UpsellGreedScore} = \min\left(100, \text{round}(\text{avgBetPct} \times 0.8 + (\text{maxBetUsed} \ ?\ 20 : 0))\right)$$
- **Significato:** Misura l'appetito per opportunità ad alto valore aggiunto. Chi usa chip da 50% o ALL-IN è naturalmente recettivo verso upgrade, servizi prioritari e pacchetti esclusivi.

#### 3. Pazienza Tattica & Stabilità Emotiva (`tacticalPatienceScore`)
- **Formula:**
  $$\text{TacticalPatienceScore} = \max(0, 100 - \text{chasingCount} \times 30)$$
- **Significato:** Rileva il fenomeno del *Loss Chasing* (rilanciare la puntata subito dopo un giro negativo per recuperare). Se elevato, indica reattività emotiva alle perdite; Gemini calibrerà un approccio rassicurante.

#### 4. Adesione alle Regole & Compliance (`ruleComplianceScore`)
- **Formula:**
  $$\text{RuleComplianceScore} = \max(0, 100 - \text{earlyClaimAttempts} \times 25)$$
- **Significato & Vincolo dei 3 Giri Minimi:**
  - **Campione Statistico Minimo:** Con 0 o 1 solo giro non esiste varianza comportamentale per calcolare il *Loss Chasing* o la *Tolleranza al Rischio*. 3 giri rappresentano la sequenza minima per osservare calibrazione, reazione all'esito e aggiustamento della puntata.
  - **Anti-Free-Riding:** Impedisce al cliente di incassare passivamente senza interagire con l'esperienza di benvenuto.
  - **Misurazione Impulsività:** Cliccare sul pulsante d'incasso bloccato (`🔒 INCASSA (X/3)`) prima del 3° giro decrementa il punteggio di compliance e segnala a Gemini un profilo *Insofferente ai Vincoli*.

#### 5. Tensione Somatica & Ritmo di Gioco (`somaticRelaxationScore`)
- **Formula:**
  $$\text{SpinsPerMin} = \frac{\text{totalSpins}}{\text{durationSec}} \times 60$$
  $$\text{SomaticRelaxationScore} = \text{SpinsPerMin} > 18 \ ?\ 35 : (\text{SpinsPerMin} > 10 \ ?\ 65 : 95)$$
- **Significato:** Rileva se il cliente gioca in modo compulsivo/ansioso o con un pacing disteso e riflessivo.

---

### 🎭 Sintesi Archetipica

1. **`MAX_ALL_IN_RISK_TAKER`**: Usa la puntata massima (ALL-IN) o punta $>70\%$ del budget. Aperto a grandi scommesse, decisioni immediate.
2. **`HIGH_YIELD_STRATEGIST`**: Puntate alte costanti ma senza tilt o chasing dopo le perdite. Ottimo target per preventivi premium complessi.
3. **`REATTIVO_LOSS_CHASER`**: Rilancia dopo ogni sconfitta per recuperare. Sensibile alle clausole di salvaguardia ("Soddisfatti o Rimborsati").
4. **`PRESERVATORE_DEL_CAPITALE`**: Puntata minima fissa, avversione al rischio, richiede trasparenza e zero costi variabili.
5. **`PRUDENTE_CALCOLATORE`**: Puntate intermedie, gestione bilanciata del paniere.

---

### 📦 Esempio Payload NoSQL (Cosa riceve Gemini AI)

```json
{
  "session_id": "SITEBOS_SPIN_1770973200",
  "game_id": "spin_win_wheel",
  "game_title": "La Ruota della Fortuna",
  "timestamp": "2025-02-14T12:00:00.000Z",
  "semantic_intelligence": {
    "primary_archetype": "HIGH_YIELD_STRATEGIST",
    "communication_style": "SINTETICO_DRITTO_AL_SODO",
    "metrics_scores": {
      "certainty_and_safety_score": 38,
      "tactical_patience_score": 100,
      "upsell_greed_score": 85,
      "rule_compliance_score": 95,
      "somatic_relaxation_score": 95
    },
    "semantic_tags": [
      "Alta Tolleranza Volatilità",
      "Propensione Al Rischio",
      "Massimizzatore Di Rendimento",
      "Forte Propensione Upsell",
      "Target Pacchetti Premium",
      "Disciplina Finanziaria",
      "Stabilità Decisionale",
      "Pacing Disteso"
    ],
    "behavioral_descriptors": [
      "bassa percezione del rischio e apertura a dinamiche ad alto rendimento",
      "attratto da moltiplicatori elevati e disposto a investire quote importanti del budget",
      "mantiene la lucidità strategica indipendentemente dagli esiti negativi",
      "interazione calma con intervalli regolari di riflessione"
    ]
  },
  "raw_telemetry": {
    "initial_budget_pt": 250,
    "current_budget_pt": 313,
    "current_bet_pt": 25,
    "average_bet_pt": 25,
    "average_bet_pct_budget": 10,
    "total_spins": 3,
    "win_spins": 2,
    "loss_spins": 1,
    "session_roi_pct": 125,
    "loss_chasing_events": 0,
    "spins_per_minute": 6.2,
    "session_duration_sec": 29,
    "formatted_time": "00:29",
    "game_status": "ATTIVO",
    "distribution_type": "GAUSSIAN_BELL_CURVE_X2.5_TO_X0.25"
  }
}
```

---

### 🏛️ Conformità AI Act UE (Art. 27 & Scrutabilità Algoritmica)

- **Logica del Modello (ex Art. 27 AI Act)**: La decodifica psicometrica avviene mediante regole deterministiche chiare e scrutabili (nessuna black box non verificabile).
- **Assenza di Profilazione Punitiva**: Le metriche servono unicamente a personalizzare il comfort dell'accoglienza in sala d'attesa e il tono di voce della reception, senza alcun impatto negativo per l'utente.
