console.log('✅ Loaded lib/device-fingerprint.js');

/**
 * Zarządza fingerprintingiem urządzenia - User-Agent, rozdzielczość, timezone
 */
class DeviceFingerprint {
    constructor() {
        this.userAgents = [
            // Windows Chrome
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            
            // macOS Chrome
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            
            // Windows Firefox
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            
            // macOS Safari
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15'
        ];

        this.viewports = [
            { width: 1920, height: 1080 }, // Full HD
            { width: 1366, height: 768 },  // Popular laptop
            { width: 1440, height: 900 },  // MacBook
            { width: 1536, height: 864 },  // Surface
            { width: 1280, height: 720 },  // HD
            { width: 1600, height: 900 },  // HD+
            { width: 2560, height: 1440 }, // 2K
            { width: 1920, height: 1200 }, // 16:10
        ];

        this.timezones = [
            'Europe/Warsaw',
            'Europe/London', 
            'Europe/Berlin',
            'Europe/Paris',
            'America/New_York',
            'America/Los_Angeles',
            'America/Chicago',
        ];

        this.languages = [
            ['pl-PL', 'pl', 'en'],
            ['en-US', 'en'],
            ['en-GB', 'en'],
            ['de-DE', 'de', 'en'],
        ];

        this.platforms = [
            'Win32',
            'MacIntel',
            'Linux x86_64',
        ];
    }

    /**
     * Generuje losowy fingerprint urządzenia
     */
    generateFingerprint() {
        return {
            userAgent: this.getRandomUserAgent(),
            viewport: this.getRandomViewport(),
            timezone: this.getRandomTimezone(),
            language: this.getRandomLanguage(),
            platform: this.getRandomPlatform(),
        };
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    getRandomViewport() {
        const viewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
        // Dodaj losowe przesunięcie dla naturalności
        return {
            width: viewport.width + Math.floor(Math.random() * 20) - 10,
            height: viewport.height + Math.floor(Math.random() * 20) - 10
        };
    }

    getRandomTimezone() {
        return this.timezones[Math.floor(Math.random() * this.timezones.length)];
    }

    getRandomLanguage() {
        return this.languages[Math.floor(Math.random() * this.languages.length)];
    }

    getRandomPlatform() {
        return this.platforms[Math.floor(Math.random() * this.platforms.length)];
    }

    /**
     * Aplikuje fingerprint do strony Puppeteer
     */
    async applyFingerprint(page, fingerprint = null) {
        const fp = fingerprint || this.generateFingerprint();
        
        console.log(`🔧 Fingerprint: ${fp.userAgent.substring(0, 50)}...`);
        console.log(`   📱 Rozdzielczość: ${fp.viewport.width}x${fp.viewport.height}`);
        console.log(`   🌍 Timezone: ${fp.timezone}`);
        
        // Ustaw User-Agent
        await page.setUserAgent(fp.userAgent);
        
        // Ustaw rozdzielczość
        await page.setViewport(fp.viewport);
        
        // Ustaw timezone i język
        await page.emulateTimezone(fp.timezone);
        
        // Ustaw języki
        await page.setExtraHTTPHeaders({
            'Accept-Language': fp.language.join(',')
        });
        
        // Nadpisz właściwości navigatora
        await page.evaluateOnNewDocument((platform, languages) => {
            // Platform
            Object.defineProperty(navigator, 'platform', {
                get: () => platform,
                configurable: true
            });
            
            // Języki
            Object.defineProperty(navigator, 'language', {
                get: () => languages[0],
                configurable: true
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => languages,
                configurable: true
            });
            
            // Hardware concurrency (losowa liczba wątków CPU)
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => Math.floor(Math.random() * 8) + 4, // 4-12 wątków
                configurable: true
            });
            
            // Device memory (losowa ilość pamięci)
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => [2, 4, 8, 16][Math.floor(Math.random() * 4)],
                configurable: true
            });
            
            // Screen properties
            Object.defineProperty(screen, 'colorDepth', {
                get: () => 24,
                configurable: true
            });
            
            Object.defineProperty(screen, 'pixelDepth', {
                get: () => 24,
                configurable: true
            });
        }, fp.platform, fp.language);
        
        return fp;
    }
}

module.exports = DeviceFingerprint;
