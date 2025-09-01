/**
 * OpenAI API Client
 * Handles communication with OpenAI API for image processing
 */

class OpenAIClient {
  constructor() {
    this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  }

  // Get current model from storage or default
  async getSelectedModel() {
    const { openAiModel } = await chrome.storage.local.get(['openAiModel']);
    return openAiModel || getDefaultModel();
  }

  // Get prompt text for phone number extraction
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

  // Process image with OpenAI API
  async processImage(imageData) {
    const { openAiKey: apiKey } = await chrome.storage.local.get(['openAiKey']);
    
    if (!apiKey) {
      throw new Error('OpenAI API key required. Please set it in extension options.');
    }

    const selectedModel = await this.getSelectedModel();

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
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
      return [];
    }

    return text.split(',').map(n => n.trim());
  }

  // Generate specific error messages for common API issues
  getErrorMessage(error) {
    const message = error.message;

    if (message.includes('invalid_api_key') || message.includes('Unauthorized')) {
      return 'Invalid OpenAI API key. Please check your API key in options.';
    } else if (message.includes('insufficient_quota') || message.includes('quota')) {
      return 'OpenAI API quota exceeded. Please check your usage limits.';
    } else if (message.includes('rate_limit')) {
      return 'OpenAI API rate limit reached. Please wait and try again.';
    } else if (message.includes('invalid_image_url') || message.includes('Error while downloading')) {
      return 'Image could not be processed. Please try a different image.';
    } else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection.';
    } else if (message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }

    return 'Image processing failed';
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenAIClient;
}