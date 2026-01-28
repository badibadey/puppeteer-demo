console.log('✅ Loaded lib/proxy-rotation.js');

/**
 * Zarządza rotacją proxy i dodatkowym maskingiem
 */
class ProxyRotation {
    constructor(config = {}) {
        // Lista proxy (może być pusta - wtedy używa direct connection)
        this.proxies = config.proxies || [];
        this.currentIndex = 0;
        this.failedProxies = new Set(); // Track failed proxies
        
        // Dodatkowe headers dla maskowania
        this.headers = [
            {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0'
            },
            {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            }
        ];
    }

    /**
     * Pobiera następne proxy (lub null dla direct connection)
     */
    getNextProxy() {
        if (this.proxies.length === 0) {
            return null; // Direct connection
        }

        // Spróbuj znaleźć działające proxy
        let attempts = 0;
        while (attempts < this.proxies.length) {
            const proxy = this.proxies[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
            
            if (!this.failedProxies.has(proxy)) {
                return proxy;
            }
            attempts++;
        }

        // Wszystkie proxy zawiodły, użyj direct connection
        console.warn('⚠️ Wszystkie proxy zawiodły, używam direct connection');
        return null;
    }

    /**
     * Oznacza proxy jako niedziałające
     */
    markProxyFailed(proxy) {
        if (proxy) {
            this.failedProxies.add(proxy);
            console.warn(`❌ Proxy oznaczone jako niedziałające: ${proxy}`);
        }
    }

    /**
     * Resetuje listę zawiedzionych proxy
     */
    resetFailedProxies() {
        this.failedProxies.clear();
        console.log('🔄 Resetowano listę zawiedzionych proxy');
    }

    /**
     * Pobiera losowe headers
     */
    getRandomHeaders() {
        const baseHeaders = this.headers[Math.floor(Math.random() * this.headers.length)];
        
        // Dodaj losowe dodatki
        const variations = [
            { 'Sec-CH-UA': '"Google Chrome";v="120", "Chromium";v="120", "Not=A?Brand";v="99"' },
            { 'Sec-CH-UA-Mobile': '?0' },
            { 'Sec-CH-UA-Platform': '"Windows"' },
            { 'Sec-GPC': '1' }, // Global Privacy Control
        ];

        // Dodaj losowe variations
        const finalHeaders = { ...baseHeaders };
        const numVariations = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numVariations; i++) {
            const variation = variations[Math.floor(Math.random() * variations.length)];
            Object.assign(finalHeaders, variation);
        }

        return finalHeaders;
    }

    /**
     * Konfiguruje Puppeteer z proxy
     */
    async configurePuppeteerWithProxy(puppeteerOptions, proxy = null) {
        const options = { ...puppeteerOptions };

        if (proxy) {
            console.log(`🌐 Konfiguruję proxy: ${proxy}`);
            
            // Parsuj proxy (format: username:password@host:port lub host:port)
            let proxyUrl = proxy;
            if (!proxy.startsWith('http')) {
                proxyUrl = `http://${proxy}`;
            }

            options.args = options.args || [];
            options.args.push(`--proxy-server=${proxyUrl}`);
            
            // Dodatkowe opcje dla proxy
            options.args.push('--proxy-bypass-list=<-loopback>');
        }

        return options;
    }

    /**
     * Testuje połączenie z proxy
     */
    async testProxy(browser, proxy) {
        try {
            const page = await browser.newPage();
            
            // Ustaw krótki timeout
            page.setDefaultTimeout(5000);
            
            // Spróbuj połączyć się z testową stroną
            const response = await page.goto('https://httpbin.org/ip', { 
                waitUntil: 'networkidle0',
                timeout: 5000 
            });
            
            if (response && response.ok()) {
                const data = await page.evaluate(() => {
                    try {
                        return JSON.parse(document.body.innerText);
                    } catch (e) {
                        return null;
                    }
                });
                
                await page.close();
                
                if (data && data.origin) {
                    console.log(`✅ Proxy działa: ${proxy} (IP: ${data.origin})`);
                    return true;
                }
            }
            
            await page.close();
            return false;
            
        } catch (error) {
            console.warn(`❌ Test proxy nieudany: ${proxy} - ${error.message}`);
            return false;
        }
    }

    /**
     * Symuluje różne prędkości połączenia
     */
    simulateNetworkConditions(page, connectionType = '4g') {
        const connections = {
            'slow-3g': {
                offline: false,
                downloadThroughput: 500 * 1024 / 8,  // 500 Kbps
                uploadThroughput: 500 * 1024 / 8,    // 500 Kbps
                latency: 400
            },
            '3g': {
                offline: false,
                downloadThroughput: 1.6 * 1024 * 1024 / 8,  // 1.6 Mbps
                uploadThroughput: 750 * 1024 / 8,           // 750 Kbps
                latency: 150
            },
            '4g': {
                offline: false,
                downloadThroughput: 4 * 1024 * 1024 / 8,    // 4 Mbps
                uploadThroughput: 3 * 1024 * 1024 / 8,      // 3 Mbps
                latency: 20
            },
            'broadband': {
                offline: false,
                downloadThroughput: 10 * 1024 * 1024 / 8,   // 10 Mbps
                uploadThroughput: 5 * 1024 * 1024 / 8,      // 5 Mbps
                latency: 10
            }
        };

        const connection = connections[connectionType] || connections['4g'];
        
        return page.emulateNetworkConditions(connection);
    }
}

module.exports = ProxyRotation;
