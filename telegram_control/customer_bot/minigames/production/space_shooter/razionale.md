# 🧠 Razionale Scientifico & Architettura Psicometrica — Emoji Space Shooter

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/production/space_shooter/`  
> **Scopo:** Decodifica in tempo reale della tolleranza allo stress visuo-motorio, stile di compromesso (Trade-off Rischio/Potenza), gestione del tilt emotivo (*Emotional Damage*) e reattività sotto pressione temporale.

---

### ⚡ Come funziona in 3 passaggi

1. **L'azione fisica:** Il cliente pilota l'astronave con il tocco per 60 secondi in un campo denso di asteroidi, decidendo in frazioni di secondo quali correnti emotive intercettare fisicamente e quali lasciar scorrere.
2. **L'estrazione del segnale:** L'engine traccia ogni collisione e ogni mancata presa divisa per colore (🟢 Sicurezza/Tempo, 🔵 Calma/Fuoco, 🔴 Rischio/Furia), lo scudo residuo e la capacità di sopravvivenza.
3. **La sintesi semantica:** L'algoritmo converte il comportamento in **5 punteggi quantitativi assoluti (0-100)** e tag semantici puri per Gemini prima dell'accoglienza al desk.

---

### 📊 La Matrice dei Trade-Off Psicometrici

```
                             [EMOTION SELECTION]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
  🟢 VERDE (Preservazione)     🔵 BLU (Calibrazione)       🔴 ROSSO (Overclock / Furia)
  • Hit: +Vita, +Tempo         • Hit: Rallenta (Prudenza)  • Hit: -20% Scudo, 3X Sparo
  • Pass: -50% Tempo (Fretta)  • Pass: 2X Sparo, -10% Vita • Pass: -10s Tempo, +Velocità
```

---

### 🔬 Mappatura Psicometrica & Formule Matematiche

#### 1. Bisogno di Sicurezza & Autotutela (`certainty_and_safety_score`)
- **Formula:**
  $$\text{SafetyScore} = \max\left(0, \min\left(100, \text{round}\left(\text{currentShield} \times 0.5 + (\text{greenTaken} \times 8) - (\text{redTaken} \times 12) - (\text{bluePassed} \times 5)\right)\right)\right)$$
- **Significato:** Misura quanto il cliente protegge la propria riserva vitale (scudo) rispetto alla tentazione di spendere salute per ottenere vantaggi offensivi.
  - $\ge 75$: *Profilo Difensivo / Anti-Rischio*. Cerca protezione, stabilità e garanzie solide.
  - $< 40$: *Profilo Adrenalinico / Alto Rischio*. Pronto a sacrificare margini pur di ottenere risultati immediati.

#### 2. Propensione all'Overclock & Upsell Aggressivo (`upsell_greed_score`)
- **Formula:**
  $$\text{UpsellGreedScore} = \min\left(100, \text{round}\left((\text{redTaken} \times 20) + (\text{bluePassed} \times 15) + (\text{totalScore} \times 1.2)\right)\right)$$
- **Significato:** Misura l'attrazione verso i moltiplicatori di potenza (2X e 3X). Chi cerca attivamente il fuoco potenziato risponde con entusiasmo a pacchetti avanzati ad alte prestazioni.

#### 3. Pazienza Tattica & Controllo dell'Impulso (`tactical_patience_score`)
- **Formula:**
  $$\text{PatienceScore} = \max\left(0, \min\left(100, \text{round}\left(100 - (\text{redTaken} \times 15) - (\text{shieldHits} \times 8) + (\text{greenTaken} \times 5)\right)\right)\right)$$
- **Significato:** Rileva la capacità di evitare collisioni dannose con asteroidi ed evitare di cedere alla foga (*Berserk tilt*). Se basso, indica impazienza operativa e reattività d'istinto.

#### 4. Adesione alle Regole & Sopravvivenza Operativa (`rule_compliance_score`)
- **Formula:**
  $$\text{ComplianceScore} = \text{isShipDestroyed} \ ?\ \max(30, \text{round}(\text{totalScore} \times 1.5)) : \min(100, 70 + \text{round}(\text{currentShield} \times 0.3))$$
- **Significato:** Misura la capacità di completare la sessione senza farsi distruggere lo scudo, rispettando i limiti fisici dell'ambiente.

#### 5. Rilassamento Somatico & De-Escalation Ansia (`somatic_relaxation_score`)
- **Formula:**
  $$\text{SomaticRelaxScore} = \max\left(20, \min\left(100, \text{round}\left(70 + (\text{greenTaken} \times 6) - (\text{redTaken} \times 10) - (\text{shieldHits} \times 6)\right)\right)\right)$$
- **Significato:** Valuta se l'interazione è stata fluida e rilassata o caratterizzata da micro-panico e frequenti impatti con gli ostacoli.

---

### 🎭 Sintesi Archetipica

1. **`BERSERK_OVERCLOCK_SEEKER`**: Frequenti impatti su 🔴 Rosso (cerca la potenza 3X a spese dello scudo).  
   *Profilo Staff:* Cliente audace, diretto, focalizzato su risultati massimi; proporre soluzioni top di gamma senza dilungarsi in cautele.
2. **`CALCOLATORE_DI_POTENZA`**: Fa passare 🔵 Blu per attivare il 2X e bilancia lo scudo con il 🟢 Verde.  
   *Profilo Staff:* Pragmatico, orientato all'efficienza e all'ottimizzazione costi/benefici.
3. **`DIFENSORE_DELLO_SCUDO`**: Raccoglie solo 🟢 Verde, mantiene lo scudo al 100%, evita rischi.  
   *Profilo Staff:* Richiede rassicurazioni, trasparenza e formule garantite.
4. **`SCHIVATORE_EVASIVO`**: Lascia passare la maggior parte delle emoji, navigazione evasiva.  
   *Profilo Staff:* Bassa assertività iniziale, approccio accogliente ed empatico per metterlo a proprio agio.

---

### 📦 Esempio Payload NoSQL (Cosa riceve Gemini AI)

```json
{
  "session_id": "SITEBOS_SPACE_1770973200",
  "game_id": "space_shooter_arena",
  "game_title": "Emoji Space Shooter",
  "timestamp": "2025-02-14T12:30:00.000Z",
  "semantic_intelligence": {
    "primary_archetype": "BERSERK_OVERCLOCK_SEEKER",
    "communication_style": "SINTETICO_DRITTO_AL_SODO",
    "metrics_scores": {
      "certainty_and_safety_score": 38,
      "tactical_patience_score": 45,
      "upsell_greed_score": 88,
      "rule_compliance_score": 85,
      "somatic_relaxation_score": 42
    },
    "semantic_tags": [
      "Propensione Al Rischio Estremo",
      "Massimizzatore Di Prestazioni",
      "Overclock Seeker",
      "Alta Tolleranza Volatilità",
      "Decisione Istintiva"
    ],
    "behavioral_descriptors": [
      "accetta attivamente danni allo scudo per massimizzare la cadenza di fuoco",
      "orientamento all'azione rapida e al superamento aggressivo degli ostacoli",
      "bassa avversione alle perdite contingenti a fronte di grandi moltiplicatori"
    ]
  },
  "raw_telemetry": {
    "decisions_total_score": 34,
    "current_shield_pct": 60,
    "green_emojis": { "taken": 2, "passed": 1 },
    "blue_emojis":  { "taken": 0, "passed": 4 },
    "red_emojis":   { "taken": 3, "passed": 1 },
    "asteroid_shield_hits": 2,
    "session_duration_sec": 60,
    "ship_survived": true
  }
}
```
