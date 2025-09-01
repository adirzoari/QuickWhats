import { allEmojis } from '../utils/emoji.js';

class EmojiPicker {
  constructor(targetTextarea) {
    this.targetTextarea = targetTextarea;
    this.currentCategory = 'people';
    this.isVisible = false;
    this.pickerElement = null;
    this.categoryTabs = null;
    this.emojiGrid = null;
    
    this.init();
  }

  init() {
    this.createPickerElement();
    this.attachEventListeners();
  }

  createPickerElement() {
    this.pickerElement = document.createElement('div');
    this.pickerElement.className = 'emoji-picker hidden';
    this.pickerElement.innerHTML = this.getPickerHTML();
    
    document.body.appendChild(this.pickerElement);
    
    this.categoryTabs = this.pickerElement.querySelector('.emoji-categories');
    this.emojiGrid = this.pickerElement.querySelector('.emoji-grid');
    
    this.renderCategory(this.currentCategory);
  }

  getPickerHTML() {
    const categories = Object.keys(allEmojis);
    const categoryIcons = {
      people: '😊',
      nature: '🐱',
      food: '🍎',
      activities: '⚽',
      travel: '🚗',
      objects: '📱',
      symbols: '❤️'
    };

    const tabsHTML = categories.map(category => `
      <button class="category-tab ${category === this.currentCategory ? 'active' : ''}" 
              data-category="${category}">
        ${categoryIcons[category]}
      </button>
    `).join('');

    return `
      <div class="emoji-picker-header">
        <div class="emoji-categories">${tabsHTML}</div>
      </div>
      <div class="emoji-grid"></div>
    `;
  }

  renderCategory(category) {
    if (!allEmojis[category]) return;
    
    this.currentCategory = category;
    
    this.updateActiveTab();
    
    const emojis = allEmojis[category];
    this.emojiGrid.innerHTML = emojis.map(emoji => `
      <button class="emoji-item" data-emoji="${emoji}">
        ${emoji}
      </button>
    `).join('');
  }

  updateActiveTab() {
    const tabs = this.categoryTabs.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === this.currentCategory);
    });
  }

  attachEventListeners() {
    this.categoryTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.category-tab');
      if (tab) {
        this.renderCategory(tab.dataset.category);
      }
    });

    this.emojiGrid.addEventListener('click', (e) => {
      const emojiItem = e.target.closest('.emoji-item');
      if (emojiItem) {
        this.selectEmoji(emojiItem.dataset.emoji);
      }
    });


    document.addEventListener('click', (e) => {
      if (this.isVisible && 
          !this.pickerElement.contains(e.target) && 
          !e.target.closest('.emoji-trigger-btn-inline')) {
        this.hide();
      }
    });
  }

  selectEmoji(emoji) {
    if (!this.targetTextarea) return;
    
    
    // Focus the textarea
    this.targetTextarea.focus();
    
    // Get cursor position
    const start = this.targetTextarea.selectionStart;
    const end = this.targetTextarea.selectionEnd;
    
    // Get current text
    const currentText = this.targetTextarea.value;
    
    // Insert emoji at cursor position
    const beforeCursor = currentText.slice(0, start);
    const afterCursor = currentText.slice(end);
    const newText = beforeCursor + emoji + afterCursor;
    
    // Set new value
    this.targetTextarea.value = newText;
    
    // Position cursor after the emoji
    const newCursorPos = start + emoji.length;
    this.targetTextarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger events
    this.targetTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    this.targetTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Log final result
    
    // Trigger RTL detection
    if (window.detectAndApplyRTL) {
      window.detectAndApplyRTL(this.targetTextarea);
    }
    
    this.hide();
  }

  show(buttonElement) {
    if (!buttonElement) return;
    
    this.isVisible = true;
    this.pickerElement.classList.remove('hidden');
    
    const buttonRect = buttonElement.getBoundingClientRect();
    const textareaRect = this.targetTextarea.getBoundingClientRect();
    const pickerRect = this.pickerElement.getBoundingClientRect();
    
    // Position picker to the right of the textarea, aligned with the button
    let left = textareaRect.right - pickerRect.width;
    let top = buttonRect.bottom + 5;
    
    // Ensure picker stays within viewport
    if (left + pickerRect.width > window.innerWidth) {
      left = window.innerWidth - pickerRect.width - 10;
    }
    if (left < 10) left = 10;
    
    // If picker would go below viewport, position it above the button
    if (top + pickerRect.height > window.innerHeight) {
      top = textareaRect.top - pickerRect.height - 5;
    }
    
    this.pickerElement.style.left = `${left}px`;
    this.pickerElement.style.top = `${top}px`;
  }

  hide() {
    this.isVisible = false;
    this.pickerElement.classList.add('hidden');
  }

  toggle(buttonElement) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(buttonElement);
    }
  }

  destroy() {
    if (this.pickerElement && this.pickerElement.parentNode) {
      this.pickerElement.parentNode.removeChild(this.pickerElement);
    }
  }
}

export { EmojiPicker };