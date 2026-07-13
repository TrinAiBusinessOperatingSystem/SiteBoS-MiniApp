# 📐 ORDINE DI SERVIZIO: ALLORA-QUELLO-CHE-HO-NOTATO

## 📝 CONTESTO OPERATIVO
Dall'analisi delle esigenze dell'utente e dall'ispezione della struttura del catalogo e dei blueprint, emerge l'incompatibilità del modello lineare a step (SOP/servizi) applicato direttamente alla definizione di un prodotto fisico. I prodotti hanno una natura composita: non nascono da un semplice flusso sequenziale, ma dall'aggregazione strutturata di semilavorati e materie prime. Ciascun semilavorato può richiedere un proprio processo produttivo (SOP dedicata). Riconoscendo questo scenario, si rende necessaria una netta biforcazione logica tra la configurazione di un servizio (lineare e basata su step procedurali) e quella di un prodotto (strutturata come distinta base di componenti semilavorati).

## 🔗 MAPPATURA CONNESSIONI
La connessione si sviluppa lungo l'asse Frontend-Backend-Database in modo fluido:
1. L'utente interagisce con edit-product.html e edit-advanced.js. Se l'entità è un prodotto ('pro'), la UI disabilita gli step procedurali e attiva la griglia di selezione dei semilavorati.
2. Al salvataggio, i dati della distinta base vengono inviati a saveProduct_processor.json e Advanced_processor2.0.json.
3. I workflow n8n elaborano l'array dei componenti, validano l'esistenza delle SKU dei semilavorati ed eseguono il ricalcolo del costo complessivo.
4. I dati strutturati vengono salvati in 'service_catalog' dentro 'relations.related_items', lasciando la gestione delle fasi produttive isolate nei blueprint di tipo 'SOP_SEMILAVORATO' all'interno di 'process_blueprints'.

## 📐 DECISIONI ARCHITETTURALI
La scelta architetturale adottata prevede l'introduzione della tipologia 'semilavorato' come entità autonoma all'interno del catalogo e la conversione del concetto di 'Blueprint di Prodotto' in una 'Distinta Base' (BOM) nidificata. Questo approccio garantisce molteplici vantaggi di design:
- Separazione dei flussi: Disattiva l'impostazione a step per i prodotti finali per evitare interfacce ridondanti o disallineate rispetto alle necessità operative della produzione.
- Modularità e Riuso: Un semilavorato (con la sua specifica SOP di produzione) può essere riutilizzato all'interno di molteplici prodotti finiti differenti, ottimizzando la manutenzione delle ricette industriali.
- Accuratezza Economica: Il ricalcolo automatico effettuato nel backend garantisce che ogni variazione di costo su un semilavorato si propaghi e aggiorni istantaneamente il costo del prodotto finito ('cost_of_goods'), salvaguardando il calcolo dei margini operativi.

---

## 📐 1. SPECIFICHE FRONTEND
Dichiarazione concettuale delle modifiche per l'interfaccia utente nei file indicati:

1. telegram_control/edit-product.html:
   - Introdurre una logica condizionale nell'inizializzazione del pannello: se il tipo di entità ('identity.item_type') è uguale a 'pro' (Prodotto), nascondere e disattivare la sezione standard di configurazione dei flussi a step/fasi (blueprint step-by-step) che è ottimale solo per SOP e servizi ('ser').
   - Inserire una nuova sezione UI dedicata chiamata 'Distinta Base e Semilavorati' (BOM). Questa sezione deve contenere un interruttore per abilitare la gestione dei semilavorati e mostrare una tabella dinamica per aggiungere, rimuovere e modificare i semilavorati associati.
   - Ogni riga della tabella deve prevedere la selezione del semilavorato (tramite autocompletamento o menu a tendina filtrato), l'inserimento della quantità richiesta e della relativa unità di misura.

2. telegram_control/edit-semilavorati.html:
   - Progettare e strutturare questo pannello come una vista dedicata per la creazione e la catalogazione autonoma di semilavorati e materie prime.
   - Configurare i campi di input principali: Nome del semilavorato, SKU univoco, categoria specifica, costo unitario di produzione/acquisto, e un selettore per collegare una specifica SOP (Standard Operating Procedure) di assemblaggio.
   - Prevedere un pulsante diretto per accedere alla configurazione dei passaggi di produzione (SOP) di questo semilavorato, che reindirizza a edit-blueprint.html passando il parametro di categoria specifico.

3. telegram_control/edit-advanced.html e telegram_control/edit-advanced.js:
   - Nel file JavaScript (edit-advanced.js), implementare la logica di switch del modulo: all'evento di caricamento pagina, verificare il valore di 'item_type'. Se impostato su 'pro', rimuovere il rendering dei componenti di creazione step/stage standard di n8n/blueprint.
   - Implementare le funzioni AJAX/Fetch in edit-advanced.js per caricare l'elenco dei soli elementi catalogati come semilavorati e per salvare l'array degli elementi selezionati all'interno della struttura dati del prodotto finale.
   - Gestire la visualizzazione e il ricalcolo in tempo reale del costo totale della distinta base sommando i costi dei semilavorati aggiunti.

