/**
 * Main application initialization
 */

import { initializeNotes } from './notes.js';
import { initializeSessionLogs } from './session-logs.js';
import { requestNotificationPermission, sendTestNotification, isNotificationPermissionGranted } from './notifications.js';
import { startTimer, togglePause, skipPhase } from './timer.js';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeNotes();
  initializeSessionLogs();
  setupEventListeners();
});

/**
 * Setup event listeners for UI controls
 */
function setupEventListeners() {
  // Timer controls
  document.getElementById("startBtn").addEventListener("click", startTimer);
  document.getElementById("pauseBtn").addEventListener("click", togglePause);
  document.getElementById("skipBtn").addEventListener("click", skipPhase);
  
  // Enter key to start timer
  document.getElementById("timeInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      startTimer();
    }
  });

  // Notifications
  document.getElementById("notificationBtn").addEventListener("click", async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      document.getElementById("notificationStatus").style.display = "none";
      document.getElementById("notificationBtn").textContent = "✓ Notifications enabled";
      document.getElementById("notificationBtn").style.background = "#4caf50";
      
      // Send test notification with correct parameters
      const testNotification = new Notification("Notifications enabled", {
        body: "You will receive notifications during checkpoint breaks.",
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>⏱️</text></svg>"
      });
    }
  });
}
