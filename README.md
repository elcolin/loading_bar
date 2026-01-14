# Timer with Loading Bar and Checkpoints

An elegant web timer with progress bar, automatic breaks system (checkpoints), and browser notifications.

![Timer Interface](https://github.com/user-attachments/assets/b70ff126-de5f-46e5-9ffd-19d78d22792d)

## Features

- ⏱️ **Customizable timer**: Configure your work time with a flexible format (hours, minutes, seconds)
- 🔔 **Browser notifications**: Receive alerts even when the tab is not active
- ☕ **Checkpoint system**: Automatic breaks at regular intervals
- 📊 **Visual progress bar**: Track your progress in real-time
- 📝 **Personal notes**: Take notes during your work sessions with automatic saving
- 📈 **Session history**: Automatically record and analyze all your work sessions
- 🎨 **Elegant interface**: Modern dark design
- 🔧 **Modular architecture**: Separated frontend and backend logic for easy maintenance

## Installation and Usage

### Option 1: Local HTTP Server (Recommended)

To test the application locally with functional notifications:

#### With Python 3 (Custom Server - Recommended)

```bash
# Clone the repository
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Start the custom HTTP server (handles errors gracefully)
python3 server.py 8000

# Open in your browser
# Chrome/Edge: http://localhost:8000/
# Firefox: http://localhost:8000/
```

**Alternative**: Use Python's built-in server (may show error messages for client disconnections):

```bash
python3 -m http.server 8000
```

#### With Node.js (http-server)

```bash
# Install http-server (if not already installed)
npm install -g http-server

# Clone and start
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar
http-server -p 8000

# Open http://localhost:8000/
```

#### With PHP

```bash
# Clone the repository
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Start the PHP server
php -S localhost:8000

# Open http://localhost:8000/
```

### Option 2: Direct Local File

```bash
# Clone the repository
git clone https://github.com/elcolin/loading_bar.git
cd loading_bar

# Open directly in the browser
# Linux/Mac
open index.html
# or
xdg-open index.html

# Windows
start index.html
```

**⚠️ Note**: Notifications may not work in local file mode (`file://`). Use a local HTTP server for the complete experience.

## User Guide

### Basic Configuration

1. **Set work time**
   - Enter the time in the first field
   - Accepted format: `1h30m0s`, `45m`, `30s`, `1h`, etc.
   - Examples:
     - `25m` = 25 minutes (Pomodoro technique)
     - `1h30m` = 1 hour 30 minutes
     - `90s` = 90 seconds

2. **Click "Start"**
   - The timer starts immediately
   - The green bar indicates progress
   - Remaining time is displayed below

### Checkpoint Configuration (Breaks)

Checkpoints are automatic breaks that activate during your work session.

1. **Configure break duration**
   - "Break duration" field: how long the break lasts
   - Example: `5m` = 5 minutes break

2. **Configure interval**
   - "Interval" field: how often during work time
   - Example: `25m` = every 25 minutes of work

3. **Concrete example (Modified Pomodoro Technique)**
   ```
   Total time: 2h
   Break duration: 5m
   Interval: 25m
   
   Result: 
   - Work for 25 minutes
   - 5-minute break (notification)
   - Work for 25 minutes
   - 5-minute break (notification)
   - etc.
   ```

### Enabling Notifications (Important!)

**Notifications are essential for checkpoints.**

1. **Click "Enable notifications"** (blue button)
2. **Accept** the Chrome/Firefox permission request
3. The button turns green: "✓ Notifications enabled"
4. A test notification appears

![Enable notifications](https://github.com/user-attachments/assets/257232e6-80d9-418f-bfd5-e3a4e3f34ecd)

**If you don't see notifications**:
- ⚠️ Check that you clicked "Enable notifications"
- ⚠️ Check your browser's notification settings
- ⚠️ Make sure you're using an HTTP server (not `file://`)

### Notification Behavior

You will receive **two notifications per checkpoint**:

1. **"Checkpoint break!"** 
   - When the break starts
   - Message: "Take a break for X minute(s)"
   - The bar turns orange

2. **"Break over!"**
   - When the break ends
   - Message: "Back to work. Good luck!"
   - The bar returns to green

![Active checkpoint](https://github.com/user-attachments/assets/ad9f028c-3563-4bba-bf2f-aea5b3b1d274)

### Notification Features

- ✅ **Persistent**: Remain displayed until interaction
- ✅ **Work in background**: Even if the tab is not active
- ✅ **Operating system**: Native Windows/Mac/Linux notifications
- ✅ **Sound included**: Alert sound (if not disabled in settings)
- ✅ **Mobile vibration**: On compatible devices

## Usage Examples

### Example 1: Classic Pomodoro
```
Total time: 25m
Break duration: (empty)
Interval: (empty)
```
Simple 25-minute timer without checkpoints.

### Example 2: Pomodoro with Breaks
```
Total time: 2h
Break duration: 5m
Interval: 25m
```
2-hour session with 5-minute breaks every 25 minutes.

### Example 3: Long Session with Micro-breaks
```
Total time: 3h
Break duration: 2m
Interval: 50m
```
3-hour session with short 2-minute breaks every 50 minutes.

### Example 4: Quick Test
```
Total time: 30s
Break duration: 3s
Interval: 10s
```
To quickly test features (10s work, 3s break).

## Personal Notes

### Using Notes

The application includes a note-taking system to allow you to keep track of your thoughts, tasks, and important information during your work sessions.

1. **Open notes**
   - Click "📝 Personal notes" at the bottom of the interface
   - The section expands to display the input field

2. **Write notes**
   - Type directly in the text area
   - Your notes are automatically saved after 500ms of inactivity
   - Notes are stored locally in your browser (localStorage)

3. **Export notes**
   - Click "📥 Export notes"
   - A `notes_YYYY-MM-DD.notes.txt` file will be downloaded
   - Save this file in the project's `notes/` folder (it will be ignored by Git)

4. **Clear notes**
   - Click "🗑️ Clear notes"
   - Confirm the action (irreversible)

### Privacy Protection

- Notes are **never sent to the Internet** - they stay on your computer
- The `.gitignore` file automatically excludes:
  - The `notes/` folder (for your exported files)
  - `*.notes.txt` files
  - `*.private.txt` files
- Your personal notes will never be committed to the Git repository

![Personal notes](https://github.com/user-attachments/assets/795c8ecb-b848-4b1f-af7c-0aa89487f4ab)

## Session History

### Overview

The application automatically records all your work sessions in a dedicated panel on the left side of the interface. This feature allows you to track your productivity and analyze your work habits over time.

![Session history](https://github.com/user-attachments/assets/91756515-98f7-462f-a189-14ec3a252854)

### Recorded Information

Each session automatically records:
- 📅 **Date and time**: Precise session start timestamp
- ⏱️ **Duration**: Total session time
- ☕ **Checkpoints**: Number of automatic breaks taken
- ⏸️ **Break duration**: Checkpoint break configuration
- 🔄 **Interval**: Break frequency
- ⏸️ **Manual pauses**: Number of manual pauses made
- ✅ **Status**: Session completed or interrupted

![Multiple sessions](https://github.com/user-attachments/assets/55be647f-8e6d-4533-9d87-67bf37f19119)

### Configuration Settings

The logs panel offers three configurable options:

1. **Automatically record sessions**
   - Enable/disable automatic recording
   - Sessions will not be recorded if this option is disabled

2. **Include checkpoint details**
   - Show/hide detailed break information
   - Useful for a simplified view

3. **Record manual pauses**
   - Count/ignore manual pauses in statistics
   - Allows differentiating automatic from manual pauses

All configurations are automatically saved in localStorage.

### Log Management

#### Delete a log

Click "🗑️ Delete" under an entry to permanently delete it.

#### Clear all logs

Click the "🗑️" button at the top right of the panel to clear all history.

#### Export data

Click the "📥" button to export all your sessions in CSV format. The exported file contains:
- Date and time of each session
- Duration in seconds (facilitates calculations)
- Number of checkpoints
- Break configuration
- Number of manual pauses
- Completion status

**File format**: `session_logs_YYYY-MM-DD.csv`

#### Import data

Click the "📤" button to import one or more CSV files containing previously exported session logs. The import feature:
- Supports multiple file selection for batch imports
- Automatically validates CSV format and data integrity
- Skips duplicate sessions (based on timestamp matching)
- Merges imported sessions with existing data
- Updates statistics graphs automatically

**Recommended workflow**:
1. Export your sessions regularly using the "📥" button
2. Store CSV files in the `csv_data/` folder for easy access
3. Import CSV files when needed to restore or consolidate data from different devices
4. The `csv_data/` folder is excluded from Git to protect your privacy

### Using for Data Analysis

The CSV format allows easy analysis with tools like:
- **Excel / Google Sheets**: Pivot tables, charts
- **Python / Pandas**: Advanced statistical analysis
- **R**: Visualizations and statistical models
- **Power BI / Tableau**: Interactive dashboards

#### Analysis Example

```csv
Date,Time,Duration (s),Checkpoints,Break duration (s),Interval (s),Manual pauses,Completed
01/06/2026,11:38:55,6,1,2,4,0,Yes
01/06/2026,11:37:42,10,2,0,0,0,Yes
```

With this data, you can:
- Calculate total work time per day/week/month
- Analyze checkpoint break effectiveness
- Identify the most productive times of day
- Measure your consistency in work sessions

### Privacy Protection

- Logs are **stored locally** in your browser (localStorage)
- **No data is sent to the Internet**
- Exported files remain on your computer
- You have complete control over your data

## Browser Compatibility

| Browser | Version | Notifications | Checkpoints |
|---------|---------|---------------|-------------|
| Chrome  | ≥ 22    | ✅            | ✅          |
| Firefox | ≥ 22    | ✅            | ✅          |
| Edge    | ≥ 14    | ✅            | ✅          |
| Safari  | ≥ 7     | ✅            | ✅          |
| Opera   | ≥ 25    | ✅            | ✅          |

## Troubleshooting

### Notifications don't appear

**Checks:**

1. **Permission granted?**
   ```
   - Click "Enable notifications"
   - Check that the button is green
   - Reload the page if necessary
   ```

2. **Browser settings (Chrome)**
   ```
   1. Open chrome://settings/content/notifications
   2. Check that notifications are allowed
   3. Check that localhost:8000 is in the allowed list
   ```

3. **Browser settings (Firefox)**
   ```
   1. Open about:preferences#privacy
   2. "Permissions" section > "Notifications" > "Settings"
   3. Check localhost:8000
   ```

4. **Local file mode**
   ```bash
   # Notifications don't work with file://
   # Use an HTTP server:
   python3 -m http.server 8000
   ```

5. **Developer console**
   ```
   Press F12 to open the console
   Check for error messages
   Look for "Permission granted: false"
   ```

### Checkpoint doesn't trigger

- ✅ Check that both fields (duration and interval) are filled
- ✅ Use the correct format: `5m`, `30s`, `1h`, etc.
- ✅ The checkpoint is based on **work** time (not total time)

### Progress bar doesn't move

- Reload the page (F5)
- Check the time format
- Open the console (F12) to see errors

## Development

### Project Structure

```
loading_bar/
├── index.html          # Main HTML file
├── timer.html          # Legacy monolithic version (deprecated)
├── server.py           # Custom HTTP server (handles errors gracefully)
├── favicon.ico         # Browser favicon
├── css/
│   └── styles.css      # All application styles
├── js/
│   ├── app.js          # Application initialization
│   ├── timer.js        # Core timer logic
│   ├── notifications.js # Notification handling
│   ├── notes.js        # Personal notes functionality
│   ├── session-logs.js # Session logging
│   └── storage.js      # LocalStorage utilities
└── README.md          # This file
```

### Custom HTTP Server

The project includes a custom HTTP server (`server.py`) that improves upon Python's built-in `http.server` by:

- **Gracefully handling client disconnections**: Suppresses `BrokenPipeError` exceptions that occur when browsers disconnect early
- **Cleaner server logs**: No more stack traces for common browser behaviors
- **Includes favicon.ico**: A favicon.ico file is provided to prevent 404 errors when browsers request it

**Usage:**
```bash
# Default port (8000)
python3 server.py

# Custom port
python3 server.py 3000
```

The server provides the same functionality as `python3 -m http.server` but with better error handling for production-like usage.

### Technologies Used

- HTML5
- CSS3 (Flexbox, Gradients, Transitions)
- JavaScript ES6+ Modules
- Notification API
- Vibration API (mobile)

### Architecture

The application follows a modular architecture with separated concerns:

**Frontend (HTML/CSS)**:
- `index.html`: Structure and layout
- `css/styles.css`: All visual styling

**Backend Logic (JavaScript Modules)**:
- `storage.js`: Data persistence layer (localStorage)
- `notifications.js`: Browser notification management
- `timer.js`: Core timer and checkpoint logic
- `notes.js`: Note-taking functionality
- `session-logs.js`: Session tracking and analytics
- `app.js`: Application initialization and event binding

### Contributing

Contributions are welcome!

```bash
# Fork the project
git clone https://github.com/your-username/loading_bar.git
cd loading_bar

# Create a branch
git checkout -b feature/my-feature

# Make your modifications
# Test locally
python3 -m http.server 8000

# Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature

# Create a Pull Request on GitHub
```

## License

This project is free to use.

## Support

For any questions or issues:
- Open an issue on GitHub
- Check the "Troubleshooting" section above
- Check the developer console (F12) for debug messages

---

**Happy working and happy breaks! ☕⏱️**
