# 📐 ORDINE DI SERVIZIO: GUARDA-COME-STAMPIAMO-IL-DVR

## 📝 CONTESTO OPERATIVO
L'obiettivo è estendere l'elegante logica di impaginazione ed esportazione in PDF (già consolidata nel modulo Salute e Sicurezza per il Documento di Valutazione dei Rischi - DVR) anche al Catalogo Prodotti e Servizi. In questo modo l'utente può ottenere una scheda PDF completa, tecnica e commerciale, di qualsiasi articolo del catalogo comprensiva delle fasi del processo di evasione ad esso collegate.

## 🔗 MAPPATURA CONNESSIONI
Il flusso parte dall'interfaccia utente in 'catalog.html' (Frontend), la quale, al clic sul nuovo pulsante di stampa, invia una richiesta d'azione al webhook gestito da 'service_catalog.json' (Backend). Quest'ultimo aggrega i dati del catalogo con l'anagrafica aziendale contenuta in 'owner_sessions' e la sequenza operativa estratta da 'process_blueprints', generando il PDF e decidendo se spedirlo direttamente tramite API Telegram o renderlo disponibile al download immediato basandosi sui metadati del dispositivo trasmessi dal client.

## 📐 DECISIONI ARCHITETTURALI
Si è scelta un'architettura di rendering PDF centralizzata sul backend (server-side) per garantire omogeneità estetica e per non sovraccaricare il dispositivo dell'utente con elaborazioni pesanti. Inoltre, l'approccio adattivo basato sul tipo di dispositivo ottimizza l'esperienza utente (User Experience): sui dispositivi mobili e all'interno di Telegram, ricevere il PDF direttamente nella chat del bot evita i limiti di download tipici delle WebApp in-app; al contempo, su desktop e browser web ordinari, il download immediato risponde ai flussi d'uso tradizionali dell'ufficio.

---

## 📐 1. SPECIFICHE FRONTEND
Modificare il file 'telegram_control/catalog.html' per inserire un piccolo pulsante di esportazione/stampa in formato PDF. Il pulsante va inserito nell'angolo in alto a destra della bottoniera (o header) di ciascuna scheda prodotto/servizio del catalogo, utilizzando un'icona stampante o documento PDF (es. con classi CSS che riducano le dimensioni, come btn-sm, per renderlo discreto). Implementare una funzione JavaScript dedicata (ad esempio, printCatalogItem(itemId)) che acquisisce l'ID dell'item e raccoglie le informazioni sul dispositivo dell'utente (ad esempio, verificando se l'utente sta navigando all'interno della Telegram WebApp o tramite browser standard mediante userAgent). Questa funzione deve effettuare una richiesta POST asincrona ('action': 'print_item') al webhook di backend, passando l'ID dell'item del catalogo, i dati della sessione (token d'accesso, user_id/chat_id) e le informazioni sul dispositivo. Gestire la risposta del backend in modo asincrono: se il backend restituisce un URL o un file binario, avviare il download automatico o aprire una nuova scheda (window.open); se invece il backend notifica l'invio diretto su Telegram, mostrare una notifica toast o un popup di cortesia che conferma l'avvenuto invio del PDF sulla chat del bot.

## ⚙️ 2. GUIDA PASSO-PASSO BACKEND (n8n)
Modificare il workflow n8n 'SiteBoS-App-Hook/catalog/service_catalog.json' per gestire la nuova azione 'print_item'. Configurare un nodo di routing (Switch) per intercettare questo valore dal payload della richiesta. Il flusso deve eseguire le seguenti operazioni:
1. Eseguire una query MongoDB sulla collezione 'service_catalog' filtrando per l'ID del prodotto/servizio ricevuto, per estrarre tutti i dettagli del catalogo (nome, SKU, descrizioni, categoria, prezzi).
2. Eseguire una query MongoDB sulla collezione 'owner_sessions' (tramite l'ID utente o token di sessione) per estrarre le informazioni anagrafiche dell'azienda (ragione sociale, p.iva, indirizzo, contatti) da utilizzare nell'intestazione del PDF.
3. Verificare se nel documento del catalogo è presente un 'process_blueprint_id' valorizzato (all'interno di 'operations'). In caso positivo, eseguire una query MongoDB sulla collezione 'process_blueprints' per recuperare le fasi di lavorazione ('stages') e i passaggi ('steps') per arricchire il documento con il processo operativo.
4. Configurare un nodo di rendering HTML (Template) che assembli i dati dell'azienda, le informazioni dell'item e il blueprint di processo in un layout grafico professionale, pulito e impaginato, ereditando lo stile visivo e la struttura di impaginazione usata nel motore di stampa DVR.
5. Convertire l'HTML risultante in file PDF binario tramite un nodo convertitore (HTML-to-PDF).
6. Implementare un nodo di switch condizionale basato sulle informazioni del dispositivo ricevute dal frontend:
   - Se l'utente naviga da Telegram (o se è presente un chat_id valido): richiamare l'API di Telegram (metodo sendDocument) per spedire il file PDF generato direttamente alla chat dell'utente.
   - Se l'utente naviga da browser esterno: restituire il file binario o un URL temporaneo di download nella risposta HTTP al frontend.

## 💾 3. STRUTTURA DATABASE (MongoDB)
La modifica non richiede variazioni strutturali o nuovi campi nelle collezioni, ma si basa sull'interrogazione mirata e sulla correlazione di tre collezioni esistenti nel database 'MemoryManager':
- 'service_catalog': Lettura dei campi 'identity.item_name', 'identity.item_sku', 'identity.description.short', 'identity.description.long', 'pricing.base_price', 'pricing.currency', e del riferimento 'operations.process_blueprint_id'.
- 'owner_sessions': Lettura dei dati anagrafici per l'intestazione aziendale del PDF, inclusi 'ragione_sociale', 'vat_number', 'indirizzo', 'email', 'phone' e la corrispondenza con 'chat_id' per l'instradamento del messaggio.
- 'process_blueprints': Se l'item è legato a un blueprint, si esegue una query di ricerca per '_id' leggendo 'blueprint_name', 'summary.estimated_total_time_minutes', e l'array 'stages' con i relativi 'steps' (istruzioni e tempi stimati) per generare la sezione operativa della scheda tecnica.
