# 🧠 Backend Configuration Guide

## Overview

The backend is an Express.js server that handles AI processing and file management.

## Architecture

```
Backend Server (Port 3001)
    ├── Static File Serving
    │   └── Serves frontend HTML/JS
    │
    ├── API Endpoints
    │   ├── /health         - Server status
    │   ├── /files          - List vault files
    │   ├── /file           - Read specific file
    │   └── /chat           - AI chat endpoint
    │
    ├── Ollama Integration
    │   └── Connects to local LLM (http://127.0.0.1:11434)
    │
    ├── File Storage
    │   └── Saves chats to Vault/Chats/
    │
    └── Context Management
        ├── Active file content
        ├── Conversation history
        └── System prompts
```

## Configuration Options

### 1. Change AI Model

**File:** `obsidian-chat/backend/server.js`  
**Location:** Around line 115

```javascript
body: JSON.stringify({
  model: "llama2",           // ← Change this
  prompt: fullPrompt,
  stream: false,
  temperature: 0.7
}),
```

**Available Models:**

| Model | Speed | Quality | RAM | Use Case |
|-------|-------|---------|-----|----------|
| `mistral` | ⚡⚡⚡ Fast | ⭐⭐⭐⭐ Great | 4GB | **Best overall** |
| `neural-chat` | ⚡⚡ Moderate | ⭐⭐⭐⭐ Great | 4GB | Chat-optimized |
| `llama2` | ⚡⚡ Moderate | ⭐⭐⭐⭐ Great | 3.8GB | General purpose |
| `orca-mini` | ⚡⚡⚡ Fast | ⭐⭐⭐ Good | 1.3GB | Lightweight |
| `dolphin-mixtral` | ⚡ Slow | ⭐⭐⭐⭐⭐ Excellent | 26GB | High-quality |

### 2. Adjust Response Temperature

**Location:** Same line as model selection

```javascript
temperature: 0.7              // ← Change this (0.0 - 2.0)
```

**Temperature Effects:**

- `0.0 - 0.3` - Deterministic, precise, factual
  - Good for: Analysis, coding, factual questions
  
- `0.4 - 0.7` - Balanced (Default: 0.7)
  - Good for: General conversation, summarization
  
- `0.8 - 1.2` - Creative, varied responses
  - Good for: Brainstorming, creative writing
  
- `1.3 - 2.0` - Very creative, unpredictable
  - Good for: Fiction, experimental outputs

### 3. Customize System Prompt

**Location:** Around line 35

```javascript
const SYSTEM_PROMPT = `You are an intelligent AI assistant...`;
```

**Custom Prompts Examples:**

**For Technical Analysis:**
```javascript
const SYSTEM_PROMPT = `You are a technical expert specializing in software architecture and code analysis. 
Provide detailed, code-focused insights. Use technical terminology accurately. 
Suggest best practices and optimizations when relevant.`;
```

**For Business Documents:**
```javascript
const SYSTEM_PROMPT = `You are a business analyst expert in reading and summarizing corporate documents.
Focus on key decisions, financial impacts, and action items.
Provide clear executive summaries.`;
```

**For Creative Writing:**
```javascript
const SYSTEM_PROMPT = `You are a creative writing assistant with expertise in storytelling.
Help develop characters, plots, and narratives. Provide constructive feedback.
Encourage creative exploration and experimentation.`;
```

### 4. Adjust Context Window

**Location:** Around line 48

```javascript
activeFileContent.substring(0, 10000)  // ← Change 10000 to adjust
```

This limits how much of a file is sent to the AI.

- Smaller (5000): Faster, but less context
- Larger (20000): More context, but slower
- Maximum (no limit): Send entire file

### 5. Modify Conversation History

**Location:** Around line 68

```javascript
conversationHistory.slice(-10)  // ← Change 10 for different history length
```

- Smaller (5): Shorter memory, faster responses
- Larger (15): Longer memory, better context
- Larger (30): Maximum memory, slower responses

### 6. Change Server Port

**Location:** Around line 320

```javascript
app.listen(3001, "127.0.0.1", () => {  // ← Change 3001
```

Change to any available port:
```javascript
app.listen(8080, "127.0.0.1", () => {  // Now on port 8080
```

Also update frontend `config.js`:
```javascript
const API_BASE = "http://127.0.0.1:8080";  // Match backend port
```

### 7. Allow Remote Access

**Location:** Around line 320

Change from:
```javascript
app.listen(3001, "127.0.0.1", () => {  // Only local access
```

To:
```javascript
app.listen(3001, "0.0.0.0", () => {  // Accept from any IP
```

⚠️ **Warning:** Only do this on trusted networks!

### 8. Configure Request Timeout

**Location:** Around line 100

```javascript
new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Timeout")), 30000)  // ← 30 seconds
)
```

Increase for slower models:
- `15000` - 15 seconds (for very fast models)
- `30000` - 30 seconds (default)
- `60000` - 60 seconds (for slower models)

### 9. Adjust Message Length Limit

