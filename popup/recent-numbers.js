/**
 * Recent Numbers Management Module
 * Handles display and interaction with recently used phone numbers
 */

class RecentNumbersManager {
  constructor(recentContainer, recentNumbers, onNumberSelect, onNumberDelete, onClearAll) {
    this.recentContainer = recentContainer;
    this.recentNumbers = recentNumbers;
    this.onNumberSelect = onNumberSelect;
    this.onNumberDelete = onNumberDelete;
    this.onClearAll = onClearAll;
  }

  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  formatSource(source) {
    if (!source || source === 'unknown') {
      return 'unknown';
    }
    
    if (source === 'recent') {
      return 'recent';
    }
    
    // Handle specific source types
    if (source === 'image') return 'image';
    
    // Clean up domain names  
    const cleanSource = source.replace(/^www\./, '').replace(/^https?:\/\//, '');
    return cleanSource;
  }

  update(recentList) {
    console.log('Recent numbers update called with:', recentList); // Debug
    
    if (!recentList || !recentList.length) {
      this.recentContainer.style.display = 'none';
      return;
    }

    this.recentNumbers.innerHTML = '';
    recentList.slice(0, 5).forEach(item => {
      console.log('Processing recent item:', JSON.stringify(item)); // Debug each item
      console.log('Item source:', item.source); // Debug source specifically
      
      const formattedSource = this.formatSource(item.source);
      console.log('Formatted source result:', formattedSource); // Debug formatted result
      
      const recentItem = document.createElement('div');
      recentItem.className = 'recent-number-item';
      recentItem.innerHTML = `
        <div class="recent-number-main">
          <div class="recent-number-content">
            <div class="recent-number-text">${item.number}</div>
            <div class="recent-number-meta">🌐 ${this.formatSource(item.source)} • ${this.formatTimeAgo(item.timestamp)}</div>
          </div>
          <button class="recent-delete-btn" title="Remove number">🗑️</button>
        </div>
      `;
      
      // Click on number area to select
      const textArea = recentItem.querySelector('.recent-number-text');
      const mainArea = recentItem.querySelector('.recent-number-main');
      
      const selectNumber = () => {
        // Send message to background to update timestamp and get fresh data
        chrome.runtime.sendMessage({
          action: 'updateRecentNumberTimestamp',
          phoneNumber: item.number.replace(/^\+\d{1,3}/, ''),
          countryCode: item.country || '+972'
        }, (response) => {
          // Update list with fresh data from background
          if (response && response.recentNumbers) {
            this.update(response.recentNumbers);
          }
        });
        
        this.onNumberSelect(item.number);
        if (window.toastManager) {
          toastManager.show('Recent number selected', 'info', 2000);
        }
      };

      textArea.addEventListener('click', selectNumber);
      mainArea.addEventListener('click', (e) => {
        // Don't trigger if clicking the delete button
        if (!e.target.classList.contains('recent-delete-btn')) {
          selectNumber();
        }
      });
      
      // Click on delete button to remove
      const deleteBtn = recentItem.querySelector('.recent-delete-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.onNumberDelete) {
          this.onNumberDelete(item.number);
        }
      });
      
      this.recentNumbers.appendChild(recentItem);
    });

    this.recentContainer.style.display = 'block';
  }
}