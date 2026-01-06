/**
 * Timer module - Core timer logic
 */

import { sendNotification, isNotificationPermissionGranted } from './notifications.js';
import { startNewSession, endSession, incrementCheckpointCount, incrementPauseCount } from './session-logs.js';

let interval = null;
let isPaused = false;

// Checkpoint state
let checkpointEnabled = false;
let workTimeElapsed = 0;
let checkpointDurationSeconds = 0;
let checkpointIntervalSeconds = 0;
let isInCheckpoint = false;
let checkpointRemaining = 0;

// Store timer state for pause/resume
let totalSeconds = 0;
let remaining = 0;

/**
 * Parse time string to seconds
 * @param {string} value - Time string (e.g., "1h30m0s")
 * @returns {number|null} Total seconds or null if invalid
 */
export function parseTime(value) {
  const regex = /(\d+)\s*(h|m|s)/gi;
  let totalSeconds = 0;
  let match;

  while ((match = regex.exec(value)) !== null) {
    const amount = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    if (unit === "h") totalSeconds += amount * 3600;
    if (unit === "m") totalSeconds += amount * 60;
    if (unit === "s") totalSeconds += amount;
  }

  return totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Toggle pause/resume
 */
export function togglePause() {
  const pauseBtn = document.getElementById("pauseBtn");
  
  if (isPaused) {
    // Resume
    isPaused = false;
    pauseBtn.textContent = "Pause";
    pauseBtn.style.background = "#ff9800";
    console.log("Timer resumed");
  } else {
    // Pause
    isPaused = true;
    pauseBtn.textContent = "Resume";
    pauseBtn.style.background = "#4caf50";
    incrementPauseCount();
    console.log("Timer paused");
  }
}

/**
 * Skip current phase (work or checkpoint)
 */
export function skipPhase() {
  console.log("Skip phase called. isInCheckpoint:", isInCheckpoint);
  
  if (isInCheckpoint) {
    // Skip checkpoint - go back to work
    isInCheckpoint = false;
    workTimeElapsed = 0;
    checkpointRemaining = 0;
    const bar = document.getElementById("bar");
    bar.classList.remove("checkpoint");
    console.log("Checkpoint skipped, resuming work");
  } else {
    // Skip work phase - trigger checkpoint if enabled, or do nothing
    if (checkpointEnabled) {
      isInCheckpoint = true;
      checkpointRemaining = checkpointDurationSeconds;
      const bar = document.getElementById("bar");
      bar.classList.add("checkpoint");
      bar.style.width = "0%";
      const durationMin = Math.floor(checkpointDurationSeconds / 60);
      const durationSec = checkpointDurationSeconds % 60;
      const durationText = durationMin > 0 
        ? `${durationMin} minute(s)${durationSec > 0 ? ` and ${durationSec} second(s)` : ''}`
        : `${durationSec} second(s)`;
      console.log("Work phase skipped, starting checkpoint");
      incrementCheckpointCount();
      sendNotification("Checkpoint break!", `Take a break for ${durationText}.`);
    } else {
      console.log("No checkpoint configured, cannot skip work phase");
    }
  }
}

/**
 * Start the timer
 */
export function startTimer() {
  clearInterval(interval);
  isPaused = false;

  const input = document.getElementById("timeInput").value.trim();
  totalSeconds = parseTime(input);
  if (!totalSeconds) {
    alert("Invalid format. Use e.g., 5m, 1h, or 30s.");
    return;
  }

  // End previous session if one was active
  endSession(false); // Mark as interrupted

  // Parse checkpoint configuration
  const checkpointDurationInput = document.getElementById("checkpointDuration").value.trim();
  const checkpointIntervalInput = document.getElementById("checkpointInterval").value.trim();

  if (checkpointDurationInput && checkpointIntervalInput) {
    checkpointDurationSeconds = parseTime(checkpointDurationInput);
    checkpointIntervalSeconds = parseTime(checkpointIntervalInput);

    if (checkpointDurationSeconds && checkpointIntervalSeconds) {
      checkpointEnabled = true;
      
      // Warn if notifications are not enabled
      if (!isNotificationPermissionGranted()) {
        document.getElementById("notificationStatus").style.display = "block";
        alert("⚠️ Tip: Click 'Enable notifications' to receive alerts during checkpoint breaks!");
      }
    } else {
      alert("Invalid checkpoint format. Disabling checkpoints.");
      checkpointEnabled = false;
    }
  } else {
    checkpointEnabled = false;
  }

  // Start new session for logging
  startNewSession(totalSeconds, checkpointDurationSeconds, checkpointIntervalSeconds);

  // Show pause and skip buttons
  document.getElementById("pauseBtn").style.display = "inline-block";
  document.getElementById("pauseBtn").textContent = "Pause";
  document.getElementById("pauseBtn").style.background = "#ff9800";
  document.getElementById("skipBtn").style.display = "inline-block";

  const bar = document.getElementById("bar");
  const totalBar = document.getElementById("totalBar");
  const display = document.getElementById("timeDisplay");
  const totalDisplay = document.getElementById("totalTimeDisplay");
  const checkpointLabel = document.getElementById("checkpointLabel");

  remaining = totalSeconds;
  workTimeElapsed = 0;
  isInCheckpoint = false;
  bar.style.width = "0%";
  totalBar.style.width = "0%";
  bar.classList.remove("checkpoint");

  // Update label based on checkpoint configuration
  if (checkpointEnabled) {
    checkpointLabel.textContent = "Next checkpoint";
  } else {
    checkpointLabel.textContent = "Progress";
  }

  interval = setInterval(() => {
    // Skip timer updates if paused
    if (isPaused) {
      return;
    }
    
    if (isInCheckpoint) {
      // Checkpoint timer
      checkpointRemaining--;
      const progress = ((checkpointDurationSeconds - checkpointRemaining) / checkpointDurationSeconds) * 100;
      bar.style.width = progress + "%";

      // Update total progress bar
      const totalProgress = ((totalSeconds - remaining) / totalSeconds) * 100;
      totalBar.style.width = totalProgress + "%";

      display.textContent = `Checkpoint break: ${formatTime(checkpointRemaining)}`;

      // Show total remaining time
      totalDisplay.textContent = `Total time remaining: ${formatTime(remaining)}`;

      if (checkpointRemaining <= 0) {
        // End checkpoint, resume work
        isInCheckpoint = false;
        workTimeElapsed = 0;
        bar.classList.remove("checkpoint");
        sendNotification("Break over!", "Back to work. Good luck!");
        console.log("Checkpoint ended, resuming work");
      }
    } else {
      // Work timer
      remaining--;
      workTimeElapsed++;

      // Update total progress bar
      const totalProgress = ((totalSeconds - remaining) / totalSeconds) * 100;
      totalBar.style.width = totalProgress + "%";

      // Display time until next checkpoint (or total time if no checkpoint)
      if (checkpointEnabled) {
        // Time until next checkpoint
        const timeUntilCheckpoint = Math.max(0, checkpointIntervalSeconds - workTimeElapsed);
        const checkpointProgress = ((workTimeElapsed) / checkpointIntervalSeconds) * 100;
        bar.style.width = checkpointProgress + "%";
        display.textContent = `Next checkpoint in: ${formatTime(timeUntilCheckpoint)}`;
      } else {
        // No checkpoint, show total remaining time
        const progress = ((totalSeconds - remaining) / totalSeconds) * 100;
        bar.style.width = progress + "%";
        display.textContent = `Time remaining: ${formatTime(remaining)}`;
      }

      // Always show total remaining time in secondary display
      totalDisplay.textContent = `Total time remaining: ${formatTime(remaining)}`;

      // Check if checkpoint should trigger
      if (checkpointEnabled && workTimeElapsed >= checkpointIntervalSeconds) {
        isInCheckpoint = true;
        checkpointRemaining = checkpointDurationSeconds;
        bar.classList.add("checkpoint");
        bar.style.width = "0%";
        const durationMin = Math.floor(checkpointDurationSeconds / 60);
        const durationSec = checkpointDurationSeconds % 60;
        const durationText = durationMin > 0 
          ? `${durationMin} minute(s)${durationSec > 0 ? ` and ${durationSec} second(s)` : ''}`
          : `${durationSec} second(s)`;
        console.log("Checkpoint triggered! Notification sent.");
        incrementCheckpointCount();
        sendNotification("Checkpoint break!", `Take a break for ${durationText}.`);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        display.textContent = "Done.";
        totalDisplay.textContent = "";
        bar.style.width = "100%";
        totalBar.style.width = "100%";
        bar.classList.remove("checkpoint");
        endSession(true); // Session completed successfully
      }
    }
  }, 1000);
}
