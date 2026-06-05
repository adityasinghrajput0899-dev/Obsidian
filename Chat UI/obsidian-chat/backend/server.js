const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3003;
const HOST = '0.0.0.0';

// ============================================
// GROQ CONFIG — paste your key here
// ============================================
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.1-8b-instant'; // fast, free, great quality

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
}));

// ============================================
// PATHS & CONFIGURATION
// ============================================
const OBSIDIAN_DB_PATH = path.join(__dirname, '../../Obsidian database');
const CHAT_HISTORY_PATH = path.join(__dirname, '../Vault/Chats');
const OLLAMA_BASE_URL = 'http://127.0.0.1:11434';
const OLLAMA_API = `${OLLAMA_BASE_URL}/api/generate`;

// Ensure directories exist
fs.ensureDirSync(CHAT_HISTORY_PATH);

// ============================================
// SOP DETECTION & NAMING
// ============================================
const SOP_LIST = [
  'AI Generated Audit',
  'Batch Assignment',
  'Download Batches',
  'Discard Batches',
  'General Annotation',
  'Parameter-level Annotation'
];

function detectSOPFromMessage(message) {
  const lowerMessage = message.toLowerCase();
  for (const sop of SOP_LIST) {
    if (lowerMessage.includes(sop.toLowerCase())) {
      return sop.replace(/\s+/g, '_'); // Convert spaces to underscores
    }
  }
  return null;
}

function generateChatFilename(sopName = null) {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10); // 2026-05-08
  const timestamp = Date.now();
  const name = sopName ? `${sopName}_chat_${timestamp}.md` : `chat_${timestamp}.md`;
  // Ensure date subfolder exists
  const dateDir = path.join(CHAT_HISTORY_PATH, dateKey);
  if (!fs.existsSync(dateDir)) {
    fs.mkdirSync(dateDir, { recursive: true });
    console.log(`📁 Created chat folder: ${dateKey}`);
  }
  return { name, dateKey, relativePath: `${dateKey}/${name}` };
}

// ============================================
// LIVE UPDATES — SSE + FILE WATCHER
// ============================================

// Keep track of all connected SSE clients
const sseClients = new Set();

// SSE endpoint — browsers connect here to receive live updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send a heartbeat immediately so the browser knows it's connected
  res.write('data: {"type":"connected"}\n\n');

  sseClients.add(res);
  console.log(`📡 SSE client connected (${sseClients.size} total)`);

  // Keep-alive ping every 20s to prevent connection timeout
  const ping = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
    console.log(`📡 SSE client disconnected (${sseClients.size} remaining)`);
  });
});

// Broadcast a message to all connected clients
function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  sseClients.forEach(client => {
    try { client.write(data); } catch (_) { sseClients.delete(client); }
  });
}

// Watch vault folder — broadcast when files are added/changed/removed
fs.watch(OBSIDIAN_DB_PATH, { persistent: false }, (eventType, filename) => {
  if (filename && filename.endsWith('.md')) {
    console.log(`📂 Vault changed: ${eventType} — ${filename}`);
    broadcast({ type: 'vault-changed', file: filename });
  }
});

// Watch chat history folder — broadcast when new chats are saved
fs.watch(CHAT_HISTORY_PATH, { persistent: false }, (eventType, filename) => {
  if (filename && filename.endsWith('.md')) {
    console.log(`💬 Chat history changed: ${filename}`);
    broadcast({ type: 'history-changed' });
  }
});

// ============================================
// PERSISTENT MEMORY STORE
// Stores user corrections/additions that survive restarts
// ============================================
const MEMORY_FILE = path.join(CHAT_HISTORY_PATH, '_memory.json');

function loadMemory() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function saveMemory(memories) {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save memory:', err.message);
  }
}

let agentMemory = loadMemory();
console.log(`🧠 Loaded ${agentMemory.length} memory entries`);


// ============================================
// AUTO-LEARNING — extract facts from every conversation turn
// ============================================

/**
 * Analyses a user message + AI response and extracts learnable facts.
 * Returns an array of memory entries to save, or empty array if nothing to learn.
 */
function extractLearnableFacts(userMessage, aiResponse, chatFile, selectedFile) {
  const facts = [];
  const now   = new Date();
  const date  = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const msg   = userMessage.toLowerCase().trim();
  const words = userMessage.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['that','this','with','from','have','does','will','should','could','would','about','into','your','their','there','these','those','what','when','where','which'].includes(w));

  // ── Pattern 1: Explicit corrections ("it should be X", "actually X", "no, X") ──
  const correctionPatterns = [
    /^(?:no[,.]?\s+)?(?:actually|it should be|the correct answer is|that's wrong|wrong[,.]?\s+it's|correction[:]?\s+)/i,
    /^(?:not .+,?\s+but\s+)/i,
    /^(?:you're wrong|that is incorrect|incorrect[,.])/i,
  ];
  if (correctionPatterns.some(p => p.test(userMessage.trim()))) {
    facts.push({
      type    : 'correction',
      topic   : userMessage.trim().substring(0, 150),
      answer  : userMessage.trim(),
      keywords: words.slice(0, 10),
      source  : selectedFile || 'user correction',
      addedBy : 'auto-learn',
      date, time, chatFile,
    });
  }

  // ── Pattern 2: Definitions ("X means Y", "X is defined as Y", "X refers to Y") ──
  const defMatch = userMessage.match(/^(.{3,60}?)\s+(?:means?|is defined as|refers? to|stands? for|is called)\s+(.{3,})/i);
  if (defMatch) {
    facts.push({
      type    : 'definition',
      topic   : defMatch[1].trim(),
      answer  : userMessage.trim(),
      keywords: words.slice(0, 10),
      source  : selectedFile || 'user input',
      addedBy : 'auto-learn',
      date, time, chatFile,
    });
  }

  // ── Pattern 3: Rules / instructions ("always do X", "never do Y", "make sure X") ──
  const rulePatterns = [
    /^(?:always|never|make sure|ensure|don't forget|remember that|keep in mind|important[:]?)\s+/i,
    /^(?:the rule is|our rule|our process|our policy|we always|we never|we should)\s+/i,
  ];
  if (rulePatterns.some(p => p.test(userMessage.trim()))) {
    facts.push({
      type    : 'rule',
      topic   : userMessage.trim().substring(0, 150),
      answer  : userMessage.trim(),
      keywords: words.slice(0, 10),
      source  : selectedFile || 'user rule',
      addedBy : 'auto-learn',
      date, time, chatFile,
    });
  }

  // ── Pattern 4: Factual statements ("X is Y", "X has Y", "X does Y") ──
  // Only save if the message is a clear declarative statement (not a question)
  const isQuestion = /\?$/.test(userMessage.trim()) || /^(?:what|who|where|when|why|how|is|are|can|does|do|did|will|would|could|should)\s/i.test(userMessage.trim());
  const isShort    = userMessage.trim().length < 15;
  const isCommand  = /^(?:show|give|tell|list|find|search|update|add|remove|delete|create|open|close|check)\s/i.test(userMessage.trim());

  if (!isQuestion && !isShort && !isCommand && words.length >= 4) {
    // Check if it looks like a factual statement (has a verb + subject structure)
    const factMatch = userMessage.match(/^(.{5,80}?)\s+(?:is|are|was|were|has|have|had|does|do|did|can|will|should)\s+(.{5,})/i);
    if (factMatch) {
      facts.push({
        type    : 'fact',
        topic   : factMatch[1].trim().substring(0, 100),
        answer  : userMessage.trim(),
        keywords: words.slice(0, 10),
        source  : selectedFile || 'conversation',
        addedBy : 'auto-learn',
        date, time, chatFile,
      });
    }
  }

  return facts;
}

/**
 * Updates the Memory.md file in the vault with all current memories.
 * This makes the learned knowledge visible and searchable in the vault.
 */
function updateMemoryVaultFile() {
  try {
    const memFile = path.join(OBSIDIAN_DB_PATH, 'Memory.md');
    if (!agentMemory.length) return;

    const byType = {};
    agentMemory.forEach(m => {
      const t = m.type || 'general';
      if (!byType[t]) byType[t] = [];
      byType[t].push(m);
    });

    const typeLabels = {
      correction : '✏️ Corrections',
      definition : '📖 Definitions',
      rule       : '📋 Rules & Policies',
      fact       : '💡 Learned Facts',
      general    : '🧠 General Memory',
    };

    const lines = [
      '# 🧠 Agent Memory',
      '',
      `> **Total entries:** ${agentMemory.length}  |  **Last updated:** ${new Date().toLocaleString('en-GB')}`,
      '',
      '---',
      '',
    ];

    Object.entries(byType).forEach(([type, entries]) => {
      lines.push(`## ${typeLabels[type] || type}`);
      lines.push('');
      entries.slice().reverse().forEach(m => {
        lines.push(`### ${m.topic.substring(0, 80)}`);
        lines.push(`> **Answer:** ${m.answer.substring(0, 300)}`);
        lines.push(`> **Source:** ${m.source || 'unknown'}  |  **Added:** ${m.date} at ${m.time}  |  **By:** ${m.addedBy || 'user'}`);
        if (m.chatFile) lines.push(`> **Chat:** ${m.chatFile}`);
        lines.push('');
      });
    });

    fs.writeFileSync(memFile, lines.join('\n'), 'utf-8');
    broadcast({ type: 'vault-changed', file: 'Memory.md' });
  } catch (err) {
    console.warn('Failed to update Memory.md:', err.message);
  }
}
const APPROVALS_PATH = path.join(OBSIDIAN_DB_PATH, 'Approvals');
const TEMP_PATH = path.join(OBSIDIAN_DB_PATH, 'Temp');
fs.ensureDirSync(APPROVALS_PATH);
fs.ensureDirSync(TEMP_PATH);

function logApprovalRequest({ question, answer, source, chatFile, requestType, fullUpdatedContent }) {
  const now = new Date();
  const dateKey   = now.toISOString().slice(0, 10); // 2026-05-08
  const timeStr   = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dayFile   = path.join(APPROVALS_PATH, `${dateKey}.md`);

  // Create file with header if new day
  if (!fs.existsSync(dayFile)) {
    fs.writeFileSync(dayFile,
      `# SOP Change Requests — ${dateLabel}\n\n> All SOP update requests made on ${dateLabel}.\n\n---\n\n`,
      'utf-8'
    );
    console.log(`📁 New approval log: ${dateKey}.md`);
  }

  // Number the entry
  const existing = fs.readFileSync(dayFile, 'utf-8');
  const entryNum = (existing.match(/^## Request #/gm) || []).length + 1;

  // Save full updated document to Temp folder if provided
  let tempFilePath = null;
  if (fullUpdatedContent && source && source !== 'Not specified') {
    const sourceFileName = source.replace(/\s+—.+$/, '').trim();
    const safeName = sourceFileName.replace(/[^a-zA-Z0-9\s_\-\.]/g, '').trim();
    const timestamp = Date.now();
    const tempFileName = `${safeName.replace('.md', '')}_temp_${timestamp}.md`;
    tempFilePath = path.join(TEMP_PATH, tempFileName);

    const tempContent = `# ${safeName.replace('.md', '')} — Pending Update\n\n` +
      `> **Status:** ⏳ Pending Approval\n` +
      `> **Request ID:** #${entryNum}\n` +
      `> **Original File:** ${sourceFileName}\n` +
      `> **Requested:** ${dateLabel} at ${timeStr}\n` +
      `> **Chat:** ${chatFile}\n\n` +
      `---\n\n` +
      fullUpdatedContent;

    fs.writeFileSync(tempFilePath, tempContent, 'utf-8');
    console.log(`📄 Temp document saved: Temp/${tempFileName}`);
  }

  const entry =
`## Request #${entryNum} — ${timeStr}

| Field | Details |
|-------|---------|
| **Time** | ${timeStr} |
| **Type** | ${requestType || 'SOP Update Request'} |
| **Source** | ${source || 'Not specified'} |
| **Chat File** | ${chatFile || 'N/A'} |
${tempFilePath ? `| **Temp File** | [[Temp/${path.basename(tempFilePath)}]] |` : ''}

**Question / Context:**
> ${question}

**Proposed Answer / Change:**
> ${answer}

**Status:** ⏳ Pending Approval

---

`;

  fs.appendFileSync(dayFile, entry, 'utf-8');
  console.log(`📋 Approval #${entryNum} logged → ${dateKey}.md`);
  broadcast({ type: 'vault-changed', file: `Approvals/${dateKey}.md` });
  
  return { 
    dateKey, 
    entryNum, 
    timeStr, 
    dayFile: `Approvals/${dateKey}.md`,
    tempFile: tempFilePath ? `Temp/${path.basename(tempFilePath)}` : null
  };
}

// ============================================
app.get('/api/vault', (req, res) => {
  try {
    const files = [];
    
    const walkDir = (dir, relative = '') => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const relPath = path.join(relative, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath, relPath);
          } else if (item.endsWith('.md')) {
            files.push({
              name: item,
              path: relPath.replace(/\\/g, '/'),
              fullPath: fullPath,
              type: 'file',
              folder: relative ? relative.replace(/\\/g, '/') : null
            });
          }
        });
      } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
      }
    };

    walkDir(OBSIDIAN_DB_PATH);
    res.json({ files, total: files.length });
  } catch (error) {
    console.error('Error fetching vault:', error);
    res.status(500).json({ error: 'Failed to fetch vault files' });
  }
});

