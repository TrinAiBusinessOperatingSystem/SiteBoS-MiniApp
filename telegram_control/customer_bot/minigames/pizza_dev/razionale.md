# 🍕 Razionale Scientifico & Architettura Psicometrica — Pizza Nocturna 3D

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/production/pizza_dev/`  
> **Scopo:** Decodifica biometrico-comportamentale passiva durante l'attesa in sala o in mobilità: profilazione di perfezionismo qualitativo, propensione al rischio (Greed/Upsell), empatia relazionale, disciplina normativa e calma somatica.

---

### ⚡ Come funziona in 3 passaggi

1. **L'azione fisica:** Il cliente pilota uno scooter di consegna con sidecar e cane compagno in un tragitto urbano 3D SiTeBoS (circa 850m). Deve bilanciare velocità di arrivo, conservazione della temperatura della pizza (non andare troppo piano) ed integrità strutturale della mozzarella (evitare curve ad alta forza G).
2. **L'estrazione del segnale passivo:** Il motore registra in tempo reale:
   - Forze G laterali e sobbalzi (over-G events)
   - Decadimento termico vs velocità media
   - Reattività e ascolto dei segnali di allerta del cane
   - Frequenza e momento delle carezze affettive al cane (relational empathy)
   - Accettazione o rifiuto delle chiamate radio CB per consegne flash VIP (greed vs cautela)
   - Rispetto di semafori, corsie regolari vs scorciatoie su marciapiedi
   - Micro-correzioni e tremolio di sterzata (somatic jitter index)
3. **La sintesi semantica:** L'algoritmo converte la telemetria di guida in **5 vettori psicometrici (0-100)**, assegnando un archetipo comportamentale e generando istruzioni operative su misura per l'accoglienza al desk e per l'agente conversazionale.

---

### 📊 I 5 Vettori Psicometrici & Formule di Calcolo

#### 1. Perfezionismo & Conservazione Qualitativa (`perfectionismScore`)
- **Formula:**
  $$\text{Perfectionism} = \max\left(0, \min\left(100, \text{round}\left((\text{pizzaIntegrity} \times 0.6) + \left(\frac{\text{pizzaTemp}}{\text{initialTemp}} \times 40\right) - (\text{overGEvents} \times 4)\right)\right)\right)$$
- **Significato:** Misura quanto il soggetto si prende cura dell'integrità del prodotto e del rigore esecutivo.
  - $\ge 80$: *Perfezionista Meticoloso*. Esige standard elevati, precisione nei protocolli e trasparenza tecnica.
  - $< 50$: *Pragmatico Orientato al Risultato*. Poco sensibile ai dettagli formali, prioritizza la velocità.

#### 2. Propensione al Rischio / Greed & Upsell (`expansionGreedScore`)
- **Formula:**
  $$\text{ExpansionGreed} = \max\left(0, \min\left(100, \text{round}\left((\text{vipAccepted} \times 35) + (\text{nearMissCount} \times 8)\right)\right)\right)$$
- **Significato:** Misura l'attrazione verso opportunità ad alto rendimento/rischio (ordini VIP con scatole instabili e mancia extra, sfioramento ostacoli ad alta velocità).
  - $\ge 65$: *Alto Potenziale Upsell*. Risponde favorevolmente a proposte premium all-inclusive.
  - $< 35$: *Conservativo Prudente*. Preferisce attenersi rigorosamente alla richiesta pattuita.

#### 3. Empatia Relazionale & Cura del Compagno (`relationalEmpathyScore`)
- **Formula:**
  $$\text{Empathy} = \max\left(0, \min\left(100, \text{round}\left((\text{dogPetCount} \times 20) + \left(1 - \frac{\text{dogStressSec}}{\text{totalRideTime}}\right) \times 40 - (\text{ignoredAlerts} \times 15)\right)\right)\right)$$
- **Significato:** Rileva la capacità di sintonizzazione emotiva, la cura per il benessere del compagno di viaggio e la sensibilità agli allarmi.
  - $\ge 70$: *Sensibilità Relazionale Calda*. Apprezza accoglienza calorosa, ascolto attivo e contatto visivo.
  - $< 40$: *Transazionale Diretto*. Preferisce comunicazioni asciutte e focalizzate sull'obiettivo.

#### 4. Compliance Normativa & Disciplina di Processo (`processComplianceScore`)
- **Formula:**
  $$\text{Compliance} = \max\left(0, \min\left(100, 100 - (\text{redLightsCrossed} \times 12) - (\text{sidewalkSec} \times 8)\right)\right)$$
- **Significato:** Valuta la tendenza a rispettare le regole o a cercare scorciatoie non ortodosse (passare col rosso, guidare sui marciapiedi).
  - $\ge 75$: *Alta Compliance*. Rispetta le procedure aziendali, compila la modulistica con precisione.
  - $< 50$: *Insofferenza Burocratica*. Odia moduli cartacei e attese; preferisce soluzioni digitali istantanee.

#### 5. Calma Somatica & Stabilità Motoria (`somaticCalmScore`)
- **Formula:**
  $$\text{JitterIndex} = \frac{\text{microCorrections} \times 10}{\max(1, \text{totalRideTime})}$$
  $$\text{SomaticCalm} = \begin{cases} 95 & \text{se } \text{JitterIndex} \le 1.8 \\ 65 & \text{se } 1.8 < \text{JitterIndex} \le 3.5 \\ 30 & \text{se } \text{JitterIndex} > 3.5 \end{cases}$$
- **Significato:** Misura il livello di tensione muscolare/visuo-motoria e la calma nell'affrontare imprevisti.
  - $\le 45$: *Ipervigile / Ansia Pre-Trattamento*. Richiede tono rassicurante, distensivo ed ambiente sereno.
  - $> 70$: *Calma Somatica*. Freddo e composto, a proprio agio.

---

### 🎭 Matrice degli Archetipi & Direttive Desk Reception

| Archetipo | Trigger Primari | Stile Reception | Proposta Commerciale |
| :--- | :--- | :--- | :--- |
| **Massimizzatore Entusiasta** (`g >= 70, e >= 70`) | Mancia VIP, Cura Cane, Dinamismo | Caloroso, empatico ed energico | Presentare pacchetti All-Inclusive Top di Gamma |
| **Perfezionista Meticoloso** (`p >= 80, c >= 70`) | Integrità 100%, Rispetto Semafori | Accurato, puntuale e dettagliato | Spiegare le specifiche tecniche e le certificazioni |
| **Pragmatico Veloce** (`c < 50, g >= 55`) | Scorciatoie, Risultati Rapidi | Diretto, zero formalità | Check-in zero-touch senza moduli cartacei |
| **Profilo Ipervigile / Ansioso** (`s <= 45`) | Micro-tensione, Alert Frequenti | Calmo, distensivo e rassicurante | Spiegare in anticipo la semplicità della visita |
| **Transazionale Tecnico** (`e < 45, p >= 60`) | Focus su Esecuzione e Tempi | Sobrio e professionale | Tariffe chiare, tempi certi, zero chiacchiere |

---

### 🎟️ Sistema Voucher & Gamification Gamified Rewards
Al completamento della consegna con integrità pizza $> 70\%$, il giocatore sblocca un **Buono Sconto SiteBoS (15% o Add-on Gourmet/Studio)** riscattabile immediatamente con QR Code e codice alfanumerico univoco salvato nel wallet locale TWA.

---

### 📦 Mappatura Schema Dati NoSQL (MemoryManager / TbosAssetLake)

```json
{
  "session_id": "PIZZA_3D_8492019",
  "game_id": "pizza_nocturna_3d",
  "game_title": "Pizza Nocturna 3D Psychometric Engine",
  "timestamp": "2026-08-15T19:00:00.000Z",
  "telemetry": {
    "pizza_integrity": 94,
    "pizza_temp": 82.5,
    "over_g_events": 1,
    "vip_accepted": 2,
    "vip_offers_total": 2,
    "near_miss_count": 3,
    "dog_pet_count": 4,
    "dog_stress_seconds": 1.2,
    "red_lights_crossed": 0,
    "sidewalk_seconds": 0.5,
    "distance_traveled_m": 850,
    "total_ride_time_sec": 48.2
  },
  "psychometric_vector_scores": {
    "quality_perfectionism": 89,
    "expansion_greed": 78,
    "relational_empathy": 85,
    "process_compliance": 96,
    "somatic_calm": 95
  },
  "archetype_category": "MAXIMIZER_ADRENALINICO_RELAZIONALE",
  "archetype_title": "Massimizzatore Entusiasta ad Alta Sensibilità",
  "communication_style": "DINAMICO_CALOROSO",
  "reception_actionable_directives": {
    "accoglienza": "Accogliere con sorriso caloroso, contatto visivo diretto e tono energico.",
    "proposta_commerciale": "Presentare subito il pacchetto All-Inclusive Top di Gamma.",
    "gestione_modulistica": "Pre-compilazione rapida digitale sul tablet.",
    "tono_medico_staff": "Tono sicuro, orientato all'eccellenza e all'empatia."
  }
}
```
