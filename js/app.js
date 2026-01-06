/**
 * Main application initialization
 */

import { initializeNotes } from './notes.js';
import { initializeSessionLogs } from './session-logs.js';
import { requestNotificationPermission, sendTestNotification } from './notifications.js';
import { startTimer, togglePause, skipPhase, stopTimer } from './timer.js';

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
  document.getElementById("stopBtn").addEventListener("click", stopTimer);
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
      sendTestNotification();
    }
  });
}
