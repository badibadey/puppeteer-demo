const { setTimeout } = require('timers/promises');
console.log('✅ Loaded lib/human-behavior.js V2 (Updated)');

/**
 * Konfiguracja opóźnień i zachowań
 */
const HUMAN_DELAYS = {
    betweenActions: { min: 2000, max: 5000 },      // 2-5s między akcjami
    beforeScroll: { min: 1000, max: 3000 },        // 1-3s przed scrollem
    afterPageLoad: { min: 3000, max: 8000 },       // 3-8s po załadowaniu strony
    typingSpeed: { min: 50, max: 150 },            // ms między znakami
    readingTime: { min: 500, max: 2000 }           // czas "czytania" posta
};

/**
 * Generuje losowe opóźnienie z wariancją gaussowską
 * @param {string} type - Klucz z HUMAN_DELAYS
 * @returns {number} - Czas w ms
 */
function humanDelay(type) {
    const config = HUMAN_DELAYS[type] || { min: 1000, max: 3000 };
    const { min, max } = config;
    const delay = Math.floor(Math.random() * (max - min) + min);
    // Dodaj gaussowską wariancję dla jeszcze bardziej naturalnych opóźnień
    const variance = (Math.random() - 0.5) * (delay * 0.2);
    return Math.floor(delay + variance);
}

/**
 * Helper do pauzowania wykonania (wrapper na setTimeout)
 * @param {number} ms 
 */
async function sleep(ms) {
    if (!ms) ms = humanDelay('betweenActions');
    await setTimeout(ms);
}

/**
 * Funkcja interpolacji liniowej dla ruchów myszy
 */
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

/**
 * Funkcja easeInOut dla płynności ruchu
 */
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Symuluje naturalny ruch myszy do elementu lub koordynatów
 * @param {object} page - Instancja Puppeteer Page
 * @param {number} targetX 
 * @param {number} targetY 
 */
async function humanMouseMove(page, targetX, targetY) {
    // Pobierz aktualną pozycję myszy (jeśli nieznana, załóż 0,0 lub środek)
    // Puppeteer nie udostępnia łatwo obecnej pozycji myszy bez trzymania stanu,
    // więc dla uproszczenia zaczynamy od losowego punktu w pobliżu lub ostatniego znanego.

    // Symulacja: wykonujemy ruch w kilku krokach
    const steps = Math.floor(Math.random() * 15) + 10; // 10-25 kroków

    // Zamiast idealnej linii, dodajemy losowe odchylenia
    const startX = Math.random() * 100; // placeholder start position
    const startY = Math.random() * 100;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Krzywa Béziera z losowym "drżeniem" ręki
        const x = lerp(startX, targetX, easeInOut(t)) + (Math.random() - 0.5) * 5;
        const y = lerp(startY, targetY, easeInOut(t)) + (Math.random() - 0.5) * 5;

        await page.mouse.move(x, y);
        // Bardzo krótkie pauzy między krokami dla realizmu
        await setTimeout(Math.random() * 10 + 5);
    }
}

/**
 * Symuluje kliknięcie w element
 * @param {object} page 
 * @param {string} selector 
 */
async function humanClick(page, selector) {
    const element = await page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    if (!box) throw new Error(`Element not visible: ${selector}`);

    // Losowy punkt WNĘTRZ elementu (nie idealny środek)
    const x = box.x + (Math.random() * 0.8 + 0.1) * box.width;
    const y = box.y + (Math.random() * 0.8 + 0.1) * box.height;

    await humanMouseMove(page, x, y);
    await sleep(Math.random() * 200 + 100); // Chwila zawahania przed kliknięciem
    await page.mouse.click(x, y);
    await sleep(humanDelay('betweenActions'));
}

/**
 * Symuluje naturalne scrollowanie strony
 * @param {object} page 
 */
