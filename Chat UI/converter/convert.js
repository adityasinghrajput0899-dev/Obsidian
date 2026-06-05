'use strict';

/**
 * ============================================================
 * File-to-Markdown Converter
 * ============================================================
 * Description : Reads files from the SOURCE directory and
 *               converts them to Obsidian-compatible Markdown
 *               files written to the DESTINATION directory.
 *
 * Supported formats:
 *   - PDF    (.pdf)  — text-based or userscript content
 *   - Word   (.docx)
 *   - Excel  (.xlsx, .xls)
 *   - CSV    (.csv)
 *   - Plain text (.txt)
 *
 * Usage:
 *   node convert.js
 *
 * Author  : adisba
 * Version : 2.0.0
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// Dependencies
// ─────────────────────────────────────────────────────────────

const fs       = require('fs-extra');
const path     = require('path');
const xlsx     = require('xlsx');
const mammoth  = require('mammoth');
const { parse: parseCSV } = require('csv-parse/sync');

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const CONFIG = {
  sourceDir : 'C:\\Users\\adisba\\OneDrive - amazon.com\\PROJECT UI\\Chat UI\\Obsidian',
  destDir   : 'C:\\Users\\adisba\\OneDrive - amazon.com\\PROJECT UI\\Chat UI\\Obsidian database',
  supported : ['.pdf', '.docx', '.xlsx', '.xls', '.csv', '.txt'],
};

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

/**
 * Extracts the filename without extension to use as a document title.
 * @param {string} filePath - Absolute path to the file.
 * @returns {string} The filename stem.
 */
function getTitle(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/**
 * Wraps extracted content in a standard Markdown document structure.
 * @param {string} title - Document title used as the H1 heading.
 * @param {string} body  - Main content of the document.
 * @returns {string} A complete Markdown string.
 */
function buildMarkdownDocument(title, body) {
  const convertedDate = new Date().toISOString().split('T')[0];

  return [
    `# ${title}`,
    '',
    `> **Source file:** ${title}`,
    `> **Converted on:** ${convertedDate}`,
    '',
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// Format-Specific Converters
// ─────────────────────────────────────────────────────────────

/**
 * Converts a PDF file to plain text.
 * Note: If the file is a Tampermonkey userscript saved with a .pdf
 * extension, it is detected and wrapped in a JavaScript code block.
 *
 * @param {string} filePath - Absolute path to the .pdf file.
 * @returns {Promise<string>} Extracted text content.
 */
async function convertPDF(filePath) {
  const rawContent = await fs.readFile(filePath, 'utf8');

  if (rawContent.includes('==UserScript==')) {
    return [
      '> [!NOTE]',
      '> This file is a **Tampermonkey / Greasemonkey userscript** that was',
      '> saved with a `.pdf` extension. The source code is preserved below.',
      '',
      '```javascript',
      rawContent.trimEnd(),
      '```',
    ].join('\n');
  }

  return rawContent;
}

/**
 * Converts a Word (.docx) file to plain text.
 * @param {string} filePath - Absolute path to the .docx file.
 * @returns {Promise<string>} Extracted plain text.
 */
async function convertDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

/**
 * Converts an Excel (.xlsx / .xls) workbook to Markdown tables.
 * Each worksheet is rendered as a separate section with a Markdown table.
 *
 * @param {string} filePath - Absolute path to the Excel file.
 * @returns {string} Markdown representation of all sheets.
 */
function convertXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sections = [];

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows  = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rows.length === 0) return;

    const headerRow  = rows[0].map(String);
    const dataRows   = rows.slice(1);
    const separator  = headerRow.map(() => '---');

    const tableLines = [
      `## Sheet: ${sheetName}`,
      '',
      `| ${headerRow.join(' | ')} |`,
      `| ${separator.join(' | ')} |`,
      ...dataRows.map((row) => {
        const cells = headerRow.map((_, i) =>
          String(row[i] ?? '').replace(/\|/g, '\\|')
        );
        return `| ${cells.join(' | ')} |`;
      }),
      '',
    ];

    sections.push(tableLines.join('\n'));
  });

  return sections.join('\n');
}