// ============================================
// GET SPECIFIC FILE CONTENT
// ============================================
app.get('/api/file', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    const fullPath = path.join(OBSIDIAN_DB_PATH, filePath);
    
    // Security: prevent directory traversal
    if (!fullPath.startsWith(OBSIDIAN_DB_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stat = fs.statSync(fullPath);
    const fileSizeKB = stat.size / 1024;

    // For very large files, read only the first 100KB for the viewer
    // but flag it so the frontend knows it's truncated
    const MAX_VIEWER_BYTES = 100 * 1024; // 100KB
    let content;
    let truncated = false;

    if (stat.size > MAX_VIEWER_BYTES) {
      const fd = fs.openSync(fullPath, 'r');
      const buf = Buffer.alloc(MAX_VIEWER_BYTES);
      fs.readSync(fd, buf, 0, MAX_VIEWER_BYTES, 0);
      fs.closeSync(fd);
      content = buf.toString('utf-8');
      truncated = true;
    } else {
      content = fs.readFileSync(fullPath, 'utf-8');
    }

    res.json({ 
      name: path.basename(filePath),
      path: filePath,
      content: content,
      size: stat.size,
      sizeKB: Math.round(fileSizeKB),
      truncated
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// ============================================
// VAULT SEARCH — find relevant content across all files
// Returns snippets from files that contain keywords from the question
// ============================================

// Cache the vault file list so we don't walk the filesystem on every message
let vaultIndexCache = null;
let vaultIndexTime  = 0;
const VAULT_CACHE_TTL = 30000; // rebuild index every 30s

function getVaultIndex() {
  const now = Date.now();
  if (vaultIndexCache && (now - vaultIndexTime) < VAULT_CACHE_TTL) return vaultIndexCache;

  const files = [];
  const walkDir = (dir) => {
    try {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          const skip = ['Temp', 'Approvals', 'Updated Doc', 'Updated Files', 'Chats', 'debug-images'];
          if (!skip.some(s => item.includes(s))) walkDir(full);
        } else if (item.endsWith('.md') && item !== 'Memory.md') {
          files.push({ item, full, relPath: path.relative(OBSIDIAN_DB_PATH, full).replace(/\\/g, '/') });
        }
      }
    } catch (_) {}
  };
  walkDir(OBSIDIAN_DB_PATH);

  vaultIndexCache = files;
  vaultIndexTime  = now;
  return files;
}

// Invalidate cache when vault changes
fs.watch(OBSIDIAN_DB_PATH, { persistent: false }, () => { vaultIndexCache = null; });

// ============================================
// SYSTEM MAP HIGHLIGHTS — extract two important rows (POC / Reconciliation / Normalization)
// These are included in the system prompt as internal context and MUST NOT be printed
// to the user unless the user explicitly asks for them (see prompt instructions below).
// ============================================
function getSystemMapHighlights() {
  try {
    const candidates = [];
    const walk = (dir) => {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (/system map|catalog system map/i.test(item) || /system details/i.test(item)) {
          candidates.push({ name: item, full });
        }
      }
    };
    walk(OBSIDIAN_DB_PATH);

    if (!candidates.length) return null;

    // Prefer the first candidate
    const chosen = candidates[0];
    const txt = fs.readFileSync(chosen.full, 'utf-8');

    // Split into lines and look for rows that mention POC/contact/owner or reconciliation/normalization
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const matches = [];
    const importantKeywords = [/poc/i, /point of contact/i, /contact/i, /owner/i, /ownership/i, /reconciliation/i, /reconcile/i, /normaliz/i];

    for (const line of lines) {
      if (importantKeywords.some(rx => rx.test(line))) {
        // capture markdown links if present
        const links = [];
        const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
        let m;
        while ((m = linkRe.exec(line))) links.push({ text: m[1], url: m[2] });

        matches.push({ text: line, links });
        if (matches.length >= 2) break;
      }
    }

    // Fallback: if no keyword matches, pick first two non-empty lines with links or content
    if (matches.length === 0) {
      for (const line of lines) {
        if (line.length > 20) {
          const links = [];
          const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
          let m;
          while ((m = linkRe.exec(line))) links.push({ text: m[1], url: m[2] });
          matches.push({ text: line, links });
          if (matches.length >= 2) break;
        }
      }
    }

    if (!matches.length) return null;

    return { file: chosen.name, path: chosen.full, highlights: matches.slice(0,2) };
  } catch (err) {
    console.warn('Failed to extract system map highlights:', err.message);
    return null;
  }
}
function searchVaultForQuestion(question, excludeFile = null) {
  try {
    const keywords = question.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !['what','when','where','which','that','this','with','from','have','does','will','should','could','would','about','into','your','their','there','these','those','is','am','are','was','were','be','been','being','have','has','had','do','does','did','can','could','shall','should','will','would','may','might','must','a','an','the','and','but','or','nor','for','so','yet','as','at','by','in','of','on','to','up','via'].includes(w));

    if (!keywords.length) return null;

    const results = [];
    const files = getVaultIndex();

    for (const { item, full, relPath } of files) {
      if (excludeFile && (relPath === excludeFile || item === excludeFile)) continue;

      const content = fs.readFileSync(full, 'utf-8');
      const lower   = content.toLowerCase();

      const score     = keywords.filter(k => lower.includes(k)).length;
      const nameScore = keywords.filter(k => item.toLowerCase().includes(k)).length;
      const totalScore = score + (nameScore * 2);

      // Lower threshold for normalization terms and important searches
      const isNormalizationQuery = keywords.some(k => 
        ['blk', 'red', 'gps', 'led', 'wifi', 'normalization', 'normalize'].includes(k.toLowerCase())
      );
      const threshold = isNormalizationQuery ? 1 : 2;

      if (totalScore >= threshold) {
        const paragraphs = content.split(/\n{2,}/);
        let bestScore = 0;
        const topParas = [];

        for (const para of paragraphs) {
          const ps = keywords.filter(k => para.toLowerCase().includes(k)).length;
          // For normalization terms, also check for common patterns like "→" or "to"
          const hasNormalizationPattern = isNormalizationQuery && (
            para.includes('→') || para.includes('to') || para.includes('should be') ||
            para.toLowerCase().includes('example') || para.toLowerCase().includes('normalization')
          );
          const adjustedScore = hasNormalizationPattern ? Math.max(ps, 1) : ps;
          if (adjustedScore >= 1) topParas.push({ text: para, score: adjustedScore });
        }

        topParas.sort((a, b) => b.score - a.score);
        const snippet = topParas.slice(0, 3).map(p => p.text.trim()).join('\n\n').slice(0, 2000);

        if (snippet) {
          results.push({ file: item, path: relPath, score: totalScore, snippet });
        }
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 5);
  } catch (_) {
    return null;
  }
}

// ============================================
// CHAT ENDPOINT
// ============================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, context, history, selectedFile, chatId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message required' });
    }

    // Detect SOP from message
    const detectedSOP = detectSOPFromMessage(message);

    // Build prompt with context
    // Inject relevant memories into context
    const relevantMemories = agentMemory.filter(m => {
      const q = message.toLowerCase();
      return m.keywords && m.keywords.some(k => q.includes(k.toLowerCase()));
    });

    const memoryContext = relevantMemories.length > 0
      ? `\n\nLEARNED KNOWLEDGE (from past conversations — use this before general knowledge):\n` +
        relevantMemories.map(m =>
          `- [${m.type || 'memory'}] Topic: "${m.topic}" | Answer: ${m.answer} | Source: ${m.source || 'user'} on ${m.date} at ${m.time}`
        ).join('\n')
      : '';

    // ── Context: send selected file fully (user explicitly chose it) ──
    // Strip OCR image blocks — they contain garbled text that causes hallucination
    const cleanContext = context
      ? context
          .replace(/> \[!(?:NOTE|WARNING)\] Image \d+[^\n]*\n(> [^\n]*\n)*/gm, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      : null;

    // Hard cap at 8KB to stay well within Groq limits
    const MAX_CONTEXT_CHARS = 8000;
    let smartContext = cleanContext;

    if (cleanContext && cleanContext.length > MAX_CONTEXT_CHARS) {
      // Extract relevant sections based on question + recent history
      const searchTerms = [
        message,
        ...(history || []).filter(m => m.role === 'user').slice(-2).map(m => m.content)
      ].join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);

      const paragraphs = cleanContext.split(/\n{2,}/);
      const header = paragraphs.slice(0, 2).join('\n\n');

      const relevant = paragraphs
        .slice(2)
        .map(p => ({ text: p, score: searchTerms.filter(k => p.toLowerCase().includes(k)).length }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(p => p.text);

      const assembled = [header, ...relevant].join('\n\n');
      smartContext = assembled.substring(0, MAX_CONTEXT_CHARS);
      console.log(`[CONTEXT] ${Math.round(cleanContext.length/1024)}KB → ${Math.round(smartContext.length/1024)}KB (extracted relevant sections)`);
    }

    // ── Determine query type for appropriate response ──────────────
    const trimmedMessage = message.trim();
    const lowerMessage = trimmedMessage.toLowerCase();
    
    // Improved greeting detection - more flexible
    const isGreeting = /^(hi|hello|hey|greetings|hi there|hello there|hey there|good morning|good afternoon|good evening|good night|thanks|thank you|thank you very much|thanks a lot|ok|okay|sure|yes|no|bye|goodbye|see you|how are you|how's it going|what's up|whats up|sup)[\s!.?]*$/i.test(trimmedMessage);
    
    // General question detection
    const isGeneralQuestion = /^(what is|what are|who is|where is|when is|why is|how is|can you|could you|would you|please|tell me about|explain|describe|define|what does|how does)[\s!.?]/i.test(trimmedMessage);
    
    // Normalization query detection
    const isNormalizationQuery = /(blk|red|gps|led|wifi|normalization|normalize|correct.*representation|should.*be|abbreviation|acronym|term.*correct|representation)/i.test(lowerMessage);
    
    // SOP query detection
    const isSOPQuery = /(sop|standard operating procedure|audit|vanguard|publishing|enumeration|catalog|system map|starfish|modular|title quality|reconciliation|poc|point of contact|contact|owner|ownership)/i.test(lowerMessage);
    
    const searchQuery = [
      message,
      ...(history || []).filter(m => m.role === 'user').slice(-2).map(m => m.content)
    ].join(' ');
    const contextSize = smartContext ? smartContext.length : 0;
    
    // Decide when to search vault
    let vaultResults = null;
    
    // Check if query is work-related
    const isWorkRelated = /(catalog|normalization|sop|audit|vanguard|publishing|enumeration|starfish|modular|title quality|amazon|product|attribute|workflow|process|system map|team|contact|ownership|escalation)/i.test(lowerMessage);
    
    if (!isGreeting && contextSize < 20000) {
      // Always search for normalization/SOP queries
      if (isNormalizationQuery || isSOPQuery) {
        vaultResults = searchVaultForQuestion(searchQuery, selectedFile);
      }
      // Search for general questions only if they seem work-related
      else if (isGeneralQuestion && isWorkRelated) {
        vaultResults = searchVaultForQuestion(searchQuery, selectedFile);
      }
      // For other questions, be more selective - only search if work-related
      else if (trimmedMessage.length > 10 && /\?$/.test(trimmedMessage) && isWorkRelated) {
        vaultResults = searchVaultForQuestion(searchQuery, selectedFile);
      }
      // Also search for non-question work-related statements
      else if (!/\?$/.test(trimmedMessage) && isWorkRelated && trimmedMessage.length > 15) {
        vaultResults = searchVaultForQuestion(searchQuery, selectedFile);
      }
    }
    const vaultContext = vaultResults
      ? vaultResults
          .filter(r => r.file !== 'Memory.md')
          .map(r => `[${r.file}]\n${r.snippet}`)
          .join('\n\n')
          .substring(0, 3000)   // hard cap vault context at 3KB
      : null;

    console.log(`[CHAT] ctx=${Math.round(contextSize/1024)}KB vault=${vaultResults?.length||0} greeting=${isGreeting} msg="${message.substring(0,50)}"`);

    // Keep only last 2-3 exchanges (4-6 messages max) to avoid rate limits and hanging
    // This prevents sending too much history to Groq/Ollama
    const maxHistory = 4;

    // Only inject memory if it's a genuine correction/rule, not auto-learned noise
    const qualityMemories = relevantMemories.filter(m =>
      m.type === 'correction' || m.type === 'rule' || m.addedBy === 'user'
    );
    const memoryBlock = qualityMemories.length > 0
      ? '\n\nNote from past conversations:\n' +
        qualityMemories.map(m => `- ${m.answer}`).join('\n')
      : '';

    // Fetch system map highlights (internal reference)
    const systemMapInfo = getSystemMapHighlights();
    const systemMapBlock = systemMapInfo
      ? (`\n\nSYSTEM_MAP_REFERENCE (internal): File: ${systemMapInfo.file}\n` +
         systemMapInfo.highlights.map(h => `- ${h.text}` + (h.links && h.links.length ? ` — Links: ${h.links.map(l=>l.url).join(', ')}` : '')).join('\n') +
         `\n\nINSTRUCTION: Only reveal these highlighted rows to the user if they explicitly ask for POC/contact/reconciliation details or request the system map highlights.`)
      : '';

    // Dynamic system prompt based on query type
    let systemPrompt = '';
    
    if (isGreeting) {
      systemPrompt = `You are a friendly AI assistant. Respond naturally to greetings. Keep it brief.

${selectedFile ? `File: ${selectedFile}` : ''}`;
    } else if (isNormalizationQuery || isSOPQuery) {
      systemPrompt = `You are an expert in catalog normalization, SOP interpretation, and system ownership.

SEARCH BEHAVIOR:
1. Search SELECTED FILE first if provided
2. Search VAULT FILES (provided below)
3. Check Catalog System Map for contacts/ownership
4. Use general knowledge only as last resort

NORMALIZATION RULES:
- For terms like "blk", "red", "GPS": Find normalization mappings
- Check Starfish Modular Title Quality Audits: "Blk → Black", "Gps → GPS"
- Provide correct representation with source citation
- Explain why the normalization is needed

CONTACT/OWNERSHIP RULES:
- For "who handles X": Check Catalog System Map
- Provide: Team Name, Subsystem, POC Name, Purpose
- Include: Upstream/Downstream systems, APIs, Escalation matrix
- List collaborating teams if mentioned

DOCUMENT CHANGES:
- If asked to add/edit/remove content: Show full updated section
- Mark changes with "> ✏️ CHANGED:"
- End with: APPROVAL_REQUIRED: YES

SOURCE CITATION:
- Always end answers with: 📌 Source: [filename] — [Section if known]
- If not found: "I could not find this in the documents"

${selectedFile ? `Selected file: ${selectedFile}` : 'No file selected'}
${smartContext ? `\n--- SELECTED FILE ---\n${smartContext}\n--- END ---` : ''}
${vaultContext ? `\n--- VAULT FILES ---\n${vaultContext}\n--- END ---` : ''}`;
    } else if (isGeneralQuestion) {
      systemPrompt = `You are a helpful AI assistant.

RULES:
1. Work-related (catalog/SOP/normalization): Search documents, cite sources
2. General knowledge: Use "⚠️ **General Answer** (not in SOP)" prefix
3. Be concise and helpful

${selectedFile ? `File: ${selectedFile}` : ''}
${smartContext ? `\n--- CONTENT ---\n${smartContext}\n--- END ---` : ''}
${vaultContext ? `\n--- VAULT ---\n${vaultContext}\n--- END ---` : ''}`;
    } else {
      systemPrompt = `You are a helpful AI assistant.

RULES:
1. Work-related topics: Search documents and cite sources
2. General conversation: Be natural and helpful
3. Keep responses concise

${selectedFile ? `File: ${selectedFile}` : ''}
${smartContext ? `\n--- CONTENT ---\n${smartContext}\n--- END ---` : ''}
${vaultContext ? `\n--- VAULT ---\n${vaultContext}\n--- END ---` : ''}`;
    }

    // Build clean conversation history — only user questions and AI answers, NO document content
    let conversationHistory = (history || []).filter(m =>
      // Strip out any old messages that contain the full document context
      !(m.role === 'user' && m.content && m.content.startsWith('Document:'))
    );

    // Add current user message (just the question, no document content)
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // Keep last N messages depending on context size
    if (conversationHistory.length > maxHistory) {
      conversationHistory = conversationHistory.slice(-maxHistory);
    }

    // Build messages for Ollama — use the last 12 messages to retain more conversation context
    let fullPrompt = systemPrompt + '\n\n';
    conversationHistory.slice(-12).forEach(msg => {
      if (msg.role === 'user') {
        fullPrompt += `User: ${msg.content}\n\n`;
      } else {
        fullPrompt += `Assistant: ${msg.content}\n\n`;
      }
    });
    fullPrompt += 'Assistant: ';

    // ============================================
    // TRY GROQ FIRST (fast cloud) → fallback to Ollama
    // ============================================

    const useGroq = GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE';

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    let aiResponse = '';

    if (useGroq) {
      console.log('⚡ Using Groq API...');

      // Trim history — respect maxHistory (4 messages), cap each at 300 chars to save tokens
      const trimmedHistory = conversationHistory.slice(-maxHistory).map(m => ({
        role: m.role,
        content: m.content.length > 300
          ? m.content.substring(0, 300) + '…'
          : m.content
      }));

      const groqMessages = [
        { role: 'system', content: systemPrompt },
        ...trimmedHistory
      ];
      console.log('Groq messages:', JSON.stringify(groqMessages.map(m => ({ role: m.role, len: m.content?.length }))));
      try {
        const groqRes = await axios.post(GROQ_API_URL, {
          model: GROQ_MODEL,
          messages: groqMessages,
          stream: true,
          max_tokens: 1024,
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 30000
        });

        let settled = false;

        groqRes.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(l => l.trim());
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') {
              if (!settled) { settled = true; finishChat(); }
              return;
            }
            try {
              const json = JSON.parse(raw);
              const token = json.choices?.[0]?.delta?.content;
              if (token) {
                aiResponse += token;
                res.write(`data: ${JSON.stringify({ token })}\n\n`);
              }
            } catch (_) {}
          }
        });

        groqRes.data.on('end', () => { if (!settled) { settled = true; finishChat(); } });
        groqRes.data.on('error', async (err) => {
          console.error('⚠️ Groq stream error, falling back to Ollama:', err.message);
          if (!settled) { settled = true; aiResponse = ''; await useOllama(); }
        });

      } catch (groqErr) {
        // If rate limited (429), skip retry and go directly to Ollama to avoid hanging
        if (groqErr.response?.status === 429 || (groqErr.message && groqErr.message.includes('429'))) {
          console.log('⚠️ Groq rate limited — falling back to Ollama immediately');
          await useOllama();
          return;
        }
        console.error('⚠️ Groq failed, falling back to Ollama:', groqErr.message);
        await useOllama();
      }

    } else {
      await useOllama();
    }

    // ── Save chat + send done event ──
    function finishChat() {
      if (!aiResponse) return;
      // Only push the assistant response — the user message was already added before the API call
      conversationHistory.push({ role: 'assistant', content: aiResponse });
      if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

      // Use stable chatId from frontend so all messages in a session go to the same file
      let chatInfo;
      if (chatId) {
        // chatId format: "YYYY-MM-DD/filename.md"
        const parts = chatId.split('/');
        const dateKey = parts[0];
        const name    = parts.slice(1).join('/');
        const dateDir = path.join(CHAT_HISTORY_PATH, dateKey);
        fs.ensureDirSync(dateDir);
        chatInfo = { name, dateKey, relativePath: chatId };
      } else {
        chatInfo = generateChatFilename(detectedSOP);
      }
      const chatFilename = chatInfo.name;
      const chatPath = path.join(CHAT_HISTORY_PATH, chatInfo.dateKey, chatFilename);
      const chatContent = `# Chat - ${new Date().toLocaleString()}
${detectedSOP ? `\n**SOP:** ${detectedSOP.replace(/_/g, ' ')}\n` : ''}
${selectedFile ? `**File:** ${selectedFile}\n` : ''}

## Conversation

${conversationHistory.map(m =>
  m.role === 'user' ? `**User:** ${m.content}` : `**Assistant:** ${m.content}`
).join('\n\n')}`;

      fs.writeFile(chatPath, chatContent, 'utf-8').catch(err =>
        console.error('❌ Failed to save chat:', err.message)
      );
      console.log(`✅ Chat saved: ${chatInfo.relativePath}`);
      broadcast({ type: 'history-changed' });

      // ── Auto-learn from every conversation turn ──────────
      const learnedFacts = extractLearnableFacts(message, aiResponse, chatInfo.relativePath, selectedFile);
      if (learnedFacts.length) {
        learnedFacts.forEach(fact => {
          // Avoid duplicates — skip if very similar topic already exists
          const isDuplicate = agentMemory.some(m =>
            m.topic && fact.topic &&
            m.topic.toLowerCase().substring(0, 50) === fact.topic.toLowerCase().substring(0, 50)
          );
          if (!isDuplicate) {
            agentMemory.push(fact);
            console.log(`🧠 Auto-learned [${fact.type}]: "${fact.topic.substring(0, 60)}"`);
          }
        });
        saveMemory(agentMemory);
        updateMemoryVaultFile();
      }

      // Detect "remember" command — explicit save to persistent memory
      const rememberTriggers = ['remember this', 'add this to memory', 'note this', 'keep this in mind', 'remember that'];
      const isRememberRequest = rememberTriggers.some(t => message.toLowerCase().includes(t));
      if (isRememberRequest) {
        const timestamp = new Date();
        const cleanMsg = message.replace(/remember this|add this to memory|note this|keep this in mind|remember that/gi, '').trim();
        const words = cleanMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const memEntry = {
          topic: cleanMsg.substring(0, 150) || message.substring(0, 150),
          answer: context ? context.substring(0, 800) : cleanMsg,
          keywords: words.slice(0, 12),
          addedBy: 'user',
          date: timestamp.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          chatFile: chatInfo.relativePath,
        };
        agentMemory.push(memEntry);
        saveMemory(agentMemory);
        updateMemoryVaultFile();
        console.log(`🧠 Memory saved: "${memEntry.topic.substring(0, 60)}"`);
      }

      // Detect SOP change/update requests — log to Approvals folder
      // Primary trigger: AI explicitly outputs APPROVAL_REQUIRED: YES
      // Fallback: keyword matching on user message
      const approvalTriggers = [
        'add to sop', 'update sop', 'change sop', 'add this to sop',
        'update the sop', 'modify sop', 'add in sop', 'put in sop',
        'change the sop', 'modify the sop', 'update this sop',
        'should be added', 'needs to be added', 'add this rule',
        'update the rule', 'change the rule', 'revise the sop',
        'amend the sop', 'edit the sop', 'correct the sop',
        'delete from sop', 'remove from sop', 'delete this rule',
        'remove this rule', 'add this point', 'include this in sop',
        'sop should say', 'sop should include', 'sop needs to',
        'update annotation', 'change annotation', 'modify annotation',
        'create a new sop', 'create new rule', 'remove this from sop',
        'delete this from sop', 'add a new step', 'remove this step',
        'change this step', 'update this step', 'add this step',
        'give me the updated', 'show me the updated', 'updated document',
        'updated version', 'with the changes', 'apply the change',
        'make the change', 'make this change', 'add this to the document',
        'remove this from the document', 'update the document'
      ];

      const aiSignalsApproval = /APPROVAL_REQUIRED:\s*YES/i.test(aiResponse);
      const keywordMatch = approvalTriggers.some(t => message.toLowerCase().includes(t));
      const isApprovalRequest = aiSignalsApproval || keywordMatch;

      // Strip the APPROVAL_REQUIRED marker from the visible response
      const cleanedResponse = aiResponse.replace(/APPROVAL_REQUIRED:\s*YES/gi, '').trim();

      if (isApprovalRequest) {
        const sourceMatch = cleanedResponse.match(/📌 Source:\s*(.+)/i);
        const source = sourceMatch ? sourceMatch[1].trim() : (selectedFile || 'Not specified');

        // Extract the updated document content from the AI response
        // (everything before the 📌 Source line, stripped of approval marker)
        const fullUpdatedContent = cleanedResponse
          .replace(/📌 Source:.+/i, '')
          .trim();

        const result = logApprovalRequest({
          question: message,
          answer: fullUpdatedContent.substring(0, 600),
          source,
          chatFile: chatInfo.relativePath,
          requestType: 'SOP Update Request',
          fullUpdatedContent
        });

        // Stream approval notice to chat as tokens (visible in chat)
        const tempFileNote = result.tempFile
          ? `- **Temp File:** ${result.tempFile}\n`
          : '';

        const approvalNotice = `\n\n---\n\n⏳ **Approval Required**\n\n` +
          `This change request has been logged for approval:\n` +
          `- **Request ID:** #${result.entryNum}\n` +
          `- **Source Document:** ${source}\n` +
          `- **Logged in:** Approvals/${result.dateKey}.md\n` +
          tempFileNote +
          `- **Status:** ⏳ Pending Approval\n\n` +
          `> ⚠️ The updated version above is a **preview only**. The original document has **not been modified**.\n` +
          `> The full updated version has been saved to **${result.tempFile || 'Temp/'}** and will replace the original only after an administrator approves this request.`;

        res.write(`data: ${JSON.stringify({ token: approvalNotice })}\n\n`);
        aiResponse = cleanedResponse + approvalNotice;

        // Broadcast so vault panel updates live
        broadcast({ type: 'vault-changed', file: result.dayFile });
        if (result.tempFile) broadcast({ type: 'vault-changed', file: result.tempFile });
        broadcast({ type: 'approval-added', date: result.dateKey, entry: result.entryNum });
        console.log(`📋 Approval #${result.entryNum} — AI flagged: ${aiSignalsApproval}, keyword: ${keywordMatch}`);
        console.log(`📡 Broadcasted to ${sseClients.size} clients`);
      } else {
        aiResponse = cleanedResponse;
      }

      res.write(`data: ${JSON.stringify({
        done: true,
        history: conversationHistory,
        chatFile: chatInfo.relativePath,
        sopDetected: detectedSOP
      })}\n\n`);
      res.end();
    }

    // ── Ollama fallback function ──
    async function useOllama() {
      console.log('🤖 Using Ollama (mistral)...');
      try {
        const ollamaRes = await axios.post(OLLAMA_API, {
          model: 'mistral',
          prompt: fullPrompt,
          stream: true,
          options: { temperature: 0.7, num_predict: 400, num_ctx: 2048, num_thread: 8 }
        }, { timeout: 60000, responseType: 'stream', headers: { 'Content-Type': 'application/json' } });

        // Add timeout handler to prevent hanging
        const timeoutId = setTimeout(() => {
          console.error('⚠️ Ollama timeout after 60s');
          res.write(`data: ${JSON.stringify({ error: 'Response timeout. Please try again with a shorter question.' })}\n\n`);
          res.end();
        }, 60000);

        ollamaRes.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(l => l.trim());
          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                aiResponse += json.response;
                res.write(`data: ${JSON.stringify({ token: json.response })}\n\n`);
              }
              if (json.done) {
                clearTimeout(timeoutId);
                finishChat();
              }
            } catch (_) {}
          }
        });

        ollamaRes.data.on('error', (err) => {
          clearTimeout(timeoutId);
          res.write(`data: ${JSON.stringify({ error: 'Ollama error: ' + err.message })}\n\n`);
          res.end();
        });

      } catch (err) {
        res.write(`data: ${JSON.stringify({ error: 'No AI available. Start Ollama or set Groq API key.' })}\n\n`);
        res.end();
      }
    }

  } catch (error) {
    console.error('Error in chat:', error.message);
    if (!res.headersSent) {
      if (error.message && error.message.includes('ECONNREFUSED')) {
        return res.status(503).json({
          error: 'Ollama is not running. Please start Ollama first (ollama serve)',
          details: error.message
        });
      }
      res.status(500).json({
        error: 'Failed to process chat',
        details: error.message || 'Unknown error'
      });
    }
  }
});

