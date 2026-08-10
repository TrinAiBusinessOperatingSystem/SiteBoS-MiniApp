// Identity Hub logic module for SiteBoS Dashboard
(function(window) {
    'use strict';

    const tg = window.Telegram?.WebApp;

    // Define the sub-menu items for Identity Hub
    const identitySubMenu = [
        { 
            id: "bot_config", 
            label: "Configurazione Bot", 
            desc: "Gestisci i flussi di risposta, l'attivazione dell'IA e i parametri del bot Telegram.", 
            url: "identity/bot_config.html", 
            icon: "fa-robot" 
        },
        { 
            id: "edit_owner", 
            label: "Dati Titolare", 
            desc: "Visualizza e modifica i dati della tua azienda, IVA, e dettagli legali.", 
            url: "identity/edit_owner.html", 
            icon: "fa-user-tie" 
        },
        { 
            id: "cloud_identity", 
            label: "Identità Aziendale", 
            desc: "SiteBoS Cloud: Accedi al pannello profondo di configurazione MiniSite aziendale.", 
            url: "https://dashboard.trinai.it/sitebos", 
            icon: "fa-building",
            isExternal: true
        },
        { 
            id: "advanced_setup", 
            label: "Parametri Avanzati", 
            desc: "Ingegneria dei flussi e setup delle categorie avanzate per la clinica/studio.", 
            url: "identity/advanced-setup.html", 
            icon: "fa-sliders-h" 
        },
        { 
            id: "stations_scanner", 
            label: "Configurazione Postazioni", 
            desc: "Scansione live dell'attività per aggiungere automaticamente Asset e Postazioni.", 
            url: "identity/location-scanner.html", 
            icon: "fa-camera-retro" 
        },
        { 
            id: "agent_launch", 
            label: "Avvio Agenti IA", 
            desc: "Hub direzionale di avvio e gestione per gli agenti operativi (Sicurezza, CFO, HR, Magazzino).", 
            url: "agents/agent_intelligence.html", 
            icon: "fa-robot" 
        }
    ];

    // Handles specific actions of Identity Hub sub-menu items
    function handleIdentityAction(item, ash, msgId) {
        if (item.isExternal) {
            if (tg) {
                tg.showConfirm("Stai per uscire dalla MiniApp per andare alla Dashboard Cloud. Continuare?", (ok) => {
                    if (ok) {
                        tg.openLink(item.url);
                    }
                });
            } else {
                if (confirm("Stai per uscire dalla MiniApp per andare alla Dashboard Cloud. Continuare?")) {
                    window.open(item.url, '_blank');
                }
            }
            return true; // Handled
        }
        return false; // Not handled (perform default redirection)
    }

    // Export variables to window
    window.identitySubMenu = identitySubMenu;
    window.handleIdentityAction = handleIdentityAction;

})(window);
