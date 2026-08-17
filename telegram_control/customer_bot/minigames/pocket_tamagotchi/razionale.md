# 🐾 Razionale Scientifico & Architettura Psicometrica — SiTeBoS Pocket Tamagotchi 2D (Dynamic Trade-Off Engine)

> **Ecosistema:** TrinAi / SiteBoS-MiniApp (Phygital Gamification Suite)  
> **Componente:** `telegram_control/customer_bot/minigames/pocket_tamagotchi/`  
> **Modello Decisionale:** Dilemmi di Accudimento Dinamico, Gestione dell'Iperattività (Zoomies) e Risposta agli Imprevisti Domestici (Quick-Time Hazards).

---

### 🔗 La Rete Causale dell'Ecosistema (Fame ↔ Energia ↔ Zoomies ↔ Vasi)

A differenza della prima versione (dove Zoomies e caduta vasi erano eventi scollegati e casuali), ora ogni meccanica è **causa o conseguenza diretta di un'altra**, sulla stessa filosofia di ecosistema chiuso adottata in Frutteto Incantato:

1. **Pappa/Snack → Fame + Energia**: entrambi nutrono e ricaricano le energie (lo Snack lo fa in modo molto più drastico).
2. **Fame critica (<20%) O Energia in eccesso (>85%) → Zoomies**: il gatto perde il controllo — per fame disperata o per un eccesso di carica dopo uno Snack Turbo.
3. **Zoomies → rischio Vasi**: mentre sfreccia per la stanza, se passa vicino a una delle mensole rischia di farne vacillare il vaso.
4. **Gomitolo → cura gli Zoomies**: giocare scarica l'energia in eccesso (-30%), riportandola sotto la soglia critica e placando l'iperattività.
5. **Energia troppo bassa (<20%) O Igiene troppo bassa (<25%) → Nascondiglio**: il gatto si addormenta sfinito sotto il letto (energia) oppure si nasconde per vergogna (igiene) — stessa meccanica, causa diversa.
6. **Tutte le barre stabili (≥60%) per 12s di fila → Premio Stabilità**: la bravura nel mantenere l'equilibrio viene ricompensata con **+10 secondi di sessione** (ripetibile più volte), invece di limitarsi a evitare penalità — "se sono bravo a tenerlo stabile, il gatto mi premia con più tempo insieme".

**Regola di punteggio — "ogni comportamento estratto vale 1 Punto"**: ogni volta che il giocatore compie un'azione di cura reale (Pappa, Snack, Gomitolo, Bagnetto, Coccole) il gioco registra un comportamento utile alla profilazione e regala **+1 Punto**, con un piccolo cooldown per azione (400-800ms) solo per evitare lo spam meccanico dello stesso pulsante. Sopra questa base uniforme restano due **bonus situazionali più piccoli**, riservati a eventi speciali distinti dalla routine di cura quotidiana: **Salvataggio Vaso** (+5 PT, riflesso pronto sotto pressione) e **Richiamo dal Giardino con lo Snack** (+10 PT, capacità di recuperare una situazione di fuga).

| Azione Giocatore | Vantaggio Immediato | Conseguenza / Rischio Diretto | Rilevanza Decisionale |
| :--- | :--- | :--- | :--- |
| **Snack Goloso Turbo** 🍩 | +50% Fame, +25% Energia, **+1 Punto** | **-12% Igiene** & la carica di energia può scatenare gli **Zoomies** | Brama di gratificazione rapida vs propensione al caos. |
| **Pappa Sana** 🐟 | +25% Fame, +10% Energia, +10% Umore, **+1 Punto** | Nessun rischio diretto, richiede più azioni nel tempo | Pazienza metodica e cura sostenibile nel lungo periodo. |
| **Bagnetto (Vasca da Bagno)** 🛁 | Igiene in salita continua mentre tieni premuto, **+1 Punto** al completamento | -Umore lieve durante il lavaggio | Scelta di dovere necessario anche a costo di attrito emotivo momentaneo. |
| **Gomitolo Acrobatico** 🧶 | +35% Felicità, **cura gli Zoomies**, **+1 Punto** | **-30% Energia** (esaurimento rapido delle forze) | Spinta all'intrattenimento ad alto dispendio energetico. |
| **🐾 Coccole** | **+1 Punto** ciascuna (cooldown più corto: gesto rapido e ripetibile) | Nessuno | Frequenza e costanza dell'affetto diretto verso l'animale. |
| **🏺 Vasi in Bilico (Mensole)** | +5 Punti Salvezza & focus | Se non premuto entro 3.0s: **-25% Felicità gatto** per lo spavento | Reattività al rischio imprevisto e vigilanza protettiva. |
| **🚪🌳 Fuga in Giardino** | Energia > 85% o noia < 25%: il gatto scappa fuori e si sporca | Snack per farlo rientrare (+10 PT bonus di recupero) | Prontezza nel riparare a una situazione sfuggita di mano. |

---

### 📊 I 5 Vettori Psicometrici (0-100)

1. **`nurturing_empathy_score`**: Capacità di calibrare le cure e coccolare nei momenti di stress.
2. **`emotional_patience_score`**: Preferenza per alimentazione sana e calma vs snack impulsivi.
3. **`responsibility_balance`**: Mantenimento dell'equilibrio tra igiene, energia e felicità.
4. **`crisis_readiness_score`**: Rapidità nel salvare il vaso in bilico prima del disastro.
5. **`affectionate_warmth`**: Frequenza e costanza delle carezze e fusa.
