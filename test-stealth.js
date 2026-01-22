const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    console.log('Testing STEALTH Puppeteer...');
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox']
        });
        console.log('✅ STEALTH Puppeteer launched successfully!');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('✅ Page loaded');
        await browser.close();
    } catch (e) {
        console.error('❌ STEALTH Puppeteer failed:', e);
    }
})();
