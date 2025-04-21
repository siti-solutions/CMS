'use strict';                                                     // Enable strict mode

/* ------------------------------------------------------------------ */
/*                     DOM READY → bootstrap UI                        */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  checkProfileStatus();                                            // Load existing data
  document.getElementById('profileForm')                           // <form id="profileForm">
          .addEventListener('submit', saveProfile);                // Attach submit handler
});

/* ------------------------------------------------------------------ */
/*                   Globals & session information                     */
/* ------------------------------------------------------------------ */
const userEmail      = sessionStorage.getItem('userEmail');        // Logged‑in email
let   currentUserId  = null;                                       // Will store user id after fetch

/* ------------------------------------------------------------------ */
/*                 Utility: populate form with user data              */
/* ------------------------------------------------------------------ */
/**
 * Fill form fields with given user object (or blanks).
 * @param {Object} user – User record from backend (keys: id, Email, Name, …)
 */
function populateFormFields(user = {}) {
  document.getElementById('userId').value      = user.id   || '';   // Hidden id field
  document.getElementById('email').value       = user.Email || userEmail;
  document.getElementById('name').value        = user.Name  || '';
  document.getElementById('phone').value       = user.phone || '';
  document.getElementById('department').value  = user.department || '';
  document.getElementById('designation').value = user.designation || '';
  document.getElementById('address').value     = user.address || '';
}

/* ------------------------------------------------------------------ */
/*                      Initial check on script load                   */
/* ------------------------------------------------------------------ */
(function immediateCheck() {
  checkProfileStatus();                                            // Auto‑populate immediately
})();

/* ------------------------------------------------------------------ */
/*        Fetch user list → find current user → show edit form        */
/* ------------------------------------------------------------------ */
async function checkProfileStatus() {
  try {
    const res   = await fetch('http://localhost:3000/Users');       // GET all users
    const users = await res.json();                                 // Array of users

    // Case‑insensitive email match to find existing user
    const user  = users.find(u => u.Email.toLowerCase() === userEmail.toLowerCase());

    if (user) {                                                     // Existing record?
      currentUserId = user.id;                                      // Store id for PATCH
      populateFormFields(user);                                     // Pre‑fill form
    }

    showForm(user);                                                 // Show editable form
  } catch (err) {
    console.error('[userProfileForm.js] Error loading profile:', err);
  }
}

/* ------------------------------------------------------------------ */
/*              Show edit form (always, view mode removed)            */
/* ------------------------------------------------------------------ */
function showForm(user = {}) {
  document.getElementById('profileFormWrapper').classList.remove('d-none'); // Show form
  document.getElementById('editButtonWrapper').classList.add('d-none');     // Hide edit btn
  document.getElementById('profileDisplay').classList.add('d-none');        // Hide display view

  populateFormFields(user);                                         // Ensure fields reflect data
}

/* ------------------------------------------------------------------ */
/*                     Submit handler → save profile                  */
/* ------------------------------------------------------------------ */
async function saveProfile(event) {
  event.preventDefault();                                           // Stay on SPA page

  const form = document.getElementById('profileForm');
  if (!form.checkValidity()) {                                      // Bootstrap validation
    form.classList.add('was-validated');
    return;
  }

  /* Build requestBody from form inputs -------------------------------- */
  const requestBody = {
    Email      : document.getElementById('email').value.trim(),
    Name       : document.getElementById('name').value.trim(),
    phone      : document.getElementById('phone').value.trim(),
    department : document.getElementById('department').value,
    designation: document.getElementById('designation').value.trim(),
    address    : document.getElementById('address').value.trim()
  };

  try {
    /* ---- Check if user already exists (search by email) --------- */
    const searchRes = await fetch(
      `http://localhost:3000/Users?Email=${encodeURIComponent(requestBody.Email)}`
    );
    const users = await searchRes.json();

    if (users.length > 0) {                                         // Existing record → PATCH
      currentUserId = users[0].id;
      await fetch(`http://localhost:3000/Users/${currentUserId}`, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(requestBody)
      });
    } else {                                                        // New record → POST
      const createRes = await fetch('http://localhost:3000/Users', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(requestBody)
      });
      const newUser = await createRes.json();
      currentUserId = newUser.id;                                   // Store new id
    }

    checkProfileStatus();                                           // Refresh UI with latest data
  } catch (err) {
    console.error('[userProfileForm.js] Error saving profile:', err);
    alert('Unable to save profile. Please try again.');             // Notify user
  }
}