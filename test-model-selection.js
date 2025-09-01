/**
 * Test Script for Model Selection Functionality
 * Run this in browser console to test the model selection feature
 */

// Test the openai-models.js functionality

// Test storage functionality
async function testModelStorage() {
  
  // Save a test model
  await chrome.storage.local.set({ openAiModel: 'o1-mini' });
  
  // Retrieve the saved model
  const { openAiModel } = await chrome.storage.local.get(['openAiModel']);
  
  // Reset to default
  await chrome.storage.local.set({ openAiModel: getDefaultModel() });
}

// Test OpenAI client model selection
async function testOpenAIClient() {
  
  const client = new OpenAIClient();
  const selectedModel = await client.getSelectedModel();
}

// Run tests
if (typeof chrome !== 'undefined' && chrome.storage) {
} else {
}

