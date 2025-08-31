/**
 * Browser Toast System for QuickWhats Extension
 * Lightweight toast notifications for web pages
 */

class BrowserToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Set();
    this.initialized = false;
    this.init();
  }

  init() {
    // Only initialize once and avoid conflicts
    if (this.initialized || document.querySelector('#quickwhats-toast-container')) {
      return;
    }

    this.createContainer();
    this.initialized = true;
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'quickwhats-toast-container';
    this.container.style.cssText = `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
    `;
    
    // Append to body, or html if body doesn't exist yet
    const target = document.body || document.documentElement;
    target.appendChild(this.container);
  }

  show(message, type = 'success', duration = 3000) {
    if (!this.container) {
      this.init();
    }

    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.toasts.add(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
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
    
    // Get colors based on type
    const styles = this.getToastStyles(type);
    
    toast.style.cssText = `
      background: ${styles.background} !important;
      color: ${styles.color} !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      border: 1px solid ${styles.border} !important;
      margin-bottom: 8px !important;
      transform: translateX(100%) !important;
      opacity: 0 !important;
      transition: all 0.3s ease-out !important;
      pointer-events: auto !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
      font-weight: 500 !important;
      backdrop-filter: blur(4px) !important;
      position: relative !important;
    `;

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${this.getIcon(type)}</span>
        <span>${this.escapeHtml(message)}</span>
      </div>
    `;

    return toast;
  }

  getToastStyles(type) {
    const styles = {
      success: {
        background: 'rgba(74, 227, 116, 0.95)',
        color: '#ffffff',
        border: 'rgba(74, 227, 116, 0.8)'
      },
      info: {
        background: 'rgba(7, 94, 84, 0.95)',
        color: '#ffffff', 
        border: 'rgba(7, 94, 84, 0.8)'
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.95)',
        color: '#ffffff',
        border: 'rgba(245, 158, 11, 0.8)'
      },
      error: {
        background: 'rgba(239, 68, 68, 0.95)',
        color: '#ffffff',
        border: 'rgba(239, 68, 68, 0.8)'
      }
    };
    
    return styles[type] || styles.info;
  }

  getIcon(type) {
    const icons = {
      success: '✅',
      info: 'ℹ️', 
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.info;
  }

  remove(toast) {
    if (!toast || !this.toasts.has(toast)) return;

    this.toasts.delete(toast);
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  clear() {
    this.toasts.forEach(toast => this.remove(toast));
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
const browserToastManager = new BrowserToastManager();

// Export for global access
window.quickWhatsToast = browserToastManager;