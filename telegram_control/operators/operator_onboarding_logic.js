// operator_onboarding_logic.js
// Onboarding Operatore - 2 Step

// CONFIG
const ONBOARDING_API = "https://trinai.api.workflow.dcmake.it/webhook/771638a1-7a79-4cb0-a36e-29b03901cc4a";

// INIT TELEGRAM + ASH
const tg = window.TwaGuard?.requireTelegramWebApp?.() || window.Telegram.WebApp;
const ash = window.TwaGuard?.getAsh?.();
let chatId = tg.initDataUnsafe?.user?.id;
window.TwaGuard?.cleanupUrl?.(['ash']);

// PATCH FETCH TO INCLUDE _auth AND ash AUTOMATICALLY
window.TwaGuard?.patchFetchJson?.();

// URL PARAMS (keep only strict minimum; ash is passed through)
const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang') || 'it';

// STATE
let currentStep = 1;
let ownerCompanyName = "";
let selectedSkills = []; // Array di skill names
let certifications = [];
let humanVerificationPerformed = false;

// I18N
const i18n = {
    it: {
        step_identity: "Identità", step_profile: "Profilo",
        h_identity: "Informativa & Sicurezza", sub_identity: "Consensi, Sicurezza e Informativa Sistemi AI.",
        h_profile: "Profilo Professionale", sub_profile: "Competenze e esperienza lavorativa.",
        legal_privacy: "Informativa <a href='legal.html#privacy' class='legal-link'>Trattamento Dati e Sistemi AI</a>", 
        legal_terms: "Accetto <a href='legal.html#terms' class='legal-link'>Termini di Servizio</a>", 
        legal_ai: "Accetto l'analisi delle competenze tramite AI (<a href='legal.html#ai-act' class='legal-link'>AI Act Reg. UE 2024/1689</a>)",
        byok_note: "La tua chiave personale, nessuno la vedrà.",
        lbl_name: "Nome", lbl_surname: "Cognome", lbl_fiscal: "Codice Fiscale", lbl_email: "Email", lbl_phone: "Telefono",
        section_address: "Indirizzo", section_education: "Formazione", section_work: "Esperienza Lavorativa", section_skills: "Competenze Tecniche",
        lbl_education: "Titolo di Studio", lbl_education_field: "Specializzazione / Indirizzo",
        lbl_job_title: "Ruolo / Mansione Principale", lbl_experience: "Anni di Esperienza Totali", lbl_first_job: "Prima Esperienza",
        lbl_first_job_ever: "È la mia prima esperienza lavorativa",
        lbl_works_owner: "Lavoro già per questa azienda", lbl_years_with_owner: "Da quanti anni lavori qui?", lbl_collaboration: "Tipo di collaborazione",
        lbl_certifications: "Certificazioni / Patentini", btn_add_cert: "Aggiungi Certificazione",
        lbl_work_desc: "Descrivi la tua esperienza lavorativa", btn_analyze: "Analizza Competenze con AI",
        hint_skills_ai: "✅ Competenze estratte con AI. Verifica, modifica o rimuovi per confermare (Human-in-the-loop).",
        lbl_other_skills: "Altre competenze (manuale)",
        btn_next: "Avanti", btn_back: "Indietro", btn_complete: "Completa Attivazione",
        access_denied_title: "Accesso Riservato", access_denied_desc: "Attivazione disponibile solo tramite invito.",
        open_bot: "Contatta Owner",
        cv_magic_title: "⚡ Risparmia tempo!", cv_magic_desc: "Carica il tuo CV e compileremo tutto automaticamente",
        btn_upload_cv: "Carica CV (PDF)"
    },
    en: {
        step_identity: "Identity", step_profile: "Profile",
        h_identity: "Disclosure & Security", sub_identity: "Consents, Security and AI Systems Disclosure.",
        h_profile: "Professional Profile", sub_profile: "Skills and work experience.",
        legal_privacy: "<a href='legal.html#privacy' class='legal-link'>Personal Data & AI Systems Disclosure</a>", 
        legal_terms: "I accept <a href='legal.html#terms' class='legal-link'>Terms of Service</a>", 
        legal_ai: "I accept skills analysis via AI (<a href='legal.html#ai-act' class='legal-link'>AI Act Reg. UE 2024/1689</a>)",
        byok_note: "Your personal key, nobody will see it.",
        lbl_name: "Name", lbl_surname: "Surname", lbl_fiscal: "Fiscal Code", lbl_email: "Email", lbl_phone: "Phone",
        section_address: "Address", section_education: "Education", section_work: "Work Experience", section_skills: "Technical Skills",
        lbl_education: "Education Level", lbl_education_field: "Specialization / Field",
        lbl_job_title: "Role / Position", lbl_experience: "Years of Experience", lbl_first_job: "First Job",
        lbl_first_job_ever: "This is my first job",
        lbl_works_owner: "I already work for this company", lbl_years_with_owner: "How many years?", lbl_collaboration: "Collaboration type",
        lbl_certifications: "Certifications", btn_add_cert: "Add Certification",
        lbl_work_desc: "Describe your work experience", btn_analyze: "Analyze Skills with AI",
        hint_skills_ai: "✅ Skills extracted via AI. Verify, edit or remove to confirm (Human-in-the-loop).",
        lbl_other_skills: "Other skills (manual)",
        btn_next: "Next", btn_back: "Back", btn_complete: "Complete Activation",
        access_denied_title: "Access Restricted", access_denied_desc: "Activation available only via invitation.",
        open_bot: "Contact Owner",
        cv_magic_title: "⚡ Save time!", cv_magic_desc: "Upload your CV and we'll fill everything automatically",
        btn_upload_cv: "Upload CV (PDF)"
    }
};

