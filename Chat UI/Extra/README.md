# 🤖 Obsidian AI Agent

A powerful AI assistant integrated with your Obsidian vault for intelligent document analysis and question-answering.

## Features

✅ **Smart Context Integration** - Automatically uses file content as context for answers  
✅ **Conversation History** - Maintains context across multiple messages  
✅ **Markdown Support** - Beautiful formatted responses with code highlighting  
✅ **Vault Browser** - Easy navigation and selection of files  
✅ **Local Processing** - Uses Ollama for privacy-first AI  
✅ **Chat History** - Automatic saving of all conversations  

## Quick Start

### 1. Prerequisites

You need to have **Ollama** installed on your system:

- **Download**: https://ollama.ai
- **Install**: Follow the installation guide for your OS
- **Verify**: Run `ollama --version` in terminal

### 2. Start Ollama

Open a terminal and run:
```bash
ollama serve
```

This will start the Ollama server on `http://127.0.0.1:11434`

### 3. Pull a Model (First Time Only)

Open another terminal and run:
```bash
ollama pull llama2
```

This downloads the llama2 model (~4GB). You can also try other models:
```bash
ollama pull mistral          # Faster, good quality
ollama pull neural-chat      # Optimized for chat
ollama pull orca-mini        # Lightweight option
```

### 4. Start the Backend Server

Navigate to the backend folder:
```bash
cd "obsidian-chat/backend"
npm install
node server.js
```

You should see:
```
🚀 Obsidian AI Agent Running
📡 Server: http://127.0.0.1:3001
```

### 5. Open the Frontend

Open your browser and go to:
```
http://127.0.0.1:3001
```

## How to Use

### Basic Chat
1. Type your question in the input field
2. Press Enter or click Send
3. The AI will respond with analyzed content

### Using File Context
1. Click on a file in the left sidebar
2. The file content will be displayed and used as context
3. Ask questions about that file - the AI will reference it

### Tips for Best Results

**📝 Ask Specific Questions**
- Instead of "Tell me about this", ask "Summarize the key points..."
- Include context: "Based on this document, what should I..."

**🔗 Use File Context**
- Select a file first, then ask questions
- The AI has full access to the file content

**💬 Multi-turn Conversations**
- Build on previous messages
- The AI remembers recent conversations
- Ask follow-up questions naturally

## Troubleshooting

### "Cannot reach Ollama API"
**Solution**: Make sure Ollama is running
```bash
ollama serve
```

### Server won't start
**Solution**: Check if port 3001 is already in use
```bash
# Windows: Find and kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Slow responses
**Solution**: Check which model is loaded
- Smaller models are faster but less capable
- `ollama pull mistral` is faster than llama2

### Empty responses
**Solution**: 
- Make sure the model is properly installed: `ollama list`
- Restart Ollama server
- Try a different model

## Model Recommendations

| Model | Speed | Quality | Size | Best For |
|-------|-------|---------|------|----------|
| **mistral** | ⚡⚡⚡ | ⭐⭐⭐⭐ | 4GB | **Recommended** |
| **neural-chat** | ⚡⚡ | ⭐⭐⭐⭐ | 4GB | Chat-optimized |
| **llama2** | ⚡⚡ | ⭐⭐⭐⭐ | 3.8GB | General purpose |
| **orca-mini** | ⚡⚡⚡ | ⭐⭐⭐ | 1.3GB | Fast responses |

## Architecture

```
obsidian-chat/
├── backend/
│   ├── server.js          # Express.js API server
│   ├── package.json       # Dependencies
│   └── (node_modules/)
├── frontend/
│   └── index.html         # Single-page app
└── Vault/
    └── Chats/             # Saved conversations
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check server status |
| `/files` | GET | List vault files |
| `/file?path=...` | GET | Read specific file |
| `/chat` | POST | Send message to AI |

Example:
```bash
# Check if server is running
curl http://127.0.0.1:3001/health

# Send a message
curl -X POST http://127.0.0.1:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Customization

### Change the AI Model

Edit `obsidian-chat/backend/server.js`:
```javascript
// Change this line (around line 120):
model: "llama2",  // Change to "mistral", "neural-chat", etc.
```

### Adjust Temperature (Creativity)

Lower = more predictable, Higher = more creative

```javascript
temperature: 0.7  // Default. Range: 0.0 - 2.0
```

### Modify System Prompt

Edit the `SYSTEM_PROMPT` variable in `server.js` to customize agent behavior.

## Privacy & Security

🔒 **Local Processing Only**
- No data is sent to external servers
- All processing happens on your machine
- Conversations are saved locally only

## Performance Tips

1. **Use lighter models** (mistral) for faster responses
2. **Close other applications** to free up RAM
3. **Increase system RAM** if responses are slow
4. **Use SSD** for faster file I/O

## Getting Help

If something goes wrong:
1. Check the browser console (F12)
2. Check the terminal output
3. Ensure Ollama is running
4. Verify port 3001 is available
5. Clear browser cache and reload

## Future Enhancements

- [ ] Multiple model support in UI
- [ ] Chat history browser
- [ ] File upload functionality
- [ ] Voice input/output
- [ ] Custom agent roles
- [ ] API key integration for cloud AI

## License

Created for the Obsidian community

---

**Happy analyzing! 🚀**

For updates and support, visit the project repository.
