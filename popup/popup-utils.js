/**
 * Popup Utilities Module for QuickWhats Extension
 * Handles phone number operations and country data
 */

class PopupUtils {
  constructor(elements, DEFAULT_COUNTRY) {
    this.elements = elements;
    this.DEFAULT_COUNTRY = DEFAULT_COUNTRY;
  }

  setPhoneNumber(fullNumber) {
    if (!fullNumber) return;

    const dialCode = window.phoneUtils?.getDialCode(fullNumber, this.DEFAULT_COUNTRY) || '+972';
    this.elements.countrySelect.value = dialCode;

    let localNumber = fullNumber.startsWith(dialCode)
      ? fullNumber.slice(dialCode.length)
      : fullNumber;

    this.elements.phoneInput.value = localNumber;
    console.log('Local phone number set in input:', localNumber);
  }

  setPhoneList(numbers) {
    if (!numbers || !numbers.length) {
      this.elements.phoneSelectContainer.style.display = 'none';
      return;
    }

    if (numbers.length === 1) {
      // Single number: hide container and just populate the input
      this.elements.phoneSelectContainer.style.display = 'none';
      this.setPhoneNumber(numbers[0]);
    } else {
      // Multiple numbers: show container with dropdown
      this.elements.phoneSelect.innerHTML = ''; // clear previous
      numbers.forEach((num) => {
        const option = document.createElement('option');
        option.value = num;
        option.textContent = `📞 ${num}`;
        this.elements.phoneSelect.appendChild(option);
      });
      
      this.elements.phoneSelectContainer.style.display = 'block';
      this.setPhoneNumber(numbers[0]); // default first
    }
  }

  sendWhatsApp(toastManager, recentNumbersManager) {
    const rawPhone = this.elements.phoneInput.value.replace(/\D/g, '');
    const countryCode = this.elements.countrySelect.value;
    if (!rawPhone) {
      toastManager.show('Please enter a phone number', 'warning');
      return;
    }

    const formattedPhone = `${countryCode}${rawPhone}`;
    const text = encodeURIComponent(this.elements.messageInput.value || '');
    
    // Notify background to track in recent numbers
    chrome.runtime.sendMessage({ 
      action: 'sendWhatsApp', 
      phoneNumber: rawPhone,
      countryCode: countryCode
    }, (response) => {
      if (response && response.recentNumbers) {
        recentNumbersManager.update(response.recentNumbers);
      }
    });
    
    chrome.tabs.create({ url: `https://wa.me/${formattedPhone}?text=${text}` });
    toastManager.show('Opening WhatsApp...', 'success');
  }

  populateCountries() {
    if (!window.countries || !countries.length) {
      console.error('Countries data not loaded');
      return;
    }

    countries.forEach(({ emoji, code, dial_code }) => {
      const option = document.createElement('option');
      option.value = dial_code;
      option.textContent = `${emoji} ${code} (${dial_code})`;
      this.elements.countrySelect.appendChild(option);
    });

    this.elements.countrySelect.value = '+972'; // default
  }
}