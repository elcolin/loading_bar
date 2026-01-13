/**
 * Multi-window synchronization module
 * Keeps timer state and settings in sync across multiple browser windows/tabs
 */

import { TIMER_STATE_KEY, LOGS_CONFIG_KEY } from './storage.js';
import { restoreTimerState } from './timer.js';

/**
 * Initialize multi-window synchronization
 */
export function initializeSync() {
  // Listen for localStorage changes from other windows
  window.addEventListener('storage', handleStorageChange);
  console.log('Multi-window synchronization initialized');
}

/**
 * Handle storage changes from other windows
 * @param {StorageEvent} event - Storage event
 */
function handleStorageChange(event) {
  // Ignore changes from the same window
  if (!event.url || event.url === window.location.href) {
    return;
  }

  console.log('Storage changed in another window:', event.key);

  // Handle timer state changes
  if (event.key === TIMER_STATE_KEY) {
    console.log('Timer state changed in another window, restoring...');
    restoreTimerState();
  }

  // Handle logs config changes
  if (event.key === LOGS_CONFIG_KEY) {
    console.log('Logs config changed in another window, reloading...');
    reloadLogsConfig();
  }
}

/**
 * Reload logs configuration from localStorage and update UI
 */
function reloadLogsConfig() {
  try {
    const savedConfig = localStorage.getItem(LOGS_CONFIG_KEY);
    if (savedConfig) {
      const logsConfig = JSON.parse(savedConfig);
      
      // Update checkbox states
      const autoLogCheckbox = document.getElementById('autoLogEnabled');
      const logCheckpointsCheckbox = document.getElementById('logCheckpoints');
      const logPausesCheckbox = document.getElementById('logPauses');
      
      if (autoLogCheckbox && logsConfig.autoLogEnabled !== undefined) {
        autoLogCheckbox.checked = logsConfig.autoLogEnabled;
      }
      if (logCheckpointsCheckbox && logsConfig.logCheckpoints !== undefined) {
        logCheckpointsCheckbox.checked = logsConfig.logCheckpoints;
      }
      if (logPausesCheckbox && logsConfig.logPauses !== undefined) {
        logPausesCheckbox.checked = logsConfig.logPauses;
      }
      
      console.log('Logs config reloaded from another window');
    }
  } catch (error) {
    console.error('Error reloading logs config:', error);
  }
}
