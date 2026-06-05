'use strict';

const express    = require('express');
const cors       = require('cors');
const fs         = require('fs-extra');
const path       = require('path');
const multer     = require('multer');
const xlsx       = require('xlsx');
const mammoth    = require('mammoth');
const pdfParse   = require('pdf-parse');
const Tesseract  = require('tesseract.js');
const sharp      = require('sharp');
const { parse: parseCSV } = require('csv-parse/sync');
const { marked }           = require('marked');
const PDFDocument          = require('pdfkit');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, convertInchesToTwip,
} = require('docx');

const CONFIG = {
  port            : 3002,
  host            : '0.0.0.0',
  uploadDir       : path.join(__dirname, 'uploads'),
  destDir         : path.resolve('C:\\Users\\adisba\\OneDrive - amazon.com\\PROJECT UI\\Chat UI\\Obsidian database'),
  debugDir        : path.join(__dirname, 'debug-images'),
  maxFileSizeMB   : 50,
  ocrMinConfidence: 50,
  supported       : ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt', '.md',
                     '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'],
  imageExts       : new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']),
};

fs.ensureDirSync(CONFIG.uploadDir);
fs.ensureDirSync(CONFIG.destDir);
fs.ensureDirSync(CONFIG.debugDir);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONFIG.uploadDir),
  filename   : (_req, file, cb) => {
    const stem = path.basename(file.originalname, path.extname(file.originalname));
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${stem}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits    : { fileSize: CONFIG.maxFileSizeMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    CONFIG.supported.includes(ext) ? cb(null, true) : cb(new Error(`Unsupported file type: ${ext}`));
  },
});

function getTitle(originalName) {
  return path.basename(originalName, path.extname(originalName));
}

function buildMarkdownDocument(title, body, sourceFile) {
  const convertedDate = new Date().toISOString().split('T')[0];
  const convertedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return [
    `# ${title}`, '',
    '> [!INFO] Conversion Metadata',
    `> **Source file:** \`${sourceFile}\``,
    `> **Converted on:** ${convertedDate} at ${convertedTime}`,
    '', '---', '', body.trim(), '',
  ].join('\n');
}

// ── PDF ──────────────────────────────────────────────────────
async function convertPDF(filePath) {
  const buffer = await fs.readFile(filePath);
  const rawContent = buffer.toString('utf8', 0, 512);
  if (rawContent.includes('==UserScript==')) {
    return ['> [!NOTE] Userscript Detected', '```javascript', buffer.toString('utf8').trimEnd(), '```'].join('\n');
  }
  const data = await pdfParse(buffer);
  const formatted = data.text.split('\n').map(l => l.trimEnd()).map(line => {
    const t = line.trim();
    if (!t) return '';
    if (t.length < 80 && t === t.toUpperCase() && /[A-Z]/.test(t)) return `\n## ${t}\n`;
    return line;
  });
  return formatted.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Image preprocessing — never throws ───────────────────────
async function preprocessImageForOCR(imageBuffer, label) {
  if (!imageBuffer || imageBuffer.length < 16) {
    console.warn(`[PREPROCESS]  ${label} — buffer too small, skipping`);
    return null;
  }
  let meta;
  try { meta = await sharp(imageBuffer).metadata(); }
  catch (e) { console.warn(`[PREPROCESS]  ${label} — unsupported format: ${e.message}`); return null; }

  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) { console.warn(`[PREPROCESS]  ${label} — zero dimensions`); return null; }

  try {
    const TARGET_PX   = 2400;
    const scaleFactor = Math.max(width, height) < TARGET_PX ? TARGET_PX / Math.max(width, height) : 1;
    console.log(`[PREPROCESS]  ${label} — ${width}×${height}px  format=${meta.format}  scale×${scaleFactor.toFixed(2)}`);

    let base = sharp(imageBuffer);
    if (scaleFactor > 1) {
      base = base.resize(Math.round(width * scaleFactor), Math.round(height * scaleFactor),
        { kernel: sharp.kernel.lanczos3, fit: 'fill' });
    }
    base = base.greyscale().normalise();

    const standard     = await base.clone().sharpen({ sigma: 1.5, m1: 1.0, m2: 0.5 }).median(1).png({ compressionLevel: 1 }).toBuffer();
    const highContrast = await base.clone().threshold(140).png({ compressionLevel: 1 }).toBuffer();
    return { standard, highContrast };
  } catch (e) {
    console.warn(`[PREPROCESS]  ${label} — processing failed: ${e.message}`);
    return null;
  }
}

