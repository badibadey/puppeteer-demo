const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const {
    humanDelay,
    humanScroll,
    humanClick,
    checkBanRisk,
    sleep
} = require('./lib/human-behavior');

// Konfiguracja
puppeteer.use(StealthPlugin());

const CONFIG = require('./config/scraper.json');
const KEYWORDS = require('./config/keywords.json');

const SESSION_PATH = path.join(__dirname, 'fb-session', 'cookies.json');

/**
 * Ładuje ciasteczka z pliku
 */
async function loadCookies(page) {
    if (fs.existsSync(SESSION_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(SESSION_PATH, 'utf8'));
        if (cookies.length > 0) {
            await page.setCookie(...cookies);
            console.log(`🍪 Załadowano ${cookies.length} ciasteczek.`);
            return true;
        }
    }
    console.log('⚠️ Brak ciasteczek sesji. Bot może zostać przekierowany do logowania.');
    return false;
}

/**
 * Sprawdza czy tekst zawiera słowa kluczowe
 */
function matchKeywords(text) {
    if (!text) return { matched: false, keywords: [] };

    const lowerText = text.toLowerCase();
    const foundKeywords = [];
    let categoryMatch = null;

    for (const [category, data] of Object.entries(KEYWORDS.categories)) {
        for (const keyword of data.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundKeywords.push(keyword);
                if (!categoryMatch) categoryMatch = category;
            }
        }
    }

    return {
        matched: foundKeywords.length > 0,
        keywords: foundKeywords,
        category: categoryMatch
    };
}

/**
 * Wysyła dane do n8n
 */
