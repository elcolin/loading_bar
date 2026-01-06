/**
 * Session logs module for tracking work sessions
 */

import { LOGS_STORAGE_KEY, LOGS_CONFIG_KEY, saveToStorage, loadFromStorage } from './storage.js';

let sessionLogs = [];
let logsConfig = {
  autoLogEnabled: true,
  logCheckpoints: true,
  logPauses: true
};
let currentSession = null;

/**
 * Initialize the session logs functionality
 */
export function initializeSessionLogs() {
  // Load logs from localStorage
  sessionLogs = loadFromStorage(LOGS_STORAGE_KEY, [], true);

  // Load config from localStorage
  const savedConfig = loadFromStorage(LOGS_CONFIG_KEY, null, true);
  if (savedConfig) {
    logsConfig = savedConfig;
  }

  // Set checkbox states
  document.getElementById('autoLogEnabled').checked = logsConfig.autoLogEnabled;
  document.getElementById('logCheckpoints').checked = logsConfig.logCheckpoints;
  document.getElementById('logPauses').checked = logsConfig.logPauses;

  // Add event listeners for config changes
  document.getElementById('autoLogEnabled').addEventListener('change', (e) => {
    logsConfig.autoLogEnabled = e.target.checked;
    saveLogsConfig();
  });
  document.getElementById('logCheckpoints').addEventListener('change', (e) => {
    logsConfig.logCheckpoints = e.target.checked;
    saveLogsConfig();
  });
  document.getElementById('logPauses').addEventListener('change', (e) => {
    logsConfig.logPauses = e.target.checked;
    saveLogsConfig();
  });

  // Add event listeners for log actions
  document.getElementById('exportLogsBtn').addEventListener('click', exportLogs);
  document.getElementById('clearLogsBtn').addEventListener('click', clearAllLogs);
  document.getElementById('addSessionBtn').addEventListener('click', openAddSessionModal);

  // Modal form event listeners
  document.getElementById('closeModal').addEventListener('click', closeSessionModal);
  document.getElementById('cancelForm').addEventListener('click', closeSessionModal);
  document.getElementById('sessionForm').addEventListener('submit', handleSessionFormSubmit);

  // Render initial logs
  renderLogs();
  
  // Update total work time display
  updateTotalWorkTimeDisplay();
}

/**
 * Save logs configuration
 */
function saveLogsConfig() {
  saveToStorage(LOGS_CONFIG_KEY, logsConfig);
  console.log('Logs config saved:', logsConfig);
}

/**
 * Save logs to storage
 */
function saveLogs() {
  saveToStorage(LOGS_STORAGE_KEY, sessionLogs);
  console.log('Logs saved:', sessionLogs.length, 'entries');
}

/**
 * Add a session log entry
 * @param {Object} session - Session data
 */
function addSessionLog(session) {
  if (!logsConfig.autoLogEnabled) {
    console.log('Auto-logging disabled, session not recorded');
    return;
  }

  sessionLogs.unshift(session); // Add to beginning
  saveLogs();
  renderLogs();
  updateTotalWorkTimeDisplay();
  console.log('Session logged:', session);
}

/**
 * Delete a log entry
 * @param {string} logId - Log ID to delete
 */
function deleteLog(logId) {
  if (confirm('Delete this session from logs?')) {
    const index = sessionLogs.findIndex(log => log.id === logId);
    if (index !== -1) {
      sessionLogs.splice(index, 1);
      saveLogs();
      renderLogs();
      updateTotalWorkTimeDisplay();
    }
  }
}

/**
 * Format duration in seconds to a human-readable string with hours, minutes, seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Calculate total work time for today
 * @returns {number} Total seconds of work today
 */
function calculateTodayWorkTime() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  
  const totalSeconds = sessionLogs.reduce((total, log) => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0); // Start of log date
    
    // Only count sessions from today
    if (logDate.getTime() === today.getTime()) {
      // Only count the actual work duration, not checkpoint breaks
      return total + log.duration;
    }
    return total;
  }, 0);
  
  return totalSeconds;
}

/**
 * Update the total work time display
 */
