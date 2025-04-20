

// js/userProfileForm.js

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  checkProfileStatus();
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
});

// Retrieve logged-in user email
const userEmail = localStorage.getItem('userEmail');
const apiUrl = `http://localhost:3000/Users?email=${encodeURIComponent(userEmail)}`;
let currentUserId = null;

async function checkProfileStatus() {
  try {
    const res = await fetch(apiUrl);
    const users = await res.json();
    if (!users.length) {
      showForm();
      return;
    }
    const user = users[0];
    currentUserId = user.id;
    const requiredFields = ['name', 'phone', 'department', 'designation', 'address'];
    const incomplete = requiredFields.some(f => !user[f] || !user[f].trim());
    if (incomplete) {
      showForm(user);
    } else {
      showProfile(user);
    }
  } catch (err) {
    console.error('[userProfileForm.js] Error loading profile:', err);
  }
}

function showForm(user = {}) {
  document.getElementById('profileFormWrapper').classList.remove('d-none');
  document.getElementById('editButtonWrapper').classList.add('d-none');
  document.getElementById('profileDisplay').classList.add('d-none');

  document.getElementById('userId').value = user.id || '';
  document.getElementById('email').value = user.email || userEmail;
  document.getElementById('name').value = user.name || '';
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('department').value = user.department || '';
  document.getElementById('designation').value = user.designation || '';
  document.getElementById('address').value = user.address || '';
}

function showEditForm() {
  document.getElementById('profileFormWrapper').classList.remove('d-none');
  document.getElementById('editButtonWrapper').classList.add('d-none');
  document.getElementById('profileDisplay').classList.add('d-none');
}

function showProfile(user) {
  document.getElementById('profileFormWrapper').classList.add('d-none');
  document.getElementById('editButtonWrapper').classList.remove('d-none');
  document.getElementById('profileDisplay').classList.remove('d-none');

  document.getElementById('viewUserId').textContent = user.id || '';
  document.getElementById('viewEmail').textContent = user.email;
  document.getElementById('viewName').textContent = user.name;
  document.getElementById('viewPhone').textContent = user.phone;
  document.getElementById('viewDepartment').textContent = user.department;
  document.getElementById('viewDesignation').textContent = user.designation || '';
  document.getElementById('viewAddress').textContent = user.address || '';
}

async function saveProfile(event) {
  event.preventDefault();
  const form = document.getElementById('profileForm');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const payload = {
    email: document.getElementById('email').value.trim(),
    name: document.getElementById('name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    department: document.getElementById('department').value,
    designation: document.getElementById('designation').value.trim(),
    address: document.getElementById('address').value.trim()
  };

  const url = currentUserId
    ? `http://localhost:3000/Users/${currentUserId}`
    : 'http://localhost:3000/Users';
  const method = currentUserId ? 'PATCH' : 'POST';

  try {
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    checkProfileStatus();
  } catch (err) {
    console.error('[userProfileForm.js] Error saving profile:', err);
    alert('Unable to save profile. Please try again.');
  }
}