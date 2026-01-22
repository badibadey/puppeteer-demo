const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('Testing SYSTEM CHROME...');
    try {
        const browser = await puppeteer.launch({
            headless: false, // System Chrome usually works better headed for debugging
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            args: ['--no-sandbox']
        });
        console.log('✅ SYSTEM CHROME launched successfully!');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('✅ Page loaded');
        await sleep(2000);
        await browser.close();
    } catch (e) {
        console.error('❌ SYSTEM CHROME failed:', e);
    }
})();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
