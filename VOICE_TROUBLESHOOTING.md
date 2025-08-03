# 🎤 Voice Recognition Troubleshooting Guide

## Quick Fixes for "Voice Stopped Listening" Issue

### 1. **Check Browser Console (F12)**

Open DevTools and look for these messages:

-   ✅ `🎤 Speech recognition started`
-   ✅ `🗣️ Speech recognized: [your text]`
-   ❌ `❌ Speech recognition error: [error type]`

### 2. **Common Issues & Solutions**

#### **Microphone Permission Denied**

-   **Symptoms**: Red microphone icon, "Mic Error" status
-   **Fix**: Click the microphone icon in browser address bar → Allow
-   **Chrome**: Settings → Privacy & Security → Site Settings → Microphone
-   **Firefox**: Preferences → Privacy & Security → Permissions → Microphone

#### **No Speech Detected**

-   **Symptoms**: Microphone works briefly then stops
-   **Fixes**:
    -   Speak more clearly and loudly
    -   Check microphone is not muted
    -   Test microphone in other apps
    -   Try clicking "Try Again" button

#### **Browser Compatibility**

-   **Supported**: Chrome, Edge, Safari
-   **Not Supported**: Firefox (limited), older browsers
-   **Fix**: Switch to Chrome or Edge

#### **Network Issues**

-   **Symptoms**: Works sometimes, fails other times
-   **Fix**: Check internet connection (voice recognition needs internet)

### 3. **Testing Steps**

#### **Quick Test**:

1. Open browser console (F12)
2. Click microphone button
3. Say "Hello testing one two three"
4. Check console for recognition messages

#### **Permission Test**:

1. Go to: `chrome://settings/content/microphone`
2. Check if your site is allowed
3. Remove and re-add permission if needed

#### **Microphone Test**:

1. Open: `chrome://settings/content/microphone`
2. Test microphone with other apps
3. Check Windows/Mac microphone settings

### 4. **Status Indicators**

Look at the bottom-left corner of the app:

-   **🟢 Online**: Internet connection OK
-   **🔴 Offline**: No internet (voice recognition won't work)
-   **🎤 Listening**: Currently recording
-   **🔇 Mic Ready**: Ready to listen
-   **🚫 Mic Error**: Permission or hardware issue

### 5. **Advanced Debugging**

#### **Check Microphone Access**:

```javascript
// Run in browser console
navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then(() => console.log("✅ Microphone access granted"))
    .catch((e) => console.log("❌ Microphone access denied:", e));
```

#### **Check Speech Recognition Support**:

```javascript
// Run in browser console
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
console.log("Speech Recognition Support:", !!SpeechRecognition);
```

### 6. **Browser-Specific Issues**

#### **Chrome**:

-   Usually works best
-   Check microphone permission icon in address bar
-   Try incognito mode to test

#### **Firefox**:

-   Limited support for Speech Recognition API
-   Switch to Chrome/Edge for best experience

#### **Safari**:

-   Works on newer versions (iOS 14.5+, macOS 14.5+)
-   May need explicit permission prompt

#### **Edge**:

-   Similar to Chrome
-   Check Windows microphone privacy settings

### 7. **System-Level Fixes**

#### **Windows**:

1. Settings → Privacy → Microphone
2. Allow apps to access microphone: ON
3. Allow desktop apps to access microphone: ON

#### **MacOS**:

1. System Preferences → Security & Privacy → Microphone
2. Enable browser access
3. Check browser is not muted in Sound settings

#### **Linux**:

1. Check audio input device: `arecord -l`
2. Test microphone: `arecord -d 5 test.wav && aplay test.wav`
3. Browser permissions vary by distribution

### 8. **Quick Recovery Actions**

If voice stops working:

1. **Refresh the page** (Ctrl+R / Cmd+R)
2. **Clear browser cache** for the site
3. **Restart browser** completely
4. **Check microphone** in other applications
5. **Try different browser** (Chrome recommended)

### 9. **Enhanced Features**

The app now includes:

-   ✅ **Better error messages** (shows specific issues)
-   ✅ **Auto-retry functionality** (click "Try Again")
-   ✅ **Visual status indicators** (see what's happening)
-   ✅ **Permission checking** (requests access properly)
-   ✅ **Graceful fallbacks** (typing still works)

### 10. **Still Not Working?**

Try these emergency steps:

1. **Use typing instead**: Type your message in the text input
2. **Check demo page**: Visit `/demo-test.html` for diagnostics
3. **Test basic functionality**: Try "Hello" as your first message
4. **Restart everything**: Close browser, restart, try again

## 🎯 Expected Behavior

When working correctly, you should see:

1. Click microphone → Status changes to "🎤 Listening"
2. Speak → Console shows "🗣️ Speech recognized: [text]"
3. Processing → AI responds
4. Ready for next input

The enhanced error handling should now provide much clearer feedback about what's going wrong! 🚀
