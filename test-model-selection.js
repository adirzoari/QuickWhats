/**
 * Test Script for Model Selection Functionality
 * Run this in browser console to test the model selection feature
 */

// Test the openai-models.js functionality
console.log('Testing OpenAI Models Configuration...');
console.log('Available models:', getAvailableModels());
console.log('Default model:', getDefaultModel());
console.log('Model by ID (gpt-4o-mini):', getModelById('gpt-4o-mini'));

// Test storage functionality
async function testModelStorage() {
  console.log('Testing model storage functionality...');
  
  // Save a test model
  await chrome.storage.local.set({ openAiModel: 'o1-mini' });
  console.log('✓ Saved o1-mini to storage');
  
  // Retrieve the saved model
  const { openAiModel } = await chrome.storage.local.get(['openAiModel']);
  console.log('✓ Retrieved model from storage:', openAiModel);
  
  // Reset to default
  await chrome.storage.local.set({ openAiModel: getDefaultModel() });
  console.log('✓ Reset to default model:', getDefaultModel());
}

// Test OpenAI client model selection
async function testOpenAIClient() {
  console.log('Testing OpenAI client model selection...');
  
  const client = new OpenAIClient();
  const selectedModel = await client.getSelectedModel();
  console.log('✓ OpenAI client selected model:', selectedModel);
}

// Run tests
if (typeof chrome !== 'undefined' && chrome.storage) {
  testModelStorage().catch(console.error);
  testOpenAIClient().catch(console.error);
} else {
  console.log('Chrome storage API not available - skipping storage tests');
}

console.log('Model selection test completed!');