// ============================================
// NETWORK INFO — all available IPs including VPN
// ============================================
app.get('/api/network-info', (req, res) => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        const isVpn = name.toLowerCase().includes('vpn') ||
                      name.toLowerCase().includes('tunnel') ||
                      name.toLowerCase().includes('tap') ||
                      name.toLowerCase().includes('tun');
        const isWifi = name.toLowerCase().includes('wi-fi') ||
                       name.toLowerCase().includes('wireless');
        ips.push({
          name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`,
          type: isVpn ? 'vpn' : isWifi ? 'wifi' : 'lan'
        });
      }
    }
  }
  res.json({ ips, port: PORT });
});

// ============================================
// NGROK URL (for personal network access)
// ============================================
app.get('/api/public-url', async (req, res) => {
  try {
    const r = await axios.get('http://127.0.0.1:4040/api/tunnels', { timeout: 2000 });
    const tunnels = r.data.tunnels || [];
    const https = tunnels.find(t => t.proto === 'https');
    res.json({ url: https?.public_url || null, active: !!https });
  } catch {
    res.json({ url: null, active: false });
  }
});

// ============================================
// OPEN IN OBSIDIAN
// ============================================
app.get('/api/open-obsidian', (req, res) => {
  const file = req.query.file; // optional — open specific file
  const VAULT_ID   = '57ef7ac2a01b9c85';
  const VAULT_NAME = 'Obsidian Vault';

  let url;
  if (file) {
    // Open specific file: obsidian://open?vault=NAME&file=PATH
    const filePath = file.replace(/\.md$/, ''); // Obsidian doesn't need .md
    url = `obsidian://open?vault=${encodeURIComponent(VAULT_NAME)}&file=${encodeURIComponent(filePath)}`;
  } else {
    // Just open the vault
    url = `obsidian://open?vault=${encodeURIComponent(VAULT_NAME)}`;
  }

  // Send an HTML page that immediately redirects via JS (bypasses browser protocol blocking)
  res.send(`<!DOCTYPE html>
<html>
<head><title>Opening Obsidian...</title></head>
<body style="background:#0d1117;color:#c9d1d9;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;">
  <div style="font-size:2em;">📝</div>
  <div>Opening Obsidian...</div>
  <div style="font-size:0.8em;color:#8b949e;">You can close this tab</div>
  <script>
    window.location.href = ${JSON.stringify(url)};
    setTimeout(() => window.close(), 2000);
  </script>
</body>
</html>`);
});

