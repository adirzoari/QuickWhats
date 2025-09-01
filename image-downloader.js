/**
 * Image Download Utilities
 * Handles downloading and processing images for protected URLs
 */

class ImageDownloader {
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

  // Download image via content script for authenticated access
  async downloadViaContentScript(imageUrl, tabId) {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'downloadImage',
      imageUrl: imageUrl
    });

    if (response && response.success) {
      return response.base64Data;
    } else {
      throw new Error(response?.error || 'Content script download failed');
    }
  }

  // Prepare image data for processing
  async prepareImageData(imageUrl, tabId = null, sendToastCallback = null) {
    let imageData = imageUrl;

    if (this.isProtectedUrl(imageUrl)) {
      if (sendToastCallback) {
        sendToastCallback('Downloading protected image...', 'processing', 0);
      }

      try {
        if (tabId) {
          imageData = await this.downloadViaContentScript(imageUrl, tabId);
        } else {
          imageData = await this.downloadImageAsBase64(imageUrl);
        }
      } catch (downloadError) {
        const errorMessage = tabId 
          ? 'Failed to download protected image. Try refreshing the page and trying again.'
          : 'Failed to download protected image. Try saving the image and uploading it directly.';
        throw new Error(errorMessage);
      }
    }

    return imageData;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ImageDownloader;
}