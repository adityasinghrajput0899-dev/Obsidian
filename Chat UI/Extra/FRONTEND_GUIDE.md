# 🎨 Frontend Configuration Guide

## Overview

The frontend is a modern, responsive web interface for the Obsidian AI Agent.

## Features Implemented

✅ **Modern UI Design**
- Dark theme optimized for extended use
- Smooth animations and transitions
- Responsive layout for different screen sizes

✅ **Chat Interface**
- Real-time message display
- Message history with smooth scrolling
- User and bot message differentiation

✅ **File Browser**
- Tree view of vault files and folders
- Click to load file context
- Active file highlighting

✅ **Smart Rendering**
- Markdown support for AI responses
- Code syntax highlighting
- Proper text formatting

✅ **Error Handling**
- Network error detection
- Graceful degradation
- User-friendly error messages

✅ **Loading States**
- Animated loading indicators
- Button disabled state during loading
- Clear feedback to user

## File Structure

```
frontend/
└── index.html              # Complete single-page app
    ├── HTML markup
    ├── CSS styling
    └── JavaScript logic
```

## Customization

### Change Theme Colors

Edit the CSS variables in `index.html`:

```css
/* Primary color */
.message.user .message-bubble {
  background: #1f6feb;    /* Change this to your color */
}

/* Button color */
button {
  background: #1f6feb;    /* Change this to your color */
}
```

Color suggestions:
- Blue: `#1f6feb` (Current)
- Purple: `#8957e5`
- Green: `#238636`
- Red: `#da3633`
- Orange: `#fb8500`

### Change Sidebar Width

Find this line in CSS:
```css
.sidebar {
  width: 280px;    /* Change this value */
}
```

Suggested widths: `250px`, `280px`, `320px`, `350px`

### Change Font

Find this line in CSS:
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

Other options:
```css
/* Modern sans-serif */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Monospace (for code-like look) */
font-family: "Fira Code", "Courier New", monospace;

/* Traditional serif */
font-family: Georgia, "Times New Roman", serif;

/* Web-safe */
font-family: Arial, sans-serif;
```

### Change Message Bubble Style

```css
/* Make messages more rounded */
.message-bubble {
  border-radius: 20px;    /* Was 12px, now more rounded */
}

/* Add shadows */
.message-bubble {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Change user message color */
.message.user .message-bubble {
  background: linear-gradient(135deg, #1f6feb, #388bfd);
}
```

### Change API Endpoint

If you run the backend on a different URL, edit this line in the JavaScript section:

```javascript
const API_BASE = "http://127.0.0.1:3001";
// Change to:
const API_BASE = "http://your-server.com:3001";
// Or for production:
const API_BASE = "https://your-domain.com/api";
```

## JavaScript Structure

### Key Functions

```javascript
send()                    // Send message and get response
addMessage(text, type)   // Display message in chat
addLoadingMessage()      // Show loading animation
loadVault()              // Load file tree from backend
renderTree()             // Render file tree in sidebar
escapeHtml()             // Sanitize HTML
```

### Event Listeners

- Enter key in input field triggers send
- Click Send button triggers send
- File click loads file context
- Folder click expands/collapses

## External Libraries

The frontend uses these CDN libraries (loaded automatically):

1. **marked.js** - Markdown parsing
   ```html
   <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
   ```

2. **highlight.js** - Code syntax highlighting
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
   <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
   ```

These libraries are loaded from CDN, so internet is required. To use offline:
1. Download these libraries
2. Place in a `lib/` folder
3. Update script tags to use local paths

## Responsive Design

The interface is responsive and adapts to different screen sizes:

```css
@media (max-width: 768px) {
  .sidebar {
    display: none;    /* Hide sidebar on mobile */
  }
}
```

Mobile users can still use the chat interface without the file browser.

## Accessibility

The interface includes:
- Semantic HTML structure
- Proper focus management
- Keyboard navigation support
- Readable contrast ratios
- Clear button labels

## Performance Optimization

1. **Lazy Loading**
   - Libraries loaded from CDN only when needed
   - Single HTML file reduces initial load

2. **Efficient DOM Updates**
   - Messages appended directly to DOM
   - No unnecessary re-renders

3. **Smooth Scrolling**
   - Auto-scrolls to latest message
   - Hardware acceleration enabled

## Testing the Frontend

1. **Open Browser Console** (F12)
   - Check for any JavaScript errors
   - Monitor network requests
   - See debug logs

2. **Test Network**
   - Open Network tab in F12
   - Send a message
   - Verify request/response

3. **Test Markdown**
   - Ask the AI to generate formatted content
   - Verify code blocks highlight
   - Check list formatting

## Troubleshooting

### Styles not loading?
- Hard refresh: `Ctrl+Shift+R`
- Clear browser cache
- Check browser console for CSS errors

### Messages not appearing?
- Check console for JavaScript errors
- Verify backend is running
- Check Network tab in F12

### File tree not loading?
- Verify vault path in backend
- Check if path exists
- Verify backend /files endpoint works

### Code highlighting not working?
- Check internet connection
- Verify highlight.js loaded (check Network tab)
- Try a different browser

## Extending the Frontend

### Add Custom Commands

Add a help command:
```javascript
async function send() {
  const input = document.getElementById("input");
  const msg = input.value.trim();
  
  if (msg === "/help") {
    addMessage("Available commands:\n/help - Show this message\n/clear - Clear chat", "bot");
    return;
  }
  
  // ... rest of send function
}
```

### Add Message Reactions

```javascript
.message {
  display: flex;
  position: relative;
}

.message .reactions {
  position: absolute;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .reactions {
  opacity: 1;
}
```

### Add Message Copy Button

```javascript
function addMessage(text, type) {
  // ... existing code ...
  
  if (type === "bot") {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋 Copy";
    copyBtn.onclick = () => navigator.clipboard.writeText(text);
    messageDiv.appendChild(copyBtn);
  }
}
```

## Best Practices

1. **Keep it Simple** - Single HTML file is easy to deploy
2. **Use CDN** - No build process needed
3. **Semantic HTML** - Use proper HTML elements
4. **CSS Variables** - Easy customization
5. **Error Handling** - Graceful degradation
6. **Mobile First** - Design for small screens first

---

**Happy customizing! 🎨**
