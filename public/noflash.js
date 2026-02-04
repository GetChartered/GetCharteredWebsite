(function () {
  var storageKey = 'theme';
  var dataAttribute = 'data-theme';

  function setThemeAttribute(theme) {
    // Validate theme before setting - only accept 'light' or 'dark'
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute(dataAttribute, theme);
    }
  }

  var preferDarkQuery = '(prefers-color-scheme: dark)';
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var storedTheme = null;

  // Try localStorage first
  try {
    storedTheme = localStorage.getItem(storageKey);
  } catch (err) {
    // localStorage unavailable (e.g., private browsing), try sessionStorage
    try {
      storedTheme = sessionStorage.getItem(storageKey);
    } catch (sessionErr) {
      // Both storage mechanisms unavailable
    }
  }

  // Validate theme value - only accept 'light' or 'dark'
  var isValidTheme = storedTheme === 'light' || storedTheme === 'dark';
  var storageExists = storedTheme !== null && isValidTheme;

  // Clear invalid theme values from storage
  if (storedTheme !== null && !isValidTheme) {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch (sessionErr) {}
    }
  }

  // Determine the source of truth
  if (storageExists) {
    // source of truth from storage (validated)
    setThemeAttribute(storedTheme);
  } else if (supportsColorSchemeQuery) {
    // source of truth from system preference
    var systemTheme = mql.matches ? 'dark' : 'light';
    setThemeAttribute(systemTheme);
    try {
      localStorage.setItem(storageKey, systemTheme);
    } catch (err) {
      // Fallback to sessionStorage if localStorage is unavailable
      try {
        sessionStorage.setItem(storageKey, systemTheme);
      } catch (sessionErr) {}
    }
  } else {
    // fallback to light mode
    setThemeAttribute('light');
    try {
      localStorage.setItem(storageKey, 'light');
    } catch (err) {
      // Fallback to sessionStorage if localStorage is unavailable
      try {
        sessionStorage.setItem(storageKey, 'light');
      } catch (sessionErr) {}
    }
  }
})();