// ── Single Tesseract pass — never throws ─────────────────────
async function tesseractPass(imgBuffer, psm) {
  try {
    const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    await worker.setParameters({
      tessedit_ocr_engine_mode : '1',
      tessedit_pageseg_mode    : psm,
      preserve_interword_spaces: '1',
    });
    const { data } = await worker.recognize(imgBuffer);
    await worker.terminate();
    let text = data.text.trim();
    const attempt = Buffer.from(text, 'latin1').toString('utf8');
    if (!attempt.includes('\uFFFD')) text = attempt;
    return { text, confidence: Math.round(data.confidence) };
  } catch (e) {
    return { text: '', confidence: 0 };
  }
}

// ── Main OCR entry — never throws, never crashes server ──────
async function ocrImageBuffer(imageBuffer, label, debugSlug) {
  console.log(`[OCR]         Recognising: ${label} (${imageBuffer?.length ?? 0} bytes)`);
  try {
    const preprocessed = await preprocessImageForOCR(imageBuffer, label);

    // Save debug images (non-fatal if it fails)
    if (preprocessed) {
      try {
        const slug      = (debugSlug || label).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
        const ts        = Date.now();
        const origPng   = await sharp(imageBuffer).png({ compressionLevel: 1 }).toBuffer();
        await fs.writeFile(path.join(CONFIG.debugDir, `${slug}_${ts}_original.png`),     origPng);
        await fs.writeFile(path.join(CONFIG.debugDir, `${slug}_${ts}_standard.png`),     preprocessed.standard);
        await fs.writeFile(path.join(CONFIG.debugDir, `${slug}_${ts}_highcontrast.png`), preprocessed.highContrast);
        console.log(`[OCR]         Debug images saved → ${CONFIG.debugDir}`);
      } catch (dbgErr) {
        console.warn(`[OCR]         Debug save skipped: ${dbgErr.message}`);
      }
    }

    // Choose buffers to run OCR on
    const std = preprocessed ? preprocessed.standard     : imageBuffer;
    const hc  = preprocessed ? preprocessed.highContrast : imageBuffer;

    const [passA, passB, passC, passD] = await Promise.all([
      tesseractPass(std, '6'),
      tesseractPass(std, '3'),
      tesseractPass(hc,  '6'),
      tesseractPass(hc,  '11'),
    ]);

    const passes = [
      { name: 'std/PSM6',  ...passA },
      { name: 'std/PSM3',  ...passB },
      { name: 'hc/PSM6',   ...passC },
      { name: 'hc/PSM11',  ...passD },
    ];

    const best = passes.filter(p => p.text.length > 0).sort((a, b) => b.confidence - a.confidence)[0] || passes[0];
    passes.forEach(p => console.log(`[OCR]           [${p.name}] conf=${p.confidence}%  chars=${p.text.length}`));
    console.log(`[OCR]         Best: [${best.name}] conf=${best.confidence}%  chars=${best.text.length}`);

    return { text: best.text, confidence: best.confidence };
  } catch (err) {
    console.warn(`[OCR]         Failed for ${label}: ${err.message}`);
    return { text: '', confidence: 0 };
  }
}