4. telegram_control/edit-blueprint.html:
   - Adattare l'interfaccia di configurazione del blueprint per supportare la tipologia specifica 'SOP_SEMILAVORATO'. Quando questo parametro è attivo, l'interfaccia mostrerà opzioni semplificate orientate alla produzione fisica e ai tempi di lavorazione per unità, categorizzando il blueprint in una sezione SOP separata.

## ⚙️ 2. GUIDA PASSO-PASSO BACKEND (n8n)
Guida passo-passo per l'adeguamento dei workflow n8n:

1. SiteBoS-App-Hook/catalog/editProduct.json:
   - All'interno del workflow n8n per la lettura del prodotto, inserire un nodo 'Switch' condizionale subito dopo il recupero del documento principale da MongoDB. Se l'entità è un Prodotto ('identity.item_type' pari a 'pro'), il workflow deve effettuare un ulteriore 'MongoDB Find' sulla collezione 'service_catalog' per recuperare i dettagli completi (nome, SKU, costo) di tutti i semilavorati referenziati nell'array 'relations.related_items'.
   - Unire i dati recuperati tramite un nodo 'Merge' e restituire al frontend un payload arricchito con la distinta base completa, permettendo al pannello di edit di mostrare immediatamente i dati corretti dei semilavorati.

2. SiteBoS-App-Hook/catalog/saveProduct_processor.json:
   - Modificare il processore di salvataggio inserendo un nodo 'IF' che valuta il tipo di entità ricevuta dal frontend.
   - Se l'entità è un Prodotto ('pro'), bypassare completamente i nodi di validazione e salvataggio delle sequenze di stage/step nel blueprint.
   - Configurare un nodo 'Set' o 'Function' per mappare l'elenco dei semilavorati inviati dal frontend all'interno del campo 'relations.related_items' del documento 'service_catalog', impostando per ciascuno l'oggetto contenente 'item_sku', 'quantity', 'unit_of_measure' e la proprietà discriminante 'relation_type' valorizzata a 'semilavorato'.
   - Eseguire l'operazione di update/insert su MongoDB per aggiornare la persistenza del prodotto.

3. SiteBoS-App-Hook/catalog/Advanced_processor2.0.json:
   - Configurare un percorso alternativo all'interno del processore avanzato per gestire la distinta base dei prodotti.
   - Inserire un nodo 'Function' che calcoli dinamicamente il costo totale di produzione ('pricing.cost_of_goods') del prodotto finito. Questo nodo deve sommare il costo unitario dei semilavorati associati moltiplicato per la rispettiva quantità specificata nella distinta base.
   - Aggiornare il campo 'pricing.cost_of_goods' nel documento del prodotto principale della collezione 'service_catalog'.

4. SiteBoS-App-Hook/catalog/editBlueprint.json:
   - Aggiornare la logica di salvataggio del blueprint in modo che, quando viene associato o modificato un blueprint per un semilavorato, il valore di 'blueprint_type' venga forzatamente registrato come 'SOP_SEMILAVORATO' e salvato nella collezione 'process_blueprints'.
   - Assicurare che il workflow configuri correttamente il campo 'service_sku' legandolo allo SKU del semilavorato corrispondente.

## 💾 3. STRUTTURA DATABASE (MongoDB)
Dettaglio delle modifiche e delle strutture dati per la persistenza:

1. Collezione 'service_catalog' (Database: MemoryManager):
   - Standardizzare l'uso del campo 'identity.item_type' introducendo e gestendo esplicitamente i valori:
     * 'pro' (Prodotto finito)
     * 'semilavorato' (Semilavorato / Materia prima)
   - Utilizzare l'array 'relations.related_items' all'interno dei documenti con item_type 'pro' per memorizzare la distinta base (BOM) con la seguente struttura:
     {
       "relations": {
         "related_items": [
           {
             "item_sku": "SKU-SEM-001",
             "quantity": 2.5,
             "unit_of_measure": "kg",
             "relation_type": "semilavorato"
           }
         ]
       }
     }
   - Nei prodotti 'pro', mantenere il campo 'operations.process_blueprint_id' a null o utilizzarlo esclusivamente per puntare a un eventuale blueprint generale di assemblaggio finale, differenziando i singoli semilavorati che avranno i propri blueprint indipendenti.

2. Collezione 'process_blueprints' (Database: MemoryManager):
   - Abilitare e gestire il valore 'SOP_SEMILAVORATO' per il campo 'blueprint_type'.
   - Ciascun documento con blueprint_type pari a 'SOP_SEMILAVORATO' deve puntare allo SKU del semilavorato tramite 'service_sku', consentendo un'associazione univoca e pulita tra il semilavorato e il suo processo di produzione a step.
