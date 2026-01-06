/**
 * Statistics module for visualizing work session data
 */

import { LOGS_STORAGE_KEY, loadFromStorage } from './storage.js';

let statsChart = null;
let sessionLogs = [];

/**
 * Initialize statistics functionality
 */
export function initializeStatistics() {
  // Load logs
  sessionLogs = loadFromStorage(LOGS_STORAGE_KEY, [], true);
  
  // Add event listener for stats button (works with or without Chart.js)
  const statsBtn = document.getElementById('statsBtn');
  if (statsBtn) {
    statsBtn.addEventListener('click', toggleStatsPanel);
  }
  
  // Add event listeners for time range selector
  const timeRangeSelector = document.getElementById('statsTimeRange');
  if (timeRangeSelector) {
    timeRangeSelector.addEventListener('change', updateStatsView);
  }
  
  // Check if Chart.js is loaded and log warning if not
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Using text-based fallback visualization.');
  }
  
  // Initial render
  updateStatsView();
}

/**
 * Toggle statistics panel visibility
 */
function toggleStatsPanel() {
  const statsPanel = document.getElementById('statsPanel');
  if (statsPanel) {
    const isVisible = statsPanel.style.display === 'block';
    statsPanel.style.display = isVisible ? 'none' : 'block';
    
    // Update chart when showing
    if (!isVisible) {
      updateStatsView();
    }
  }
}

/**
 * Update statistics view based on selected time range
 */
function updateStatsView() {
  const timeRange = document.getElementById('statsTimeRange')?.value || 'day';
  
  // Reload logs to get latest data
  sessionLogs = loadFromStorage(LOGS_STORAGE_KEY, [], true);
  
  switch (timeRange) {
    case 'day':
      renderDailyStats();
      break;
    case 'week':
      renderWeeklyStats();
      break;
    case 'month':
      renderMonthlyStats();
      break;
    case 'year':
      renderYearlyStats();
      break;
    default:
      renderDailyStats();
  }
}

/**
 * Get sessions for today grouped by hour
 * @returns {Object} Sessions grouped by hour
 */
function getTodaySessionsByHour() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const hourlyData = {};
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = 0;
  }
  
  sessionLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    const logDay = new Date(logDate);
    logDay.setHours(0, 0, 0, 0);
    
    if (logDay.getTime() === today.getTime()) {
      const hour = logDate.getHours();
      hourlyData[hour] += log.duration;
    }
  });
  
  return hourlyData;
}

/**
 * Get sessions for the last 7 days
 * @returns {Object} Sessions grouped by day
 */
function getWeekSessionsByDay() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dailyData = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyData[dateKey] = 0;
  }
  
  sessionLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    logDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < 7) {
      const dateKey = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey] += log.duration;
      }
    }
  });
  
  return dailyData;
}

/**
 * Get sessions for the current month grouped by day
 * @returns {Object} Sessions grouped by day
 */
function getMonthSessionsByDay() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const dailyData = {};
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dailyData[d] = 0;
  }
  
  sessionLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    if (logDate.getMonth() === today.getMonth() && logDate.getFullYear() === today.getFullYear()) {
      const day = logDate.getDate();
      dailyData[day] += log.duration;
    }
  });
  
  return dailyData;
}

/**
 * Get sessions for the current year grouped by month
 * @returns {Object} Sessions grouped by month
 */
function getYearSessionsByMonth() {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const monthlyData = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  monthNames.forEach(month => {
    monthlyData[month] = 0;
  });
  
  sessionLogs.forEach(log => {
    const logDate = new Date(log.timestamp);
    if (logDate.getFullYear() === currentYear) {
      const monthName = monthNames[logDate.getMonth()];
      monthlyData[monthName] += log.duration;
    }
  });
  
  return monthlyData;
}

/**
 * Format seconds to hours with decimals
 * @param {number} seconds - Seconds
 * @returns {number} Hours
 */
function secondsToHours(seconds) {
  return Math.round((seconds / 3600) * 100) / 100;
}

/**
 * Render daily statistics (hourly breakdown)
 */
function renderDailyStats() {
  const hourlyData = getTodaySessionsByHour();
  const labels = [];
  const data = [];
  
  for (let i = 0; i < 24; i++) {
    labels.push(`${i.toString().padStart(2, '0')}:00`);
    data.push(secondsToHours(hourlyData[i]));
  }
  
  renderChart(labels, data, 'Hourly Productivity (Today)', 'Hours');
  updateStatsSummary('Today', hourlyData);
}

/**
 * Render weekly statistics (daily breakdown)
 */
function renderWeeklyStats() {
  const dailyData = getWeekSessionsByDay();
  const labels = Object.keys(dailyData);
  const data = labels.map(label => secondsToHours(dailyData[label]));
  
  renderChart(labels, data, 'Daily Work Time (Last 7 Days)', 'Hours');
  updateStatsSummary('This Week', dailyData);
}

/**
 * Render monthly statistics (daily breakdown)
 */
