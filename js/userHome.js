// js/userHome.js
// --------------
// Boots the User dashboard home page.
//
// Behaviour:
//   • Waits for DOMContentLoaded.
//   • Selects the first sidebar `<a>` link (assumed to be “File Complaint”).
//   • Calls `loadPage('fileComplaintForm.html', link)` so the form appears
//     in the main content area and the sidebar item is marked active.

'use strict';                                          // Enable strict mode

document.addEventListener('DOMContentLoaded', () => {
  /* --------------------------------------------------------------- */
  /*            Auto‑load “File Complaint” on first visit             */
  /* --------------------------------------------------------------- */
  const firstLink = document.querySelector('.sidebar a');           // First nav link
  if (firstLink) {                                                  // Link exists?
    loadPage('fileComplaintForm.html', firstLink);                  // Load page + set active
  } else {
    console.warn('[userHome.js] Sidebar link not found; nothing loaded'); // Fallback log
  }
});
