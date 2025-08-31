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
      
      if (message.phoneNumbers?.length) this.popupUtils.setPhoneList(message.phoneNumbers);
      if (message.recentNumbers !== undefined) this.recentNumbersManager.update(message.recentNumbers);
      
      // Handle combined toast notifications from background
      if (message.toast) {
        if (this.currentProcessingToast && message.toast.type !== 'processing') {
          this.toastManager.remove(this.currentProcessingToast);
          this.currentProcessingToast = null;
        }
        
        const toast = this.toastManager.show(message.toast.message, message.toast.type, message.toast.duration);
        if (message.toast.type === 'processing') this.currentProcessingToast = toast;
      }
      
      // Handle legacy toast notifications (for backwards compatibility)
      if (message.action === 'showToast') {
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