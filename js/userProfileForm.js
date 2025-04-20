'use strict';

document.addEventListener('DOMContentLoaded', () => {
  checkProfileStatus();
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
});

// Retrieve logged-in user email
const userEmail = sessionStorage.getItem('userEmail');
let currentUserId = null;
function populateFormFields(user = {}) {
  document.getElementById('userId').value = user.id || '';
  document.getElementById('email').value = user.Email || userEmail;
  document.getElementById('name').value = user.Name || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('department').value = user.department || '';
  document.getElementById('designation').value = user.designation || '';
  document.getElementById('address').value = user.address || '';
}
// Immediately invoke to populate fields on script load
(function() {
  checkProfileStatus();
})();

async function checkProfileStatus() {
  try {
    const res = await fetch('http://localhost:3000/Users');
    const users = await res.json();
    const user = users.find(u => u.Email.toLowerCase() === userEmail.toLowerCase());
    if (user) {
      currentUserId = user.id;
      populateFormFields(user);
    }
    // Always show edit form directly
    showForm(user);
  } catch (err) {
    console.error('[userProfileForm.js] Error loading profile:', err);
  }
}

function showForm(user = {}) {
  document.getElementById('profileFormWrapper').classList.remove('d-none');
  document.getElementById('editButtonWrapper').classList.add('d-none');
  document.getElementById('profileDisplay').classList.add('d-none');

  populateFormFields(user);
}

async function saveProfile(event) {
  event.preventDefault();
  const form = document.getElementById('profileForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }
  const payload = {
    Email: document.getElementById('email').value.trim(),
    Name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    department: document.getElementById('department').value,
    designation: document.getElementById('designation').value.trim(),
    address: document.getElementById('address').value.trim()
  };
  try {
    // Search for existing user by email using json-server query
    const searchRes = await fetch(`http://localhost:3000/Users?Email=${encodeURIComponent(payload.Email)}`);
    const users = await searchRes.json();
    if (users.length > 0) {
      currentUserId = users[0].id;
      // Update existing user record
      await fetch(`http://localhost:3000/Users/${currentUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new user record
      const createRes = await fetch('http://localhost:3000/Users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const newUser = await createRes.json();
      currentUserId = newUser.id;
    }
    checkProfileStatus();
  } catch (err) {
    console.error('[userProfileForm.js] Error saving profile:', err);
    alert('Unable to save profile. Please try again.');
  }
}