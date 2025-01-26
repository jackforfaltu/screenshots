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

        console.log('Waiting for calendar widget...');
        await page.waitForSelector('#calendar-widget', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for animations

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

        // Verify files were created
        const timestampExists = fs.existsSync(timestampPath);
        const latestExists = fs.existsSync(latestPath);
        
        console.log(`Timestamp file exists: ${timestampExists}`);
        console.log(`Latest file exists: ${latestExists}`);

        if (!timestampExists || !latestExists) {
            throw new Error('Screenshot files were not created successfully');
        }

        const timestampSize = fs.statSync(timestampPath).size / 1024;
        const latestSize = fs.statSync(latestPath).size / 1024;
        console.log(`Final timestamp file size: ${timestampSize.toFixed(2)}KB`);
        console.log(`Final latest file size: ${latestSize.toFixed(2)}KB`);

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
