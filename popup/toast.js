/**
 * Toast Notification System for QuickWhats Extension
 * Provides user feedback for phone detection and processing
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.activeToasts = new Set();
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    } else {
      this.container = document.querySelector('.toast-container');
    }
  }

  /**
   * Show toast notification
   * @param {string} message - The message to display
   * @param {string} type - success, info, warning, error
   * @param {number} duration - Duration in ms (0 = persistent)
   */
  show(message, type = 'info', duration = 3000) {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = this.getIcon(type);
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="toastManager.remove(this.closest('.toast'))">&times;</button>
      </div>
    `;

    return toast;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      processing: '⏳'
    };
    return icons[type] || icons.info;
  }

  remove(toast) {
    if (!toast || !this.activeToasts.has(toast)) return;

    toast.classList.add('toast-hide');
    this.activeToasts.delete(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  clear() {
    this.activeToasts.forEach(toast => this.remove(toast));
  }

  // Specific toast methods for common use cases
  showPhoneDetected(count) {
    const message = count === 1 
      ? '1 phone number detected'
      : `${count} phone numbers detected`;
    return this.show(message, 'success', 3000);
  }

  showProcessingStarted() {
    return this.show('Image processing started...', 'processing', 0);
  }

  showNoPhoneFound() {
    return this.show('No phone numbers detected', 'info', 3000);
  }

  showError(message) {
    return this.show(message, 'error', 5000);
  }
}

// Global instance
const toastManager = new ToastManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ToastManager, toastManager };
}