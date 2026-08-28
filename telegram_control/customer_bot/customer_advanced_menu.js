/**
 * customer_advanced_menu.js
 * Menu Avanzato Cliente Condiviso — Assistente AI, Supporto, Storico.
 * Incluso da ecommerce.html e preventivi.html (i due veri punti d'ingresso):
 * niente hub/dashboard centrale, ma supporto/assistente/storico restano
 * sempre raggiungibili da un'icona nell'header, non nella prima schermata.
 */
(function (window) {
    'use strict';

    const WH_CUSTOMER_GATE = 'https://prod.workflow.trinai.it/webhook/8eb69e84-d20d-486e-a70e-9acf31c3da9e';
    // NOTA: 81ab5292-... e' l'assistente vocale/testuale INTERNO all'owner
    // (assistant.workflow.ts, naviga la SUA dashboard di gestione) - non e'
    // mai stato l'assistente del cliente. Il cliente usa customer_assistant.workflow.ts.
    const WH_CHAT = 'https://prod.workflow.trinai.it/webhook/f81388fc-a522-4410-9108-92c0a14261ca';

    const params = new URLSearchParams(window.location.search);
    const ash = params.get('ash') || '';
    const vat = params.get('vat') || '';

    const tg = window.Telegram && window.Telegram.WebApp;
    let historyLoaded = false;
    let pendingAttachment = null;
    const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024; // 4MB, limite ragionevole lato client
    const CONSENT_KEY = 'sitebos_customer_consent_v1';
    const CONSENT_VERSION = '1.0';

    function injectDrawer() {
        if (document.getElementById('customer-menu-overlay')) return;

        const drawerHtml = `
        <div id="customer-menu-overlay" class="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99998] hidden opacity-0 transition-opacity duration-300" onclick="window.CustomerAdvancedMenu.close()">
            <div id="customer-menu-drawer" class="fixed inset-0 max-w-md mx-auto h-screen bg-white shadow-2xl flex flex-col translate-y-full transition-transform duration-300 z-[99999]" onclick="event.stopPropagation()">
                <div class="w-full flex items-center justify-between p-4 border-b border-slate-100 shrink-0 select-none">
                    <span class="text-xs font-black uppercase tracking-widest text-slate-800">Menu</span>
                    <button onclick="window.CustomerAdvancedMenu.close()" class="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:scale-90 transition">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
                <div class="flex-1 w-full overflow-y-auto p-5 space-y-6">
                    <div class="space-y-3">
                        <h4 class="text-[8px] font-black tracking-widest text-slate-400 uppercase">Assistente AI</h4>
                        <div id="cam-chat-container" class="space-y-3 text-[11px] leading-relaxed max-h-64 overflow-y-auto">
                            <div class="text-slate-400">Scrivi una domanda, l'assistente ti risponde qui.</div>
                        </div>
                        <div id="cam-attach-preview" class="hidden items-center gap-1.5 text-[9px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5"></div>
                        <div class="flex items-center gap-2">
                            <input type="file" id="cam-attach-input" accept="image/*,application/pdf" class="hidden">
                            <button onclick="window.CustomerAdvancedMenu.pickAttachment()" class="w-9 h-9 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition" title="Allega immagine o PDF"><i class="fas fa-paperclip text-xs"></i></button>
                            <input type="text" id="cam-chat-input" placeholder="Scrivi una richiesta..." class="flex-1 bg-white border border-slate-200 text-slate-800 rounded-xl py-2.5 px-3 text-[11px] focus:outline-none focus:border-slate-400">
                            <button onclick="window.CustomerAdvancedMenu.sendChat()" class="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center shrink-0 active:scale-95 transition"><i class="fas fa-paper-plane text-xs"></i></button>
                        </div>
                    </div>
                    <div class="space-y-3 pt-4 border-t border-slate-100">
                        <h4 class="text-[8px] font-black tracking-widest text-slate-400 uppercase">Supporto</h4>
                        <button onclick="window.CustomerAdvancedMenu.openTicket()" class="w-full py-3 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-left text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span><i class="fas fa-headset mr-2 text-slate-400"></i> Apri una richiesta di assistenza</span>
                            <i class="fas fa-chevron-right text-[10px] text-slate-300"></i>
                        </button>
                    </div>
                    <div class="space-y-3 pt-4 border-t border-slate-100">
                        <h4 class="text-[8px] font-black tracking-widest text-slate-400 uppercase">Attività Recenti</h4>
                        <div id="cam-history-container" class="space-y-2 text-[9px] text-slate-400">
                            <div class="text-center py-4">Caricamento...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', drawerHtml);
    }

    function injectTriggerButton() {
        if (document.getElementById('btn-customer-menu')) return;
        const header = document.querySelector('header');
        const btnHtml = `
        <button id="btn-customer-menu" onclick="window.CustomerAdvancedMenu.open()" class="w-9 h-9 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm active:scale-90 transition shrink-0" title="Menu">
            <i class="fas fa-ellipsis-vertical text-xs"></i>
        </button>`;
        if (!header) {
            const floatingDiv = document.createElement('div');
            floatingDiv.className = 'fixed top-4 right-4 z-50';
            floatingDiv.innerHTML = btnHtml;
            document.body.appendChild(floatingDiv);
            return;
        }
        const buttonContainer = header.querySelector('.flex.gap-2') || header.querySelector('.flex.items-center.gap-2') || header.querySelector('.flex.gap-3');
        if (buttonContainer) {
            buttonContainer.insertAdjacentHTML('beforeend', btnHtml);
            return;
        }
        // Nessun gruppo pulsanti pronto nell'header (es. preventivi.html, che
        // ha solo icona+titolo e un pulsante di chiusura come 2 figli diretti
        // in justify-between): se aggiungo un 3° figlio grezzo il layout si
        // rompe (il pulsante di chiusura finirebbe al centro). Avvolgo quindi
        // l'ultimo figlio esistente insieme al nuovo pulsante in un piccolo
        // gruppo flex, senza mai creare un overlay separato in document.body.
        const children = Array.from(header.children);
        if (children.length >= 2) {
            const lastChild = children[children.length - 1];
            const wrapper = document.createElement('div');
            wrapper.className = 'flex items-center gap-2';
            lastChild.parentNode.insertBefore(wrapper, lastChild);
            wrapper.appendChild(lastChild);
            wrapper.insertAdjacentHTML('beforeend', btnHtml);
        } else {
            header.insertAdjacentHTML('beforeend', btnHtml);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text == null ? '' : String(text);
        return div.innerHTML;
    }

    function addChatMessage(sender, text) {
        const container = document.getElementById('cam-chat-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = 'space-y-0.5 border-l-2 border-slate-900 pl-2';
        el.innerHTML = `
            <div class="text-[8px] text-slate-400 uppercase font-black tracking-widest">${sender === 'user' ? 'Tu' : 'Assistente'}</div>
            <div class="text-slate-800 font-bold text-[11px] leading-relaxed">${escapeHtml(text)}</div>
        `;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }

    // --- Allegati (immagine/PDF): l'owner decide da bot_config.html se accettarli
    // (permissions.allow_images/allow_files) - il rifiuto vero e proprio arriva dal
    // backend, qui solo raccolta/conversione file -> base64.
    function pickAttachment() {
        const input = document.getElementById('cam-attach-input');
        if (!input) return;
        input.onchange = handleAttachmentSelected;
        input.click();
    }

    function handleAttachmentSelected(e) {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > MAX_ATTACHMENT_BYTES) {
            addChatMessage('ai', 'File troppo grande (massimo 4MB).');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            const base64 = result.split(',')[1] || '';
            if (!base64) return;
            pendingAttachment = { mimeType: file.type || 'application/octet-stream', data: base64 };
            showAttachmentPreview(file.name);
        };
        reader.readAsDataURL(file);
    }

    function showAttachmentPreview(name) {
        const el = document.getElementById('cam-attach-preview');
        if (!el) return;
        el.classList.remove('hidden');
        el.classList.add('flex');
        el.innerHTML = `<i class="fas fa-paperclip"></i><span class="flex-1 truncate">${escapeHtml(name)}</span><button onclick="window.CustomerAdvancedMenu.clearAttachment()" class="text-slate-400"><i class="fas fa-times"></i></button>`;
    }

    function clearAttachment() {
        pendingAttachment = null;
        const el = document.getElementById('cam-attach-preview');
        if (el) { el.classList.add('hidden'); el.classList.remove('flex'); el.innerHTML = ''; }
    }

    // --- Primo accesso: disclaimer privacy/uso AI, consenso valido 1 anno.
    // Il log "vero" resta lato cliente (localStorage): il POST verso il backend
    // e' solo un'annotazione best-effort su active_session per l'owner/audit,
    // non blocca mai la UX se fallisce.
    function hasValidConsent() {
        try {
            const raw = localStorage.getItem(CONSENT_KEY);
            if (!raw) return false;
            const data = JSON.parse(raw);
            return !!(data && data.accepted && data.expires && new Date(data.expires).getTime() > Date.now());
        } catch (err) {
            return false;
        }
    }

    function acceptConsent() {
        const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, acceptedAt: new Date().toISOString(), expires }));
        } catch (err) { /* storage non disponibile: si ripropone al prossimo giro, non blocca l'uso */ }
        const overlay = document.getElementById('customer-consent-overlay');
        if (overlay) overlay.remove();
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        if (ash) {
            fetch(WH_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: 'consent_accept',
                    consent_version: CONSENT_VERSION,
                    _auth: (tg && tg.initData) || 'debug_auth_mode',
                    ash: ash
                })
            }).catch(() => {});
        }
    }

    function checkPrivacyConsent() {
        if (hasValidConsent() || document.getElementById('customer-consent-overlay')) return;
        const html = `
        <div id="customer-consent-overlay" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999999] flex items-end sm:items-center justify-center">
            <div class="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center gap-2">
                    <i class="fas fa-shield-halved text-slate-800"></i>
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-800">Privacy e Intelligenza Artificiale</h3>
                </div>
                <div class="text-[11px] leading-relaxed text-slate-600 space-y-2.5">
                    <p>Questa app utilizza un assistente basato su intelligenza artificiale per rispondere alle tue richieste e guidarti nei servizi disponibili.</p>
                    <p>Non conserviamo dati personali identificativi (nome, indirizzo, telefono): solo informazioni operative anonime necessarie al funzionamento del servizio.</p>
                    <p>Continuando accetti l'elaborazione dei tuoi messaggi tramite intelligenza artificiale, in conformita' con la normativa sulla privacy vigente.</p>
                </div>
                <button onclick="window.CustomerAdvancedMenu.acceptConsent()" class="w-full py-3.5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition">Accetto</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    async function sendChat() {
        const input = document.getElementById('cam-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text && !pendingAttachment) return;
        addChatMessage('user', text || '📎 Allegato inviato');
        input.value = '';
        const attachmentToSend = pendingAttachment;
        clearAttachment();
        try {
            const response = await fetch(WH_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'npl_chat',
                    message: text,
                    attachment: attachmentToSend || undefined,
                    // Usa-e-getta: gia' sul telefono del cliente (Telegram), serve solo a
                    // personalizzare QUESTA risposta. Il backend non lo salva mai.
                    display_name: (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.first_name) || '',
                    _auth: (tg && tg.initData) || 'debug_auth_mode',
                    ash: ash
                })
            });
            const data = await response.json();
            if (data.success === false && data.limit_reached) {
                addChatMessage('ai', data.message || 'Hai raggiunto il limite di utilizzo per questa chat.');
            } else if (data.redirect_url) {
                addChatMessage('ai', data.message || 'Apertura modulo richiesto...');
                setTimeout(() => { window.location.href = `${data.redirect_url}?ash=${ash}`; }, 1000);
            } else if (data.reply) {
                addChatMessage('ai', data.reply);
            }
        } catch (err) {
            addChatMessage('ai', 'Errore di connessione.');
        }
    }

    async function loadHistory() {
        if (historyLoaded) return;
        const container = document.getElementById('cam-history-container');
        if (!container || !ash) return;
        try {
            const response = await fetch(WH_CUSTOMER_GATE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    _auth: (tg && tg.initData) || 'debug_auth_mode',
                    ash: ash,
                    action: 'u_calc_ecom_get'
                })
            });
            const result = await response.json();
            const data = Array.isArray(result) ? result[0] : result;
            historyLoaded = true;
            if (data && data.success && data.history && data.history.length > 0) {
                container.innerHTML = data.history.map(o => `
                    <div class="p-3 border border-slate-100 bg-white rounded-2xl space-y-1.5">
                        <div class="flex justify-between items-center text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>ID: ${(o.sessionId || '').split('_')[2] || 'ORD'}</span>
                            <span class="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800">${(o.status || 'RICHIESTO').toUpperCase()}</span>
                        </div>
                        <div class="text-slate-800 font-bold text-[10px] leading-tight">
                            ${o.items ? o.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Servizi e Consulti'}
                        </div>
                        <div class="text-[9px] font-black text-slate-900 pt-1 border-t border-slate-50 flex justify-between">
                            <span>Importo</span>
                            <span>€ ${parseFloat(o.total_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="py-4 text-center text-slate-300">
                        <i class="fas fa-folder-open text-lg mb-1.5 opacity-40"></i>
                        <p class="text-[8px] font-black uppercase tracking-wider">Nessuna attività registrata</p>
                    </div>
                `;
            }
        } catch (err) {
            container.innerHTML = '<div class="text-center py-4 text-slate-300">Impossibile caricare lo storico.</div>';
        }
    }

    function open() {
        injectDrawer();
        const overlay = document.getElementById('customer-menu-overlay');
        const drawer = document.getElementById('customer-menu-drawer');
        if (!overlay || !drawer) return;
        overlay.classList.remove('hidden');
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            drawer.classList.remove('translate-y-full');
        }, 10);
        if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        loadHistory();
    }

    function close() {
        const overlay = document.getElementById('customer-menu-overlay');
        const drawer = document.getElementById('customer-menu-drawer');
        if (!overlay || !drawer) return;
        overlay.classList.add('opacity-0');
        drawer.classList.add('translate-y-full');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }

    function openTicket() {
        const qs = `?ash=${encodeURIComponent(ash)}${vat ? '&vat=' + encodeURIComponent(vat) : ''}`;
        window.location.href = `ticket.html${qs}`;
    }

    window.CustomerAdvancedMenu = { open, close, sendChat, openTicket, pickAttachment, clearAttachment, acceptConsent };

    function init() {
        injectTriggerButton();
        checkPrivacyConsent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window);