// ── DOCX ─────────────────────────────────────────────────────
async function convertDOCX(filePath, docTitle) {
  let imageIndex = 0;
  const ocrBlocks = {};

  const result = await mammoth.convertToHtml({ path: filePath }, {
    convertImage: mammoth.images.imgElement(async (image) => {
      imageIndex += 1;
      const label     = `${docTitle} — image ${imageIndex}`;
      const imgBuffer = await image.read();
      const { text, confidence } = await ocrImageBuffer(imgBuffer, label, `${docTitle}_img${imageIndex}`);
      const token = `__IMG_OCR_${imageIndex}__`;
      ocrBlocks[token] = { text, confidence, index: imageIndex };
      return { src: token };
    }),
  });

  let html = result.value;

  // Headings
  html = html.replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, n, t) => `\n${'#'.repeat(+n)} ${t}\n`);

  // Bold / italic
  html = html.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  html = html.replace(/<b[^>]*>(.*?)<\/b>/gi,           '**$1**');
  html = html.replace(/<em[^>]*>(.*?)<\/em>/gi,         '*$1*');
  html = html.replace(/<i[^>]*>(.*?)<\/i>/gi,           '*$1*');

  // OCR image blocks
  html = html.replace(/<img[^>]*src="(__IMG_OCR_\d+__)"[^>]*>/gi, (_, token) => {
    const block = ocrBlocks[token];
    if (!block) return '';
    const conf = block.confidence;

    if (block.text && conf >= CONFIG.ocrMinConfidence) {
      const lines = block.text.split('\n').filter(l => l.trim()).map(l => `> ${l}`).join('\n');
      return `\n> [!NOTE] Image ${block.index} — OCR extracted text (confidence: ${conf}%)\n${lines}\n`;
    }
    if (block.text && conf < CONFIG.ocrMinConfidence) {
      return [
        '',
        `> [!WARNING] Image ${block.index} — Low OCR confidence (${conf}%)`,
        `> The image could not be read reliably. It may be corrupted, a diagram, or an empty table.`,
        `> **⚠ Manual review required** — check the original source file for this content.`,
        '',
      ].join('\n');
    }
    return `\n> [!WARNING] Image ${block.index} — No readable text found (diagram, chart, or empty table)\n`;
  });

  // Lists
  html = html.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
  html = html.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // Paragraphs / line breaks
  html = html.replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/<\/p>/gi, '\n\n');
  html = html.replace(/<p[^>]*>/gi, '');

  // Tables
  html = html.replace(/<table[^>]*>/gi, '\n');
  html = html.replace(/<\/table>/gi, '\n');
  html = html.replace(/<tr[^>]*>/gi, '');
  html = html.replace(/<\/tr>/gi, '\n');
  html = html.replace(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi, '| $1 ');
  html = html.replace(/(\| .+)\n/g, '$1|\n');

  // Strip remaining tags + decode entities
  html = html.replace(/<[^>]+>/g, '');
  html = html.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
             .replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ')
             .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  return html.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Standalone image ─────────────────────────────────────────
async function convertImageFile(filePath, originalName) {
  const ext    = path.extname(originalName).toLowerCase();
  const stat   = await fs.stat(filePath);
  const sizeKB = (stat.size / 1024).toFixed(1);
  const imgBuffer = await fs.readFile(filePath);
  const { text, confidence } = await ocrImageBuffer(imgBuffer, originalName, originalName);

  const lines = [
    `> [!NOTE] Image File`,
    `> **File:** \`${originalName}\` | **Size:** ${sizeKB} KB | **Type:** ${ext.replace('.', '').toUpperCase()}`,
    '',
  ];
  if (text && confidence >= CONFIG.ocrMinConfidence) {
    lines.push(`> [!SUCCESS] OCR confidence: ${confidence}%`, '', '## Extracted Text', '', text, '');
  } else if (text) {
    lines.push(`> [!WARNING] Low OCR confidence (${confidence}%) — image may be corrupted or a diagram.`, `> **⚠ Manual review required.**`, '');
  } else {
    lines.push('> [!WARNING] No readable text could be extracted from this image.');
  }
  return lines.join('\n');
}

// ── XLSX ─────────────────────────────────────────────────────
function convertXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sections = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows  = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!rows.length) return;
    const headerRow = rows[0].map(String);
    const dataRows  = rows.slice(1);
    sections.push([
      `## Sheet: ${sheetName}`, '',
      `| ${headerRow.join(' | ')} |`,
      `| ${headerRow.map(() => '---').join(' | ')} |`,
      ...dataRows.map(row => `| ${headerRow.map((_, i) => String(row[i] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`),
      '',
    ].join('\n'));
  });
  return sections.join('\n') || '_No data found in workbook._';
}

