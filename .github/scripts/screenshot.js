const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function optimizeImage(inputPath, maxSizeKB = 70) {
    console.log(`Optimizing image: ${inputPath}`);
    const imageBuffer = await fs.promises.readFile(inputPath);
    let quality = 80;
    let optimizedBuffer = await sharp(imageBuffer)
        .resize(375, null, { // Width of 375px, height auto
            withoutEnlargement: true,
            fit: 'inside'
        })
        .jpeg({ quality }) // Convert to JPEG for better compression
        .toBuffer();

    // Gradually reduce quality until file size is under maxSizeKB
    while (optimizedBuffer.length > maxSizeKB * 1024 && quality > 20) {
        quality -= 5;
        console.log(`Reducing quality to ${quality}...`);
        optimizedBuffer = await sharp(imageBuffer)
            .resize(375, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality })
            .toBuffer();
    }

    console.log(`Final image size: ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
    await fs.promises.writeFile(inputPath, optimizedBuffer);
}

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

    