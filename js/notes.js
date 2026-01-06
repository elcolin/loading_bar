/**
 * Notes module for personal notes functionality
 */

import { NOTES_STORAGE_KEY, saveToStorage, loadFromStorage, removeFromStorage } from './storage.js';

let notesOpen = false;
let autoSaveTimeout = null;

/**
 * Initialize the notes functionality
 */
export function initializeNotes() {
  const notesTextarea = document.getElementById('notesTextarea');
  const notesHeader = document.getElementById('notesHeader');
  const notesToggle = document.getElementById('notesToggle');
  const notesContent = document.getElementById('notesContent');
  const exportBtn = document.getElementById('exportNotesBtn');
  const clearBtn = document.getElementById('clearNotesBtn');

  // Load saved notes from localStorage
  const savedNotes = loadFromStorage(NOTES_STORAGE_KEY, '');
  if (savedNotes) {
    notesTextarea.value = savedNotes;
  }

  // Toggle notes section
  notesHeader.addEventListener('click', () => {
    notesOpen = !notesOpen;
    if (notesOpen) {
      notesContent.classList.add('open');
      notesToggle.classList.add('open');
    } else {
      notesContent.classList.remove('open');
      notesToggle.classList.remove('open');
    }
  });

  // Auto-save notes with debounce
  notesTextarea.addEventListener('input', () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveToStorage(NOTES_STORAGE_KEY, notesTextarea.value);
      console.log('Notes auto-saved');
    }, 500); // Save after 500ms of no typing
  });

  // Export notes to file
  exportBtn.addEventListener('click', exportNotes);

  // Clear notes
  clearBtn.addEventListener('click', clearNotes);
}

/**
 * Export notes to a file
 */
function exportNotes() {
  const notesTextarea = document.getElementById('notesTextarea');
  const notes = notesTextarea.value;
  
  if (!notes.trim()) {
    alert('No notes to export.');
    return;
  }

  // Create a blob with the notes content
  const blob = new Blob([notes], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger download
  const a = document.createElement('a');
  a.href = url;
  // Format: notes_YYYY-MM-DD.notes.txt
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `notes_${dateStr}.notes.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log('Notes exported successfully');
}

/**
 * Clear all notes
 */
function clearNotes() {
  if (confirm('Are you sure you want to delete all your notes? This action is irreversible.')) {
    const notesTextarea = document.getElementById('notesTextarea');
    notesTextarea.value = '';
    removeFromStorage(NOTES_STORAGE_KEY);
    console.log('Notes cleared');
  }
}
