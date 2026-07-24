/**
 * Dynamic Owner Pages Registry — SiteBoS MiniApp
 * Mappatura 100% DINAMICA ad auto-scansione dell'albero moduli dell'Owner per l'Agente Conversazionale Vocale.
 * Traversa automaticamente l'albero mainModules ed identitySubMenu.
 * Esclude tassativamente: customer_bot/, operators/, softskill/
 */

(function(window) {
    'use strict';

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

            pages.push({
                category: category,
                name: item.label || item.name || item.id,
                desc: item.desc || "",
                url: item.url,
                mod_id: item.id || item.mod_id || "",
                keywords: extractKeywords(item.label || item.name, item.desc)
            });
        }

        function extractKeywords(label = "", desc = "") {
            const text = ((label || "") + " " + (desc || "")).toLowerCase();
            return text.split(/\s+/).filter(w => w.length > 3);
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
            { category: "gestione", name: "Catalogo Master Prodotti & Servizi", url: "gestione/catalog.html", mod_id: "catalog" },
            { category: "gestione", name: "Inserimento Nuovo Prodotto", url: "gestione/add-product.html" },
            { category: "gestione", name: "Inserimento Nuova Categoria", url: "gestione/add-category.html" },
            { category: "gestione", name: "Blueprint Editor (Procedure SOP)", url: "gestione/edit-blueprint.html" },
            { category: "gestione", name: "Product Blueprint Designer", url: "gestione/edit-blueprint-product.html" },
            { category: "gestione", name: "Knowledge Editor (AI Base Conoscenza)", url: "gestione/edit-knowledge.html" },
            { category: "gestione", name: "Semilavorati Architect", url: "gestione/edit-semilavorati.html" },
            { category: "gestione", name: "Sourcing & Operations Controller", url: "gestione/edit-advanced.html" },
            { category: "gestione", name: "Product Operations & BOM Controller", url: "gestione/edit-advanced-product.html" },
            { category: "gestione", name: "Content & Blog Architect", url: "gestione/edit-blog.html" },
            { category: "gestione", name: "Social Hub Publisher", url: "gestione/edit-post.html" },
            { category: "gestione", name: "Supervisor Hub", url: "gestione/supervisor_hub.html" },
            { category: "identity", name: "Configurazione Bot Telegram Personalizzato", url: "identity/bot_config.html", mod_id: "bot_config" },
            { category: "identity", name: "Profile Manager & Dati Titolare", url: "identity/edit_owner.html", mod_id: "edit_owner" },
            { category: "identity", name: "Setup Avanzato Aziendale", url: "identity/advanced-setup.html", mod_id: "advanced_setup" },
            { category: "operativita", name: "Orders Manager (Ordini E-commerce Live)", url: "operativita/orders-manager.html", mod_id: "orders" },
            { category: "operativita", name: "Nuovo Job / Commessa Lavorativa", url: "operativita/job-create.html", mod_id: "jobs" },
            { category: "operativita", name: "Percorsi Logistici & Delivery AI", url: "operativita/pianificazione_itinerari.html", mod_id: "solver" },
            { category: "agents", name: "Intelligence Generale & Reportistica", url: "agents/agent_intelligence.html", mod_id: "intel_gen" },
            { category: "agents", name: "Agenda Aziendale & Calendario", url: "agents/agenda.html", mod_id: "intel_agenda" },
            { category: "agents", name: "Controllo Gestione CFO & Margini", url: "agents/controllo_gestione.html", mod_id: "intel_mgmt" },
            { category: "agents", name: "Analisi Concorrenza & Competitor", url: "agents/analisi-mercato.html", mod_id: "intel_market" },
            { category: "agents", name: "Assistente Sicurezza & DVR", url: "agents/assistente-sicurezza.html", mod_id: "intel_safety" },
            { category: "agents", name: "Magazzino AI & Scorte", url: "agents/intelligent-warehouse.html", mod_id: "intel_warehouse" },
            { category: "agents", name: "Gestione Risorse Umane & Staff", url: "agents/risorse_umane.html" },
            { category: "fine-tuning", name: "Addestramento IA & Crew Builder", url: "fine-tuning/fine-tuning.html", mod_id: "fine_tuning" },
            { category: "supporto", name: "Support Hub & Ticket Tecnico", url: "supporto/support_hub.html", mod_id: "support_hub", keywords: ["supporto", "assistenza", "ticket", "help"] },
            { category: "supporto", name: "Bot Telegram di Supporto Diretto (@TrinAi_Site_bot)", url: "https://t.me/TrinAi_Site_bot", isExternal: true, keywords: ["bot supporto", "contatta owner", "assistenza telegram", "chat supporto"] },
            { category: "billing", name: "Shop Ricarica Crediti", url: "https://dashboard.trinai.it/shop/bundles", type: "shop" }
        ];

        EXTENDED_OWNER_PAGES.forEach(ext => addPage(ext, ext.category));

        return pages;
    }

    window.getOwnerPagesRegistry = getOwnerPagesRegistry;

})(window);
