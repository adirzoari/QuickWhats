/**
 * Popup Messaging Module for QuickWhats Extension
 * Handles communication with background script and message processing
 */

class PopupMessaging {
  constructor(popupUtils, recentNumbersManager, toastManager) {
    this.popupUtils = popupUtils;
    this.recentNumbersManager = recentNumbersManager;
    this.toastManager = toastManager;
    this.currentProcessingToast = null;
  }

  init() {
    this.setupMessageListener();
    this.fetchInitialData();
  }

  setupMessageListener() {
    // Listen for real-time updates from background
    chrome.runtime.onMessage.addListener((message) => {
      console.log('Received message from background:', message);
      
      // Only process phone number updates from broadcast messages (not response messages)
      // Ignore phone updates that come with recent number updates (likely from delete operations)
      if (message.phoneNumbers?.length && message.source && !message.recentNumbers) {
        this.popupUtils.setPhoneList(message.phoneNumbers);
      }
      if (message.recentNumbers !== undefined) this.recentNumbersManager.update(message.recentNumbers);
      
      // Handle combined toast notifications from background (only for phone detection, not delete operations)
      if (message.toast && message.source && !message.recentNumbers) {
        if (this.currentProcessingToast && message.toast.type !== 'processing') {
          this.toastManager.remove(this.currentProcessingToast);
          this.currentProcessingToast = null;
        }
        
        const toast = this.toastManager.show(message.toast.message, message.toast.type, message.toast.duration);
        if (message.toast.type === 'processing') this.currentProcessingToast = toast;
      }
      
      // Handle legacy toast notifications (for backwards compatibility, only for phone detection)
      if (message.action === 'showToast' && message.source && !message.recentNumbers) {
        if (this.currentProcessingToast && message.type !== 'processing') {
          this.toastManager.remove(this.currentProcessingToast);
          this.currentProcessingToast = null;
        }
        
        const toast = this.toastManager.show(message.message, message.type, message.duration);
        if (message.type === 'processing') this.currentProcessingToast = toast;
      }
    });
  }

  fetchInitialData() {
    // Notify background that popup opened (clears badge)
    chrome.runtime.sendMessage({ action: 'popupOpened' });
    
    // Fetch last detected numbers and recent numbers from background
    chrome.runtime.sendMessage({ action: 'getLastPhoneNumbers' }, ({ phoneNumbers, countryCode, recentNumbers }) => {
      console.log('Received last phone numbers:', phoneNumbers);
      console.log('Received recent numbers:', recentNumbers);
      console.log('Recent numbers type:', typeof recentNumbers, 'Length:', recentNumbers?.length);
      
      if (phoneNumbers?.length) this.popupUtils.setPhoneList(phoneNumbers);
      if (countryCode) this.popupUtils.elements.countrySelect.value = countryCode;
      
      // Always update recent numbers manager, don't auto-add test data
      this.recentNumbersManager.update(recentNumbers || []);
    });
  }

  sendCountryCodeUpdate(countryCode) {
    console.log('Country changed to:', countryCode);
    chrome.runtime.sendMessage({ countryCode });
  }
}