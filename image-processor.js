/**
 * Image Processing Module for QuickWhats Extension
 * Handles OpenAI Vision API integration for phone number extraction
 */

class ImageProcessor {
  constructor(sendNumbersToPopup, sendToastToPopup, sendToastToBrowser) {
    this.sendNumbersToPopup = sendNumbersToPopup;
    this.sendToastToPopup = sendToastToPopup;
    this.sendToastToBrowser = sendToastToBrowser;
    this.imageDownloader = new ImageDownloader();
    this.openAIClient = new OpenAIClient();
  }

  // Extract phone number(s) from image via OpenAI
  async extractPhoneFromImage(imageUrl, source = 'image') {
    // Show processing toast in both popup and browser
    this.sendToastToPopup('Image processing started...', 'processing', 0);
    this.sendToastToBrowser('Image processing started...', 'info', 0);

    try {
      // Prepare image data (handles protected URLs)
      const imageData = await this.imageDownloader.prepareImageData(
        imageUrl, 
        null, 
        (message, type, timeout) => this.sendToastToPopup(message, type, timeout)
      );

      // Process with OpenAI
      const numbers = await this.openAIClient.processImage(imageData);
      
      if (numbers.length === 0) {
        console.log('No number found in image.');
        this.sendToastToPopup('No phone numbers detected', 'info');
        this.sendToastToBrowser('No phone numbers detected', 'info');
        return;
      }

      console.log('Detected number(s) from image:', numbers);
      this.sendNumbersToPopup(numbers, source);
      
      // Send success toast to browser
      const browserMessage = numbers.length === 1 
        ? '1 phone number detected from image'
        : `${numbers.length} phone numbers detected from image`;
      this.sendToastToBrowser(browserMessage, 'success');

    } catch (err) {
      console.log('Image processing error:', err.message);
      
      let errorMessage = this.openAIClient.getErrorMessage(err);
      let shouldRetryWithDownload = false;
      
      // Check if we should retry with download for non-protected URLs
      if (err.message.includes('invalid_image_url') || err.message.includes('Error while downloading')) {
        if (!this.imageDownloader.isProtectedUrl(imageUrl)) {
          shouldRetryWithDownload = true;
          errorMessage = 'Image URL not accessible, attempting to download...';
        }
      }
      
      // Retry with download if appropriate
      if (shouldRetryWithDownload) {
        this.sendToastToPopup(errorMessage, 'info', 3000);
        try {
          const base64Data = await this.imageDownloader.downloadImageAsBase64(imageUrl);
          return await this.extractPhoneFromImage(base64Data, source);
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
    // Show processing toast
    this.sendToastToPopup('Image processing started...', 'processing', 0);
    this.sendToastToBrowser('Image processing started...', 'info', 0);

    try {
      // Prepare image data using content script for protected URLs
      const imageData = await this.imageDownloader.prepareImageData(
        imageUrl, 
        tabId,
        (message, type, timeout) => this.sendToastToPopup(message, type, timeout)
      );

      // Process with OpenAI
      const numbers = await this.openAIClient.processImage(imageData);
      
      if (numbers.length === 0) {
        console.log('No number found in image.');
        this.sendToastToPopup('No phone numbers detected', 'info');
        this.sendToastToBrowser('No phone numbers detected', 'info');
        return;
      }

      console.log('Detected number(s) from image:', numbers);
      this.sendNumbersToPopup(numbers, source);
      
      // Send success toast to browser
      const browserMessage = numbers.length === 1 
        ? '1 phone number detected from image'
        : `${numbers.length} phone numbers detected from image`;
      this.sendToastToBrowser(browserMessage, 'success');

    } catch (err) {
      console.log('Image processing error:', err.message);
      const errorMessage = this.openAIClient.getErrorMessage(err);
      this.sendToastToPopup(errorMessage, 'error', 8000);
      this.sendToastToBrowser(errorMessage, 'error', 8000);
    }
  }

  // Legacy method - kept for backward compatibility
  async processImageWithOpenAI(imageData, source) {
    try {
      const numbers = await this.openAIClient.processImage(imageData);
      
      if (numbers.length === 0) {
        console.log('No number found in image.');
        this.sendToastToPopup('No phone numbers detected', 'info');
        this.sendToastToBrowser('No phone numbers detected', 'info');
        return;
      }

      console.log('Detected number(s) from image:', numbers);
      this.sendNumbersToPopup(numbers, source);
      
      // Send success toast to browser
      const browserMessage = numbers.length === 1 
        ? '1 phone number detected from image'
        : `${numbers.length} phone numbers detected from image`;
      this.sendToastToBrowser(browserMessage, 'success');

    } catch (err) {
      console.log('OpenAI API error:', err.message);
      const errorMessage = this.openAIClient.getErrorMessage(err);
      this.sendToastToPopup(errorMessage, 'error', 8000);
      this.sendToastToBrowser(errorMessage, 'error', 8000);
    }
  }

}