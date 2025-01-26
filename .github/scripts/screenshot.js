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

    await fs.promises.writeFile(inputPath, optimizedBuffer);
}

async function updateLatestImage(sourcePath, targetPath) {
    // Delete the existing latest.jpg if it exists
    if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
    }
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
        
        await page.goto('https://hijri-waras-cal.netlify.app/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 2000));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = path.join(process.cwd(), 'screenshots');
        const timestampPath = path.join(screenshotDir, `calendar-${timestamp}.jpg`);
        const latestPath = path.join(screenshotDir, 'latest.jpg');

        await page.screenshot({
            path: timestampPath,
            type: 'jpeg',
            quality: 80
        });

        await optimizeImage(timestampPath);
        await updateLatestImage(timestampPath, latestPath);

    } catch (error) {
        console.error('Error capturing screenshot:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

captureScreenshot().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
