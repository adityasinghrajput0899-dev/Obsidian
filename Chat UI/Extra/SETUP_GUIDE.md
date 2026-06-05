# 📚 Complete Installation & Setup Guide

## System Requirements

**Minimum:**
- Windows 10/11, macOS, or Linux
- 8GB RAM
- 5GB free disk space
- Node.js 16+ 
- Internet connection (for initial setup)

**Recommended:**
- 16GB+ RAM
- SSD storage
- Modern browser (Chrome, Firefox, Edge)

---

## Step 1: Install Node.js

1. Visit https://nodejs.org
2. Download the **LTS** version
3. Run the installer
4. Check installation:
   ```bash
   node --version
   npm --version
   ```

---

## Step 2: Install Ollama

1. Visit https://ollama.ai
2. Download for your OS (Windows/Mac/Linux)
3. Install and run the installer
4. Verify installation:
   ```bash
   ollama --version
   ```

---

## Step 3: Download and Setup Models

Ollama models are large (~3-7GB). Choose one based on your needs:

### Option A: Best Balance (Recommended)
```bash
ollama pull mistral
```
- **Size:** 4GB
- **Speed:** ⚡⚡⚡ Very Fast
- **Quality:** ⭐⭐⭐⭐ Excellent
- **Best for:** General use, all tasks

### Option B: Specialized Chat
```bash
ollama pull neural-chat
```
- **Size:** 4GB
- **Speed:** ⚡⚡ Moderate
- **Quality:** ⭐⭐⭐⭐ Great for conversations
- **Best for:** Chat-focused applications

### Option C: Lightweight
```bash
ollama pull orca-mini
```
- **Size:** 1.3GB
- **Speed:** ⚡⚡⚡ Very Fast
- **Quality:** ⭐⭐⭐ Good
- **Best for:** Quick responses, low-end machines

### Option D: General Purpose
```bash
ollama pull llama2
```
- **Size:** 3.8GB
- **Speed:** ⚡⚡ Moderate
- **Quality:** ⭐⭐⭐⭐ Excellent
- **Best for:** Comprehensive analysis

---

## Step 4: Start the Application

### Option A: Using the Startup Script (Easiest)
1. Navigate to the Chat UI folder
2. Double-click `START.bat`
3. A terminal will open and run the server
4. Open browser to `http://127.0.0.1:3001`

### Option B: Manual Start
1. Open two terminal windows

**Terminal 1 - Start Ollama:**
```bash
ollama serve
```
Keep this running in the background.

**Terminal 2 - Start Backend:**
```bash
cd "path/to/obsidian-chat/backend"
npm install
node server.js
```

3. Open your browser to: `http://127.0.0.1:3001`

---

## Step 5: Verify Everything Works

### ✅ Checklist:

1. **Ollama Running?**
   - Terminal shows: `Listening on 127.0.0.1:11434`
   - No errors

2. **Server Running?**
   - Terminal shows: `🚀 Obsidian AI Agent Running`
   - No errors

3. **Frontend Loaded?**
   - Browser shows the chat interface
   - Files appear in the sidebar

4. **Test Chat?**
   - Type a simple message like "Hello!"
   - Wait for response
   - If it works, you're ready! 🎉

---

## Troubleshooting

### Problem: "Cannot reach Ollama API"
**Solution 1:** Start Ollama
```bash
ollama serve
```

**Solution 2:** Check port
```bash
# Windows
netstat -ano | findstr :11434

# Mac/Linux
lsof -i :11434
```

### Problem: Server won't start
**Solution:** Port 3001 is in use
```bash
# Find process using port 3001
# Windows
netstat -ano | findstr :3001

# Kill it
taskkill /PID <PID> /F

# Then try starting server again
node server.js
```

### Problem: "Module not found" error
**Solution:** Install dependencies
```bash
cd obsidian-chat/backend
npm install
```

### Problem: Model download fails
**Solution:** Check internet and disk space
```bash
# Check available disk space
# Windows: Properties > Disk Management
# Mac/Linux: df -h

# Retry download
ollama pull mistral
```

### Problem: Slow responses
**Solution 1:** Use faster model
```bash
ollama pull mistral
# Then edit server.js to use "mistral"
```

**Solution 2:** Close other applications

**Solution 3:** Increase available RAM

### Problem: Browser shows blank page
**Solution 1:** Hard refresh
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

**Solution 2:** Check browser console
- Press `F12`
- Look at Console tab for errors
- Check Network tab

**Solution 3:** Check server is running
- Open terminal and run:
```bash
curl http://127.0.0.1:3001/health
```

---

## Advanced Configuration

### Change Default Model

Edit `obsidian-chat/backend/server.js`:
```javascript
model: "mistral",  // Change this to your preferred model
```

### Adjust Response Creativity

Edit `obsidian-chat/backend/server.js`:
```javascript
temperature: 0.7,  // 0=precise, 1=balanced, 2=creative
```

### Custom System Prompt

Edit `obsidian-chat/backend/server.js`:
```javascript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### Change Server Port

Edit `obsidian-chat/backend/server.js`:
```javascript
app.listen(3000, "127.0.0.1", () => {  // Change 3001 to 3000
```

---

## Performance Optimization

### For Best Speed:
1. Use `mistral` model
2. Close unnecessary applications
3. Use SSD for Ollama cache
4. Increase available RAM

### For Best Quality:
1. Use `llama2` or `neural-chat`
2. Increase temperature slightly (0.8-0.9)
3. Provide clear, detailed prompts

### For Best Balance:
1. Use `mistral` (recommended)
2. Temperature 0.7
3. Keep system clean and responsive

---

## Next Steps

1. **Try the agent:**
   - Type test questions
   - Select files and ask about them
   - Build multi-turn conversations

2. **Customize it:**
   - Edit system prompt for your use case
   - Adjust temperature for your preference
   - Try different models

3. **Integrate with workflow:**
   - Use the chat history browser
   - Export important conversations
   - Integrate with your Obsidian workflow

4. **Share with others:**
   - The system is ready for team use
   - Just ensure they have the prerequisites installed
   - Each person runs their own instance locally

---

## Getting Help

**Error Messages?**
- Copy the full error message
- Check the troubleshooting section above
- Read the terminal output carefully

**Performance Issues?**
- Check Ollama console for errors
- Monitor system resources (Task Manager/Activity Monitor)
- Try a lighter model

**Feature Requests?**
- The agent can be customized
- Check the configuration section
- Edit server.js for advanced changes

---

## Quick Reference

| Task | Command |
|------|---------|
| Start Ollama | `ollama serve` |
| Download model | `ollama pull mistral` |
| List models | `ollama list` |
| Start server | `node server.js` |
| Check server health | `curl http://127.0.0.1:3001/health` |
| Install dependencies | `npm install` |

---

**You're all set! Enjoy your AI assistant! 🚀**
