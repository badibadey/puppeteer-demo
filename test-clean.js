const puppeteer = require('puppeteer');

(async () => {
    console.log('Testing CLEAN Puppeteer...');
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox']
        });
        console.log('✅ CLEAN Puppeteer launched successfully!');
        const page = await browser.newPage();
        await page.goto('https://example.com');
        console.log('✅ Page loaded');
        await browser.close();
    } catch (e) {
        console.error('❌ CLEAN Puppeteer failed:', e);
    }
})();
