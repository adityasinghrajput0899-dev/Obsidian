# 🚀 Quick Reference Guide

## Getting Started in 5 Minutes

### 1. Start Ollama
```bash
ollama serve
```

### 2. Start Backend (New Terminal)
```bash
cd obsidian-chat/backend
node server.js
```

### 3. Open in Browser
```
http://127.0.0.1:3001
```

### 4. Start Chatting!
Type a message and press Enter.

---

## Common Commands

### Download a Model
```bash
ollama pull mistral        # Recommended
ollama pull neural-chat    # For chat
ollama pull orca-mini      # Lightweight
```

### List Available Models
```bash
ollama list
```

### Run a Specific Model
```bash
ollama run mistral "Your prompt here"
```

### Check Server Status
```bash
curl http://127.0.0.1:3001/health
```

### Kill Server Process (if stuck)
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

---

## Tips & Tricks

### Get Better Responses
✅ Be specific: "Summarize the key decisions made in this document"
✅ Give context: "Assume I'm a beginner learning this topic"
✅ Ask follow-ups: Build on previous answers
❌ Avoid: Vague questions like "Tell me about this"

### Use File Context Effectively
1. Click a file in the sidebar
2. See file content appear
3. Ask questions about it
4. AI uses file as context

### Multi-turn Conversations
- Ask a question
- Get answer
- Ask follow-up
- AI remembers context
- Keep asking!

### Fix Slow Responses
1. Use faster model: `mistral`
2. Close other apps
3. Check temperature (lower = faster)
4. Reduce context window size

### Get Creative Responses
- Increase temperature (0.8-1.0)
- Ask open-ended questions
- Use descriptive prompts
- Encourage brainstorming

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Ctrl+Shift+R` | Hard refresh (clear cache) |
| `F12` | Open browser console (debug) |
| `Tab` | Navigate UI elements |
| `Escape` | (Can be customized) |

---

## File Structure Quick View

```
Chat UI/
├── README.md              ← Main documentation
├── SETUP_GUIDE.md         ← Detailed setup
├── BACKEND_GUIDE.md       ← Backend config
├── FRONTEND_GUIDE.md      ← Frontend customization
├── QUICK_REFERENCE.md     ← This file
├── config.json            ← Configuration
├── START.bat              ← One-click startup
│
├── obsidian-chat/
│   ├── backend/
│   │   ├── server.js      ← Backend logic
│   │   └── package.json   ← Dependencies
│   │
│   ├── frontend/
│   │   └── index.html     ← Full frontend app
│   │
│   └── Vault/Chats/       ← Saved conversations
│
└── Obsidian/              ← Documentation folder
```

---

## Models Comparison

### Recommended: Mistral
```bash
ollama pull mistral
```
- ⚡ **Speed:** Very fast
- ⭐ **Quality:** Excellent
- 💾 **Size:** 4GB
- 💡 **Best for:** Everything

### Best for Chat: Neural-Chat  
```bash
ollama pull neural-chat
```
- ⚡ **Speed:** Moderate
- ⭐ **Quality:** Great for conversations
- 💾 **Size:** 4GB
- 💡 **Best for:** Chatting

### Lightweight: Orca-Mini
```bash
ollama pull orca-mini
```
- ⚡ **Speed:** Very fast
- ⭐ **Quality:** Good
- 💾 **Size:** 1.3GB
- 💡 **Best for:** Low-end machines

### High Quality: Llama2
```bash
ollama pull llama2
```
- ⚡ **Speed:** Moderate
- ⭐ **Quality:** Excellent
- 💾 **Size:** 3.8GB
- 💡 **Best for:** Deep analysis

---

## Troubleshooting Flowchart

**App won't start?**
→ Is Node.js installed? (`node --version`)
→ Try: `npm install` in backend folder

**Server won't respond?**
→ Is Ollama running? (`ollama serve`)
→ Try: Restart Ollama

**AI not responding?**
→ Is model downloaded? (`ollama list`)
→ Try: `ollama pull mistral`

**Slow responses?**
→ Use `mistral` instead of `llama2`
→ Close other applications
→ Check system resources

**Files not showing?**
→ Check vault path in `config.json`
→ Verify path has actual files
→ Restart server

**Errors in console?**
→ Open F12, check Console tab
→ Read error message carefully
→ Restart server

---

## Performance Tips

**For Speed:**
```
1. Use mistral model
2. Temperature: 0.5
3. Close other apps
4. Use SSD
```

**For Quality:**
```
1. Use llama2 model
2. Temperature: 0.7-0.8
3. Allow more time
4. Use higher RAM
```

**For Balance:**
```
1. Use mistral model (Default)
2. Temperature: 0.7
3. Keep system clean
4. Monitor resources
```

---

## API Quick Reference

**Health Check:**
```bash
curl http://127.0.0.1:3001/health
```

**List Files:**
```bash
curl http://127.0.0.1:3001/files
```

**Read File:**
```bash
curl "http://127.0.0.1:3001/file?path=/Document.md"
```

**Send Message:**
```bash
curl -X POST http://127.0.0.1:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## Configuration Cheat Sheet

