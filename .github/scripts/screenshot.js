const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function optimizeImage(inputPath, maxSizeKB = 70) {
    console.log(`Optimizing image: ${inputPath}`);
    const imageBuffer = await fs.promises.readFile(inputPath);
    let quality = 80;
    let optimizedBuffer = await sharp(imageBuffer)
        .resize(375, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
        .jpeg({ quality })
        .toBuffer();

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
    await fs.promises.writeFile(inputPath, optimizedBuffer, { mode: 0o666 });
}

async function updateLatestImage(sourcePath, targetPath) {
    console.log(`Updating latest image from ${sourcePath} to ${targetPath}`);
    
    if (fs.existsSync(targetPath)) {
        console.log('Removing existing latest.jpg');
        fs.unlinkSync(targetPath);
    }

    const imageBuffer = await fs.promises.readFile(sourcePath);
    
    console.log('Writing new latest.jpg');
    await fs.promises.writeFile(targetPath, imageBuffer, { mode: 0o666 });
    
    const fileExists = fs.existsSync(targetPath);
    const fileSize = fs.statSync(targetPath).size;
    console.log(`Latest.jpg exists: ${fileExists}, size: ${(fileSize / 1024).toFixed(2)}KB`);
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
        
        await page.setViewport({
            width: 375,
            height: 812,
            deviceScaleFactor: 2
        });
        console.log('Viewport set');

        console.log('Navigating to website...');
        await page.goto('https://hijri-waras-cal.netlify.app/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        console.log('Navigation complete');

        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Waited for content');

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const timestampPath = path.join('screenshots', `calendar-${timestamp}.jpg`);
        const latestPath = path.join('screenshots', 'latest.jpg');

        console.log(`Taking screenshot: ${timestampPath}`);
        await page.screenshot({
            path: timestampPath,
            fullPage: false,
            type: 'jpeg',
            quality: 80
        });

        await optimizeImage(timestampPath);
        await updateLatestImage(timestampPath, latestPath);

        console.log('Verifying files...');
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
        console.log('Closing browser');
        await browser.close();
    }
}
