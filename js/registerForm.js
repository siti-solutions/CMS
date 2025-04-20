
// js/registerForm.js

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const roleEl = document.getElementById('role');
  const usernameEl = document.getElementById('username');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const confirmEl = document.getElementById('confirmPassword');

  usernameEl.addEventListener('blur', validateName);
  emailEl.addEventListener('blur', validateEmail);
  passwordEl.addEventListener('blur', validatePassword);
  confirmEl.addEventListener('blur', validateConfirmPassword);
  form.addEventListener('submit', registerUser);
});

const API_URL = 'http://localhost:3000/Users';
let emailValid = false;

function showFeedback(input, message, isValid) {
  const feedback = input.nextElementSibling;
  if (isValid) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    if (feedback) feedback.textContent = '';
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    if (feedback) feedback.textContent = message;
  }
}

function validateName() {
  const input = document.getElementById('username');
  const valid = input.value.trim().length > 3;
  showFeedback(input, 'Username must be at least 4 characters.', valid);
  return valid;
}

async function validateEmail() {
  const input = document.getElementById('email');
  const email = input.value.trim();
  if (!email) {
    showFeedback(input, 'Email is required.', false);
    emailValid = false;
    return false;
  }
  try {
    const res = await fetch(API_URL);
    const users = await res.json();
    const exists = users.some(u => u.Email.toLowerCase() === email.toLowerCase());
    if (exists) {
      showFeedback(input, 'Email already registered.', false);
      emailValid = false;
      return false;
    } else {
      showFeedback(input, '', true);
      emailValid = true;
      return true;
    }
  } catch (err) {
    console.error('[registerForm.js] Email validation error:', err);
    showFeedback(input, 'Error validating email.', false);
    emailValid = false;
    return false;
  }
}

function validatePassword() {
  const input = document.getElementById('password');
  const pwd = input.value;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
  const valid = regex.test(pwd);
  showFeedback(input, 'Password must be 8+ chars, include upper & lower, number & special.', valid);
  return valid;
}

function validateConfirmPassword() {
  const input = document.getElementById('confirmPassword');
  const pwd = document.getElementById('password').value;
  const valid = pwd && (pwd === input.value);
  showFeedback(input, 'Passwords do not match.', valid);
  return valid;
}

async function registerUser(event) {
  event.preventDefault();
  const form = document.getElementById('registerForm');

  const nameOk = validateName();
  const pwdOk = validatePassword();
  const confirmOk = validateConfirmPassword();
  await validateEmail();

  if (!nameOk || !pwdOk || !confirmOk || !emailValid) {
    form.classList.add('was-validated');
    return;
  }

  const payload = {
    UserID: Date.now(),
    Name: document.getElementById('username').value.trim(),
    Email: document.getElementById('email').value.trim(),
    Password: document.getElementById('password').value,
    UserType: document.getElementById('role').value
  };

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    window.location.href = 'login.html';
  } catch (err) {
    console.error('[registerForm.js] Registration error:', err);
    alert('Registration failed. Please try again later.');
  }
}