const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\garof\\Desktop\\TrinAi\\SiteBoS-MiniApp\\telegram_control';

const iifeBlock = `(function() {
    // Riferimento locale e temporaneo all'SDK per il controllo iniziale
    const tempTg = window.Telegram?.WebApp;
    const isTelegramSession = tempTg && tempTg.initData && tempTg.initData !== "" && tempTg.platform !== "unknown";

    if (!isTelegramSession) {
        const currentPath = window.location.pathname;
        let redirectPath = "index.html";

        if (/\/telegram_control\/[^/]+\//.test(currentPath)) {
            redirectPath = "../../index.html";
        } else if (currentPath.includes("/telegram_control/")) {
            redirectPath = "../index.html";
        }

        window.location.replace(redirectPath);
    }
})();`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Controlla se l'IIFE o la logica di sandbox è già stata iniettata
    if (!content.includes('isTelegramSession') && !content.includes('tempTg')) {
        // Cerca il primo tag <script> in linea (senza attributo src)
        const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>/i;
        if (scriptRegex.test(content)) {
            content = content.replace(scriptRegex, (match) => `${match}\n${iifeBlock}\n`);
            modified = true;
            console.log(`[INJECTED SANDBOX REDIRECT] ${filePath}`);
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
}

function traverse(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            traverse(fullPath);
        } else if (file.endsWith('.html')) {
            processFile(fullPath);
        }
    });
}

console.log(`Avvio elaborazione in: ${targetDir}`);
traverse(targetDir);
console.log("Elaborazione completata!");