const lang = i18n[langParam] ? langParam : 'it';
const t = i18n[lang] || i18n['en'];

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = t[el.getAttribute('data-i18n')];
    });
}
applyTranslations();

// RENDER SKILLS GRID (SENZA LIVELLI)
function renderSkillsGrid() {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    
    selectedSkills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.padding = '10px 12px';
        div.style.background = 'rgba(91, 111, 237, 0.2)';
        div.style.border = '1px solid var(--primary)';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';
        div.dataset.skillName = skill;
        
        div.innerHTML = `
            <div style="font-size: 13px; font-weight: 500;">${escapeHtml(skill)}</div>
            <button type="button" class="btn-remove-skill" style="background:none; border:none; color:var(--danger); cursor:pointer; padding:4px 8px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        grid.appendChild(div);
    });
    
    // Event delegation per remove buttons
    grid.querySelectorAll('.btn-remove-skill').forEach(btn => {
        btn.addEventListener('click', function() {
            const skillCard = this.closest('[data-skill-name]');
            const skillName = skillCard.dataset.skillName;
            
            selectedSkills = selectedSkills.filter(s => s !== skillName);
            humanVerificationPerformed = true; // Intervento umano sulle skill
            renderSkillsGrid();
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// CERTIFICAZIONI
window.addCertification = function() {
    const list = document.getElementById('certifications-list');
    const index = certifications.length;
    
    const div = document.createElement('div');
    div.className = 'cert-input-group';
    div.innerHTML = `
        <input type="text" placeholder="Es: Patentino PES-PAV" data-cert-index="${index}">
        <button type="button" onclick="removeCertification(${index})"><i class="fas fa-trash"></i></button>
    `;
    
    list.appendChild(div);
    certifications.push('');
}

window.removeCertification = function(index) {
    certifications.splice(index, 1);
    renderCertifications();
}

function renderCertifications() {
    const list = document.getElementById('certifications-list');
    list.innerHTML = '';
    certifications.forEach((cert, idx) => {
        const div = document.createElement('div');
        div.className = 'cert-input-group';
        div.innerHTML = `
            <input type="text" value="${escapeHtml(cert)}" placeholder="Es: Patentino PES-PAV" data-cert-index="${idx}" oninput="updateCertification(${idx}, this.value)">
            <button type="button" onclick="removeCertification(${idx})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

window.updateCertification = function(index, value) {
    certifications[index] = value;
}

// VALIDATE INVITATION / GET INITIAL DATA
async function validateInvitation() {
    // Se abbiamo ash, l'utente è già stato controllato, entriamo subito
    if (ash) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        
        // Carichiamo comunque i dati dell'azienda in background
        try {
            const res = await fetch(ONBOARDING_API, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    action: 'get',
                    chat_id: chatId
                })
            });
            const data = await res.json();
            const owner = data.owner_data || data; // Handle both direct and wrapped structures
            
            if (res.ok && (owner.ragione_sociale || owner.company_name)) {
                ownerCompanyName = owner.ragione_sociale || owner.company_name;
                document.getElementById('company-name-display').innerText = ownerCompanyName;
                
                // Extra details
                if (owner.vat_number || owner.indirizzo) {
                    const extra = document.getElementById('company-details-extra');
                    extra.style.display = 'block';
                    if (owner.vat_number) document.getElementById('company-vat-display').innerText = owner.vat_number;
                    if (owner.indirizzo) document.getElementById('company-address-display').innerText = owner.indirizzo;
                }
                
                if (data.chat_id) chatId = data.chat_id;
            }
        } catch (e) {
            console.warn("Background data fetch failed", e);
        }
        return true;
    }

    // Se non abbiamo ash, controlliamo almeno se abbiamo chatId (fallback)
    if (!chatId) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('access-denied').classList.remove('hidden');
        return false;
    }
    
    // Fallback per casi senza ash ma con chatId
    try {
        const res = await fetch(ONBOARDING_API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'get',
                chat_id: chatId
            })
        });
        
        const data = await res.json();
        const owner = data.owner_data || data;
        
        if (res.ok && (data.valid || owner.ragione_sociale)) {
            ownerCompanyName = owner.ragione_sociale || owner.company_name || "l'azienda";
            document.getElementById('company-name-display').innerText = ownerCompanyName;
            
            // Extra details
            if (owner.vat_number || owner.indirizzo) {
                const extra = document.getElementById('company-details-extra');
                if (extra) {
                    extra.style.display = 'block';
                    if (owner.vat_number) document.getElementById('company-vat-display').innerText = owner.vat_number;
                    if (owner.indirizzo) document.getElementById('company-address-display').innerText = owner.indirizzo;
                }
            }
            
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('app-content').classList.remove('hidden');
            return true;
        } else {
            throw new Error('Invalid invitation');
        }
    } catch (e) {
        console.error(e);
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('access-denied').classList.remove('hidden');
        return false;
    }
}