**Change Model:**
Edit `obsidian-chat/backend/server.js`, line ~115:
```javascript
model: "mistral",  // Change this
```

**Change Temperature:**
Same location, line ~118:
```javascript
temperature: 0.7,  // 0=precise, 2=creative
```

**Change Port:**
Around line 320:
```javascript
app.listen(3001, "127.0.0.1", () => {  // Change 3001
```

**Custom System Prompt:**
Around line 35:
```javascript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

---

## System Requirements Checklist

- [ ] Windows 10+ / macOS / Linux
- [ ] 8GB RAM minimum (16GB recommended)
- [ ] 5GB free disk space
- [ ] Node.js 16+ installed
- [ ] Ollama installed and working
- [ ] A file with content in vault path
- [ ] Modern web browser

---

## First-Time Checklist

- [ ] Read README.md
- [ ] Install Ollama
- [ ] Run `ollama pull mistral`
- [ ] Install Node.js (if needed)
- [ ] Run `npm install` in backend folder
- [ ] Start Ollama: `ollama serve`
- [ ] Start backend: `node server.js`
- [ ] Open browser: `http://127.0.0.1:3001`
- [ ] Test with simple message
- [ ] Select a file from sidebar
- [ ] Ask about the selected file
- [ ] ✅ Ready to use!

---

## When Something Breaks

1. **Read the error message** - It usually tells you what's wrong
2. **Check the console** - Both browser (F12) and terminal
3. **Restart components** - Ollama first, then server
4. **Clear browser cache** - Ctrl+Shift+R
5. **Check logs** - Terminal output has clues

---

## Need Help?

**What to check:**
- Is Ollama running? (`ollama serve`)
- Is server running? (Look for 🚀 in terminal)
- Is browser showing the interface? (http://127.0.0.1:3001)
- Are there errors? (Check F12 console)

**Read these docs:**
- `README.md` - Overview
- `SETUP_GUIDE.md` - Detailed setup
- `BACKEND_GUIDE.md` - Server configuration
- `FRONTEND_GUIDE.md` - UI customization

---

## Next Steps

1. ✅ Get the system running
2. ✅ Send your first message
3. ✅ Try using file context
4. ✅ Experiment with different prompts
5. ✅ Customize the system (optional)
6. ✅ Share with others (optional)

---

## Quick Stats

- 🔧 Setup time: ~15 minutes
- 💾 Disk space needed: ~5GB
- ⚡ Typical response time: 5-30 seconds
- 📁 Max file size: ~10,000 characters (context)
- 💬 Max message length: ~5,000 characters
- 🔄 Max conversation history: 20 recent messages

---

**You've got this! 🎉**

If you get stuck, check the detailed guides or restart Ollama + server.
Most issues are solved by restarting.

---

## Save This Somewhere Safe

Print this page or bookmark it for quick reference while using the system.

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Stable ✅
