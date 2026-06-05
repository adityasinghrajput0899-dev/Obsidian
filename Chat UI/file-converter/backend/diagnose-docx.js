'use strict';
/**
 * Diagnostic script — extracts all images from a DOCX and saves them
 * alongside preprocessed versions so you can see exactly what Tesseract sees.
 *
 * Usage:
 *   node diagnose-docx.js "path\to\file.docx"
 *
 * Output: ./diag/ folder with original + preprocessed images + OCR text files
 */

const mammoth = require('mammoth');
const sharp   = require('sharp');
const Tesseract = require('tesseract.js');
const fs      = require('fs-extra');
const path    = require('path');

const docxPath = process.argv[2];
if (!docxPath) {
  console.error('Usage: node diagnose-docx.js "path\\to\\file.docx"');
  process.exit(1);
}

const DIAG_DIR = path.join(__dirname, 'diag');
fs.ensureDirSync(DIAG_DIR);

async function run() {
  console.log(`\nAnalysing: ${docxPath}\n`);
  let imageIndex = 0;

  await mammoth.convertToHtml(
    { path: docxPath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        imageIndex++;
        const idx       = imageIndex;
        const imgBuffer = await image.read();
        const contentType = image.contentType || 'image/png';
        const ext       = contentType.split('/')[1] || 'png';

        // Save original
        const origPath = path.join(DIAG_DIR, `img${idx}_original.${ext}`);
        await fs.writeFile(origPath, imgBuffer);

        // Get metadata
        const meta = await sharp(imgBuffer).metadata();
        console.log(`Image ${idx}: ${meta.width}×${meta.height}px, format=${meta.format}, size=${(imgBuffer.length/1024).toFixed(1)}KB`);

        // Save greyscale+normalised
        const greyBuf = await sharp(imgBuffer)
          .greyscale().normalise()
          .png().toBuffer();
        await fs.writeFile(path.join(DIAG_DIR, `img${idx}_grey.png`), greyBuf);

        // Save binarised (threshold 140)
        const bin140 = await sharp(imgBuffer)
          .greyscale().normalise().threshold(140)
          .png().toBuffer();
        await fs.writeFile(path.join(DIAG_DIR, `img${idx}_bin140.png`), bin140);

        // Save binarised (threshold 180 — lighter threshold)
        const bin180 = await sharp(imgBuffer)
          .greyscale().normalise().threshold(180)
          .png().toBuffer();
        await fs.writeFile(path.join(DIAG_DIR, `img${idx}_bin180.png`), bin180);

        // Save 3× upscaled binarised
        const upscaled = await sharp(imgBuffer)
          .resize(meta.width * 3, meta.height * 3, { kernel: sharp.kernel.lanczos3 })
          .greyscale().normalise().threshold(160)
          .png().toBuffer();
        await fs.writeFile(path.join(DIAG_DIR, `img${idx}_3x_bin160.png`), upscaled);

        // Run OCR on each variant and log results
        const variants = [
          { name: 'original',    buf: imgBuffer,  psm: '6'  },
          { name: 'grey',        buf: greyBuf,    psm: '6'  },
          { name: 'bin140/psm6', buf: bin140,     psm: '6'  },
          { name: 'bin140/psm3', buf: bin140,     psm: '3'  },
          { name: 'bin180/psm6', buf: bin180,     psm: '6'  },
          { name: 'bin180/psm11',buf: bin180,     psm: '11' },
          { name: '3x_bin160',   buf: upscaled,   psm: '6'  },
          { name: '3x_bin160/p3',buf: upscaled,   psm: '3'  },
        ];

        console.log(`\n  OCR results for Image ${idx}:`);
        const results = [];

        for (const v of variants) {
          const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
          await worker.setParameters({
            tessedit_ocr_engine_mode : '1',
            tessedit_pageseg_mode    : v.psm,
            preserve_interword_spaces: '1',
          });
          const { data } = await worker.recognize(v.buf);
          await worker.terminate();

          const text = data.text.trim();
          const conf = Math.round(data.confidence);
          console.log(`    [${v.name.padEnd(18)}] conf=${String(conf).padStart(3)}%  chars=${String(text.length).padStart(4)}  preview: ${text.slice(0,80).replace(/\n/g,' ')}`);
          results.push({ variant: v.name, conf, chars: text.length, text });
        }

        // Save all OCR text to a file
        const txtPath = path.join(DIAG_DIR, `img${idx}_ocr_results.txt`);
        const txtContent = results.map(r =>
          `=== ${r.variant} (conf=${r.conf}%, chars=${r.chars}) ===\n${r.text}\n`
        ).join('\n');
        await fs.writeFile(txtPath, txtContent, 'utf8');
        console.log(`\n  Saved: ${DIAG_DIR}`);

        return { src: `img${idx}` };
      }),
    }
  );

  if (imageIndex === 0) {
    console.log('\nNo images found in this DOCX.');
    console.log('The "Audit Steps" content may be a real Word table (not an image).');
    console.log('Check if mammoth extracted it as HTML table tags instead.');
  } else {
    console.log(`\n✓ Done. ${imageIndex} image(s) extracted to: ${DIAG_DIR}`);
    console.log('Open the diag/ folder to inspect the preprocessed images visually.');
  }
}

run().catch(console.error);
