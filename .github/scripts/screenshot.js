const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshot() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // Set viewport to a common mobile size
        await page.setViewport({
            width: 375,
            height: 812,
            deviceScaleFactor: 2
        });

        // Navigate to the website and wait for network to be idle
        await page.goto('https://hijri-waras-cal.netlify.app/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Use setTimeout wrapped in a Promise instead of waitForTimeout
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Capture timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        // Take screenshot and save with timestamp
        await page.screenshot({
            path: path.join('screenshots', `calendar-${timestamp}.png`),
            fullPage: false
        });

        // Save as latest.png as well
        await page.screenshot({
            path: path.join('screenshots', 'latest.png'),
            fullPage: false
        });

    } catch (error) {
        console.error('Error capturing screenshot:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

captureScreenshot(); 
