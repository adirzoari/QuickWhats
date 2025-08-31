/**
 * Settings Management Module for QuickWhats Extension
 * Handles settings UI, storage, and API testing
 */

class SettingsManager {
  constructor(elements, toastManager) {
    this.elements = elements;
    this.toastManager = toastManager;
    this.init();
  }

  init() {
    this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    this.elements.testApiBtn.addEventListener('click', () => this.testApi());
  }

  async loadSettings() {
    const settings = await chrome.storage.local.get(['openAiKey']);
    
    if (settings.openAiKey) {
      this.elements.apiKeyInput.value = settings.openAiKey;
      this.updateApiStatus(true);
    }
  }

  async saveSettings() {
    const apiKey = this.elements.apiKeyInput.value.trim();
    
    // Validate API key if provided
    if (apiKey && !apiKey.startsWith('sk-')) {
      this.toastManager.show('Invalid API key format. OpenAI keys should start with "sk-"', 'error');
      return;
    }
    
    const settings = {
      openAiKey: apiKey
    };
    
    try {
      await chrome.storage.local.set(settings);
      this.toastManager.show('Settings saved successfully', 'success');
      this.updateApiStatus(!!settings.openAiKey);
    } catch (error) {
      this.toastManager.show('Failed to save settings. Please try again.', 'error');
    }
  }

  async testApi() {
    const apiKey = this.elements.apiKeyInput.value.trim();
    if (!apiKey) {
      this.toastManager.show('Please enter an API key first', 'warning');
      return;
    }

    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      this.toastManager.show('Invalid API key format. OpenAI keys should start with "sk-"', 'error');
      return;
    }

    this.toastManager.show('Testing API connection...', 'info');
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      
      if (response.ok) {
        this.toastManager.show('API connection successful!', 'success');
        this.updateApiStatus(true);
      } else {
        const data = await response.json().catch(() => ({}));
        let errorMessage = 'API connection failed';
        
        if (response.status === 401) {
          errorMessage = 'Invalid API key. Please check your OpenAI API key.';
        } else if (response.status === 429) {
          errorMessage = 'API quota exceeded. Please check your usage limits.';
        } else if (data.error?.message) {
          errorMessage = `API error: ${data.error.message}`;
        }
        
        this.toastManager.show(errorMessage, 'error');
        this.updateApiStatus(false);
      }
    } catch (error) {
      let errorMessage = 'API test failed';
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      this.toastManager.show(errorMessage, 'error');
      this.updateApiStatus(false);
    }
  }

  updateApiStatus(connected) {
    if (connected) {
      this.elements.statusDot.className = 'w-2 h-2 bg-success rounded-full';
      this.elements.statusText.textContent = 'Connected';
      this.elements.statusText.className = 'text-xs text-success';
    } else {
      this.elements.statusDot.className = 'w-2 h-2 bg-secondary rounded-full';
      this.elements.statusText.textContent = 'Not configured';
      this.elements.statusText.className = 'text-xs text-secondary';
    }
  }

}