// Soft Skill Selector - Main Application
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let quizStartTime = null;

// Parametri di sicurezza e identità
const params = new URLSearchParams(window.location.search);
const vat = params.get('vat');
const userId = params.get('user_id');
const msgId = params.get('msg_id');
const ash = params.get('ash');
const tg = window.Telegram?.WebApp;
const _auth = tg?.initData || '';

// Carica le domande usando il loader
async function loadQuestions() {
    try {
        questions = await getQuestions();
        if (questions.length === 0) throw new Error('Nessuna domanda caricata');
        
        console.log(`✅ ${questions.length} domande pronte!`);
        quizStartTime = Date.now(); // Inizia il cronometro
        displayQuestion();
    } catch (error) {
        console.error('❌ Errore nel caricamento:', error);
        document.getElementById('scenario').innerHTML = 
            `<p style="color: #ef4444; font-weight: 900;">Errore: ${error.message}</p>`;
    }
}

// Mostra la domanda corrente
function displayQuestion() {
    if (!questions.length) return;

    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 
        `Domanda ${currentQuestionIndex + 1} di ${questions.length}`;

    document.getElementById('scenario').textContent = question.scenario;

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const card = document.createElement('div');
        card.className = 'option-card';
        if (answers[currentQuestionIndex]?.index === index) {
            card.classList.add('selected');
        }

        const imgPath = `../../images/softskill/question${question.num}/${index + 1}.png`;
        
        card.innerHTML = `
            <img src="${imgPath}" 
                 alt="${question.captions[index]}" 
                 class="option-image"
                 onerror="this.src='../../images/softskill/${index + 1}.png'">
            <div class="option-caption">${question.captions[index]}</div>
        `;

        card.onclick = () => selectOption(index, option.text, question.num);
        optionsContainer.appendChild(card);
    });

    updateNavigation();
}

// Seleziona un'opzione
function selectOption(index, text, questionNum) {
    answers[currentQuestionIndex] = {
        index: index,
        question_num: questionNum,
        answer_text: text
    };
    displayQuestion();
}

// Aggiorna i bottoni di navigazione
function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = answers[currentQuestionIndex] === undefined;

    if (currentQuestionIndex === questions.length - 1) {
        nextBtn.textContent = '🎯 Vedi Risultati';
    } else {
        nextBtn.textContent = 'Successiva ➡️';
    }
}

// Domanda successiva
function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showResults();
    }
}

// Domanda precedente
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Mostra i risultati e invia al Webhook
async function showResults() {
    const completionTimeSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
    
    // Preparazione dati per Webhook
    const payload = {
        action: "save_module",
        vat: vat,
        user_id: userId,
        msg_id: msgId,
        ash: ash,
        _auth: _auth,
        module_id: "modulo1",
        module_name: "Soft Skills Selector",
        total_questions: questions.length,
        completion_time_seconds: completionTimeSeconds,
        answers: Object.values(answers)
    };

    // Mostra caricamento
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="loader" style="margin-bottom: 20px;"></div>
            <p style="font-weight: 900; text-transform: uppercase; font-size: 10px; letter-spacing: 0.1em;">
                Analisi del profilo in corso...
            </p>
        </div>
    `;
    
    document.getElementById('questionSection').style.display = 'none';
    document.querySelector('.navigation').style.display = 'none';
    document.getElementById('results').classList.add('active');

    try {
        const response = await fetch('https://prod.workflow.trinai.it/webhook/80d663ea-be4b-4d42-8cc1-05f4ada52ced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Errore nel salvataggio dei dati');
        const data = await response.json();

        // Rendering dei risultati ricevuti dall'AI (se presenti)
        if (data.success && data.evaluation) {
            renderAiEvaluation(data.evaluation);
        } else {
            // Fallback locale se il webhook non restituisce valutazione immediata
            renderLocalResults();
        }

    } catch (error) {
        console.error('❌ Errore Webhook:', error);
        resultsContent.innerHTML = `
            <div style="color: #ef4444; padding: 20px;">
                <p><strong>Errore di connessione</strong></p>
                <p style="font-size: 12px; margin-top: 10px;">I tuoi risultati sono stati salvati localmente ma non è stato possibile inviarli al server.</p>
            </div>
        `;
        renderLocalResults();
    }
}

function renderAiEvaluation(eval) {
    const resultsContent = document.getElementById('resultsContent');
    resultsContent.innerHTML = `
        <div class="skill-result" style="border-left: 4px solid #000;">
            <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; opacity: 0.5; margin-bottom: 5px;">Analisi Strategica</div>
            <p style="font-size: 13px; line-height: 1.5;">${eval.Analisi_Strategica}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
            <div class="skill-result" style="background: #f8fafc;">
                <div style="font-size: 24px; font-weight: 900;">${eval.PP}%</div>
                <div style="font-size: 9px; font-weight: 900; text-transform: uppercase;">Potenziale Positivo</div>
                <div style="font-size: 10px; margin-top: 5px; font-style: italic;">"${eval.CP}"</div>
            </div>
            <div class="skill-result" style="background: #f8fafc;">
                <div style="font-size: 24px; font-weight: 900;">${eval.PN}%</div>
                <div style="font-size: 9px; font-weight: 900; text-transform: uppercase;">Aree di Rischio</div>
                <div style="font-size: 10px; margin-top: 5px; font-style: italic;">"${eval.CN}"</div>
            </div>
        </div>

        <div class="skill-result" style="margin-top: 15px;">
            <div style="font-size: 9px; font-weight: 900; text-transform: uppercase; opacity: 0.5;">Impatto Business</div>
            <p style="font-size: 12px;">${eval.Impatto_Business}</p>
        </div>
    `;
}

function renderLocalResults() {
    const skillCounts = {};
    questions.forEach((q, i) => {
        const skills = q.softSkill.split(', ');
        skills.forEach(s => skillCounts[s] = (skillCounts[s] || 0) + 1);
    });

    const sortedSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1]).slice(0, 5);

    const container = document.createElement('div');
    container.innerHTML = `<h3 style="font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">Skill Prevalenti (Analisi Locale)</h3>`;
    container.innerHTML += sortedSkills.map(([skill, count]) => `
        <div class="skill-result">
            <strong>${skill}</strong>
            <div style="background: linear-gradient(90deg, #000 ${(count/questions.length)*100}%, #f1f5f9 0%); height: 6px; border-radius: 99px; margin-top: 5px;"></div>
        </div>
    `).join('');
    document.getElementById('resultsContent').appendChild(container);
}

// Ricomincia il quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    answers = {};
    quizStartTime = Date.now();

    document.getElementById('questionSection').style.display = 'block';
    document.querySelector('.navigation').style.display = 'flex';
    document.getElementById('results').classList.remove('active');

    displayQuestion();
}

// Inizializza al caricamento della pagina
window.addEventListener('DOMContentLoaded', loadQuestions);
