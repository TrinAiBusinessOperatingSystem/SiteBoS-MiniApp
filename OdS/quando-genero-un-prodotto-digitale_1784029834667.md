# 📐 ORDINE DI SERVIZIO: QUANDO-GENERO-UN-PRODOTTO-DIGITALE

## 📝 CONTESTO OPERATIVO
La richiesta punta a trasformare la generazione di un prodotto digitale cartaceo/informativo (come un PDF di schede tecniche o un report operativo) da una stampa statica a una vera e propria pipeline ('pipe') dinamica. Questo processo deve unire le informazioni del prodotto presenti a catalogo con una struttura di produzione definita in un blueprint e con i dati del profilo aziendale dell'utente attivo, producendo un output professionale e personalizzato in tempo reale.

## 🔗 MAPPATURA CONNESSIONI
L'interfaccia frontend (catalog.html) rileva i prodotti contrassegnati come PDF digitali e scatena la richiesta. Il backend (service_catalog.json) funge da orchestratore del flusso: attinge dal database per ricavare l'articolo (da 'service_catalog'), la sua struttura editoriale (da 'process_blueprints') e il contesto aziendale del richiedente (da 'owner_sessions'). Successivamente esegue la compilazione e la conversione in PDF, aggiorna lo storico di persistenza in 'owner_sessions' e restituisce il file pronto al frontend.

## 📐 DECISIONI ARCHITETTURALI
Si è scelta un'architettura guidata dai metadati (metadata-driven pipeline). Invece di cablare la logica di ogni PDF singolarmente nel codice di backend, la 'pipe' di generazione è agnostica: legge la struttura del capitolo da un blueprint associato al prodotto e applica uno stile standardizzato. Questo approccio riduce drasticamente i tempi di manutenzione, permette di aggiungere infiniti nuovi prodotti digitali al catalogo senza modificare il codice e assicura che ogni PDF sia sempre perfettamente formattato e brandizzato con le informazioni aziendali aggiornate dell'utente.

---

## 📐 1. SPECIFICHE FRONTEND
Dichiarazione concettuale per 'telegram_control/catalog.html':
1. Identificazione Prodotto PDF: Implementare nel rendering del catalogo un controllo per riconoscere gli articoli digitali in formato PDF (verifica su 'item_type === "digital"' e su 'additional_kwargs.digital_format === "pdf"').
2. Pulsante di Azione 'Pipe': Per questi articoli, inserire un pulsante d'azione dedicato denominato 'Genera Prodotto Digitale (PDF Pipe)' con un'icona accattivante (es. fa-wand-magic-sparkles o fa-file-pdf).
3. Pipeline Progress Indicator (Stato del Flusso): All'attivazione del pulsante, mostrare una barra di avanzamento dinamica divisa in step sequenziali che riflette lo stato della 'pipe' di elaborazione del backend (es. 'Fase 1: Assemblaggio Dati...', 'Fase 2: Compilazione Contenuto...', 'Fase 3: Generazione File PDF...', 'Fase 4: Archiviazione e Download...').
4. Integrazione API: Sviluppare la chiamata AJAX (POST) verso il webhook del backend (/catalog/service_catalog) inviando i parametri 'action: "generate_pdf_pipe"', l'identificativo del prodotto ('item_sku') e l'ID utente attivo per recuperare il contesto.
5. Gestione Risposta: Al completamento del processo n8n, scaricare automaticamente il PDF generato tramite un trigger programmato o mostrare un link di download diretto ben visibile con tracking di avvenuto successo.

## ⚙️ 2. GUIDA PASSO-PASSO BACKEND (n8n)
Guida dettagliata per il workflow 'SiteBoS-App-Hook/catalog/service_catalog.json' in n8n:
1. Nodo Router/Webhook di Ingresso: Intercettare le richieste POST dirette all'endpoint del catalogo. Configurare una condizione 'IF' o un nodo 'Switch' che verifichi se il parametro 'action' equivale a 'generate_pdf_pipe'. In caso positivo, deviare il flusso verso il nuovo ramo della pipeline.
2. Nodo di Recupero Informazioni: 
   - Eseguire una query MongoDB su 'service_catalog' per estrarre l'articolo corrispondente allo 'item_sku' ricevuto.
   - Contemporaneamente, eseguire una query su 'owner_sessions' usando l'ID utente per estrarre i dati del tenant/proprietario (es. logo aziendale, nome azienda, descrizione del business, recapiti) che serviranno per personalizzare l'intestazione e il piè di pagina del PDF.
3. Nodo di Estrazione Blueprint (Struttura): Leggere il campo 'operations.process_blueprint_id' dell'articolo recuperato ed eseguire una query sulla collezione 'process_blueprints'. Questo documento fungerà da 'scheletro strutturale' del PDF (con 'stages' e 'steps' mappati come capitoli e sottocapitoli).
4. Nodo Pipe di Assemblaggio e Compilazione (JavaScript Code): Unire i dati della sessione dell'owner con lo scheletro del blueprint. Cicliare sulle sezioni del documento compilando dinamicamente i placeholder e, se necessario, instradare il testo in un nodo AI (es. Gemini) per arricchire il contenuto sulla base del settore dell'owner.
5. Nodo Pipe di Generazione HTML: Prendere l'oggetto JSON assemblato e iniettarlo all'interno di un template HTML predefinito e ottimizzato per la stampa (con regole CSS '@media print' per la corretta interruzione di pagina, stili moderni e puliti, logo dell'azienda e piè di pagina numerato).
6. Nodo Pipe di Conversione PDF: Inviare il codice HTML compilato ad un microservizio di rendering PDF (es. Gotenberg o Puppeteer tramite nodo HTTP Request) impostando i margini corretti e l'orientamento della pagina per ottenere il file binario PDF.
7. Nodo Pipe di Archiviazione e Tracking: Caricare il file binario generato su uno storage cloud (es. S3 o Google Drive) per ottenere un URL pubblico sicuro. Aggiornare la sessione dell'utente su 'owner_sessions' aggiungendo l'URL e il timestamp nello storico delle generazioni e inviare la risposta di successo contenente l'URL del PDF al frontend.

## 💾 3. STRUTTURA DATABASE (MongoDB)
Dettaglio delle modifiche e interazioni con la persistenza dati:
1. Collezione 'service_catalog':
   - Verificare che i prodotti digitali abbiano il campo 'identity.item_type' impostato su 'digital'.
   - Aggiungere all'interno dell'oggetto 'additional_kwargs' la proprietà 'digital_format': "pdf".
   - Popolare il campo 'operations.process_blueprint_id' con l'ID valido del documento all'interno della collezione 'process_blueprints' che stabilisce il layout del documento.
2. Collezione 'process_blueprints':
   - Utilizzare la struttura esistente ('stages' e 'steps') per descrivere i capitoli e i paragrafi del PDF da generare (es. lo stage definisce il titolo del capitolo, lo step definisce il paragrafo/istruzioni da espandere).
3. Collezione 'owner_sessions':
   - Aggiornare il record dell'utente loggato inserendo una nuova entry all'interno di un array dedicato (es. in 'additional_kwargs.digital_downloads_history') strutturato in questo modo per tracciare lo storico dei PDF prodotti:
     { "sku": "SKU_PRODOTTO", "generated_at": "TIMESTAMP", "url": "URL_DOWNLOAD_PDF" }
