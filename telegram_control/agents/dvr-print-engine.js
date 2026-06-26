const DVRPrintEngine = {
    // Helper interno per normalizzare le chiavi delle verticali (italiano ed inglese)
    normalizeKey: function (key) {
        const k = (key || '').toLowerCase().trim();
        if (k === 'common' || k === 'comune') return 'comune';
        if (k === 'dental' || k === 'dentale') return 'dental';
        if (k === 'health' || k === 'sanita' || k === 'sanità') return 'health';
        if (k === 'beauty' || k === 'estetica') return 'beauty';
        if (k === 'food' || k === 'ristorazione') return 'food';
        if (k === 'hospitality' || k === 'ospitalita' || k === 'ospitalità') return 'hospitality';
        if (k === 'professional' || k === 'ufficio' || k === 'uffici') return 'professional';
        if (k === 'workshop' || k === 'officina' || k === 'artigianato') return 'workshop';
        if (k === 'construction' || k === 'cantiere' || k === 'edilizia') return 'construction';
        return 'generic';
    },

    // Metadati descrittivi per ciascun comparto
    metaLocal: {
        "comune": { emoji: "🏠", name: "Infrastruttura, Impianti e Antincendio" },
        "generic": { emoji: "💼", name: "Generico / Altro" },
        "dental": { emoji: "🦷", name: "Odontoiatria / Clinico" },
        "health": { emoji: "🏥", name: "Sanità / Studi Medici" },
        "beauty": { emoji: "💄", name: "Estetica e Benessere" },
        "food": { emoji: "🍳", name: "Ristorazione ed Ho.Re.Ca." },
        "hospitality": { emoji: "🛌", name: "Ospitalità e Hotel" },
        "professional": { emoji: "💼", name: "Servizi Professionali" },
        "workshop": { emoji: "🔧", name: "Officine e Artigianato" },
        "construction": { emoji: "🚧", name: "Edilizia e Impiantistica" }
    },

    // Boilerplate metodologico e scientifico diviso per capitoli
    preambles: {
        riferimenti_legge: `
            Il presente Documento di Valutazione dei Rischi (DVR) è redatto in adempimento agli obblighi non delegabili del Datore di Lavoro sanciti dall'Art. 17 e dall'Art. 28 del D.Lgs. 9 aprile 2008, n. 81 (Testo Unico sulla Salute e Sicurezza sul Lavoro) e successive modifiche ed integrazioni.
            La valutazione specifica del rischio biologico e delle ferite da taglio e punta fa riferimento alle disposizioni del Titolo X (Esposizione ad Agenti Biologici) e del Titolo X-bis (Protezione dalle ferite da taglio e da punta nel settore ospedaliero e sanitario), introdotto in recepimento della Direttiva 2010/32/UE.
        `,
        obiettivi: `
            La redazione del documento persegue i seguenti scopi fondamentali:
            1. Individuare in modo analitico le mansioni aziendali esposte al rischio di contatto con agenti patogeni e taglienti.
            2. Fornire un inquadramento metodologico e scientifico rigoroso che attesti la reale entità del rischio.
            3. Strutturare un piano di miglioramento continuo per consolidare gli standard di prevenzione.
            4. Costituire un quadro informativo chiaro e trasparente a disposizione degli Organi di Vigilanza (ATS, Ispettorato del Lavoro) in sede ispettiva.
        `,
        metodologia_inail: `
            La quantificazione semi-quantitativa del rischio adotta la metodologia integrata "Bio-ritmo", sviluppata originariamente da INAIL e ARPAL.
            Il rischio (R) è definito come il prodotto del Danno potenziale (D) per la Probabilità di accadimento (P): R = P x D.
            Il Danno (D) è determinato in base alla classe di pericolosità dell'agente biologico più elevato potenzialmente riscontrabile (da Gruppo 1 a Gruppo 4, ai sensi dell'Allegato XLVI).
            La Probabilità (P) è stimata attraverso l'analisi dei fattori di barriera, igiene, addestramento e l'uso di Dispositivi di Protezione Individuale (DPI).
        `,
        metodologia_sperimentale: `
            Gli studi sperimentali promossi a livello nazionale (in particolare da ANDI in collaborazione con Arpae) hanno analizzato la dispersione del bio-aerosol generato dagli strumenti rotanti e dagli ablatori a ultrasuoni.
            I test condotti posizionando piastre di Petri e campionatori microbici in corrispondenza del volto dell'operatore e dell'assistente (simulati da manichini) hanno dimostrato che l'adozione congiunta di aspirazione ad alta portata e DPI facciali (visiere e maschere chirurgiche o facciali filtranti FFP2/FFP3) abbatte la carica batterica a valori biologicamente irrilevanti (< 0.5 UFC/cmq).
        `,
        metodologia_statistica: `
            La Banca Dati Statistica dell'INAIL propone le analisi del numero di infortuni e malattie professionali relativi agli ultimi anni per tutti i Lavoratori appartenenti al settore 'Sanità e Assistenza sociale'.
            Dall'analisi delle denunce e dei casi definiti, si evidenzia come il rischio di contrarre patologie gravi per esposizione ad agenti biologici in ambienti a controllo procedurale elevato (es. odontoiatria e medicina ambulatoriale) sia quantificabile statisticamente in una percentuale estremamente bassa del totale nazionale, confermando l'efficacia preventiva delle procedure di isolamento e sanificazione correnti.
        `
    },

    // Schede dettagliate e approfondite per ciascun comparto di sicurezza
    sectorData: {
        "comune": {
            titolo: "Misure Comuni di Infrastruttura, Impianti e Sicurezza Antincendio",
            riferimento: "D.Lgs. 81/08 Titolo I (Principi Comuni) e Titolo II (Luoghi di Lavoro), D.M. 3 Settembre 2021 (Decreto GSA - Gestione Sicurezza Antincendio), D.P.R. 462/01 (Verifiche Messa a Terra)",
            scienza: "La valutazione comprende i rischi trasversali legati alla stabilità e idoneità igienico-funzionale dei locali, la conformità dell'impianto elettrico di alimentazione con dispositivi di sezionamento e differenziali coordinati con l'impianto di terra, il rischio di propagazione di fumo e calore in caso di innesco accidentale (cortocircuito, sovraccarico, fiamme libere), e l'adeguatezza delle vie d'esodo. Si considera inoltre il rischio biologico da Legionellosi (Legionella pneumophila) legato agli accumuli di condensazione e alle torri o evaporatori degli impianti di climatizzazione e ventilazione forzata (VMC).",
            misure: [
                "Verifica periodica biennale o quinquennale dell'impianto di messa a terra ai sensi del D.P.R. 462/01 con organismo di controllo abilitato.",
                "Manutenzione e controllo semestrale dei presidi antincendio (estintori portatili, idranti, porte tagliafuoco, uscite di sicurezza) ai sensi della norma UNI 9994-1.",
                "Sanificazione e pulizia trimestrale dei filtri d'aria e delle bacinelle di raccolta condensa dei condizionatori con registrazioni formali.",
                "Nomina e addestramento teorico-pratico degli addetti alla gestione delle emergenze (primo soccorso e antincendio) ai sensi dei decreti ministeriali vigenti."
            ]
        },
        "generic": {
            titolo: "Misure di Sicurezza Generali per Attività Operative non Sanitarie",
            riferimento: "D.Lgs. 81/08 Titolo II (Luoghi di lavoro) e Allegato IV (Requisiti dei luoghi di lavoro)",
            scienza: "Inquadra i rischi associati a lavorazioni generiche e attività di servizio non classificate in comparti specialistici. Rileva i pericoli da scivolamento e caduta in piano (pavimentazioni non livellate, cavi scoperti, presenza di liquidi), movimentazione manuale di pacchi e carichi minori con rischio di sovraccarico del rachide, rischi legati all'utilizzo di attrezzature di lavoro portatili ed esposizione a microclima sfavorevole (correnti d'aria, sbalzi termici, umidità non regolata).",
            misure: [
                "Mantenimento di passaggi, corridoi e vie di fuga sgombri da materiali e ostacoli fisici o ingombri.",
                "Fornitura di calzature chiuse con suola antiscivolo adatte per le attività operative quotidiane.",
                "Formazione di base dei lavoratori sulla movimentazione manuale dei carichi (MMC) ai sensi del Titolo VI del D.Lgs. 81/08.",
                "Verifica annuale dell'efficienza e della stabilità delle scaffalature e dei sistemi di stoccaggio materiali."
            ]
        },
        "dental": {
            titolo: "Comparto Odontoiatrico, Clinico e Chirurgico",
            riferimento: "D.Lgs. 81/08 Titolo X (Agenti Biologici), D.Lgs. 101/20 (Protezione dalle Radiazioni Ionizzanti), Titolo X-bis (Dispositivi Taglienti)",
            scienza: "Le attività cliniche odontoiatriche comportano una elevata esposizione a rischio biologico da agenti patogeni di Gruppo 2 e 3 (HBV, HCV, HIV, Mycobacterium tuberculosis) presenti nel sangue e nella saliva dei pazienti. Il pericolo si concretizza per via aerea (inalazione di bio-aerosol ad alta velocità generato da manipoli rotanti e ablatori a ultrasuoni) e per via parenterale (lesioni percutanee da aghi e taglienti). Si rileva inoltre l'esposizione a radiazioni ionizzanti per radiografia endorale e tomografia computerizzata a fascio conico (CBCT) e il rischio chimico derivante dall'uso di disinfettanti ad alto livello (es. acido peracetico, aldeidi) e resine acriliche.",
            misure: [
                "Impiego obbligatorio e continuo di Dispositivi di Protezione Individuale (DPI) di III categoria (facciali filtranti FFP2 o FFP3 conformi a UNI EN 149, schermi facciali protettivi, camici monouso idrorepellenti).",
                "Adozione di protocolli rigorosi di termodisinfezione e sterilizzazione in autoclave Classe B con convalida annuale (IQ/OQ/PQ) e test fisici giornalieri (Helix Test, Vacuum Test).",
                "Trattamento chimico continuo dell'acqua dei riuniti (sistemi ad anidride di cloro o perossido di idrogeno) con flussaggio prolungato a inizio giornata.",
                "Abolizione della pratica del reincappucciamento manuale degli aghi con adozione di aghi di sicurezza e contenitori rigidi per taglienti conformi a UNI EN ISO 23907.",
                "Nomina dell'Esperto di Radioprotezione ai sensi del D.Lgs. 101/20, monitoraggio dosimetrico individuale trimestrale e sorveglianza medica specifica."
            ]
        },
        "health": {
            titolo: "Comparto Sanitario e Poliambulatori Medici Generali",
            riferimento: "D.Lgs. 81/08 Titolo X (Agenti Biologici), Titolo IX (Sostanze Pericolose), Legge 24/2017 (Gelli-Bianco)",
            scienza: "Le attività ambulatoriali e di diagnosi medica generica espongono gli operatori a rischi di contagio biologico per contatto diretto con secrezioni, fluidi corporei o mucose dei pazienti, oltre all'esposizione ad agenti patogeni respiratori aerei (influenza, pertosse, morbillo, SARS-CoV-2). Si evidenzia il rischio chimico da preparati istologici (es. formalina, classificata come cancerogena), detergenti industriali e disinfettanti per la sanificazione delle strumentazioni diagnostiche e dei lettini da visita, nonché rischi ergonomici legati alla mobilizzazione assistita di pazienti ipomobili.",
            misure: [
                "Adozione di copriletti e lenzuolini monouso per ogni paziente e sanificazione immediata del lettino con disinfettante a base alcolica o cloro-derivato.",
                "Utilizzo di guanti monouso in nitrile o lattice senza polvere ad alta sensibilità per ogni esame obiettivo o prelievo.",
                "Installazione di cappe aspiranti localizzate o sistemi di estrazione forzata nei laboratori o aree di manipolazione di formalina o reagenti volatili.",
                "Formazione specifica del personale sulle tecniche di movimentazione dei pazienti e utilizzo di ausili di sollevamento (es. teli a scorrimento, sollevatori attivi).",
                "Programma sistematico di vaccinazione per il personale esposto (anti-epatite B, anti-influenzale, rosolia, morbillo, parotite)."
            ]
        },
        "beauty": {
            titolo: "Comparto Estetica, Benessere e Trattamenti Estetici",
            riferimento: "Legge 1 del 04/01/1990, D.M. 206/2015 (Regolamento apparecchiature), D.Lgs. 81/08 Titolo VIII Capo IV (Radiazioni Ottiche Artificiali)",
            scienza: "I trattamenti estetici implicano rischi fisici rilevanti connessi alle apparecchiature laser (Classe 3B e Classe 4 per epilazione e rimozione pigmenti) e luce pulsata (IPL), in grado di provocare gravi lesioni oculari (danno retinico irreversibile) o ustioni cutanee a causa di irraggiamento diretto o riflesso. Si riscontra un rischio biologico significativo dovuto al contatto percutaneo e transcutaneo (es. micropigmentazione, pedicure profonda, rimozione cuticole) con potenziale contatto con sangue o secrezioni, e rischio chimico connesso all'inalazione di vapori (es. solventi per unghie, esalazioni trattamenti cheratinici) e all'uso di detergenti allergizzanti.",
            misure: [
                "Uso obbligatorio di occhiali protettivi con densità ottica (OD) certificata e specifica per la lunghezza d'onda del laser in funzione, sia per l'operatore che per il cliente.",
                "Segregazione della cabina laser con interblocco della porta d'ingresso o sistema di segnalazione luminosa 'Laser Attivo' all'esterno.",
                "Nomina del Tecnico Sicurezza Laser (TSL) o dell'Addetto alla Sicurezza Laser (ASL) ai sensi delle norme CEI EN 60825-1.",
                "Protocollo rigido di sterilizzazione a caldo (autoclave Classe B) per strumenti taglienti riutilizzabili (sgorbie, tronchesine) o impiego esclusivo di monouso.",
                "Aspirazione localizzata sui tavoli da manicure per l'abbattimento di polveri acriliche e vapori di solventi chimici."
            ]
        },
        "food": {
            titolo: "Comparto Ristorazione, Cucine ed Ho.Re.Ca.",
            riferimento: "Regolamento CE 852/2004 (HACCP), D.Lgs. 81/08 Titolo III (Attrezzature), Titolo VIII Capo II (Rumore)",
            scienza: "L'attività in cucina espone gli operatori a rischi infortunistici elevati dovuti a tagli con coltelleria o affettatrici e a ustioni da contatto con superfici roventi, oli bollenti o vapore. Il microclima caldo-umido severo genera affaticamento e rischio di disidratazione. Il rischio biologico è legato alla manipolazione di alimenti crudi potenzialmente infetti da batteri enteropatogeni (Salmonella, Escherichia Coli, Campylobacter).",
            misure: [
                "Presenza e funzionamento costante dei pressamerce e dei dispositivi di blocco meccanico sulle affettatrici.",
                "Uso obbligatorio di guanti protettivi in maglia d'acciaio o Kevlar durante le operazioni di taglio e disosso.",
                "Pavimentazione antisdrucciolo con coefficiente di attrito R11 o R12 e griglie di sgrondo per i liquidi nelle zone cucina e lavaggio.",
                "Fornitura di DPI resistenti al calore (guanti termici, grembiuli alluminizzati) e scarpe antinfortunistiche con suola antiscivolo e puntale protettivo."
            ]
        },
        "hospitality": {
            titolo: "Comparto Ospitalità, Strutture Ricettive e Alberghiere",
            riferimento: "D.Lgs. 81/08 Titolo VI (Movimentazione Manuale dei Carichi), Titolo X (Agenti Biologici), Linee Guida prevenzione Legionellosi 2015",
            scienza: "I lavoratori addetti ai piani e alle camere sono esposti a significativi rischi ergonomici (sovraccarico biomeccanico degli arti superiori e della colonna vertebrale) a causa delle posture incongrue e sforzi ripetuti per il rifacimento dei letti e la pulizia. Nelle strutture ricettive si evidenzia inoltre il rischio biologico da Legionellosi negli impianti idrici e di climatizzazione, oltre al rischio chimico dovuto all'inalazione e contatto con detergenti industriali e disinfettanti concentrati.",
            misure: [
                "Formazione del personale sulle tecniche di sollevamento e movimentazione dei carichi (sollevamento materassi, movimentazione carrelli).",
                "Verifica, pulizia e decalcificazione trimestrale di tutti i soffioni delle docce, filtri e terminali idrici per prevenire accumuli di Legionella.",
                "Fornitura di guanti resistenti all'usura e agenti chimici per il personale di pulizia e occhiali di protezione per la diluizione dei detergenti concentrati.",
                "Adozione di carrelli agevolati, leggeri e dotati di ruote pivotanti scorrevoli per limitare gli sforzi di spinta."
            ]
        },
        "professional": {
            titolo: "Comparto Uffici, Amministrazione e Servizi Professionali",
            riferimento: "D.Lgs. 81/08 Titolo VII (Attrezzature munite di videoterminali), UNI EN ISO 9241 (Requisiti ergonomici)",
            scienza: "I rischi principali sono legati all'ergonomia delle postazioni lavorative con potenziale insorgenza di disturbi muscolo-scheletrici (cervicalgie, lombalgie, sindrome del tunnel carpale) dovuti all'uso prolungato di videoterminali (VDT). L'affaticamento visivo (astenia visiva) è causato da contrasti di luce non idonei o riflessi sugli schermi. Si rilevano inoltre rischi da stress lavoro-correlato correlati a carichi di lavoro mentali o scadenze pressanti, e rischi legati alla qualità dell'aria indoor (sindrome dell'edificio malato).",
            misure: [
                "Fornitura di sedie operative conformi (sedile regolabile in altezza e inclinazione, schienale regolabile con supporto lombare, base a 5 razze su ruote).",
                "Pianificazione e adozione di pause obbligatorie di 15 minuti ogni 120 minuti di lavoro continuativo al videoterminale.",
                "Corretto posizionamento dello schermo rispetto alle fonti di luce naturale (perpendicolare alle finestre) per evitare abbagliamenti e riflessi.",
                "Valutazione sistematica del rischio stress lavoro-correlato utilizzando la metodologia e la lista di controllo INAIL."
            ]
        },
        "workshop": {
            titolo: "Comparto Officine Meccaniche e Autoriparazione",
            riferimento: "D.Lgs. 81/08 Titolo III (Attrezzature), Titolo IX (Sostanze pericolose), Titolo VIII Capo II (Rumore) e Capo III (Vibrazioni)",
            scienza: "Le officine espongono gli operatori a rischi fisici elevati legati al rumore continuo e impulsivo delle attrezzature, e alle vibrazioni meccaniche trasmesse al sistema mano-braccio (HAV - avvitatori pneumatici, smerigliatrici) e corpo intero (WBV - guida di ponti sollevatori o mezzi semoventi). Sussiste un elevato rischio chimico per l'uso e contatto con oli minerali esausti (miscele cancerogene), solventi per sgrassaggio, carburanti e inalazione di gas di scarico (monossido di carbonio, particolato diesel). I rischi infortunistici comprendono lo schiacciamento per caduta di carichi sospesi o mal posizionati sui ponti sollevatori.",
            misure: [
                "Verifica annuale di integrità e stabilità strutturale dei ponti sollevatori e dei compressori d'aria (verifiche periodiche INAIL).",
                "Installazione di impianti di aspirazione localizzata dei gas di scarico da collegare direttamente ai terminali delle marmitte dei veicoli.",
                "Misurazione strumentale quadriennale dei livelli di rumore e vibrazioni (sistema mano-braccio e corpo intero) ai sensi del Titolo VIII del D.Lgs. 81/08.",
                "Uso obbligatorio di DPI specifici: scarpe antinfortunistiche S3, guanti protettivi in nitrile resistenti agli idrocarburi, cuffie antirumore certificate, occhiali protettivi anti-scheggia.",
                "Sostituzione di solventi clorurati o tossici con detergenti a base acquosa biodegradabili."
            ]
        },
        "construction": {
            titolo: "Comparto Cantieri Edili e Installazione Impiantistica",
            riferimento: "D.Lgs. 81/08 Titolo IV (Cantieri temporanei o mobili), UNI EN 12811 (Ponteggi)",
            scienza: "I cantieri temporanei o mobili presentano rischi elevatissimi e ad alta severità di danno. Il rischio principale è rappresentato dalla caduta dall'alto (lavori ad altezza > 2 metri su ponteggi, scale o coperture) e dallo sfondamento di solai o tetti. Si rilevano rischi di seppellimento durante gli scavi, rischio elettrico per contatti diretti o indiretti con linee elettriche aeree o interrate, e rischio biologico da polveri di silicio (Silice Libera Cristallina, causa di silicosi) prodotte dalle lavorazioni di cemento, pietre e mattoni.",
            misure: [
                "Redazione obbligatoria del Piano Operativo di Sicurezza (POS) prima dell'ingresso in cantiere e rispetto del Piano di Sicurezza e Coordinamento (PSC).",
                "Installazione di sistemi di protezione collettiva anticaduta (parapetti provvisori UNI EN 13374, reti di sicurezza) o linee vita certificate UNI EN 795.",
                "Utilizzo obbligatorio di imbracature anticaduta collegate a punti di ancoraggio sicuri con cordini dotati di assorbitore di energia.",
                "Armatura e puntellazione sistematica delle pareti degli scavi con profondità superiore a 1.5 metri.",
                "Uso di mascherine FFP3 per la protezione delle vie respiratorie durante il taglio, demolizione o miscelazione di cementi per evitare l'inalazione di silice."
            ]
        }
    },

    // Genera l'HTML e avvia la stampa
    generateAndPrint: async function (tenant, catalog, checklistState) {
        if (window.showLoader) window.showLoader("Generazione Libro DVR...");

        const now = new Date();
        const dateStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

        // Costruzione dell'HTML (identica all'originale, ma senza iframe)
        let html = `
            <!DOCTYPE html>
            <html lang="it">
            <head>
                <meta charset="utf-8">
                <title>Libro DVR Completo - ${tenant.ragioneSociale}</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #1a202c;
                        line-height: 1.6;
                        font-size: 11px;
                        background: #fff;
                        margin: 0;
                        padding: 0;
                    }
                    .page {
                        width: 210mm;
                        height: 297mm;
                        padding: 20mm 15mm;
                        box-sizing: border-box;
                        position: relative;
                        background: #fff;
                    }
                    /* Copertina */
                    .cover {
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .cover-header { text-align: center; }
                    .cover-title {
                        font-size: 26px;
                        font-weight: 900;
                        color: #1a365d;
                        letter-spacing: -0.02em;
                        margin-top: 40px;
                        line-height: 1.2;
                        text-transform: uppercase;
                    }
                    .cover-subtitle {
                        font-size: 12px;
                        color: #4a5568;
                        margin-top: 10px;
                        font-weight: 600;
                    }
                    .info-box {
                        background-color: #f7fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        margin: 30px 0;
                    }
                    .info-title {
                        font-size: 11px;
                        font-weight: 900;
                        text-transform: uppercase;
                        color: #2b6cb0;
                        border-bottom: 2px solid #edf2f7;
                        padding-bottom: 6px;
                        margin-bottom: 12px;
                        letter-spacing: 0.05em;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                        border-bottom: 1px solid #edf2f7;
                    }
                    .info-row:last-child { border-bottom: none; }
                    .info-label { font-weight: bold; color: #4a5568; }
                    .info-value { font-weight: 600; color: #1a202c; }
                    
                    /* Capitolo */
                    .chapter-title {
                        font-size: 18px;
                        font-weight: 900;
                        color: #2b6cb0;
                        border-bottom: 3px solid #3182ce;
                        padding-bottom: 8px;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                    }
                    .section-subtitle {
                        font-size: 12px;
                        font-weight: 900;
                        color: #4a5568;
                        margin-top: 20px;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        border-left: 3px solid #2b6cb0;
                        padding-left: 8px;
                    }
                    p { text-align: justify; margin-bottom: 10px; }
                    
                    /* Tabelle */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    th, td {
                        border: 1px solid #e2e8f0;
                        padding: 8px 10px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th {
                        background-color: #edf2f7;
                        font-weight: bold;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.02em;
                    }
                    
                    /* Firme */
                    .signature-area {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-top: 40px;
                    }
                    .signature-box {
                        border: 1px solid #cbd5e0;
                        border-radius: 8px;
                        padding: 15px;
                        min-height: 50px;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .signature-label {
                        font-size: 8px;
                        font-weight: bold;
                        text-transform: uppercase;
                        color: #718096;
                    }
                </style>
            </head>
            <body>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 1: COPERTINA E ANAGRAFICA
        // ══════════════════════════════════════════════════════════════════════
        const mappedSectorNames = tenant.activeVerticals.map(v => {
            const normalized = this.normalizeKey(v);
            return this.metaLocal[normalized]?.name || v;
        }).join(', ');

        html += `
            <div class="page cover">
                <div class="cover-header">
                    <span style="font-size: 10px; font-weight: bold; letter-spacing: 0.15em; color: #718096; text-transform: uppercase;">D.Lgs. 9 aprile 2008, n. 81 e s.m.i.</span>
                    <h1 class="cover-title">Documento di Valutazione dei Rischi</h1>
                    <p class="cover-subtitle">Valutazione dei Rischi da Esposizione ad Agenti Biologici e da Ferite da Taglio e da Punta</p>
                </div>

                <div class="info-box">
                    <div class="info-title">Anagrafica Aziendale</div>
                    <div class="info-row"><span class="info-label">Ragione Sociale:</span><span class="info-value">${tenant.ragioneSociale}</span></div>
                    <div class="info-row"><span class="info-label">P.IVA / C.F.:</span><span class="info-value">${tenant.pIva}</span></div>
                    <div class="info-row"><span class="info-label">Sede Legale ed Operativa:</span><span class="info-value">${tenant.indirizzo}</span></div>
                    <div class="info-row"><span class="info-label">Settori di Attività Valutati:</span><span class="info-value">${mappedSectorNames}</span></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 10px;">
                    <div class="info-box" style="margin: 0; padding: 12px;">
                        <div class="info-title" style="font-size: 9px; margin-bottom: 6px;">Staff di Prevenzione</div>
                        <div style="margin-bottom: 4px;"><strong>RSPP:</strong> ${tenant.generalMetadata.rspp}</div>
                        <div><strong>RLS:</strong> ${tenant.generalMetadata.rls}</div>
                    </div>
                    <div class="info-box" style="margin: 0; padding: 12px;">
                        <div class="info-title" style="font-size: 9px; margin-bottom: 6px;">Sorveglianza e Emergenze</div>
                        <div style="margin-bottom: 4px;"><strong>Medico Competente:</strong> ${tenant.generalMetadata.medicoCompetente}</div>
                        <div><strong>Addetti Emergenze:</strong> ${tenant.generalMetadata.addettiEmergenza.join(', ')}</div>
                    </div>
                </div>

                <div style="text-align: center; font-size: 9px; color: #718096; margin-top: 20px;">
                    Documento generato digitalmente in data ${dateStr}. Conservare copia firmata presso la sede aziendale.
                </div>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 2: PREMESSA SCIENTIFICA E INQUADRAMENTO LEGISLATIVO
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page">
                <h2 class="chapter-title">Inquadramento Normativo e Premesse</h2>
                
                <div class="section-subtitle">Riferimenti Legislativi Applicati</div>
                <p>${this.preambles.riferimenti_legge}</p>
                <p>La valutazione copre la stima quantitativa dell'esposizione dei lavoratori a patogeni del sangue, secrezioni orali e bio-aerosol, unitamente alla protezione contro le punture accidentali, in conformità agli indirizzi tecnici forniti dall'Ente Bilaterale e dalle associazioni di categoria.</p>

                <div class="section-subtitle">Obiettivi della Prevenzione Aziendale</div>
                <p>${this.preambles.obiettivi}</p>

                <div class="section-subtitle">Inquadramento Medico-Scientifico dei Vettori</div>
                <p>Nelle attività ambulatoriali e commerciali, l'esposizione biologica non deriva da uso deliberato dei patogeni, ma dalla presenza accidentale degli stessi nei fluidi dei pazienti o nelle risorse ambientali comuni. La trasmissione può avvenire tramite contatto diretto (fluidi su mucose o cute lesionata), trasmissione semidiretta (bio-aerosol proiettato da strumenti rotanti) o inoculazione parenterale (punture o tagli con strumenti contaminati).</p>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINA 3: METODOLOGIE DI VALUTAZIONE (INAIL, SPERIMENTALE, STATISTICA)
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page">
                <h2 class="chapter-title">Cap. 1 - Metodologie di Stima del Rischio</h2>
                
                <div class="section-subtitle">1.1 Metodologia Integrata INAIL (Algoritmo Bio-ritmo)</div>
                <p>${this.preambles.metodologia_inail}</p>
                <p>La stima del livello probabilistico risente direttamente delle condizioni strutturali della sede, delle buone pratiche igieniche formalizzate e dell'addestramento continuo all'uso dei DPI di III Categoria.</p>

                <div class="section-subtitle">1.2 Metodologia Sperimentale (Studi Aerosol)</div>
                <p>${this.preambles.metodologia_sperimentale}</p>

                <div class="section-subtitle">1.3 Metodologia Statistica (Analisi Infortuni Nazionale)</div>
                <p>${this.preambles.metodologia_statistica}</p>
                <p>L'incidenza clinica reale per gli operatori sanitari e per le attività ad elevato controllo procedurale si attesta su percentuali prossime allo zero, validando l'assoluta efficacia preventiva delle misure igieniche e di autocontrollo correntemente adottate.</p>
            </div>
        `;

        // ══════════════════════════════════════════════════════════════════════
        // PAGINE SUCCESSIVE: SEZIONI SPECIFICHE PER SETTORI ATTIVI (DINAMICI)
        // ══════════════════════════════════════════════════════════════════════
        const activeSectors = [...new Set(['comune', ...tenant.activeVerticals.map(v => this.normalizeKey(v))])];

        activeSectors.forEach((vKey) => {
            const sec = this.sectorData[vKey];
            if (!sec) return;

            const sectorServices = catalog.filter(s => {
                if (typeof getVerticalForService === 'function') {
                    const normalizedSvcKey = DVRPrintEngine.normalizeKey(getVerticalForService(s));
                    return normalizedSvcKey === vKey;
                }
                return vKey === 'comune';
            });

            let d = (vKey === 'dental' || vKey === 'health' || vKey === 'workshop' || vKey === 'construction' || vKey === 'food') ? 3 : 2;
            if (vKey === 'professional') d = 1;

            let totalChecks = 0;
            let checkedCount = 0;

            if (sectorServices.length > 0) {
                sectorServices.forEach(s => {
                    const state = checklistState[s.service_sku] || {};
                    totalChecks += 3;
                    checkedCount += Object.values(state).filter(Boolean).length;
                });
            } else {
                const state = checklistState[vKey] || {};
                totalChecks = 3;
                checkedCount = Object.values(state).filter(Boolean).length;
            }

            const fraction = totalChecks > 0 ? (checkedCount / totalChecks) : 0;
            const p = Math.max(1, Math.min(4, Math.round(4 - (3 * fraction))));
            const r = p * d;
            const rLabel = r >= 8 ? 'Alto' : (r >= 4 ? 'Medio' : 'Basso');
            const rBg = r >= 8 ? '#fee2e2' : (r >= 4 ? '#ffedd5' : '#dcfce7');

            html += `
                <div class="page">
                    <h2 class="chapter-title">Sezione: ${sec.titolo}</h2>
                    <p style="font-size: 10px; color: #718096; margin-top: -10px; font-weight: bold;">Riferimento: ${sec.riferimento}</p>
                    
                    <div class="section-subtitle">1. Razionale e Analisi di Esposizione</div>
                    <p>${sec.scienza}</p>

                    <div class="section-subtitle">2. Stima Quantitativa del Rischio (Metodo INAIL R = P x D)</div>
                    <p>La valutazione basata sullo stato reale di attuazione delle misure preventive e dei controlli operativi restituisce i seguenti indici:</p>
                    
                    <table style="margin: 10px 0;">
                        <thead>
                            <tr>
                                <th>Gravità Danno (D)</th>
                                <th>Probabilità Stimata (P)</th>
                                <th>Indice di Rischio (R)</th>
                                <th>Grado Residuo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="text-align: center; font-weight: bold; font-size: 12px;">${d} / 4</td>
                                <td style="text-align: center; font-weight: bold; font-size: 12px;">${p} / 4</td>
                                <td style="text-align: center; font-weight: 900; font-size: 14px; background: ${rBg};">${r}</td>
                                <td style="font-weight: bold; text-transform: uppercase;">${rLabel}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="section-subtitle">3. Misure di Prevenzione e Protezione Obbligatorie</div>
                    <p>Si riepilogano le principali barriere preventive prescritte per la tutela della salute del personale operante in questo settore:</p>
                    <ul style="padding-left: 20px; font-size: 10.5px;">
                        ${sec.misure.map(m => `<li style="margin-bottom: 6px;">${m}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        // ══════════════════════════════════════════════════════════════════════
        // ULTIMA PAGINA: PIANO DI MIGLIORAMENTO, CONCLUSIONI E FIRME
        // ══════════════════════════════════════════════════════════════════════
        html += `
            <div class="page">
                <h2 class="chapter-title">Programma di Miglioramento e Firme</h2>
                
                <div class="section-subtitle">Pianificazione dei Controlli Periodici</div>
                <p>Per garantire l'efficacia costante nel tempo delle misure di prevenzione e decontaminazione, si adotta il seguente piano di scadenze e verifiche:</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>Misura / Oggetto di Controllo</th>
                            <th>Frequenza</th>
                            <th>Operatore Responsabile</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Validazione cicli di sterilizzazione ed Helix/Vacuum test</td>
                            <td>Quotidiana / Ad ogni ciclo</td>
                            <td>Assistente di Studio / ASO / Personale Addetto</td>
                        </tr>
                        <tr>
                            <td>Manutenzione ordinaria ed igienizzazione filtri climatizzazione</td>
                            <td>Semestrale</td>
                            <td>Tecnico Esterno Qualificato</td>
                        </tr>
                        <tr>
                            <td>Sorveglianza Sanitaria e accertamenti del Medico Competente</td>
                            <td>Biennale / Triennale (in base alla mansione)</td>
                            <td>Medico Competente Nominato</td>
                        </tr>
                        <tr>
                            <td>Verifica e taratura strumenti diagnostici ed endorali</td>
                            <td>Annuale</td>
                            <td>Esperto di Radioprotezione</td>
                        </tr>
                    </tbody>
                </table>

                <div class="section-subtitle">Dichiarazione di Approvazione</div>
                <p>I sottoscritti attestano di avuti collaborato attivamente all'analisi dei fattori di rischio e all'elaborazione del presente documento di valutazione, impegnandosi all'applicazione e alla verifica costante di quanto in esso prescritto.</p>

                <div class="signature-area">
                    <div class="signature-box">
                        <span class="signature-label">Il Datore di Lavoro</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.ragioneSociale}
                        </div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Medico Competente Nominato</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.medicoCompetente}
                        </div>
                    </div>
                </div>

                <div class="signature-area" style="margin-top: 20px;">
                    <div class="signature-box">
                        <span class="signature-label">Il Responsabile del Servizio Prevenzione (RSPP)</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.rspp}
                        </div>
                    </div>
                    <div class="signature-box">
                        <span class="signature-label">Il Rappresentante dei Lavoratori (RLS)</span>
                        <div style="font-size: 9px; font-weight: bold; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 4px; margin-top: 30px;">
                            ${tenant.generalMetadata.rls}
                        </div>
                    </div>
                </div>
            </div>
        `;

        html += `
            </body>
            </html>
        `;

        // NUOVO: invece di iframe + window.print(), usi html2canvas + jsPDF
        try {
            const { jsPDF } = window.jspdf;

            // Crea un div temporaneo invisibile ma presente nel DOM per consentire a html2canvas di renderizzarlo
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '794px'; // Larghezza fissa A4 a 96dpi
            container.innerHTML = html;
            document.body.appendChild(container);

            // Aspetta il rendering del layout
            await new Promise(r => setTimeout(r, 300));

            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const pages = container.querySelectorAll('.page');

            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
            }

            document.body.removeChild(container);

            // Gestione del file in Telegram WebApp
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `DVR_${tenant.ragioneSociale}.pdf`;

            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
                // Rilevamento Telegram Mini App mobile per aggirare il blocco download
                window.open(url, '_blank');
            } else {
                link.click();
            }
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (err) {
            console.error(err);
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
                window.Telegram.WebApp.showAlert("Errore durante la generazione del PDF: " + err.message);
            } else {
                alert("Errore durante la generazione del PDF: " + err.message);
            }
        } finally {
            if (window.hideLoader) window.hideLoader();
        }
    }
};