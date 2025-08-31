console.log('Content script loaded!');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showBrowserToast' && window.quickWhatsToast) {
    window.quickWhatsToast.show(message.message, message.type || 'info', message.duration || 3000);
  } else if (message.action === 'downloadImage') {
    // Handle image download request from background script
    downloadImageAsBase64(message.imageUrl)
      .then(base64Data => {
        sendResponse({ success: true, base64Data: base64Data });
      })
      .catch(error => {
        console.log('Content script image download failed:', error.message);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

// Enhanced phone detection with multiple number support
const detectPhoneNumbers = (text) => {
  // More comprehensive phone regex patterns
  const patterns = [
    /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    /(\+\d{1,3}[-.\s]?)?\d{10,}/g,
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g
  ];
  
  const numbers = new Set();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const cleaned = match.replace(/\D/g, '');
      if (cleaned.length >= 7 && cleaned.length <= 15) {
        numbers.add(cleaned);
      }
    });
  });
  
  return Array.from(numbers);
};

// Download image and convert to base64 using content script context (with cookies)
const downloadImageAsBase64 = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to convert image to base64'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Image download failed: ${error.message}`);
  }
};

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection().toString().trim();
  console.log('Mouse up, selected text:', selectedText);

  if (selectedText.length > 3) {
    const detectedNumbers = detectPhoneNumbers(selectedText);
    
    if (detectedNumbers.length > 0) {
      console.log('Phone numbers detected:', detectedNumbers);
      
      try {
        // Check if extension context is still valid
        if (chrome.runtime && chrome.runtime.id) {
          const messageToSend = { 
            phoneNumbers: detectedNumbers,
            action: 'textSelection',
            source: window.location.hostname
          };
          console.log('Content script sending message:', JSON.stringify(messageToSend)); // Debug
          console.log('Window location hostname:', window.location.hostname); // Debug
          
          chrome.runtime.sendMessage(messageToSend, (response) => {
            // Handle response or check for errors
            if (chrome.runtime.lastError) {
              console.log('Extension context invalidated, ignoring message');
            }
          });
        } else {
          console.log('Extension context is not available');
        }
      } catch (e) {
        console.log('Extension context invalidated, content script will be inactive until page reload');
      }
    }
  }
});
