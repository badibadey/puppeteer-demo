/**
 * =============================================================
 * PUPPETEER + N8N DEMO
 * =============================================================
 * 
 * Ten skrypt:
 * 1. Scrolluje stronę i robi screenshoty
 * 2. Wysyła każdy screenshot do n8n przez webhook
 * 3. n8n może potem przetworzyć dane (OCR, kategoryzacja, zapis)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ============================================================
// KONFIGURACJA - ZMIEŃ TE WARTOŚCI!
// ============================================================

const CONFIG = {
    // URL strony do scrollowania
    url: 'https://old.reddit.com/r/popular/',

    // !!! WAŻNE: Wklej tutaj URL webhooka z n8n !!!
    // Znajdziesz go w ustawieniach noda "Webhook" w n8n
    n8nWebhookUrl: 'https://n8n-ivorylab.pl/webhook/scraper-demo',

    // Ile razy scrollować
    numberOfScrolls: 3,

    // Przerwy między scrollami (ms)
    minDelay: 1500,
    maxDelay: 3000,

    // Folder na screenshoty (lokalna kopia)
    screenshotsFolder: './screenshots',

    // Czy pokazywać przeglądarkę (false = headless mode)
    showBrowser: false,

    // Rozmiar okna
    windowWidth: 1280,
    windowHeight: 800
};

// ============================================================
// FUNKCJE POMOCNICZE
// ============================================================

function getRandomDelay() {
    return Math.floor(
        Math.random() * (CONFIG.maxDelay - CONFIG.minDelay) + CONFIG.minDelay
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createScreenshotsFolder() {
    if (!fs.existsSync(CONFIG.screenshotsFolder)) {
        fs.mkdirSync(CONFIG.screenshotsFolder, { recursive: true });
        console.log(`📁 Utworzono folder: ${CONFIG.screenshotsFolder}`);
    }
}

/**
 * Wysyła dane do n8n przez webhook z retry logic
 */
async function sendToN8n(data, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // AbortController dla timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(CONFIG.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                // Próbuj parsować JSON, ale obsłuż przypadek gdy serwer zwraca pusty response
                const text = await response.text();
                let result = null;
                if (text) {
                    try {
                        result = JSON.parse(text);
                    } catch {
                        result = { rawResponse: text };
                    }
                }
                console.log('   ✅ Wysłano do n8n!');
                return result;
            } else {
                console.log(`   ⚠️ n8n odpowiedział: ${response.status}`);
                if (attempt < retries) {
                    console.log(`   🔄 Próba ${attempt}/${retries} nieudana, ponawiam za 2s...`);
                    await sleep(2000);
                    continue;
                }
                return null;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log(`   ⏱️ Timeout - serwer nie odpowiedział w ciągu 30s`);
            } else {
                console.log(`   ❌ Błąd połączenia z n8n: ${error.message}`);
            }

            if (attempt < retries) {
                console.log(`   🔄 Próba ${attempt}/${retries} nieudana, ponawiam za 2s...`);
                await sleep(2000);
                continue;
            }

            console.log('   ℹ️  Upewnij się że n8n jest uruchomiony i webhook jest aktywny');
            return null;
        }
    }
    return null;
}

/**
 * Konwertuje screenshot do base64 (żeby wysłać przez JSON)
 */
function screenshotToBase64(filePath) {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
}

// ============================================================
// GŁÓWNA FUNKCJA
// ============================================================

async function runScraper() {
    console.log('');
    console.log('🚀 ========================================');
    console.log('🚀 PUPPETEER + N8N DEMO');
    console.log('🚀 ========================================');
    console.log('');
    console.log(`📡 Webhook n8n: ${CONFIG.n8nWebhookUrl}`);
    console.log('');

    createScreenshotsFolder();

    // ---------------------------------------------------------
    // KROK 1: Uruchom przeglądarkę
    // ---------------------------------------------------------
    console.log('🌐 Uruchamiam przeglądarkę...');

    const browser = await puppeteer.launch({
        headless: !CONFIG.showBrowser,
        defaultViewport: {
            width: CONFIG.windowWidth,
            height: CONFIG.windowHeight
        },
        protocolTimeout: 60000,
        args: [
            `--window-size=${CONFIG.windowWidth},${CONFIG.windowHeight}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-background-networking',
            '--disable-sync',
            '--no-first-run'
        ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // ---------------------------------------------------------
    // KROK 2: Wejdź na stronę
    // ---------------------------------------------------------
    console.log(`🔗 Wchodzę na: ${CONFIG.url}`);

    await page.goto(CONFIG.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    console.log('✅ Strona załadowana!');
    await sleep(2000);

    // ---------------------------------------------------------
    // KROK 3: Scrolluj, rób screenshoty, wysyłaj do n8n
    // ---------------------------------------------------------
    console.log('');
    console.log('📜 Rozpoczynam scrollowanie...');
    console.log('');

    for (let i = 1; i <= CONFIG.numberOfScrolls; i++) {

        const delay = getRandomDelay();
        console.log(`[${i}/${CONFIG.numberOfScrolls}] ⏳ Czekam ${delay}ms...`);
        await sleep(delay);

        // Scrolluj
        await page.evaluate(() => {
            window.scrollBy({
                top: window.innerHeight * 0.8,
                behavior: 'smooth'
            });
        });

        await sleep(500);

        // Zrób screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `screenshot_${i}_${timestamp}.png`;
        const filepath = path.join(CONFIG.screenshotsFolder, filename);

        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`   📸 Screenshot: ${filename}`);

        // Pobierz aktualny URL i tytuł strony
        const pageUrl = page.url();
        const pageTitle = await page.title();

        // Przygotuj dane do wysłania do n8n
        const dataForN8n = {
            // Metadane
            scrollNumber: i,
            totalScrolls: CONFIG.numberOfScrolls,
            timestamp: new Date().toISOString(),
            sourceUrl: pageUrl,
            pageTitle: pageTitle,

            // Screenshot jako base64 (n8n może go potem przetworzyć)
            screenshot: {
                filename: filename,
                base64: screenshotToBase64(filepath),
                mimeType: 'image/png'
            },

            // Dodatkowe info
            viewport: {
                width: CONFIG.windowWidth,
                height: CONFIG.windowHeight
            }
        };

        // Wyślij do n8n
        console.log(`   📡 Wysyłam do n8n...`);
        await sendToN8n(dataForN8n);

        console.log('');
    }

    // ---------------------------------------------------------
    // KROK 4: Zamknij przeglądarkę
    // ---------------------------------------------------------
    console.log('🔒 Zamykam przeglądarkę...');
    await browser.close();

    console.log('');
    console.log('🎉 ========================================');
    console.log('🎉 GOTOWE! Sprawdź n8n - dane powinny tam być');
    console.log('🎉 ========================================');
    console.log('');
}

// ============================================================
// URUCHOM
// ============================================================

runScraper().catch((error) => {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
});