/**
 * Converts a CSV file to a Markdown table.
 * @param {string} filePath - Absolute path to the .csv file.
 * @returns {string} Markdown table representation.
 */
function convertCSV(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const records    = parseCSV(rawContent, { skip_empty_lines: true });

  if (records.length === 0) return '_No data found in CSV file._';

  const headerRow = records[0].map(String);
  const dataRows  = records.slice(1);
  const separator = headerRow.map(() => '---');

  const lines = [
    `| ${headerRow.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...dataRows.map((row) => {
      const cells = headerRow.map((_, i) =>
        String(row[i] ?? '').replace(/\|/g, '\\|')
      );
      return `| ${cells.join(' | ')} |`;
    }),
  ];

  return lines.join('\n');
}

/**
 * Reads a plain text file and returns its content as-is.
 * @param {string} filePath - Absolute path to the .txt file.
 * @returns {string} Raw text content.
 */
function convertTXT(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

// ─────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────

/**
 * Dispatches a file to the appropriate converter based on its extension.
 * @param {string} filePath - Absolute path to the source file.
 * @returns {Promise<string|null>} Markdown string, or null if unsupported.
 */
async function convertFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const title     = getTitle(filePath);
  let   body      = '';

  switch (extension) {
    case '.pdf':
      body = await convertPDF(filePath);
      break;

    case '.docx':
      body = await convertDOCX(filePath);
      break;

    case '.xlsx':
    case '.xls':
      body = convertXLSX(filePath);
      break;

    case '.csv':
      body = convertCSV(filePath);
      break;

    case '.txt':
      body = convertTXT(filePath);
      break;

    default:
      return null;
  }

  return buildMarkdownDocument(title, body);
}

// ─────────────────────────────────────────────────────────────
// Entry Point
// ─────────────────────────────────────────────────────────────

/**
 * Main execution function.
 * Scans the source directory, converts each supported file,
 * and writes the output to the destination directory.
 */
async function run() {
  const sourceDir = path.resolve(CONFIG.sourceDir);
  const destDir   = path.resolve(CONFIG.destDir);

  console.log('============================================================');
  console.log('  File-to-Markdown Converter');
  console.log('============================================================');
  console.log(`  Source      : ${sourceDir}`);
  console.log(`  Destination : ${destDir}`);
  console.log('------------------------------------------------------------');

  // Ensure the destination directory exists
  await fs.ensureDir(destDir);

  // Read and filter source files
  const allFiles      = await fs.readdir(sourceDir);
  const filesToConvert = allFiles.filter((file) =>
    CONFIG.supported.includes(path.extname(file).toLowerCase())
  );

  if (filesToConvert.length === 0) {
    console.log('  No supported files found in the source directory.');
    console.log('============================================================');
    return;
  }

  console.log(`  Files found : ${filesToConvert.length}`);
  console.log('------------------------------------------------------------');

  let convertedCount = 0;
  let skippedCount   = 0;

  for (const fileName of filesToConvert) {
    const sourcePath = path.join(sourceDir, fileName);
    const outputName = getTitle(fileName) + '.md';
    const destPath   = path.join(destDir, outputName);

    process.stdout.write(`  [CONVERTING]  ${fileName.padEnd(45)} →  ${outputName} ... `);

    try {
      const markdownContent = await convertFile(sourcePath);

      if (markdownContent === null) {
        console.log('SKIPPED (unsupported format)');
        skippedCount++;
        continue;
      }

      await fs.writeFile(destPath, markdownContent, 'utf8');
      console.log('OK');
      convertedCount++;

    } catch (error) {
      console.log(`FAILED — ${error.message}`);
      skippedCount++;
    }
  }

  console.log('------------------------------------------------------------');
  console.log(`  Converted   : ${convertedCount}`);
  console.log(`  Skipped     : ${skippedCount}`);
  console.log('============================================================');
}

// ─────────────────────────────────────────────────────────────
// Execute
// ─────────────────────────────────────────────────────────────

run().catch((error) => {
  console.error('[FATAL ERROR]', error.message);
  process.exit(1);
});
