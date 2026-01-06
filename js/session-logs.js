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

  // Render initial logs
  renderLogs();
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
    }
  }
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
    
    const durationMin = Math.floor(log.duration / 60);
    const durationSec = log.duration % 60;
    const durationStr = durationMin > 0 
      ? `${durationMin}m ${durationSec}s` 
      : `${durationSec}s`;

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
        const cpMin = Math.floor(log.checkpointDuration / 60);
        const cpSec = log.checkpointDuration % 60;
        const cpDur = cpMin > 0 ? `${cpMin}m ${cpSec}s` : `${cpSec}s`;
        const cpDurationDetail = document.createElement('div');
        cpDurationDetail.className = 'log-detail';
        cpDurationDetail.textContent = `⏸️ Break duration: ${cpDur}`;
        logEntry.appendChild(cpDurationDetail);
      }
      
      if (log.checkpointInterval) {
        const ciMin = Math.floor(log.checkpointInterval / 60);
        const ciSec = log.checkpointInterval % 60;
        const ciDur = ciMin > 0 ? `${ciMin}m ${ciSec}s` : `${ciSec}s`;
        const ciDetail = document.createElement('div');
        ciDetail.className = 'log-detail';
        ciDetail.textContent = `🔄 Interval: ${ciDur}`;
        logEntry.appendChild(ciDetail);
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
    console.log('All logs cleared');
  }
}

/**
 * Start a new session
 * @param {number} totalSeconds - Total duration in seconds
 * @param {number} checkpointDuration - Checkpoint duration in seconds
 * @param {number} checkpointInterval - Checkpoint interval in seconds
 */
export function startNewSession(totalSeconds, checkpointDuration, checkpointInterval) {
  currentSession = {
    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9), // Unique ID
    timestamp: new Date().toISOString(),
    duration: totalSeconds,
    checkpointsCount: 0,
    checkpointDuration: checkpointDuration,
    checkpointInterval: checkpointInterval,
    pausesCount: 0,
    completed: false,
    startTime: Date.now()
  };
  console.log('New session started:', currentSession);
}

/**
 * End the current session
 * @param {boolean} completed - Whether the session was completed
 */
export function endSession(completed = true) {
  if (currentSession) {
    currentSession.completed = completed;
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
 * Increment pause count for current session
 */
export function incrementPauseCount() {
  if (currentSession && logsConfig.logPauses) {
    currentSession.pausesCount++;
    console.log('Pause count incremented:', currentSession.pausesCount);
  }
}
