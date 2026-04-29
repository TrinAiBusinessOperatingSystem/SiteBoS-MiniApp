// Questions Loader - Carica direttamente i file TypeScript
// Nessuna conversione necessaria grazie al parsing dinamico!

let allQuestions = [];

// Lista di tutti i file delle domande
const questionFiles = [
  'questions1-5.ts',
  'questions6-10.ts',
  'questions11-15.ts',
  'questions16-20.ts',
  'questions21-25.ts',
  'questions26-30.ts',
  'questions31-35.ts',
  'question36-40.ts',
  'questions41-45.ts',
  'questions46-50.ts',
  'questions51-55.ts',
  'questions56-60.ts',
  'questions61-65.ts',
  'questions66-70.ts',
  'questions71-75.ts',
  'questions76-80.ts',
  'questions81-85.ts',
  'questions86-90.ts',
  'questions91-95.ts',
  'questions96-100.ts',
  'questions101-105.ts',
  'questions106-110.ts',
  'questions111-115.ts',
  'questions116-120.ts',
  'questions121-125.ts',
  'questions126-130.ts',
  'questions131-135.ts',
  'questions136-140.ts',
  'questions141-145.ts',
  'questions146-150.ts'
];

/**
 * Carica e parsifica un singolo file TypeScript
 */
async function loadQuestionFile(filename) {
  try {
    const response = await fetch(`questions/${filename}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const tsContent = await response.text();
    
    // Estrae l'array questions dal file TypeScript
    // Supporta sia 'export const questions' che 'export const questionsXXX'
    const match = tsContent.match(/export const questions.*?=\s*(\[[\s\S]*?\]);/m);
    if (!match) {
      console.warn(`⚠️ Nessuna question trovata in ${filename}`);
      return [];
    }
    
    const arrayString = match[1];
    
    try {
      // Metodo robusto: Valuta la stringa come un letterale JS
      // new Function è più affidabile di JSON.parse per oggetti con single quotes e chiavi non quotate
      const questions = new Function(`return ${arrayString}`)();
      console.log(`✅ ${filename}: ${questions.length} domande caricate`);
      return questions;
    } catch (parseError) {
      console.error(`❌ Errore di parsing in ${filename}:`, parseError);
      // Tenta fallback se necessario, ma new Function dovrebbe coprire tutto se la sintassi TS è corretta
      return [];
    }
    
  } catch (error) {
    console.error(`❌ Errore caricando ${filename}:`, error);
    return [];
  }
}

/**
 * Carica tutte le domande da tutti i file
 */
async function loadAllQuestions() {
  console.log('🚀 Caricamento domande...');
  allQuestions = [];
  
  for (const filename of questionFiles) {
    const questions = await loadQuestionFile(filename);
    allQuestions.push(...questions);
  }
  
  // Rimuove eventuali duplicati basati sul numero della domanda
  const uniqueQuestions = [];
  const seenNums = new Set();
  
  for (const q of allQuestions) {
    if (!seenNums.has(q.num)) {
      uniqueQuestions.push(q);
      seenNums.add(q.num);
    } else {
      console.warn(`⚠️ Domanda duplicata saltata: ${q.num}`);
    }
  }
  
  allQuestions = uniqueQuestions.sort((a, b) => a.num - b.num);
  
  console.log(`✨ Totale: ${allQuestions.length} domande uniche caricate!`);
  return allQuestions;
}

/**
 * Ottiene tutte le domande (carica se necessario)
 */
async function getQuestions() {
  if (allQuestions.length === 0) {
    await loadAllQuestions();
  }
  return allQuestions;
}

// Export per uso in altri moduli
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { loadAllQuestions, getQuestions };
}