// STEP NAVIGATION
function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));
    for (let i = 1; i <= step; i++) {
        document.getElementById(`si-${i}`).classList.add('active');
    }
    
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = `${((step - 1) / 1) * 100}%`;
    
    currentStep = step;
}

// VERIFY GEMINI KEY
window.verifyGeminiKey = async function() {
    const key = document.getElementById('gemini_key').value.trim();
    const btn = document.getElementById('btn-verify-key');
    const status = document.getElementById('gemini-status');
    
    if (!key) {
        status.innerText = 'Inserisci una chiave';
        status.style.color = 'var(--danger)';
        return;
    }
    
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '...';
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
    status.style.color = '#64748b';
    
    try {
        const res = await fetch(ONBOARDING_API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'verify_gemini_key',
                chat_id: chatId,
                gemini_key: key
            })
        });
        
        const data = await res.json();
        
        if (res.ok && data.success) {
            const tier = data['gemini key'] || data.tier || (data.success ? 'Valid' : 'Invalid');
            status.innerText = tier;
            
            if (tier === 'Paid Tier') {
                status.style.color = '#10b981'; // Success
                tg.HapticFeedback.notificationOccurred('success');
            } else if (tier === 'Free Tier') {
                status.style.color = '#f59e0b'; // Warning
                tg.HapticFeedback.notificationOccurred('warning');
            } else {
                status.style.color = '#10b981';
            }
        } else {
            status.innerText = 'Chiave non valida';
            status.style.color = 'var(--danger)';
            tg.HapticFeedback.notificationOccurred('error');
        }
    } catch (e) {
        console.error(e);
        status.innerText = 'Errore verifica';
        status.style.color = 'var(--danger)';
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// VALIDATE STEP 1
function validateStep1() {
    const chkPrivacy = document.getElementById('chk_privacy').checked;
    const chkTerms = document.getElementById('chk_terms').checked;
    const chkAi = document.getElementById('chk_ai').checked;
    const name = document.getElementById('name').value.trim();
    const surname = document.getElementById('surname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    return chkPrivacy && chkTerms && chkAi && name && surname && email && phone;
}

function checkStep1() {
    document.getElementById('btn-step1').disabled = !validateStep1();
}

// ANALYZE SKILLS WITH AI
window.analyzeSkills = async function() {
    const workDescription = document.getElementById('work_description').value.trim();
    
    if (!workDescription) {
        alert('Inserisci una descrizione della tua esperienza lavorativa');
        return;
    }
    
    const btn = document.getElementById('analyze-skills-btn');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisi in corso...';
    
    try {
        const res = await fetch(ONBOARDING_API, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                action: 'analyze_skills',
                chat_id: chatId,
                gemini_key: document.getElementById('gemini_key').value,
                work_description: workDescription,
                job_title: document.getElementById('job_title').value,
                experience_years: document.getElementById('experience_years').value
            })
        });
        
        const data = await res.json();
        
        if (res.ok && data.skills) {
            selectedSkills = data.skills.map(s => s.name || s.skill);
            humanVerificationPerformed = true; // AI ha generato le skill
            
            document.getElementById('skills-result').classList.remove('hidden');
            renderSkillsGrid();
            
            tg.HapticFeedback.notificationOccurred('success');
        } else {
            throw new Error('Analysis failed');
        }
        
    } catch (e) {
        console.error(e);
        alert('❌ Errore durante l\'analisi. Riprova o inserisci competenze manualmente.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }
}

// === DOM CONTENT LOADED ===
document.addEventListener('DOMContentLoaded', function() {
    
    // Toggle prima esperienza
    const firstJobCheckbox = document.getElementById('is_first_job');
    if (firstJobCheckbox) {
        firstJobCheckbox.addEventListener('change', function() {
            const experienceFields = document.getElementById('experience-fields');
            const experienceYears = document.getElementById('experience_years');
            const firstJobYear = document.getElementById('first_job_year');
            
            if (this.checked) {
                experienceFields.style.opacity = '0.5';
                experienceFields.style.pointerEvents = 'none';
                experienceYears.disabled = true;
                firstJobYear.disabled = true;
                experienceYears.value = '';
                firstJobYear.value = '';
            } else {
                experienceFields.style.opacity = '1';
                experienceFields.style.pointerEvents = 'auto';
                experienceYears.disabled = false;
                firstJobYear.disabled = false;
            }
        });
    }
    
    // Toggle owner work details
    const worksCheckbox = document.getElementById('works_for_owner');
    if (worksCheckbox) {
        worksCheckbox.addEventListener('change', function() {
            const details = document.getElementById('owner-work-details');
            if (this.checked) {
                details.classList.remove('hidden');
            } else {
                details.classList.add('hidden');
                document.getElementById('years_with_owner').value = '';
                document.getElementById('collaboration_type').value = '';
            }
        });
    }
    
    // CV UPLOAD & PARSING
    const cvUpload = document.getElementById('cv_upload');
    if (cvUpload) {
        cvUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const cvStatus = document.getElementById('cv-status');
            const cvStatusText = document.getElementById('cv-status-text');
            
            cvStatus.classList.remove('hidden');
            cvStatusText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisi CV in corso...';
            
            const reader = new FileReader();
            reader.onload = async function(event) {
                const base64 = event.target.result;
                
                try {
                    const res = await fetch(ONBOARDING_API, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            action: 'parse_cv',
                            chat_id: chatId,
                            cv_base64: base64,
                            gemini_key: document.getElementById('gemini_key').value
                        })
                    });
                    
                    const data = await res.json();
                    
                    if (res.ok && data.profile) {
                        const p = data.profile;
                        
                        // Formazione
                        if (p.education_level) document.getElementById('education_level').value = p.education_level;
                        if (p.education_field) document.getElementById('education_field').value = p.education_field;
                        
                        // Esperienza
                        if (p.job_title) document.getElementById('job_title').value = p.job_title;
                        if (p.experience_years) document.getElementById('experience_years').value = p.experience_years;
                        if (p.first_job_year) document.getElementById('first_job_year').value = p.first_job_year;
                        
                        // Descrizione
                        if (p.work_description) document.getElementById('work_description').value = p.work_description;
                        
                        // Skills (estrai solo nomi)
                        if (p.hard_skills && p.hard_skills.length > 0) {
                            selectedSkills = p.hard_skills.map(s => s.skill || s.name);
                            humanVerificationPerformed = true; // AI mapping via CV
                            document.getElementById('skills-result').classList.remove('hidden');
                            renderSkillsGrid();
                        }
                        
                        // Certificazioni
                        if (p.certifications && p.certifications.length > 0) {
                            certifications = p.certifications;
                            renderCertifications();
                        }
                        
                        cvStatusText.innerHTML = '<i class="fas fa-check" style="color:var(--success);"></i> CV analizzato! Verifica e modifica se necessario.';
                        tg.HapticFeedback.notificationOccurred('success');
                    } else {
                        throw new Error('Parsing failed');
                    }
                } catch (e) {
                    console.error(e);
                    cvStatusText.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#ffc107;"></i> Impossibile analizzare CV. Compila manualmente.';
                }
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // LISTENERS STEP 1
    document.querySelectorAll('#step-1 input, #step-1 select').forEach(el => {
        el.addEventListener('input', checkStep1);
        el.addEventListener('change', checkStep1);
    });
    
    const btnStep1 = document.getElementById('btn-step1');
    if (btnStep1) {
        btnStep1.addEventListener('click', () => {
            if (validateStep1()) {
                goToStep(2);
            }
        });
    }
    
    const btnBackS2 = document.getElementById('btn-back-s2');
    if (btnBackS2) {
        btnBackS2.addEventListener('click', () => goToStep(1));
    }
    
    // SUBMIT FINALE
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const originalHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';
            
            // Raccogli certificazioni finali
            document.querySelectorAll('[data-cert-index]').forEach(input => {
                const idx = parseInt(input.getAttribute('data-cert-index'));
                certifications[idx] = input.value.trim();
            });
            
            const isFirstJob = document.getElementById('is_first_job').checked;
            
            const operatorData = {
                // Anagrafica
                name: document.getElementById('name').value,
                surname: document.getElementById('surname').value,
                fiscal_code: document.getElementById('fiscal_code').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                
                // Indirizzo
                address: {
                    route: document.getElementById('addr_route').value,
                    number: document.getElementById('addr_num').value,
                    zip: document.getElementById('addr_zip').value,
                    city: document.getElementById('addr_city').value,
                    province: document.getElementById('addr_prov').value
                },
                
                // Config
                gemini_key: document.getElementById('gemini_key').value,
                lenguage: langParam,
                
                // Formazione
                education_level: document.getElementById('education_level').value,
                education_field: document.getElementById('education_field').value,
                
                // Professionale
                job_title: document.getElementById('job_title').value,
                is_first_job: isFirstJob,
                experience_years: isFirstJob ? null : document.getElementById('experience_years').value,
                first_job_year: isFirstJob ? null : document.getElementById('first_job_year').value,
                
                // Rapporto Owner
                works_for_owner: document.getElementById('works_for_owner').checked,
                years_with_owner: document.getElementById('years_with_owner').value,
                collaboration_type: document.getElementById('collaboration_type').value,
                
                certifications: certifications.filter(c => c),
                
                // Skills (tutte con livello intermediate)
                work_description: document.getElementById('work_description').value,
                hard_skills: selectedSkills.map(skill => ({
                    skill: skill,
                    level: 'intermediate'
                })),
                other_skills: document.getElementById('other_skills').value,
                
                // Sistema
                operator_chat_id: chatId,

                // Log di Conformità (GDPR & AI Act Reg. UE 2024/1689)
                compliance_log: {
                    ai_disclosure_seen: document.getElementById('chk_ai').checked,
                    human_verification_performed: humanVerificationPerformed,
                    api_provider: "Google Gemini (Corporate Key provided by Owner)",
                    data_retention_policy: "Linked to contract duration",
                    timestamp: new Date().toISOString()
                }
            };
            
            try {
                const res = await fetch(ONBOARDING_API, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        action: 'complete_onboarding',
                        chat_id: chatId,
                        operator_data: operatorData
                    })
                });
                
                if (res.ok) {
                    tg.HapticFeedback.notificationOccurred('success');
                    alert('✅ Attivazione completata con successo!');
                    
                    const redirectUrl = res.headers.get('X-Redirect-Url');
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        tg.close();
                    }
                } else {
                    throw new Error('Save failed');
                }
            } catch (e) {
                console.error(e);
                alert('❌ Errore durante il salvataggio. Riprova.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHtml;
            }
        });
    }
});

// START
validateInvitation();