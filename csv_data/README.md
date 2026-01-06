# CSV Data Directory

This directory is for storing your exported CSV session logs. Files in this directory are automatically excluded from Git to protect your privacy.

## Usage

1. **Export your session logs**: Click the "📥 Export logs" button in the Session History panel to download your session data as a CSV file.

2. **Store CSV files here**: Save your exported CSV files in this directory for easy access and organization.

3. **Import CSV files**: Click the "📤 Import CSV logs" button in the Session History panel to import one or more CSV files. The application will:
   - Parse the CSV data
   - Validate each session entry
   - Skip duplicate sessions (based on timestamp)
   - Merge imported sessions with your existing data
   - Update the statistics graph

## CSV Format

The exported CSV files use the following format:

```csv
Date,Time,Duration (s),Checkpoints,Break duration (s),Interval (s),Manual pauses,Completed
01/06/2026,11:38:55,6,1,2,4,0,Yes
01/06/2026,11:37:42,10,2,0,0,0,Yes
```

- **Date**: Session start date (MM/DD/YYYY format)
- **Time**: Session start time (HH:MM:SS format)
- **Duration (s)**: Total session duration in seconds
- **Checkpoints**: Number of checkpoint breaks taken
- **Break duration (s)**: Duration of each checkpoint break in seconds
- **Interval (s)**: Interval between checkpoint breaks in seconds
- **Manual pauses**: Number of manual pauses during the session
- **Completed**: Whether the session was completed (Yes/No)

## Privacy Note

- This directory is excluded from Git via `.gitignore`
- Your session data stays private and local to your computer
- CSV files in this directory will never be committed to the repository
