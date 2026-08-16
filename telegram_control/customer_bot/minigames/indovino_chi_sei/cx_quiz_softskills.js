/**
 * cx_quiz_softskills.js — Customer SoftSkills Quiz Engine (10 Moduli x 7 Domande = 70 Domande Totali)
 * Database completo delle 70 domande con Scenari, Istruzioni simboliche, Opzioni,
 * Razionali Comportamentali Estesi (Positivo / Negativo), SoftSkill, Characteristics e Pesi 5D DNA.
 */

const CxQuizEngine = (() => {
    'use strict';

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

    const QUESTION_BANK = {
    "1": {
        "num": 1,
        "scenario": "Quando punti a un traguardo importante, come gestisci la scelta tra avere un vantaggio subito o costruire nel tempo?",
        "instructions": [
            "Immagine di un seme che viene piantato.",
            "Immagine di una bilancia in equilibrio",
            "Immagine di una persona che si gode il sole",
            "Immagine di una mano che afferra con forza un mazzetta di denaro."
        ],
        "captions": [
            "Investimento",
            "Compromesso",
            "Breve Termine",
            "Ricompensa Immediata"
        ],
        "options": [
            {
                "value": "Investimento",
                "text": "(Positivo: eccellente visione strategica e capacità di pianificazione differita, forte orientamento al risultato di lungo periodo, autodisciplina elevata e costanza nel perseguire obiettivi ambiziosi) (Negativo: potenziale rigidità operativa di fronte a opportunità immediate, rischio di demotivazione nel breve periodo per mancanza di gratificazione tangibile, possibile distacco dalle necessità contingenti)."
            },
            {
                "value": "Compromesso",
                "text": "(Positivo: equilibrio pragmatico tra visione futura e godimento del presente, alta flessibilità adattiva e capacità di mediazione tra diverse priorità temporali, approccio versatile orientato al realismo operativo) (Negativo: rischio di mediocrità prestazionale non eccellendo in nessuna delle due direzioni, potenziale percezione di mancanza di visione radicale o di indecisione strategica)."
            },
            {
                "value": "Breve Termine",
                "text": "(Positivo: massima capacità di cogliere opportunità immediate e 'carpe diem', forte intelligenza emotiva orientata al benessere presente, entusiasmo e spontaneità che favoriscono la reattività immediata) (Negativo: scarsa visione prospettica e imprevidenza gestionale, rischio di trascuratezza delle conseguenze sistemiche a lungo termine, percezione di instabilità e bassa affidabilità in progetti complessi)."
            },
            {
                "value": "Ricompensa Immediata",
                "text": "(Positivo: dinamismo operativo estremo e focus sul risultato concreto e palpabile, approccio istintivo efficace in contesti di emergenza, valorizzazione dell'azione rapida rispetto alla teoria) (Negativo: impulsività decisionale elevata e mancanza di pianificazione oculata, rischio di compromettere la sostenibilità futura per un vantaggio momentaneo, tendenza a sottovalutare i rischi complessi)."
            }
        ],
        "softSkill": "Autodisciplina, GestioneDelTempo",
        "characteristics": "Impulsività vs. Pianificazione, Preferenza Temporale, Pensiero a Lungo Termine",
        "scores": {
            "guardia": 20,
            "mente": 15,
            "flusso": 5,
            "cuore": 0,
            "energia": 0
        }
    },
    "2": {
        "num": 2,
        "scenario": "Quando le persone o l'ambiente di lavoro generano forte stress, quale parola descrive meglio la tua reazione?",
        "instructions": [
            "Immagine di un uomo in meditazione in un lago paradisiaco",
            "Immagine di una barca a largo con un cielo leggermente nuvoloso.",
            "Immagine di un uomo with un ombrello in un temporale",
            "Immagine di una tempesta furiosa."
        ],
        "captions": [
            "Sereno",
            "Impassibile",
            "Preparato",
            "Tempestoso"
        ],
        "options": [
            {
                "value": "Sereno",
                "text": "(Positivo: resilienza emotiva superiore e stabilità interiore incrollabile, distacco zen che previene il burnout, totale fiducia nelle proprie capacità di gestione ambientale) (Negativo: rischio di distacco empatico eccessivo, percezione di freddezza o indifferenza verso il disagio altrui, possibile sottovalutazione della gravità oggettiva delle situazioni stressanti)."
            },
            {
                "value": "Impassibile",
                "text": "(Positivo: lucidità analitica sotto pressione e controllo razionale delle emozioni, capacità di mantenere l'efficacia operativa anche in contesti ostili, affidabilità granitica in situazioni critiche) (Negativo: potenziale negazione del segnale emotivo utile, rischio di apparire poco coinvolto nelle dinamiche di team, mancanza di calore umano in contesti che richiederebbero supporto emotivo)."
            },
            {
                "value": "Preparato",
                "text": "(Positivo: approccio proattivo e orientato alla prevenzione dei rischi, vigilanza strategica e capacità di anticipare le criticità ambientali, senso di responsabilità elevato) (Negativo: tendenza all'iper-vigilanza e allo stress anticipatorio, rischio di ansia cronica dovuta al monitoraggio costante dei pericoli, percezione di persona apprensiva o pessimista)."
            },
            {
                "value": "Tempestoso",
                "text": "(Positivo: alta sensibilità e intelligenza emotiva, capacità di denunciare dinamiche tossiche o problematiche, autenticità nelle reazioni e trasparenza comunicativa) (Negativo: elevata vulnerabilità allo stress esterno e reattività impulsiva, rischio di instabilità relazionale in contesti difficili, scarsa resilienza di fronte a fattori di pressione prolungati)."
            }
        ],
        "softSkill": "GestioneDelloStress, Resilienza",
        "characteristics": "Livelli di Ansia, Resilienza Emotiva, Comfort Sociale",
        "scores": {
            "guardia": 25,
            "flusso": 10,
            "mente": 5,
            "cuore": 0,
            "energia": 0
        }
    },
    "3": {
        "num": 3,
        "scenario": "Assisti a una scena in cui una valida proposta di una collega donna viene sminuita con sufficienza da un collega uomo. Qual è la tua reazione?",
        "instructions": [
            "Immagine di un placido fiume.",
            "Immagine di qualcuno che fa \"un like\" su un social",
            "Immagine di qualcuno che si complimenta con una collega donna.",
            "Immagine di qualcuno che rimprovera un collega uomo."
        ],
        "captions": [
            "Faccio Finta di Niente",
            "Le dò un Like veloce",
            "Riprendo l'Idea e Apro la Discussione",
            "Difendo la Collega e Condanno il Gesto"
        ],
        "options": [
            {
                "value": "Faccio Finta di Niente",
                "text": "(Positivo: massima conservazione dell'energia personale ed evitamento del conflitto diretto, mantenimento di un'apparente neutralità diplomatica in contesti rischiosi) (Negativo: collusione passiva con dinamiche tossiche o discriminatorie, mancanza di assunzione di responsabilità sociale, percezione di persona poco integra o indifferente ai valori dell'equità)."
            },
            {
                "value": "Le dò un Like veloce",
                "text": "(Positivo: supporto diplomatico moderato e tentativo di validazione senza escalation del conflitto, approccio cauto orientato alla preservazione del clima lavorativo) (Negativo: supporto insufficiente per cambiare dinamiche strutturali, rischio di apparire tiepido o inefficace di fronte a ingiustizie manifeste, mancata presa di posizione netta contro il sessismo)."
            },
            {
                "value": "Riprendo l'Idea e Apro la Discussione",
                "text": "(Positivo: promozione attiva dell'inclusione e del merito, capacità di reindirizzare il focus sul valore professionale ignorando le provocazioni personali, leadership orientata al team) (Negativo: mancata denuncia diretta del comportamento irrispettoso (approccio indiretto), rischio di non fare definitiva la dinamica patriarcale alla radice, percezione di eccessiva diplomazia)."
            },
            {
                "value": "Difendo la Collega e Condanno il Gesto",
                "text": "(Positivo: integrità morale superiore e coraggio assertivo, difesa dei valori etici e dell'equità di genere a ogni costo, leadership carismatica e paladina della giustizia) (Negativo: rischio di generare conflitti aperti e polarizzazioni nel team, percezione di eccessiva aggressività o rigidità morale, potenziale inefficacia tattica se l'obiettivo è la mediazione a lungo termine)."
            }
        ],
        "softSkill": "TematicheSociali, DiversitaEInclusione",
        "characteristics": "Affrontare Comportamenti Patriarcali, Promuovere Inclusione, Assertività",
        "scores": {
            "cuore": 25,
            "energia": 15,
            "guardia": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "9": {
        "num": 9,
        "scenario": "Pensando ai tuoi traguardi professionali più ambiziosi, quelli che ti stanno più a cuore. Quanto ti pesa raggiungerli?",
        "instructions": [
            "Immagine di una piuma che vola leggera.",
            "Immagine di qualcuno che cammina in salita.",
            "Immagine di uno scalatore appeso su una parete rocciosa, sudato.",
            "Immagine di un muro imponente."
        ],
        "captions": [
            "Non sono affaticato",
            "Mi Impegno",
            "Faccio Fatica",
            "Sembrano un Muro"
        ],
        "options": [
            {
                "value": "Non sono affaticato",
                "text": "(Positivo: ottimismo resiliente e fiducia nelle proprie risorse cognitive, approccio leggero che favorisce la creatività e riduce lo stress da performance, percezione di autoefficacia) (Negativo: potenziale sottovalutazione della complessità reale, rischio di scarsa preparazione ai 'worst case scenario', percezione di eccessiva sicurezza o superficialità analitica)."
            },
            {
                "value": "Mi Impegno",
                "text": "(Positivo: orientamento realistico all'azione e determinazione costante, equilibrio tra sfida e capacità, consapevolezza dell'importanza del processo e dello sforzo focalizzato) (Negativo: rischio di frustrazione se i risultati non sono immediati, potenziale sovraccarico in caso di ostacoli imprevisti, percezione di una sicurezza iniziale che potrebbe vacillare sotto pressione estrema)."
            },
            {
                "value": "Faccio Fatica",
                "text": "(Positivo: perseveranza eroica e tenacia incrollabile di fronte alle avversità, capacità di operare in condizioni di sforzo estremo senza desistere, forte orientamento al sacrificio per l'obiettivo) (Negativo: elevato rischio di stress cronico e calo della qualità della vita, mancata ottimizzazione del percorso per eccessiva focalizzazione sulla fatica, percezione di una scalata non sostenibile nel lungo periodo)."
            },
            {
                "value": "Sembrano un Muro",
                "text": "(Positivo: pragmatismo nell'identificare limiti oggettivi e istinto di autoprotezione contro sforzi infruttuosi, onestà intellettuale nel riconoscere la necessità di nuove risorse o competenze) (Negativo: bassa autostima e locus of control esterno, tendenza alla rinuncia precoce e alla paralisi decisionale, rischio di vittimismo e mancanza di proattività nel cercare alternative)."
            }
        ],
        "softSkill": "Resilienza, Autocritica",
        "characteristics": "Motivazione, Rischio di Burnout, Perseveranza",
        "scores": {
            "energia": 20,
            "guardia": 15,
            "flusso": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "12": {
        "num": 12,
        "scenario": "Guardando al tuo percorso professionale, quale di queste visioni descrive meglio la tua ambizione per i prossimi anni?",
        "instructions": [
            "Immagine di uno in ufficio, tranquillo e sistemato.",
            "Immagine di un trasloco ben Organizzato.",
            "Immagine di un piccolo negozio con il proprietario orgoglioso",
            "Immagine di un paracadutista, senza paura."
        ],
        "captions": [
            "Nello Stesso Posto Tutta la Vita",
            "Un Posto Fisso anche con un Cambiamento",
            "Mi Impegno per Fare Qualcosa di Mio",
            "Mi Lancio in nuove avventure Senza Paura"
        ],
        "options": [
            {
                "value": "Nello Stesso Posto Tutta la Vita",
                "text": "(Positivo: massima affidabilità e fedeltà istituzionale, valorizzazione della stabilità come base per l'eccellenza in un ruolo consolidato, affidabilità granitica nei processi routinari) (Negativo: potenziale resistenza al cambiamento e scarsa flessibilità cognitiva, rischio di obsolescenza professionale per mancanza di stimoli evolutivi, limitata ambizione imprenditoriale)."
            },
            {
                "value": "Un Posto Fisso anche con un Cambiamento",
                "text": "(Positivo: approccio equilibrato tra sicurezza contrattuale e mobilità professionale, gestione prudente e pianificata della carriera, capacità di conciliare stabilità e adattamento ambientale) (Negativo: potenziale eccesso di cautela che frena la realizzazione del pieno potenziale, rischio di rimanere in una 'comfort zone' limitante, possibile timore del rischio calcolato)."
            },
            {
                "value": "Mi Impegno per Fare Qualcosa di Mio",
                "text": "(Positivo: spirito imprenditoriale bilanciato e realismo strategico, capacità di esplorare nuove strade mantenendo una base di sicurezza, orientamento alla costruzione graduale di valore autonomo) (Negativo: potenziale lentezza nel distaccarsi da situazioni consolidate, rischio di dispersione di energie tra due fronti, ambizione imprenditoriale che potrebbe mancare di audacia estrema in momenti critici)."
            },
            {
                "value": "Mi Lancio in nuove avventure Senza Paura",
                "text": "(Positivo: audacia imprenditoriale superiore e orientamento al successo radicale, forte propensione al rischio strategico e determinazione nel perseguire l'autonomia totale, dinamismo estremo) (Negativo: rischio elevato di instabilità finanziaria per decisioni impulsive, mancanza di prudenza e pianificazione difensiva, potenziale sovrastima delle proprie risorse in contesti volatili)."
            }
        ],
        "softSkill": "DecisionMakingStrategico, PianificazioneEOrganizzazione",
        "characteristics": "Spirito Imprenditoriale, Propensione al Rischio, Proattività",
        "scores": {
            "energia": 25,
            "flusso": 15,
            "mente": 10,
            "guardia": 0,
            "cuore": 0
        }
    },
    "14": {
        "num": 14,
        "scenario": "Sulla tua \"bilancia\" delle decisioni, quale di questi piatti ha solitamente il peso maggiore?",
        "instructions": [
            "Immagine di una bilancia, che pende dal lato delle persone multietniche.",
            "Immagine di una bilancia, che pende dal lato dei divertimenti, un parco divertimenti sopra il piatto.",
            "Immagine di una bilancia, che pende dal lato delle responsabilità, una casa sopra il piatto",
            "Immagine di una bilancia, che pende dal lato degli sport."
        ],
        "captions": [
            "I Rapporti Umani",
            "I Divertimenti",
            "Le Responsabilità",
            "Il mio Benessere"
        ],
        "options": [
            {
                "value": "I Rapporti Umani",
                "text": "(Positivo: spiccata intelligenza emotiva e orientamento umanistico, capacità di costruire relazioni solide e leali come base per ogni successo professionale, empatia profonda) (Negativo: rischio di parzialità nel giudizio dovuta al coinvolgimento emotivo, potenziale difficoltà nel prendere decisioni impopolari o puramente razionali, vulnerabilità alle dinamiche relazionali)."
            },
            {
                "value": "I Divertimenti",
                "text": "(Positivo: ottimismo contagioso e capacità di 'stress management' attraverso la leggerezza, approccio creativo e non convenzionale alla vita, alta reattività emotiva positiva) (Negativo: rischio di scarsa affidabilità in contesti ad alta pressione e responsabilità, potenziale superficialità gestionale, mancanza di focus sugli obiettivi di lungo periodo)."
            },
            {
                "value": "Le Responsabilità",
                "text": "(Positivo: affidabilità granitica e forte senso del dovere professionale, orientamento all'impegno costante e alla consegna dei risultati, lealtà istituzionale superiore) (Negativo: rischio elevato di stress da sovraccarico e burnout, potenziale rigidità relazionale per eccesso di rigore, difficoltà a delegare e a concedersi spazi di recupero necessari)."
            },
            {
                "value": "Il mio Benessere",
                "text": "(Positivo: eccellente gestione dell'equilibrio vita-lavoro e sostenibilità della performance nel tempo, approccio consapevole che preserva le risorse personali come asset strategico) (Negativo: potenziale percezione di scarsa dedizione o ambizione in contesti 'high-performance', rischio di non rispondere adeguatamente a picchi di lavoro straordinari)."
            }
        ],
        "softSkill": "Equita , Empatia",
        "characteristics": "Equità, Pregiudizio, Lealtà, Obiettività",
        "scores": {
            "cuore": 20,
            "guardia": 20,
            "mente": 10,
            "flusso": 5,
            "energia": 0
        }
    },
    "15": {
        "num": 15,
        "scenario": "Pensa al futuro, qual è la sensazione che provi più spesso?",
        "instructions": [
            "Immagine di qualcuno che cammina dritto senza paura.",
            "Immagine di uno zaino in spalla, pronto a partire.",
            "Immagine di qualcuno che guarda una mappa, un po'perso.",
            "Immagine di qualcuno bloccato dalla paura, paralizzato."
        ],
        "captions": [
            "Futuro? Zero Problemi",
            "Pronto ad Ogni Caso",
            "Boh e Chi lo Sa",
            "Futuro? Panico Totale"
        ],
        "options": [
            {
                "value": "Futuro? Zero Problemi",
                "text": "(Positivo: ottimismo resiliente superiore e fiducia proattiva nel proprio futuro, approccio privo di freni inibitori verso l'innovazione e l'ignoto, coraggio operativo spiccato) (Negativo: rischio di imprudenza strategica e sottovalutazione dei rischi sistemici, potenziale mancanza di piani di emergenza per eccesso di sicurezza, scarsa propensione alla pianificazione difensiva)."
            },
            {
                "value": "Pronto ad Ogni Caso",
                "text": "(Positivo: eccellente capacità di previsione e gestione proattiva del rischio, approccio metodico alla pianificazione del futuro che garantisce sicurezza e controllo in ogni scenario) (Negativo: rischio di ansia anticipatoria e iper-controllo paralizzante, potenziale perdita di spontaneità operativa, eccessivo dispendio di energie cognitive nella preparazione di scenari improbabili)."
            },
            {
                "value": "Boh e Chi lo Sa",
                "text": "(Positivo: massima flessibilità adattiva e orientamento al presente ('mindfulness'), capacità di navigare nell'incertezza senza stress eccessivo, apertura alla serendipità e alla creatività) (Negativo: imprevidenza gestionale e mancanza di obiettivi di lungo termine, rischio di subire passivamente il cambiamento invece di guidarlo, percezione di scarsa affidabilità strategica)."
            },
            {
                "value": "Futuro? Panico Totale",
                "text": "(Positivo: alta sensibilità verso le incognite che può fungere da segnale d'allarme per la ricerca di supporto e nuove competenze, consapevolezza critica dei pericoli ambientali) (Negativo: blocco emotivo e paralisi decisionale dovuta al pessimismo sistemico, scarsa autostima e locus of control esterno, incapacità di pianificare azioni costruttive verso il domani)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, GestioneDelloStress",
        "characteristics": "Livelli di Ansia, Proattività, Orientamento al Futuro",
        "scores": {
            "guardia": 20,
            "energia": 15,
            "flusso": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "17": {
        "num": 17,
        "scenario": "Parli al telefono con qualcuno. Quanto ti viene naturale far capire come ti senti, solo con la voce?",
        "instructions": [
            "Immagine di giocatore di poker durante una partita.",
            "Immagine di una faccia con una piccola smorfia, appena accennata.",
            "Immagine di una faccia espressiva ma non esagerata.",
            "Immagine di una attore sul palco."
        ],
        "captions": [
            "Tono Sempre Neutro.",
            "Emozioni Minime.",
            "Emozioni Misurate.",
            "Faccio Teatro, come sempre."
        ],
        "options": [
            {
                "value": "Tono Sempre Neutro.",
                "text": "(Positivo: controllo totale del linguaggio para-verbale e massima razionalità comunicativa, capacità di separare nettamente l'emozione dal contenuto oggettivo del messaggio, eccellente self-control) (Negativo: rischio di percezione di freddezza o distacco empatico, mancanza di calore umano nella comunicazione telefonica, potenziale difficoltà nel creare una connessione relazionale autentica)."
            },
            {
                "value": "Emozioni Minime.",
                "text": "(Positivo: discrezione e riservatezza professionale, approccio misurato che evita l'invasività emotiva in contesti formali, mantenimento di un tono sobrio e controllato) (Negativo: rischio di ambiguità emotiva e scarsa espressività, possibile incomprensione degli stati d'animo da parte dell'interlocutore, percezione di una comunicazione poco coinvolgente o piatta)."
            },
            {
                "value": "Emozioni Misurate.",
                "text": "(Positivo: comunicazione para-verbale naturale ed efficace, capacità di trasmettere autenticità ed empatia attraverso la voce, eccellente equilibrio tra controllo professionale ed espressività umana) (Negativo: potenziale vulnerabilità in situazioni di altissima tensione dove l'emozione potrebbe trapelare eccessivamente, rischio di minor distacco analitico in contesti puramente razionali)."
            },
            {
                "value": "Faccio Teatro, come sempre.",
                "text": "(Positivo: carisma comunicativo superiore e capacità di coinvolgimento emotivo totale, attitudine a trasmettere passione ed entusiasmo influenzando positivamente l'interlocutore) (Negativo: rischio di percezione di inautenticità o eccessiva drammatizzazione, reazioni emotive potenzialmente sproporzionate rispetto al contesto, possibile invasività emotiva percepita come manipolatoria)."
            }
        ],
        "softSkill": "ComunicazioneEfficace, Empatia",
        "characteristics": "Espressività Emotiva, Stile di Comunicazione, Consapevolezza Emotiva",
        "scores": {
            "cuore": 20,
            "flusso": 15,
            "energia": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "18": {
        "num": 18,
        "scenario": "Quanto pensi di essere capace di ispirare e guidare le persone?",
        "instructions": [
            "Immagine di lupo che cammina da solo, nessuno lo segue.",
            "Immagine di un gruppetto di lupi che cammina insieme, senza una guida chiara.",
            "Immagine di un gruppo branco di lupi che segue uno.",
            "Immagine di una folla oceanica di lupi che ulula al leader sulla rupe, con entusiasmo."
        ],
        "captions": [
            "Io sono un Lupo Solitario",
            "Siamo una Piccola Banda",
            "Seguito Quel Tanto che Basta",
            "Voglio essere Acclamato dalla Folla"
        ],
        "options": [
            {
                "value": "Io sono un Lupo Solitario",
                "text": "(Positivo: massima autonomia decisionale e indipendenza operativa ('self-reliance'), capacità di operare efficacemente senza bisogno di validazione esterna o seguito, focus totale sul risultato individuale) (Negativo: mancanza di propensione alla leadership e tendenza all'isolamento professionale, difficoltà nel lavoro di squadra e nell'influenzare positivamente gli altri, percezione di individualismo spinto)."
            },
            {
                "value": "Siamo una Piccola Banda",
                "text": "(Positivo: leadership informale efficace in cerchie ristrette, capacità di creare legami fiduciari profondi e personali, approccio collaborativo non gerarchico basato sulla stima reciproca) (Negativo: limitata ambizione di leadership su vasta scala, potenziale difficoltà a emergere in contesti complessi e competitivi, percezione di influenza circoscritta a contesti 'micro')."
            },
            {
                "value": "Seguito Quel Tanto che Basta",
                "text": "(Positivo: leadership funzionale e pragmatica orientata al risultato concreto, capacità di guidare team operativi con equilibrio senza eccessi di protagonismo, affidabilità gestionale) (Negativo: mancanza di carisma ispirazionale e slancio visionario, potenziale difficoltà nel motivare il personale in fasi di crisi o cambiamento profondo, percezione di leadership solida ma non trascinante)."
            },
            {
                "value": "Voglio essere Acclamato dalla Folla",
                "text": "(Positivo: leadership carismatica superiore e visione trascinante, capacità innata di ispirare e muovere grandi gruppi verso obiettivi ambiziosi, massima fiducia nel proprio ascendente sociale) (Negativo: rischio di narcisismo ipertrofico e autoritarismo, potenziale tendenza alla creazione di un culto della personalità, difficoltà nella gestione della delega e nel riconoscimento del valore altrui)."
            }
        ],
        "softSkill": "Leadership, GestioneDelTeam",
        "characteristics": "Potenziale di Leadership, Carisma, Influence Sociale",
        "scores": {
            "energia": 25,
            "cuore": 15,
            "mente": 5,
            "guardia": 0,
            "flusso": 0
        }
    },
    "20": {
        "num": 20,
        "scenario": "Sei al ristorante, bar, o un posto simile. Come ti comporti di solito con il Personale?",
        "instructions": [
            "Immagine di una persona stilizzata, seduta ad un tavolino di un bar.",
            "Immagine di due sagome stilizzate che si passano un pacco, transazione veloce.",
            "Immagine di tre sagome stilizzate che parlano amichevolmente,  cerchio sociale ristretto.",
            "Immagine di tante sagome stilizzate che fanno festa insieme,  integrazione totale."
        ],
        "captions": [
            "Cliente Fantasma",
            "Solo per il Servizio",
            "Cordiale e Socievole",
            "Faccio Festa con Tutti"
        ],
        "options": [
            {
                "value": "Cliente Fantasma",
                "text": "(Positivo: massimo rispetto della privacy altrui e discrezione assoluta, approccio ultra-efficiente focalizzato sulla transazione economica pura, indipendenza relazionale) (Negativo: chiusura sociale e percezione di freddezza o distacco, opportunità relazionali perse, mancanza di calore umano e di connessione minima con l'ambiente circostante)."
            },
            {
                "value": "Solo per il Servizio",
                "text": "(Positivo: efficienza operativa e rispetto dei ruoli professionali, approccio formale ed educato orientato alla rapidità, linearità nell'interazione di servizio) (Negativo: percezione di comunicazione puramente utilitaristica, mancanza di empatia relazionale spontanea, scarsa propensione a creare un clima di benessere sociale diffuso)."
            },
            {
                "value": "Cordiale e Socievole",
                "text": "(Positivo: socievolezza equilibrata e cortesia relazionale, capacità di creare un clima piacevole e cordiale senza risultare invadenti, gestione corretta della 'socialità casuale') (Negativo: interazione potenzialmente superficiale, rischio di rimanere in una zona di comfort relazionale limitata, possibile mancanza di approfondimento nel networking spontaneo)."
            },
            {
                "value": "Faccio Festa con Tutti",
                "text": "(Positivo: estroversione superiore e facilità estrema nel creare nuove connessioni, approccio carismatico ed entusiasta che valorizza l'interazione umana come risorsa prioritaria) (Negativo: rischio di invadenza e difficoltà nel percepire i confini e lo spazio personale altrui, potenziale percezione di eccessiva espansività inappropriata al contesto, mancanza di discrezione)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, ComunicazioneEfficace",
        "characteristics": "Introversione vs. Estroversione, Comfort Sociale, Apertura",
        "scores": {
            "cuore": 25,
            "flusso": 15,
            "energia": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "21": {
        "num": 21,
        "scenario": "Quando osservi un comportamento fuori dagli schemi o bizzarro, qual è il tuo primo pensiero?",
        "instructions": [
            "Immagine di un camaleonte che cambia colore per adattarsi all'ambiente.",
            "Immagine di una bilancia della giustizia perfettamente in equilibrio.",
            "Immagine di un paesaggio nebbioso che oscura la vista.",
            "Immagine di un orologio a cucù con un uccello cucù che esce in modo caotico."
        ],
        "captions": [
            "Cerco di Capire Sempre Tutti",
            "Cerco di Essere Logico",
            "A Volte Non Capisco",
            "Ma Che Gli Salta in Mente?"
        ],
        "options": [
            {
                "value": "Cerco di Capire Sempre Tutti",
                "text": "(Positivo: eccellente apertura mentale e attitudine all'inclusione radicale, capacità di sospendere il giudizio immediato per favorire la comprensione delle diversità comportamentali) (Negativo: rischio di eccessiva giustificazione di condotte disfunzionali, potenziale mancanza di rigore critico, tendenza al 'buonismo' che può compromettere l'obiettività valutativa)."
            },
            {
                "value": "Cerco di Essere Logico",
                "text": "(Positivo: approccio analitico rigoroso orientato alla decodifica razionale dei comportamenti, ricerca di coerenza causale e obiettività nel giudizio sociale) (Negativo: rischio di rigidità cognitiva di fronte a dinamiche emotive non lineari, potenziale incomprensione delle sfumature irrazionali del comportamento umano, distacco eccessivo)."
            },
            {
                "value": "A Volte Non Capisco",
                "text": "(Positivo: onestà intellettuale superiore e consapevolezza dei propri limiti euristici, umiltà nel riconoscere la complessità dell'altro senza forzare interpretazioni arbitrarie) (Negativo: potenziale passività o rinuncia precoce allo sforzo empatico, rischio di rassegnazione di fronte alla diversità, percezione di scarso impegno nella costruzione di ponti comunicativi)."
            },
            {
                "value": "Ma Che Gli Salta in Mente?",
                "text": "(Positivo: forte ancoraggio al proprio sistema di valori e coerenza interna rassicurante, rapidità di giudizio basata su norme consolidate e chiarezza di standard comportamentali) (Negativo: elevato rischio di pregiudizio e chiusura verso l'alterità, mancanza di curiosità antropologica, percezione di intolleranza verso ciò che non è conforme al proprio modello)."
            }
        ],
        "softSkill": "Empatia, Comprensione",
        "characteristics": "Empatia, Ragionamento Logico, Assunzione di Prospettiva",
        "scores": {
            "mente": 25,
            "cuore": 15,
            "flusso": 10,
            "guardia": 0,
            "energia": 0
        }
    },
    "22": {
        "num": 22,
        "scenario": "Quanta parte di quello che guadagni metti via per il futuro?",
        "instructions": [
            "Immagine di un deserto arido e senza vita.",
            "Immagine di un piccolo germoglio che spunta dalla terra.",
            "Immagine di un giovane albero con alcuni frutti.",
            "Immagine di un granaio che trabocca di grano."
        ],
        "captions": [
            "Salvadanaio Vuoto",
            "Salvadanaio Appena Iniziato",
            "Salvadanaio Abbastanza Pieno",
            "Salvadanaio Pieno Zeppo"
        ],
        "options": [
            {
                "value": "Salvadanaio Vuoto",
                "text": "(Positivo: orientamento alla gratificazione immediata e assenza di ansia anticipatoria legata al futuro, capacità di vivere pienamente il presente investendo nel benessere attuale) (Negativo: imprevidenza finanziaria critica e mancanza di pianificazione strategica, elevata vulnerabilità a shock economici esterni, assenza di visione prospettica)."
            },
            {
                "value": "Salvadanaio Appena Iniziato",
                "text": "(Positivo: fase iniziale di consapevolezza previdenziale e tentativo di stabilire abitudini di risparmio sostenibili, riconoscimento della necessità di un paracadute finanziario) (Negativo: risparmio insufficiente a garantire una reale sicurezza nel lungo periodo, mancanza di una strategia finanziaria strutturata, potenziale fragilità economica)."
            },
            {
                "value": "Salvadanaio Abbastanza Pieno",
                "text": "(Positivo: eccellente equilibrio tra 'consumo presente' e 'sicurezza futura', gestione responsabile e razionale delle risorse economiche, approccio bilanciato e sostenibile) (Negativo: potenziale eccesso di prudenza che frena investimenti più ambiziosi o gratificazioni meritate, rischio di una crescita patrimoniale non massimizzata per timore del rischio)."
            },
            {
                "value": "Salvadanaio Pieno Zeppo",
                "text": "(Positivo: massima disciplina finanziaria e orientamento alla sicurezza assoluta nel lungo periodo, capacità di 'gratificazione differita' superiore e pianificazione patrimoniale rigorosa) (Negativo: rischio di frugalità ossessiva e sacrificio eccessivo del benessere presente, potenziale rigidità mentale legata all'accumulo, stress da controllo finanziario)."
            }
        ],
        "softSkill": "FinanzaPersonale, Autodisciplina",
        "characteristics": "Pianificazione Finanziaria, Abitudini di Risparmio, Orientamento al Futuro, Responsabilità Finanziaria",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "flusso": 5,
            "energia": 0,
            "cuore": 0
        }
    },
    "23": {
        "num": 23,
        "scenario": "Quando la situazione richiede di essere schietti e diretti, come la affronti?",
        "instructions": [
            "Immagine di un Leone.",
            "Immagine di un Gufo",
            "Immagine di un Gattino.",
            "Immagine di un Pesce."
        ],
        "captions": [
            "Schietto e Diretto Sempre",
            "Chiaro, ma con Cautela",
            "Evito di Essere Diretto",
            "Resto in Silenzio"
        ],
        "options": [
            {
                "value": "Schietto e Diretto Sempre",
                "text": "(Positivo: comunicazione ultra-diretta e trasparenza assoluta, efficienza nella trasmissione di messaggi critici senza ambiguità, franchezza che favorisce la risoluzione immediata dei problemi) (Negativo: rischio elevato di aggressività percepita e danno relazionale, mancanza di tatto diplomatico, potenziale isolamento per eccessiva durezza espressiva)."
            },
            {
                "value": "Chiaro, ma con Cautela",
                "text": "(Positivo: eccellente equilibrio tra assertività e diplomazia, capacità di comunicare verità scomode preservando l'integrità della relazione, approccio professionale e rispettoso) (Negativo: rischio di diluire eccessivamente il messaggio per timore della reazione altrui, potenziale perdita di incisività in situazioni che richiederebbero una fermezza assoluta)."
            },
            {
                "value": "Evito di Essere Diretto",
                "text": "(Positivo: orientamento alla preservazione dell'armonia del team e sensibilità verso i sentimenti altrui, approccio non conflittuale che favorisce un clima rilassato) (Negativo: inefficacia nel problem-solving comunicativo e ambiguità informativa, rischio di accumulare malintesi che possono degenerare, mancanza di assertività necessaria)."
            },
            {
                "value": "Resto in Silenzio",
                "text": "(Positivo: massima prudenza comunicativa in situazioni ad alto rischio, capacità di esercitare il silenzio come forma di autoprotezione e controllo dell'impulsività verbale) (Negativo: passività totale di fronte alla necessità di feedback, rinuncia alla leadership comunicativa, percezione di inaffidabilità o disimpegno relazionale)."
            }
        ],
        "softSkill": "ComunicazioneEfficace, GestioneDeiConflitti",
        "characteristics": "Assertività, Capacità di Comunicazione, Gestione dei Conflitti, Sicurezza di Sé",
        "scores": {
            "energia": 20,
            "guardia": 15,
            "cuore": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "25": {
        "num": 25,
        "scenario": "Quanto pensi che il tuo modo di fare sia d'ispirazione per gli altri?",
        "instructions": [
            "Immagine di un manichino di alta moda con un abito unico e originale in un atelier vuoto.",
            "Immagine di una persona che si guarda allo specchio e vede riflessa una figura con un abbigliamento simile ma non identico, \"ispirato\".",
            "Immagine di una vetrina di negozio con diversi manichini che indossano abiti con un tema stilistico comune, una tendenza che si diffonde.",
            "Immagine di una folla oceanica di persone vestite in modo identico, come un esercito di \"cloni\" fashion."
        ],
        "captions": [
            "Stile Unico, Nessuno Mi Copia",
            "Qualcuno Mi Copia un Po'",
            "Mi Imitano Spesso",
            "Tutti Vogliono Essere Come Me"
        ],
        "options": [
            {
                "value": "Stile Unico, Nessuno Mi Copia",
                "text": "(Positivo: originalità radicale e indipendenza totale dal conformismo sociale, forte identità personale e non influenzabilità esterna, unicità carismatica solitaria) (Negativo: isolamento sociale e mancanza di impatto sui comportamenti altrui, difficoltà nel trasmettere visioni o guidare cambiamenti collettivi, percezione di individualismo eccessivo)."
            },
            {
                "value": "Qualcuno Mi Copia un Po'",
                "text": "(Positivo: influenza sottile e misurata in cerchie ristrette, stile personale riconoscibile ma non ostentato, equilibrio tra distinzione e integrazione sociale) (Negativo: potenziale mancanza di ambizione nell'espandere il proprio raggio d'influenza, leadership circoscritta a contesti informali, influenza non massimizzata)."
            },
            {
                "value": "Mi Imitano Spesso",
                "text": "(Positivo: capacità naturale di fungere da 'role model' per molti, leadership d'opinione consolidata e carisma socialmente riconosciuto, forte capacità di influenzare tendenze e decisioni altrui) (Negativo: rischio di eccessivo focus sulla propria immagine pubblica e ricerca di convalida esterna, potenziale dipendenza dal riconoscimento sociale per alimentare l'autostima)."
            },
            {
                "value": "Tutti Vogliono Essere Come Me",
                "text": "(Positivo: leadership carismatica di massa e potere di influenza eccezionale, capacità di dettare standard comportamentali e ispirare emulazione totale su larga scala) (Negativo: rischio di narcisismo patologico e manipolazione carismatica, tendenza a circondarsi di 'yes-men', potenziale distacco dalla realtà per eccessivo senso di superiorità sociale)."
            }
        ],
        "softSkill": "Leadership, GestioneDelTeam",
        "characteristics": "Influenza, Carisma, Role Modeling, Leadership (potenziale)",
        "scores": {
            "energia": 25,
            "mente": 15,
            "cuore": 10,
            "guardia": 0,
            "flusso": 0
        }
    },
    "26": {
        "num": 26,
        "scenario": "Guardando al tuo percorso fino ad oggi, come descriveresti le occasioni che hai incontrato?",
        "instructions": [
            "Immagine di una porta chiusa.",
            "Immagine di una porta socchiusa.",
            "Immagine di una porta aperta.",
            "Immagine di tante porte aperte e corridoi luminosi."
        ],
        "captions": [
            "Porte Chiuse",
            "Pochi Spiragli",
            "Porte Aperte",
            "Molte Opportunità"
        ],
        "options": [
            {
                "value": "Porte Chiuse",
                "text": "(Positivo: alta resilienza psicologica e capacità di sviluppare 'grit' (tenacia) in contesti avversi, attitudine al superamento degli ostacoli attraverso la forza di volontà individuale) (Negativo: rischio di deriva verso il vittimismo e un locus of control esterno, percezione limitante delle opportunità che può generare immobilismo e rassegnazione)."
            },
            {
                "value": "Pochi Spiragli",
                "text": "(Positivo: realismo pragmatico e gestione equilibrata delle aspettative, capacità di muoversi con cautela in contesti complessi senza farsi influenzare da facili entusiasmi) (Negativo: potenziale mancanza di proattività nel creare nuove opportunità, rischio di accontentarsi dello status quo per timore di fallire, ambizione contenuta)."
            },
            {
                "value": "Porte Aperte",
                "text": "(Positivo: eccellente equilibrio emotivo e soddisfazione per il percorso compiuto, capacità di valorizzare le risorse disponibili mantenendo una stabilità psicologica rassicurante) (Negativo: potenziale stagnazione professionale per mancanza di stimoli evolutivi, rischio di perdita di competitività in contesti dinamici, ambizione moderata)."
            },
            {
                "value": "Molte Opportunità",
                "text": "(Positivo: ottimismo proattivo superiore e mentalità orientata all'abbondanza ('abundance mindset'), capacità di trasformare ogni criticità in opportunità di crescita) (Negativo: rischio di sottovalutazione dei pericoli reali e ingenuità strategica, potenziale dispersione di energie su troppi fronti, tendenza a ignorare i segnali d'allarme)."
            }
        ],
        "softSkill": "Innovazione, MenteAperta",
        "characteristics": "Ottimismo, Proattività, Prospettiva sulla Vita",
        "scores": {
            "energia": 20,
            "flusso": 15,
            "guardia": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "27": {
        "num": 27,
        "scenario": "Quanto fai fatica di solito a fare nuove amicizie?",
        "instructions": [
            "Immagine di un cane cool con occhiali da sole, rilassato su una sdraio, completamente solo su una piccola isola deserta paradisiaca.",
            "Immagine di una porta socchiusa, appena aperta.",
            "Immagine di un ponte che si estende verso l'orizzonte, che collega due sponde.",
            "Immagine di fuochi d'artificio che esplodono in mille colori e luci, illuminando la notte."
        ],
        "captions": [
            "Sto Meglio da Solo",
            "Ci Metto un Po'",
            "Faccio Amicizia, Ma Non Subito",
            "Amici Al Volo"
        ],
        "options": [
            {
                "value": "Sto Meglio da Solo",
                "text": "(Positivo: forte indipendenza emotiva e autonomia sociale ('self-reliance'), capacità di operare con efficacia senza dipendere dal riconoscimento o dalla compagnia altrui) (Negativo: rischio di isolamento e chiusura autoreferenziale, potenziale difficoltà nel networking e nella collaborazione di team, percezione di distacco sociale)."
            },
            {
                "value": "Ci Metto un Po'",
                "text": "(Positivo: prudenza relazionale e capacità di costruire legami profondi basati sulla fiducia e sulla selettività qualitativa, affidabilità e lealtà nel lungo periodo) (Negativo: lentezza nell'integrazione sociale immediata, potenziale perdita di opportunità di networking rapido, percezione iniziale di eccessiva riservatezza o timidezza)."
            },
            {
                "value": "Faccio Amicizia, Ma Non Subito",
                "text": "(Positivo: socievolezza equilibrata e gradualità nell'apertura relazionale, capacità di gestire il contatto sociale con misura e rispetto dei tempi altrui) (Negativo: rischio di non essere percepiti come immediatamente accessibili in contesti dinamici, potenziale minor impatto comunicativo al primo incontro)."
            },
            {
                "value": "Amici Al Volo",
                "text": "(Positivo: estroversione superiore e agilità nel creare connessioni immediate, carisma sociale spiccato e facilità nel rompere il ghiaccio in ogni contesto) (Negativo: potenziale superficialità relazionale e difficoltà nell'approfondire i legami, rischio di percezione di invadenza o inautenticità, dispersione energetica sociale)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, ComunicazioneEfficace",
        "characteristics": "Introversione vs. Estroversione, Adattabilità Sociale, Apertura",
        "scores": {
            "cuore": 25,
            "flusso": 15,
            "energia": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "28": {
        "num": 28,
        "scenario": "Quanto senti che gli altri, riconoscano davvero il tuo impegno?",
        "instructions": [
            "Immagine di un Piatto stellato di alta cucina",
            "Immagine di un Piatto casalingo di lasagna.",
            "Immagine di un Piatto di minestra.",
            "Immagine di una Tovaglia da tavola sporca e macchiata alla fine del pasto."
        ],
        "captions": [
            "Apprezzato al Massimo",
            "Apprezzato Abbastanza",
            "Poco Apprezzato",
            "Invisibile"
        ],
        "options": [
            {
                "value": "Apprezzato al Massimo",
                "text": "(Positivo: solida autostima e percezione di un alto valore sociale/professionale, sicurezza personale che irradia carisma e competenza riconosciuta) (Negativo: potenziale dipendenza narcisistica dalla validazione esterna, rischio di fragilità emotiva in caso di calo del consenso, eccessiva focalizzazione sull'immagine)."
            },
            {
                "value": "Apprezzato Abbastanza",
                "text": "(Positivo: autonomia emotiva e sano realismo, capacità di trarre soddisfazione dal proprio operato indipendentemente dal riconoscimento pubblico costante, stabilità interna) (Negativo: potenziale mancanza di ambizione nel ricercare posizioni di maggiore prestigio, rischio di autosvalutazione latente o eccessiva modestia)."
            },
            {
                "value": "Poco Apprezzato",
                "text": "(Positivo: resilienza superiore e motivazione intrinseca, capacità di perseverarse negli obiettivi nonostante la mancanza di feedback positivi, indipendenza dal giudizio altrui) (Negativo: frustrazione accumulata e potenziale calo della motivazione estrinseca, rischio di isolamento professionale e percezione di ingiustizia)."
            },
            {
                "value": "Invisibile",
                "text": "(Positivo: massima indipendenza operativa e libertà d'azione radicale da ogni condizionamento sociale, attitudine al lavoro 'dietro le quinte' senza ricerca di protagonismo) (Negativo: profonda alienazione e crisi di senso, rischio di disimpegno totale per percezione di inutilità del proprio contributo, bassissima autostima percepita)."
            }
        ],
        "softSkill": "FiduciaInSeStessi, Autocritica",
        "characteristics": "Autostima, Sensibilità Sociale, Livelli di Fiducia",
        "scores": {
            "guardia": 20,
            "cuore": 15,
            "energia": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "30": {
        "num": 30,
        "scenario": "Come ti comporti di solito quando parli con le persone?",
        "instructions": [
            "Immagine di un trombone che suona a festa.",
            "Immagine di un equalizzatore grafico con cursori bilanciati.",
            "Immagine di un megafono abbassato e non utilizzato, inattivo.",
            "Immagine dell'icona \"offline\" di un dispositivo digitale."
        ],
        "captions": [
            "Dico Tutto Quel Che Penso",
            "Dico Quasi Tutto",
            "Parole Scelte con Cura",
            "Parlo Poco, Solo se Devo"
        ],
        "options": [
            {
                "value": "Dico Tutto Quel Che Penso",
                "text": "(Positivo: massima trasparenza e integrità comunicativa, approccio autentico che riduce al minimo le ambiguità relazionali e favorisce la fiducia immediata) (Negativo: rischio di scarsa diplomazia e insensibilità verso il contesto, potenziale aggressività verbale non intenzionale, vulnerabilità ai conflitti interpersonali)."
            },
            {
                "value": "Dico Quasi Tutto",
                "text": "(Positivo: eccellente equilibrio tra onestà comunicativa e intelligenza sociale, capacità di modulare il messaggio preservando sia la verità che l'armonia relazionale) (Negativo: potenziale percezione di calcolo comunicativo o scarsa spontaneità in contesti informali, rischio di omissioni strategiche percepite)."
            },
            {
                "value": "Parole Scelte con Cura",
                "text": "(Positivo: alta diplomazia e sensibilità verso la 'face' dell'interlocutore, capacità di navigare in situazioni delicate con estrema prudenza e rispetto dei confini emotivi) (Negativo: rischio di inautenticità o eccessiva cautela che annacqua il messaggio, potenziale mancanza di trasparenza, percezione di distacco o controllo eccessivo)."
            },
            {
                "value": "Parlo Poco, Solo se Devo",
                "text": "(Positivo: eccellente autocontrollo e capacità di ascolto analitico, approccio riflessivo che minimizza il rischio di errori comunicativi o conflitti non necessari) (Negativo: percezione di chiusura sociale o reticenza, mancanza di iniziativa relazionale, potenziale isolamento informativo e difficoltà nel networking)."
            }
        ],
        "softSkill": "ComunicazioneEfficace, Empatia",
        "characteristics": "Stile di Comunicazione, Sensibilità, Evitamento del Conflitto",
        "scores": {
            "mente": 20,
            "guardia": 20,
            "cuore": 15,
            "flusso": 0,
            "energia": 0
        }
    },
    "31": {
        "num": 31,
        "scenario": "Immagina di essere al centro dell'attenzione. Come ti senti di solito in queste situazioni?",
        "instructions": [
            "Immagine di un attore che si gode il palco.",
            "Immagine di un oratore che parla davanti a un pubblico.",
            "Immagine di qualcuno che canta ad un karaoke",
            "Immagine di qualcuno che scappa via dal palcoscenico."
        ],
        "captions": [
            "Star del Palco",
            "Attenzione ok, Ma Non Troppa",
            "Un Poco di Imbarazzo",
            "Panico da Palcoscenico"
        ],
        "options": [
            {
                "value": "Star del Palco",
                "text": "(Positivo: eccellente sicurezza di sé e naturalezza nell'esposizione pubblica, carisma scenico superiore che facilita la leadership visibile e l'influenza sociale) (Negativo: rischio di deriva egocentrica e ricerca compulsiva di validazione esterna, potenziale percezione di narcisismo, difficoltà in ruoli che richiedono discrezione)."
            },
            {
                "value": "Attenzione ok, Ma Non Troppa",
                "text": "(Positivo: equilibrio ottimale tra presenza scenica e sobrietà professionale, capacità di gestire la visibilità con misura senza bisogno di protagonismo, affidabilità riconosciuta) (Negativo: potenziale sottoutilizzo del proprio potenziale di influenza su grandi gruppi, rischio di rimanere in ombra in contesti iper-competitivi)."
            },
            {
                "value": "Un Poco di Imbarazzo",
                "text": "(Positivo: orientamento alla sostanza e al contenuto piuttosto che alla forma, umiltà intellettuale e preferenza per profili operativi concreti e non autoreferenziali) (Negativo: rischio di auto-limitazione della carriera per evitamento delle occasioni di visibilità, potenziale difficoltà nella comunicazione persuasiva pubblica)."
            },
            {
                "value": "Panico da Palcoscenico",
                "text": "(Positivo: eccellenza potenziale in ruoli tecnici o analitici di alta precisione che richiedono concentrazione solitaria e distacco dalle dinamiche di ribalta) (Negativo: ansia sociale paralizzante e blocco comunicativo in pubblico, incapacità di sostenere ruoli di rappresentanza o leadership visibile)."
            }
        ],
        "softSkill": "FiduciaInSeStessi, Autocritica",
        "characteristics": "Introversione vs. Estroversione, Ansia Sociale, Fiducia in Sé",
        "scores": {
            "energia": 25,
            "flusso": 15,
            "cuore": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "32": {
        "num": 32,
        "scenario": "Quando proponi una nuova idea o un cambiamento, quanto è facile per te ottenere il consenso degli altri?",
        "instructions": [
            "Immagine di semi di tarassaco che volano leggeri nel vento.",
            "Immagine di una mano che accoglie delicatamente un uccellino.",
            "Immagine di una persona che spinge con forza una porta pesante per aprirla.",
            "Immagine di una palla che rimbalza contro un muro di gomma e torna indietro."
        ],
        "captions": [
            "Le mie Idee Volano",
            "Mi Ascoltano con Qualche Riserva",
            "Devo Spingere per Farle Passare",
            "Trovo sempre un Muro di Gomma"
        ],
        "options": [
            {
                "value": "Le mie Idee Volano",
                "text": "(Positivo: carisma persuasivo superiore e naturale ascendente sugli altri, capacità di generare consenso immediato attraverso una comunicazione visionaria e coinvolgente) (Negativo: rischio di eccessiva sicurezza che sfocia nell'arroganza, potenziale sottovalutazione del feedback critico, percezione di uno stile impositivo)."
            },
            {
                "value": "Mi Ascoltano con Qualche Riserva",
                "text": "(Positivo: approccio dialettico e razionale basato sull'argomentazione logica, attitudine alla negoziazione costruttiva e alla ricerca di un consenso ponderato) (Negativo: potenziale lentezza nel processo decisionale collettivo, rischio di inefficacia con interlocutori guidati da spinte emotive o irrazionali)."
            },
            {
                "value": "Devo Spingere per Farle Passare",
                "text": "(Positivo: resilienza e tenacia incrollabile nella difesa delle proprie visioni, capacità di superare resistenze ambientali attraverso la determinazione e la forza di volontà) (Negativo: elevato rischio di conflittualità interpersonale, percezione di rigidità cognitiva o testardaggine, possibile logoramento del clima di team)."
            },
            {
                "value": "Trovo sempre un Muro di Gomma",
                "text": "(Positivo: attitudine all'adattamento flessibile in contesti ostili, capacità di preservare l'integrità delle proprie idee evitando scontri frontali logoranti e improduttivi) (Negativo: percezione di impotenza relazionale e frustrazione, mancanza di assertività persuasiva, rischio di rinuncia sistematica all'influenza sociale)."
            }
        ],
        "softSkill": "Negoziazione, ComunicazioneEfficace",
        "characteristics": "Capacità di Persuasione, Influence, Efficacia Comunicativa",
        "scores": {
            "energia": 20,
            "mente": 15,
            "flusso": 10,
            "guardia": 0,
            "cuore": 0
        }
    },
    "33": {
        "num": 33,
        "scenario": "A che punto della tua vita hai raggiunto la piena indipendenza economica, senza più contare sull'aiuto della tua famiglia?",
        "instructions": [
            "Immagine di un ragazzino che cammina sicuro.",
            "Immagine di un giovane adulto che sorride.",
            "Immagine di una persona adulta, nel pieno delle sue forze.",
            "Immagine di una persona anziana che guarda lontano."
        ],
        "captions": [
            "Adolescente",
            "Giovane",
            "Adulto ",
            "Troppo Tardi"
        ],
        "options": [
            {
                "value": "Adolescente",
                "text": "(Positivo: precocità nell'assunzione di responsabilità e forte orientamento all'autonomia ('early-bloomer'), spirito d'iniziativa eccezionale e resilienza economica) (Negativo: potenziale accelerazione forzata dei processi maturativi con sacrificio di fasi esplorative, rischio di eccessiva focalizzazione sulla dimensione utilitaristica)."
            },
            {
                "value": "Giovane",
                "text": "(Positivo: allineamento ottimale alle tappe evolutive sociali e corretto bilanciamento tra formazione e autonomia, integrazione fluida nel mondo del lavoro) (Negativo: rischio di eccessivo conformismo ai percorsi standardizzati, potenziale mancanza di sperimentazione fuori dagli schemi convenzionali)."
            },
            {
                "value": "Adulto ",
                "text": "(Positivo: approccio ponderato e consolidamento delle competenze prima del salto nell'autonomia totale, crescita strutturata e metodica delle risorse personali) (Negativo: potenziale ritardo nell'acquisizione di piena ownership decisionale, rischio di dipendenza prolungata da sistemi di supporto esterni)."
            },
            {
                "value": "Troppo Tardi",
                "text": "(Positivo: focalizzazione estrema sulla preparazione e sulla solidità delle basi prima dell'indipendenza, maturazione profonda dei processi interni) (Negativo: vulnerabilità prolungata e possibile percezione di inadeguatezza sociale, mancanza di esperienza diretta nella gestione proattiva del rischio economico in giovane età)."
            }
        ],
        "softSkill": "Autodisciplina, Autocritica",
        "characteristics": "Indipendenza, Responsabilità, Livello di Maturità",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "energia": 10,
            "flusso": 0,
            "cuore": 0
        }
    },
    "34": {
        "num": 34,
        "scenario": "Ti viene assegnato un compito estremamente noioso e ripetitivo. Qual è la tua strategia per portarlo a termine?",
        "instructions": [
            "Immagine di una sedia vuota davanti a una scrivania ingombra di scartoffie.",
            "Immagine di una catena di montaggio veloce e ripetitiva",
            "Immagine di una persona che sgranocchia snack e beve bibite mentre lavora.",
            "Immagine di un Monaco che medita pazientemente in un giardino zen."
        ],
        "captions": [
            "Rimando a Domani ",
            "Faccio il Compitino e Via",
            "Mi Distraggo e Cerco di Farlo Passare",
            "Trovo un Senso Anche nella Noia"
        ],
        "options": [
            {
                "value": "Rimando a Domani ",
                "text": "(Positivo: capacità di gestire il carico emotivo immediato evitando l'avversione totale verso il compito, flessibilità nella pianificazione del lavoro in base allo stato d'animo) (Negativo: elevata tendenza alla procrastinazione disfunzionale, scarsa tolleranza alla frustrazione operativa, rischio di accumulo di scadenze critiche)."
            },
            {
                "value": "Faccio il Compitino e Via",
                "text": "(Positivo: pragmatismo ed efficienza esecutiva focalizzata sull'essenziale, capacità di chiudere processi noiosi con il minimo dispendio di energia cognitiva) (Negativo: orientamento alla mediocrità prestazionale in compiti non stimolanti, mancanza di attenzione ai dettagli, percezione di disimpegno qualitativo)."
            },
            {
                "value": "Mi Distraggo e Cerco di Farlo Passare",
                "text": "(Positivo: creatività nella gestione del disagio e attitudine al multitasking compensativo per mantenere alto il morale durante la routine) (Negativo: calo drastico della concentrazione e della precisione, rischio elevato di errori dovuti alla superficialità, inefficienza operativa causata dalla frammentazione dell'attenzione)."
            },
            {
                "value": "Trovo un Senso Anche nella Noia",
                "text": "(Positivo: autodisciplina superiore e forte etica del dovere ('conscientiousness'), capacità di trasformare la routine in un esercizio di precisione e padronanza) (Negativo: rischio di eccessiva rigidità e perfezionismo improduttivo, potenziale stress da iper-responsabilizzazione in attività a basso valore aggiunto)."
            }
        ],
        "softSkill": "Autodisciplina, PianificazioneEOrganizzazione",
        "characteristics": "Gestione della Noia, Autodisciplina, Motivazione Intrinseca, Resilienza alla Routine",
        "scores": {
            "mente": 20,
            "guardia": 20,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "35": {
        "num": 35,
        "scenario": "Ricevi una critica dura che ritieni profondamente ingiusta e non meritata. Qual è la tua reazione interiore?",
        "instructions": [
            "Immagine di un diamante splendente e intatto.",
            "Immagine di un fiume che scorre placido e continua il suo corso.",
            "Immagine di una persona seduta in posa pensierosa con degli ingranaggi che girano nella testa.",
            "Immagine di una scultura di vetro fragile che si frantuma in mille pezzi."
        ],
        "captions": [
            "Non Mi Tocca Proprio",
            "Non me ne curo e Passo Oltre",
            "Ci Penso Su, Rifletto e Analizzo",
            "Mi Sento Ferito e mi Infrango"
        ],
        "options": [
            {
                "value": "Non Mi Tocca Proprio",
                "text": "(Positivo: incrollabile fiducia in sé e resilienza ai giudizi ingiusti, capacità di mantenere un'immagine di sé integra nonostante le pressioni esterne negative) (Negativo: potenziale cecità verso il feedback correttivo, rischio di arroganza percepita, chiusura verso il miglioramento continuo)."
            },
            {
                "value": "Non me ne curo e Passo Oltre",
                "text": "(Positivo: eccellente pragmatismo emotivo e rapidità di elaborazione del feedback, attitudine a superare i conflitti senza rimuginazioni improduttive) (Negativo: rischio di superficialità nell'analisi delle proprie aree di miglioramento, potenziale percezione di indifferenza o scarsa sensibilità relazionale)."
            },
            {
                "value": "Ci Penso Su, Rifletto e Analizzo",
                "text": "(Positivo: alta capacità riflessiva e orientamento alla crescita personale attraverso l'autocritica costruttiva, umiltà e apertura all'apprendimento) (Negativo: vulnerabilità alla rimuginazione eccessiva e perdita di sicurezza di sé per sovraccarico analitico, rischio di farsi condizionare troppo dal giudizio altrui)."
            },
            {
                "value": "Mi Sento Ferito e mi Infrango",
                "text": "(Positivo: estrema sensibilità interpersonale e desiderio profondo di armonia e riconoscimento, attitudine a vivere con intensità le dinamiche relazionali) (Negativo: fragilità emotiva critica e bassa resilienza, paralisi operativa di fronte al giudizio negativo, dipendenza totale dall'approvazione esterna per l'equilibrio psicologico)."
            }
        ],
        "softSkill": "Resilienza, Autocritica",
        "characteristics": "Resilienza Emotiva, Sensibilità alla Critica, Autostima",
        "scores": {
            "guardia": 25,
            "mente": 15,
            "cuore": 10,
            "flusso": 0,
            "energia": 0
        }
    },
    "37": {
        "num": 37,
        "scenario": "Quando interagisci con gli altri, come descriveresti il \"clima\" abituale delle tue relazioni?",
        "instructions": [
            "Immagine di un paesaggio zen con pietre perfettamente bilanciate e acqua calma.",
            "Immagine di un cielo sereno con qualche nuvola bianca sparsa.",
            "Immagine di un termometro che oscilla rapidamente tra caldo e freddo.",
            "Immagine di un vulcano in eruzione con lava incandescente e fumo denso."
        ],
        "captions": [
            "Armonia Totale",
            "Relazioni Buone, Ma Non Sempre",
            "Relazioni a Tensione Alterna",
            "Guerra Totale"
        ],
        "options": [
            {
                "value": "Armonia Totale",
                "text": "(Positivo: eccellente intelligenza sociale orientata all'omeostasi relazionale, capacità di mediazione diplomatica superiore e attitudine alla costruzione di climi collaborativi sereni) (Negativo: rischio di evitamento sistematico dei conflitti necessari, tendenza a sacrificare la verità o l'efficacia per una pace superficiale, mancanza di assertività)."
            },
            {
                "value": "Relazioni Buone, Ma Non Sempre",
                "text": "(Positivo: sano realismo relazionale e accettazione delle fisiologiche fluttuazioni nei rapporti interpersonali, capacità di gestire piccoli dissidi senza compromettere la stabilità complessiva) (Negativo: potenziale superficialità nell'investimento emotivo, rischio di mantenere relazioni tiepide senza perseguire una reale profondità o crescita del legame)."
            },
            {
                "value": "Relazioni a Tensione Alterna",
                "text": "(Positivo: consapevolezza della dinamicità delle relazioni umane e capacità di navigare in contesti emotivamente complessi, resilienza di fronte alle crisi relazionali passeggere) (Negativo: instabilità relazionale cronica e stress interpersonale elevato, rischio di logoramento emotivo dovuto a frequenti oscillazioni, clima di incertezza costante)."
            },
            {
                "value": "Guerra Totale",
                "text": "(Positivo: estrema determinazione nel difendere i propri valori e principi anche a costo di rotture radicali, trasparenza totale nelle posizioni antagoniste senza ipocrisie diplomatiche) (Negativo: incapacità di mediazione e gestione distruttiva del conflitto, isolamento sociale critico, clima relazionale tossico e alta dispersione di energia in scontri improduttivi)."
            }
        ],
        "softSkill": "GestioneDeiConflitti, ComunicazioneEfficace",
        "characteristics": "Evitamento del Conflitto, Stile di Comunicazione, Pazienza",
        "scores": {
            "cuore": 25,
            "flusso": 15,
            "guardia": 10,
            "mente": 0,
            "energia": 0
        }
    },
    "38": {
        "num": 38,
        "scenario": "Pensando al tuo percorso di carriera, qual è il traguardo che desideri davvero raggiungere?",
        "instructions": [
            "Immagine di una comoda poltrona in un angolo accogliente di una stanza.",
            "Immagine di una scala che sale gradualmente, senza essere ripida.",
            "Immagine di un razzo che decolla verso lo spazio, puntando in alto.",
            "Immagine di una corona che poggia su un cuscino di velluto, simbolo di potere raggiunto."
        ],
        "captions": [
            "Sto Bene Così",
            "Crescita Tranquilla",
            "Punto in Alto",
            "Sono al Vertice"
        ],
        "options": [
            {
                "value": "Sto Bene Così",
                "text": "(Positivo: eccellente equilibrio vita-lavoro e gratificazione per i risultati attuali, approccio minimalista e sostenibile orientato al benessere personale e alla stabilità emotiva) (Negativo: mancanza di ambizione evolutiva e rischio di obsolescenza professionale, tendenza a non sfruttare appieno il proprio potenziale in contesti competitivi)."
            },
            {
                "value": "Crescita Tranquilla",
                "text": "(Positivo: ambizione bilanciata e sostenibile nel lungo periodo, orientamento alla crescita graduale che preserva la qualità della vita e l'equilibrio psicofisico, gestione oculata dello stress) (Negativo: progressione di carriera potenzialmente più lenta rispetto ai peer, rischio di perdere opportunità ad alto impatto per eccesso di cautela)."
            },
            {
                "value": "Punto in Alto",
                "text": "(Positivo: forte orientamento al successo e ambizione verticale superiore, determinazione ferrea nel raggiungimento di posizioni di leadership e massima autorealizzazione professionale) (Negativo: elevato rischio di squilibrio tra vita privata e lavoro, potenziale stress da performance cronico, rischio di logoramento delle relazioni per eccessiva competitività)."
            },
            {
                "value": "Sono al Vertice",
                "text": "(Positivo: piena autorealizzazione professionale e consolidamento del successo raggiunto, visione strategica di alto livello e capacità di operare con autorità e padronanza del ruolo) (Negativo: rischio di autocompiacimento e perdita di umiltà intellettuale, potenziale difficoltà a rimettersi in gioco in contesti di cambiamento radicale)."
            }
        ],
        "softSkill": "Autocritica, SviluppoPersonale",
        "characteristics": "Ambizione, Competitività, Motivazione al Successo",
        "scores": {
            "energia": 25,
            "mente": 15,
            "guardia": 10,
            "flusso": 0,
            "cuore": 0
        }
    },
    "40": {
        "num": 40,
        "scenario": "Stai svolgendo un compito critico, ma intorno a te ci sono continui rumori e interruzioni. Come reagisce la tua mente?",
        "instructions": [
            "Immagine di un faro potente che proietta un fascio di luce attraverso una fitta nebbia.",
            "Immagine di una candela la cui fiamma oscilla leggermente a causa di una leggera brezza.",
            "Immagine di una persona che cerca di leggere un libro mentre una farfalla le svolazza insistentemente intorno alla testa.",
            "Immagine di una palla di vetro con neve scossa violentemente, la scena interna è completamente oscurata dal caos."
        ],
        "captions": [
            "Focus Mentale",
            "Concentrato, Ma Non Sempre",
            "Distratto da Tutto",
            "Caos Mentale"
        ],
        "options": [
            {
                "value": "Focus Mentale",
                "text": "(Positivo: eccellente capacità di concentrazione profonda ('deep work') e resistenza ferrea alle interferenze esterne, massima efficienza operativa anche in ambienti caotici) (Negativo: rischio di isolamento autoreferenziale e scarsa consapevolezza del contesto circostante, potenziale percezione di distacco sociale o mancanza di empatia verso il team)."
            },
            {
                "value": "Concentrato, Ma Non Sempre",
                "text": "(Positivo: buona gestione dell'attenzione focalizzata in condizioni ordinarie, equilibrio funzionale tra concentrazione sul compito e apertura agli stimoli ambientali) (Negativo: vulnerabilità a cali di produttività in contesti di stress estremo o disturbo persistente, mancanza di un focus 'd'acciaio' necessario per compiti ultra-critici)."
            },
            {
                "value": "Distratto da Tutto",
                "text": "(Positivo: alta sensibilità agli stimoli esterni e potenziale attitudine al pensiero laterale e alla creatività cross-settoriale, apertura a spunti imprevisti dell'ambiente) (Negativo: scarsa persistenza attentiva e inefficienza esecutiva cronica, difficoltà estrema nel portare a termine compiti complessi, forte dipendenza da condizioni ambientali protette)."
            },
            {
                "value": "Caos Mentale",
                "text": "(Positivo: potenziale ricchezza interiore e ipersensibilità recettiva che può essere canalizzata in attività artistiche o esplorative non strutturate) (Negativo: incapacità critica di focalizzazione e disorganizzazione cognitiva, stress elevato da sovraccarico informativo, inaffidabilità totale in contesti che richiedono precisione e rigore esecutivo)."
            }
        ],
        "softSkill": "GestioneDelTempo, PianificazioneEOrganizzazione",
        "characteristics": "Focus, Soglia di Attenzione, Coscienziosità (potenziale)",
        "scores": {
            "mente": 25,
            "guardia": 15,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "41": {
        "num": 41,
        "scenario": "Quanto credi che le persone possano davvero cambiare e migliorare il proprio carattere nel tempo?",
        "instructions": [
            "Immagine di una crisalide che si apre per far uscire una farfalla colorata.",
            "Immagine di uno scalatore che con fatica sale una montagna ripida.",
            "Immagine di un leopardo che mostra le sue macchie caratteristiche.",
            "Immagine di un muro di mattoni invalicabile e impenetrabile."
        ],
        "captions": [
            "Le Persone Cambiano se Aiutate",
            "Migliorare Sì, Ma con Sforzo",
            "Chi Nasce Tondo Non Muore Quadrato",
            "Cambiare Gli Altri? \"Mission Impossible\""
        ],
        "options": [
            {
                "value": "Le Persone Cambiano se Aiutate",
                "text": "(Positivo: alto potenziale di mentorship e fiducia profonda nell'evoluzione altrui, attitudine al supporto attivo dei processi di crescita personale e professionale) (Negativo: rischio di idealismo ingenuo e dispersione energetica in progetti di sviluppo non realistici, scarsa valutazione della resistenza al cambiamento)."
            },
            {
                "value": "Migliorare Sì, Ma con Sforzo",
                "text": "(Positivo: realismo pragmatico e consapevolezza della complessità dei processi evolutivi, valorizzazione della perseveranza e della disciplina come motori del miglioramento) (Negativo: potenziale eccesso di pessimismo operativo, rischio di sottostimare i piccoli progressi incrementali per focalizzazione sullo sforzo estremo)."
            },
            {
                "value": "Chi Nasce Tondo Non Muore Quadrato",
                "text": "(Positivo: eccellente obiettività e gestione delle aspettative basata su tratti di personalità consolidati, attitudine a ottimizzare le risorse esistenti senza inseguire utopie) (Negativo: chiusura cognitiva verso l'innovazione comportamentale, rischio di negare opportunità di crescita meritate per pregiudizio deterministico)."
            },
            {
                "value": "Cambiare Gli Altri? \"Mission Impossible\"",
                "text": "(Positivo: massimo focus sulle proprie sfere di influenza diretta ed efficienza nell'allocazione delle energie personali, rifiuto di dinamiche manipolatorie) (Negativo: rassegnazione relazionale e mancanza di slancio nel guidare trasformazioni positive nel team, percezione di distacco o disinteresse per lo sviluppo altrui)."
            }
        ],
        "softSkill": "SviluppoDellePersone, Empatia",
        "characteristics": "Pazienza, Empatia, Ottimismo vs. Pessimismo (riguardo agli altri)",
        "scores": {
            "cuore": 20,
            "mente": 15,
            "flusso": 10,
            "guardia": 0,
            "energia": 0
        }
    },
    "44": {
        "num": 44,
        "scenario": "Che tipo di accoglienza senti di ricevere solitamente dagli altri?",
        "instructions": [
            "Immagine di una persona al centro di un cerchio di persone sorridenti che la illuminano con dei faretti.",
            "Immagine di un cielo azzurro e soleggiato con qualche nuvola bianca che non disturba.",
            "Immagine di un cactus spinoso in un vaso, da cui si percepisce una sensazione di fastidio.",
            "Immagine di una persona in mezzo a una tempesta di fulmini e saette, completamente isolata e minacciata."
        ],
        "captions": [
            "Clima Fantastico, mi Adorano",
            "In Genere Bene",
            "Sento una certa Tensione",
            "Spesso Sento un Ambiente Ostile"
        ],
        "options": [
            {
                "value": "Clima Fantastico, mi Adorano",
                "text": "(Positivo: carisma sociale eccezionale e massima integrazione relazionale, capacità di generare climi di forte empatia e supporto reciproco diffuso) (Negativo: rischio di idealizzazione delle relazioni che può oscurare dinamiche critiche reali, potenziale dipendenza dal consenso costante per l'equilibrio psicologico)."
            },
            {
                "value": "In Genere Bene",
                "text": "(Positivo: stabilità relazionale e capacità di mantenere rapporti cordiali e professionalmente sani, sano realismo nelle interazioni quotidiane) (Negativo: potenziale appiattimento sulle convenzioni sociali con rinuncia a una reale profondità e autenticità nelle connessioni umane più significative)."
            },
            {
                "value": "Sento una certa Tensione",
                "text": "(Positivo: attitudine a navigare in ambienti competitivi o complessi senza farsi destabilizzare, capacità di gestire il disaccordo senza drammatizzazioni) (Negativo: tendenza a tollerare o ignorare conflitti latenti che potrebbero cronicizzarsi, potenziale mancanza di assertività per risolvere le frizioni alla radice)."
            },
            {
                "value": "Spesso Sento un Ambiente Ostile",
                "text": "(Positivo: consapevolezza lucida di un clima relazionale disfunzionale, potenziale spinta a un cambiamento radicale dell'ambiente o delle proprie modalità interattive) (Negativo: alienazione sociale critica e percezione di vittimizzazione, stress cronico che compromette drasticamente la performance e il benessere psicofisico)."
            }
        ],
        "softSkill": "GestioneDeiConflitti, Negoziazione",
        "characteristics": "Assertività, Gestione dei Conflitti, Rispetto di Sé",
        "scores": {
            "cuore": 25,
            "guardia": 15,
            "energia": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "48": {
        "num": 48,
        "scenario": "Ti offrono il lavoro della tua vita, ma devi cambiare città e prendere meno soldi. Che fai?",
        "instructions": [
            "Immagine di una fortezza inamovibile e ben difesa.",
            "Immagine di una bussola che indica direzioni diverse in modo incerto.",
            "Immagine di una freccia che punta decisa verso un orizzonte lontano.",
            "Immagine di un mappamondo aperto e illuminato, che mostra diverse città del mondo."
        ],
        "captions": [
            "Resto",
            "Ci Penso",
            "Parto",
            "Nessun confine mi ferma"
        ],
        "options": [
            {
                "value": "Resto",
                "text": "(Positivo: massima valorizzazione della stabilità relazionale e della continuità territoriale, priorità assoluta alla sicurezza affettiva e al radicamento sociale) (Negativo: potenziale rinuncia a una crescita professionale dirompente, rischio di stagnazione in una 'comfort zone' limitante per l'autorealizzazione a lungo termine)."
            },
            {
                "value": "Ci Penso",
                "text": "(Positivo: approccio razionale e ponderato basato sull'analisi costi-benefici, attitudine alla decisione consapevole che tutela sia la carriera che gli affetti) (Negativo: rischio di immobilismo decisionale e procrastinazione, potenziale perdita dell'opportunità per eccesso di cautela o indecisione strategica)."
            },
            {
                "value": "Parto",
                "text": "(Positivo: forte orientamento all'autorealizzazione e coraggio nel perseguire la propria missione professionale, adattabilità superiore e spirito d'iniziativa) (Negativo: rischio di squilibrio vita-lavoro, potenziale sradicamento affettivo forzato e stress da ricollocamento in contesti con minore stabilità finanziaria immediata)."
            },
            {
                "value": "Nessun confine mi ferma",
                "text": "(Positivo: mentalità cosmopolita e apertura globale senza confini, estrema flessibilità e visione 'world-wide' della propria carriera e identità) (Negativo: mancanza di radici e stabilità territoriale, rischio di superficialità nelle relazioni a lungo termine, percezione di un nomadismo professionale potenzialmente alienante)."
            }
        ],
        "softSkill": "Adattabilita, PropensioneAlRischio",
        "characteristics": "Adattabilità, Preferenza Geografica, Priorità di Carriera",
        "scores": {
            "energia": 25,
            "flusso": 20,
            "guardia": 5,
            "mente": 0,
            "cuore": 0
        }
    },
    "49": {
        "num": 49,
        "scenario": "Un nuovo collega di diversa cultura entra nel team. Come lo accogli?",
        "instructions": [
            "Immagine di un muro di mattoni che separa due spazi.",
            "Immagine di una stretta di mano frettolosa e distaccata.",
            "Immagine di una porta aperta che invita ad entrare.",
            "Immagine di un cerchio di persone che si tengono per mano, includendo una nuova persona nel cerchio."
        ],
        "captions": [
            "Deve rispettare le nostre abitudini",
            "Mantengo un rapporto formale",
            "Lo guido nei primi passi tecnici",
            "Lo aiuto a sentirsi uno di noi"
        ],
        "options": [
            {
                "value": "Deve rispettare le nostre abitudini",
                "text": "(Positivo: massima tutela delle procedure e delle routine consolidate del team, orientamento al mantenimento dell'efficienza senza deviazioni esterne) (Negativo: chiusura culturale critica e mancanza di inclusività, approccio etnocentrico che ostacola l'integrazione e demotiva i nuovi talenti internazionali)."
            },
            {
                "value": "Mantengo un rapporto formale",
                "text": "(Positivo: rispetto delle norme di cortesia professionale con un approccio non invasivo che lascia autonomia al nuovo arrivato, neutralità operativa) (Negativo: accoglienza superficiale e freddezza relazionale, rischio di mancata integrazione profonda, incapacità di cogliere il valore aggiunto della diversità culturale)."
            },
            {
                "value": "Lo guido nei primi passi tecnici",
                "text": "(Positivo: proattività nell'onboarding e sensibilità verso le necessità di orientamento del nuovo collega, attitudine collaborativa e inclusiva) (Negativo: rischio di fermarsi a un livello di integrazione puramente tecnico-informativo senza approfondire la comprensione delle specificità culturali individuali)."
            },
            {
                "value": "Lo aiuto a sentirsi uno di noi",
                "text": "(Positivo: eccellente intelligenza culturale (CQ) e impegno attivo nella costruzione di un team autenticamente inclusivo, valorizzazione della diversità come risorsa strategica) (Negativo: potenziale eccesso di attenzione alla dimensione relazionale a scapito dell'operatività immediata, rischio di forzare l'integrazione in modo non spontaneo)."
            }
        ],
        "softSkill": "DiversitaEInclusione, RelazioniInterpersonali",
        "characteristics": "Inclusività, Empatia, Apertura Culturale",
        "scores": {
            "cuore": 25,
            "flusso": 15,
            "mente": 10,
            "guardia": 0,
            "energia": 0
        }
    },
    "50": {
        "num": 50,
        "scenario": "Durante una riunione, un collega fa una battuta chiaramente razzista. Qual è la tua reazione immediata?",
        "instructions": [
            "Immagine di una maschera che ride, nascondendo la vera reazione.",
            "Immagine di una statua di sale che si scioglie lentamente.",
            "Immagine di un interruttore della luce che viene spento bruscamente.",
            "Immagine di un megafono che amplifica una voce decisa e ferma."
        ],
        "captions": [
            "Risata di Circostanza",
            "Silenzio Imbarazzato",
            "Cambio Discorso, Evito Problemi",
            "Non lo sopporto, Lo Dico Chiaro e Tondo"
        ],
        "options": [
            {
                "value": "Risata di Circostanza",
                "text": "(Positivo: preservazione formale dell'armonia superficiale del gruppo ed evitamento dello scontro diretto in contesti pubblici) (Negativo: collusione implicita con comportamenti discriminatori, mancanza totale di coraggio civile e integrità etica, percezione di debolezza di carattere)."
            },
            {
                "value": "Silenzio Imbarazzato",
                "text": "(Positivo: chiara segnalazione non verbale di disagio e disapprovazione etica pur mantenendo un profilo non conflittuale, consapevolezza del problema) (Negativo: passività e omissione di intervento necessario, incapacità di difendere i valori aziendali di inclusione, mancanza di assertività etica)."
            },
            {
                "value": "Cambio Discorso, Evito Problemi",
                "text": "(Positivo: diplomazia comunicativa volta a neutralizzare la tensione e riportare il focus sull'operatività professionale, mediazione cauta) (Negativo: inefficacia nel contrastare il comportamento scorretto alla radice, rischio di legittimare indirettamente l'offesa per mancanza di una condanna esplicita)."
            },
            {
                "value": "Non lo sopporto, Lo Dico Chiaro e Tondo",
                "text": "(Positivo: integrità morale superiore e coraggio civile, difesa attiva dei valori di rispetto e inclusione senza compromessi, leadership etica assertiva) (Negativo: rischio di innescare conflitti frontali polarizzanti, potenziale percezione di rigidità moralizzatrice se non gestita con estrema intelligenza emotiva)."
            }
        ],
        "softSkill": "DiversitaEInclusione, CoraggioCivile",
        "characteristics": "Consapevolezza Diversità, Condotta Etica, Assertività",
        "scores": {
            "cuore": 25,
            "guardia": 20,
            "energia": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "51": {
        "num": 51,
        "scenario": "Scegli un ristorante per la pausa pranzo con tutti i tuoi colleghi",
        "instructions": [
            "Immagine di un ristorante di lusso, elegante e con prezzi elevati, magari con una sola persona seduta.",
            "Immagine di un fast food anonimo e standardizzato,  con poca atmosfera.",
            "Immagine di un ristorantino familiare accogliente e informale,  con tavoli apparecchiati in modo semplice.",
            "Immagine di un ristorante vegano/vegetariano luminoso e accogliente,  con un menu che indica opzioni senza glutine e per diverse intolleranze."
        ],
        "captions": [
            "Ristorante Stellato",
            "Fast Food",
            "Ristorantino Familiare",
            "Vegano/Vegetariano"
        ],
        "options": [
            {
                "value": "Ristorante Stellato",
                "text": "(Positivo: orientamento all'eccellenza e al prestigio, attitudine a elevare gli standard qualitativi delle occasioni conviviali del team) (Negativo: rischio di bias di prestigio ed esclusività socio-economica, scarsa sensibilità verso la diversità di budget e gusti dei collaboratori)."
            },
            {
                "value": "Fast Food",
                "text": "(Positivo: massima efficienza operativa e ottimizzazione dei tempi, approccio pragmatico focalizzato sulla rapidità e sulla linearità dei processi) (Negativo: trascuratezza della dimensione conviviale e del team building informale, percezione di scarsa attenzione alla qualità della vita lavorativa)."
            },
            {
                "value": "Ristorantino Familiare",
                "text": "(Positivo: promozione di un clima conviviale autentico e inclusivo nella sua semplicità, valorizzazione della spontaneità relazionale e del comfort psicologico) (Negativo: potenziale mancanza di innovazione e scarsa attenzione a specifiche necessità alimentari o dietetiche complesse del gruppo)."
            },
            {
                "value": "Vegano/Vegetariano",
                "text": "(Positivo: eccellente sensibilità inclusiva verso scelte etiche e restrizioni alimentari, attitudine proattiva alla creazione di un ambiente accogliente per ogni diversità) (Negativo: rischio di percepita militanza ideologica che potrebbe limitare la libertà di scelta o il gradimento dei membri più tradizionalisti del team)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, Empatia",
        "characteristics": "Lavoro di Squadra, Empatia, Inclusività, Stile Decisionale",
        "scores": {
            "flusso": 20,
            "cuore": 15,
            "mente": 10,
            "energia": 0,
            "guardia": 0
        }
    },
    "52": {
        "num": 52,
        "scenario": "Una collega subisce molestie verbali pesanti da un altro collega. Come reagisci?",
        "instructions": [
            "Immagine di una mano tesa, pronta ad afferrare un'altra mano in difficoltà.",
            "Immagine di una mano che porge una spazzola per \"spazzare via\" lo sporco, minimizzando il problema.",
            "Immagine di due mani che si stringono di nascosto sotto un tavolo,  accordo informale.",
            "Immagine di una mano che alza un cartello di \"stop\" con forza,  segnalazione formale."
        ],
        "captions": [
            "Scelgo di Aiutare",
            "Scelgo di Minimizzare",
            "Scelgo la Gestione Informale",
            "Scelgo la Segnalazione Formale"
        ],
        "options": [
            {
                "value": "Scelgo di Aiutare",
                "text": "(Positivo: spiccata empatia e solidarietà attiva, prontezza nel fornire supporto emotivo immediato e vicinanza umana in situazioni di crisi) (Negativo: rischio di intervento puramente reattivo e non strategico, mancanza di un approccio strutturato volto alla risoluzione sistemica della problematica)."
            },
            {
                "value": "Scelgo di Minimizzare",
                "text": "(Positivo: mantenimento di una neutralità apparente finalizzata alla tutela della propria tranquillità immediata e all'evitamento di complicazioni) (Negativo: grave omissione etica e complicità silenziosa con dinamiche tossiche, totale mancanza di integrità e coraggio civile)."
            },
            {
                "value": "Scelgo la Gestione Informale",
                "text": "(Positivo: attitudine alla mediazione diplomatica volta a risolvere il conflitto con discrezione e rapidità, ricerca di armonia relazionale) (Negativo: rischio di inefficacia protettiva per la vittima, potenziale sottovalutazione della gravità oggettiva delle molestie per eccesso di prudenza)."
            },
            {
                "value": "Scelgo la Segnalazione Formale",
                "text": "(Positivo: massimo rispetto delle procedure di 'compliance' e tolleranza zero verso le condotte improprie, attivazione dei protocolli di tutela professionale) (Negativo: potenziale irrigidimento delle relazioni interne, rischio di essere percepiti come eccessivamente burocratici se non accompagnato da supporto umano)."
            }
        ],
        "softSkill": "TematicheSociali, RelazioniImproprie",
        "characteristics": "Scelta Etica, Affrontare Molestie, Assertività",
        "scores": {
            "cuore": 25,
            "guardia": 20,
            "energia": 10,
            "mente": 0,
            "flusso": 0
        }
    },
    "53": {
        "num": 53,
        "scenario": "Quanto ti senti osservato e \"sotto esame\" dagli altri, di solito?",
        "instructions": [
            "Immagine di mani che piantano un seme con gesto sicuro e determinato, ignorando l'ambiente circostante.",
            "Immagine di mani che lavorano a maglia in modo fluido e regolare,  con un'occhiata occasionale all'esterno.",
            "Immagine di mani che si stringono nervosamente e si nascondono sotto un tavolo.",
            "Immagine di mani completamente bloccate e immobili,  come statue di cera."
        ],
        "captions": [
            "Scelgo di Ignorare gli Sguardi",
            "Scelgo di Essere Consapevole, Ma Non Ossessionato",
            "Scelgo di Nascondermi dal Giudizio",
            "Scelgo la Paralisi Totale"
        ],
        "options": [
            {
                "value": "Scelgo di Ignorare gli Sguardi",
                "text": "(Positivo: totale autonomia dal giudizio esterno e incrollabile fiducia nelle proprie direttrici d'azione, indipendenza cognitiva superiore) (Negativo: potenziale insensibilità ai feedback ambientali e alle dinamiche di contesto, rischio di apparire autoreferenziali o distaccati)."
            },
            {
                "value": "Scelgo di Essere Consapevole, Ma Non Ossessionato",
                "text": "(Positivo: equilibrio ottimale tra autoconsapevolezza sociale e sicurezza interiore, capacità di gestire l'immagine pubblica con naturalezza e professionalità) (Negativo: rischio di sottile conformismo per eccessiva preoccupazione di mantenere un'immagine sempre impeccabile e socialmente accettata)."
            },
            {
                "value": "Scelgo di Nascondermi dal Giudizio",
                "text": "(Positivo: elevata tutela della propria 'privacy' e ricerca di contesti lavorativi protetti, attitudine alla riflessione introspettiva discreta) (Negativo: auto-limitazione del proprio potenziale di visibilità e leadership, insicurezza sociale che può frenare le opportunità di networking)."
            },
            {
                "value": "Scelgo la Paralisi Totale",
                "text": "(Positivo: estrema lucidità nel riconoscere i propri limiti emotivi, punto di partenza per un'analisi profonda delle proprie barriere psicologiche) (Negativo: ansia sociale paralizzante e blocco operativo critico, totale vulnerabilità al giudizio altrui che impedisce ogni iniziativa autonoma)."
            }
        ],
        "softSkill": "FiduciaInSeStessi, Autocritica",
        "characteristics": "Scelta Emotiva, Gestione dell'Ansia Sociale, Fiducia in Sé",
        "scores": {
            "guardia": 20,
            "mente": 15,
            "flusso": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "54": {
        "num": 54,
        "scenario": "Lavoro da sogno o stabilità affettiva?",
        "instructions": [
            "Immagine di una casa accogliente e familiare, interni rassicuranti.",
            "Immagine di una persona pensierosa che guarda un orizzonte lontano, indecisa.",
            "Immagine di un biglietto del treno pronto per essere timbrato, simbolo di partenza.",
            "Immagine di una bussola che indica tutte le direzioni cardinali contemporaneamente, libertà totale."
        ],
        "captions": [
            "Casa è Casa",
            "Ci Penso Su",
            "Nuove Avventure",
            "Il Mondo Mi Aspetta"
        ],
        "options": [
            {
                "value": "Casa è Casa",
                "text": "(Positivo: massima priorità alla stabilità emotiva e al radicamento territoriale come pilastri del benessere individuale, lealtà ai legami affettivi) (Negativo: rinuncia a sfide professionali evolutive, potenziale stagnazione delle ambizioni di carriera per eccessivo attaccamento alla sicurezza)."
            },
            {
                "value": "Ci Penso Su",
                "text": "(Positivo: approccio analitico e ponderato basato sulla ricerca di una sintesi sostenibile tra vita privata e ambizioni professionali, cautela strategica) (Negativo: rischio di immobilismo decisionale e perdita dell'opportunità per eccesso di ponderazione, insicurezza nella definizione delle proprie priorità reali)."
            },
            {
                "value": "Nuove Avventure",
                "text": "(Positivo: forte orientamento alla crescita e determinazione nel cogliere sfide professionali stimolanti, spirito di esplorazione superiore) (Negativo: potenziale sottovalutazione dei costi emotivi e dello stress da sradicamento, rischio di agire impulsivamente trascurando i legami significativi)."
            },
            {
                "value": "Il Mondo Mi Aspetta",
                "text": "(Positivo: visione cosmopolita e indipendenza geografica radicale, massima flessibilità e adattamento a contesti internazionali e multiculturali) (Negativo: mancanza di stabilità relazionale e territoriale a lungo termine, percezione di un distacco affettivo potenzialmente alienante o superficiale)."
            }
        ],
        "softSkill": "Adattabilita, PropensioneAlRischio",
        "characteristics": "Adattabilità, Preferenza Geografica, Priorità di Carriera",
        "scores": {
            "energia": 25,
            "flusso": 20,
            "guardia": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "55": {
        "num": 55,
        "scenario": "Che \"stagione\" ti sembra di vivere?",
        "instructions": [
            "Immagine di un campo di grano dorato e rigoglioso al sole,  simbolo di abbondanza e prosperità.",
            "Immagine di un cielo sereno e limpido,  senza nuvole,  calma e stabilità.",
            "Immagine di un cielo leggermente nuvoloso,  qualche nube passeggera,  incertezza moderata.",
            "Immagine di un cielo tempestoso e scuro,  fulmini e tempesta in arrivo,  difficoltà e crisi."
        ],
        "captions": [
            "Estate",
            "Primavera",
            "Autunno",
            "Inverno"
        ],
        "options": [
            {
                "value": "Estate",
                "text": "(Positivo: massimo ottimismo e fiducia nella fase di espansione e successo corrente, percezione di autorealizzazione e pienezza professionale) (Negativo: rischio di eccessiva autocompiacenza o ingenuità strategica, mancanza di pianificazione per fasi di mercato o carriere meno favorevoli)."
            },
            {
                "value": "Primavera",
                "text": "(Positivo: equilibrio emotivo e stabilità rassicurante, focalizzazione costruttiva sul presente e sulla crescita incrementale controllata) (Negativo: potenziale mancanza di slancio ambizioso e spinta verso traguardi dirompenti, rischio di adagiarsi in una routine troppo conservativa)."
            },
            {
                "value": "Autunno",
                "text": "(Positivo: realismo lucido e capacità di gestire l'incertezza con pragmatismo preparatorio, attitudine alla prevenzione dei rischi futuri) (Negativo: accumulo di ansia anticipatoria e ipervigilanza, visione potenzialmente limitata dalle preoccupazioni per le sfide imminenti)."
            },
            {
                "value": "Inverno",
                "text": "(Positivo: estrema consapevolezza della criticità e opportunità di trasformazione radicale ('rinascita'), resilienza forgiata dalle difficoltà) (Negativo: pessimismo cronico e percezione di vulnerabilità paralizzante, blocco dell'iniziativa per timore di esiti catastrofici o crisi insuperabili)."
            }
        ],
        "softSkill": "FinanzaPersonale, GestioneDelTempo",
        "characteristics": "Stabilità Finanziaria, Prospettive Economiche, Capacità di Gestione Finanziaria",
        "scores": {
            "flusso": 25,
            "energia": 15,
            "cuore": 10,
            "guardia": 0,
            "mente": 0
        }
    },
    "57": {
        "num": 57,
        "scenario": "Pensa alla tua attuale sensazione di prosperità nella vita.",
        "instructions": [
            "Immagine di un giardino lussureggiante e rigoglioso, pieno di fiori e frutti.",
            "Immagine di un campo coltivato e ordinato,  raccolto stabile e sicuro.",
            "Immagine di un campo un po' secco e spoglio,  raccolto incerto,  leggera difficoltà.",
            "Immagine di un deserto desolato e senza vita,  aridità e mancanza totale."
        ],
        "captions": [
            "Giardino Rigoglioso",
            "Campo Ben Coltivato",
            "Campo Un Po' Arido",
            "Deserto Desolato"
        ],
        "options": [
            {
                "value": "Giardino Rigoglioso",
                "text": "(Positivo: percezione di abbondanza e autorealizzazione superiore, attitudine ottimistica che favorisce l'investimento in nuove opportunità e la crescita) (Negativo: rischio di bias di eccessivo ottimismo e sottovalutazione dei rischi sistemici, mancanza di preparazione a potenziali fasi di contrazione)."
            },
            {
                "value": "Campo Ben Coltivato",
                "text": "(Positivo: stabilità economica e metodica gestione delle risorse, orientamento alla sicurezza e alla continuità dei risultati nel lungo periodo) (Negativo: potenziale scarsa ambizione o resistenza a cambiamenti disruptivi che potrebbero elevare ulteriormente il livello di prosperità)."
            },
            {
                "value": "Campo Un Po' Arido",
                "text": "(Positivo: realismo lucido e consapevolezza delle criticità attuali, attitudine alla prudenza e alla gestione oculata delle risorse limitate) (Negativo: accumulo di stress finanziario e ansia per il futuro, rischio di visione limitata dal bisogno immediato che preclude investimenti strategici)."
            },
            {
                "value": "Deserto Desolato",
                "text": "(Positivo: riconoscimento onesto di una fase di crisi profonda, spinta potenziale verso una trasformazione radicale e ricerca di nuovi paradigmi esistenziali) (Negativo: percezione di impotenza appresa e rassegnazione critica, blocco dell'iniziativa per senso di desolazione e mancanza di prospettive)."
            }
        ],
        "softSkill": "FinanzaPersonale, GestioneDelTempo",
        "characteristics": "Stabilità Finanziaria Percepita, Prospettive Personali, Benessere Soggettivo",
        "scores": {
            "flusso": 20,
            "guardia": 20,
            "energia": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "58": {
        "num": 58,
        "scenario": "Pensa al tuo \"meteo interiore\".",
        "instructions": [
            "Immagine di un cielo azzurro terso e senza nuvole,  serenità costante.",
            "Immagine di un cielo con nuvole bianche che vanno e vengono,  leggera variabilità.",
            "Immagine di un cielo con alternanza di sole e pioggia,  variabilità moderata e frequente.",
            "Immagine di una tempesta con fulmini e cielo nero,  estrema variabilità e intensità emotiva."
        ],
        "captions": [
            "Cielo Sempre Sereno",
            "Cielo con Nuvole Passeggere",
            "Cielo a Volte Nuvoloso, A Volte Sereno",
            "Cielo Tempestoso"
        ],
        "options": [
            {
                "value": "Cielo Sempre Sereno",
                "text": "(Positivo: eccellente stabilità emotiva e temperamento costante, alta affidabilità e prevedibilità nelle reazioni sotto pressione) (Negativo: potenziale appiattimento affettivo e ridotta reattività empatica verso dinamiche emotive intense altrui)."
            },
            {
                "value": "Cielo con Nuvole Passeggere",
                "text": "(Positivo: equilibrio emotivo ottimale e plasticità affettiva, capacità di integrare le variazioni dell'umore senza perdere il focus operativo) (Negativo: rischio di eccessiva moderazione che può essere percepita come mancanza di slancio o di passione autentica)."
            },
            {
                "value": "Cielo a Volte Nuvoloso, A Volte Sereno",
                "text": "(Positivo: ricchezza emotiva e spiccata sensibilità interiore, capacità di sperimentare e comprendere una vasta gamma di sfumature affettive) (Negativo: vulnerabilità a sbalzi d'umore che possono inficiare la costanza della performance e la prevedibilità relazionale)."
            },
            {
                "value": "Cielo Tempestoso",
                "text": "(Positivo: passionalità intensa e profonda risonanza emotiva, potenziale spinta creativa alimentata da un mondo interiore vibrante e non convenzionale) (Negativo: instabilità emotiva critica e difficoltà nella regolazione degli impulsi, rischio di imprevedibilità che destabilizza il clima del team)."
            }
        ],
        "softSkill": "GestioneDelloStress, Resilienza",
        "characteristics": "Stabilità Emotiva, Variabilità dell'Umore, Regolazione Emotiva",
        "scores": {
            "guardia": 25,
            "flusso": 15,
            "mente": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "59": {
        "num": 59,
        "scenario": "Quanto spesso ti fai un'opinione sulle persone che incontri?",
        "instructions": [
            "Immagine di un occhio di falco che scruta dall'alto, sguardo penetrante e giudicante.",
            "Immagine di una lente d'ingrandimento che esamina attentamente i dettagli,  analisi frequente.",
            "Immagine di uno sguardo fugace attraverso un vetro appannato,  giudizio occasionale e superficiale.",
            "Immagine di una figura che guarda l'orizzonte aperto,  visione ampia e senza preconcetti,  assenza di giudizio."
        ],
        "captions": [
            "Sguardo Penetrante",
            "Analisi Dettagliata",
            "Sguardo Sfuggente",
            "Visione Ampia"
        ],
        "options": [
            {
                "value": "Sguardo Penetrante",
                "text": "(Positivo: rapidità di valutazione e intuito spiccato nel cogliere i tratti salienti della personalità, velocità decisionale in ambito relazionale) (Negativo: elevata tendenza al pregiudizio e rigidità di giudizio, rischio di chiusura mentale basata su prime impressioni potenzialmente fallaci)."
            },
            {
                "value": "Analisi Dettagliata",
                "text": "(Positivo: capacità analitica rigorosa e attenzione ai dettagli comportamentali, attitudine alla valutazione critica ponderata e accurata) (Negativo: rischio di ipercriticismo e lentezza nelle interazioni sociali per eccesso di scrutinio, potenziale percezione di freddezza valutativa)."
            },
            {
                "value": "Sguardo Sfuggente",
                "text": "(Positivo: moderazione nel giudizio e approccio pragmatico flessibile, attitudine a non etichettare le persone favorendo relazioni meno condizionate) (Negativo: potenziale superficialità nel cogliere segnali di allarme o rischi relazionali, rischio di sottovalutazione di dinamiche interpersonali rilevanti)."
            },
            {
                "value": "Visione Ampia",
                "text": "(Positivo: eccellente tolleranza e apertura mentale incondizionata, capacità di accogliere la diversità senza filtri giudicanti favorendo un clima inclusivo) (Negativo: vulnerabilità a manipolazioni o a condotte negative altrui per eccessiva fiducia o mancanza di filtri critici protettivi)."
            }
        ],
        "softSkill": "Empatia, Equita",
        "characteristics": "Tendenza al Giudizio, Tolleranza, Empatia",
        "scores": {
            "mente": 25,
            "guardia": 15,
            "flusso": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "60": {
        "num": 60,
        "scenario": "Quando hai un'idea, la tieni per te o la condividi volentieri?",
        "instructions": [
            "Immagine di un seme tenuto chiuso nel pugno,  idea custodita gelosamente.",
            "Immagine di un seme mostrato a pochi,  condivisione selezionata.",
            "Immagine di un seme piantato in un piccolo vaso,  condivisione moderata.",
            "Immagine di semi sparsi al vento,  condivisione totale e aperta."
        ],
        "captions": [
            "Segreto Strategico",
            "Solo a Pochi Fidati",
            "Condivisione Mirata",
            "Diffusione Aperta"
        ],
        "options": [
            {
                "value": "Segreto Strategico",
                "text": "(Positivo: massima tutela della riservatezza e della proprietà intellettuale individuale, controllo totale sullo sviluppo e la qualità degli output) (Negativo: isolamento professionale e chiusura autoreferenziale, rinuncia ai benefici del confronto e della contaminazione creativa del team)."
            },
            {
                "value": "Solo a Pochi Fidati",
                "text": "(Positivo: condivisione strategica e selettiva volta a costruire relazioni di fiducia e lealtà con collaboratori scelti, protezione del valore dell'idea) (Negativo: limitazione del potenziale di diffusione e rallentamento dell'innovazione per eccessiva cautela nella circolazione delle informazioni)."
            },
            {
                "value": "Condivisione Mirata",
                "text": "(Positivo: approccio equilibrato tra protezione e apertura, attitudine a scegliere i contesti e i tempi più appropriati per massimizzare l'impatto dell'idea) (Negativo: potenziale perdita di opportunità di networking spontaneo o virale per eccessiva selettività o moderazione nella condivisione)."
            },
            {
                "value": "Diffusione Aperta",
                "text": "(Positivo: massima apertura alla collaborazione e allo scambio di idee indiscriminato, attitudine a favorire l'innovazione aperta e il progresso collettivo) (Negativo: rischio di perdita del controllo sulla paternità dell'idea e potenziale sfruttamento altrui, mancanza di riservatezza strategica su concetti sensibili)."
            }
        ],
        "softSkill": "ComunicazioneEfficace, MenteAperta",
        "characteristics": "Apertura, Stile di Comunicazione, Preferenza per la Collaborazione",
        "scores": {
            "energia": 20,
            "cuore": 20,
            "mente": 10,
            "flusso": 0,
            "guardia": 0
        }
    },
    "61": {
        "num": 61,
        "scenario": "Come ti comporti con ciò che appartiene al tuo passato, ma che oggi non ha più un'utilità pratica?",
        "instructions": [
            "Immagine di un baule antico, chiuso ma elegante, simbolo di ricordi preziosi conservati.",
            "Immagine di una soffitta piena di oggetti impolverati,  un po' disordinata ma con potenziale.",
            "Immagine di una scatola di trasloco semi-aperta,  oggetti pronti per essere portati via,  un mix di passato e futuro.",
            "Immagine di un falò che brucia oggetti vecchi,  tabula rasa,  liberazione dal passato."
        ],
        "captions": [
            "Custode di Ricordi",
            "Soffitta dei Ricordi",
            "Pronto a Lasciare Andare",
            "Butto tutto, Tabula Rasa"
        ],
        "options": [
            {
                "value": "Custode di Ricordi",
                "text": "(Positivo: forte ancoraggio valoriale e valorizzazione della continuità storica, attitudine a preservare l'identità e il patrimonio esperienziale) (Negativo: potenziale difficoltà nel distacco da processi obsoleti, rischio di accumulo di zavorre operative che frenano l'innovazione)."
            },
            {
                "value": "Soffitta dei Ricordi",
                "text": "(Positivo: approccio creativo al riuso e capacità di individuare potenziale in risorse dormienti, visione non convenzionale del valore) (Negativo: tendenza alla dispersione e scarsa efficienza nel decluttering, rischio di disordine organizzativo che rallenta la produttività)."
            },
            {
                "value": "Pronto a Lasciare Andare",
                "text": "(Positivo: eccellente pragmatismo e orientamento all'efficienza funzionale, capacità di semplificare i processi e focalizzarsi sul valore attuale) (Negativo: potenziale scarsa valorizzazione dell'esperienza passata, rischio di eccessivo distacco emotivo che può apparire freddezza)."
            },
            {
                "value": "Butto tutto, Tabula Rasa",
                "text": "(Positivo: massima proiezione verso il futuro e attitudine al rinnovamento radicale, agilità nel liberarsi di vincoli del passato per abbracciare il nuovo) (Negativo: rischio di perdita della memoria storica e di ripetizione di errori passati, potenziale sradicamento identitario per eccesso di rimozione)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, GestioneDelTempo",
        "characteristics": "Gestione del Passato, Attaccamento Emotivo, Orientamento al Futuro",
        "scores": {
            "flusso": 25,
            "mente": 15,
            "guardia": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "62": {
        "num": 62,
        "scenario": "Il tuo umorismo è autoironico o serioso?",
        "instructions": [
            "Immagine di una statua di marmo,  perfettamente liscia e impassibile,  serietà marmorea.",
            "Immagine di un ritratto formale,  persona in posa rigida,  umorismo trattenuto.",
            "Immagine di una marionetta che si muove in modo un po' goffo ma divertente,  autoironia occasionale e leggera.",
            "Immagine di un clown che fa smorfie e ride sguaiatamente,  autoironia frequente e senza limiti."
        ],
        "captions": [
            "Serietà Infrangibile",
            "Umorismo Controllato",
            "Autoironia Leggera",
            "Autoironia Irrefrenabile"
        ],
        "options": [
            {
                "value": "Serietà Infrangibile",
                "text": "(Positivo: massima autorevolezza e rigore professionale, immagine di estrema affidabilità e integrità in contesti istituzionali o critici) (Negativo: rigidità relazionale e incapacità di sdrammatizzare, potenziale creazione di barriere comunicative per eccesso di formalismo)."
            },
            {
                "value": "Umorismo Controllato",
                "text": "(Positivo: eccellente padronanza del registro comunicativo, capacità di bilanciare serietà e leggera ironia in base alla gerarchia e al contesto) (Negativo: rischio di apparire eccessivamente distaccati o calcolatori nella relazione, potenziale mancanza di autenticità spontanea)."
            },
            {
                "value": "Autoironia Leggera",
                "text": "(Positivo: spiccata intelligenza emotiva e umiltà relazionale, capacità di creare empatia e distendere il clima attraverso la gestione dei propri limiti) (Negativo: potenziale rischio di sottile autolesionismo professionale se utilizzata in momenti di crisi che richiedono invece ferma autorevolezza)."
            },
            {
                "value": "Autoironia Irrefrenabile",
                "text": "(Positivo: massima accessibilità e attitudine a promuovere un clima di lavoro psicologicamente sicuro e non gerarchico, trasparenza totale) (Negativo: potenziale perdita di credibilità e autorevolezza in contesti formali, rischio di non essere presi sul serio in fasi decisionali critiche)."
            }
        ],
        "softSkill": "Autocritica, FiduciaInSeStessi",
        "characteristics": "Stile Umoristico, Umiltà, Consapevolezza di Sé",
        "scores": {
            "cuore": 20,
            "flusso": 20,
            "energia": 15,
            "mente": 0,
            "guardia": 0
        }
    },
    "64": {
        "num": 64,
        "scenario": "Quanto è grande il divario con la persona che ti infastidisce di più?",
        "instructions": [
            "Immagine di un filo sottile teso tra due persone,  divario quasi inesistente,  minima distanza.",
            "Immagine di un ruscello che scorre tra due persone,  piccolo divario,  facilmente superabile.",
            "Immagine di un fossato profondo e largo che separa due persone,  grande divario,  difficile daSuperare.",
            "Immagine di un canyon immenso e invalicabile che divide due persone,  divario incolmabile."
        ],
        "captions": [
            "Filo Impercettibile",
            "Piccolo Ruscello",
            "Fossato Profondo",
            "Canyon Invalicabile"
        ],
        "options": [
            {
                "value": "Filo Impercettibile",
                "text": "(Positivo: eccellente capacità di mediazione e tolleranza alle divergenze caratteriali, attitudine a minimizzare le distanze relazionali) (Negativo: potenziale negazione di conflitti profondi, rischio di superficialità nel non affrontare disallineamenti valoriali reali)."
            },
            {
                "value": "Piccolo Ruscello",
                "text": "(Positivo: consapevolezza equilibrata delle divergenze e proattività nel cercare punti di contatto costruttivi, orientamento al dialogo) (Negativo: rischio di sottovalutare la persistenza di attriti che potrebbero erodere la collaborazione se non gestiti con maggiore fermezza)."
            },
            {
                "value": "Fossato Profondo",
                "text": "(Positivo: realismo lucido nel riconoscere barriere relazionali significative, attitudine alla tutela della propria integrità attraverso il distacco) (Negativo: accumulo di tensione interpersonale e stress cronico, percezione di ostilità che inficia il clima di collaborazione del team)."
            },
            {
                "value": "Canyon Invalicabile",
                "text": "(Positivo: massima chiarezza nell'individuare incompatibilità valoriali insuperabili, decisione netta per la preservazione del benessere emotivo) (Negativo: blocco totale della comunicazione e rifiuto della diversità, rischio di creare faziosità distruttive all'interno dell'organizzazione)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, GestioneDeiConflitti",
        "characteristics": "Influenza, Efficacia Interpersonale, Tolleranza alla Frustrazione",
        "scores": {
            "cuore": 20,
            "guardia": 20,
            "mente": 15,
            "flusso": 0,
            "energia": 0
        }
    },
    "66": {
        "num": 66,
        "scenario": "Secondo te, Come percepiscono il tuo sguardo?",
        "instructions": [
            "Immagine di una maschera bianca, completamente neutra e inespressiva,  sguardo assente.",
            "Immagine di un raggio di sole caldo e accogliente,  sguardo amichevole e aperto,  non seduttivo.",
            "Immagine di un gatto che osserva furtivo da dietro una tenda socchiusa,  seduzione sottile e intrigante.",
            "Immagine di un magnete potente che attrae oggetti metallici con forza irresistibile,  sguardo magnetico e seducente."
        ],
        "captions": [
            "Sguardo Neutro",
            "Sguardo Amichevole",
            "Sguardo Intrigante",
            "Sguardo Magnetico"
        ],
        "options": [
            {
                "value": "Sguardo Neutro",
                "text": "(Positivo: trasparenza comunicativa e assenza di manipolazione o doppi fini, approccio diretto focalizzato esclusivamente sul contenuto del messaggio) (Negativo: mancanza di calore umano ed espressività non verbale, rischio di apparire distaccati, freddi o emotivamente disinteressati)."
            },
            {
                "value": "Sguardo Amichevole",
                "text": "(Positivo: eccellente approcciabilità e attitudine a creare un clima di sicurezza psicologica, comunicazione non verbale rassicurante ed empatica) (Negativo: potenziale scarsa forza persuasiva in contesti negoziali critici, rischio di apparire poco incisivi o privi di autorità carismatica)."
            },
            {
                "value": "Sguardo Intrigante",
                "text": "(Positivo: carisma sofisticato e capacità di attrarre l'attenzione attraverso il mistero, uso efficace della comunicazione non verbale per influenzare sottilmente) (Negativo: ambiguità comunicativa che può generare diffidenza, rischio di essere percepiti come manipolatori o poco trasparenti)."
            },
            {
                "value": "Sguardo Magnetico",
                "text": "(Positivo: leadership carismatica di forte impatto e naturale capacità di influenzare grandi gruppi, magnetismo personale eccezionale) (Negativo: rischio di percezione di narcisismo o arroganza, potenziale effetto intimidatorio che inibisce la comunicazione paritaria degli altri)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, ComunicazioneEfficace",
        "characteristics": "Carisma, Influenza, Consapevolezza Sociale, Autopercezione (dell'attrattiva)",
        "scores": {
            "energia": 20,
            "cuore": 20,
            "flusso": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "67": {
        "num": 67,
        "scenario": "Che tipo di pressione eserciti su te stesso per raggiungere i tuoi traguardi?",
        "instructions": [
            "Immagine di una nuvola che fluttua leggera nel cielo,  senza sforzo,  nessuna pressione.",
            "Immagine di una freccia che punta al centro di un bersaglio,  mirare al risultato \"buono\",  senza eccessi.",
            "Immagine di una fiamma che arde intensamente verso l'alto,  ricerca costante dell'eccellenza,  alta tensione.",
            "Immagine di una corda tesa al limite della rottura,  spingersi allo stremo,  perfezionismo estremo."
        ],
        "captions": [
            "Nuvola Leggera",
            "Centrato Perfettamente",
            "Fiamma Divampante",
            "Corda Tesa"
        ],
        "options": [
            {
                "value": "Nuvola Leggera",
                "text": "(Positivo: approccio sereno orientato al benessere psicofisico e alla gestione sostenibile del carico di lavoro, immunità all'ansia da prestazione) (Negativo: carenza di ambizione competitiva e scarso orientamento al superamento dei propri limiti, rischio di ristagno in zone di comfort improduttive)."
            },
            {
                "value": "Centrato Perfettamente",
                "text": "(Positivo: eccellente equilibrio tra ambizione e pragmatismo, attitudine a raggiungere obiettivi di qualità senza sacrificare la sostenibilità e la salute) (Negativo: potenziale eccesso di realismo che può frenare l'ispirazione verso risultati davvero eccezionali o rivoluzionari)."
            },
            {
                "value": "Fiamma Divampante",
                "text": "(Positivo: forte motivazione intrinseca e spinta instancabile verso l'eccellenza e il miglioramento continuo, orientamento all'alto rendimento) (Negativo: elevato rischio di stress occupazionale per eccesso di tensione, potenziale difficoltà nel tollerare errori o standard inferiori alla perfezione)."
            },
            {
                "value": "Corda Tesa",
                "text": "(Positivo: dedizione totale e raggiungimento di standard di eccellenza assoluta, leadership orientata al risultato senza compromessi qualitativi) (Negativo: rischio critico di burnout e crollo psicofisico per eccesso di pressione auto-imposta, mancanza di sostenibilità nel lungo periodo)."
            }
        ],
        "softSkill": "Autocritica, Autodisciplina",
        "characteristics": "Perfezionismo, Autocritica, Spinta al Successo",
        "scores": {
            "guardia": 20,
            "mente": 20,
            "energia": 15,
            "flusso": 0,
            "cuore": 0
        }
    },
    "68": {
        "num": 68,
        "scenario": "Quanto ti mette a tuo agio l'idea di partire senza prenotare?",
        "instructions": [
            "Immagine di una persona completamente rilassata con uno zaino in spalla che indica la strada,  ama l'improvvisazione totale.",
            "Immagine di una persona che consulta una mappa ma sorride,  aperta a imprevisti ma con una base di organizzazione.",
            "Immagine di una persona che controlla appunti e guide con aria un po'preoccupata,  preferisce una certa pianificazione.",
            "Immagine di una persona che urla al telefono disperata,  panico all'idea di non avere un piano preciso."
        ],
        "captions": [
            "Improvvisazione Totale",
            "Imprevisti Benvenuti",
            "Pianificazione Rassicurante",
            "Panico"
        ],
        "options": [
            {
                "value": "Improvvisazione Totale",
                "text": "(Positivo: eccezionale adattabilità situazionale e resilienza psicologica di fronte all'incertezza, naturale propensione all'esplorazione del nuovo) (Negativo: potenziale disorganizzazione cronica e inefficienza operativa, rischio di esporsi a pericoli o perdite per mancanza di analisi dei rischi)."
            },
            {
                "value": "Imprevisti Benvenuti",
                "text": "(Positivo: equilibrio ottimale tra apertura al cambiamento e base organizzativa solida, attitudine flessibile ma consapevole) (Negativo: rischio di indecisione in situazioni di estrema incertezza, potenziale tendenza a procrastinare scelte definitive per mantenere aperte più opzioni)."
            },
            {
                "value": "Pianificazione Rassicurante",
                "text": "(Positivo: metodica organizzazione e gestione oculata delle variabili, attitudine a minimizzare l'errore attraverso la preparazione meticolosa) (Negativo: rigidità cognitiva di fronte a cambiamenti repentini di scenario, elevato stress percepito quando i piani non possono essere rispettati)."
            },
            {
                "value": "Panico",
                "text": "(Positivo: estremo rigore procedurale e massima garanzia di controllo su ogni dettaglio operativo, ricerca della certezza assoluta) (Negativo: vulnerabilità critica all'imprevisto e ansia paralizzante di fronte all'ambiguità, incapacità di agire senza uno schema predefinito e iper-dettagliato)."
            }
        ],
        "softSkill": "Adattabilità, Innovazione",
        "characteristics": "Spontaneità, Bisogno di Controllo, Adattabilità",
        "scores": {
            "flusso": 25,
            "energia": 15,
            "guardia": 5,
            "mente": 0,
            "cuore": 0
        }
    },
    "70": {
        "num": 70,
        "scenario": "Quanto ti senti elastico?",
        "instructions": [
            "Immagine di un muro di pietra massiccio e inamovibile, rigidità assoluta.",
            "Immagine di una verga di ferro, solida ma inflessibile, rigidità controllata.",
            "Immagine di un ramo di bambù che oscilla leggermente al vento, flessibilità equilibrata.",
            "Immagine di un giunco che si piega fino a terra sotto il vento, eccessiva accondiscendenza."
        ],
        "captions": [
            "Pietra",
            "Ferro",
            "Bambù",
            "Giunco"
        ],
        "options": [
            {
                "value": "Pietra",
                "text": "(Positivo: incrollabile fermezza nei principi e assoluta prevedibilità etica, garanzia di stabilità in contesti caotici) (Negativo: rigidità dogmatica e incapacità di adattarsi alle eccezioni necessarie, rischio di diventare un ostacolo al cambiamento e all'innovazione)."
            },
            {
                "value": "Ferro",
                "text": "(Positivo: eccellente rigore procedurale e disciplina operativa, capacità di mantenere standard elevati sotto pressione esterna) (Negativo: potenziale scarsa empatia relazionale e difficoltà nel negoziare soluzioni creative, rischio di apparire eccessivamente autoritari)."
            },
            {
                "value": "Bambù",
                "text": "(Positivo: flessibilità diplomatica e doti di mediazione eccezionali, attitudine a adattarsi senza perdere la propria integrità strutturale) (Negativo: rischio di essere percepiti come troppo accomodanti o privi di una visione ferma in momenti di crisi che richiedono direttività)."
            },
            {
                "value": "Giunco",
                "text": "(Positivo: massima empatia e leadership servente, attitudine all'ascolto profondo e alla cura estrema delle dinamiche umane nel team) (Negativo: vulnerabilità critica alla manipolazione esterna e mancanza di assertività, incapacità di difendere confini e standard necessari)."
            }
        ],
        "softSkill": "Equita, Empatia",
        "characteristics": "Livelli di Tolleranza, Tendenza al Giudizio, Compassione",
        "scores": {
            "flusso": 25,
            "guardia": 15,
            "mente": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "71": {
        "num": 71,
        "scenario": "Quale immagine associ al tuo percorso nella vita?",
        "instructions": [
            "Immagine di un'autostrada dritta e soleggiata,  percorso chiaro e senza ostacoli,  sicurezza di sé.",
            "Immagine di una strada di campagna con qualche curva,  percorso generalmente agevole ma con imprevisti gestibili.",
            "Immagine di un sentiero di montagna con salite e discese,  percorso impegnativo e altalenante.",
            "Immagine di un labirinto intricato e buio,  percorso confuso e pieno di incertezze,  senso di inadeguatezza."
        ],
        "captions": [
            "Autostrada Spianata",
            "Strada di Campagna",
            "Sentiero di Montagna",
            "Labirinto Buio"
        ],
        "options": [
            {
                "value": "Autostrada Spianata",
                "text": "(Positivo: elevata fiducia nelle proprie capacità di navigazione e senso di controllo sulla propria evoluzione professionale, orientamento al risultato lineare) (Negativo: rischio di bias di ottimismo ingenuo e scarsa preparazione agli imprevisti sistemici, potenziale mancanza di profondità nella gestione delle crisi)."
            },
            {
                "value": "Strada di Campagna",
                "text": "(Positivo: approccio pragmatico e realistico alla complessità, eccellente adattabilità tattica di fronte a deviazioni impreviste del percorso) (Negativo: potenziale mancanza di ambizione verso obiettivi di scala globale, rischio di accontentarsi di un progresso incrementale senza picchi di eccellenza)."
            },
            {
                "value": "Sentiero di Montagna",
                "text": "(Positivo: spiccata resilienza e attitudine alla crescita attraverso il superamento di sfide ardue, mentalità orientata allo sforzo e alla conquista) (Negativo: esposizione a stress cronico per percezione di lotta costante, rischio di trascurare il benessere psicofisico per eccesso di focalizzazione sulla meta)."
            },
            {
                "value": "Labirinto Buio",
                "text": "(Positivo: attivazione di processi introspettivi profondi e ricerca di nuovi paradigmi di senso, disponibilità a richiedere supporto esterno specializzato) (Negativo: senso critico di smarrimento e paralisi decisionale per mancanza di orientamento, rischio di auto-percezione di inadeguatezza cronica)."
            }
        ],
        "softSkill": "FiduciaInSeStessi, Autocritica",
        "characteristics": "Autostima, Percezione di Sé, Livelli di Fiducia",
        "scores": {
            "energia": 20,
            "guardia": 20,
            "flusso": 10,
            "mente": 0,
            "cuore": 0
        }
    },
    "75": {
        "num": 75,
        "scenario": "Quale immagine descrive meglio il tuo paesaggio emotivo?",
        "instructions": [
            "Immagine di una barchetta di carta che affonda in un bicchiere d'acqua agitata,  fragilità e sopraffazione anche per piccole difficoltà.",
            "Immagine di una casa con le finestre che sbattono durante un temporale,  turbamento e difficoltà, ma la struttura regge.",
            "Immagine di un faro che svetta nella tempesta,  luce ferma e rassicurante nel caos,  calma interiore nonostante tutto.",
            "Immagine di una lastra di ghiaccio immobile e insensibile sotto una tormenta di neve,  distacco emotivo e nessuna reazione apparente."
        ],
        "captions": [
            "Barchetta",
            "Casa",
            "Faro",
            "Ghiaccio"
        ],
        "options": [
            {
                "value": "Barchetta",
                "text": "(Positivo: estrema sensibilità interpersonale e capacità di cogliere le sfumature emotive più sottili negli altri, alta empatia ricettiva) (Negativo: vulnerabilità critica allo stress e tendenza alla sopraffazione emotiva, scarsa resilienza di fronte a pressioni esterne anche lievi)."
            },
            {
                "value": "Casa",
                "text": "(Positivo: resilienza equilibrata e attitudine a resistere alle turbolenze senza perdere la propria integrità identitaria e professionale) (Negativo: potenziale accumulo di tensione non elaborata, rischio di somatizzazione o di esplosioni emotive differite per mancanza di sfogo)."
            },
            {
                "value": "Faro",
                "text": "(Positivo: eccezionale stabilità emotiva e capacità di essere un punto di riferimento saldo per il team in situazioni di crisi profonda) (Negativo: potenziale percezione di eccessivo distacco o mancanza di vulnerabilità, rischio di apparire algidi e inaccessibili sul piano umano)."
            },
            {
                "value": "Ghiaccio",
                "text": "(Positivo: massimo controllo razionale e imperturbabilità assoluta in contesti ad alta criticità operativa, protezione totale dall'interferenza emotiva) (Negativo: rigidità affettiva e incapacità di connettersi empaticamente con gli altri, rischio di isolamento e di cecità relazionale)."
            }
        ],
        "softSkill": "Resilienza, GestioneDelloStress",
        "characteristics": "Resilienza, Tolleranza allo Stress, Reattività Emotiva",
        "scores": {
            "guardia": 25,
            "mente": 15,
            "cuore": 10,
            "flusso": 0,
            "energia": 0
        }
    },
    "77": {
        "num": 77,
        "scenario": "Stai uscendo di casa dove sono le chiavi?",
        "instructions": [
            "Immagine di un Rack Portachiavi futuristico appeso al muro preciso e affidabile.",
            "Immagine di mazzo di chiavi che esce dalla tasca del guibbino,  orientamento rapido e sicuro.",
            "Immagine di un mazzo di chiavi poggiate su uno scaffale dentro un frigorifero,  posizione incerta.",
            "Immagine di un buco nero che inghiotte le chiavi,  scomparsa totale e misteriosa."
        ],
        "captions": [
            "Chiavi Sempre al Posto",
            "Sai dove sono",
            "Chiavi Ballerine",
            "Chiavi Introvabili"
        ],
        "options": [
            {
                "value": "Chiavi Sempre al Posto",
                "text": "(Positivo: eccellente autodisciplina e organizzazione meticolosa dei flussi quotidiani, minimizzazione sistematica dei tempi morti e degli errori) (Negativo: potenziale rigidità comportamentale e ansia da controllo, rischio di stress elevato quando l'ordine prestabilito viene turbato)."
            },
            {
                "value": "Sai dove sono",
                "text": "(Positivo: buona gestione funzionale delle risorse e controllo pragmatico dell'ambiente circostante senza eccessi ossessivi) (Negativo: rischio di inefficienza occasionale in situazioni di forte pressione, potenziale mancanza di ottimizzazione rigorosa dei processi personali)."
            },
            {
                "value": "Chiavi Ballerine",
                "text": "(Positivo: attitudine flessibile e bassa reattività allo stress da imprevisto, capacità di navigare nell'imperfezione con serenità) (Negativo: tendenza alla disorganizzazione e spreco di energie mentali nel recupero di informazioni o oggetti smarriti, percezione di scarsa affidabilità operativa)."
            },
            {
                "value": "Chiavi Introvabili",
                "text": "(Positivo: spiccata propensione alla creatività e al pensiero divergente, focus prioritario su stimoli intellettuali rispetto all'ordine materiale) (Negativo: criticità nella gestione delle responsabilità pratiche e forte inefficienza cronica, rischio di essere percepiti come inaffidabili in contesti strutturati)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, GestioneDelTempo",
        "characteristics": "Organizzazione, Memoria, Coscienziosità",
        "scores": {
            "mente": 25,
            "guardia": 15,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "78": {
        "num": 78,
        "scenario": "Quanto sono chiari e definiti i tuoi piani for il futuro?",
        "instructions": [
            "Immagine di un reticolo autostradale perfettamente segnalato e illuminato di notte,  piani chiari e dettagliati per ogni ambito.",
            "Immagine di una strada statale ben asfaltata con indicazioni chiare,  piani definiti per la maggior parte degli ambiti.",
            "Immagine di un sentiero di campagna un po' tortuoso e con indicazioni incerte,  piani vaghi e non sempre definiti.",
            "Immagine di un territorio inesplorato senza strade né sentieri,  assenza totale di piani e direzione chiara."
        ],
        "captions": [
            "Autostrade del Futuro",
            "Strade Maestre",
            "Sentieri Incerti",
            "Territorio Inesplorato"
        ],
        "options": [
            {
                "value": "Autostrade del Futuro",
                "text": "(Positivo: visione strategica cristallina e massima chiarezza degli obiettivi a lungo termine, eccellente pianificazione del percorso evolutivo) (Negativo: vulnerabilità ai cigni neri e ai cambiamenti radicali di paradigma, rischio di cecità verso opportunità emergenti fuori piano)."
            },
            {
                "value": "Strade Maestre",
                "text": "(Positivo: solida pianificazione direzionale accoppiata a una sana flessibilità tattica, buon equilibrio tra controllo e adattabilità) (Negativo: potenziale mancanza di dettaglio analitico in aree non prioritarie, rischio di trascurare variabili di secondo ordine)."
            },
            {
                "value": "Sentieri Incerti",
                "text": "(Positivo: apertura totale all'esplorazione e capacità di adattare la rotta in base ai feedback dell'ambiente, approccio evolutivo) (Negativo: rischio di dispersione strategica e mancanza di focus sugli obiettivi chiave, percezione di instabilità nella direzione di carriera)."
            },
            {
                "value": "Territorio Inesplorato",
                "text": "(Positivo: massima libertà creativa e attitudine pionieristica alla scoperta pura, assenza di preconcetti limitanti sul proprio futuro) (Negativo: assenza critica di una bussola strategica e alto rischio di deriva professionale, difficoltà nel costruire una crescita strutturata nel tempo)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, GestioneDelTempo",
        "characteristics": "Pianificazione, Orientamento agli Obiettivi, Proattività",
        "scores": {
            "mente": 25,
            "guardia": 20,
            "energia": 10,
            "flusso": 0,
            "cuore": 0
        }
    },
    "79": {
        "num": 79,
        "scenario": "Se qualcuno ti dice: Tranquillo, di me ti puoi fidare! come lo interpreti?",
        "instructions": [
            "Immagine di un diamante purissimo e trasparente,  verità assoluta e incorruttibile.",
            "Immagine di uno specchio pulito che riflette fedelmente la realtà,  verità come norma,  lievi eccezioni.",
            "Immagine di una maschera bianca che nasconde il volto,  verità selettiva,  omissioni strategiche.",
            "Immagine di lago torbido che oscura la visione,  verità distorta e manipolata."
        ],
        "captions": [
            "Verità Assoluta",
            "Verità Riflessa",
            "Verità Nascosta",
            "Verità Distorta"
        ],
        "options": [
            {
                "value": "Verità Assoluta",
                "text": "(Positivo: integrità morale incrollabile e assoluta trasparenza nelle intenzioni, garanzia di lealtà totale in ogni circostanza) (Negativo: ingenuità relazionale e rischio di esposizione a manipolazioni esterne, mancanza di pragmatismo tattico nelle dinamiche di potere)."
            },
            {
                "value": "Verità Riflessa",
                "text": "(Positivo: elevata affidabilità professionale mediata da una corretta intelligenza sociale e consapevolezza delle convenzioni) (Negativo: potenziale mancanza di trasparenza radicale in situazioni critiche, rischio di adattare la verità per compiacenza o utilità)."
            },
            {
                "value": "Verità Nascosta",
                "text": "(Positivo: eccellente capacità diplomatica e gestione strategica delle informazioni per preservare l'armonia relazionale) (Negativo: erosione sistematica della fiducia a causa di omissioni percepite come manipolatorie, rischio di essere etichettati come poco autentici)."
            },
            {
                "value": "Verità Distorta",
                "text": "(Positivo: eccellente radar analitico per l'identificazione di incongruenze e segnali deboli di inaffidabilità, approccio iper-vigile a tutela degli asset) (Negativo: bias di sospetto sistemico che ostacola la costruzione di partnership basate sulla fiducia, rischio di isolamento per eccessivo cinismo)."
            }
        ],
        "softSkill": "Integrita, EticaProfessionale",
        "characteristics": "Onestà, Integrità, Bussola Morale",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "cuore": 10,
            "flusso": 0,
            "energia": 0
        }
    },
    "81": {
        "num": 81,
        "scenario": "Quando racconti qualcosa, aggiungi un po' di pepe?",
        "instructions": [
            "Immagine di una lente di cristallo trasparente che mostra la realtà senza distorsioni,  verità oggettiva e pura.",
            "Immagine di un vetro leggermente ondulato che distorce appena la realtà,  verità con qualche piccola \"licenza poetica\".",
            "Immagine di un caleidoscopio che crea immagini colorate e distorte dalla realtà,  verità romanzata per rendere più interessante.",
            "Immagine di un prestigiatore che crea illusioni perfette,  realtà completamente fabbricata per l'effetto scenico."
        ],
        "captions": [
            "Cristallo di Verità",
            "Verità con Onde",
            "Caleidoscopio di Verità",
            "Mago Illusionista"
        ],
        "options": [
            {
                "value": "Cristallo di Verità",
                "text": "(Positivo: massima integrità comunicativa e affidabilità totale dei fatti riportati, approccio iper-fattuale che garantisce trasparenza assoluta) (Negativo: potenziale scarsa efficacia narrativa e mancanza di coinvolgimento emotivo, rischio di risultare eccessivamente formali o pedanti nella narrazione)."
            },
            {
                "value": "Verità con Onde",
                "text": "(Positivo: eccellente equilibrio tra accuratezza dei fatti e capacità di rendere il messaggio avvincente attraverso un moderato storytelling) (Negativo: rischio di lievi imprecisioni per finalità sceniche, potenziale percezione di una trasparenza non sempre cristallina in ogni dettaglio)."
            },
            {
                "value": "Caleidoscopio di Verità",
                "text": "(Positivo: spiccata abilità persuasiva e carisma narrativo volto a catturare l'attenzione e rendere memorabile il messaggio) (Negativo: vulnerabilità della credibilità a lungo termine per eccesso di iperbole, rischio di confusione tra realtà oggettiva e interpretazione soggettiva)."
            },
            {
                "value": "Mago Illusionista",
                "text": "(Positivo: eccezionale padronanza della retorica e capacità di creare visioni potenti e manipolare la percezione per scopi persuasivi estremi) (Negativo: compromissione totale dell'integrità etica e alto rischio di essere etichettati come inaffidabili, danno irreparabile alla fiducia relazionale)."
            }
        ],
        "softSkill": "Integrita, EticaProfessionale",
        "characteristics": "Onestà, Capacità Persuasiva, Potenziale Inganno",
        "scores": {
            "energia": 20,
            "flusso": 20,
            "cuore": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "82": {
        "num": 82,
        "scenario": "Qual è la tua \"fame\" di ricchezza?",
        "instructions": [
            "Immagine di un monaco in meditazione con una ciotola vuota,  rinuncia alla ricchezza materiale,  valori spirituali.",
            "Immagine di una casa accogliente con un giardino curato,  vita confortevole e tranquilla,  ricchezza moderata.",
            "Immagine di una freccia che punta verso una montagna dorata,  aspirazione al successo finanziario,  alta ricchezza.",
            "Immagine di un re seduto su un trono d'oro circondato da tesori,  ossessione per la ricchezza e status al top."
        ],
        "captions": [
            "Ciotola Vuota",
            "Casa con Giardino",
            "Montagna Dorata",
            "Trono d'Oro"
        ],
        "options": [
            {
                "value": "Ciotola Vuota",
                "text": "(Positivo: focus radicale sui valori immateriali e sulla realizzazione identitaria svincolata dal possesso, massima autonomia dal bisogno materiale) (Negativo: potenziale mancanza di stimoli alla crescita economica e scarsa aderenza alle necessità pratiche della sostenibilità finanziaria)."
            },
            {
                "value": "Casa con Giardino",
                "text": "(Positivo: ricerca di un equilibrio armonico tra sicurezza materiale e qualità della vita, approccio saggio e realistico alla prosperità) (Negativo: potenziale mancanza di spinta ambiziosa verso traguardi di scala superiore, rischio di ristagno in una zona di comfort economico)."
            },
            {
                "value": "Montagna Dorata",
                "text": "(Positivo: forte orientamento alla performance economica e determinazione nel raggiungimento di standard di ricchezza elevati come leva di impatto) (Negativo: rischio di squilibrio tra vita professionale e privata, potenziale eccesso di focalizzazione sull'accumulo a scapito del benessere)."
            },
            {
                "value": "Trono d'Oro",
                "text": "(Positivo: ambizione finanziaria illimitata e capacità di dominare mercati competitivi attraverso una spinta al successo fuori scala) (Negativo: rischio di ossessione per lo status e potenziale erosione dei valori etici di fronte al profitto, tendenza alla spietatezza competitiva)."
            }
        ],
        "softSkill": "FinanzaPersonale, Autodisciplina",
        "characteristics": "Ambizione, Materialismo, Motivazione Finanziaria",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "energia": 15,
            "flusso": 0,
            "cuore": 0
        }
    },
    "85": {
        "num": 85,
        "scenario": "Nella tua \"giungla\" sociale, quanto spesso incontri \"serpenti\" o \"fiori\"?",
        "instructions": [
            "Immagine di un giardino fiorito e rigoglioso,  solo fiori profumati,  nessuna \"erba cattiva\".",
            "Immagine di un serpente furtivo in un giardino con molti fiori,  raramente incontri.",
            "Immagine di un serpente minaccioso in un giardino con molti fiori,  incontri spiacevoli occasionali.",
            "Immagine di una luminosa giungla intricata piena di serpenti velenosi,  incontri spiacevoli frequenti."
        ],
        "captions": [
            "Solo Fiori Profumati",
            "Pochi Serpenti Rari",
            "Qualche Serpente Ogni Tanto",
            "Giungla di Serpenti"
        ],
        "options": [
            {
                "value": "Solo Fiori Profumati",
                "text": "(Positivo: ottimismo radicale e massima apertura fiduciosa verso il prossimo, attitudine a valorizzare esclusivamente il potenziale positivo) (Negativo: vulnerabilità critica a manipolazioni o tradimenti per mancanza di filtri difensivi, rischio di negazione della realtà competitiva)."
            },
            {
                "value": "Pochi Serpenti Rari",
                "text": "(Positivo: fiducia prevalente nel capitale sociale mediata da una consapevolezza realistica della possibile ambiguità umana) (Negativo: potenziale ritardo nell'identificazione di minacce velate, rischio di minimizzare segnali di tossicità relazionale)."
            },
            {
                "value": "Qualche Serpente Ogni Tanto",
                "text": "(Positivo: eccellente discernimento relazionale e capacità di navigare con cautela in ambienti complessi senza perdere la fiducia di base) (Negativo: tendenza al cinismo difensivo e rischio di preclusione verso nuove opportunità per eccesso di prudenza)."
            },
            {
                "value": "Giungla di Serpenti",
                "text": "(Positivo: iper-vigilanza strategica e protezione sistematica da manipolazioni o frodi in ambienti altamente competitivi o ostili) (Negativo: bias di sfiducia radicale che inibisce la cooperazione e le partnership, rischio di isolamento sociale e distorsione paranoide)."
            }
        ],
        "softSkill": "RelazioniInterpersonali, Empatia",
        "characteristics": "Percezione Sociale, Ottimismo vs. Pessimismo (sociale), Tolleranza",
        "scores": {
            "cuore": 25,
            "guardia": 20,
            "mente": 10,
            "flusso": 0,
            "energia": 0
        }
    },
    "87": {
        "num": 87,
        "scenario": "Quando le cose vanno veramente storte, come vedi la tua luce interiore?",
        "instructions": [
            "Immagine di un sole che splende senza ombre,  luce costante e ininterrotta,  assenza di \"nuvole\" emotive.",
            "Immagine di una lampada che rimane accesa anche se leggermente affievolita,  luce prevalente,  rara \"ombra\" emotiva.",
            "Immagine di una candela che vacilla e quasi si spegne per un attimo,  luce intermittente,  \"ombra\" occasionale.",
            "Immagine di una stanza completamente buia e senza finestre,  assenza totale di luce,  \"ombra\" persistente e profonda."
        ],
        "captions": [
            "Sole Ininterrotto",
            "Luce Affievolita",
            "Candela Vacillante",
            "Buio Totale"
        ],
        "options": [
            {
                "value": "Sole Ininterrotto",
                "text": "(Positivo: resilienza emotiva granitica e capacità di mantenere un ottimismo contagioso anche in condizioni di crisi estrema) (Negativo: rischio di negazione della realtà e scarsa profondità nell'elaborazione dei feedback negativi, potenziale percezione di inautenticità)."
            },
            {
                "value": "Luce Affievolita",
                "text": "(Positivo: equilibrio maturo tra consapevolezza delle difficoltà e mantenimento di una visione propositiva, stabilità emotiva solida) (Negativo: potenziale tendenza a minimizzare le proprie vulnerabilità, rischio di un'elaborazione emotiva parziale dei traumi professionali)."
            },
            {
                "value": "Candela Vacillante",
                "text": "(Positivo: autenticità emotiva e capacità di integrare la propria fragilità come leva di onestà intellettuale e connessione umana) (Negativo: vulnerabilità agli sbalzi d'umore sotto pressione e rischio di imprevedibilità nelle reazioni emotive verso il team)."
            },
            {
                "value": "Buio Totale",
                "text": "(Positivo: capacità di raccoglimento profondo e introspezione radicale durante le crisi per una ricostruzione identitaria totale) (Negativo: bias di pessimismo paralizzante e alto rischio di isolamento depressivo, incapacità temporanea di visione propositiva)."
            }
        ],
        "softSkill": "GestioneDelloStress, Resilienza",
        "characteristics": "Regolazione dell'Umore, Allegria, Reattività Emotiva",
        "scores": {
            "guardia": 25,
            "flusso": 15,
            "mente": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "88": {
        "num": 88,
        "scenario": "Quando intraprendi un percorso \"navighi a vista\" o usi la \"bussola\" per orientarti?",
        "instructions": [
            "Immagine di una barca a vela senza bussola che naviga in mare aperto,  solo intuito e esperienza.",
            "Immagine di una persona che alza lo sguardo al cielo per orientarsi con il sole,  valutazione occasionale e \"a occhio\".",
            "Immagine di una persona che consulta una bussola a tratti,  sistema usato solo \"quando serve\".",
            "Immagine di una persona con una strumentazione di navigazione complessa e precisa,  sistema di autovalutazione costante e strutturato."
        ],
        "captions": [
            "Navigazione a Vista",
            "Sole Come Guida",
            "Bussola",
            "Strumenti Moderni"
        ],
        "options": [
            {
                "value": "Navigazione a Vista",
                "text": "(Positivo: massima agilità intuitiva e capacità di cogliere opportunità emergenti senza vincoli metodologici rigidi) (Negativo: rischio di dispersione strategica e mancanza di metriche oggettive per la valutazione dei progressi, bassa riproducibilità dei successi)."
            },
            {
                "value": "Sole Come Guida",
                "text": "(Positivo: orientamento pragmatico e flessibile basato su segnali macroscopici, approccio snello all'autovalutazione) (Negativo: potenziale mancanza di precisione analitica nei dettagli operativi, rischio di sottovalutare derive prestazionali latenti)."
            },
            {
                "value": "Bussola",
                "text": "(Positivo: utilizzo razionale e mirato degli strumenti di monitoraggio solo in fasi critiche, ottimo bilanciamento tra intuito e metodo) (Negativo: incostanza nella raccolta dati e rischio di mancanza di una visione storica organica dell'evoluzione professionale)."
            },
            {
                "value": "Strumenti Moderni",
                "text": "(Positivo: eccellente rigore metodologico e monitoraggio data-driven costante della performance per il miglioramento continuo) (Negativo: rischio di iper-analisi e dipendenza eccessiva dalle metriche, potenziale soffocamento dell'intuito e della creatività spontanea)."
            }
        ],
        "softSkill": "Autocritica, SviluppoPersonale",
        "characteristics": "Auto-riflessione, Coscienziosità, Focus sulla Performance",
        "scores": {
            "mente": 25,
            "guardia": 20,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "89": {
        "num": 89,
        "scenario": "Quanto \"a ruota libera\" sei quando esprimi quello che pensi?",
        "instructions": [
            "Immagine di una cascata impetuosa che riversa acqua senza controllo,  parla sempre senza filtri.",
            "Immagine di una fontana che zampilla acqua in modo vivace ma contenuto,  generalmente aperto ma con qualche filtro.",
            "Immagine di un ruscello che scorre silenzioso sotto gli alberi,  discrezione moderata,  pensieri trattenuti a volte.",
            "Immagine di un pozzo profondo e chiuso,  massima discrezione,  pensieri profondamente nascosti."
        ],
        "captions": [
            "Cascata di Parole",
            "Fontana Vivace",
            "Ruscello Silenzioso",
            "Pozzo Segreto"
        ],
        "options": [
            {
                "value": "Cascata di Parole",
                "text": "(Positivo: trasparenza radicale e autenticità comunicativa totale, assenza di filtri manipolatori e facilità di espressione) (Negativo: rischio di invadenza relazionale e mancanza di tatto diplomatico, potenziale danno all'armonia del team per impulsività verbale)."
            },
            {
                "value": "Fontana Vivace",
                "text": "(Positivo: eccellente equilibrio tra onestà intellettuale e intelligenza sociale, comunicazione vivace e partecipativa) (Negativo: potenziale eccessiva preoccupazione per il consenso, rischio di filtrare verità necessarie per evitare conflitti minimi)."
            },
            {
                "value": "Ruscello Silenzioso",
                "text": "(Positivo: spiccata riflessività e capacità di calibrare il messaggio con diplomazia e precisione contestuale, grande ascolto attivo) (Negativo: rischio di percezione di chiusura o mancanza di partecipazione attiva, potenziale sottoutilizzo della propria influenza)."
            },
            {
                "value": "Pozzo Segreto",
                "text": "(Positivo: massima riservatezza strategica e affidabilità totale nella gestione di informazioni sensibili o confidenziali) (Negativo: bias di opacità comunicativa che ostacola la fiducia reciproca, rischio di isolamento e scarsa integrazione nel team)."
            }
        ],
        "softSkill": "ComunicazioneEfficace, Autodisciplina",
        "characteristics": "Discrezione, Stile di Comunicazione, Apertura",
        "scores": {
            "energia": 20,
            "flusso": 20,
            "cuore": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "91": {
        "num": 91,
        "scenario": "Quale strumento pensi sia più importante per viaggiare?",
        "instructions": [
            "Immagine di una strumenti di navigazione digitale,  ogni rotta tracciata con precisione millimetrica,  pianificazione ossessiva.",
            "Immagine di una mappa,  ogni rotta tracciata con precisione,  pianificazione prevalente ma con margini di libertà.",
            "Immagine di una rosa dei venti che indica tutte le direzioni contemporaneamente,  equilibrio tra ragione e intuito,  approccio misto.",
            "Immagine di una bussola,  istinto puro,  assenza di pianificazione."
        ],
        "captions": [
            "GPS",
            "Mappa",
            "Bussola",
            "Rosa dei Venti"
        ],
        "options": [
            {
                "value": "GPS",
                "text": "(Positivo: massimo controllo e gestione del rischio attraverso una pianificazione millimetrica del percorso, eccellente riduzione degli imprevisti) (Negativo: eccessiva dipendenza dagli strumenti e vulnerabilità psicologica di fronte al guasto tecnico o all'imprevedibile totale, mancanza di flessibilità)."
            },
            {
                "value": "Mappa",
                "text": "(Positivo: visione strategica globale e capacità di orientarsi autonomamente mantenendo una direzione chiara ma flessibile) (Negativo: rischio di trascurare dettagli operativi immediati per eccessiva focalizzazione sulla visione d'insieme, potenziale ritardo reattivo)."
            },
            {
                "value": "Bussola",
                "text": "(Positivo: straordinaria capacità di navigazione intuitiva e resilienza decisionale in contesti di totale incertezza o assenza di dati) (Negativo: mancanza di una pianificazione strutturata a lungo termine, rischio di inefficienza nei percorsi e spreco di risorse per tentativi ed errori)."
            },
            {
                "value": "Rosa dei Venti",
                "text": "(Positivo: massima apertura alle opportunità e capacità di reagire istantaneamente a stimoli ambientali multiformi, agilità di pensiero) (Negativo: rischio di dispersione e mancanza di un focus direzionale coerente, percezione di instabilità strategica e volubilità nelle scelte)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, Autodisciplina",
        "characteristics": "Preferenza per la Pianificazione, Livelli di Impulsività, Stile Decisionale",
        "scores": {
            "mente": 25,
            "guardia": 20,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "92": {
        "num": 92,
        "scenario": "Quando ti trovi in un posto affollato come procedi?",
        "instructions": [
            "Immagine di un pesce che nuota in un banco di pesci,  movimenti sincronizzati con la massa,  integrazione totale nel gruppo.",
            "Immagine di un pesce che nuota in un banco ma leggermente defilato,  segue la corrente ma con una certa autonomia,  integrazione prevalente.",
            "Immagine di un pesce che nuota in direzione opposta rispetto al banco,  scelta di un percorso diverso ma senza scontro,  bivio consapevole.",
            "Immagine di pesci che si agitano in tutte le direzioni creando un vortice,  movimenti caotici e contrastanti,  caos e conflitto di direzioni."
        ],
        "captions": [
            "Seguo la  Fila",
            "Mantengo le Distanza",
            "Mi allontano se Posso",
            "Vado dove Voglio"
        ],
        "options": [
            {
                "value": "Seguo la  Fila",
                "text": "(Positivo: massima sintonia con le dinamiche collettive e capacità di integrazione fluida in contesti sociali complessi, spirito collaborativo) (Negativo: rischio di conformismo passivo e rinuncia alla propria leadership individuale per timore di perturbare l'armonia del gruppo)."
            },
            {
                "value": "Mantengo le Distanza",
                "text": "(Positivo: eccellente equilibrio tra integrazione sociale e mantenimento della propria identità e autonomia di movimento, discrezione strategica) (Negativo: potenziale percezione di distacco emotivo o freddezza relazionale, rischio di mancata partecipazione alle sinergie di gruppo)."
            },
            {
                "value": "Mi allontano se Posso",
                "text": "(Positivo: spiccata capacità di discernimento e indipendenza decisionale volta a ottimizzare il proprio percorso senza generare conflitti) (Negativo: tendenza all'individualismo e potenziale difficoltà nel sottomettersi a regole o flussi collettivi necessari in contesti organizzati)."
            },
            {
                "value": "Vado dove Voglio",
                "text": "(Positivo: straordinaria assertività e determinazione nel perseguire i propri obiettivi anche controcorrente, attitudine pionieristica e forte leadership) (Negativo: elevato rischio di generare attriti relazionali e conflitti per mancanza di considerazione dei flussi comuni, percezione di arroganza)."
            }
        ],
        "softSkill": "GestioneDeiConflitti, Negoziazione",
        "characteristics": "Assertività, Accondiscendenza, Stile di Conflitto, Stile di Perseguimento degli Obiettivi",
        "scores": {
            "guardia": 20,
            "mente": 20,
            "energia": 15,
            "flusso": 0,
            "cuore": 0
        }
    },
    "93": {
        "num": 93,
        "scenario": "Come è il terreno su cui fai crescere il tuo futuro?",
        "instructions": [
            "Immagine di un campo arato,  lavora per il futuro.",
            "Immagine di un campo con poche piantine appena spuntate,  qualcosa per il futuro ma non molto.",
            "Immagine di un campo coltivato con un buon raccolto maturo,  raccolto sufficiente.",
            "Immagine di un campo di grano che trabocca,  abbondanza per il futuro."
        ],
        "captions": [
            "Campo Arato",
            "Poche Piantine",
            "Raccolto Sufficiente",
            "Granaio Pieno"
        ],
        "options": [
            {
                "value": "Campo Arato",
                "text": "(Positivo: massima focalizzazione sul godimento del presente e capacità di vivere intensamente l'attualità senza zavorre di ansia futura) (Negativo: vulnerabilità finanziaria critica di fronte a imprevisti e mancanza di una strategia di accumulo patrimoniale, scarsa previdenza)."
            },
            {
                "value": "Poche Piantine",
                "text": "(Positivo: primo passo consapevole verso la costruzione di una base finanziaria pur mantenendo uno stile di vita flessibile e dinamico) (Negativo: risparmio inferiore alla media e potenziale insufficienza di capitale per progetti ambiziosi, esposizione a rischi economici medi)."
            },
            {
                "value": "Raccolto Sufficiente",
                "text": "(Positivo: gestione finanziaria responsabile ed equilibrata che garantisce una sicurezza standard senza sacrifici eccessivi del benessere attuale) (Negativo: potenziale mancanza di visione per una crescita patrimoniale esponenziale, tendenza al conformismo nelle scelte di investimento)."
            },
            {
                "value": "Granaio Pieno",
                "text": "(Positivo: eccellente disciplina finanziaria orientata alla sicurezza a lungo termine e alla creazione di solidi asset patrimoniali) (Negativo: rischio di eccessivo sacrificio della qualità della vita attuale per un futuro ipotetico, potenziale percezione di eccessiva frugalità)."
            }
        ],
        "softSkill": "FinanzaPersonale, PianificazioneEOrganizzazione",
        "characteristics": "Prudenza Finanziaria, Pianificazione del Futuro, Orientamento alla Sicurezza",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "energia": 10,
            "flusso": 0,
            "cuore": 0
        }
    },
    "95": {
        "num": 95,
        "scenario": "Quanto spesso \"accendi la miccia\" per nuove iniziative?",
        "instructions": [
            "Immagine di un cielo notturno completamente nero e senza stelle,  assenza totale di \"scintilla\" iniziale.",
            "Immagine di un singolo fiammifero appena acceso che produce una fiammella debole,  iniziativa rara e incerta.",
            "Immagine di un piccolo fuoco di legna che arde in modo controllato,  iniziativa occasionale e misurata.",
            "Immagine di un fuoco d'artificio che esplode in mille scintille luminose,  iniziativa costante ed esplosiva."
        ],
        "captions": [
            "Nessuna Scintilla",
            "Scintilla Flebile",
            "Brace Moderata",
            "Fuochi d'Artificio Continui"
        ],
        "options": [
            {
                "value": "Nessuna Scintilla",
                "text": "(Positivo: massima focalizzazione sull'ottimizzazione dell'esistente e sulla continuità operativa senza distrazioni evolutive premature) (Negativo: stagnazione innovativa e rischio di obsolescenza per mancanza di proattività nel cogliere i segnali di cambiamento del mercato)."
            },
            {
                "value": "Scintilla Flebile",
                "text": "(Positivo: approccio prudente e graduale all'innovazione, volto a consolidare ogni passo prima di procedere, minimizzazione dei rischi di errore) (Negativo: lentezza reattiva e potenziale perdita di vantaggi competitivi dirompenti, mancanza di coraggio imprenditoriale)."
            },
            {
                "value": "Brace Moderata",
                "text": "(Positivo: eccellente bilanciamento tra mantenimento della routine operativa e proposizione costante di miglioramenti incrementali e sostenibili) (Negativo: rischio di non cogliere opportunità di trasformazione radicale per eccessiva cautela e orientamento alla moderazione)."
            },
            {
                "value": "Fuochi d'Artificio Continui",
                "text": "(Positivo: straordinaria spinta innovativa e capacità visionaria di generare costantemente nuovi paradigmi e progetti ad alto impatto) (Negativo: rischio elevato di dispersione energetica e mancanza di messa a terra operativa, percezione di instabilità e caos direzionale)."
            }
        ],
        "softSkill": "Innovazione, MenteAperta",
        "characteristics": "Proattività, Iniziativa, Spinta Innovativa",
        "scores": {
            "energia": 25,
            "flusso": 15,
            "mente": 10,
            "cuore": 0,
            "guardia": 0
        }
    },
    "97": {
        "num": 97,
        "scenario": "Pensa a come preferisci essere pagato?",
        "instructions": [
            "Immagine di una cassaforte blindata chiusa con un lucchetto,  sicurezza e garanzia di guadagno fisso.",
            "Immagine (inquadratura aerea) di due fiumi che si uniscono in un corso unico,  preferenza per il fisso ma apertura al variabile.",
            "Immagine di una bilancia in equilibrio perfetto,  apertura sia al fisso che al variabile,  equilibrio tra sicurezza e rischio.",
            "Immagine di una slot machine che eroga una cascata di monete d'oro,  entusiasmo per il potenziale di guadagno illimitato delle provvigioni."
        ],
        "captions": [
            "Cassaforte",
            "Fiume con Affluente",
            "Bilancia Equilibrata",
            "Slot Machine"
        ],
        "options": [
            {
                "value": "Cassaforte",
                "text": "(Positivo: massima ricerca di stabilità finanziaria e orientamento alla pianificazione patrimoniale sicura a lungo termine) (Negativo: bassa propensione al rischio e potenziale rinuncia a guadagni incrementali legati alla performance, scarsa ambizione economica competitiva)."
            },
            {
                "value": "Fiume con Affluente",
                "text": "(Positivo: approccio pragmatico che garantisce una base di sicurezza solida pur mantenendo una moderata apertura agli incentivi per obiettivi) (Negativo: rischio di limitata spinta motivazionale intrinseca legata ai risultati estremi, preferenza per la comfort zone retributiva)."
            },
            {
                "value": "Bilancia Equilibrata",
                "text": "(Positivo: eccellente flessibilità retributiva e capacità di gestire l'incertezza economica bilanciandola con l'ambizione orientata ai risultati) (Negativo: potenziale dispersione di focus tra il bisogno di sicurezza e la ricerca del premio, mancanza di una scelta direzionale netta)."
            },
            {
                "value": "Slot Machine",
                "text": "(Positivo: massima orientamento al risultato e fame di successo economico illimitato, straordinaria motivazione guidata dalla performance pura) (Negativo: elevata instabilità finanziaria e rischio di stress da performance insostenibile nel lungo periodo, vulnerabilità ai cali di mercato)."
            }
        ],
        "softSkill": "FinanzaPersonale, Autodisciplina",
        "characteristics": "Propensione al Rischio, Motivazione Finanziaria, Bisogno di Sicurezza Lavorativa",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "flusso": 10,
            "energia": 0,
            "cuore": 0
        }
    },
    "98": {
        "num": 98,
        "scenario": "Hai finito un prodotto di uso quotidiano in casa. Qual è la tua reazione?",
        "instructions": [
            "Immagine di un paesaggio zen con un cerchio di sabbia perfettamente rastrellato e vuoto al centro,  serenità di fronte all' \"assenza\".",
            "Immagine di un rubinetto che gocciola lentamente,  leggero fastidio,  piccola perdita ma gestibile.",
            "Immagine di una segnaletica di allarme,  forte fastidio,  segnale di allarme e urgenza.",
            "Immagine di una sirena di allarme che suona a volume massimo in una stanza buia,  panico totale di fronte alla mancanza."
        ],
        "captions": [
            "Nessun Problema",
            "Leggero Fastidio",
            "Vero Fastidio",
            "Panico Totale"
        ],
        "options": [
            {
                "value": "Nessun Problema",
                "text": "(Positivo: eccellente adattabilità minimalista e capacità di distacco dalle necessità materiali non urgenti, approccio zen alla quotidianità) (Negativo: potenziale mancanza di organizzazione preventiva e rischio di trascuratezza nelle necessità pratiche essenziali)."
            },
            {
                "value": "Leggero Fastidio",
                "text": "(Positivo: gestione equilibrata e realistica degli inconvenienti domestici, capacità di risolvere le mancanze senza generare stress disfunzionale) (Negativo: rischio di inefficienze ricorrenti per mancata ottimizzazione dei processi di approvvigionamento e pianificazione)."
            },
            {
                "value": "Vero Fastidio",
                "text": "(Positivo: spiccato senso dell'organizzazione e orientamento alla prevenzione metodica degli imprevisti per garantire la continuità operativa) (Negativo: tendenza alla rigidità e rischio di reazioni emotive eccessive di fronte a mancanze banali, bisogno di controllo iper-vigile)."
            },
            {
                "value": "Panico Totale",
                "text": "(Positivo: monitoraggio ossessivo e impeccabile di ogni risorsa, garanzia di una logistica domestica priva di interruzioni attraverso la massima previdenza) (Negativo: bias di ansia da controllo e vulnerabilità estrema allo stress per micro-variazioni dell'ordine prestabilito)."
            }
        ],
        "softSkill": "PianificazioneEOrganizzazione, GestioneDelTempo",
        "characteristics": "Organizzazione, Bisogno di Ordine, Sensibilità allo Stress",
        "scores": {
            "mente": 20,
            "guardia": 20,
            "flusso": 10,
            "cuore": 0,
            "energia": 0
        }
    },
    "99": {
        "num": 99,
        "scenario": "Qualcosa di prezioso per te vuole allontanarsi. Cosa fai?",
        "instructions": [
            "Immagine di una mano completamente aperta e vuota,  uccellino vola via libero,  nessun tentativo di trattenere.",
            "Immagine di una mano che si protende,  per trattenere qualcuno,  tentativo minimo e incerto.",
            "Immagine di una mano che tira una fune solida,  tentativo moderato e direzionato.",
            "Immagine di qualcuno che costruisce un ponte elaborato e personalizzato per collegare due sponde."
        ],
        "captions": [
            "Lascio Volare Via",
            "Tendo la Mano",
            "Cerco di portare Indietro",
            "Ponte Su Misura"
        ],
        "options": [
            {
                "value": "Lascio Volare Via",
                "text": "(Positivo: massima efficienza operativa nel distacco e capacità di accettazione dei flussi evolutivi senza spreco di risorse in retention improduttiva) (Negativo: mancanza totale di orientamento alla fidelizzazione e rischio di perdere asset strategici per eccesso di indifferenza relazionale)."
            },
            {
                "value": "Tendo la Mano",
                "text": "(Positivo: approccio di recupero cauto e standardizzato che bilancia lo sforzo di retention con la sostenibilità dei costi operativi) (Negativo: scarsa incisività nel comunicare valore aggiunto, rischio di perdere relazioni chiave per mancanza di un impegno proattivo e differenziato)."
            },
            {
                "value": "Cerco di Portare Indietro",
                "text": "(Positivo: determinazione pragmatica nella difesa delle relazioni di valore e capacità di negoziare incentivi ragionevoli per la stabilità del legame) (Negativo: rischio di percezione di una retention meccanica e non personalizzata, potenziale inefficacia di fronte a bisogni emotivi complessi)."
            },
            {
                "value": "Ponte Su Misura",
                "text": "(Positivo: eccellente customer centricity e capacità di costruire soluzioni iper-personalizzate per garantire la massima fidelizzazione degli asset critici) (Negativo: elevato investimento di tempo e risorse, rischio di non scalabilità e potenziale creazione di dipendenze relazionali eccessive)."
            }
        ],
        "softSkill": "FidelizzazioneDelCliente, Negoziazione",
        "characteristics": "Fidelizzazione del Cliente, Comunicazione del Valore, Negoziazione",
        "scores": {
            "cuore": 25,
            "guardia": 15,
            "flusso": 15,
            "mente": 0,
            "energia": 0
        }
    },
    "101": {
        "num": 101,
        "scenario": "Devi lasciare un \"messaggio\" su WhatsApp a qualcuno. Che \"tono\" usi di solito?",
        "instructions": [
            "Immagine di un testo scritto in caratteri piccoli e formali,  tono distaccato e impersonale.",
            "Immagine di emoticon sorridenti e linguaggio semplice e diretto,  tono cordiale ma neutro.",
            "Immagine di emoticon espressive e linguaggio colloquiale e coinvolgente,  tono amichevole e \"vicino\".",
            "Immagine emoji \"esplosive\" e linguaggio iper-entusiasta,  tono enfatico e \"sopra le righe\"."
        ],
        "captions": [
            "Messaggio Formale",
            "Messaggio Cordiale",
            "Messaggio Amichevole",
            "Messaggio Entusiasta"
        ],
        "options": [
            {
                "value": "Messaggio Formale",
                "text": "(Positivo: eccellente rigore professionale e rispetto assoluto dei confini gerarchici, garanzia di serietà e precisione documentale) (Negativo: rischio di freddezza relazionale e barriera comunicativa, potenziale inefficacia nel creare ingaggio emotivo o connessione autentica)."
            },
            {
                "value": "Messaggio Cordiale",
                "text": "(Positivo: approccio pragmatico e funzionale che garantisce una trasmissione chiara e neutra delle informazioni senza ambiguità) (Negativo: tendenza a una comunicazione standardizzata e impersonale, limitata capacità di differenziazione e personalizzazione del messaggio)."
            },
            {
                "value": "Messaggio Amichevole",
                "text": "(Positivo: straordinaria capacità di creare un clima disteso e di facilitare la cooperazione attraverso la vicinanza empatica) (Negativo: potenziale vulnerabilità del prestigio professionale in contesti formali, rischio di eccessiva confidenzialità non sempre gradita)."
            },
            {
                "value": "Messaggio Entusiasta",
                "text": "(Positivo: potente forza trascinante e capacità di motivare l'interlocutore attraverso un'energia contagiosa e vitale) (Negativo: rischio di percezione di scarsa autenticità o enfasi manipolatoria, potenziale inefficacia in contesti che richiedono massima sobrietà e analisi razionale)."
            }
        ],
        "softSkill": "Presentazione, ComunicazioneEfficace",
        "characteristics": "Stile di Presentazione, Stile di Comunicazione, Capacità Persuasiva",
        "scores": {
            "cuore": 20,
            "flusso": 15,
            "energia": 10,
            "mente": 0,
            "guardia": 0
        }
    },
    "103": {
        "num": 103,
        "scenario": "Devi presentare un prodotto con un \"lato oscuro\" nascosto. Come lo presenti?",
        "instructions": [
            "Immagine di un prestigiatore che nasconde un coniglio nel cappello con un sorriso furbo,  nascondere completamente il lato oscuro.",
            "Immagine di un spettacolo di ombre cinesi,  non nascondere del tutto ma \"velare\" il lato oscuro.",
            "Immagine di una bilancia che pesa pregi e difetti di un oggetto,  presentare entrambi i lati in modo equilibrato.",
            "Immagine di un riflettore potente che illumina un'ombra scura proiettata sul muro,  massima trasparenza anche sugli aspetti negativi."
        ],
        "captions": [
            "Trucco di Magia",
            "Velo Leggero",
            "Risvolto della Medaglia",
            "Ombra in Piena Luce"
        ],
        "options": [
            {
                "value": "Trucco di Magia",
                "text": "(Positivo: estrema efficacia persuasiva immediata e massimizzazione del tasso di chiusura nel breve termine, focus sul risultato) (Negativo: grave carenza etica e rischio di danni reputazionali irreparabili, approccio manipolatorio che distrugge la fiducia futura)."
            },
            {
                "value": "Velo Leggero",
                "text": "(Positivo: abilità diplomatica nel gestire la complessità e minimizzare l'attrito commerciale senza negare l'esistenza di limiti) (Negativo: percezione di opacità o reticenza informativa, rischio di essere scoperti in una verità parziale minando la credibilità professionale)."
            },
            {
                "value": "Risvolto della Medaglia",
                "text": "(Positivo: eccellente trasparenza e costruzione di un rapporto basato sulla fiducia solida e reciproca onestà intellettuale) (Negativo: potenziale indebolimento dell'appeal commerciale immediato, rischio di scoraggiare clienti orientati esclusivamente ai benefici facili)."
            },
            {
                "value": "Ombra in Piena Luce",
                "text": "(Positivo: massima integrità deontologica e coraggio nella trasparenza radicale, garanzia di un'affidabilità etica inattaccabile) (Negativo: rischio di autosabotaggio operativo per eccesso di realismo, percezione di mancanza di pragmatismo commerciale o scarsa spinta alla vendita)."
            }
        ],
        "softSkill": "Presentazione, EticaProfessionale",
        "characteristics": "Etica della Presentazione, Stile di Comunicazione, Onestà vs. Persuasività",
        "scores": {
            "cuore": 25,
            "guardia": 20,
            "mente": 15,
            "flusso": 0,
            "energia": 0
        }
    },
    "104": {
        "num": 104,
        "scenario": "La nave sta affondando.  Come distribuisci le scialuppe di salvataggio?",
        "instructions": [
            "Immagine di donne e bambini che vengono aiutati a salire per primi sulle scialuppe,  priorità assoluta ai più vulnerabili.",
            "Immagine di persone che estraggono a sorte dei biglietti per salire sulle scialuppe,  distribuzione casuale ed equa per tutti.",
            "Immagine di persone che corrono e spingono per salire per primi sulle scialuppe,  \"si salvi chi può\",  legge del più forte.",
            "Immagine di membri dell'equipaggio esperti e persone in forma fisica che vengono incaricati di gestire le scialuppe,  priorità a chi può \"fare la differenza\" per la sopravvivenza di più persone."
        ],
        "captions": [
            "Prima i Fragili",
            "Sorteggio per Tutti",
            "Si Salvi Chi Può",
            "Ai Più Utili"
        ],
        "options": [
            {
                "value": "Prima i Fragili",
                "text": "(Positivo: suprema nobiltà d'animo e orientamento alla solidarietà incondizionata, difesa dei valori umani fondamentali) (Negativo: rischio di non massimizzare l'efficacia operativa del salvataggio collettivo, approccio guidato dall'emozione più che dalla logica sistemica)."
            },
            {
                "value": "Sorteggio per Tutti",
                "text": "(Positivo: massima equità procedurale e rifiuto di ogni discriminazione arbitraria, garanzia di imparzialità democratica) (Negativo: potenziale inefficienza decisionale in situazioni di emergenza estrema, rifiuto di assumersi la responsabilità di una scelta meritocratica o funzionale)."
            },
            {
                "value": "Si Salvi Chi Può",
                "text": "(Positivo: massimizzazione della velocità di reazione individuale e pura efficienza istintiva nel garantire la propria sopravvivenza) (Negativo: totale collasso dell'etica sociale e della responsabilità collettiva, distruzione del legame umano e civico per puro egoismo)."
            },
            {
                "value": "Ai Più Utili",
                "text": "(Positivo: utilitarismo pragmatico finalizzato alla massimizzazione del tasso di sopravvivenza del gruppo attraverso la valorizzazione delle competenze) (Negativo: rischio di essere percepito come freddo e calcolatore, potenziale violazione del principio di uguaglianza umana universale)."
            }
        ],
        "softSkill": "Equita , ResponsabilitaSociale",
        "characteristics": "Equità, Responsabilità Sociale, Prioritizzazione Etica",
        "scores": {
            "cuore": 25,
            "guardia": 20,
            "mente": 10,
            "flusso": 0,
            "energia": 0
        }
    },
    "105": {
        "num": 105,
        "scenario": "Stai scalando una montagna difficoltosa dove tanti falliscono. Cosa vedi?",
        "instructions": [
            "Immagine di uno scalatore solitario che procede spedito senza curarsi del sentiero,  solo la vetta conta,  nessuna attenzione all'impatto.",
            "Immagine di uno scalatore che procede con attenzione sul sentiero,  concentrato sulla salita ma attento a non danneggiare l'ambiente,  equilibrio tra vetta e sentiero.",
            "Immagine di uno scalatore che si ferma ad aiutare un altro scalatore in difficoltà,  priorità alla responsabilità sociale e all'aiuto reciproco.",
            "Immagine di uno scalatore che rinuncia a scalare la montagna,  nessun impegno,  nessuna \"traccia\" lasciata,  rinuncia a mettersi in gioco."
        ],
        "captions": [
            "Vedo Solo la Vetta",
            "Vedo il Sentiero",
            "Vedo Chi Resta Indietro",
            "Rinuncio alla Salita"
        ],
        "options": [
            {
                "value": "Vedo Solo la Vetta",
                "text": "(Positivo: massima focalizzazione sul successo e straordinaria determinazione nel raggiungimento di obiettivi ambiziosi e sfidanti) (Negativo: scarsa attenzione all'impatto sistemico e agli altri membri del team, rischio di individualismo tossico e danni collaterali)."
            },
            {
                "value": "Vedo il Sentiero",
                "text": "(Positivo: eccellente equilibrio tra ambizione individuale e responsabilità sistemica, garanzia di una crescita sostenibile nel tempo) (Negativo: potenziale rallentamento della performance estrema per eccesso di cautela, ambizione mediata dalla tutela del contesto)."
            },
            {
                "value": "Vedo Chi Resta Indietro",
                "text": "(Positivo: suprema responsabilità sociale e leadership servente orientata al supporto del gruppo e alla coesione collettiva) (Negativo: rischio di sacrificare lo sviluppo e il successo personale per l'assistenza continua, potenziale stallo nella crescita individuale)."
            },
            {
                "value": "Rinuncio alla Salita",
                "text": "(Positivo: approccio prudente e conservativo volto a evitare rischi non necessari e mantenere lo status quo di sicurezza) (Negativo: totale rinuncia al potenziale di crescita e mancanza di iniziativa, stagnazione professionale e assenza di coraggio nel mettersi in gioco)."
            }
        ],
        "softSkill": "SviluppoPersonale, ResponsabilitaSociale",
        "characteristics": "Sviluppo Personale vs. Impatto Sociale, Responsabilità, Altruismo",
        "scores": {
            "energia": 25,
            "mente": 15,
            "cuore": 0,
            "guardia": 0
        }
    },
    "109": {
        "num": 109,
        "scenario": "Quando cammini in città, quanto sei \"in allerta\" per la tua sicurezza personale?",
        "instructions": [
            "Immagine di un sonnambulo che cammina ad occhi chiusi,  totale inconsapevolezza del pericolo.",
            "Immagine di un cavallo con i paraocchi che limita la visione laterale,  consapevolezza parziale e limitata.",
            "Immagine di un suricato che scruta l'orizzonte vigile ma sereno,  attenzione vigile ma rilassata.",
            "Immagine di una molla compressa al massimo,  iper-vigilanza e tensione costante."
        ],
        "captions": [
            "Sonnambulo Distratto",
            "Paraocchi Sociali",
            "Suricato Sentinella",
            "Molla Tesa"
        ],
        "options": [
            {
                "value": "Sonnambulo Distratto",
                "text": "(Positivo: approccio fiducioso e sereno che favorisce un benessere psicologico immediato e l'assenza di pregiudizi verso l'ambiente) (Negativo: elevata vulnerabilità ai rischi esterni e grave mancanza di consapevolezza situazionale critica, esposizione al pericolo per negligenza)."
            },
            {
                "value": "Paraocchi Sociali",
                "text": "(Positivo: equilibrio funzionale tra concentrazione sulle proprie attività e vigilanza ambientale minima necessaria) (Negativo: rischio di non intercettare segnali di minaccia latenti a causa di una visione parziale e non olistica del contesto circostante)."
            },
            {
                "value": "Suricato Sentinella",
                "text": "(Positivo: eccellente consapevolezza situazionale dinamica che garantisce sicurezza senza compromettere la stabilità emotiva o il comfort) (Negativo: potenziale esposizione a pericoli estremamente rapidi o subdoli che richiederebbero uno stato di allerta superiore al normale)."
            },
            {
                "value": "Molla Tesa",
                "text": "(Positivo: massima prontezza reattiva e iper-sensibilità ai segnali di rischio, garanzia di prevenzione attiva in ogni circostanza) (Negativo: elevato carico di stress e potenziale paranoia disfunzionale che compromette la qualità della vita e la serenità relazionale)."
            }
        ],
        "softSkill": "SicurezzaSulLavoro, GestioneDelloStress",
        "characteristics": "Consapevolezza Sicurezza, Valutazione del Rischio, Livelli di Stress",
        "scores": {
            "guardia": 25,
            "mente": 20,
            "flusso": 5,
            "cuore": 0,
            "energia": 0
        }
    }
};

    function getQuizSets() {
        return QUIZ_SETS;
    }

    function getQuestionData(qId) {
        const q = QUESTION_BANK[qId];
        if (!q) return null;
        return {
            qId: q.num || qId,
            num: q.num || qId,
            scenario: q.scenario,
            text: q.scenario,
            instructions: q.instructions || [],
            captions: q.captions || [],
            options: q.options || [],
            softSkill: q.softSkill || '',
            characteristics: q.characteristics || '',
            scores: q.scores || { guardia: 10, mente: 10, cuore: 10, energia: 10, flusso: 10 }
        };
    }

    return {
        getQuizSets,
        getQuestionData,
        QUESTION_BANK
    };
})();

if (typeof window !== 'undefined') {
    window.CxQuizEngine = CxQuizEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CxQuizEngine;
}
