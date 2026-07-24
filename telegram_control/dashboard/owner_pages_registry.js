/**
 * Dynamic Owner Pages Registry — SiteBoS MiniApp
 * Mappatura 100% DINAMICA ad auto-scansione dell'albero moduli dell'Owner per l'Agente Conversazionale Vocale.
 * Traversa automaticamente l'albero mainModules ed identitySubMenu.
 * Esclude tassativamente: customer_bot/, operators/, softskill/
 */

(function(window) {
    'use strict';

    const STOP_WORDS = new Set([
        "della", "dello", "degli", "delle", "dall", "dallo", "dalla", "dagli", "dalle", 
        "nella", "nello", "negli", "nelle", "sulla", "sullo", "sugli", "sulle", "tutti", 
        "tutte", "anche", "come", "dove", "quando", "perche", "questo", "questa", "quelli"
    ]);

    function getOwnerPagesRegistry() {
        const pages = [];
        const addedUrls = new Set();

        function addPage(item, category = "generale") {
            if (!item || !item.url || item.url === "#") return;
            
            // Filtro di sicurezza tassativo: esclude customer_bot, operators, softskill
            const lowerUrl = item.url.toLowerCase();
            if (lowerUrl.includes("customer_bot") || lowerUrl.includes("operators") || lowerUrl.includes("softskill")) {
                return;
            }
            if (addedUrls.has(item.url)) return;
            addedUrls.add(item.url);

            const explicitKw = Array.isArray(item.keywords) ? item.keywords : [];
            const autoKw = extractKeywords(item.label || item.name, item.desc);
            const combinedKw = Array.from(new Set([...explicitKw, ...autoKw]));

            pages.push({
                category: category,
                name: item.label || item.name || item.id,
                desc: item.desc || "",
                url: item.url,
                mod_id: item.id || item.mod_id || "",
                keywords: combinedKw
            });
        }

        function extractKeywords(label = "", desc = "") {
            const rawText = ((label || "") + " " + (desc || "")).toLowerCase();
            // Pulisce la punteggiatura ed i caratteri speciali rimpiazzandoli con uno spazio
            const cleanText = rawText.replace(/[^a-z0-9àèéìòù\s-]/gi, ' ');
            return cleanText.split(/\s+/)
                .map(w => w.trim())
                .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
        }

        // 1. Auto-scansione dinamica dal modulo identitySubMenu
        if (window.identitySubMenu && Array.isArray(window.identitySubMenu)) {
            window.identitySubMenu.forEach(sub => addPage(sub, "identity"));
        }

        // 2. Auto-scansione dinamica dal modulo principale mainModules (e relativi sottomenu)
        if (window.mainModules && Array.isArray(window.mainModules)) {
            window.mainModules.forEach(mod => {
                addPage(mod, mod.id || "modulo");
                if (mod.sub && Array.isArray(mod.sub)) {
                    mod.sub.forEach(sub => addPage(sub, mod.id || "modulo"));
                }
            });
        }

        // 3. Pagine Owner aggiuntive/estese a supporto (Fallback di sicurezza)
        const EXTENDED_OWNER_PAGES = [
            { category: "gestione", name: "Catalogo Master Prodotti & Servizi", url: "gestione/catalog.html", mod_id: "catalog", keywords: ["catalogo", "prodotti", "servizi", "sop", "procedure", "listino"] },
            { category: "gestione", name: "Inserimento Nuovo Prodotto", url: "gestione/add-product.html", keywords: ["nuovo prodotto", "aggiungi prodotto", "crea articolo"] },
            { category: "gestione", name: "Inserimento Nuova Categoria", url: "gestione/add-category.html", keywords: ["nuova categoria", "aggiungi categoria"] },
            { category: "gestione", name: "Blueprint Editor (Procedure SOP)", url: "gestione/edit-blueprint.html", keywords: ["blueprint", "sop", "procedure", "editor"] },
            { category: "gestione", name: "Product Blueprint Designer", url: "gestione/edit-blueprint-product.html", keywords: ["blueprint prodotto", "designer"] },
            { category: "gestione", name: "Knowledge Editor (AI Base Conoscenza)", url: "gestione/edit-knowledge.html", keywords: ["knowledge", "base conoscenza", "ai knowledge", "istruzioni ai"] },
            { category: "gestione", name: "Semilavorati Architect", url: "gestione/edit-semilavorati.html", keywords: ["semilavorati", "distinta base", "bom"] },
            { category: "gestione", name: "Sourcing & Operations Controller", url: "gestione/edit-advanced.html", keywords: ["sourcing", "operations", "costi"] },
            { category: "gestione", name: "Product Operations & BOM Controller", url: "gestione/edit-advanced-product.html", keywords: ["bom controller", "ricette costo"] },
            { category: "gestione", name: "Content & Blog Architect", url: "gestione/edit-blog.html", keywords: ["blog", "articoli", "content"] },
            { category: "gestione", name: "Social Hub Publisher", url: "gestione/edit-post.html", keywords: ["post", "social", "pubblica"] },
            { category: "gestione", name: "Supervisor Hub", url: "gestione/supervisor_hub.html", keywords: ["supervisor", "hub", "supervisione"] },
            { category: "identity", name: "Configurazione Bot Telegram Personalizzato", url: "identity/bot_config.html", mod_id: "bot_config", keywords: ["bot", "setup bot", "configura bot", "telegram bot", "titolare"] },
            { category: "identity", name: "Profile Manager & Dati Titolare", url: "identity/edit_owner.html", mod_id: "edit_owner", keywords: ["dati titolare", "profilo owner", "ragione sociale", "partita iva"] },
            { category: "identity", name: "Setup Avanzato Aziendale", url: "identity/advanced-setup.html", mod_id: "advanced_setup", keywords: ["setup avanzato", "fiscale", "impostazioni"] },
            { category: "operativita", name: "Orders Manager (Ordini E-commerce Live)", url: "operativita/orders-manager.html", mod_id: "orders", keywords: ["ordini", "orders", "ecommerce", "consegne", "spedizioni"] },
            { category: "operativita", name: "Nuovo Job / Commessa Lavorativa", url: "operativita/job-create.html", mod_id: "jobs", keywords: ["job", "commessa", "piano lavori", "nuovo lavoro"] },
            { category: "operativita", name: "Percorsi Logistici & Delivery AI", url: "operativita/pianificazione_itinerari.html", mod_id: "solver", keywords: ["logistica", "percorsi", "itinerari", "delivery"] },
            { category: "agents", name: "Intelligence Generale & Reportistica", url: "agents/agent_intelligence.html", mod_id: "intel_gen", keywords: ["intelligence", "report", "kpi", "statistiche"] },
            { category: "agents", name: "Agenda Aziendale & Calendario", url: "agents/agenda.html", mod_id: "intel_agenda", keywords: ["agenda", "calendario", "appuntamenti", "orari", "prenotazioni"] },
            { category: "agents", name: "Controllo Gestione CFO & Margini", url: "agents/controllo_gestione.html", mod_id: "intel_mgmt", keywords: ["cfo", "controllo gestione", "margini", "bilancio", "fatturato"] },
            { category: "agents", name: "Analisi Concorrenza & Competitor", url: "agents/analisi-mercato.html", mod_id: "intel_market", keywords: ["concorrenza", "competitor", "mercato", "prezzi"] },
            { category: "agents", name: "Assistente Sicurezza & DVR", url: "agents/assistente-sicurezza.html", mod_id: "intel_safety", keywords: ["sicurezza", "dvr", "conformita", "normativa"] },
            { category: "agents", name: "Magazzino AI & Scorte", url: "agents/intelligent-warehouse.html", mod_id: "intel_warehouse", keywords: ["magazzino", "scorte", "inventario", "giacenze"] },
            { category: "agents", name: "Gestione Risorse Umane & Staff", url: "agents/risorse_umane.html", keywords: ["risorse umane", "staff", "dipendenti", "personale"] },
            { category: "fine-tuning", name: "Addestramento IA & Crew Builder", url: "fine-tuning/fine-tuning.html", mod_id: "fine_tuning", keywords: ["addestramento", "fine-tuning", "crew builder", "prompting"] },
            { category: "supporto", name: "Support Hub & Ticket Tecnico", url: "supporto/support_hub.html", mod_id: "support_hub", keywords: ["supporto", "assistenza", "ticket", "help"] },
            { category: "supporto", name: "Bot Telegram di Supporto Diretto (@TrinAi_Site_bot)", url: "https://t.me/TrinAi_Site_bot", isExternal: true, keywords: ["bot supporto", "contatta owner", "assistenza telegram", "chat supporto"] },
            { category: "billing", name: "Shop Ricarica Crediti", url: "https://dashboard.trinai.it/shop/bundles", type: "shop", keywords: ["crediti", "ricarica", "saldo", "billing", "shop"] }
        ];

        EXTENDED_OWNER_PAGES.forEach(ext => addPage(ext, ext.category));

        return pages;
    }

    window.getOwnerPagesRegistry = getOwnerPagesRegistry;

})(window);
