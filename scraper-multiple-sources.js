const puppeteer = require('puppeteer');

// KONFIGURACJA DEMO
// Zamiast prawdziwych grup FB, używamy Reddit jako bezpiecznego "symulatora"
// Struktura danych jest bardzo podobna: Autor, Treść, Obrazek, Data
const GROUPS_TO_SCRAPE = [
    {
        id: 'group_praca',
        name: 'Grupa: Praca w Polsce (Symulacja)',
        url: 'https://old.reddit.com/r/Praca/', // sub-reddit symulujący grupę o pracę
        keywords: ['praca', 'zatrudnię', 'szukam']
    },
    {
        id: 'group_legalizacja',
        name: 'Grupa: Legalizacja Pobytu (Symulacja)',
        url: 'https://old.reddit.com/r/poland/', // sub-reddit ogólny, często pytania o visa/pobyt
        keywords: ['visa', 'card', 'residence', 'legalization']
    }
];

const CONFIG = {
    n8nWebhookUrl: 'https://n8n-ivorylab.pl/webhook/scraper-demo',
    showBrowser: false, // Wymuszamy false dla stabilności (Headless mode)
    postsPerGroup: 3, // Ile postów pobrać z każdej grupy (dla demo wystarczy kilka)
    windowWidth: 1280,
    windowHeight: 800
};

// Funkcja pomocnicza: Czekanie
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Funkcja wysyłania do n8n (z retry)
async function sendToN8n(data, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch(CONFIG.n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                console.log('   ✅ Wysłano do n8n!');
                return true;
            } else {
                console.log(`   ⚠️ n8n odpowiedział błędem: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Błąd wysyłania: ${error.message}`);
        }
        if (attempt < retries) await sleep(2000);
    }
    return false;
}

async function runScraper() {
    console.log('🚀 Uruchamiam Demo Scrapera (Multi-Group Mode)...');
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: !CONFIG.showBrowser,
            dumpio: true, // Loguj wyjście Chrome do konsoli (dla debugowania)
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
    } catch (error) {
        console.error('❌ Krytyczny błąd: Nie udało się uruchomić przeglądarki.');
        console.error(error);
        return;
    }

    try {
        const page = await browser.newPage();

        // Dodaj User-Agent, aby nie zostać wykrytym jako bot (ważne dla Headless!)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // ITERACJA PO GRUPACH
        for (const group of GROUPS_TO_SCRAPE) {
            console.log(`\n📂 Przetwarzam grupę: ${group.name}`);
            console.log(`🔗 URL: ${group.url}`);

            try {
                await page.goto(group.url, { waitUntil: 'networkidle2', timeout: 60000 });
                console.log('✅ Strona załadowana!');

                // Pobieramy selektory postów (dla old.reddit jest to div.thing)
                const postHandles = await page.$$('div.thing.link');
                console.log(`   🔎 Znaleziono ${postHandles.length} postów.`);

                let postsProcessed = 0;

                for (const postHandle of postHandles) {
                    if (postsProcessed >= CONFIG.postsPerGroup) break;

                    // Ekstrakcja danych z DOM
                    const postData = await page.evaluate(el => {
                        const titleEl = el.querySelector('a.title');
                        const authorEl = el.querySelector('a.author');
                        const timeEl = el.querySelector('time');
                        const entryEl = el.querySelector('.entry'); // Kontener treści

                        return {
                            title: titleEl ? titleEl.innerText : '',
                            url: titleEl ? titleEl.href : '',
                            author: authorEl ? authorEl.innerText : 'nieznany',
                            authorUrl: authorEl ? authorEl.href : '',
                            postedAt: timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString(),
                            textContent: entryEl ? entryEl.innerText : ''
                        };
                    }, postHandle);

                    // Robimy screenshot tylko tego konkretnego posta (elementu)
                    const screenshotBase64 = await postHandle.screenshot({ encoding: 'base64' });

                    console.log(`   📝 Post: "${postData.title.substring(0, 40)}..." od ${postData.author}`);

                    // Przygotowanie payloadu
                    const payload = {
                        source: 'Facebook Group Mock (Reddit)',
                        groupName: group.name,
                        groupId: group.id,
                        ...postData,
                        screenshot: {
                            filename: `post_${group.id}_${Date.now()}.png`,
                            base64: screenshotBase64
                        },
                        scrapedAt: new Date().toISOString()
                    };

                    // Wysyłamy do n8n
                    console.log('   📡 Wysyłam dane...');
                    await sendToN8n(payload);

                    postsProcessed++;
                    await sleep(1000); // Mała pauza dla efektu
                }

            } catch (err) {
                console.error(`❌ Błąd przy przetwarzaniu grupy ${group.name}:`, err);
            }

            console.log(`🏁 Zakończono grupę ${group.name}`);
            await sleep(2000);
        }

    } catch (error) {
        console.error('❌ Błąd podczas scrapowania:', error);
    } finally {
        if (browser) {
            console.log('\n🔒 Zamykam przeglądarkę...');
            await browser.close();
        }
    }
    console.log('\n🎉 Koniec pracy.');
}

runScraper().catch(error => {
    console.error('❌ Nieobsłużony błąd w runScraper:', error);
});
