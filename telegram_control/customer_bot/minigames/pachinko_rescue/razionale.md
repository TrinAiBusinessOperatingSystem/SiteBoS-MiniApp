# 🧠 Razionale Scientifico & Architettura Psicometrica — Pachinko Rescue

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/production/pachinko_rescue/`  
> **Scopo:** Decodifica comportamentale non-invasiva del cliente in sala d'attesa e generazione in tempo reale del Pre-Job Briefing per Gemini alla Reception.

---

### ⚡ Come funziona in 3 passaggi

1. **L'azione fisica:** Il cliente in sala d'attesa gioca su mobile toccando le bombe per salvare i premi, aggiungendo elementi (`+`) o forzando il riscatto (`🔒`).
2. **L'estrazione del segnale:** L'engine misura istante per istante i millisecondi, gli errori di contatto, l'avidità di punti e il rispetto delle regole.
3. **La sintesi semantica:** Questi numeri vengono convertiti in **5 punteggi assoluti (0-100)** e in **tag psicologici puri**, che vengono sparati a Gemini prima che il cliente si alzi.

---

### 📊 Cosa mappa nello specifico (I 5 Vettori)

| Vettore Mappato | Azione nel Gioco | Cosa rivela alla Reception |
| :--- | :--- | :--- |
| **1. Bisogno di Sicurezza** | Attende l'isolamento della bomba; non aggiunge rischi; riscatta subito. | Vuole **prezzi bloccati, garanzie scritte e zero imprevisti**. |
| **2. Propensione all'Upsell (Greed)** | Preme il tasto `+` per generare più premi (accettando nuove bombe). | Profilo aperto ad **add-on premium, pacchetti completi e bundle**. |
| **3. Pazienza Tattica** | Calibra i tocchi senza distruggere i premi vicini per la fretta. | Definisce lo stile: **spiegazione analitica/tecnica vs sintesi rapida al sodo**. |
| **4. Rispetto delle Regole** | Clicca compulsivamente su `🔒` quando è ancora bloccato. | Misura l'insofferenza: **se alto, semplificare moduli e burocrazia**. |
| **5. Tensione Motoria (Ansia)** | Frequenza frenetica di tocchi e oscillazioni dello smartphone. | Rileva lo stato emotivo: **livello di stress/ansia pre-visita**. |

---

### 🔬 La Spiegazione del "Come": Algoritmo di Calcolo e Formule Matematiche

Il motore semantico `evaluateSemanticProfile(data)` estrae il profilo incrociando i seguenti parametri grezzi:

#### 1. Bisogno di Sicurezza & Controllo (`certaintyScore`)
- **Formula:**
  $$\text{Protection} = \max(0, 1 - \text{collateralRate}) \times 40$$
  $$\text{RiskRefusal} = \text{extraSpawns} = 0 \ ?\ 30 : \max(0, 30 - \text{extraSpawns} \times 10)$$
  $$\text{Compliance} = \text{ruleClicks} = 0 \ ?\ 30 : \max(0, 30 - \text{ruleClicks} \times 10)$$
  $$\text{CertaintyScore} = \text{round}(\text{Protection} + \text{RiskRefusal} + \text{Compliance}) \in [0, 100]$$
- **Significato:**
  - $\ge 80$: Cliente che non tollera imprevisti. Chiede certezze assolute sui tempi e sui costi prima di dare il consenso.
  - $< 50$: Cliente flessibile, orientato a soluzioni agili e aperte alla variabilità.

#### 2. Propensione all'Abbondanza / Upsell (`upsellGreedScore`)
- **Formula:**
  $$\text{UpsellGreedScore} = \min(100, \text{extraSpawns} \times 33)$$
- **Significato:**
  - **$\ge 3$ Spawns (Score 100)**: *Massimizzatore Attivo*. Il cliente accetta consapevolmente il rischio di complicazioni pur di massimizzare il valore del paniere. Alla reception risponde con entusiasmo a pacchetti all-inclusive e servizi complementari.
  - **0 Spawns (Score 0)**: *Profilo Conservativo*. Vuole risolvere solo il problema specifico per cui è venuto.

#### 3. Pazienza Tattica & Ritmo Decisionale (`tacticalPatienceScore`)
- **Formula:**
  $$\text{TacticalPatienceScore} = \max\left(0, \min\left(100, \text{round}\left(\left(1 - \frac{\text{explodedGoodCount}}{\max(1, \text{initialBombs} \times 1.2)}\right) \times 100\right)\right)\right)$$
- **Significato:**
  - $\ge 80$: Cliente riflessivo che calcola le traiettorie e attende che i corpi fisici si distanzino. Stile suggerito a Gemini: `FORMALE_STRUTTURATO` (approfondimento e schede tecniche).
  - $< 50$: Urgenza operativa alta, accetta perdite per chiudere prima. Stile suggerito: `SINTETICO_DRITTO_AL_SODO`.

#### 4. Adesione alle Regole & Compliance (`ruleComplianceScore`)
- **Formula:**
  $$\text{RuleComplianceScore} = \max(0, 100 - \text{ruleClicks} \times 30)$$
- **Significato:**
  - Conta i tentativi di riscatto a vuoto con `ruleClicks` quando il lucchetto è ancora chiuso (`aliveBombs > 0`).
  - Se $\ge 3$: Bassa tolleranza a passaggi burocratici rigidi; lo staff deve guidare la firma senza richiedere compilazioni lunghe.

#### 5. Tensione Motoria & Stato di Allerta Somatica (`somaticRelaxationScore`)
- **Formula:**
  $$\text{HitsPerSec} = \frac{\text{bumperHits}}{\text{durationSec}}$$
  $$\text{SomaticRelaxationScore} = \text{HitsPerSec} > 4.2 \ ?\ 30 : (\text{HitsPerSec} > 2.0 \ ?\ 65 : 95)$$
- **Significato:**
  - Rileva micro-agitazione, tilt bruschi e frequenza continua di contatto sul touch screen.
  - Serve alla reception per modulare il tono di voce (rassicurante ed empatico in caso di agitazione).

---

### 🎭 Sintesi Archetipica & Istruzione per Gemini Staff

L'incrocio dei 5 vettori produce la categorizzazione finale:

1. **`MAXIMIZER_STRATEGICO_SICURO`**: `certaintyScore >= 80` & `extraSpawns >= 3`  
   *Azione Staff:* Presentare la soluzione più ricca e completa evidenziando la garanzia totale "chiavi in mano".
2. **`DIFENSORE_DEL_CAPITALE`**: `certaintyScore >= 80`  
   *Azione Staff:* Rassicurare sul prezzo fisso e chiarire che non ci saranno costi nascosti o aggiunte non concordate.
3. **`OPPORTUNISTA_IMPULSIVO`**: `extraSpawns >= 3` & `patienceScore < 60`  
   *Azione Staff:* Proposte flash, vantaggi immediati, decisione veloce.
4. **`ANALITICO_PERFEZIONISTA`**: `patienceScore >= 80`  
   *Azione Staff:* Illustrare i dettagli di processo, certificazioni e specifiche con approccio consulenziale.
5. **`PRAGMATICO_EQUILIBRATO`**: Valori mediani  
   *Azione Staff:* Dialogo fluido, flessibilità operativa e trasparenza collaborativa.

---

### 🔐 Conformità Normativa & AI Act UE (Art. 27 & Art. 86)

- **Finalità Esclusiva di Comfort & Accoglienza (FRIA)**: La profilazione ha valore puramente relazionale per ottimizzare l'esperienza del cliente durante la permanenza in sede. È escluso qualsiasi impatto su prezzi di listino, solvibilità o discriminazione.
- **Logica del Modello (Scrutabilità)**: L'algoritmo non è una black-box opaca, ma una combinazione deterministica e tracciabile di formule NoSQL immutabili.