// ============================================
// ADD TO SOP LOG — timestamped suggestion record
// ============================================
app.post('/api/sop-suggestion', (req, res) => {
  try {
    const { question, answer, source, requestedBy } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'question and answer required' });
    }

    const timestamp = new Date();
    const dateStr   = timestamp.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    const timeStr   = timestamp.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

    const logFile = path.join(OBSIDIAN_DB_PATH, 'SOP_Update_Suggestions.md');

    // Create file with header if it doesn't exist
    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, `# SOP Update Suggestions Log\n\nThis file tracks all suggestions to add content to SOPs.\n\n---\n\n`, 'utf-8');
    }

    const entry = `## 📝 Suggestion — ${dateStr} at ${timeStr}
${requestedBy ? `**Requested by:** ${requestedBy}\n` : ''}**Source of answer:** ${source || 'Unknown'}

**Original question:**
> ${question}

**Answer / Content to add:**
> ${answer}

**Status:** ⏳ Pending review

---

`;

    fs.appendFileSync(logFile, entry, 'utf-8');
    console.log(`📝 SOP suggestion logged at ${dateStr} ${timeStr}`);

    res.json({
      success: true,
      message: `Logged on ${dateStr} at ${timeStr}`,
      logFile: 'SOP_Update_Suggestions.md'
    });
  } catch (err) {
    console.error('Error logging SOP suggestion:', err);
    res.status(500).json({ error: 'Failed to log suggestion' });
  }
});

