const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'Design', 'User-Wiki', 'images');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

async function capture() {
    // Wait a moment for the server to fully initialize
    console.log('Waiting for BookBoss dev server...');
    await new Promise(r => setTimeout(r, 10000));

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    try {
        // 1. Login Page
        console.log('Navigating to login...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: path.join(imgDir, 'login.png') });

        // Login using default credentials assuming DB restarted
        await page.type('input[type="text"]', 'admin');
        await page.type('input[type="password"]', 'admin');
        await page.click('button[type="submit"]');

        // Wait for the Dashboard book grid to appear instead of waiting for full network idle
        await page.waitForSelector('.book-grid', { timeout: 10000 });

        // Let books load
        await new Promise(r => setTimeout(r, 2000));

        // 2. Dashboard
        console.log('Capturing Dashboard...');
        await page.screenshot({ path: path.join(imgDir, 'dashboard.png') });

        // 3. Add Book Modal
        console.log('Capturing Add Book...');
        const addBtn = await page.$('.fab');
        if (addBtn) {
            await addBtn.click();
            await new Promise(r => setTimeout(r, 1000)); // wait for modal animation
            await page.screenshot({ path: path.join(imgDir, 'add-book.png') });

            // close modal
            const closeBtn = await page.$('.modal-close');
            if (closeBtn) await closeBtn.click();
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log('Screenshots captured successfully!');
    } catch (error) {
        console.error('Error during capture:', error);
    } finally {
        await browser.close();
    }
}

capture();
