/**
 * Recent Numbers Storage Module
 * Handles persistence and management of recently used phone numbers
 */

const MAX_RECENT_NUMBERS = 10;
let recentNumbers = [];

// Load recent numbers from storage
const loadRecentNumbers = async () => {
  try {
    const result = await chrome.storage.local.get(['recentNumbers']);
    recentNumbers = result.recentNumbers || [];
  } catch (error) {
    recentNumbers = [];
  }
};

// Save recent numbers to storage
const saveRecentNumbers = async () => {
  try {
    await chrome.storage.local.set({ recentNumbers });
  } catch (error) {
  }
};

// Add number to recent list
const addToRecentNumbers = (phoneNumber, countryCode = '+972', source = 'unknown') => {
  let cleanedNumber = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
  
  // Handle different phone number formats
  let fullNumber;
  if (cleanedNumber.startsWith(countryCode.replace(/\D/g, ''))) {
    // Already has country code
    fullNumber = `+${cleanedNumber}`;
  } else if (cleanedNumber.startsWith('0')) {
    // Local format starting with 0, remove the 0 and add country code
    fullNumber = `${countryCode}${cleanedNumber.substring(1)}`;
  } else {
    // No country code, add it directly
    fullNumber = `${countryCode}${cleanedNumber}`;
  }
  
  const timestamp = Date.now();
  
  // Remove existing entry if present
  recentNumbers = recentNumbers.filter(item => item.number !== fullNumber);
  
  // Add to beginning (simplified without source tracking)
  const newItem = {
    number: fullNumber,
    timestamp,
    country: countryCode
  };
  recentNumbers.unshift(newItem);
  
  // Limit size
  if (recentNumbers.length > MAX_RECENT_NUMBERS) {
    recentNumbers = recentNumbers.slice(0, MAX_RECENT_NUMBERS);
  }
  
  saveRecentNumbers();
};

// Get current recent numbers
const getRecentNumbers = () => recentNumbers;

// Remove specific number from recent list
const removeRecentNumber = (numberToRemove) => {
  recentNumbers = recentNumbers.filter(item => item.number !== numberToRemove);
  saveRecentNumbers();
};

// Clear all recent numbers
const clearAllRecentNumbers = () => {
  recentNumbers = [];
  saveRecentNumbers();
};