function renderMonthlyStats() {
  const dailyData = getMonthSessionsByDay();
  const labels = Object.keys(dailyData);
  const data = labels.map(label => secondsToHours(dailyData[label]));
  
  renderChart(labels, data, 'Daily Work Time (This Month)', 'Hours');
  updateStatsSummary('This Month', dailyData);
}

/**
 * Render yearly statistics (monthly breakdown)
 */
function renderYearlyStats() {
  const monthlyData = getYearSessionsByMonth();
  const labels = Object.keys(monthlyData);
  const data = labels.map(label => secondsToHours(monthlyData[label]));
  
  renderChart(labels, data, 'Monthly Work Time (This Year)', 'Hours');
  updateStatsSummary('This Year', monthlyData);
}

/**
 * Render chart using Chart.js or fallback to text-based view
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} title - Chart title
 * @param {string} yAxisLabel - Y-axis label
 */
function renderChart(labels, data, title, yAxisLabel) {
  const canvas = document.getElementById('statsChart');
  if (!canvas) return;
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    // Fallback to text-based visualization
    renderTextChart(canvas, labels, data, title, yAxisLabel);
    return;
  }
  
  const ctx = canvas.getContext('2d');
  
  // Destroy existing chart
  if (statsChart) {
    statsChart.destroy();
  }
  
  // Create new chart
  statsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: yAxisLabel,
        data: data,
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          color: '#eee',
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#aaa'
          },
          grid: {
            color: '#333'
          }
        },
        x: {
          ticks: {
            color: '#aaa',
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            color: '#333'
          }
        }
      }
    }
  });
}

/**
 * Render a text-based chart when Chart.js is not available
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} labels - X-axis labels
 * @param {Array} data - Y-axis data
 * @param {string} title - Chart title
 * @param {string} yAxisLabel - Y-axis label
 */
function renderTextChart(canvas, labels, data, title, yAxisLabel) {
  // Hide canvas and show text-based chart
  canvas.style.display = 'none';
  
  // Find or create text chart container
  let textChartContainer = document.getElementById('textStatsChart');
  if (!textChartContainer) {
    textChartContainer = document.createElement('div');
    textChartContainer.id = 'textStatsChart';
    textChartContainer.className = 'text-chart';
    canvas.parentNode.appendChild(textChartContainer);
  }
  
  textChartContainer.style.display = 'block';
  
  // Find max value for scaling
  const maxValue = Math.max(...data, 0.1);
  
  // Create HTML for text chart
  let html = `<div class="text-chart-title">${title}</div>`;
  html += '<div class="text-chart-bars">';
  
  for (let i = 0; i < labels.length; i++) {
    const value = data[i];
    const percentage = (value / maxValue) * 100;
    const displayValue = value.toFixed(2);
    
    if (value > 0) {
      html += `
        <div class="text-chart-row">
          <div class="text-chart-label">${labels[i]}</div>
          <div class="text-chart-bar-container">
            <div class="text-chart-bar" style="width: ${percentage}%"></div>
          </div>
          <div class="text-chart-value">${displayValue}h</div>
        </div>
      `;
    }
  }
  
  html += '</div>';
  textChartContainer.innerHTML = html;
}

/**
 * Update statistics summary
 * @param {string} period - Time period name
 * @param {Object} data - Data object
 */
function updateStatsSummary(period, data) {
  const summaryDiv = document.getElementById('statsSummary');
  if (!summaryDiv) return;
  
  // Calculate total time
  const totalSeconds = Object.values(data).reduce((sum, val) => sum + val, 0);
  const totalHours = secondsToHours(totalSeconds);
  
  // Find most productive time
  let maxValue = 0;
  let maxKey = '';
  Object.entries(data).forEach(([key, value]) => {
    if (value > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  });
  
  const maxHours = secondsToHours(maxValue);
  
  // Calculate average - use all periods for denominator
  const avgHours = Object.keys(data).length > 0 
    ? secondsToHours(totalSeconds / Object.keys(data).length) 
    : 0;
  
  // Determine the unit for average label
  let avgUnit = 'Day';
  if (period === 'Today') {
    avgUnit = 'Hour';
  } else if (period === 'This Week') {
    avgUnit = 'Day';
  } else if (period === 'This Month') {
    avgUnit = 'Day';
  } else if (period === 'This Year') {
    avgUnit = 'Month';
  }
  
  summaryDiv.innerHTML = `
    <div class="stats-summary-item">
      <span class="stats-summary-label">Total Work Time:</span>
      <span class="stats-summary-value">${totalHours.toFixed(2)} hours</span>
    </div>
    <div class="stats-summary-item">
      <span class="stats-summary-label">Most Productive:</span>
      <span class="stats-summary-value">${maxKey || 'N/A'} (${maxHours.toFixed(2)} hours)</span>
    </div>
    <div class="stats-summary-item">
      <span class="stats-summary-label">Average per ${avgUnit}:</span>
      <span class="stats-summary-value">${avgHours.toFixed(2)} hours</span>
    </div>
  `;
}

/**
 * Refresh statistics (called when new data is added)
 */
export function refreshStatistics() {
  updateStatsView();
}
