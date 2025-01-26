const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function optimizeImage(inputPath, maxSizeKB = 70) {
    console.log(`Optimizing image: ${inputPath}`);
    const imageBuffer = await fs.promises.readFile(inputPath);
    let quality = 80;
    let optimizedBuffer = await sharp(imageBuffer)
        .jpeg({ quality })
        .toBuffer();

    while (optimizedBuffer.length > maxSizeKB * 1024 && quality > 20) {
        quality -= 5;
        console.log(`Reducing quality to ${quality}...`);
        optimizedBuffer = await sharp(imageBuffer)
            .jpeg({ quality })
            .toBuffer();
    }

    console.log(`Final image size: ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
    await fs.promises.writeFile(inputPath, optimizedBuffer);
}

async function updateLatestImage(sourcePath, targetPath) {
    await fs.promises.copyFile(sourcePath, targetPath);
}

async function captureScreenshot() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ 
            width: 375, 
            height: 812,
            deviceScaleFactor: 2
        });
        
        console.log('Navigating to site...');
        await page.goto('https://hijri-waras-cal.netlify.app/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Add debug logging
        console.log('Page loaded, checking content...');
        const content = await page.content();
        console.log('Page content length:', content.length);
        
        // Wait for any element to be visible first
        console.log('Waiting for body element...');
        await page.waitForSelector('body', { timeout: 5000 });

        // Try different selectors
        console.log('Looking for calendar elements...');
        const selectors = [
            '#calendar-widget',
            '.calendar-widget',
            '[data-testid="calendar-widget"]',
            '.widget-container'
        ];

        for (const selector of selectors) {
            console.log(`Checking for selector: ${selector}`);
            const element = await page.$(selector);
            if (element) {
                console.log(`Found element with selector: ${selector}`);
                break;
            }
        }

        // Wait a bit longer for any dynamic content
        console.log('Waiting for page to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = path.join(process.cwd(), 'screenshots');
        const timestampPath = path.join(screenshotDir, `calendar-${timestamp}.jpg`);
        const latestPath = path.join(screenshotDir, 'latest.jpg');

        console.log('Taking screenshot...');
        await page.screenshot({
            path: timestampPath,
            type: 'jpeg',
            quality: 80
        });

        console.log('Optimizing screenshot...');
        await optimizeImage(timestampPath);
        await updateLatestImage(timestampPath, latestPath);

    
