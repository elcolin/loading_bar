/**
 * Storage utility module for localStorage operations
 */

export const NOTES_STORAGE_KEY = 'timer_app_notes';
export const LOGS_STORAGE_KEY = 'timer_app_session_logs';
export const LOGS_CONFIG_KEY = 'timer_app_logs_config';
export const TIMER_STATE_KEY = 'timer_app_state';

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to save (will be JSON stringified if not a string)
 */
export function saveToStorage(key, data) {
  try {
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @param {boolean} parseJson - Whether to parse the value as JSON
 * @returns {*} The stored value or default value
 */
export function loadFromStorage(key, defaultValue = null, parseJson = false) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }
    return parseJson ? JSON.parse(value) : value;
  } catch (error) {
    console.error(`Error loading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}
