// phoneUtils.js
(function(window){
  // make sure libphonenumber-js is loaded
  if (!window.libphonenumber) {
    return;
  }

  const { parsePhoneNumberFromString, AsYouType, getCountryCallingCode, getCountries } = window.libphonenumber;

  const phoneUtils = {
    normalizeRawInput(input) {
      if (!input && input !== 0) return '';
      return String(input).trim();
    },

    parseNumber(input, defaultCountry) {
      const raw = this.normalizeRawInput(input);
      if (!raw) return null;
      const parsed = parsePhoneNumberFromString(raw, defaultCountry);
      return parsed || null;
    },

    detectCountry(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      return parsed?.country || null;
    },

    isValidNumber(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      return !!(parsed && parsed.isValid && parsed.isValid());
    },

    formatE164(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      return parsed ? parsed.format('E.164') : null;
    },

    formatInternational(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      return parsed ? parsed.formatInternational() : null;
    },

    formatNational(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      return parsed ? parsed.formatNational() : null;
    },

    getDialCode(input, defaultCountry) {
      const parsed = this.parseNumber(input, defaultCountry);
      if (!parsed) return null;
      const code = parsed.countryCallingCode;
      return code ? `+${code}` : null;
    },

    countriesForDialCode(dialCode) {
      if (!dialCode) return [];
      const cleaned = String(dialCode).replace(/[^\d]/g, '');
      return getCountries().filter(c => getCountryCallingCode(c) === cleaned);
    },

    whatsappNumberFor(input, defaultCountry, returnWithPlus = true) {
      const e164 = this.formatE164(input, defaultCountry);
      if (!e164) return null;
      return returnWithPlus ? e164 : e164.replace(/^\+/, '');
    },

    asYouType(input, defaultCountry) {
      const a = new AsYouType(defaultCountry);
      a.input(input || '');
      return a.getNumberValue() || a.getChars();
    }
  };

  window.phoneUtils = phoneUtils;
})(window);
