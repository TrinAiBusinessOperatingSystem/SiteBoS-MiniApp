/**
 * DashBoar Shared Micro-Runtime Bootstrap
 * Version: 1.0.0
 * Specification: .agents/tasks/ods_dashboar_project_avvio_agentico.md (§3),
 *                .agents/context/17_dashboar_swarm_spec.md (BLOCCO E),
 *                .agents/context/19_dashboar_capability_levels_e_sicurezza.md
 * Standards: Vanilla JS ES6+, zero build, safe DOM textContent injection, no eval.
 */

(function (window, document) {
    'use strict';

    const DASHBOAR_BOOTSTRAP_VERSION = '1.0.1';
    const DASHBOAR_DATA_URL = 'https://prod.workflow.trinai.it/webhook/sitebos-dashboar-data';
    const DASHBOAR_AGENT_URL = 'https://prod.workflow.trinai.it/webhook/sitebos-dashboar-agent';

    // Global Chart.js registry to prevent memory leaks and handle updates
    window.DashBoarChartRegistry = window.DashBoarChartRegistry || {};
    const ChartRegistry = window.DashBoarChartRegistry;

    // In-memory state for micro-router and runtime data
    const RuntimeState = {
        current_screen: 'default',
        active_record_id: null,
        refresh_timer_id: null,
        min_refresh_seconds: 30,
        default_refresh_seconds: 60,
        is_fetching: false
    };

    /**
     * Utility: Toast Notification
     */
    function showToast(message, type = 'info') {
        let toastContainer = document.getElementById('dashboar-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'dashboar-toast-container';
            toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-lg border text-xs font-semibold transform transition-all duration-300 translate-y-4 opacity-0 ' +
            (type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
             type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
             type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
             'bg-slate-900 border-slate-800 text-white');

        const textSpan = document.createElement('span');
        textSpan.className = 'flex-1 mr-2';
        textSpan.textContent = message;
        toast.appendChild(textSpan);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'text-slate-400 hover:text-white transition-colors ml-2 text-base leading-none';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        };
        toast.appendChild(closeBtn);

        toastContainer.appendChild(toast);

        // Animate entrance
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        // Auto dismiss after 3.5s
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('opacity-0', 'translate-y-2');
                setTimeout(() => toast.remove(), 300);
            }
        }, 3500);
    }

    /**
     * Utility: Safe HTML Injection without script execution
     */
    function safelyInjectHtml(container, htmlContent) {
        if (!container || !htmlContent) return;
        const parser = new DOMParser();
        const parsedDoc = parser.parseFromString(htmlContent, 'text/html');

        // Strip any script tags for defense-in-depth
        const scriptTags = parsedDoc.querySelectorAll('script');
        scriptTags.forEach(script => script.remove());

        // Strip dangerous inline event attributes from all nodes
        const allElements = parsedDoc.body.querySelectorAll('*');
        allElements.forEach(el => {
            const attrNames = el.getAttributeNames();
            attrNames.forEach(attr => {
                if (attr.toLowerCase().startsWith('on') || (attr.toLowerCase() === 'href' && el.getAttribute(attr).toLowerCase().startsWith('javascript:'))) {
                    el.removeAttribute(attr);
                }
            });
        });

        container.replaceChildren(...parsedDoc.body.childNodes);
    }

    /**
     * Format timestamp to human readable Italian string
     */
    function formatDateTime(isoString) {
        if (!isoString) return '--';
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return String(isoString);
            return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return String(isoString);
        }
    }

    /**
     * Micro-Router Multi-Screen (L6 Capability)
     */
    function initMicroRouter() {
        function applyScreenFromHash() {
            const hash = window.location.hash.replace(/^#/, '');
            const params = new URLSearchParams(hash);
            const targetScreen = params.get('screen') || 'default';
            const recordId = params.get('id') || null;

            RuntimeState.current_screen = targetScreen;
            RuntimeState.active_record_id = recordId;

            const screens = document.querySelectorAll('[data-screen]');
            if (screens.length === 0) return;

            let screenFound = false;
            screens.forEach(screenEl => {
                const screenName = screenEl.getAttribute('data-screen');
                if (screenName === targetScreen || (targetScreen === 'default' && !screenFound)) {
                    screenEl.hidden = false;
                    screenEl.classList.remove('hidden');
                    screenFound = true;
                } else {
                    screenEl.hidden = true;
                    screenEl.classList.add('hidden');
                }
            });

            // If requested screen wasn't found, fallback to first screen
            if (!screenFound && screens.length > 0) {
                screens[0].hidden = false;
                screens[0].classList.remove('hidden');
            }
        }

        window.addEventListener('hashchange', applyScreenFromHash);
        applyScreenFromHash();
    }

    function navigateToScreen(screenName, recordId = null) {
        RuntimeState.current_screen = screenName;
        if (recordId !== null) {
            RuntimeState.active_record_id = recordId;
        }

        const hashParams = new URLSearchParams();
        hashParams.set('screen', screenName);
        if (RuntimeState.active_record_id) {
            hashParams.set('id', RuntimeState.active_record_id);
        }
        window.location.hash = hashParams.toString();
    }

    /**
     * Chart.js Binding Helper
     */
    function bindChartSlot(slotId, canvas, chartType, dataPayload) {
        if (!window.Chart) {
            console.warn('[DashBoar] Chart.js non caricato.');
            return;
        }

        if (!dataPayload || (!dataPayload.labels && !dataPayload.datasets && !dataPayload.values)) {
            return;
        }

        // Format labels and datasets depending on payload structure
        let labels = dataPayload.labels || [];
        let datasets = dataPayload.datasets || [];

        if (chartType === 'sparkline') {
            const values = dataPayload.values || [];
            labels = values.map((_, i) => String(i + 1));
            datasets = [{
                data: values,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 0
            }];
        } else if (datasets.length === 0 && dataPayload.data) {
            datasets = [{
                label: dataPayload.title || '',
                data: dataPayload.data,
                backgroundColor: chartType === 'bar' ? '#6366f1' : 'rgba(99, 102, 241, 0.2)',
                borderColor: '#4f46e5',
                borderWidth: 2,
                borderRadius: chartType === 'bar' ? 6 : 0,
                tension: 0.3
            }];
        }

        const chartData = { labels, datasets };

        if (ChartRegistry[slotId]) {
            // Update existing instance
            const chart = ChartRegistry[slotId];
            chart.data = chartData;
            chart.update('none');
        } else {
            // Create new instance
            let chartConfig = {
                type: chartType === 'sparkline' ? 'line' : chartType,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                        legend: { display: chartType !== 'sparkline' && datasets.length > 1 }
                    }
                }
            };

            if (chartType === 'sparkline') {
                chartConfig.options = {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } },
                    elements: { point: { radius: 0 } }
                };
            } else {
                chartConfig.options.scales = {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }
                };
            }

            ChartRegistry[slotId] = new window.Chart(canvas, chartConfig);
        }
    }

    /**
     * Slot Data Binding: 9 Widgets from BLOCCO E
     */
    function bindSlotElement(slotEl, slotId, payload) {
        slotEl.classList.remove('is-loading');

        // Handle isolated slot error
        if (!payload || payload.error) {
            const errorText = payload?.error || 'Dati non disponibili';
            let errBadge = slotEl.querySelector('[data-slot-error]');
            if (!errBadge) {
                errBadge = document.createElement('div');
                errBadge.setAttribute('data-slot-error', 'true');
                errBadge.className = 'mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center';
                slotEl.appendChild(errBadge);
            }
            errBadge.textContent = errorText;
            return;
        }

        // Remove previous error badge if any
        const existingErr = slotEl.querySelector('[data-slot-error]');
        if (existingErr) existingErr.remove();

        // Empty state check
        const emptyStateEl = slotEl.querySelector('[data-slot-field="empty_state"]');
        const isDataEmpty = (
            payload.is_empty === true ||
            (Array.isArray(payload) && payload.length === 0) ||
            (Array.isArray(payload.rows) && payload.rows.length === 0) ||
            (Array.isArray(payload.items) && payload.items.length === 0) ||
            (Array.isArray(payload.values) && payload.values.length === 0) ||
            (payload.value === null || payload.value === undefined)
        );

        if (emptyStateEl) {
            if (isDataEmpty) {
                emptyStateEl.hidden = false;
                emptyStateEl.classList.remove('hidden');
                if (payload.empty_state) {
                    emptyStateEl.textContent = payload.empty_state;
                }
            } else {
                emptyStateEl.hidden = true;
                emptyStateEl.classList.add('hidden');
            }
        }

        // Generic field binder (textContent only)
        const fieldElements = slotEl.querySelectorAll('[data-slot-field]');
        fieldElements.forEach(fieldEl => {
            const fieldName = fieldEl.getAttribute('data-slot-field');
            if (fieldName === 'empty_state') return;

            // Handle special composite widgets
            if (fieldName === 'tbody' && Array.isArray(payload.rows)) {
                fieldEl.replaceChildren();
                payload.rows.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.className = 'hover:bg-slate-50/80 transition-colors';

                    if (Array.isArray(payload.columns)) {
                        payload.columns.forEach(col => {
                            const td = document.createElement('td');
                            td.className = 'py-3 px-4 text-xs font-medium text-slate-700 ' +
                                (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left');
                            const cellValue = row[col.key];
                            td.textContent = cellValue !== undefined && cellValue !== null ? String(cellValue) : '--';
                            tr.appendChild(td);
                        });
                    } else {
                        Object.keys(row).forEach(k => {
                            if (k.startsWith('_')) return;
                            const td = document.createElement('td');
                            td.className = 'py-3 px-4 text-xs text-slate-700';
                            td.textContent = String(row[k]);
                            tr.appendChild(td);
                        });
                    }

                    if (payload.row_action_id) {
                        const actionTd = document.createElement('td');
                        actionTd.className = 'py-3 px-4 text-right';
                        const actionBtn = document.createElement('button');
                        actionBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors';
                        actionBtn.setAttribute('data-action-id', payload.row_action_id);
                        if (row.id || row._id || row.job_id) {
                            actionBtn.setAttribute('data-record-id', String(row.id || row._id || row.job_id));
                        }
                        actionBtn.textContent = payload.row_action_label || 'Azione';
                        actionTd.appendChild(actionBtn);
                        tr.appendChild(actionTd);
                    }

                    fieldEl.appendChild(tr);
                });
                return;
            }

            if (fieldName === 'thead' && Array.isArray(payload.columns)) {
                fieldEl.replaceChildren();
                const headerTr = document.createElement('tr');
                payload.columns.forEach(col => {
                    const th = document.createElement('th');
                    th.className = 'py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider ' +
                        (col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left');
                    th.textContent = col.label || col.key || '';
                    headerTr.appendChild(th);
                });
                if (payload.row_action_id) {
                    const actionTh = document.createElement('th');
                    actionTh.className = 'py-3 px-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider';
                    actionTh.textContent = 'Azioni';
                    headerTr.appendChild(actionTh);
                }
                fieldEl.appendChild(headerTr);
                return;
            }

            if (fieldName === 'container') {
                // For alert_list or item collections
                const template = slotEl.querySelector('[data-template="item"]');
                const itemsList = Array.isArray(payload) ? payload : (payload.items || payload.alerts || []);
                if (template && itemsList.length > 0) {
                    fieldEl.replaceChildren();
                    itemsList.forEach(item => {
                        const itemClone = template.cloneNode(true);
                        itemClone.hidden = false;
                        itemClone.classList.remove('hidden');
                        itemClone.removeAttribute('data-template');

                        const itemFields = itemClone.querySelectorAll('[data-field]');
                        itemFields.forEach(ifEl => {
                            const k = ifEl.getAttribute('data-field');
                            if (item[k] !== undefined) {
                                ifEl.textContent = String(item[k]);
                            }
                        });

                        // Apply severity style if alert
                        if (item.severity === 'critical') {
                            itemClone.className = 'p-3 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 flex items-start justify-between gap-3';
                        } else if (item.severity === 'warning') {
                            itemClone.className = 'p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 flex items-start justify-between gap-3';
                        }

                        fieldEl.appendChild(itemClone);
                    });
                }
                return;
            }

            if (fieldName === 'bar') {
                // Progress bar widget
                const current = Number(payload.current || payload.value || 0);
                const total = Number(payload.total || payload.max || 100);
                const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
                fieldEl.style.width = percentage.toFixed(1) + '%';
                return;
            }

            if (fieldName === 'arc') {
                // Gauge widget
                const val = Number(payload.value || 0);
                const max = Number(payload.max || 100);
                const ratio = max > 0 ? Math.min(1, Math.max(0, val / max)) : 0;
                const rot = -90 + (ratio * 180);
                fieldEl.style.transform = `rotate(${rot.toFixed(1)}deg)`;
                return;
            }

            // Standard scalar mapping
            if (payload[fieldName] !== undefined && payload[fieldName] !== null) {
                fieldEl.textContent = String(payload[fieldName]);
            }
        });

        // Apply trend styling for KPI tiles
        if (payload.trend) {
            const trendEl = slotEl.querySelector('[data-slot-field="trend_indicator"]');
            if (trendEl) {
                trendEl.classList.remove('text-emerald-600', 'text-rose-600', 'text-slate-400');
                if (payload.trend === 'up') {
                    trendEl.classList.add('text-emerald-600');
                    if (!trendEl.textContent) trendEl.textContent = '▲ In crescita';
                } else if (payload.trend === 'down') {
                    trendEl.classList.add('text-rose-600');
                    if (!trendEl.textContent) trendEl.textContent = '▼ In calo';
                } else {
                    trendEl.classList.add('text-slate-400');
                    if (!trendEl.textContent) trendEl.textContent = '● Stabile';
                }
            }
        }

        // Apply status styling
        if (payload.status) {
            const badgeEl = slotEl.querySelector('[data-slot-field="status_badge"]');
            if (badgeEl) {
                badgeEl.classList.remove('bg-emerald-50', 'text-emerald-700', 'bg-amber-50', 'text-amber-700', 'bg-rose-50', 'text-rose-700');
                if (payload.status === 'ok') {
                    badgeEl.classList.add('bg-emerald-50', 'text-emerald-700');
                } else if (payload.status === 'warning') {
                    badgeEl.classList.add('bg-amber-50', 'text-amber-700');
                } else if (payload.status === 'critical') {
                    badgeEl.classList.add('bg-rose-50', 'text-rose-700');
                }
            }
        }

        // Canvas Chart binding
        const canvas = slotEl.querySelector('canvas[data-chart-type]');
        if (canvas) {
            const chartType = canvas.getAttribute('data-chart-type');
            bindChartSlot(slotId, canvas, chartType, payload);
        }
    }

    /**
     * Full View Controller: Fetch & Refresh
     */
    async function fetchBoardData() {
        if (RuntimeState.is_fetching) return;

        const mount = document.getElementById('dashboar-mount');
        const errorState = document.getElementById('dashboar-error-state');
        const lastUpdateEl = document.querySelector('[data-global="last_update"]');
        const boardTitleEl = document.querySelector('[data-global="board_title"]');

        const searchParams = new URLSearchParams(window.location.search);
        const slug = searchParams.get('board') || searchParams.get('slug') || '';
        const ash = searchParams.get('ash') || '';
        const authData = window.Telegram?.WebApp?.initData || '';

        if (!slug) {
            if (errorState) {
                errorState.hidden = false;
                errorState.classList.remove('hidden');
                const errTitle = errorState.querySelector('[data-error-title]');
                const errDesc = errorState.querySelector('[data-error-desc]');
                if (errTitle) errTitle.textContent = 'Parametro Board Mancante';
                if (errDesc) errDesc.textContent = 'Specifica lo slug della board nella barra degli indirizzi (?board=slug).';
            }
            if (mount) mount.classList.add('hidden');
            return;
        }

        RuntimeState.is_fetching = true;

        try {
            const response = await fetch(DASHBOAR_DATA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug, ash, _auth: authData })
            });

            if (response.status === 403) {
                throw { status: 403, message: 'Sessione non valida o permessi insufficienti per accedere a questa board.' };
            }
            if (response.status === 404) {
                throw { status: 404, message: 'Board non trovata. Il cruscotto richiesto non esiste o è stato archiviato.' };
            }
            if (!response.ok) {
                throw { status: response.status, message: `Errore del server durante il caricamento (HTTP ${response.status}).` };
            }

            const data = await response.json();

            if (data.error) {
                throw { status: 500, message: String(data.error) };
            }

            // Anti-Desync: Check html_hash
            const metaHashEl = document.querySelector("meta[name='dashboar-html-hash']");
            const currentHash = metaHashEl ? metaHashEl.getAttribute('content') : '';

            if (currentHash && data.html_hash && currentHash !== data.html_hash) {
                console.info('[DashBoar] HTML hash desync detected. Reloading board...');
                window.location.reload();
                return;
            }

            // First time injection if mount is empty and html_content provided
            if (mount && data.html_content && (!mount.hasChildNodes() || mount.children.length === 0)) {
                safelyInjectHtml(mount, data.html_content);
                if (metaHashEl && data.html_hash) {
                    metaHashEl.setAttribute('content', data.html_hash);
                }
                initMicroRouter();
            }

            // Hide error state, show mount
            if (errorState) {
                errorState.hidden = true;
                errorState.classList.add('hidden');
            }
            if (mount) {
                mount.hidden = false;
                mount.classList.remove('hidden');
            }

            // Bind Global Header fields
            if (boardTitleEl && (data.board_title || data.name)) {
                boardTitleEl.textContent = data.board_title || data.name;
            }
            if (lastUpdateEl) {
                lastUpdateEl.textContent = 'Aggiornato: ' + formatDateTime(data.generated_at || new Date().toISOString());
            }

            // Bind Slots
            const slots = data.slots || {};
            const slotElements = document.querySelectorAll('[data-slot]');
            slotElements.forEach(slotEl => {
                const slotId = slotEl.getAttribute('data-slot');
                const slotPayload = slots[slotId];
                bindSlotElement(slotEl, slotId, slotPayload);
            });

            // Schedule Next Refresh Loop
            const refreshSeconds = Math.max(
                RuntimeState.min_refresh_seconds,
                Number(data.refresh) || RuntimeState.default_refresh_seconds
            );

            if (RuntimeState.refresh_timer_id) {
                clearInterval(RuntimeState.refresh_timer_id);
            }

            RuntimeState.refresh_timer_id = setInterval(() => {
                if (!document.hidden) {
                    fetchBoardData();
                }
            }, refreshSeconds * 1000);

        } catch (err) {
            console.error('[DashBoar] Fetch board data failed:', err);
            if (errorState && (!mount || !mount.hasChildNodes() || mount.children.length === 0)) {
                errorState.hidden = false;
                errorState.classList.remove('hidden');
                if (mount) mount.classList.add('hidden');

                const errTitle = errorState.querySelector('[data-error-title]');
                const errDesc = errorState.querySelector('[data-error-desc]');
                if (errTitle) {
                    errTitle.textContent = err.status === 403 ? 'Sessione Non Valida (403)' :
                                          err.status === 404 ? 'Board Non Trovata (404)' :
                                          'Impossibile Caricare la Board';
                }
                if (errDesc) {
                    errDesc.textContent = err.message || 'Si è verificato un errore durante il recupero dei dati del cruscotto.';
                }
            } else {
                showToast(err.message || 'Errore durante l\'aggiornamento dei dati', 'error');
            }
        } finally {
            RuntimeState.is_fetching = false;
        }
    }

    /**
     * Hub Controller: List Boards & Creation Modal
     */
    async function initHubMode() {
        const grid = document.getElementById('dashboar-hub-boards-grid');
        const emptyState = document.getElementById('dashboar-hub-empty-state');
        const searchParams = new URLSearchParams(window.location.search);
        const ash = searchParams.get('ash') || '';
        const authData = window.Telegram?.WebApp?.initData || '';

        async function loadBoards() {
            if (!grid) return;
            window.__dashboarReloadHub = loadBoards;

            try {
                const res = await fetch(DASHBOAR_DATA_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'list_boards', ash, _auth: authData })
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const data = await res.json();
                const boards = data.boards || [];

                grid.replaceChildren();

                if (boards.length === 0) {
                    if (emptyState) {
                        emptyState.hidden = false;
                        emptyState.classList.remove('hidden');
                    }
                    grid.classList.add('hidden');
                    return;
                }

                if (emptyState) {
                    emptyState.hidden = true;
                    emptyState.classList.add('hidden');
                }
                grid.classList.remove('hidden');

                let anyGenerating = false;
                boards.forEach(b => {
                    const isGenerating = b.status === 'generating';
                    if (isGenerating) anyGenerating = true;
                    const card = document.createElement('div');
                    card.className = 'bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between' + (isGenerating ? ' opacity-70' : '');

                    const topDiv = document.createElement('div');
                    const headerRow = document.createElement('div');
                    headerRow.className = 'flex justify-between items-start gap-2 mb-2';

                    const titleH3 = document.createElement('h3');
                    titleH3.className = 'text-base font-bold text-slate-900';
                    titleH3.textContent = b.name || b.slug;
                    headerRow.appendChild(titleH3);

                    if (isGenerating) {
                        const genBadge = document.createElement('span');
                        genBadge.className = 'px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5';
                        genBadge.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-[10px]"></i> In preparazione';
                        headerRow.appendChild(genBadge);
                    } else if (b.is_new) {
                        const newBadge = document.createElement('span');
                        newBadge.className = 'px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200';
                        newBadge.textContent = 'Nuova';
                        headerRow.appendChild(newBadge);
                    }
                    topDiv.appendChild(headerRow);

                    const descP = document.createElement('p');
                    descP.className = 'text-xs text-slate-500 line-clamp-2 leading-relaxed';
                    descP.textContent = b.description || 'Cruscotto operativo per il monitoraggio KPI aziendali.';
                    topDiv.appendChild(descP);

                    card.appendChild(topDiv);

                    const bottomDiv = document.createElement('div');
                    bottomDiv.className = 'mt-5 pt-4 border-t border-slate-100 flex items-center justify-between';

                    const updateSpan = document.createElement('span');
                    updateSpan.className = 'text-[11px] font-medium text-slate-400';
                    updateSpan.textContent = 'Agg: ' + formatDateTime(b.updated_at);
                    bottomDiv.appendChild(updateSpan);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'flex items-center gap-2';

                    const editBtn = document.createElement('button');
                    editBtn.className = 'p-1.5 text-xs text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors';
                    editBtn.title = 'Modifica board';
                    editBtn.setAttribute('data-hub-action', 'edit');
                    editBtn.setAttribute('data-slug', b.slug);
                    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                    actionsDiv.appendChild(editBtn);

                    const archiveBtn = document.createElement('button');
                    archiveBtn.className = 'p-1.5 text-xs text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors';
                    archiveBtn.title = 'Archivia board';
                    archiveBtn.setAttribute('data-hub-action', 'archive');
                    archiveBtn.setAttribute('data-slug', b.slug);
                    archiveBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i>';
                    actionsDiv.appendChild(archiveBtn);

                    if (isGenerating) {
                        const waitSpan = document.createElement('span');
                        waitSpan.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl ml-1';
                        waitSpan.textContent = 'Progettazione in corso…';
                        actionsDiv.appendChild(waitSpan);
                    } else {
                        const openLink = document.createElement('a');
                        openLink.className = 'inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-xs ml-1';
                        openLink.href = `dashboar_view.html?board=${encodeURIComponent(b.slug)}&ash=${encodeURIComponent(ash)}`;
                        openLink.innerHTML = 'Apri <i class="fa-solid fa-arrow-right text-[10px]"></i>';
                        actionsDiv.appendChild(openLink);
                    }

                    bottomDiv.appendChild(actionsDiv);
                    card.appendChild(bottomDiv);

                    grid.appendChild(card);
                });

                // Se c'è una board in preparazione, avanza la generazione lato server e ricarica.
                if (anyGenerating && !RuntimeState._dashboar_check_scheduled) {
                    RuntimeState._dashboar_check_scheduled = true;
                    (async function advanceGeneration() {
                        try {
                            await fetch(DASHBOAR_AGENT_URL, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'dashboar_check', ash, _auth: authData })
                            });
                        } catch (e) { /* il backend prosegue comunque */ }
                        RuntimeState._dashboar_check_scheduled = false;
                        setTimeout(loadBoards, 3000);
                    })();
                }

            } catch (err) {
                console.warn('[DashBoar Hub] Lista board non ancora disponibile o fallback:', err);
                if (emptyState) {
                    emptyState.hidden = false;
                    emptyState.classList.remove('hidden');
                }
                if (grid) grid.classList.add('hidden');
            }
        }

        loadBoards();
    }

    /**
     * Delegated Global Event Listeners (Zero inline handlers)
     */
    function setupDelegatedListeners() {
        document.addEventListener('click', async (event) => {
            const target = event.target;

            // 1. Write-Back Buttons (L2 wiring)
            const actionBtn = target.closest('[data-action-id]');
            if (actionBtn) {
                const actionId = actionBtn.getAttribute('data-action-id');
                const recordId = actionBtn.getAttribute('data-record-id');
                console.warn(`[DashBoar L2] Action Gateway non ancora attivo. Action: ${actionId}, Record: ${recordId}`);
                showToast(`Azione "${actionId}" registrata (Gateway L2 in arrivo nella Fase 9)`, 'info');
                return;
            }

            // 2. Micro-Router Navigation Buttons (L6)
            const navBtn = target.closest('[data-navigate]');
            if (navBtn) {
                const targetScreen = navBtn.getAttribute('data-navigate');
                const recordId = navBtn.getAttribute('data-record-id') || null;
                navigateToScreen(targetScreen, recordId);
                return;
            }

            // 2b. Shell reload button (no inline handler)
            if (target.closest('[data-dashboar-reload]')) {
                window.location.reload();
                return;
            }

            // 3. Hub Actions: Modifica / Archivia
            const hubActionBtn = target.closest('[data-hub-action]');
            if (hubActionBtn) {
                const act = hubActionBtn.getAttribute('data-hub-action');
                const slug = hubActionBtn.getAttribute('data-slug');
                const sp = new URLSearchParams(window.location.search);
                const hAsh = sp.get('ash') || '';
                const hAuth = window.Telegram?.WebApp?.initData || '';
                if (act === 'edit') {
                    const change = window.prompt('Cosa vuoi cambiare in questa board?\n\nEsempi: "alza la soglia di allerta a 10", "aggiungi il fatturato mensile", "togli la tabella preventivi".');
                    if (!change || !change.trim()) return;
                    hubActionBtn.disabled = true;
                    showToast('Applico la modifica…', 'info');
                    fetch(DASHBOAR_AGENT_URL, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'dashboar_edit_config', slug, edit_prompt: change.trim(), ash: hAsh, _auth: hAuth })
                    }).then(r => r.json()).then(res => {
                        showToast(res && res.success ? (res.owner_message || 'Modifica applicata.') : 'Non è stato possibile applicare la modifica.', res && res.success ? 'success' : 'error');
                        if (typeof window.__dashboarReloadHub === 'function') window.__dashboarReloadHub();
                    }).catch(() => showToast('Errore di rete durante la modifica.', 'error'))
                      .finally(() => { hubActionBtn.disabled = false; });
                } else if (act === 'archive') {
                    showToast(`Archiviazione per la board "${slug}" in arrivo nelle prossime fasi dello Swarm`, 'info');
                }
                return;
            }

            // 4. Modal Open: Crea Nuova Board
            const openModalBtn = target.closest('#btn-open-create-modal, #btn-open-create-modal-secondary');
            if (openModalBtn) {
                const modal = document.getElementById('modal-create-board');
                if (modal) {
                    modal.hidden = false;
                    modal.classList.remove('hidden');
                    const promptArea = document.getElementById('create-board-prompt');
                    if (promptArea) promptArea.focus();
                }
                return;
            }

            // 5. Modal Close
            const closeModalBtn = target.closest('[data-close-modal]');
            if (closeModalBtn) {
                const modal = document.getElementById('modal-create-board');
                if (modal) {
                    modal.hidden = true;
                    modal.classList.add('hidden');
                }
                return;
            }

            // 6. Submit Generation Request
            const submitGenBtn = target.closest('#btn-submit-generation');
            if (submitGenBtn) {
                const promptArea = document.getElementById('create-board-prompt');
                const promptText = promptArea ? promptArea.value.trim() : '';

                if (!promptText) {
                    showToast('Descrivi cosa desideri monitorare prima di inviare la richiesta.', 'warning');
                    return;
                }

                const searchParams = new URLSearchParams(window.location.search);
                const ash = searchParams.get('ash') || '';
                const authData = window.Telegram?.WebApp?.initData || '';

                submitGenBtn.disabled = true;
                const originalText = submitGenBtn.textContent;
                submitGenBtn.textContent = 'Avvio Swarm...';

                // La generazione dura minuti (Scout -> Interpreter -> Resolver -> Designer -> Critic).
                // Si avvia la richiesta e NON si attende la risposta completa: il backend prosegue lato server,
                // salva la board e avvisa su Telegram a fine lavoro. Un abort a 8s libera solo la UI.
                const controller = new AbortController();
                const releaseUi = setTimeout(() => controller.abort(), 8000);

                const closeModal = () => {
                    const modal = document.getElementById('modal-create-board');
                    if (modal) { modal.hidden = true; modal.classList.add('hidden'); }
                    if (promptArea) promptArea.value = '';
                };

                try {
                    await fetch(DASHBOAR_AGENT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                        body: JSON.stringify({
                            action: 'dashboar_generate',
                            user_prompt: promptText,
                            ash,
                            _auth: authData
                        })
                    });
                    clearTimeout(releaseUi);
                    closeModal();
                    showToast('Board completata. Aggiorno l’elenco...', 'success');
                    if (typeof window.__dashboarReloadHub === 'function') { try { await window.__dashboarReloadHub(); } catch (e) {} }
                } catch (err) {
                    clearTimeout(releaseUi);
                    closeModal();
                    if (err && err.name === 'AbortError') {
                        showToast('Lo Swarm sta progettando la tua board. Ti avviso su Telegram quando è pronta, poi comparirà qui.', 'info');
                    } else {
                        showToast('Non è stato possibile avviare la generazione. Riprova tra poco.', 'error');
                    }
                } finally {
                    submitGenBtn.disabled = false;
                    submitGenBtn.textContent = originalText;
                }
            }
        });

        // Visibility change to pause / resume refresh loop
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && document.getElementById('dashboar-mount')) {
                fetchBoardData();
            }
        });
    }

    /**
     * Initialization Entry Point
     */
    document.addEventListener('DOMContentLoaded', () => {
        // Expand Telegram WebApp if present
        if (window.Telegram?.WebApp) {
            try {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
            } catch (e) {
                console.warn('[DashBoar] Telegram SDK expand warning:', e);
            }
        }

        setupDelegatedListeners();

        if (document.getElementById('dashboar-mount')) {
            // View Mode
            initMicroRouter();
            fetchBoardData();
        } else if (document.getElementById('dashboar-hub-boards-grid') || document.getElementById('dashboar-hub-mount')) {
            // Hub Mode
            initHubMode();
        }
    });

})(window, document);
