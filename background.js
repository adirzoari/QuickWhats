// Import modules
importScripts('recent-storage.js');
importScripts('openai-models.js');
importScripts('image-downloader.js');
importScripts('openai-client.js');
importScripts('image-processor.js');

let lastPhoneNumbers = []; // store all detected numbers
let lastCountryCode = '+972'; // default

// ------------------- Helper Functions ------------------- //

// Send toast notification to popup
const sendToastToPopup = (message, type = 'info', duration = 3000) => {
  chrome.runtime.sendMessage({
    action: 'showToast',
    message,
    type,
    duration
  });
};

// Send toast notification to browser (active tab)
const sendToastToBrowser = async (message, type = 'info', duration = 3000) => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showBrowserToast',
        message,
        type,
        duration
      });
    }
  } catch (error) {
  }
};

// Update extension badge
const updateExtensionBadge = (count) => {
  try {
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#4AE374' });
      chrome.action.setBadgeTextColor({ color: '#075E54' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
  }
};

// Send detected numbers to popup
let lastSource = 'unknown'; // Track the source of last detected numbers

// Add timestamp to track lastSource changes
const trackLastSourceChange = (newSource, location) => {
  lastSource = newSource;
};

const sendNumbersToPopup = (numbers, source = 'unknown', action = null) => {
  lastPhoneNumbers = numbers;
  trackLastSourceChange(source, 'sendNumbersToPopup');
  
  // Prepare toast message if numbers detected
  let toastMessage = null;
  if (numbers.length > 0) {
    const message = numbers.length === 1 
      ? '1 phone number detected'
      : `${numbers.length} phone numbers detected`;
    
    toastMessage = {
      action: 'showToast',
      message,
      type: 'success',
      duration: 3000
    };
    
    // Send browser toast for text selection and context menu actions
    if (action === 'textSelection' || source === 'contextMenu') {
      sendToastToBrowser(message, 'success');
    }
  }
  
  // Send everything in a single message
  chrome.runtime.sendMessage({ 
    phoneNumbers: numbers,
    recentNumbers: getRecentNumbers(),
    source,
    toast: toastMessage
  });
  
  updateExtensionBadge(numbers.length);
};

// Open WhatsApp for first number
const openWhatsApp = (phone, source = 'unknown') => {
  const url = `https://wa.me/${lastCountryCode}${phone}`;
  chrome.tabs.create({ url });
  
  // Add to recent numbers
  addToRecentNumbers(phone, lastCountryCode, source);
};

// Initialize image processor
const imageProcessor = new ImageProcessor(sendNumbersToPopup, sendToastToPopup, sendToastToBrowser);

// ------------------- Context Menus ------------------- //

const createContextMenus = () => {
  chrome.contextMenus.create({
    id: 'sendWhatsApp',
    title: 'Send WhatsApp Message',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'extractNumberFromImage',
    title: 'Extract phone number from Image',
    contexts: ['image']
  });
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
  loadRecentNumbers();
});

chrome.runtime.onStartup.addListener(() => {
  loadRecentNumbers();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'sendWhatsApp') {
    const phone = info.selectionText.trim().replace(/\D/g, '');
    if (phone) {
      lastPhoneNumbers = [phone];
      const domain = tab?.url ? new URL(tab.url).hostname : 'contextMenu';
      sendNumbersToPopup(lastPhoneNumbers, domain);
      openWhatsApp(phone, domain);
    }
  } else if (info.menuItemId === 'extractNumberFromImage') {
    const domain = tab?.url ? new URL(tab.url).hostname : 'image';
    await imageProcessor.extractPhoneFromImageWithContentScript(info.srcUrl, domain, tab.id);
  }
});

// ------------------- Message Listener ------------------- //

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // Popup opened - clear badge
  if (message.action === 'popupOpened') {
    updateExtensionBadge(0);
  }

  // Popup requests last detected numbers and recent numbers
  if (message.action === 'getLastPhoneNumbers') {
    
    // Ensure recent numbers are loaded before responding
    loadRecentNumbers().then(() => {
      const recentNumbers = getRecentNumbers();
      sendResponse({ 
        phoneNumbers: lastPhoneNumbers, 
        countryCode: lastCountryCode,
        recentNumbers: recentNumbers
      });
    }).catch((error) => {
      sendResponse({ 
        phoneNumbers: lastPhoneNumbers, 
        countryCode: lastCountryCode,
        recentNumbers: []
      });
    });
    return true; // Keep message channel open for async response
  }

  // Popup updates country code
  if (message.countryCode) {
    lastCountryCode = message.countryCode;
  }

  // Content script detected phone numbers from text selection
  if (message.phoneNumbers && message.action === 'textSelection') {
    lastPhoneNumbers = message.phoneNumbers;
    
    // Use the actual source from message, don't fallback to 'textSelection' string
    const actualSource = message.source || 'unknown';
    sendNumbersToPopup(lastPhoneNumbers, actualSource, message.action);
  }
  // Legacy support: Content script updates single selected phone number (only if not modern format)
  else if (message.phoneNumber && !message.phoneNumbers) {
    lastPhoneNumbers = [message.phoneNumber];
    
    const actualSource = message.source || 'unknown';
    sendNumbersToPopup(lastPhoneNumbers, actualSource);
  }

  // Popup sends WhatsApp message (track in recent)
  if (message.action === 'sendWhatsApp' && message.phoneNumber) {
    
    // Use message source if provided, otherwise use lastSource, fallback to 'unknown'
    let sourceToUse = message.source;
    
    if (!sourceToUse && lastSource && lastSource !== 'unknown') {
      sourceToUse = lastSource;
    } else if (!sourceToUse) {
      sourceToUse = 'unknown';
    }
    
    // Extra validation
    if (sourceToUse === 'undefined' || sourceToUse === 'null' || sourceToUse === '') {
      sourceToUse = 'unknown';
    }
    
    
    addToRecentNumbers(message.phoneNumber, message.countryCode || lastCountryCode, sourceToUse);
    sendResponse({ recentNumbers: getRecentNumbers() });
  }

  // Update recent number timestamp (when selecting from recent list)
  if (message.action === 'updateRecentNumberTimestamp' && message.phoneNumber) {
    loadRecentNumbers().then(() => {
      addToRecentNumbers(message.phoneNumber, message.countryCode || lastCountryCode, 'recent');
      sendResponse({ recentNumbers: getRecentNumbers() });
    });
    return true;
  }

  // Popup deletes recent number
  if (message.action === 'deleteRecentNumber' && message.phoneNumber) {
    loadRecentNumbers().then(() => {
      removeRecentNumber(message.phoneNumber);
      sendResponse({ recentNumbers: getRecentNumbers() });
    });
    return true;
  }

  // Popup clears all recent numbers
  if (message.action === 'clearAllRecentNumbers') {
    loadRecentNumbers().then(() => {
      clearAllRecentNumbers();
      sendResponse({ recentNumbers: getRecentNumbers() });
    });
    return true;
  }

  return true; // keep channel open
});
