// js/userHome.js

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Load the New Grievance page by default
  const firstLink = document.querySelector('.sidebar a');
  if (firstLink) {
    loadPage('fileComplaintForm.html', firstLink);
  }
});