async function sendToN8n(data) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(CONFIG.n8n.webhookUrl, {
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
            console.log(`   ⚠️ n8n zwrócił błąd: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`   ❌ Błąd wysyłania do n8n: ${error.message}`);
        return false;
    }
}

/**
 * Logika scrapowania dla Reddita (Mock Mode)
 */
async function scrapeReddit(page) {
    console.log('🤖 Tryb MOCK: Scrapowanie Reddita...');

    await humanScroll(page);

    const posts = await page.$$('div.thing.link');
    console.log(`🔎 Znaleziono ${posts.length} potencjalnych postów.`);

    let processedCount = 0;

    for (const postHandle of posts) {
        if (processedCount >= CONFIG.safety.maxPostsPerSession) break;

        const data = await page.evaluate(el => {
            const titleEl = el.querySelector('a.title');
            const authorEl = el.querySelector('a.author');
            const timeEl = el.querySelector('time');
            return {
                title: titleEl ? titleEl.innerText : '',
                url: titleEl ? titleEl.href : '',
                author: authorEl ? authorEl.innerText : 'unknown',
                postedAt: timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString()
            };
        }, postHandle);

        const textToAnalyze = data.title; // Na liście reddita głównie tytuły
        const matchResult = matchKeywords(textToAnalyze);

        if (matchResult.matched) {
            console.log(`   🎯 TRAFIENIE: "${data.title.substring(0, 30)}..." [${matchResult.keywords.join(', ')}]`);

            await sendToN8n({
                source: 'Reddit Mock',
                ...data,
                matchedKeywords: matchResult.keywords,
                category: matchResult.category,
                scrapedAt: new Date().toISOString()
            });
            processedCount++;
        }

        // Małe opóźnienie między przetwarzaniem elementów DOM (symulacja czytania)
        if (Math.random() > 0.8) await sleep(500);
    }
}

/**
 * Logika scrapowania dla Facebooka
 */
async function scrapeFacebook(page) {
    console.log('👤 Tryb LIVE: Scrapowanie Facebooka...');

    // 1. Czekaj na feed i zrób wstępny scroll
    try {
        await page.waitForSelector('[role="feed"]', { timeout: 15000 });
        console.log('   ✅ Feed znaleziony');
    } catch (e) {
        console.log('⚠️ Nie znaleziono feedu (timeout). Sprawdzam bana...');
        if (await checkBanRisk(page)) return;
        return;
    }

    // Scrolluj trochę żeby załadować posty
    await humanScroll(page);
    await sleep(2000);

    // 2. Pobierz posty
    // FB używa role="article" dla postów
    const particleHandles = await page.$$('[role="article"]');
    console.log(`   🔎 Znaleziono ${particleHandles.length} elementów (postów/reklam).`);

    let processedCount = 0;

    for (const postHandle of particleHandles) {
        if (processedCount >= CONFIG.safety.maxPostsPerSession) {
            console.log('   🛑 Osiągnięto limit postów na sesję.');
            break;
        }

        try {
            // Ekstrakcja danych w kontekście strony
            const postData = await page.evaluate(el => {
                // Helper do szukania tekstu wewnątrz elementu
                const getText = (selector) => {
                    const node = el.querySelector(selector);
                    return node ? node.innerText : '';
                };

                // --- AUTOR ---
                let author = 'Nieznany';
                let authorUrl = '';

                // 1. Szukanie linku profilowego (najlepsza metoda)
                // Linki do profili zwykle mają href z id użytkownika lub nazwą
                const profileLink = Array.from(el.querySelectorAll('a')).find(a => {
                    const href = a.href;
                    // Wykluczamy linki do hashtagów, postów, zdjęć
                    const isProfile = (href.includes('/user/') || href.includes('/groups/')) &&
                        !href.includes('/posts/') &&
                        !href.includes('/permalink/') &&
                        !href.includes('/photo');

                    // Często nazwa autora jest wewnątrz strong lub span
                    return isProfile && (a.innerText.length > 2);
                });

                if (profileLink) {
                    authorUrl = profileLink.href;
                    // Próbujemy wyciągnąć czysty tekst z linku
                    author = profileLink.innerText.split('\n')[0].trim(); // Czasem jest tam też data
                }

                // 2. Fallback: Szukanie w nagłówkach (tytuł posta to często "Autor > Grupa" lub samo "Autor")
                if (author === 'Nieznany' || !author) {
                    const headerStrong = el.querySelector('strong'); // Często autor jest w pierwszym strongu
                    if (headerStrong) {
                        author = headerStrong.innerText;
                    }
                }

                // 3. Fallback: Aria-labels
                if (author === 'Nieznany') {
                    const ariaElement = el.querySelector('[aria-label]');
                    if (ariaElement && ariaElement.getAttribute('aria-label').length < 50) {
                        // Czasem aria-label to po prostu nazwa autora
                        author = ariaElement.getAttribute('aria-label');
                    }
                }

                // 4. Fallback ostateczny: Pierwsza linia tekstu
                if (author === 'Nieznany') {
                    const contentText = el.innerText || '';
                    const firstLine = contentText.split('\n')[0].trim();
                    if (firstLine.length > 3 && firstLine.length < 30 && !/\d/.test(firstLine)) {
                        author = firstLine;
                    }
                }

                // --- TREŚĆ (Przywrócona) ---
                const contentNode = el.querySelector('[data-ad-comet-preview="message"]');
                const content = contentNode ? contentNode.innerText : (el.innerText || '');

                // --- URL POSTA & DATA ---
                // URL Posta: szukanie linku z datą/czasem (hover na datę pokazuje permalink)
                // Często ma aria-label zawierający czas np "1 godz."
                const permalinkNode = Array.from(el.querySelectorAll('a')).find(a =>
                    a.href.includes('/posts/') || a.href.includes('/permalink/')
                );

                // Czasami URL jest ukryty, trzeba go wyciągnąć
                const url = permalinkNode ? permalinkNode.href : '';

                // Data - zazwyczaj w elemencie z permalinkiem
                const postedAt = permalinkNode ? permalinkNode.innerText : new Date().toISOString();

                // ID posta (z URL)
                let externalId = '';
                if (url) {
                    const match = url.match(/\/posts\/(\d+)/) || url.match(/\/permalink\/(\d+)/);
                    if (match) externalId = match[1];
                }

                return {
                    title: content.substring(0, 50) + '...', // Tytuł to początek treści
                    textContent: content,
                    url: url,
                    externalId: externalId,
                    author: author,
                    authorUrl: authorUrl,
                    postedAtRaw: postedAt
                };
            }, postHandle);

            // Debug: Co widzi bot?
            // console.log('   DEBUG Post Data:', JSON.stringify({
            //    len: postData.textContent?.length,
            //    url: postData.url?.substring(0, 30),
            //    author: postData.author
            // }));

            // Walidacja - czy to faktycznie post (musi mieć autora i treść)
            if (!postData.textContent || postData.textContent.length < 5) {
                // console.log('   ⚠️ Pominięto: Zbyt krótka treść lub brak treści');
                continue;
            }
            if (!postData.url) {
                // console.log('   ⚠️ Pominięto: Brak URL');
                continue;
            }

            // Analiza słów kluczowych
            const matchResult = matchKeywords(postData.textContent);

            if (matchResult.matched) {
                console.log(`   🎯 TRAFIENIE: [${postData.author}] "${postData.title}"`);
                console.log(`      Keywords: ${matchResult.keywords.join(', ')}`);

                // Wyślij do n8n
                await sendToN8n({
                    source: 'Facebook Group',
                    groupName: CONFIG.group.name,
                    ...postData,
                    post_url: postData.url,     // Mapowanie dla n8n/Supabase
                    content: postData.textContent, // Mapowanie dla n8n/Supabase
                    matchedKeywords: matchResult.keywords,
                    category: matchResult.category,
                    scrapedAt: new Date().toISOString()
                });
                processedCount++;
            }

        } catch (err) {
            console.error('   ❌ Błąd przetwarzania posta:', err.message);
            // Ignoruj błędy pojedynczych postów (np. reklamy, inne struktury)
        }
    }
}

/**
 * Główna funkcja
 */
async function runBot() {
    console.log('🚀 Uruchamiam FB Scanner Bot...');
    console.log(`🎯 Cel: ${CONFIG.group.name}`);

    let browser;
    try {
        browser = await puppeteer.launch({
            // Używamy systemowego Chrome - rozwiązuje problem crasha na macOS
            // Oraz jest BEZPIECZNIEJSZE dla FB (prawdziwa sygnatura przeglądarki)
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: false, // Dla bezpieczeństwa session i unikania detekcji lepiej użyć headed lub "new"
            args: [
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
            ]
        });
    } catch (err) {
        console.error('❌ Błąd uruchamiania puppeteer.launch:', err);
        return;
    }

    try {
        const page = await browser.newPage();

        // Ukryj WebDriver
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // Załaduj cookies
        await loadCookies(page);

        // Wejdź na stronę
        console.log(`🔗 Nawigacja do: ${CONFIG.group.url}`);
        await page.goto(CONFIG.group.url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Losowe opóźnienie "rozruchowe"
        await sleep(humanDelay('afterPageLoad'));

        // Wybór trybu
        if (CONFIG.group.isMock || CONFIG.group.url.includes('reddit')) {
            await scrapeReddit(page);
        } else {
            await scrapeFacebook(page);
        }

    } catch (error) {
        console.error('❌ Krytyczny błąd bota (runtime):', error);
    } finally {
        if (browser) {
            console.log('🔒 Zamykam sesję...');
            await browser.close();
        }
    }
}

// Uruchomienie i obsługa błędów top-level
runBot().catch(err => {
    console.error('❌ Nieobsłużony błąd (Top Level):', err);
});
