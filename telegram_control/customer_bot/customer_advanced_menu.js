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
                        <div class="flex items-center gap-2">
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

    async function sendChat() {
        const input = document.getElementById('cam-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        addChatMessage('user', text);
        input.value = '';
        try {
            const response = await fetch(WH_CHAT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'npl_chat',
                    message: text,
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

    window.CustomerAdvancedMenu = { open, close, sendChat, openTicket };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTriggerButton);
    } else {
        injectTriggerButton();
    }

})(window);
