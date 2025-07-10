# 🔧 Live Testing Troubleshooting Guide

## 🚀 Starting the Development Server

### Basic Command
```bash
npm run dev
```

### If npm run dev fails:
```bash
# Alternative method 1
npx next dev

# Alternative method 2  
npx next dev --port 3000

# Alternative method 3
npm install && npm run dev
```

### Check for Node.js Issues
```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Clear npm cache if needed
npm cache clean --force
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "AI Assistant page not found"
**Symptoms**: 404 error when navigating to `/dashboard/ai-assistant`
**Solution**:
```bash
# Check file exists
ls src/app/dashboard/ai-assistant/page.tsx

# If missing, the file should be at this exact path
```

### Issue 2: "AIQueryMockService import error"
**Symptoms**: TypeScript error about missing module
**Solution**: 
```bash
# Check service file exists
ls src/services/ai-query-mock.ts

# Restart dev server
npm run dev
```

### Issue 3: "Sidebar doesn't show AI Assistant"
**Symptoms**: Menu item missing from navigation
**Solution**: Check `src/components/layout/sidebar.tsx` contains:
```typescript
{
  title: "AIアシスタント",
  icon: Brain,
  href: "/dashboard/ai-assistant",
},
```

### Issue 4: "Quick query buttons don't work"
**Symptoms**: Buttons click but no response
**Solutions**:
1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check if `handleSendMessage` function is working

### Issue 5: "Chat interface not responding"
**Symptoms**: Can type but messages don't send
**Solutions**:
1. Check if Send button is enabled
2. Verify input validation logic
3. Check `handleSendMessage` function execution

### Issue 6: "AI responses not formatting correctly"
**Symptoms**: Response appears as plain text
**Solutions**:
1. Check `formatAIResponse` function
2. Verify markdown rendering
3. Check CSS classes for prose styling

---

## 🔍 Browser Developer Tools Testing

### Console Testing
Open browser console (F12) and test AI service directly:
```javascript
// Test if service loads
console.log('Testing AI service...');

// This won't work directly but helps debug
// Check for any JavaScript errors in console
```

### Network Tab Testing
1. Open browser Network tab
2. Trigger AI query
3. Look for any failed requests
4. Check response data format

### React Developer Tools
If you have React DevTools installed:
1. Check component state
2. Verify props are passing correctly
3. Look for re-render issues

---

## 📱 Mobile Testing Quick Check

### Chrome DevTools Mobile Simulation
1. Open Chrome DevTools (F12)
2. Click device icon (toggle device toolbar)
3. Select iPhone or Android device
4. Test AI Assistant interface
5. Verify touch interactions work

### Real Mobile Device Testing
1. Get your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start dev server: `npm run dev`
3. Access from mobile: `http://YOUR_IP:3000`
4. Test all AI functionality

---

## 🎯 Quick Functional Tests

### Test 1: Basic AI Query
```
1. Navigate to /dashboard/ai-assistant
2. Click "Risk Coverage Analysis" quick query
3. Verify response appears within 2 seconds
4. Check response contains equipment list
```

### Test 2: Chat Interface
```
1. Type: "fouling risk in system A"
2. Press Enter or click Send
3. Verify loading indicator appears
4. Check response is properly formatted
```

### Test 3: Navigation Integration
```
1. Start at /dashboard/tasks
2. Navigate to /dashboard/ai-assistant
3. Use quick query
4. Navigate back to /dashboard/tasks
5. Verify no errors in console
```

---

## ⚡ Performance Quick Checks

### Response Time Testing
- **AI Queries**: Should respond in < 2 seconds
- **Page Navigation**: Should load in < 1 second
- **Quick Queries**: Should respond in < 1 second

### Memory Usage Check
1. Open Chrome Task Manager (Shift+Esc)
2. Monitor memory usage during testing
3. Check for memory leaks after multiple queries

---

## 🔧 Emergency Fixes

### If AI Assistant completely broken:
1. **Revert to working version**: Use git to check previous commits
2. **Use static demo**: Show screenshots instead of live demo
3. **Focus on other features**: Demonstrate Process Monitoring and Risk Assessment

### If queries return errors:
1. **Check browser console** for specific error messages
2. **Verify mock data** in `ai-query-mock.ts`
3. **Test with simple queries** first

### If formatting looks wrong:
1. **Check CSS classes** in the component
2. **Verify Tailwind** is loading correctly
3. **Test with different browsers**

---

## 📞 Getting Help

### Error Documentation
When reporting issues, include:
1. **Exact error message**
2. **Browser and version**
3. **Steps to reproduce**
4. **Console log output**
5. **Screenshots if applicable**

### Quick Health Check Command
```bash
# Check all key files exist
ls src/app/dashboard/ai-assistant/page.tsx
ls src/services/ai-query-mock.ts
ls src/components/layout/sidebar.tsx

# Check for TypeScript errors
npx tsc --noEmit

# Check for build issues
npm run build
```

---

## 🎉 Demo Day Emergency Plan

### If live demo fails:
1. **Have screenshots ready** of working features
2. **Explain the concept** using static images
3. **Show the code** to demonstrate implementation
4. **Focus on business value** rather than technical details

### Backup demo approach:
1. **Show Process Monitoring** (usually most stable)
2. **Demonstrate Risk Assessment** 
3. **Explain AI concept** with mock examples
4. **Highlight integration points**

Remember: **A good explanation with screenshots is better than a broken live demo!**