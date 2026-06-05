const puppeteer = require('puppeteer');
const path = require('path');

async function convertHtmlToPdf() {
    const inputPath = path.join(__dirname, '..', '..', 'PROJECT_FLOWCHART_1.html');
    const outputPath = path.join(__dirname, '..', '..', 'PROJECT_FLOWCHART_2.pdf');

    console.log('🚀 Starting HTML to PDF conversion...');
    console.log(`📁 Input: ${inputPath}`);
    console.log(`📄 Output: ${outputPath}`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Set viewport for better PDF rendering
        await page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 1
        });

        // Load the HTML file
        await page.goto(`file://${inputPath}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // Wait for Mermaid diagrams to render
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate PDF
        await page.pdf({
            path: outputPath,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 20px;">
                    <span>Project Obsidian - System Architecture Flowchart v2.0</span>
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 20px;">
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>
            `
        });

        console.log('✅ PDF conversion completed successfully!');
        console.log(`📄 Saved as: ${outputPath}`);

    } catch (error) {
        console.error('❌ Error during conversion:', error);
    } finally {
        await browser.close();
    }
}

// Run the conversion
convertHtmlToPdf().catch(console.error);