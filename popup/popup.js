document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('phoneNumber');
  const countrySelect = document.getElementById('countrySelect');
  const messageInput = document.getElementById('message');
  const sendBtn = document.getElementById('sendBtn');
  const phoneSelect = document.getElementById('phoneSelect');
  const phoneSelectContainer = document.getElementById('phoneSelectContainer');
  const recentContainer = document.getElementById('recentContainer');
  const recentNumbers = document.getElementById('recentNumbers');
  const mainContent = document.getElementById('mainContent');
  const settingsContent = document.getElementById('settingsContent');
  const headerTitle = document.querySelector('.header-title');
  const logoImage = document.getElementById("headerLogo")
  const backBtn = document.getElementById('backBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const DEFAULT_COUNTRY = 'IL';

  console.log('Popup loaded');

  // Settings elements
  const apiKeyInput = document.getElementById('apiKeyInput');
  const modelSelect = document.getElementById('modelSelect');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testApiBtn = document.getElementById('testApiBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Element collections for modules
  const popupElements = {
    phoneInput,
    countrySelect,
    messageInput,
    phoneSelect,
    phoneSelectContainer
  };

  const settingsElements = {
    apiKeyInput,
    modelSelect,
    saveSettingsBtn,
    testApiBtn,
    statusDot,
    statusText
  };

  // --- Header Management ---
  const updateHeaderTitle = (title) => {
    headerTitle.textContent = title;
  };

  const showMainView = () => {
    updateHeaderTitle('QuickWhats');
    backBtn.style.display = 'none';
    settingsBtn.style.display = 'block';
    mainContent.style.display = 'block';
    logoImage.style.display = 'block';
    settingsContent.style.display = 'none';
  };

  const showSettingsView = () => {
    updateHeaderTitle('Settings');
    backBtn.style.display = 'block';
    settingsBtn.style.display = 'none';
    mainContent.style.display = 'none';
    logoImage.style.display ='none';
    settingsContent.style.display = 'block';
  };

  // --- Initialize Modules ---
  const popupUtils = new PopupUtils(popupElements, DEFAULT_COUNTRY);
  const recentNumbersManager = new RecentNumbersManager(
    recentContainer, 
    recentNumbers, 
    (phone) => popupUtils.setPhoneNumber(phone),
    (phone) => handleDeleteRecentNumber(phone),
    () => handleClearAllRecentNumbers()
  );
  const settingsManager = new SettingsManager(settingsElements, toastManager);
  const messaging = new PopupMessaging(popupUtils, recentNumbersManager, toastManager);

  // --- Delete Functions ---
  const handleDeleteRecentNumber = (phoneNumber) => {
    // Send delete request to background script
    chrome.runtime.sendMessage({ 
      action: 'deleteRecentNumber', 
      phoneNumber: phoneNumber 
    }, (response) => {
      if (response && response.recentNumbers) {
        recentNumbersManager.update(response.recentNumbers);
        toastManager.show('Number removed from recent list', 'success', 2000);
      }
    });
  };

  const handleClearAllRecentNumbers = () => {
    // Send clear all request to background script
    chrome.runtime.sendMessage({ 
      action: 'clearAllRecentNumbers' 
    }, (response) => {
      if (response && response.recentNumbers) {
        recentNumbersManager.update(response.recentNumbers);
        toastManager.show('All recent numbers cleared', 'success', 2000);
      }
    });
  };

  // --- Event Listeners ---
  settingsBtn.addEventListener('click', showSettingsView);
  backBtn.addEventListener('click', showMainView);

  // Clear all button
  const clearAllBtn = document.getElementById('clearAllBtn');
  clearAllBtn.addEventListener('click', handleClearAllRecentNumbers);

  // Select number from dropdown
  phoneSelect.addEventListener('change', () => {
    const selected = phoneSelect.value;
    popupUtils.setPhoneNumber(selected);
  });

  countrySelect.addEventListener('change', () => {
    messaging.sendCountryCodeUpdate(countrySelect.value);
  });

  sendBtn.addEventListener('click', () => {
    popupUtils.sendWhatsApp(toastManager, recentNumbersManager);
  });

  // --- Initial Setup ---
  popupUtils.populateCountries();
  settingsManager.loadSettings();
  messaging.init();
  
  // Initialize recent numbers storage
  loadRecentNumbers();

  console.log('Event listeners attached');
});