// ============================================
// ADMIN CREDENTIALS
// ============================================
const ADMIN_USERS = {
  rsuprith: '1234'
};

function validateAdmin(username, password) {
  return ADMIN_USERS[username] && ADMIN_USERS[username] === password;
}

// ============================================
// APPROVE A PENDING REQUEST
// POST /api/approve
// Body: { username, password, dateKey, entryNum }
// ============================================
app.post('/api/approve', async (req, res) => {
  try {
    const { username, password, dateKey, entryNum } = req.body;

    if (!validateAdmin(username, password)) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const dayFile = path.join(APPROVALS_PATH, `${dateKey}.md`);
    if (!fs.existsSync(dayFile)) {
      return res.status(404).json({ error: `Approval log not found: ${dateKey}.md` });
    }

    let content = fs.readFileSync(dayFile, 'utf-8');

    // Find the entry block for this request number
    const entryRegex = new RegExp(
      `(## Request #${entryNum} —[\\s\\S]*?\\*\\*Status:\\*\\* ⏳ Pending Approval)`,
      'g'
    );

    if (!entryRegex.test(content)) {
      return res.status(404).json({ error: `Request #${entryNum} not found or already processed.` });
    }

    // Extract temp file path from the entry
    const tempMatch = content.match(
      new RegExp(`## Request #${entryNum} —[\\s\\S]*?\\*\\*Temp File\\*\\* \\| \\[\\[(.+?)\\]\\]`)
    );
    const sourceMatch = content.match(
      new RegExp(`## Request #${entryNum} —[\\s\\S]*?\\*\\*Source\\*\\* \\| (.+?)\\n`)
    );

    const tempRelPath = tempMatch ? tempMatch[1].trim() : null;
    const sourceRaw   = sourceMatch ? sourceMatch[1].trim() : null;

    const now      = new Date();
    const dateStr  = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr  = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const approvedBy = username;

    let updatedFilePath = null;

    // If there's a temp file — update it in-place, update the original SOP, and write to Updated Doc
    if (tempRelPath) {
      const tempFullPath = path.join(OBSIDIAN_DB_PATH, tempRelPath);

      if (fs.existsSync(tempFullPath)) {
        let tempContent = fs.readFileSync(tempFullPath, 'utf-8');

        // ── Extract original file name from temp header ────────
        const origFileMatch = tempContent.match(/^> \*\*Original File:\*\* (.+)$/m);
        const origFileName  = origFileMatch ? origFileMatch[1].trim() : null;

        // ── Extract the document body (everything after the first ---) ──
        const separatorIdx = tempContent.indexOf('\n---\n');
        const docBody = separatorIdx !== -1
          ? tempContent.slice(separatorIdx + 5).trim()
          : tempContent.trim();

        // ── 1. Update the Temp file in-place ──────────────────
        tempContent = tempContent
          .replace(
            /^> \*\*Status:\*\* ⏳ Pending Approval$/m,
            `> **Status:** ✅ Approved`
          );

        // Insert approval details after the status line
        tempContent = tempContent.replace(
          /^(> \*\*Status:\*\* ✅ Approved)$/m,
          `$1\n> **Approved by:** ${approvedBy}\n> **Approved on:** ${dateStr} at ${timeStr}`
        );

        // Replace the title to reflect approval
        tempContent = tempContent.replace(
          /^# .+ — Pending Update$/m,
          `# ${origFileName ? origFileName.replace('.md','') : 'Document'} — ✅ Approved Update`
        );

        fs.writeFileSync(tempFullPath, tempContent, 'utf-8');
        console.log(`📄 Temp file updated: ${tempRelPath}`);
        broadcast({ type: 'vault-changed', file: tempRelPath });

        // ── 2. Update the original SOP file in the vault ──────
        if (origFileName) {
          // Search for the original file anywhere in the vault
          const findFile = (dir, name) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const full = path.join(dir, item);
              if (fs.statSync(full).isDirectory()) {
                const found = findFile(full, name);
                if (found) return found;
              } else if (item === name) {
                return full;
              }
            }
            return null;
          };

          const origFullPath = findFile(OBSIDIAN_DB_PATH, origFileName);

          if (origFullPath) {
            const origContent = fs.readFileSync(origFullPath, 'utf-8');

            // Append an update notice + the approved changes at the bottom of the original
            const updateNotice =
              `\n\n---\n\n` +
              `> [!SUCCESS] ✅ Document Updated — ${dateStr} at ${timeStr}\n` +
              `> **Approved by:** ${approvedBy}\n` +
              `> **Request:** #${entryNum} from Approvals/${dateKey}.md\n\n` +
              `## Applied Changes\n\n` +
              docBody;

            fs.writeFileSync(origFullPath, origContent + updateNotice, 'utf-8');
            const origRelPath = path.relative(OBSIDIAN_DB_PATH, origFullPath).replace(/\\/g, '/');
            console.log(`📝 Original SOP updated: ${origRelPath}`);
            broadcast({ type: 'vault-changed', file: origRelPath });
          } else {
            console.warn(`⚠️  Original file not found in vault: ${origFileName}`);
          }
        }

        // ── 3. Create clean file in "Updated Doc" folder ──────
        const UPDATED_PATH = path.join(OBSIDIAN_DB_PATH, 'Updated Doc');
        fs.ensureDirSync(UPDATED_PATH);

        // Derive output filename
        let outName;
        if (origFileName && origFileName !== 'Not specified') {
          outName = origFileName.endsWith('.md') ? origFileName : origFileName + '.md';
        } else if (sourceRaw && sourceRaw !== 'Not specified' && sourceRaw !== 'AI general knowledge') {
          const cleanSource = sourceRaw.replace(/\s+—.+$/, '').trim();
          outName = cleanSource.endsWith('.md') ? cleanSource : cleanSource + '.md';
        } else {
          outName = path.basename(tempFullPath).replace(/_temp_\d+\.md$/, '.md');
        }

        // Add timestamp to avoid overwriting previous approved versions
        const outStem = outName.replace('.md', '');
        const outFile = `${outStem} — Approved ${dateStr}.md`;
        const outPath = path.join(UPDATED_PATH, outFile);

        // Read the full original SOP content if it exists
        let originalSopContent = '';
        if (origFileName) {
          const findFile = (dir, name) => {
            try {
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const full = path.join(dir, item);
                const stat = fs.statSync(full);
                if (stat.isDirectory() && !full.includes('Updated Doc') && !full.includes('Temp')) {
                  const found = findFile(full, name);
                  if (found) return found;
                } else if (item === name) {
                  return full;
                }
              }
            } catch (_) {}
            return null;
          };
          const origPath = findFile(OBSIDIAN_DB_PATH, origFileName);
          if (origPath) {
            originalSopContent = fs.readFileSync(origPath, 'utf-8');
          }
        }

        // Build the Updated Doc:
        // [Approval stamp] + [Full original SOP] + [--- separator] + [What was changed]
        const approvalHeader =
          `# ${outStem} — Approved Update\n\n` +
          `> [!SUCCESS] ✅ Approved\n` +
          `> **Approved by:** ${approvedBy}\n` +
          `> **Approved on:** ${dateStr} at ${timeStr}\n` +
          `> **Request:** #${entryNum} from Approvals/${dateKey}.md\n` +
          `> **Original File:** ${origFileName || outName}\n\n` +
          `---\n\n`;

        const changesSection =
          `\n\n---\n\n` +
          `## 📝 Changes Applied\n\n` +
          `> The following update was approved by **${approvedBy}** on ${dateStr} at ${timeStr}.\n\n` +
          docBody;

        const updatedDocContent = originalSopContent
          ? approvalHeader + originalSopContent.trim() + changesSection
          : approvalHeader + docBody;

        fs.writeFileSync(outPath, updatedDocContent, 'utf-8');
        updatedFilePath = `Updated Doc/${outFile}`;
        console.log(`✅ Updated Doc written → ${updatedFilePath}`);
        broadcast({ type: 'vault-changed', file: updatedFilePath });
      }
    }

    // Mark the entry as approved in the approval log
    content = content.replace(
      new RegExp(
        `(## Request #${entryNum} —[\\s\\S]*?)\\*\\*Status:\\*\\* ⏳ Pending Approval`,
        'g'
      ),
      `$1**Status:** ✅ Approved by **${approvedBy}** on ${dateStr} at ${timeStr}` +
      (updatedFilePath ? `\n**Updated File:** [[${updatedFilePath}]]` : '')
    );

    fs.writeFileSync(dayFile, content, 'utf-8');
    broadcast({ type: 'vault-changed', file: `Approvals/${dateKey}.md` });

    console.log(`✅ Request #${entryNum} approved by ${approvedBy}`);
    res.json({
      success: true,
      message: `Request #${entryNum} approved.`,
      updatedFile: updatedFilePath || null,
      approvedBy,
      timestamp: `${dateStr} at ${timeStr}`
    });

  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Failed to process approval: ' + err.message });
  }
});

