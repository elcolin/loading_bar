/**
 * Timer module - Core timer logic
 */

import { sendNotification, isNotificationPermissionGranted } from './notifications.js';
import { startNewSession, endSession, incrementCheckpointCount, incrementPauseCount, registerCheckpointSession } from './session-logs.js';
import { TIMER_STATE_KEY, saveToStorage, loadFromStorage, removeFromStorage } from './storage.js';

let interval = null;
let isPaused = false;
let timerStartTime = 0; // Track when the timer actually started
let elapsedBeforePause = 0; // Track elapsed time before pause

// Checkpoint state
let checkpointEnabled = false;
let workTimeElapsed = 0;
let checkpointDurationSeconds = 0;
let checkpointIntervalSeconds = 0;
let isInCheckpoint = false;
let checkpointRemaining = 0;
let checkpointSessionCount = 0; // Track checkpoint number within current timer session
let isWaitingForSessionStart = false; // Track if we're waiting for user to start a new session after checkpoint

// Store timer state for pause/resume
let totalSeconds = 0;
let remaining = 0;
let cumulativeWorkTime = 0; // Track cumulative work time across sessions

/**
 * Save timer state to localStorage
 */
function saveTimerState() {
  if (!interval) {
    // No active timer, clear state
    removeFromStorage(TIMER_STATE_KEY);
    return;
  }

  const state = {
    totalSeconds,
    remaining,
    isPaused,
    timerStartTime,
    elapsedBeforePause,
    checkpointEnabled,
    workTimeElapsed,
    checkpointDurationSeconds,
    checkpointIntervalSeconds,
    isInCheckpoint,
    checkpointRemaining,
    isWaitingForSessionStart,
    cumulativeWorkTime,
    savedAt: Date.now()
  };

  saveToStorage(TIMER_STATE_KEY, state);
}

/**
 * Load timer state from localStorage and restore if valid
 * @returns {boolean} True if state was restored, false otherwise
 */
export function restoreTimerState() {
  const state = loadFromStorage(TIMER_STATE_KEY, null, true);
  
  if (!state) {
    return false;
  }

  // Calculate how much time has elapsed since the state was saved
  const elapsedSinceSave = Math.floor((Date.now() - state.savedAt) / 1000);
  
  // Restore the timer state variables
  totalSeconds = state.totalSeconds;
  isPaused = state.isPaused;
  checkpointEnabled = state.checkpointEnabled;
  workTimeElapsed = state.workTimeElapsed;
  checkpointDurationSeconds = state.checkpointDurationSeconds;
  checkpointIntervalSeconds = state.checkpointIntervalSeconds;
  isInCheckpoint = state.isInCheckpoint;
  checkpointRemaining = state.checkpointRemaining;
  isWaitingForSessionStart = state.isWaitingForSessionStart || false;
  cumulativeWorkTime = state.cumulativeWorkTime || 0;

  // Adjust remaining time based on elapsed time if not paused
  if (!isPaused && !isWaitingForSessionStart) {
    if (isInCheckpoint) {
      checkpointRemaining = Math.max(0, state.checkpointRemaining - elapsedSinceSave);
      remaining = Math.max(0, state.remaining - elapsedSinceSave);
    } else {
      remaining = Math.max(0, state.remaining - elapsedSinceSave);
      workTimeElapsed = state.workTimeElapsed + elapsedSinceSave;
    }
    // For non-paused timers, we need to set up the time tracking as if the timer just started
    // The elapsed time is already accounted for in the adjusted 'remaining' value
    timerStartTime = Date.now();
    elapsedBeforePause = 0;
  } else {
    remaining = state.remaining;
    timerStartTime = 0;
    elapsedBeforePause = state.elapsedBeforePause;
  }

  // If timer has finished, don't restore
  if (remaining <= 0) {
    removeFromStorage(TIMER_STATE_KEY);
    return false;
  }

  // Restore UI state
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("stopBtn").style.display = "inline-block";
  document.getElementById("pauseBtn").style.display = "inline-block";
  
  // Show startSessionBtn if waiting for session start, hide otherwise
  if (isWaitingForSessionStart) {
    document.getElementById("startSessionBtn").style.display = "inline-block";
    document.getElementById("pauseBtn").style.display = "none";
  } else {
    document.getElementById("startSessionBtn").style.display = "none";
  }

  if (isPaused) {
    document.getElementById("pauseBtn").textContent = "Resume";
    document.getElementById("pauseBtn").style.background = "#4caf50";
  } else {
    document.getElementById("pauseBtn").textContent = "Pause";
    document.getElementById("pauseBtn").style.background = "#ff9800";
  }

  // Restore progress bars and labels
  const bar = document.getElementById("bar");
  const totalBar = document.getElementById("totalBar");
  const checkpointLabel = document.getElementById("checkpointLabel");

  if (checkpointEnabled) {
    checkpointLabel.textContent = "Next checkpoint";
  } else {
    checkpointLabel.textContent = "Progress";
  }

  if (isInCheckpoint) {
    bar.classList.add("checkpoint");
  } else {
    bar.classList.remove("checkpoint");
  }

  // Start the timer interval
  startTimerInterval();

  console.log('Timer state restored:', state);
  return true;
}