**Location:** Around line 80

```javascript
if (message.length > 5000) {  // ← Change 5000
```

## Environment Variables

Create a `.env` file for easy configuration:

```bash
# .env file
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama2
AI_TEMPERATURE=0.7
SERVER_PORT=3001
SERVER_HOST=127.0.0.1
VAULT_PATH=C:/Users/adisba/OneDrive - amazon.com/Desktop/Obsidian database
CHAT_DIR=C:/Users/adisba/OneDrive - amazon.com/Desktop/obsidian-chat/Vault/Chats
```

Then load in server.js:
```javascript
require('dotenv').config();
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama2";
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE) || 0.7;
```

## API Endpoints

### GET /health
Check server status
```bash
curl http://127.0.0.1:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "ollama": "http://127.0.0.1:11434"
}
```

### GET /files
List all vault files
```bash
curl http://127.0.0.1:3001/files
```

Response:
```json
[
  {
    "name": "Documents",
    "type": "folder",
    "children": [...]
  },
  {
    "name": "Document.md",
    "type": "file",
    "path": "/Documents/Document.md"
  }
]
```

### GET /file?path=/path/to/file.md
Get file content
```bash
curl "http://127.0.0.1:3001/file?path=/Documents/Document.md"
```

Response:
```json
{
  "content": "# Document Content\n...",
  "file": "/Documents/Document.md"
}
```

### POST /chat
Send message to AI
```bash
curl -X POST http://127.0.0.1:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

Response:
```json
{
  "reply": "Hello! How can I help you today?"
}
```

## Error Handling

The backend includes comprehensive error handling:

| Error | Cause | Solution |
|-------|-------|----------|
| Cannot reach Ollama API | Ollama not running | Start Ollama: `ollama serve` |
| Empty response | Model not working | Restart Ollama or switch model |
| Timeout | Slow model/system | Increase timeout or use faster model |
| File not found | Wrong path | Check file exists and path is correct |
| JSON parse failed | Corrupted response | Restart Ollama or check model |

## Logging

The server logs events in the terminal:

```
📁 Vault: C:/path/to/vault
💾 Chat: C:/path/to/chats
🔄 Attempting Ollama connection...
✅ Ollama success
💾 Chat saved: chat-1234567890.md
```

Enable detailed logging by adding:
```javascript
console.log("🐛 Full prompt:", fullPrompt);
console.log("🐛 Response time:", Date.now() - startTime + "ms");
```

## Performance Tuning

### For Speed:
1. Use `mistral` model
2. Lower temperature (0.5)
3. Reduce context window (5000)
4. Reduce history (5 messages)
5. Reduce timeout (15000ms)

### For Quality:
1. Use `llama2` or `neural-chat`
2. Higher temperature (0.8)
3. Larger context window (20000)
4. More history (15 messages)
5. Longer timeout (60000ms)

### For Balance:
1. Use `mistral` model
2. Temperature 0.7 (default)
3. Context window 10000
4. History 10 messages
5. Timeout 30000ms

## Security Considerations

⚠️ **Important:**

1. **File Access** - Server reads all files in vault path
   - Ensure vault path contains only shareable documents
   - Don't use for sensitive personal/financial data

2. **Network Access** - By default, only local access
   - If allowing remote: use HTTPS, authentication
   - Don't expose on public internet without security

3. **Message Storage** - Chats saved to disk
   - Review saved chat files periodically
   - Don't store sensitive information in messages

## Monitoring

Monitor server health:

```bash
# Check if running
curl http://127.0.0.1:3001/health

# Monitor Ollama
curl http://127.0.0.1:11434/api/tags

# Check server logs (terminal output)
# Look for errors and warnings
```

## Common Issues & Solutions

### Issue: Slow Responses
```javascript
// Try faster model
model: "mistral",

// Or reduce temperature
temperature: 0.5,

// Or reduce context
.substring(0, 5000)
```

### Issue: Out of Memory
```javascript
// Use smaller model
model: "orca-mini",

// Or reduce context window
.substring(0, 5000)
```

### Issue: Token Limit Exceeded
```javascript
// Already handled by context window limit
// But can adjust further:
.substring(0, 2000)  // Very small context
```

### Issue: Inconsistent Responses
```javascript
// Lower temperature for consistency
temperature: 0.3,

// Or use a different model
model: "mistral",
```

## Deployment

### Local Network Sharing
1. Change host from `127.0.0.1` to `0.0.0.0`
2. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Share URL: `http://YOUR_IP:3001`

### Docker Deployment
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3001
CMD ["node", "server.js"]
```

### Cloud Deployment
Not recommended for local Ollama. Requires:
- Cloud-based LLM API (OpenAI, etc.)
- Significant refactoring of backend

## Testing

Test endpoints with curl:
```bash
# Test server
curl http://127.0.0.1:3001/health

# Test file listing
curl http://127.0.0.1:3001/files | jq

# Test chat
curl -X POST http://127.0.0.1:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' | jq
```

---

**Happy configuring! 🎛️**
