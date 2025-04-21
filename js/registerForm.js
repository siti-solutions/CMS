// js/registerForm.js
// ------------------
// Handles user registration workflow.
//
// Flow:
//   • DOMContentLoaded → cache form elements, attach validators & submit handler.
//   • Real‑time field validation on blur (username, email, password, confirm).
//   • Email uniqueness check via GET /Users.
//   • On submit: run all validators, build payload, POST to /Users, then redirect.
//
// Validation rules:
//   • Username ≥ 4 characters.
//   • Email must be unique in DB.
//   • Password ≥ 8 chars, include upper+lowercase, number, special symbol.
//   • Confirm password must match.
//
// Exposed utilities: none.

'use strict';                                                      // Enable strict mode

/* ------------------------------------------------------------------ */
/*                             DOM READY                              */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('registerForm');      // <form>
  const roleEl      = document.getElementById('role');              // <select role>
  const usernameEl  = document.getElementById('username');          // Username input
  const emailEl     = document.getElementById('email');             // Email input
  const passwordEl  = document.getElementById('password');          // Password input
  const confirmEl   = document.getElementById('confirmPassword');   // Confirm pwd input

  /* ---- Attach blur validators (live feedback) ------------------- */
  usernameEl.addEventListener('blur', validateName);                // Username ≥ 4
  emailEl.addEventListener('blur', validateEmail);                  // Email unique
  passwordEl.addEventListener('blur', validatePassword);            // Password complexity
  confirmEl.addEventListener('blur', validateConfirmPassword);      // Confirm match

  /* ---- Submit handler ------------------------------------------- */
  form.addEventListener('submit', registerUser);                    // Final validation + POST
});

/* ------------------------------------------------------------------ */
/*                          Module‑level consts                       */
/* ------------------------------------------------------------------ */
const API_URL   = 'http://localhost:3000/Users'; // json‑server users endpoint
let emailValid  = false;                         // Will be toggled by validateEmail()

/* ------------------------------------------------------------------ */
/*                 Helper: show Bootstrap validation UI               */
/* ------------------------------------------------------------------ */
/**
 * Toggle is‑invalid / is‑valid classes and set feedback text.
 * @param {HTMLInputElement} input   – The field to style.
 * @param {string}           message – Error message (ignored if isValid=true).
 * @param {boolean}          isValid – Field passes validation?
 */
function showFeedback(input, message, isValid) {
  const feedback = input.nextElementSibling;                       // .invalid-feedback element
  if (isValid) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    if (feedback) feedback.textContent = '';                       // Clear message
  } else {
    input.classList.remove('is-valid');
    input.classList.add('is-invalid');
    if (feedback) feedback.textContent = message;                  // Show message
  }
}

/* ------------------------------------------------------------------ */
/*                       Individual field validators                  */
/* ------------------------------------------------------------------ */
/** Username ≥ 4 characters */
function validateName() {
  const input = document.getElementById('username');
  const valid = input.value.trim().length > 3;                     // ≥4 chars
  showFeedback(input, 'Username must be at least 4 characters.', valid);
  return valid;
}

/** Check email uniqueness via API */
async function validateEmail() {
  const input = document.getElementById('email');
  const email = input.value.trim();

  /* ---- Client side: presence check ------------------------------ */
  if (!email) {
    showFeedback(input, 'Email is required.', false);
    emailValid = false;
    return false;
  }

  try {
    /* ---- Server side: uniqueness check -------------------------- */
    const res   = await fetch(API_URL);                             // GET /Users
    const users = await res.json();                                 // Array of users
    const exists = users.some(u => u.Email.toLowerCase() === email.toLowerCase());
    if (exists) {
      showFeedback(input, 'Email already registered.', false);
      emailValid = false;
      return false;
    } else {
      showFeedback(input, '', true);                                // Unique email
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

/** Password complexity (Upper, lower, digit, special, ≥8) */
function validatePassword() {
  const input = document.getElementById('password');
  const pwd   = input.value;
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
  const valid = regex.test(pwd);
  showFeedback(
    input,
    'Password must be 8+ chars, include upper & lower, number & special.',
    valid
  );
  return valid;
}

/** Confirm password matches password */
function validateConfirmPassword() {
  const input = document.getElementById('confirmPassword');
  const pwd   = document.getElementById('password').value;
  const valid = pwd && (pwd === input.value);
  showFeedback(input, 'Passwords do not match.', valid);
  return valid;
}

/* ------------------------------------------------------------------ */
/*                    Submit handler: register user                   */
/* ------------------------------------------------------------------ */
async function registerUser(event) {
  event.preventDefault();                                           // Stay SPA‑style
  const form = document.getElementById('registerForm');

  /* ---- Run all validators -------------------------------------- */
  const nameOk    = validateName();
  const pwdOk     = validatePassword();
  const confirmOk = validateConfirmPassword();
  await validateEmail();                                            // Updates emailValid

  if (!nameOk || !pwdOk || !confirmOk || !emailValid) {             // Any failure?
    form.classList.add('was-validated');                            // Show errors on form
    return;                                                         // Halt submission
  }

  /* ---- Build payload for POST ---------------------------------- */
  const payload = {
    UserID  : Date.now(),                                           // Simple timestamp ID
    Name    : document.getElementById('username').value.trim(),
    Email   : document.getElementById('email').value.trim(),
    Password: document.getElementById('password').value,
    UserType: document.getElementById('role').value                 // 'Admin' | 'User'
  };
  console.log('[registerForm.js] Payload:', payload);

  /* ---- POST to backend ----------------------------------------- */
  try {
    await fetch(API_URL, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(payload)
    });
    window.location.href = 'login.html';                            // Go to login
  } catch (err) {
    console.error('[registerForm.js] Registration error:', err);
    alert('Registration failed. Please try again later.');          // Notify user
  }
}