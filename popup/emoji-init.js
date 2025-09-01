import { EmojiPicker } from './emoji-picker.js';

// Initialize emoji picker when DOM is loaded
let emojiPicker = null;

function initializeEmojiPicker() {
  const messageTextarea = document.getElementById('message');
  const emojiTriggerBtn = document.getElementById('emojiTrigger');
  
  if (messageTextarea && emojiTriggerBtn) {
    emojiPicker = new EmojiPicker(messageTextarea);
    
    emojiTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      emojiPicker.toggle(emojiTriggerBtn);
    });
    
    // Add RTL detection for Hebrew text
    messageTextarea.addEventListener('input', () => {
      detectAndApplyRTL(messageTextarea);
    });
    
    // Check initial content
    detectAndApplyRTL(messageTextarea);
    
  } else {
  }
}

function detectAndApplyRTL(textarea) {
  const text = textarea.value;
  const hebrewRegex = /[\u0590-\u05FF]/;
  const arabicRegex = /[\u0600-\u06FF]/;
  
  // Check if text contains Hebrew or Arabic characters
  if (hebrewRegex.test(text) || arabicRegex.test(text)) {
    textarea.classList.add('rtl');
  } else {
    textarea.classList.remove('rtl');
  }
}

// Export for use by popup.js and emoji picker
window.initializeEmojiPicker = initializeEmojiPicker;
window.detectAndApplyRTL = detectAndApplyRTL;