// ============================================
// REJECT A PENDING REQUEST
// POST /api/reject
// Body: { username, password, dateKey, entryNum, reason }
// ============================================
app.post('/api/reject', (req, res) => {
  try {
    const { username, password, dateKey, entryNum, reason } = req.body;

    if (!validateAdmin(username, password)) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const dayFile = path.join(APPROVALS_PATH, `${dateKey}.md`);
    if (!fs.existsSync(dayFile)) {
      return res.status(404).json({ error: `Approval log not found: ${dateKey}.md` });
    }

    let content = fs.readFileSync(dayFile, 'utf-8');

    const entryRegex = new RegExp(
      `## Request #${entryNum} —[\\s\\S]*?\\*\\*Status:\\*\\* ⏳ Pending Approval`,
      'g'
    );
    if (!entryRegex.test(content)) {
      return res.status(404).json({ error: `Request #${entryNum} not found or already processed.` });
    }

    // Extract temp file path from the entry
    const tempMatch = content.match(
      new RegExp(`## Request #${entryNum} —[\\s\\S]*?\\*\\*Temp File\\*\\* \\| \\[\\[(.+?)\\]\\]`)
    );
    const sourceMatch = content.match(
      new RegExp(`## Request #${entryNum} —[\\s\\S]*?\\*\\*Source\\*\\* \\| (.+?)\\n`)
    );

    const tempRelPath = tempMatch ? tempMatch[1].trim() : null;
    const sourceRaw   = sourceMatch ? sourceMatch[1].trim() : null;

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const rejectionNote = reason ? `\n**Rejection reason:** ${reason}` : '';

    // If there's a temp file — update it to show rejected status
    if (tempRelPath) {
      const tempFullPath = path.join(OBSIDIAN_DB_PATH, tempRelPath);

      if (fs.existsSync(tempFullPath)) {
        let tempContent = fs.readFileSync(tempFullPath, 'utf-8');

        // Update the Temp file in-place to show rejected status
        tempContent = tempContent
          .replace(
            /^> \*\*Status:\*\* ⏳ Pending Approval$/m,
            `> **Status:** ❌ Rejected`
          );

        // Insert rejection details after the status line
        tempContent = tempContent.replace(
          /^(> \*\*Status:\*\* ❌ Rejected)$/m,
          `$1\n> **Rejected by:** ${username}\n> **Rejected on:** ${dateStr} at ${timeStr}${reason ? `\n> **Rejection reason:** ${reason}` : ''}`
        );

        // Replace the title to reflect rejection
        tempContent = tempContent.replace(
          /^# .+ — Pending Update$/m,
          `# ${path.basename(tempRelPath).replace('_temp_', ' — ❌ Rejected Update ').replace('.md', '')}`
        );

        fs.writeFileSync(tempFullPath, tempContent, 'utf-8');
        console.log(`📄 Temp file updated to rejected: ${tempRelPath}`);
        broadcast({ type: 'vault-changed', file: tempRelPath });
      }
    }

    content = content.replace(
      new RegExp(
        `(## Request #${entryNum} —[\\s\\S]*?)\\*\\*Status:\\*\\* ⏳ Pending Approval`,
        'g'
      ),
      `$1**Status:** ❌ Rejected by **${username}** on ${dateStr} at ${timeStr}${rejectionNote}`
    );

    fs.writeFileSync(dayFile, content, 'utf-8');
    broadcast({ type: 'vault-changed', file: `Approvals/${dateKey}.md` });

    console.log(`❌ Request #${entryNum} rejected by ${username}`);
    res.json({ success: true, message: `Request #${entryNum} rejected.` });

  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Failed to reject: ' + err.message });
  }
});

