const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   📂 STATIC FILES (Frontend)
========================= */

const FRONTEND_PATH = path.join(__dirname, "../frontend");

app.use(express.static(FRONTEND_PATH));

// Serve index.html for root and SPA routes
app.get(["/", "/app"], (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

/* =========================
   📁 PATHS
========================= */

const VAULT_PATH =
  "C:/Users/adisba/OneDrive - amazon.com/Desktop/Obsidian database";

const CHAT_DIR =
  "C:/Users/adisba/OneDrive - amazon.com/Desktop/obsidian-chat/Vault/Chats";

console.log("📁 Vault:", VAULT_PATH);
console.log("💾 Chat:", CHAT_DIR);

/* =========================
   🧠 AGENT SYSTEM PROMPT
========================= */

const SYSTEM_PROMPT = `You are an intelligent AI assistant specialized in helping users with information management and analysis.

Your strengths:
- Analyzing and summarizing documents
- Answering questions about provided content
- Providing clear, helpful explanations
- Offering actionable suggestions
- Supporting brainstorming and problem-solving

Guidelines:
- Be concise but thorough
- Use markdown formatting for clarity
- Ask clarifying questions when needed
- Provide examples when helpful
- Be honest about limitations

Current Date: ${new Date().toLocaleDateString()}`;

/* =========================
   🧠 CONTEXT MEMORY
========================= */

let activeFileContent = "";
let activeFileName = "";
let conversationHistory = [];

/* =========================
   📂 INIT CHAT DIR
========================= */

function ensureChatDir() {
  if (!fs.existsSync(CHAT_DIR)) {
    fs.mkdirSync(CHAT_DIR, { recursive: true });
    console.log("📁 Created chat directory");
  }
}

ensureChatDir();

/* =========================

   📁 VAULT TREE
========================= */

app.get("/api/vault", (req, res) => {
  function readDir(dir) {
    const items = fs.readdirSync(dir);

    return items.map((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        return {
          name: item,
          type: "folder",
          children: readDir(fullPath),
        };
      }

      return {
        name: item,
        type: "file",
        path: fullPath
          .replace(VAULT_PATH, "")
          .replace(/\\/g, "/"),
      };
    });
  }

  try {
    const files = readDir(VAULT_PATH).filter(f => f.type === "file");
    res.json({ files });
  } catch (err) {
    console.error("❌ Vault error:", err);
    res.status(500).json({ error: "Vault read failed" });
  }
});

/* =========================
   📄 OPEN FILE
========================= */

app.get("/api/file", (req, res) => {
  try {
    const filePath = path.join(VAULT_PATH, req.query.path);

    const content = fs.readFileSync(filePath, "utf-8");

    activeFileContent = content;
    activeFileName = req.query.path;

    console.log("📄 Active file:", activeFileName);

    res.json({
      content,
      file: activeFileName,
    });

  } catch (err) {
    console.error("❌ File error:", err);
    res.status(500).json({ error: "Cannot open file" });
  }
});

/* =========================
   💬 CHAT + AI (IMPROVED)
========================= */

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ response: "❌ No message received" });
    }

    if (message.length > 5000) {
      return res.status(400).json({ response: "❌ Message too long (max 5000 characters)" });
    }

    /* =========================
       🧠 BUILD INTELLIGENT PROMPT
    ========================= */

    let fullPrompt = SYSTEM_PROMPT + "\n\n";

    // Add file context if available
    if (activeFileContent && activeFileContent.trim()) {
      fullPrompt += `📄 FILE CONTEXT: "${activeFileName}"\n`;
      fullPrompt += `---\n${activeFileContent.substring(0, 10000)}\n---\n\n`;
    }

    // Add recent conversation history for context (last 5 exchanges)
    if (conversationHistory.length > 0) {
      fullPrompt += "RECENT CONVERSATION:\n";
      conversationHistory.slice(-10).forEach(msg => {
        fullPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`;
      });
      fullPrompt += "\n";
    }

    // Add the current user message
    fullPrompt += `USER MESSAGE: ${message}`;

    let reply = "";
    let ollamaAvailable = true;

    /* =========================
       🤖 TRY OLLAMA (Local LLM)
    ========================= */

    try {
      console.log("🔄 Attempting Ollama connection...");
      
      const response = await Promise.race([
        fetch("http://127.0.0.1:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "mistral",
            prompt: fullPrompt,
            stream: false,
            temperature: 0.7
          }),
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Timeout")), 60000)
        )
      ]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawText = await response.text();

      if (!rawText.trim()) {
        throw new Error("Empty response from Ollama");
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        // If not JSON, treat as raw response
        reply = rawText;
        console.log("✅ Got raw response from Ollama");
        ollamaAvailable = true;
        return;
      }

      if (data.response && data.response.trim()) {
        reply = data.response.trim();
        console.log("✅ Ollama success");
        ollamaAvailable = true;
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No response field in Ollama output");
      }

    } catch (ollamaError) {
      console.error("⚠️ Ollama failed:", ollamaError.message);
      ollamaAvailable = false;
      reply = `⚠️ **AI Not Available**\n\nCannot connect to Ollama server at http://127.0.0.1:11434\n\n**Setup instructions:**\n1. Install Ollama from ollama.ai\n2. Run: \`ollama serve\`\n3. Pull a model: \`ollama pull llama2\`\n4. Ensure Ollama is running and accessible\n\n**Your message was saved for later analysis:**\n> ${message}`;
    }

    /* =========================
       💾 SAVE TO HISTORY
    ========================= */

    conversationHistory.push(
      { role: "user", content: message },
      { role: "assistant", content: reply }
    );

    // Keep history manageable (last 20 messages)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    /* =========================
       💾 SAVE CHAT TO FILE
    ========================= */

    try {
      const fileName = `chat-${Date.now()}.md`;
      const filePath = path.join(CHAT_DIR, fileName);

      const chatContent = `# Chat Session
Date: ${new Date().toISOString()}
Model: ${ollamaAvailable ? "Ollama (mistral)" : "Unavailable"}

## Context File
${activeFileName || "None"}

## Conversation

**User:** ${message}

**Assistant:** ${reply}
`;

      fs.writeFileSync(filePath, chatContent);
      console.log("💾 Chat saved:", fileName);

    } catch (err) {
      console.error("❌ Failed to save chat:", err.message);
    }

    res.json({ response: reply });

  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ 
      response: "❌ **Server Error**\n\nSomething went wrong. Please try again.\n\nError details: " + err.message 
    });
  }
});

