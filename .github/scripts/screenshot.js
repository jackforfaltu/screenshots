const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

async function optimizeImage(inputPath, maxSizeKB = 70, targetSize = null) {
    console.log(`Optimizing image: ${inputPath}`);
    const imageBuffer = await fs.promises.readFile(inputPath);
    let quality = 80;
    let sharpInstance = sharp(imageBuffer);

    // If target size is provided, fit the image to fill the dimensions
    if (targetSize) {
        sharpInstance = sharpInstance.resize(targetSize.width, targetSize.height, {
            fit: 'cover',
            position: 'center'
        });
    }

    let optimizedBuffer = await sharpInstance
        .jpeg({ quality })
        .toBuffer();

    while (optimizedBuffer.length > maxSizeKB * 1024 && quality > 20) {
        quality -= 5;
        console.log(`Reducing quality to ${quality}...`);
        optimizedBuffer = await sharpInstance
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
            width: 1200,
            height: 1200,
            deviceScaleFactor: 2
        });
        
        await page.goto('https://hijri-dates.pages.dev/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get the combined dimensions of the navigation and calendar grid
        const elementDimensions = await page.evaluate(() => {
            const nav = document.querySelector('nav.calendar-navigation');
            const calendar = document.querySelector('table#calendar-grid.calendar-grid');
            if (!nav || !calendar) {
                throw new Error('Required elements not found');
            }
            const navRect = nav.getBoundingClientRect();
            const calendarRect = calendar.getBoundingClientRect();
            const top = Math.min(navRect.top, calendarRect.top);
            const bottom = Math.max(navRect.bottom, calendarRect.bottom);
            const left = Math.min(navRect.left, calendarRect.left);
            const right = Math.max(navRect.right, calendarRect.right);
            return {
                x: left,
                y: top,
                width: right - left,
                height: bottom - top
            };
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = path.join(process.cwd(), 'screenshots');
        const timestampPath = path.join(screenshotDir, `calendar-${timestamp}.jpg`);
        const latestPath = path.join(screenshotDir, 'latest.jpg');

        // Capture the combined area without any modifications
        await page.screenshot({
            path: timestampPath,
            type: 'jpeg',
            quality: 80,
            clip: {
                x: elementDimensions.x,
                y: elementDimensions.y,
                width: elementDimensions.width,
                height: elementDimensions.height
            }
        });

        // Resize the image while maintaining aspect ratio
        const imageBuffer = await fs.promises.readFile(timestampPath);
        const resizedImage = await sharp(imageBuffer)
            .resize(360, 376, {
                fit: 'fill'
            })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Write the resized image
        await fs.promises.writeFile(timestampPath, resizedImage);

        // Update latest image
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