// ── CSV ──────────────────────────────────────────────────────
function convertCSV(filePath) {
  const records = parseCSV(fs.readFileSync(filePath, 'utf8'), { skip_empty_lines: true });
  if (!records.length) return '_No data found in CSV file._';
  const headerRow = records[0].map(String);
  return [
    `| ${headerRow.join(' | ')} |`,
    `| ${headerRow.map(() => '---').join(' | ')} |`,
    ...records.slice(1).map(row => `| ${headerRow.map((_, i) => String(row[i] ?? '').replace(/\|/g, '\\|')).join(' | ')} |`),
  ].join('\n');
}

// ── TXT ──────────────────────────────────────────────────────
function convertTXT(filePath) { return fs.readFileSync(filePath, 'utf8'); }

// ── Router ───────────────────────────────────────────────────
async function convertFile(filePath, originalName) {
  const ext   = path.extname(originalName).toLowerCase();
  const title = getTitle(originalName);
  if (CONFIG.imageExts.has(ext)) return convertImageFile(filePath, originalName);
  switch (ext) {
    case '.pdf':  return convertPDF(filePath);
    case '.docx': return convertDOCX(filePath, title);
    case '.xlsx':
    case '.xls':  return convertXLSX(filePath);
    case '.csv':  return convertCSV(filePath);
    case '.txt':  return convertTXT(filePath);
    case '.md':   throw new Error('Use the Export section to convert .md files to other formats.');
    default:      throw new Error(`Unsupported format: ${ext}`);
  }
}

// ── API Routes ───────────────────────────────────────────────
app.get('/api/status', (_req, res) => res.json({
  status: 'running', port: CONFIG.port, destDir: CONFIG.destDir,
  supported: CONFIG.supported, timestamp: new Date().toISOString(),
}));

app.get('/api/converted-files', (_req, res) => {
  try {
    const files = fs.readdirSync(CONFIG.destDir)
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const stat = fs.statSync(path.join(CONFIG.destDir, f));
        return { name: f, sizeKB: Math.round(stat.size / 1024), modified: stat.mtime.toISOString().split('T')[0] };
      })
      .sort((a, b) => b.modified.localeCompare(a.modified));
    res.json({ files, total: files.length, destDir: CONFIG.destDir });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list converted files', details: err.message });
  }
});

app.post('/api/convert', upload.array('files', 20), async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded.' });

  const results = [];
  for (const file of req.files) {
    const originalName = file.originalname;
    const title        = getTitle(originalName);
    const outputName   = `${title}.md`;
    const outputPath   = path.join(CONFIG.destDir, outputName);
    console.log(`[CONVERTING]  ${originalName}`);
    try {
      const body            = await convertFile(file.path, originalName);
      const markdownContent = buildMarkdownDocument(title, body, originalName);
      await fs.writeFile(outputPath, markdownContent, 'utf8');
      await fs.remove(file.path);
      console.log(`[OK]          → ${outputName}`);
      results.push({ status: 'success', originalName, outputName, outputPath: CONFIG.destDir, sizeKB: Math.round(markdownContent.length / 1024) });
    } catch (err) {
      console.error(`[FAILED]      ${originalName} — ${err.message}`);
      await fs.remove(file.path).catch(() => {});
      results.push({ status: 'failed', originalName, error: err.message });
    }
  }

  const successCount = results.filter(r => r.status === 'success').length;
  const failCount    = results.filter(r => r.status === 'failed').length;
  console.log(`------------------------------------------------------------`);
  console.log(`  Converted: ${successCount}  |  Failed: ${failCount}`);
  console.log(`============================================================`);
  res.json({ summary: { total: results.length, converted: successCount, failed: failCount }, results });
});

