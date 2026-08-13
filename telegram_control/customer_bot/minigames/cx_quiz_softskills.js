/**
 * cx_quiz_softskills.js — Customer SoftSkills Quiz Engine (10 Set x 7 Domande Tier A)
 * Selezione di 70 domande prive di contesto lavorativo con scoring deterministico sulle 5 dimensioni DNA.
 */

const CxQuizEngine = (() => {
    'use strict';

    // 10 Set Tematici da 7 Domande (70 domande Tier A totali)
    const QUIZ_SETS = [
        { id: 'set_1', name: '🧘 Resilienza & Pressione', questions: [2, 35, 44, 57, 58, 67, 87], targetDim: 'guardia' },
        { id: 'set_2', name: '💰 Finanza & Rischio', questions: [1, 22, 33, 48, 54, 82, 97], targetDim: 'guardia_mente' },
        { id: 'set_3', name: '❤️ Empatia & Relazioni', questions: [20, 27, 37, 49, 101, 52, 85], targetDim: 'cuore' },
        { id: 'set_4', name: '🧠 Mente & Analisi', questions: [14, 21, 40, 59, 41, 79, 92], targetDim: 'mente' },
        { id: 'set_5', name: '🔥 Coraggio & Visione', questions: [12, 26, 38, 71, 78, 105, 93], targetDim: 'energia' },
        { id: 'set_6', name: '🛡️ Etica & Valori', questions: [3, 50, 103, 104, 81, 109, 99], targetDim: 'cuore_guardia' },
        { id: 'set_7', name: '🌊 Adattabilità & Flusso', questions: [17, 23, 55, 60, 61, 70, 68], targetDim: 'flusso' },
        { id: 'set_8', name: '⚡ Energia & Leadership', questions: [18, 25, 31, 32, 66, 95, 89], targetDim: 'energia' },
        { id: 'set_9', name: '🎯 Focus & Organizzazione', questions: [15, 28, 34, 53, 77, 88, 98], targetDim: 'mente_flusso' },
        { id: 'set_10', name: '🌐 Mix Istinto Totale', questions: [9, 30, 51, 62, 64, 75, 91], targetDim: 'full' }
    ];

    // Database sintetico 70 Domande Tier A
    const QUESTION_BANK = {
        1: { text: "Quando punti a un traguardo, come gestisci la scelta tra un vantaggio subito o costruire nel tempo?", icon: "fa-balance-scale", captions: ["Investimento", "Compromesso", "Breve Termine", "Ricompensa Immediata"], scores: { guardia: 20, mente: 15, flusso: 5, cuore: 0, energia: 0 } },
        2: { text: "Quando l'ambiente intorno genera forte stress, quale parola descrive meglio la tua reazione?", icon: "fa-shield-halved", captions: ["Sereno", "Impassibile", "Preparato", "Tempestoso"], scores: { guardia: 25, flusso: 10, mente: 5, cuore: 0, energia: 0 } },
        3: { text: "Assisti a una scena in cui qualcuno viene trattato con sufficienza. Qual è la tua reazione?", icon: "fa-hand-shake", captions: ["Ignoro", "Sguardo veloce", "Apro la discussione", "Intervengo subito"], scores: { cuore: 25, energia: 15, guardia: 10, mente: 0, flusso: 0 } },
        9: { text: "Pensando ai tuoi traguardi più ambiziosi, quanto ti pesa raggiungerli?", icon: "fa-mountain", captions: ["Non mi pesa", "Mi impegno", "Faccio fatica", "Sembrano un muro"], scores: { energia: 20, guardia: 15, flusso: 10, mente: 0, cuore: 0 } },
        12: { text: "Guardando al tuo percorso, quale visione descrive meglio la tua ambizione per i prossimi anni?", icon: "fa-compass", captions: ["Stesso posto", "Tranquillità", "Qualcosa di mio", "Nuove avventure"], scores: { energia: 25, flusso: 15, mente: 10, guardia: 0, cuore: 0 } },
        14: { text: "Sulla tua 'bilancia' delle decisioni, quale piatto ha il peso maggiore?", icon: "fa-scale-balanced", captions: ["Rapporti Umani", "Divertimenti", "Responsabilità", "Benessere"], scores: { cuore: 20, guardia: 20, mente: 10, flusso: 5, energia: 0 } },
        15: { text: "Pensa al futuro, qual è la sensazione che provi più spesso?", icon: "fa-crystal-ball", captions: ["Zero problemi", "Pronto a tutto", "Chissà", "Ansia"], scores: { guardia: 20, energia: 15, flusso: 10, mente: 0, cuore: 0 } },
        17: { text: "Parli al telefono. Quanto ti viene naturale far capire come ti senti solo con la voce?", icon: "fa-phone", captions: ["Tono neutro", "Emozioni minime", "Emozioni misurate", "Molto espressivo"], scores: { cuore: 20, flusso: 15, energia: 10, mente: 0, guardia: 0 } },
        18: { text: "Quanto pensi di essere capace di ispirare le persone intorno a te?", icon: "fa-bolt", captions: ["Lupo solitario", "Piccola banda", "Quanto basta", "Guidatore di folle"], scores: { energia: 25, cuore: 15, mente: 5, guardia: 0, flusso: 0 } },
        20: { text: "Sei al bar o al ristorante. Come ti comporti di solito con il personale?", icon: "fa-utensils", captions: ["Fantasma", "Solo per il servizio", "Cordiale", "Faccio festa con tutti"], scores: { cuore: 25, flusso: 15, energia: 10, mente: 0, guardia: 0 } },
        21: { text: "Quando osservi un comportamento bizzarro, qual è il tuo primo pensiero?", icon: "fa-eye", captions: ["Cerco di capire", "Analizzo logico", "Non capisco", "Che gli salta in mente"], scores: { mente: 25, cuore: 15, flusso: 10, guardia: 0, energia: 0 } },
        22: { text: "Quanta parte di quello che guadagni metti via per il futuro?", icon: "fa-piggy-bank", captions: ["Zero", "Appena iniziato", "Abbastanza", "Pieno zeppo"], scores: { guardia: 25, mente: 20, flusso: 5, energia: 0, cuore: 0 } },
        23: { text: "Quando bisogna essere schietti e diretti, come la affronti?", icon: "fa-bullhorn", captions: ["Sempre diretto", "Chiaro ma cauto", "Evito", "Silenzio"], scores: { energia: 20, guardia: 15, cuore: 10, mente: 0, flusso: 0 } },
        25: { text: "Quanto pensi che il tuo modo di fare sia d'ispirazione per gli altri?", icon: "fa-star", captions: ["Stile unico", "Qualcuno copia", "Mi imitano spesso", "Punto di riferimento"], scores: { energia: 25, mente: 15, cuore: 10, guardia: 0, flusso: 0 } },
        26: { text: "Guardando alle occasioni incontrate finora nella vita, come le descrivi?", icon: "fa-door-open", captions: ["Porte chiuse", "Pochi spiragli", "Porte aperte", "Molte opportunità"], scores: { energia: 20, flusso: 15, guardia: 10, mente: 0, cuore: 0 } },
        27: { text: "Quanto fai fatica di solito a stringere nuove amicizie?", icon: "fa-user-group", captions: ["Meglio solo", "Ci metto un po'", "Amici non subito", "Amici al volo"], scores: { cuore: 25, flusso: 15, energia: 10, mente: 0, guardia: 0 } },
        28: { text: "Quanto senti che gli altri riconoscano davvero il tuo impegno?", icon: "fa-award", captions: ["Apprezzato al massimo", "Abbastanza", "Poco", "Invisibile"], scores: { guardia: 20, cuore: 15, energia: 10, mente: 0, flusso: 0 } },
        30: { text: "Come ti comporti di solito quando conversi con qualcuno?", icon: "fa-comments", captions: ["Dico tutto", "Dico quasi tutto", "Parole scelte", "Parlo poco"], scores: { mente: 20, guardia: 20, cuore: 15, flusso: 0, energia: 0 } },
        31: { text: "Immagina di essere al centro dell'attenzione. Come ti senti?", icon: "fa-bullseye", captions: ["Star del palco", "Ok ma non troppa", "Imbarazzo", "Panico"], scores: { energia: 25, flusso: 15, cuore: 10, mente: 0, guardia: 0 } },
        32: { text: "Quando proponi una nuova idea, quanto è facile ottenere consenso?", icon: "fa-lightbulb", captions: ["Volano subito", "Qualche riserva", "Devo spingere", "Muro di gomma"], scores: { energia: 20, mente: 15, flusso: 10, guardia: 0, cuore: 0 } },
        33: { text: "A che punto hai raggiunto la tua indipendenza senza aiuti?", icon: "fa-person-walking", captions: ["Adolescente", "Giovane", "Adulto", "In corso"], scores: { guardia: 25, mente: 20, energia: 10, flusso: 0, cuore: 0 } },
        34: { text: "Ti viene dato un compito noioso. Qual è la tua strategia?", icon: "fa-hourglass", captions: ["Rimando", "Compitino e via", "Mi distraggo", "Trovo un senso"], scores: { mente: 20, guardia: 20, flusso: 10, energia: 0, cuore: 0 } },
        35: { text: "Ricevi una critica che ritieni ingiusta. Qual è la reazione interiore?", icon: "fa-shield", captions: ["Non mi tocca", "Passo oltre", "Ci rifletto", "Mi sento ferito"], scores: { guardia: 25, mente: 15, cuore: 10, flusso: 0, energia: 0 } },
        37: { text: "Quando interagisci con gli altri, come descrivi il clima abituale?", icon: "fa-heart", captions: ["Armonia totale", "Buono di solito", "Tensione alterna", "Spesso scontro"], scores: { cuore: 25, flusso: 15, guardia: 10, mente: 0, energia: 0 } },
        38: { text: "Pensando al tuo futuro, qual è il traguardo che desideri davvero?", icon: "fa-flag-checkered", captions: ["Sto bene così", "Crescita tranquilla", "Punto in alto", "Voglio il vertice"], scores: { energia: 25, mente: 15, guardia: 10, flusso: 0, cuore: 0 } },
        40: { text: "Stai svolgendo un compito critico con rumori ed interruzioni. Reazione?", icon: "fa-brain", captions: ["Focus totale", "Concentrato ma a volte distratto", "Distratto da tutto", "Caos"], scores: { mente: 25, guardia: 15, flusso: 10, energia: 0, cuore: 0 } },
        41: { text: "Quanto credi che le persone possano cambiare il proprio carattere?", icon: "fa-rotate", captions: ["Cambiano se aiutate", "Con molto sforzo", "Chi nasce tondo...", "Mission impossible"], scores: { cuore: 20, mente: 15, flusso: 10, guardia: 0, energia: 0 } },
        44: { text: "Che tipo di accoglienza senti di ricevere solitamente dagli altri?", icon: "fa-hands-clapping", captions: ["Mi adorano", "In genere bene", "Qualche tensione", "Ambiente freddo"], scores: { cuore: 25, guardia: 15, energia: 10, mente: 0, flusso: 0 } },
        48: { text: "Ti offrono la svolta della tua vita ma devi cambiare città e rischiare. Che fai?", icon: "fa-plane-departure", captions: ["Resto", "Ci penso", "Parto subito", "Nessun confine"], scores: { energia: 25, flusso: 20, guardia: 5, mente: 0, cuore: 0 } },
        49: { text: "Qualcuno di una cultura molto diversa si unisce al tuo gruppo. Come lo accogli?", icon: "fa-earth-americas", captions: ["Segua le nostre regole", "Rapporto formale", "Lo guido nei passi", "Lo faccio sentire di casa"], scores: { cuore: 25, flusso: 15, mente: 10, guardia: 0, energia: 0 } },
        50: { text: "Durante una conversazione qualcuno fa una battuta chiaramente discriminatoria.", icon: "fa-gavel", captions: ["Risata di circostanza", "Silenzio imbarazzato", "Cambio discorso", "Lo dico chiaro e tondo"], scores: { cuore: 25, guardia: 20, energia: 10, mente: 0, flusso: 0 } },
        51: { text: "Dove sceglieresti di pranzare per una pausa di gruppo perfetta?", icon: "fa-burger", captions: ["Ristorante raffinato", "Fast food vivace", "Trattoria familiare", "Vegano moderno"], scores: { flusso: 20, cuore: 15, mente: 10, energia: 0, guardia: 0 } },
        52: { text: "Assisti a qualcuno che subisce parole sgradevoli in pubblico.", icon: "fa-handshake-angle", captions: ["Offro supporto", "Minimizzo", "Gestisco in privato", "Segnalo subito"], scores: { cuore: 25, guardia: 20, energia: 10, mente: 0, flusso: 0 } },
        53: { text: "Quanto ti senti sotto esame dagli sguardi altrui di solito?", icon: "fa-eye-slash", captions: ["Ignoro", "Consapevole non ossessionato", "Mi nascondo", "Blocco totale"], scores: { guardia: 20, mente: 15, flusso: 10, cuore: 0, energia: 0 } },
        54: { text: "Opportunità di avventura improvvisa o stabilità tranquilla a casa?", icon: "fa-compass-drafting", captions: ["Casa è casa", "Ci penso su", "Nuove avventure", "Il mondo mi aspetta"], scores: { energia: 25, flusso: 20, guardia: 10, mente: 0, cuore: 0 } },
        55: { text: "Che 'stagione' ti sembra di vivere in questo momento?", icon: "fa-sun", captions: ["Estate piena", "Primavera fiorita", "Autunno riflessivo", "Inverno di rigenerazione"], scores: { flusso: 25, energia: 15, cuore: 10, guardia: 0, mente: 0 } },
        57: { text: "Pensando alla tua sensazione di prosperità attuale nella vita:", icon: "fa-seedling", captions: ["Giardino rigoglioso", "Campo coltivato", "Un po' arido", "Deserto"], scores: { flusso: 20, guardia: 20, energia: 10, mente: 0, cuore: 0 } },
        58: { text: "Pensando al tuo 'meteo interiore' più frequente:", icon: "fa-cloud-sun", captions: ["Sereno costante", "Nuvole passeggere", "A volte nuvole a volte sole", "Tempesta"], scores: { guardia: 25, flusso: 15, mente: 10, cuore: 0, energia: 0 } },
        59: { text: "Quanto spesso ti fai un'opinione immediata sulle persone?", icon: "fa-magnifying-glass", captions: ["Sguardo penetrante", "Analisi dettagliata", "Sguardo sfuggente", "Visione ampia"], scores: { mente: 25, guardia: 15, flusso: 10, cuore: 0, energia: 0 } },
        60: { text: "Quando ti viene un'idea brillante, la tieni per te o la condividi?", icon: "fa-share-nodes", captions: ["Segreto mio", "A pochi fidati", "Condivisione mirata", "Aperto a tutti"], scores: { energia: 20, cuore: 20, mente: 10, flusso: 0, guardia: 0 } },
        61: { text: "Come ti comporti con ciò che appartiene al tuo passato ma non serve più?", icon: "fa-box-archive", captions: ["Custode ricordi", "Soffitta", "Lascio andare", "Tabula rasa"], scores: { flusso: 25, mente: 15, guardia: 10, cuore: 0, energia: 0 } },
        62: { text: "Come giudichi la tua autoironia nelle situazioni quotidiane?", icon: "fa-face-laugh-beam", captions: ["Serietà totale", "Umorismo controllato", "Autoironia leggera", "Autoironia travolgente"], scores: { cuore: 20, flusso: 20, energia: 15, mente: 0, guardia: 0 } },
        64: { text: "Quanto senti profondo il divario con persone che hanno idee opposte alle tue?", icon: "fa-bridge", captions: ["Impercettibile", "Piccolo ruscello", "Fossato profondo", "Canyon invalicabile"], scores: { cuore: 20, guardia: 20, mente: 15, flusso: 0, energia: 0 } },
        66: { text: "Secondo te, come viene percepito abitualmente il tuo sguardo?", icon: "fa-eye", captions: ["Neutro", "Amichevole", "Intrigante", "Magnetico"], scores: { energia: 20, cuore: 20, flusso: 10, mente: 0, guardia: 0 } },
        67: { text: "Che tipo di pressione eserciti su te stesso per i tuoi obiettivi?", icon: "fa-gauge-high", captions: ["Leggera nuvola", "Centrato", "Fiamma viva", "Corda tesa"], scores: { guardia: 20, mente: 20, energia: 15, flusso: 0, cuore: 0 } },
        68: { text: "Quanto ti mette a tuo agio l'idea di partire per un viaggio senza prenotare?", icon: "fa-suitcase-rolling", captions: ["Improvvisazione", "Imprevisti ok", "Pianificazione", "Panico"], scores: { flusso: 25, energia: 15, guardia: 5, mente: 0, cuore: 0 } },
        70: { text: "Quanto ti senti 'elastico' di fronte ai cambiamenti improvvisi?", icon: "fa-spa", captions: ["Pietra", "Ferro", "Bambù", "Giunco flessibile"], scores: { flusso: 25, guardia: 15, mente: 10, cuore: 0, energia: 0 } },
        71: { text: "Quale immagine associ al tuo percorso personale finora?", icon: "fa-road", captions: ["Autostrada spianata", "Strada di campagna", "Sentiero di montagna", "Labirinto"], scores: { energia: 20, guardia: 20, flusso: 10, mente: 0, cuore: 0 } },
        75: { text: "Quale immagine descrive meglio la tua stabilità emotiva nei momenti bui?", icon: "fa-lighthouse", captions: ["Barchetta", "Casa solida", "Faro nella nottet", "Ghiaccio"], scores: { guardia: 25, mente: 15, cuore: 10, flusso: 0, energia: 0 } },
        77: { text: "Stai uscendo di casa: dove sono solitamente le tue chiavi?", icon: "fa-key", captions: ["Sempre al posto", "So dove sono", "Ballerine", "Introvabili"], scores: { mente: 25, guardia: 15, flusso: 10, energia: 0, cuore: 0 } },
        78: { text: "Quanto sono chiari e definiti i tuoi piani per i prossimi anni?", icon: "fa-map-location-dot", captions: ["Autostrada chiara", "Strada maestra", "Sentieri incerti", "Territorio nuovo"], scores: { mente: 25, guardia: 20, energia: 10, flusso: 0, cuore: 0 } },
        79: { text: "Se qualcuno ti dice: 'Tranquillo, di me ti puoi fidare!', come reagisci?", icon: "fa-handshake", captions: ["Fiducia cieca", "Verifico con garbo", "Sospetto controllato", "Sguardo di traverso"], scores: { guardia: 25, mente: 20, cuore: 10, flusso: 0, energia: 0 } },
        81: { text: "Quando racconti un aneddoto, quanto tendi ad arricchirlo con enfasi?", icon: "fa-wand-magic-sparkles", captions: ["Verità pura", "Lieve sfumatura", "Caleidoscopio", "Magia teatrale"], scores: { energia: 20, flusso: 20, cuore: 10, mente: 0, guardia: 0 } },
        82: { text: "Qual è la tua personale 'fame' di prosperità ed indipendenza economica?", icon: "fa-sack-dollar", captions: ["Ciotola essenziale", "Casa con giardino", "Montagna dorata", "Trono d'oro"], scores: { guardia: 25, mente: 20, energia: 15, flusso: 0, cuore: 0 } },
        85: { text: "Nella tua esperienza di vita, quante volte incontri lealtà profonda?", icon: "fa-shield-heart", captions: ["Solo lealtà", "Poche delusioni", "Qualche delusione", "Servono le spine"], scores: { cuore: 25, guardia: 20, mente: 10, flusso: 0, energia: 0 } },
        87: { text: "Quando le cose vanno storte, come vedi la tua luce interiore?", icon: "fa-sun-plant-wilt", captions: ["Sole continuo", "Luce affievolita", "Candela vacillante", "Ripartenza"], scores: { guardia: 25, flusso: 15, mente: 10, cuore: 0, energia: 0 } },
        88: { text: "Quando intraprendi un nuovo progetto, ti orienti 'a vista' o con 'bussola'?", icon: "fa-compass", captions: ["Navigazione a vista", "Seguo l'istinto", "Bussola chiara", "Strumenti di precisione"], scores: { mente: 25, guardia: 20, flusso: 10, energia: 0, cuore: 0 } },
        89: { text: "Quanto 'a ruota libera' ti lasci andare quando esprimi la tua opinione?", icon: "fa-comment-dots", captions: ["Cascata di parole", "Fontana vivace", "Ruscello calmo", "Pozzo riservato"], scores: { energia: 20, flusso: 20, cuore: 10, mente: 0, guardia: 0 } },
        91: { text: "Quale strumento ritieni indispensabile per orientarti nella vita?", icon: "fa-route", captions: ["GPS automatico", "Mappa chiara", "Bussola di valori", "Rosa dei venti"], scores: { mente: 25, guardia: 20, flusso: 10, energia: 0, cuore: 0 } },
        92: { text: "Quando ti trovi in un posto molto affollato, come ti muovi?", icon: "fa-people-group", captions: ["Seguo la scia", "Mantengo distanze", "Mi allontano", "Vado dritto dove voglio"], scores: { guardia: 20, mente: 20, energia: 15, flusso: 0, cuore: 0 } },
        93: { text: "Come descriveresti il 'terreno' su cui stai costruendo il tuo futuro?", icon: "fa-plant-wilt", captions: ["Campo arato pronto", "Primi germogli", "Raccolto solido", "Granaio pieno"], scores: { guardia: 25, mente: 20, energia: 10, flusso: 0, cuore: 0 } },
        95: { text: "Quanto spesso sei tu ad 'accendere la miccia' per nuove iniziative di gruppo?", icon: "fa-fire", captions: ["Nessuna scintilla", "Scintilla cauta", "Brace moderata", "Fuochi d'artificio"], scores: { energia: 25, flusso: 15, mente: 10, cuore: 0, guardia: 0 } },
        97: { text: "Pensa al modo in cui preferisci gestire i tuoi risparmi ed entrate:", icon: "fa-vault", captions: ["Cassaforte blindata", "Fiume con affluenti", "Bilancia equilibrata", "Investimento dinamico"], scores: { guardia: 25, mente: 20, flusso: 10, energia: 0, cuore: 0 } },
        98: { text: "Esaurisci un prodotto di uso quotidiano a casa. Qual è la tua reazione?", icon: "fa-basket-shopping", captions: ["Nessun problema", "Leggero fastidio", "Fastidio vero", "Panico e corsa alla spesa"], scores: { mente: 20, guardia: 20, flusso: 10, cuore: 0, energia: 0 } },
        99: { text: "Qualcosa di prezioso per te sembra allontanarsi. Come ti comporti?", icon: "fa-hand-holding-heart", captions: ["Lascio volare", "Tendo la mano", "Riporto indietro", "Costruisco un ponte"], scores: { cuore: 25, guardia: 15, flusso: 15, mente: 0, energia: 0 } },
        101: { text: "Devi lasciare un messaggio su WhatsApp. Che tono usi di solito?", icon: "fa-paper-plane", captions: ["Formale", "Cordiale", "Amichevole", "Entusiasta"], scores: { cuore: 20, flusso: 15, energia: 10, mente: 0, guardia: 0 } },
        103: { text: "Devi proporre un'idea con qualche piccolo limite. Come la esponi?", icon: "fa-wand-magic", captions: ["Focus sui vantaggi", "Sfumo i difetti", "Risvolto trasparente", "Ombra in piena luce"], scores: { cuore: 25, guardia: 20, mente: 15, flusso: 0, energia: 0 } },
        104: { text: "Situazione critica in un gruppo. Come ti comporti per la priorità?", icon: "fa-life-ring", captions: ["Prima i fragili", "Scelta equa", "Ciascuno da sé", "A chi fa la differenza"], scores: { cuore: 25, guardia: 20, mente: 10, flusso: 0, energia: 0 } },
        105: { text: "Stai scalando una sfida difficile dove molti falliscono. Cosa vedi?", icon: "fa-mountain-sun", captions: ["Solo la vetta", "Vedo il sentiero", "Vedo chi è indietro", "Rifletto"], scores: { energia: 25, mente: 15, cuore: 10, guardia: 0, flusso: 0 } },
        109: { text: "Quando cammini in una città che non conosci, quanto sei in allerta?", icon: "fa-shield-cat", captions: ["Distratto", "Consapevole", "Suricato sentinella", "Zero preoccupazioni"], scores: { guardia: 25, mente: 20, flusso: 5, cuore: 0, energia: 0 } }
    };

    let activeSetIndex = 0;
    let activeQuestionIndex = 0;
    let accumulatedScores = { mente: 0, cuore: 0, energia: 0, guardia: 0, flusso: 0 };

    function getQuizSets() {
        return QUIZ_SETS;
    }

    function startSet(setIndex) {
        activeSetIndex = setIndex;
        activeQuestionIndex = 0;
        return getCurrentQuestion();
    }

    function getCurrentQuestion() {
        const currentSet = QUIZ_SETS[activeSetIndex];
        if (!currentSet || activeQuestionIndex >= currentSet.questions.length) {
            return null;
        }
        const qId = currentSet.questions[activeQuestionIndex];
        const qData = QUESTION_BANK[qId];
        return {
            setIndex: activeSetIndex,
            setName: currentSet.name,
            questionNumber: activeQuestionIndex + 1,
            totalQuestions: currentSet.questions.length,
            qId: qId,
            ...qData
        };
    }

    function answerCurrentQuestion(optionIndex) {
        const q = getCurrentQuestion();
        if (!q) return null;

        // Ponderazione deterministica opzione (0=25%, 1=50%, 2=75%, 3=100% dei punteggi max della domanda)
        const mult = (optionIndex + 1) * 0.25;
        Object.keys(q.scores).forEach(dim => {
            accumulatedScores[dim] += Math.round(q.scores[dim] * mult);
        });

        activeQuestionIndex++;
        const nextQ = getCurrentQuestion();

        if (!nextQ) {
            // Set Completato: accredita +40 punti netti
            if (window.CxGamificationHub) {
                window.CxGamificationHub.recordQuizCompletion(QUIZ_SETS[activeSetIndex].id, 40, getNormalizedScores());
            }
            return { completed: true, scores: getNormalizedScores() };
        }

        return { completed: false, nextQuestion: nextQ };
    }

    function getNormalizedScores() {
        const total = Object.values(accumulatedScores).reduce((a, b) => a + b, 0) || 1;
        return {
            mente: Math.min(100, Math.round((accumulatedScores.mente / total) * 100 * 2.5)),
            cuore: Math.min(100, Math.round((accumulatedScores.cuore / total) * 100 * 2.5)),
            energia: Math.min(100, Math.round((accumulatedScores.energia / total) * 100 * 2.5)),
            guardia: Math.min(100, Math.round((accumulatedScores.guardia / total) * 100 * 2.5)),
            flusso: Math.min(100, Math.round((accumulatedScores.flusso / total) * 100 * 2.5))
        };
    }

    return {
        getQuizSets,
        startSet,
        getCurrentQuestion,
        answerCurrentQuestion,
        getNormalizedScores
    };
})();

if (typeof window !== 'undefined') {
    window.CxQuizEngine = CxQuizEngine;
}