/**
 * Clear saved timer state
 */
function clearTimerState() {
  removeFromStorage(TIMER_STATE_KEY);
}

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
 * Format seconds to HH:MM:SS or MM:SS
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Toggle pause/resume
 */
export function togglePause() {
  const pauseBtn = document.getElementById("pauseBtn");
  
  if (isPaused) {
    // Resume - restart the timer from this point
    isPaused = false;
    timerStartTime = Date.now();
    pauseBtn.textContent = "Pause";
    pauseBtn.style.background = "#ff9800";
    console.log("Timer resumed");
  } else {
    // Pause - accumulate elapsed time
    isPaused = true;
    elapsedBeforePause += Date.now() - timerStartTime;
    pauseBtn.textContent = "Resume";
    pauseBtn.style.background = "#4caf50";
    incrementPauseCount();
    console.log("Timer paused");
  }
}

/**
 * Start a new session after checkpoint pause
 */
export function startSession() {
  console.log("Start session called. isWaitingForSessionStart:", isWaitingForSessionStart);
  
  if (isWaitingForSessionStart) {
    // Resume the timer after checkpoint break
    isWaitingForSessionStart = false;
    isInCheckpoint = false;
    workTimeElapsed = 0;
    
    const bar = document.getElementById("bar");
    bar.classList.remove("checkpoint");
    bar.style.width = "0%";
    
    // Hide "Start Session" button and show "Pause" button
    document.getElementById("startSessionBtn").style.display = "none";
    document.getElementById("pauseBtn").style.display = "inline-block";
    
    console.log("New session started after checkpoint, resuming work");
    sendNotification("Session started!", "Back to work. Good luck!");
  } else {
    console.log("Not waiting for session start, nothing to do");
  }
}

/**
 * Start the timer interval (extracted for use by both start and restore)
 */
function startTimerInterval() {
  interval = setInterval(() => {
    // Skip timer updates if paused or waiting for session start
    if (isPaused || isWaitingForSessionStart) {
      return;
    }
    
    if (isInCheckpoint) {
      // This code path shouldn't be reached with new behavior, but keeping for compatibility
      // In the new behavior, we don't have checkpoint countdown - we pause immediately
      isInCheckpoint = false;
      workTimeElapsed = 0;
      const bar = document.getElementById("bar");
      bar.classList.remove("checkpoint");
    } else {
      // Work timer
      remaining--;
      workTimeElapsed++;
      cumulativeWorkTime++;

      // Update total progress bar
      const totalProgress = ((totalSeconds - remaining) / totalSeconds) * 100;
      const totalBar = document.getElementById("totalBar");
      totalBar.style.width = totalProgress + "%";

      const bar = document.getElementById("bar");
      const display = document.getElementById("timeDisplay");

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
      const totalDisplay = document.getElementById("totalTimeDisplay");
      totalDisplay.textContent = `Total time remaining: ${formatTime(remaining)} | Total work time: ${formatTime(cumulativeWorkTime)}`;

      // Check if checkpoint should trigger - PAUSE and wait for user to start new session
      if (checkpointEnabled && workTimeElapsed >= checkpointIntervalSeconds) {
        isWaitingForSessionStart = true;
        isInCheckpoint = true;
        bar.classList.add("checkpoint");
        bar.style.width = "100%"; // Show full progress at checkpoint
        
        const durationMin = Math.floor(checkpointDurationSeconds / 60);
        const durationSec = checkpointDurationSeconds % 60;
        const durationText = durationMin > 0 
          ? `${durationMin} minute(s)${durationSec > 0 ? ` and ${durationSec} second(s)` : ''}`
          : `${durationSec} second(s)`;
        
        console.log("Checkpoint reached! Pausing and waiting for user to start new session.");
        incrementCheckpointCount();
        checkpointSessionCount++;
        registerCheckpointSession(checkpointSessionCount, checkpointDurationSeconds);
        
        // Update display to show checkpoint reached
        display.textContent = `Checkpoint reached! Take a ${durationText} break`;
        
        // Hide pause button, show start session button
        document.getElementById("pauseBtn").style.display = "none";
        document.getElementById("startSessionBtn").style.display = "inline-block";
        
        sendNotification("Checkpoint reached!", `Take a break for ${durationText}. Click "Start Session" when ready to continue.`);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        display.textContent = "Done.";
        totalDisplay.textContent = `Total work time: ${formatTime(cumulativeWorkTime)}`;
        bar.style.width = "100%";
        totalBar.style.width = "100%";
        bar.classList.remove("checkpoint");
        endSession(true); // Session completed successfully
        clearTimerState();
        
        // Reset buttons
        document.getElementById("startBtn").style.display = "inline-block";
        document.getElementById("stopBtn").style.display = "none";
        document.getElementById("pauseBtn").style.display = "none";
        document.getElementById("startSessionBtn").style.display = "none";
      }
    }

    // Save state after each tick
    saveTimerState();
  }, 1000);
}