// ── MD export (MD → DOCX / TXT) ──────────────────────────────
async function mdToDocx(mdText, title) {
  const tokens = marked.lexer(mdText);
  const children = [];

  function inlineRuns(text) {
    const runs = [];
    const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      if (m[2]) runs.push(new TextRun({ text: m[2], bold: true, italics: true }));
      else if (m[3]) runs.push(new TextRun({ text: m[3], bold: true }));
      else if (m[4]) runs.push(new TextRun({ text: m[4], italics: true }));
      else if (m[5]) runs.push(new TextRun({ text: m[5] }));
    }
    return runs.length ? runs : [new TextRun({ text })];
  }

  const headingMap = {
    1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6,
  };

  for (const token of tokens) {
    if (token.type === 'heading') {
      children.push(new Paragraph({ heading: headingMap[token.depth] || HeadingLevel.HEADING_1, children: inlineRuns(token.text) }));
    } else if (token.type === 'paragraph') {
      const clean = token.text.replace(/^>\s*\[!.*?\].*$/gm, '').replace(/^>\s*/gm, '').trim();
      if (clean) children.push(new Paragraph({ children: inlineRuns(clean) }));
    } else if (token.type === 'list') {
      for (const item of token.items) {
        children.push(new Paragraph({ bullet: { level: 0 }, children: inlineRuns(item.text) }));
      }
    } else if (token.type === 'hr') {
      children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '999999' } }, children: [new TextRun({ text: '' })] }));
    } else if (token.type === 'table') {
      const colW = Math.floor(9000 / token.header.length);
      const rows = [
        new TableRow({ children: token.header.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h.text, bold: true })] })], width: { size: colW, type: WidthType.DXA } })) }),
        ...token.rows.map(row => new TableRow({ children: row.map(cell => new TableCell({ children: [new Paragraph({ children: inlineRuns(cell.text) })], width: { size: colW, type: WidthType.DXA } })) })),
      ];
      children.push(new Table({ rows, width: { size: 9000, type: WidthType.DXA } }));
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
    } else if (token.type === 'code') {
      children.push(new Paragraph({ children: [new TextRun({ text: token.text, font: 'Courier New', size: 18 })] }));
    } else if (token.type === 'space') {
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }], title });
  return Packer.toBuffer(doc);
}

// ── MD → plain text helper ────────────────────────────────────
function mdToPlainText(mdText) {
  return mdText
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\|.+\|/g, '')          // strip table rows
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── MD → PDF buffer ───────────────────────────────────────────
function mdToPdf(mdText, title) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data',  c => chunks.push(c));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const lines = mdText.split('\n');
    for (const line of lines) {
      const h1 = line.match(/^# (.+)/);
      const h2 = line.match(/^## (.+)/);
      const h3 = line.match(/^### (.+)/);
      const li = line.match(/^[-*+] (.+)/);
      const bq = line.match(/^> (.+)/);
      const hr = line.match(/^---+$/);

      if (h1) {
        doc.moveDown(0.5).font('Helvetica-Bold').fontSize(18).text(h1[1]).moveDown(0.3);
      } else if (h2) {
        doc.moveDown(0.4).font('Helvetica-Bold').fontSize(14).text(h2[1]).moveDown(0.2);
      } else if (h3) {
        doc.moveDown(0.3).font('Helvetica-Bold').fontSize(12).text(h3[1]).moveDown(0.2);
      } else if (li) {
        doc.font('Helvetica').fontSize(10).text(`• ${li[1]}`, { indent: 15 });
      } else if (bq) {
        doc.font('Helvetica-Oblique').fontSize(10).fillColor('#555555')
           .text(bq[1], { indent: 20 }).fillColor('#000000');
      } else if (hr) {
        doc.moveDown(0.3)
           .moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.3);
      } else if (line.trim()) {
        // Strip inline bold/italic for PDF plain rendering
        const clean = line
          .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
        doc.font('Helvetica').fontSize(10).text(clean);
      } else {
        doc.moveDown(0.4);
      }
    }
    doc.end();
  });
}

