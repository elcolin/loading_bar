/**
 * Session logs module for tracking work sessions
 */

import { LOGS_STORAGE_KEY, LOGS_CONFIG_KEY, saveToStorage, loadFromStorage } from './storage.js';
import { refreshStatistics } from './statistics.js';

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
  document.getElementById('importLogsBtn').addEventListener('click', importLogs);
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
  refreshStatistics();
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
      refreshStatistics();
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
      refreshStatistics();
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
    refreshStatistics();
    console.log('New session added:', newSession);
  }
  
  closeSessionModal();
}

/**
 * Render a single log entry
 * @param {Object} log - Log data
 * @param {HTMLElement} container - Container to append to
 * @param {boolean} isInProgress - Whether this is the current in-progress session
 */
function renderLogEntry(log, container, isInProgress = false) {
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
  const inProgressClass = isInProgress ? 'in-progress' : '';

  // Create log entry element
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${checkpointClass} ${inProgressClass}`;
  
  // Create date header
  const logDate = document.createElement('div');
  logDate.className = 'log-date';
  logDate.textContent = isInProgress 
    ? `🔴 IN PROGRESS - ${dateStr} - ${timeStr}` 
    : `${dateStr} - ${timeStr}`;
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
        const cpTimeStr = cpDate.toLocaleTimeString(undefined, { 
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

  // Only show status and action buttons for completed sessions
  if (!isInProgress) {
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
  } else {
    const statusDetail = document.createElement('div');
    statusDetail.className = 'log-detail';
    statusDetail.style.color = '#ff9800';
    statusDetail.textContent = '🔄 Session in progress...';
    logEntry.appendChild(statusDetail);
  }
  
  container.appendChild(logEntry);
}

/**
 * Render logs to the UI
 */
function renderLogs() {
  const container = document.getElementById('logsContainer');
  
  // Check if there's a current session and no saved logs
  if (sessionLogs.length === 0 && !currentSession) {
    container.innerHTML = '<div class="logs-empty">No sessions recorded</div>';
    return;
  }

  // Clear container
  container.innerHTML = '';
  
  // Show current in-progress session first if it exists
  if (currentSession && logsConfig.autoLogEnabled) {
    renderLogEntry(currentSession, container, true);
  }
  
  sessionLogs.forEach((log) => {
    renderLogEntry(log, container, false);
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
 * Import logs from CSV file
 */
function importLogs() {
  // Create a hidden file input element
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.csv';
  fileInput.multiple = true; // Allow multiple file selection
  
  fileInput.addEventListener('change', async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    let totalImported = 0;
    let totalSkipped = 0;
    let errorCount = 0;
    
    for (const file of files) {
      try {
        const result = await importCSVFile(file);
        totalImported += result.imported;
        totalSkipped += result.skipped;
      } catch (error) {
        console.error(`Error importing file ${file.name}:`, error);
        errorCount++;
      }
    }
    
    // Show summary message
    let message = `Import complete!\n`;
    if (totalImported > 0) message += `- ${totalImported} session(s) imported\n`;
    if (totalSkipped > 0) message += `- ${totalSkipped} duplicate(s) skipped\n`;
    if (errorCount > 0) message += `- ${errorCount} file(s) had errors`;
    
    alert(message);
    
    // Update UI
    saveLogs();
    renderLogs();
    updateTotalWorkTimeDisplay();
    refreshStatistics();
  });
  
  // Trigger file selection
  fileInput.click();
}

/**
 * Import a single CSV file
 * @param {File} file - CSV file to import
 * @returns {Promise<Object>} Import results
 */
async function importCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const result = parseCSVAndImport(csvText);
        console.log(`Imported ${file.name}: ${result.imported} sessions, ${result.skipped} duplicates`);
        resolve(result);
      } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Parse CSV text and import sessions
 * @param {string} csvText - CSV content
 * @returns {Object} Import results with counts
 */
function parseCSVAndImport(csvText) {
  // Split on any line ending type (\r\n, \n, or \r)
  const lines = csvText.trim().split(/\r?\n|\r/);
  
  // Check if there's at least a header and one data row
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data');
  }
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  // Create a Set of existing timestamps for efficient duplicate checking
  // Using second-precision (not millisecond) to handle minor timing variations
  // during export/import cycles while still catching true duplicates
  const existingTimestamps = new Set(
    sessionLogs.map(log => Math.floor(new Date(log.timestamp).getTime() / 1000))
  );
  
  let imported = 0;
  let skipped = 0;
  
  for (const line of dataLines) {
    if (!line.trim()) continue; // Skip empty lines
    
    try {
      const session = parseCSVLine(line);
      
      // Check for duplicates using the timestamp Set (within 1 second)
      const sessionTimestamp = Math.floor(new Date(session.timestamp).getTime() / 1000);
      const isDuplicate = existingTimestamps.has(sessionTimestamp);
      
      if (isDuplicate) {
        skipped++;
        console.log('Skipping duplicate session:', session.timestamp);
      } else {
        sessionLogs.push(session);
        existingTimestamps.add(sessionTimestamp); // Add to Set to catch duplicates within this import
        imported++;
      }
    } catch (error) {
      console.error('Error parsing CSV line:', line, error);
      // Continue with next line instead of failing completely
    }
  }
  
  // Sort logs by timestamp (newest first)
  sessionLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return { imported, skipped };
}

/**
 * Parse a single CSV line into a session object
 * @param {string} line - CSV line
 * @returns {Object} Session object
 */
function parseCSVLine(line) {
  // Parse CSV with proper handling of quoted values
  const values = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if it's an escaped quote
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue.trim());
  
  // Expected format: Date,Time,Duration (s),Checkpoints,Break duration (s),Interval (s),Manual pauses,Completed
  if (values.length < 8) {
    throw new Error('Invalid CSV format: insufficient columns');
  }
  
  const [dateStr, timeStr, durationStr, checkpointsStr, breakDurationStr, intervalStr, pausesStr, completedStr] = values;
  
  // Parse date and time - handle MM/DD/YYYY format explicitly
  // The export function uses toLocaleDateString('en-US') which creates MM/DD/YYYY
  let dateObj;
  
  // Try parsing MM/DD/YYYY HH:MM:SS format first (exported format)
  const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
  
  if (dateMatch && timeMatch) {
    // Parse as MM/DD/YYYY HH:MM:SS
    const month = parseInt(dateMatch[1], 10) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = parseInt(timeMatch[3], 10);
    
    dateObj = new Date(year, month, day, hours, minutes, seconds);
  } else {
    // Fallback to generic parsing
    dateObj = new Date(dateStr + ' ' + timeStr);
  }
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date/time format');
  }
  
  // Parse numeric values with proper validation
  const duration = parseInt(durationStr, 10);
  if (isNaN(duration) || duration <= 0) {
    throw new Error('Invalid duration');
  }
  
  // Parse optional numeric values - treat invalid values as 0 for backward compatibility
  const checkpointsCount = parseInt(checkpointsStr, 10);
  const checkpointDuration = parseInt(breakDurationStr, 10);
  const checkpointInterval = parseInt(intervalStr, 10);
  const pausesCount = parseInt(pausesStr, 10);
  
  const completed = completedStr.toLowerCase() === 'yes' || completedStr.toLowerCase() === 'true';
  
  return {
    id: generateSessionId(),
    timestamp: dateObj.toISOString(),
    duration,
    checkpointsCount: isNaN(checkpointsCount) ? 0 : checkpointsCount,
    checkpointDuration: isNaN(checkpointDuration) ? 0 : checkpointDuration,
    checkpointInterval: isNaN(checkpointInterval) ? 0 : checkpointInterval,
    pausesCount: isNaN(pausesCount) ? 0 : pausesCount,
    completed
  };
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
    refreshStatistics();
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
    inProgress: true, // Mark session as in progress
    startTime: Date.now(),
    checkpointSessions: [] // Array to store individual checkpoint sessions
  };
  console.log('New session started:', currentSession);
  
  // Add in-progress session to display if auto-logging is enabled
  if (logsConfig.autoLogEnabled) {
    renderLogs();
  }
}

/**
 * End the current session
 * @param {boolean} completed - Whether the session was completed
 * @param {number|null} actualWorkTimeSeconds - Actual work time in seconds (excluding checkpoint breaks), or null to use the session's original duration
 */
export function endSession(completed = true, actualWorkTimeSeconds = null) {
  if (currentSession) {
    currentSession.completed = completed;
    currentSession.inProgress = false; // Mark session as no longer in progress
    // If actualWorkTimeSeconds is provided, use it as the actual work duration
    if (actualWorkTimeSeconds !== null) {
      currentSession.duration = actualWorkTimeSeconds;
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
    
    // Update the display in real-time
    if (logsConfig.autoLogEnabled) {
      renderLogs();
    }
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
      duration
    };
    
    if (!currentSession.checkpointSessions) {
      currentSession.checkpointSessions = [];
    }
    
    currentSession.checkpointSessions.push(checkpointSession);
    console.log('Checkpoint session registered:', checkpointSession);
    
    // Update the display in real-time
    if (logsConfig.autoLogEnabled) {
      renderLogs();
    }
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