/**
 * Start the timer
 */
export function startTimer() {
  clearInterval(interval);
  isPaused = false;
  
  // Reset timer tracking variables
  timerStartTime = 0;
  elapsedBeforePause = 0;

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

  // Initialize timer tracking
  timerStartTime = Date.now();
  elapsedBeforePause = 0;

  // Hide start button, show stop button
  document.getElementById("startBtn").style.display = "none";
  document.getElementById("stopBtn").style.display = "inline-block";
  
  // Show pause button, hide start session button initially
  document.getElementById("pauseBtn").style.display = "inline-block";
  document.getElementById("pauseBtn").textContent = "Pause";
  document.getElementById("pauseBtn").style.background = "#ff9800";
  document.getElementById("startSessionBtn").style.display = "none";

  const bar = document.getElementById("bar");
  const totalBar = document.getElementById("totalBar");
  const checkpointLabel = document.getElementById("checkpointLabel");

  remaining = totalSeconds;
  workTimeElapsed = 0;
  isInCheckpoint = false;
  isWaitingForSessionStart = false;
  cumulativeWorkTime = 0; // Reset cumulative work time for new timer
  checkpointSessionCount = 0; // Reset checkpoint session count for new timer
  bar.style.width = "0%";
  totalBar.style.width = "0%";
  bar.classList.remove("checkpoint");

  // Update label based on checkpoint configuration
  if (checkpointEnabled) {
    checkpointLabel.textContent = "Next checkpoint";
  } else {
    checkpointLabel.textContent = "Progress";
  }

  startTimerInterval();
}

/**
 * Stop the timer (manually interrupted)
 */
export function stopTimer() {
  if (interval) {
    clearInterval(interval);
    interval = null;
    
    // Calculate actual elapsed time in seconds
    const actualElapsedMs = elapsedBeforePause + (isPaused ? 0 : (Date.now() - timerStartTime));
    const actualElapsedSeconds = Math.floor(actualElapsedMs / 1000);
    
    // End session with actual elapsed time instead of aimed time
    endSession(false, actualElapsedSeconds);
    
    // Clear the saved timer state
    clearTimerState();
    
    // Reset display
    const display = document.getElementById("timeDisplay");
    const totalDisplay = document.getElementById("totalTimeDisplay");
    display.textContent = "Stopped.";
    totalDisplay.textContent = "";
    
    // Reset buttons
    document.getElementById("startBtn").style.display = "inline-block";
    document.getElementById("stopBtn").style.display = "none";
    document.getElementById("pauseBtn").style.display = "none";
    document.getElementById("startSessionBtn").style.display = "none";
    
    // Reset timer tracking variables
    isPaused = false;
    isWaitingForSessionStart = false;
    timerStartTime = 0;
    elapsedBeforePause = 0;
    cumulativeWorkTime = 0;
    
    console.log(`Timer stopped. Elapsed time: ${actualElapsedSeconds}s, Cumulative work time: ${cumulativeWorkTime}s`);
  }
}