// ── MD → CSV (extracts first markdown table) ─────────────────
function mdToCsv(mdText) {
  const tableLines = mdText.split('\n').filter(l => l.trim().startsWith('|'));
  if (!tableLines.length) {
    // No table — just export as plain text rows
    return mdToPlainText(mdText).split('\n').map(l => `"${l.replace(/"/g, '""')}"`).join('\n');
  }
  return tableLines
    .filter(l => !/^\|[-| :]+\|$/.test(l.trim()))  // skip separator rows
    .map(l =>
      l.trim().replace(/^\||\|$/g, '')
       .split('|')
       .map(cell => `"${cell.trim().replace(/"/g, '""')}"`)
       .join(',')
    ).join('\n');
}

// ── MD → XLSX buffer ──────────────────────────────────────────
function mdToXlsx(mdText, title) {
  const wb = xlsx.utils.book_new();

  // Try to find markdown tables
  const tableBlocks = [];
  let currentTable = [];
  for (const line of mdText.split('\n')) {
    if (line.trim().startsWith('|')) {
      currentTable.push(line);
    } else {
      if (currentTable.length > 1) tableBlocks.push(currentTable);
      currentTable = [];
    }
  }
  if (currentTable.length > 1) tableBlocks.push(currentTable);

  if (tableBlocks.length) {
    tableBlocks.forEach((block, i) => {
      const rows = block
        .filter(l => !/^\|[-| :]+\|$/.test(l.trim()))
        .map(l =>
          l.trim().replace(/^\||\|$/g, '')
           .split('|').map(c => c.trim())
        );
      const ws = xlsx.utils.aoa_to_sheet(rows);
      xlsx.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
    });
  } else {
    // No tables — export as single-column plain text
    const rows = mdToPlainText(mdText).split('\n').map(l => [l]);
    const ws = xlsx.utils.aoa_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Content');
  }

  return xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

app.post('/api/export', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

  const format = (req.query.format || 'docx').toLowerCase();
  const ext    = path.extname(req.file.originalname).toLowerCase();

  if (ext !== '.md') {
    await fs.remove(req.file.path).catch(() => {});
    return res.status(400).json({ error: 'Only .md files are accepted for export.' });
  }

  const stem   = path.basename(req.file.originalname, '.md');
  const mdText = await fs.readFile(req.file.path, 'utf8');
  await fs.remove(req.file.path).catch(() => {});

  try {
    switch (format) {
      case 'docx': {
        const buffer = await mdToDocx(mdText, stem);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.docx"`);
        return res.send(buffer);
      }
      case 'pdf': {
        const buffer = await mdToPdf(mdText, stem);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.pdf"`);
        return res.send(buffer);
      }
      case 'txt': {
        const plain = mdToPlainText(mdText);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.txt"`);
        return res.send(plain);
      }
      case 'csv': {
        const csv = mdToCsv(mdText);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.csv"`);
        return res.send(csv);
      }
      case 'xlsx':
      case 'xls': {
        const buffer = mdToXlsx(mdText, stem);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${stem}.xlsx"`);
        return res.send(buffer);
      }
      default:
        return res.status(400).json({ error: `Unsupported format: ${format}. Use docx, pdf, txt, csv, or xlsx.` });
    }
  } catch (err) {
    console.error(`[EXPORT]      Failed: ${err.message}`);
    return res.status(500).json({ error: `Export failed: ${err.message}` });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error: ${err.message}` });
  if (err) return res.status(400).json({ error: err.message });
});

// ── Start ────────────────────────────────────────────────────
app.listen(CONFIG.port, CONFIG.host, () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let wifiIP = null;
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal &&
          (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless'))) {
        wifiIP = net.address;
      }
    }
  }
  console.log('============================================================');
  console.log('  File-to-Markdown Converter — Server');
  console.log('============================================================');
  console.log(`  Local   : http://127.0.0.1:${CONFIG.port}`);
  if (wifiIP) console.log(`  Wi-Fi   : http://${wifiIP}:${CONFIG.port}`);
  console.log(`  Dest    : ${CONFIG.destDir}`);
  console.log(`  Formats : ${CONFIG.supported.join('  ')}`);
  console.log('============================================================');
  console.log('  Ready to convert files...');
  console.log('============================================================');
});