function updateTotalWorkTimeDisplay() {
  const totalSeconds = calculateTodayWorkTime();
  const display = document.getElementById('totalWorkTimeDisplay');
  if (display) {
    display.textContent = formatDuration(totalSeconds);
  }
}

/**
 * Parse time string to seconds (e.g., "1h30m" or "90m")
 * @param {string} value - Time string
 * @returns {number|null} Total seconds or null if invalid
 */
function parseTimeString(value) {
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
 * Format seconds to time string (e.g., "1h30m")
 * @param {number} seconds - Seconds
 * @returns {string} Time string
 */
function formatTimeString(seconds) {
  if (!seconds) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let result = '';
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += `${minutes}m`;
  if (secs > 0) result += `${secs}s`;
  
  return result || '0s';
}

let editingSessionId = null;

/**
 * Open the add session modal
 */
function openAddSessionModal() {
  editingSessionId = null;
  document.getElementById('modalTitle').textContent = 'Add Manual Session';
  
  // Set default values
  const now = new Date();
  document.getElementById('sessionDate').value = now.toISOString().split('T')[0];
  document.getElementById('sessionTime').value = now.toTimeString().slice(0, 5);
  document.getElementById('sessionDuration').value = '';
  document.getElementById('sessionCheckpointDuration').value = '';
  document.getElementById('sessionCheckpointInterval').value = '';
  document.getElementById('sessionCheckpointsCount').value = '0';
  document.getElementById('sessionPausesCount').value = '0';
  document.getElementById('sessionCompleted').checked = true;
  
  document.getElementById('sessionFormModal').style.display = 'flex';
}

/**
 * Open the edit session modal
 * @param {string} sessionId - Session ID to edit
 */
function openEditSessionModal(sessionId) {
  const session = sessionLogs.find(log => log.id === sessionId);
  if (!session) return;
  
  editingSessionId = sessionId;
  document.getElementById('modalTitle').textContent = 'Edit Session';
  
  // Parse timestamp
  const date = new Date(session.timestamp);
  document.getElementById('sessionDate').value = date.toISOString().split('T')[0];
  document.getElementById('sessionTime').value = date.toTimeString().slice(0, 5);
  document.getElementById('sessionDuration').value = formatTimeString(session.duration);
  document.getElementById('sessionCheckpointDuration').value = formatTimeString(session.checkpointDuration);
  document.getElementById('sessionCheckpointInterval').value = formatTimeString(session.checkpointInterval);
  document.getElementById('sessionCheckpointsCount').value = session.checkpointsCount || 0;
  document.getElementById('sessionPausesCount').value = session.pausesCount || 0;
  document.getElementById('sessionCompleted').checked = session.completed;
  
  document.getElementById('sessionFormModal').style.display = 'flex';
}

/**
 * Close the session modal
 */
function closeSessionModal() {
  document.getElementById('sessionFormModal').style.display = 'none';
  editingSessionId = null;
}

/**
 * Handle session form submission
 * @param {Event} event - Submit event
 */
function handleSessionFormSubmit(event) {
  event.preventDefault();
  
  // Get form values
  const dateValue = document.getElementById('sessionDate').value;
  const timeValue = document.getElementById('sessionTime').value;
  const durationStr = document.getElementById('sessionDuration').value.trim();
  const checkpointDurationStr = document.getElementById('sessionCheckpointDuration').value.trim();
  const checkpointIntervalStr = document.getElementById('sessionCheckpointInterval').value.trim();
  const checkpointsCountValue = document.getElementById('sessionCheckpointsCount').value;
  const pausesCountValue = document.getElementById('sessionPausesCount').value;
  const completed = document.getElementById('sessionCompleted').checked;
  
  // Validate date and time
  if (!dateValue || !timeValue) {
    alert('Please provide both date and time.');
    return;
  }
  
  // Create timestamp from date and time and validate
  const timestamp = new Date(`${dateValue}T${timeValue}`);
  if (isNaN(timestamp.getTime())) {
    alert('Invalid date or time. Please check your inputs.');
    return;
  }
  
  // Validate duration
  const duration = parseTimeString(durationStr);
  if (!duration) {
    alert('Invalid duration format. Use e.g., 1h30m or 90m.');
    return;
  }
  
  // Parse checkpoint values (optional)
  const checkpointDuration = checkpointDurationStr ? parseTimeString(checkpointDurationStr) : 0;
  const checkpointInterval = checkpointIntervalStr ? parseTimeString(checkpointIntervalStr) : 0;
  
  // Validate checkpoint configuration consistency
  if ((checkpointDuration > 0 && checkpointInterval === 0) || (checkpointDuration === 0 && checkpointInterval > 0)) {
    if (!confirm('Warning: Checkpoint configuration is incomplete. Both break duration and interval should be provided for checkpoints to work. Continue anyway?')) {
      return;
    }
  }
  
  // Validate and parse count values
  const checkpointsCount = checkpointsCountValue ? parseInt(checkpointsCountValue, 10) : 0;
  const pausesCount = pausesCountValue ? parseInt(pausesCountValue, 10) : 0;
  
  if (isNaN(checkpointsCount) || checkpointsCount < 0) {
    alert('Invalid number of checkpoints. Must be a non-negative number.');
    return;
  }
  
  if (isNaN(pausesCount) || pausesCount < 0) {
    alert('Invalid number of manual pauses. Must be a non-negative number.');
    return;
  }
  
  if (editingSessionId) {
    // Edit existing session
    const sessionIndex = sessionLogs.findIndex(log => log.id === editingSessionId);
    if (sessionIndex !== -1) {
      sessionLogs[sessionIndex] = {
        ...sessionLogs[sessionIndex],
        timestamp: timestamp.toISOString(),
        duration,
        checkpointDuration,
        checkpointInterval,
        checkpointsCount,
        pausesCount,
        completed
      };
      saveLogs();
      renderLogs();
      updateTotalWorkTimeDisplay();
      console.log('Session updated:', sessionLogs[sessionIndex]);
    }
  } else {
    // Add new session
    const newSession = {
      id: generateSessionId(),
      timestamp: timestamp.toISOString(),
      duration,
      checkpointDuration,
      checkpointInterval,
      checkpointsCount,
      pausesCount,
      completed
    };
    sessionLogs.unshift(newSession);
    saveLogs();
    renderLogs();
    updateTotalWorkTimeDisplay();
    console.log('New session added:', newSession);
  }
  
  closeSessionModal();
}

/**
 * Render logs to the UI
 */
function renderLogs() {
  const container = document.getElementById('logsContainer');
  
  if (sessionLogs.length === 0) {
    container.innerHTML = '<div class="logs-empty">No sessions recorded</div>';
    return;
  }

  // Clear container
  container.innerHTML = '';
  
  sessionLogs.forEach((log) => {
    const date = new Date(log.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const durationStr = formatDuration(log.duration);

    const hasCheckpoints = log.checkpointsCount > 0;
    const checkpointClass = hasCheckpoints ? 'with-checkpoint' : '';

    // Create log entry element
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${checkpointClass}`;
    
    // Create date header
    const logDate = document.createElement('div');
    logDate.className = 'log-date';
    logDate.textContent = `${dateStr} - ${timeStr}`;
    logEntry.appendChild(logDate);
    
    // Create duration detail
    const durationDetail = document.createElement('div');
    durationDetail.className = 'log-detail';
    durationDetail.textContent = `⏱️ Duration: ${durationStr}`;
    logEntry.appendChild(durationDetail);
    
    if (hasCheckpoints && logsConfig.logCheckpoints) {
      const checkpointDetail = document.createElement('div');
      checkpointDetail.className = 'log-detail';
      checkpointDetail.textContent = `☕ Checkpoints: ${log.checkpointsCount}`;
      logEntry.appendChild(checkpointDetail);
      
      if (log.checkpointDuration) {
        const cpDur = formatDuration(log.checkpointDuration);
        const cpDurationDetail = document.createElement('div');
        cpDurationDetail.className = 'log-detail';
        cpDurationDetail.textContent = `⏸️ Break duration: ${cpDur}`;
        logEntry.appendChild(cpDurationDetail);
      }
      
      if (log.checkpointInterval) {
        const ciDur = formatDuration(log.checkpointInterval);
        const ciDetail = document.createElement('div');
        ciDetail.className = 'log-detail';
        ciDetail.textContent = `🔄 Interval: ${ciDur}`;
        logEntry.appendChild(ciDetail);
      }
      
      // Add checkpoint sessions dropdown if available
      if (log.checkpointSessions && log.checkpointSessions.length > 0) {
        const checkpointSessionsToggle = document.createElement('div');
        checkpointSessionsToggle.className = 'checkpoint-sessions-toggle';
        checkpointSessionsToggle.textContent = `▼ View checkpoint sessions (${log.checkpointSessions.length})`;
        checkpointSessionsToggle.style.cursor = 'pointer';
        checkpointSessionsToggle.style.color = '#2196f3';
        checkpointSessionsToggle.style.fontSize = '11px';
        checkpointSessionsToggle.style.marginTop = '5px';
        
        const checkpointSessionsList = document.createElement('div');
        checkpointSessionsList.className = 'checkpoint-sessions-list';
        checkpointSessionsList.style.display = 'none';
        checkpointSessionsList.style.marginTop = '8px';
        checkpointSessionsList.style.marginLeft = '10px';
        checkpointSessionsList.style.paddingLeft = '10px';
        checkpointSessionsList.style.borderLeft = '2px solid #ff9800';
        
        log.checkpointSessions.forEach((cpSession) => {
          const cpSessionItem = document.createElement('div');
          cpSessionItem.className = 'checkpoint-session-item';
          cpSessionItem.style.fontSize = '10px';
          cpSessionItem.style.color = '#999';
          cpSessionItem.style.marginBottom = '3px';
          
          const cpDate = new Date(cpSession.timestamp);
          const cpTimeStr = cpDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          });
          const cpDurationStr = formatDuration(cpSession.duration);
          
          cpSessionItem.textContent = `☕ Checkpoint #${cpSession.checkpointNumber} at ${cpTimeStr} - ${cpDurationStr}`;
          checkpointSessionsList.appendChild(cpSessionItem);
        });
        
        checkpointSessionsToggle.addEventListener('click', () => {
          const isVisible = checkpointSessionsList.style.display === 'block';
          if (isVisible) {
            checkpointSessionsList.style.display = 'none';
            checkpointSessionsToggle.textContent = `▼ View checkpoint sessions (${log.checkpointSessions.length})`;
          } else {
            checkpointSessionsList.style.display = 'block';
            checkpointSessionsToggle.textContent = `▲ Hide checkpoint sessions (${log.checkpointSessions.length})`;
          }
        });
        
        logEntry.appendChild(checkpointSessionsToggle);
        logEntry.appendChild(checkpointSessionsList);
      }
    }

    if (log.pausesCount > 0 && logsConfig.logPauses) {
      const pausesDetail = document.createElement('div');
      pausesDetail.className = 'log-detail';
      pausesDetail.textContent = `⏸️ Manual pauses: ${log.pausesCount}`;
      logEntry.appendChild(pausesDetail);
    }

    const statusDetail = document.createElement('div');
    statusDetail.className = 'log-detail';
    statusDetail.textContent = log.completed ? '✅ Session completed' : '⚠️ Session interrupted';
    logEntry.appendChild(statusDetail);
    
    // Create edit button
    const editBtn = document.createElement('div');
    editBtn.className = 'log-edit';
    editBtn.textContent = '✏️ Edit';
    editBtn.addEventListener('click', () => openEditSessionModal(log.id));
    logEntry.appendChild(editBtn);
    
    // Create delete button
    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'log-delete';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.addEventListener('click', () => deleteLog(log.id));
    logEntry.appendChild(deleteBtn);
    
    container.appendChild(logEntry);
  });
}

