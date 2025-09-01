/**
 * OpenAI Models Configuration
 * Defines available OpenAI models for image processing
 */

const OPENAI_MODELS = {
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Balanced performance and cost (Default)',
    supportsVision: true
  },
   'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Latest mini model with enhanced capabilities',
    supportsVision: true
  },
  'o1-mini': {
    id: 'o1-mini',
    name: 'o1-mini',
    description: 'Advanced reasoning capabilities',
    supportsVision: true
  },
 
};

const DEFAULT_MODEL = 'gpt-4o-mini';

const getAvailableModels = () => {
  return Object.values(OPENAI_MODELS);
};

const getModelById = (modelId) => {
  return OPENAI_MODELS[modelId] || OPENAI_MODELS[DEFAULT_MODEL];
};

const getDefaultModel = () => {
  return DEFAULT_MODEL;
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OPENAI_MODELS,
    DEFAULT_MODEL,
    getAvailableModels,
    getModelById,
    getDefaultModel
  };
}