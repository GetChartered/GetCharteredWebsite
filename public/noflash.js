(function () {
  var storageKey = 'theme';
  var dataAttribute = 'data-theme';

  function setThemeAttribute(theme) {
    document.documentElement.setAttribute(dataAttribute, theme);
  }

  var preferDarkQuery = '(prefers-color-scheme: dark)';
  var mql = window.matchMedia(preferDarkQuery);
  var supportsColorSchemeQuery = mql.media === preferDarkQuery;
  var localStorageTheme = null;

  try {
    localStorageTheme = localStorage.getItem(storageKey);
  } catch (err) {}

  var localStorageExists = localStorageTheme !== null;

  // Determine the source of truth
  if (localStorageExists) {
    // source of truth from localStorage
    setThemeAttribute(localStorageTheme);
  } else if (supportsColorSchemeQuery) {
    // source of truth from system preference
    var systemTheme = mql.matches ? 'dark' : 'light';
    setThemeAttribute(systemTheme);
    localStorage.setItem(storageKey, systemTheme);
  } else {
    // fallback to light mode
    setThemeAttribute('light');
    localStorage.setItem(storageKey, 'light');
  }
})();