/**
 * Export logs to CSV
 */
function exportLogs() {
  if (sessionLogs.length === 0) {
    alert('No logs to export.');
    return;
  }

  // Export as CSV for data analysis
  const csvHeader = 'Date,Time,Duration (s),Checkpoints,Break duration (s),Interval (s),Manual pauses,Completed\n';
  const csvRows = sessionLogs.map(log => {
    const date = new Date(log.timestamp);
    const dateStr = date.toLocaleDateString('en-US');
    const timeStr = date.toLocaleTimeString('en-US');
    
    // Helper function to escape CSV values
    const escapeCsv = (value) => {
      const strValue = String(value);
      // If value contains comma, quote, or newline, wrap in quotes and escape quotes
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
        return '"' + strValue.replace(/"/g, '""') + '"';
      }
      return strValue;
    };
    
    return [
      escapeCsv(dateStr),
      escapeCsv(timeStr),
      log.duration,
      log.checkpointsCount || 0,
      log.checkpointDuration || 0,
      log.checkpointInterval || 0,
      log.pausesCount || 0,
      log.completed ? 'Yes' : 'No'
    ].join(',');
  }).join('\n');

  const csv = csvHeader + csvRows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `session_logs_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Logs exported successfully');
}

/**
 * Clear all logs
 */
function clearAllLogs() {
  if (confirm('Are you sure you want to delete all logs? This action is irreversible.')) {
    sessionLogs = [];
    saveLogs();
    renderLogs();
    updateTotalWorkTimeDisplay();
    console.log('All logs cleared');
  }
}

/**
 * Generate a unique session ID
 * @returns {string} Unique ID
 */
function generateSessionId() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback to timestamp + random string with increased entropy
  return Date.now() + '_' + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
}

/**
 * Start a new session
 * @param {number} totalSeconds - Total duration in seconds
 * @param {number} checkpointDuration - Checkpoint duration in seconds
 * @param {number} checkpointInterval - Checkpoint interval in seconds
 */
export function startNewSession(totalSeconds, checkpointDuration, checkpointInterval) {
  currentSession = {
    id: generateSessionId(),
    timestamp: new Date().toISOString(),
    duration: totalSeconds,
    checkpointsCount: 0,
    checkpointDuration: checkpointDuration,
    checkpointInterval: checkpointInterval,
    pausesCount: 0,
    completed: false,
    startTime: Date.now(),
    checkpointSessions: [] // Array to store individual checkpoint sessions
  };
  console.log('New session started:', currentSession);
}

/**
 * End the current session
 * @param {boolean} completed - Whether the session was completed
 * @param {number} actualElapsedSeconds - Actual elapsed time (optional, for stopped sessions)
 */
export function endSession(completed = true, actualElapsedSeconds = null) {
  if (currentSession) {
    currentSession.completed = completed;
    // If actualElapsedSeconds is provided (stopped session), use it instead of the aimed duration
    if (actualElapsedSeconds !== null) {
      currentSession.duration = actualElapsedSeconds;
    }
    addSessionLog(currentSession);
    currentSession = null;
  }
}

/**
 * Increment checkpoint count for current session
 */
export function incrementCheckpointCount() {
  if (currentSession && logsConfig.logCheckpoints) {
    currentSession.checkpointsCount++;
    console.log('Checkpoint count incremented:', currentSession.checkpointsCount);
  }
}

/**
 * Register a checkpoint session when a checkpoint break starts
 * @param {number} checkpointNumber - The checkpoint number (1-indexed)
 * @param {number} duration - Duration of the checkpoint break in seconds
 */
export function registerCheckpointSession(checkpointNumber, duration) {
  if (currentSession && logsConfig.logCheckpoints) {
    const checkpointSession = {
      checkpointNumber,
      timestamp: new Date().toISOString(),
      duration,
      type: 'checkpoint_break'
    };
    
    if (!currentSession.checkpointSessions) {
      currentSession.checkpointSessions = [];
    }
    
    currentSession.checkpointSessions.push(checkpointSession);
    console.log('Checkpoint session registered:', checkpointSession);
  }
}

/**
 * Increment pause count for current session
 */
export function incrementPauseCount() {
  if (currentSession && logsConfig.logPauses) {
    currentSession.pausesCount++;
    console.log('Pause count incremented:', currentSession.pausesCount);
  }
}
