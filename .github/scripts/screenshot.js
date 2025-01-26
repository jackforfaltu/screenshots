const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshot() {
    console.log('Starting screenshot capture process...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        console.log('Browser launched successfully');
        const page = await browser.newPage();
        
        // Set viewport to a common mobile size
        await page.setViewport({
            width: 375,
            height: 812,
            deviceScaleFactor: 2
        });
        console.log('Viewport set');

        // Navigate to the website
        console.log('Navigating to website...');
        await page.goto('https://hijri-waras-cal.netlify.app/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        console.log('Navigation complete');

        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Waited for content');

        // Capture timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const timestampPath = path.join('screenshots', `calendar-${timestamp}.png`);
        const latestPath = path.join('screenshots', 'latest.png');

        // Take screenshots
        console.log(`Taking screenshot: ${timestampPath}`);
        await page.screenshot({
            path: timestampPath,
            fullPage: false
        });

        console.log(`Taking screenshot: ${latestPath}`);
        await page.screenshot({
            path: latestPath,
            fullPage: false
        });

        // Verify files were created
        console.log('Verifying files...');
        const timestampExists = fs.existsSync(timestampPath);
        const latestExists = fs.existsSync(latestPath);
        
        console.log(`Timestamp file exists: ${timestampExists}`);
        console.log(`Latest file exists: ${latestExists}`);

        if (!timestampExists || !latestExists) {
            throw new Error('Screenshot files were not created successfully');
        }

    } catch (error) {
        console.error('Error capturing screenshot:', error);
        process.exit(1);
    } finally {
        console.log('Closing browser');
        await browser.close();
    }
}

captureScreenshot().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
}); 
