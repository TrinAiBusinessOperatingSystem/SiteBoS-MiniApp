/**
 * Dynamic Owner Pages Registry — SiteBoS MiniApp
 * FOCUS ESCLUSIVO: SERVIZIO & PRODOTTO (Triple, Doppie e Keyword Ancorate)
 * OTTIMIZZATO PER: Sam VenomHearth Engine
 */

(function (window) {
    'use strict';

    function getOwnerPagesRegistry() {
        const pages = [];
        const addedUrls = new Set();

        function addPage(item, category = "generale") {
            if (!item || !item.url || item.url === "#") return;
            
            const lowerUrl = item.url.toLowerCase();
            if (lowerUrl.includes("customer_bot") || lowerUrl.includes("operators") || lowerUrl.includes("softskill")) {
                return;
            }
            if (addedUrls.has(item.url)) return;
            addedUrls.add(item.url);

            pages.push({
                category: category,
                name: item.label || item.name || item.id,
                desc: item.desc || "",
                url: item.url,
                mod_id: item.id || item.mod_id || "",
                user_utterances: item.user_utterances || [item.label || item.name]
            });
        }

        const EXTENDED_OWNER_PAGES = [

            // =========================================================================
            // 1. GESTIONE CATALOGO, PRODOTTI & SERVIZI
            // =========================================================================
            { 
                category: "gestione", 
                name: "Catalogo Master Prodotti & Servizi", 
                url: "gestione/catalog.html", 
                mod_id: "catalog", 
                user_utterances: [
                    "apri il catalogo prodotti e servizi",
                    "fammi vedere il listino dei servizi e prodotti",
                    "voglio consultare la gestione prodotti e servizi",
                    "catalogo prodotti servizi",
                    "listino dei servizi",
                    "listino dei prodotti",
                    "catalogo del servizio",
                    "catalogo dei prodotti",
                    "gestione prodotti servizi",
                    "catalogo prodotti",
                    "catalogo servizi",
                    "listino prodotti",
                    "listino servizi",
                    "gestione prodotti",
                    "gestione servizi",
                    "prezzi servizi",
                    "prezzi prodotti",
                    "prodotto", "prodotti", "servizio", "servizi", "catalogo", "listino"
                ] 
            },
            { 
                category: "gestione", 
                name: "Macro Prodotti & Asset Digitali", 
                url: "gestione/catalog.html?macro=PRO", 
                mod_id: "catalog_pro", 
                user_utterances: [
                    "apri macro prodotti", "catalogo soli prodotti", "scheda prodotti digitali", "prodotti in vendita", "listino prodotti fisici", "sezione prodotti", "prodotti"
                ] 
            },
            { 
                category: "gestione", 
                name: "Macro Servizi & Prestazioni", 
                url: "gestione/catalog.html?macro=SER", 
                mod_id: "catalog_ser", 
                user_utterances: [
                    "apri macro servizi", "catalogo soli servizi", "scheda prestazioni e trattamenti", "listino servizi offerti", "sezione servizi", "servizi"
                ] 
            },
            { 
                category: "gestione", 
                name: "Macro Procedure SOP & Blueprint", 
                url: "gestione/catalog.html?macro=SOP", 
                mod_id: "catalog_sop", 
                user_utterances: [
                    "apri macro sop", "procedure operativi standard", "schede blueprint sop", "istruzioni operative", "sezione sop", "sop"
                ] 
            },
            { 
                category: "gestione", 
                name: "Inserimento Nuovo Prodotto / Servizio", 
                url: "gestione/add-product.html", 
                user_utterances: [
                    // Frasi Complete
                    "voglio inserire un nuovo servizio",
                    "voglio inserire un nuovo prodotto",
                    "aggiungi un nuovo servizio al listino",
                    "aggiungi un nuovo prodotto al listino",
                    "crea un nuovo servizio o prestazione",
                    // Triple di Peso (Trigrammi)
                    "inserire nuovo prodotto",
                    "inserire nuovo servizio",
                    "crea nuovo servizio",
                    "crea nuovo prodotto",
                    "aggiungi nuovo servizio",
                    "aggiungi nuovo prodotto",
                    "nuova prestazione servizio",
                    "nuovo trattamento servizio",
                    "nuovo prodotto categoria",
                    "prodotto guida pdf",
                    // Doppie di Peso (Bigrammi)
                    "nuovo prodotto",
                    "nuovo servizio",
                    "crea servizio",
                    "crea prodotto",
                    "aggiungi servizio",
                    "aggiungi prodotto",
                    "nuova prestazione",
                    "nuovo trattamento",
                    "nuovo articolo",
                    "carica servizio",
                    "carica prodotto",
                    "guide pdf",
                    // Keyword Ancora
                    "prodotto",
                    "servizio",
                    "prestazione",
                    "trattamento",
                    "articolo"

                ] 
            },
            { 
                category: "gestione", 
                name: "Inserimento Nuova Categoria", 
                url: "gestione/add-category.html", 
                user_utterances: [
                    // Triple di Peso (Trigrammi)
                    "nuova categoria prodotti",
                    "nuova categoria servizi",
                    "creare nuova categoria",
                    "categoria del prodotto",
                    "categoria del servizio",
                    // Doppie di Peso (Bigrammi)
                    "nuova categoria",
                    "categoria prodotti",
                    "categoria servizi",
                    "crea categoria",
                    "aggiungi categoria",
                    "gruppo prodotti",
                    "gruppo servizi",
                    // Keyword Ancora
                    "categoria",
                    "categorie",
                    "gruppo"

                ] 
            },
            { 
                category: "gestione", 
                name: "Product Blueprint Designer (Fasi del Servizio / Prodotto)", 
                url: "gestione/edit-blueprint-product.html", 
                user_utterances: [
                    // Triple di Peso (Trigrammi)
                    "fasi del servizio",
                    "processo del servizio",
                    "fasi del prodotto",
                    "gestione del servizio",
                    "istruzioni del servizio",
                    // Doppie di Peso (Bigrammi)
                    "fasi servizio",
                    "processo servizio",
                    "fasi prodotto",
                    "blueprint servizio",
                    "blueprint prodotto",
                    "procedura servizio",
                    // Keyword Ancora
                    "servizio",
                    "prodotto",
                    "blueprint",
                    "fasi",
                    "processo"

                ] 
            },
            { 
                category: "gestione", 
                name: "Product Operations & Costi (Ricetta Servizio / Prodotto)", 
                url: "gestione/edit-advanced-product.html", 
                user_utterances: [
                    // Triple di Peso (Trigrammi)
                    "costi del servizio",
                    "costi del prodotto",
                    "ricetta del servizio",
                    "ricetta del prodotto",
                    "margine del servizio",
                    "margine del prodotto",
                    "costo erogazione servizio",
                    "distinta base servizio",
                    // Doppie di Peso (Bigrammi)
                    "costo servizio",
                    "costo prodotto",
                    "ricetta servizio",
                    "ricetta prodotto",
                    "margine servizio",
                    "margine prodotto",
                    "distinta base",
                    "costi produzione",
                    "materie prime",
                    // Keyword Ancora
                    "costi",
                    "ricetta",
                    "margini",
                    "prezzi",
                    "bom"

                ] 
            },
            { 
                category: "gestione", 
                name: "Knowledge Editor (AI Base Conoscenza Servizio)", 
                url: "gestione/edit-knowledge.html", 
                user_utterances: [
                    "base conoscenza servizio", "base conoscenza prodotto", "addestra ai sul servizio", "faq del servizio", "faq del prodotto", "addestra bot servizio", "istruzioni ai servizio", "knowledge servizio", "faq servizio"
                ] 
            },
            { 
                category: "gestione", 
                name: "Content & Blog Architect", 
                url: "gestione/edit-blog.html", 
                user_utterances: [
                    "articolo blog servizio", "articolo blog prodotto", "blog del servizio", "post del servizio", "blog servizio", "blog prodotto", "articolo"
                ] 
            },
            { 
                category: "gestione", 
                name: "Social Hub Publisher", 
                url: "gestione/edit-post.html", 
                user_utterances: [
                    "post social servizio", "post social prodotto", "pubblica post servizio", "marketing del servizio", "post servizio", "post prodotto", "social"
                ] 
            },

            // =========================================================================
            // 2. CONFIGURAZIONE IDENTITY & SETUP BOT TELEGRAM
            // =========================================================================

            { 
                category: "identity", 
                name: "Configurazione Bot Telegram", 
                url: "identity/bot_config.html", 
                mod_id: "bot_config", 
                user_utterances: [
                    "configura bot telegram", "impostazioni assistente bot", "risposte del bot", "bot telegram", "configura bot", "impostazioni bot", "bot clienti", "bot", "telegram"
                ] 
            },
            { 
                category: "identity", 
                name: "Dati Titolare & Profilo Aziendale", 
                url: "identity/edit_owner.html", 
                mod_id: "edit_owner", 
                user_utterances: [
                    "dati del titolare", "ragione sociale partita iva", "dati legali studio", "dati titolare", "ragione sociale", "partita iva", "titolare", "azienda", "iva"
                ] 
            },
            { 
                category: "identity", 
                name: "Parametri Avanzati & Setup Clinica", 
                url: "identity/advanced-setup.html", 
                mod_id: "advanced_setup", 
                user_utterances: [
                    "parametri avanzati studio", "setup della clinica", "unita operative reuniti", "parametri avanzati", "setup clinica", "reuniti", "poltrone", "cabine"
                ] 
            },

            // =========================================================================
            // 3. OPERATIVITÀ, ORDINI, PIANO LAVORI & AGENDA
            // =========================================================================

            { 
                category: "operativita", 
                name: "Lavagna Turni & Scaffale Jobs", 
                url: "operativita/lavagna.html", 
                mod_id: "lavagna_jobs", 
                user_utterances: [
                    "apri la lavagna dei turni", "gestione scaffale jobs", "lavagna dei lavori", "scaffale turni", "lavagna turni", "lavagna jobs", "lavagna", "scaffale"
                ] 
            },
            { 
                category: "operativita", 
                name: "Orders Manager (Ordini Live)", 
                url: "operativita/orders-manager.html", 
                mod_id: "orders", 
                user_utterances: [
                    "gestione ordini live", "ordini in arrivo", "stato ordini ecommerce", "ordini live", "ordini oggi", "spedizioni ordini", "ordini", "spedizioni"
                ] 
            },
            { 
                category: "operativita", 
                name: "Piano Lavori & Commesse", 
                url: "operativita/job-create.html", 
                mod_id: "jobs", 
                user_utterances: [
                    "commessa di lavoro", "piano lavori operativo", "piano lavori", "nuova commessa", "job operativo", "commessa", "job", "lavori"
                ] 
            },
            { 
                category: "agents", 
                name: "Agenda Aziendale & Calendario", 
                url: "agents/agenda.html", 
                mod_id: "intel_agenda", 
                user_utterances: [
                    "agenda degli appuntamenti", "calendario di oggi", "prenotazioni dei clienti", "agenda studio", "appuntamenti oggi", "agenda", "calendario", "appuntamenti"
                ] 
            },

            // =========================================================================
            // 4. INTELLIGENCE, CFO, SICUREZZA DVR & MAGAZZINO
            // =========================================================================

            { 
                category: "agents", 
                name: "Assistente Sicurezza & DVR", 
                url: "agents/assistente-sicurezza.html", 
                mod_id: "intel_safety", 
                user_utterances: [
                    "documento valutazione rischi", "assistente sicurezza dvr", "conformita sicurezza lavoro", "sicurezza dvr", "valutazione rischi", "sicurezza lavoro", "dvr", "sicurezza", "rischi"
                ] 
            },
            { 
                category: "agents", 
                name: "Controllo Gestione CFO & Margini", 
                url: "agents/controllo_gestione.html", 
                mod_id: "intel_mgmt", 
                user_utterances: [
                    "controllo di gestione", "flussi di cassa", "bilancio e margini", "fatturato dello studio", "controllo gestione", "cfo studio", "flussi cassa", "cfo", "bilancio", "fatturato"
                ] 
            },
            { 
                category: "agents", 
                name: "Magazzino AI & Giacenze", 
                url: "agents/intelligent-warehouse.html", 
                mod_id: "intel_warehouse", 
                user_utterances: [
                    "gestione magazzino scorte", "inventario delle giacenze", "materiali in esaurimento", "magazzino", "scorte", "giacenze"
                ] 
            },
            { 
                category: "agents", 
                name: "Agente Marketing & Campagne", 
                url: "agents/agent_marketing.html", 
                mod_id: "intel_marketing", 
                user_utterances: [
                    "apri agente marketing", "campagne pubblicitarie", "promozione prodotti servizi", "marketing studio", "agente marketing", "campagne marketing", "promozione", "marketing"
                ] 
            },

            // =========================================================================
            // 5. BILLING CREDITI
            // =========================================================================

            { 
                category: "billing", 
                name: "Shop Ricarica Crediti", 
                url: "https://dashboard.trinai.it/shop/bundles", 
                user_utterances: [
                    "ricarica conto crediti", "shop dei crediti", "compra altri crediti", "ricarica crediti", "shop crediti", "saldo crediti", "crediti", "ricarica"
                ] 
            }
        ];

        EXTENDED_OWNER_PAGES.forEach(ext => addPage(ext, ext.category));

        return pages;
    }

    window.getOwnerPagesRegistry = getOwnerPagesRegistry;

})(window);
