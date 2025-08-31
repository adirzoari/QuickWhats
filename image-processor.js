/**
 * Image Processing Module for QuickWhats Extension
 * Handles OpenAI Vision API integration for phone number extraction
 */

class ImageProcessor {
  constructor(sendNumbersToPopup, sendToastToPopup, sendToastToBrowser) {
    this.sendNumbersToPopup = sendNumbersToPopup;
    this.sendToastToPopup = sendToastToPopup;
    this.sendToastToBrowser = sendToastToBrowser;
  }

  // Extract phone number(s) from image via OpenAI
  async extractPhoneFromImage(imageUrl, source = 'image') {
    const { openAiKey: apiKey } = await chrome.storage.local.get(['openAiKey']);
    if (!apiKey) {
      const message = 'OpenAI API key required. Please set it in extension options.';
      this.sendToastToPopup(message, 'error', 5000);
      this.sendToastToBrowser(message, 'error', 5000);
      return;
    }

    // Show processing toast in both popup and browser
    this.sendToastToPopup('Image processing started...', 'processing', 0);
    this.sendToastToBrowser('Image processing started...', 'info', 0);

    // Determine if we need to download the image first
    let imageData = imageUrl;

    if (this.isProtectedUrl(imageUrl)) {
      try {
        this.sendToastToPopup('Downloading protected image...', 'processing', 0);
        imageData = await this.downloadImageAsBase64(imageUrl);
      } catch (downloadError) {
        console.log('Image download failed:', downloadError.message);
        const message = 'Failed to download protected image. Try saving the image and uploading it directly.';
        this.sendToastToPopup(message, 'error', 6000);
        this.sendToastToBrowser(message, 'error', 6000);
        return;
      }
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.getPromptText()
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageData 
                } 
              }
            ]
          }],
          max_tokens: 300
        })
      });

      const data = await response.json();
      
      // Handle API errors
      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API error');
      }
      
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      
      if (!text) {
        console.log('No number found in image.');
        this.sendToastToPopup('No phone numbers detected', 'info');
        this.sendToastToBrowser('No phone numbers detected', 'info');
        return;
      }

      const numbers = text.split(',').map(n => n.trim());
      console.log('Detected number(s) from image:', numbers);
      this.sendNumbersToPopup(numbers, source);
      
      // Also send success toast to browser
      const browserMessage = numbers.length === 1 
        ? '1 phone number detected from image'
        : `${numbers.length} phone numbers detected from image`;
      this.sendToastToBrowser(browserMessage, 'success');

    } catch (err) {
      console.log('OpenAI API error:', err.message);
      
      let errorMessage = 'Image processing failed';
      let shouldRetryWithDownload = false;
      
      // Provide specific error messages for common issues
      if (err.message.includes('invalid_api_key') || err.message.includes('Unauthorized')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in options.';
      } else if (err.message.includes('insufficient_quota') || err.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your usage limits.';
      } else if (err.message.includes('rate_limit')) {
        errorMessage = 'OpenAI API rate limit reached. Please wait and try again.';
      } else if (err.message.includes('invalid_image_url') || err.message.includes('Error while downloading')) {
        if (!this.isProtectedUrl(imageUrl)) {
          // If it's not a known protected URL but still failed, try downloading as fallback
          shouldRetryWithDownload = true;
          errorMessage = 'Image URL not accessible, attempting to download...';
        } else {
          errorMessage = 'Cannot access protected image. Try saving the image and uploading it directly.';
        }
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      // Retry with download if the image URL was invalid but it's not a known protected domain
      if (shouldRetryWithDownload) {
        this.sendToastToPopup(errorMessage, 'info', 3000);
        try {
          const base64Data = await this.downloadImageAsBase64(imageUrl);
          // Recursively call with the base64 data, but modify the URL check to prevent infinite loop
          const tempUrl = base64Data;
          return await this.extractPhoneFromImage(tempUrl, source);
        } catch (downloadErr) {
          console.log('Fallback download also failed:', downloadErr.message);
          errorMessage = 'Both direct access and download failed. Image may not be accessible.';
        }
      }
      
      this.sendToastToPopup(errorMessage, 'error', 8000);
      this.sendToastToBrowser(errorMessage, 'error', 8000);
    }
  }

  // Extract phone number from image using content script for authentication
  async extractPhoneFromImageWithContentScript(imageUrl, source = 'image', tabId) {
    const { openAiKey: apiKey } = await chrome.storage.local.get(['openAiKey']);
    if (!apiKey) {
      const message = 'OpenAI API key required. Please set it in extension options.';
      this.sendToastToPopup(message, 'error', 5000);
      this.sendToastToBrowser(message, 'error', 5000);
      return;
    }

    // Show processing toast
    this.sendToastToPopup('Image processing started...', 'processing', 0);
    this.sendToastToBrowser('Image processing started...', 'info', 0);

    let imageData = imageUrl;

    // If it's a protected URL, use content script to download with proper authentication
    if (this.isProtectedUrl(imageUrl)) {
      try {
        this.sendToastToPopup('Downloading protected image...', 'processing', 0);
        
        // Send message to content script to download the image
        const response = await chrome.tabs.sendMessage(tabId, {
          action: 'downloadImage',
          imageUrl: imageUrl
        });

        if (response && response.success) {
          imageData = response.base64Data;
        } else {
          throw new Error(response?.error || 'Content script download failed');
        }
      } catch (downloadError) {
        console.log('Content script image download failed:', downloadError.message);
        const message = 'Failed to download protected image. Try refreshing the page and trying again.';
        this.sendToastToPopup(message, 'error', 6000);
        this.sendToastToBrowser(message, 'error', 6000);
        return;
      }
    }

    // Continue with existing OpenAI processing logic
    return await this.processImageWithOpenAI(imageData, source);
  }

  // Separate method for OpenAI processing to avoid code duplication
  async processImageWithOpenAI(imageData, source) {
    const { openAiKey: apiKey } = await chrome.storage.local.get(['openAiKey']);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.getPromptText()
              },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageData 
                } 
              }
            ]
          }],
          max_tokens: 300
        })
      });

      const data = await response.json();
      
      // Handle API errors
      if (data.error) {
        throw new Error(data.error.message || 'OpenAI API error');
      }
      
      const text = data.choices?.[0]?.message?.content?.trim() || '';
      
      if (!text) {
        console.log('No number found in image.');
        this.sendToastToPopup('No phone numbers detected', 'info');
        this.sendToastToBrowser('No phone numbers detected', 'info');
        return;
      }

      const numbers = text.split(',').map(n => n.trim());
      console.log('Detected number(s) from image:', numbers);
      this.sendNumbersToPopup(numbers, source);
      
      // Also send success toast to browser
      const browserMessage = numbers.length === 1 
        ? '1 phone number detected from image'
        : `${numbers.length} phone numbers detected from image`;
      this.sendToastToBrowser(browserMessage, 'success');

    } catch (err) {
      console.log('OpenAI API error:', err.message);
      
      let errorMessage = 'Image processing failed';
      
      // Provide specific error messages for common issues
      if (err.message.includes('invalid_api_key') || err.message.includes('Unauthorized')) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key in options.';
      } else if (err.message.includes('insufficient_quota') || err.message.includes('quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your usage limits.';
      } else if (err.message.includes('rate_limit')) {
        errorMessage = 'OpenAI API rate limit reached. Please wait and try again.';
      } else if (err.message.includes('invalid_image_url') || err.message.includes('Error while downloading')) {
        errorMessage = 'Image could not be processed. Please try a different image.';
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please try again.';
      }
      
      this.sendToastToPopup(errorMessage, 'error', 8000);
      this.sendToastToBrowser(errorMessage, 'error', 8000);
    }
  }

  // Download image and convert to base64 for protected URLs
  async downloadImageAsBase64(imageUrl) {
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
  }

  // Check if URL is from a protected/social media CDN
  isProtectedUrl(url) {
    // Base64 data URLs are not protected URLs
    if (url.startsWith('data:image/')) {
      return false;
    }
    
    const protectedDomains = [
      'scontent.', // Facebook CDN
      'fbcdn.net', // Facebook CDN
      'instagram.com',
      'cdninstagram.com',
      'twimg.com', // Twitter images
      'media.licdn.com' // LinkedIn images
    ];
    
    return protectedDomains.some(domain => url.includes(domain));
  }

  getPromptText() {
    return `You are an assistant specialized in extracting phone numbers from images.
Analyze the provided image and return ALL phone numbers found in it.

Requirements:
1. Include the country code for each number (like +972XXXXXXXX).
2. Return only numbers, no words, sentences, or extra characters.
3. Separate multiple numbers with commas.
4. Ignore formatting like spaces, dashes, or parentheses — normalize numbers to digits only with country code.

Output example:
+4174239324,+4175551234`;
  }
}