// ============================================
// GET PENDING APPROVALS for a date
// GET /api/approvals?date=2026-05-11
// ============================================
app.get('/api/approvals', (req, res) => {
  try {
    const dateKey = req.query.date;
    if (!dateKey) return res.status(400).json({ error: 'date param required' });

    const dayFile = path.join(APPROVALS_PATH, `${dateKey}.md`);
    if (!fs.existsSync(dayFile)) return res.json({ requests: [] });

    const content = fs.readFileSync(dayFile, 'utf-8');

    // Parse each ## Request block
    const blocks = content.split(/(?=## Request #\d+)/g).filter(b => b.startsWith('## Request #'));
    const requests = blocks.map(block => {
      const numMatch    = block.match(/## Request #(\d+) — (.+)/);
      const statusMatch = block.match(/\*\*Status:\*\* (.+)/);
      const sourceMatch = block.match(/\*\*Source\*\* \| (.+)/);
      const tempMatch   = block.match(/\*\*Temp File\*\* \| \[\[(.+?)\]\]/);
      const qMatch      = block.match(/\*\*Question \/ Context:\*\*\n> (.+)/);

      return {
        entryNum : numMatch  ? parseInt(numMatch[1])  : 0,
        time     : numMatch  ? numMatch[2].trim()      : '',
        status   : statusMatch ? statusMatch[1].trim() : '',
        source   : sourceMatch ? sourceMatch[1].trim() : '',
        tempFile : tempMatch   ? tempMatch[1].trim()   : null,
        question : qMatch      ? qMatch[1].trim()      : '',
        pending  : statusMatch ? statusMatch[1].includes('Pending') : false,
      };
    });

    res.json({ dateKey, requests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// RENAME FILE
// ============================================
app.post('/api/file/rename', (req, res) => {
  try {
    const { filePath, newName } = req.body;
    if (!filePath || !newName) return res.status(400).json({ error: 'filePath and newName required' });

    const fullPath = path.join(OBSIDIAN_DB_PATH, filePath);
    if (!fullPath.startsWith(OBSIDIAN_DB_PATH)) return res.status(403).json({ error: 'Access denied' });
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

    const safeName = newName.endsWith('.md') ? newName : newName + '.md';
    const newPath = path.join(path.dirname(fullPath), safeName);
    const newRelPath = path.join(path.dirname(filePath), safeName).replace(/\\/g, '/');

    if (fs.existsSync(newPath)) return res.status(409).json({ error: `"${safeName}" already exists` });

    fs.renameSync(fullPath, newPath);
    console.log(`✏️ Renamed: ${filePath} → ${newRelPath}`);
    res.json({ success: true, newPath: newRelPath, newName: safeName });
  } catch (err) {
    console.error('Rename error:', err);
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// ============================================
// DELETE FILE
// ============================================
app.delete('/api/file', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'filePath required' });

    const fullPath = path.join(OBSIDIAN_DB_PATH, filePath);
    if (!fullPath.startsWith(OBSIDIAN_DB_PATH)) return res.status(403).json({ error: 'Access denied' });
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

    fs.unlinkSync(fullPath);
    console.log(`🗑️ Deleted: ${filePath}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// ============================================
// SAVE FILE (edit existing SOP)
// ============================================
app.post('/api/file/save', (req, res) => {
  try {
    const { filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'filePath and content required' });
    }

    const fullPath = path.join(OBSIDIAN_DB_PATH, filePath);
    if (!fullPath.startsWith(OBSIDIAN_DB_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`💾 File saved: ${filePath}`);
    res.json({ success: true, message: 'File saved' });
  } catch (err) {
    console.error('Error saving file:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// ============================================
// MERGE TWO SOPs INTO A NEW FILE
// ============================================
app.post('/api/file/merge', (req, res) => {
  try {
    const { fileA, fileB, newFileName, mergedContent } = req.body;
    if (!fileA || !fileB || !newFileName || !mergedContent) {
      return res.status(400).json({ error: 'fileA, fileB, newFileName and mergedContent required' });
    }

    // Sanitise filename
    const safeName = newFileName.replace(/[^a-zA-Z0-9 _\-\.]/g, '').trim();
    const finalName = safeName.endsWith('.md') ? safeName : safeName + '.md';
    const fullPath  = path.join(OBSIDIAN_DB_PATH, finalName);

    if (!fullPath.startsWith(OBSIDIAN_DB_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (fs.existsSync(fullPath)) {
      return res.status(409).json({ error: `File "${finalName}" already exists. Choose a different name.` });
    }

    fs.writeFileSync(fullPath, mergedContent, 'utf-8');
    console.log(`🔀 Merged "${fileA}" + "${fileB}" → "${finalName}"`);
    res.json({ success: true, fileName: finalName, message: `Merged into ${finalName}` });
  } catch (err) {
    console.error('Error merging files:', err);
    res.status(500).json({ error: 'Failed to merge files' });
  }
});

// ============================================
// GET CHAT HISTORY
// ============================================
app.get('/api/chat-history', (req, res) => {
  try {
    const grouped = {};
    const items = fs.readdirSync(CHAT_HISTORY_PATH);

    items.forEach(item => {
      const fullPath = path.join(CHAT_HISTORY_PATH, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(item)) {
        // Date subfolder
        const dateKey = item;
        const dayFiles = fs.readdirSync(fullPath)
          .filter(f => f.endsWith('.md'))
          .map(f => ({
            name: f,
            dateKey,
            relativeName: `${dateKey}/${f}`,
            created: fs.statSync(path.join(fullPath, f)).birthtimeMs || fs.statSync(path.join(fullPath, f)).mtimeMs
          }))
          .sort((a, b) => b.created - a.created);

        if (dayFiles.length) grouped[dateKey] = dayFiles;

      } else if (item.endsWith('.md') && item !== '_memory.json') {
        // Legacy flat files — put under their actual date if possible
        const tsMatch = item.match(/(\d{13})/);
        const dateKey = tsMatch
          ? new Date(parseInt(tsMatch[1])).toISOString().slice(0, 10)
          : 'older';
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push({
          name: item,
          dateKey,
          relativeName: item,
          created: stat.birthtimeMs || stat.mtimeMs
        });
      }
    });

    // Sort each group newest first, sort date keys newest first
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'older') return 1;
      if (b === 'older') return -1;
      return b.localeCompare(a);
    });

    const result = sortedDates.map(dateKey => ({
      dateKey,
      label: dateKey === 'older' ? 'Older Chats' : formatDateLabel(dateKey),
      chats: grouped[dateKey]
    }));

    res.json({ groups: result, total: result.reduce((s, g) => s + g.chats.length, 0) });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

function formatDateLabel(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short' });
}

// ============================================
// GET SPECIFIC CHAT CONTENT
// ============================================
app.get('/api/chat/*', (req, res) => {
  try {
    const filename = req.params[0];
    const chatPath = path.join(CHAT_HISTORY_PATH, filename);

    if (!chatPath.startsWith(CHAT_HISTORY_PATH)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!fs.existsSync(chatPath)) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const content = fs.readFileSync(chatPath, 'utf-8');
    res.json({ name: filename, content });
  } catch (error) {
    console.error('Error reading chat:', error);
    res.status(500).json({ error: 'Failed to read chat' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ============================================
// OLLAMA STATUS & MODELS
// ============================================
app.get('/api/ollama-status', async (req, res) => {
  try {
    // Check if Ollama is reachable
    const statusResponse = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });

    const models = statusResponse.data.models || [];
    const modelNames = models.map(m => m.name);

    res.json({
      running: true,
      models: modelNames,
      hasModels: modelNames.length > 0,
      defaultModel: 'mistral',
      mistralAvailable: modelNames.some(m => m.includes('mistral')),
      message: modelNames.length === 0 ? 'No models found. Run: ollama pull mistral' : 'Ready'
    });
  } catch (error) {
    console.error('Ollama check failed:', error.message);
    res.json({
      running: false,
      models: [],
      hasModels: false,
      message: `Ollama not available: ${error.message}`,
      error: true
    });
  }
});

// ============================================
// NEURAL GRAPH — scan vault for [[links]] and return nodes + edges
// ============================================
app.get('/api/graph', (req, res) => {
  try {
    const nodes = [];   // { id, name, folder, path, keywords }
    const edges = [];   // { source, target, type }
    const fileMap = {}; // name (lowercase, no .md) → node id

    // Walk vault and collect all .md files
    const walkDir = (dir, relative = '') => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const relPath = path.join(relative, item);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath, relPath);
          } else if (item.endsWith('.md')) {
            const id = relPath.replace(/\\/g, '/');
            const name = item.replace(/\.md$/, '');
            nodes.push({ id, name, folder: relative ? relative.replace(/\\/g, '/') : null, path: id });
            fileMap[name.toLowerCase()] = id;
          }
        });
      } catch (err) { /* skip unreadable dirs */ }
    };

    walkDir(OBSIDIAN_DB_PATH);

    // Scan each file for [[links]] and extract keywords
    const linkRegex = /\[\[([^\]|#]+)(?:[|#][^\]]*?)?\]\]/g;
    const nodeKeywords = {}; // node.id → Set of keywords
    const nodeContent = {};  // node.id → content (for similarity)

    nodes.forEach(node => {
      try {
        const fullPath = path.join(OBSIDIAN_DB_PATH, node.path);
        const content = fs.readFileSync(fullPath, 'utf-8');
        nodeContent[node.id] = content;

        // Extract [[wiki-links]]
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
          const linkedName = match[1].trim().toLowerCase();
          const targetId = fileMap[linkedName];
          if (targetId && targetId !== node.id) {
            edges.push({ source: node.id, target: targetId, type: 'link' });
          }
        }

        // Extract keywords from content (headings, bold text, common terms)
        const words = content.toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 4);
        // Count word frequency, take top keywords
        const freq = {};
        words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
        const topWords = Object.entries(freq)
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([word]) => word);
        nodeKeywords[node.id] = new Set(topWords);
      } catch (err) { /* skip unreadable files */ }
    });

    // Build implicit connections: shared folder
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].folder && nodes[i].folder === nodes[j].folder) {
          edges.push({ source: nodes[i].id, target: nodes[j].id, type: 'folder' });
        }
      }
    }

    // Build implicit connections: keyword similarity (shared keywords)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const kwA = nodeKeywords[nodes[i].id];
        const kwB = nodeKeywords[nodes[j].id];
        if (!kwA || !kwB) continue;
        let shared = 0;
        kwA.forEach(w => { if (kwB.has(w)) shared++; });
        // Require at least 5 shared keywords to form an edge
        if (shared >= 5) {
          edges.push({ source: nodes[i].id, target: nodes[j].id, type: 'keyword' });
        }
      }
    }

    // Build implicit connections: name similarity (shared significant words in file name)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const wordsA = nodes[i].name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
        const wordsB = nodes[j].name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
        const shared = wordsA.filter(w => wordsB.includes(w));
        if (shared.length >= 2) {
          edges.push({ source: nodes[i].id, target: nodes[j].id, type: 'name' });
        }
      }
    }

    // Deduplicate edges (keep strongest type: link > name > keyword > folder)
    const edgeMap = {};
    const typePriority = { link: 4, name: 3, keyword: 2, folder: 1 };
    edges.forEach(e => {
      const key = [e.source, e.target].sort().join('|');
      if (!edgeMap[key] || typePriority[e.type] > typePriority[edgeMap[key].type]) {
        edgeMap[key] = e;
      }
    });
    const uniqueEdges = Object.values(edgeMap);

    res.json({ nodes, edges: uniqueEdges, totalNodes: nodes.length, totalEdges: uniqueEdges.length });
  } catch (error) {
    console.error('Error building graph:', error);
    res.status(500).json({ error: 'Failed to build graph' });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, HOST, () => {
  // Detect all available IPs dynamically
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, ip: net.address });
      }
    }
  }

  console.log('═════════════════════════════════════════');
  console.log('🚀 Obsidian AI Agent Running');
  console.log(`📡 Local:   http://127.0.0.1:${PORT}`);
  ips.forEach(({ name, ip }) => {
    const label = name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless') ? '📶 Wi-Fi' :
                  name.toLowerCase().includes('vpn') || name.toLowerCase().includes('tunnel') ? '🔒 VPN ' :
                  name.toLowerCase().includes('ethernet') ? '🔌 LAN ' : '🌐 Net ';
    console.log(`${label}:   http://${ip}:${PORT}  ← share on ${name}`);
  });
  console.log('═════════════════════════════════════════');
  console.log('✅ Ready to receive messages...');
  console.log('⚠️  Make sure Ollama is running: ollama serve');
  console.log('═════════════════════════════════════════');
});