/* =========================
   📜 CHAT HISTORY LIST
========================= */

app.get("/api/chat-history", (req, res) => {
  try {
    if (!fs.existsSync(CHAT_DIR)) {
      return res.json({ chats: [] });
    }
    const files = fs.readdirSync(CHAT_DIR)
      .filter(f => f.endsWith(".md"))
      .map(f => {
        const stat = fs.statSync(path.join(CHAT_DIR, f));
        return { name: f, created: stat.birthtimeMs || stat.mtimeMs };
      })
      .sort((a, b) => b.created - a.created);
    res.json({ chats: files });
  } catch (err) {
    console.error("❌ History error:", err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

/* =========================
   📄 LOAD SINGLE CHAT
========================= */

app.get("/api/chat/:name", (req, res) => {
  try {
    const filePath = path.join(CHAT_DIR, req.params.name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  } catch (err) {
    console.error("❌ Load chat error:", err);
    res.status(500).json({ error: "Failed to load chat" });
  }
});

/* =========================
   🔍 OLLAMA STATUS
========================= */

app.get("/api/ollama-status", async (req, res) => {
  try {
    const response = await Promise.race([
      fetch("http://127.0.0.1:11434/api/tags"),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
    ]);
    const data = await response.json();
    const models = (data.models || []).map(m => m.name);
    res.json({
      running: true,
      models,
      mistralAvailable: models.some(m => m.includes("mistral")),
      llama2Available: models.some(m => m.includes("llama2"))
    });
  } catch {
    res.json({ running: false, message: "Ollama not reachable", models: [] });
  }
});

/* =========================
   🚀 START SERVER
========================= */

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    ollama: "http://127.0.0.1:11434"
  });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("🚀 Obsidian AI Agent Running");
  console.log("📡 Server: http://127.0.0.1:3001");
  console.log("📡 Network: http://10.10.139.95:3001");
  console.log("🤖 Open frontend: http://127.0.0.1:3001 (if static serving enabled)");
  console.log("📚 Vault path: " + VAULT_PATH);
  console.log("\n💡 Make sure Ollama is running: ollama serve");
});