async function humanScroll(page) {
    // Losowa długość scrolla (większy zakres dla naturalności)
    const scrollAmount = Math.floor(Math.random() * 800) + 300; // 300-1100px
    
    // Losowy kierunek: 80% w dół, 20% w górę (naturalne zachowanie)
    const scrollDirection = Math.random() < 0.8 ? 1 : -1;
    const finalScrollAmount = scrollAmount * scrollDirection;

    // Scroll w małych krokach z przerwami
    const scrollSteps = Math.floor(Math.random() * 8) + 4; // 4-11 kroków
    const stepAmount = finalScrollAmount / scrollSteps;

    for (let i = 0; i < scrollSteps; i++) {
        await page.evaluate((amount) => {
            window.scrollBy({ top: amount, behavior: 'smooth' });
        }, stepAmount);

        // Losowa pauza między "machnięciami" kółkiem myszy
        await setTimeout(Math.random() * 300 + 100); // 100-400ms
    }

    // Czasem zatrzymaj się na dłużej (jakby czytając)
    if (Math.random() > 0.6) { // 40% szans na dłuższą pauzę
        await sleep(humanDelay('readingTime'));
    }

    // 30% szans na dodatkowy, krótki scroll w przeciwnym kierunku
    if (Math.random() < 0.3) {
        const backScroll = Math.floor(Math.random() * 200) + 50; // 50-250px
        await page.evaluate((amount) => {
            window.scrollBy({ top: -amount, behavior: 'smooth' });
        }, backScroll * scrollDirection);
        await setTimeout(Math.random() * 500 + 200);
    }
}

/**
 * Symuluje pisanie tekstu z losowymi błędami i poprawkami
 * @param {object} page 
 * @param {string} selector 
 * @param {string} text 
 */
async function humanType(page, selector, text) {
    await humanClick(page, selector);

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // 5% szans na literówkę
        if (Math.random() < 0.05) {
            const wrongChar = String.fromCharCode(char.charCodeAt(0) + 1);
            await page.keyboard.type(wrongChar, { delay: Math.random() * 100 + 50 });
            await setTimeout(Math.random() * 300 + 100);
            await page.keyboard.press('Backspace');
            await setTimeout(Math.random() * 200 + 50);
        }

        await page.keyboard.type(char, { delay: humanDelay('typingSpeed') });

        // Pauzy co kilka słów (symulacja myślenia)
        if (char === ' ' && Math.random() < 0.3) {
            await setTimeout(Math.random() * 500 + 200);
        }
    }
}

/**
 * Sprawdza czy na stronie są oznaki bana
 * @param {object} page 
 * @returns {boolean} true jeśli wykryto bana
 */
async function checkBanRisk(page) {
    // Sprawdzamy tytuł strony - najszybszy i najpewniejszy wskaźnik bana
    const title = await page.title();
    const bannedTitles = [
        'You’re Temporarily Blocked',
        'Account Locked',
        'Zablokowano Cię tymczasowo',
        'Potwierdź swoją tożsamość',
        'Log into Facebook' // Czasem wyrzuca do logowania
    ];

    for (const badTitle of bannedTitles) {
        if (title.includes(badTitle)) {
            console.error(`⚠️ CRITICAL: Wykryto wskaźnik bana w tytule: "${badTitle}"`);
            return true;
        }
    }

    // Sprawdzamy widoczny tekst (tylko H1, H2 i główne kontenery alertów)
    // Unikamy page.content(), bo łapie słowa w kodzie JS/CSS
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Lista fraz, które wyświetlają się UŻYTKOWNIKOWI przy banie
    const banPhrases = [
        'Twoje konto zostało zablokowane',
        'Wykryliśmy podejrzaną aktywność',
        'Potwierdź swoją tożsamość',
        // 'checkpoint' - UWAGA: to słowo jest zbyt ogólne i występuje w kodzie FB. Usuwam je.
        'Please Verify Your Identity',
        'Account Disabled'
    ];

    for (const phrase of banPhrases) {
        if (bodyText.includes(phrase)) {
            console.error(`⚠️ CRITICAL: Wykryto wskaźnik bana w treści: "${phrase}"`);
            return true;
        }
    }

    // Specyficzny check na URL checkpointa
    if (page.url().includes('checkpoint') || page.url().includes('challenge')) {
        console.error(`⚠️ CRITICAL: Przekierowano na URL checkpointa: ${page.url()}`);
        return true;
    }

    return false;
}

module.exports = {
    humanDelay,
    sleep,
    humanMouseMove,
    humanClick,
    humanScroll,
    humanType,
    checkBanRisk
};
