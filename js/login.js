'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) {
    console.warn('[login.js] No login form found, skipping initialization');
    return;
  }
  form.addEventListener('submit', handleLogin);
  console.log('[login.js] DOMContentLoaded, login form initialized');
});

/**
 * Handle user login submission
 */
async function handleLogin(event) {
  event.preventDefault();
  console.log('[login.js] handleLogin called');

  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  if (!emailEl || !passwordEl) {
    console.error('[login.js] Missing email or password inputs');
    return;
  }

  const email = emailEl.value.trim();
  const password = passwordEl.value;
  console.log('[login.js] Inputs:', { email, password: password ? '***' : '' });

  if (!email || !password) {
    console.warn('[login.js] Missing email or password');
    alert('Email and password are required.');
    return;
  }

  try {
    console.log('[login.js] Fetching users from API');
    const res = await fetch('http://localhost:3000/Users');
    const users = await res.json();
    console.log('[login.js] Users fetched:', users);

    const user = users.find(u =>
      u.Email.toLowerCase() === email.toLowerCase() && u.Password === password
    );
    console.log('[login.js] Matched user:', user);

    if (!user) {
      console.error('[login.js] Invalid credentials');
      alert('Invalid credentials.');
      return;
    }

    console.log('[login.js] Login successful, storing session');
    sessionStorage.setItem('userId', user.UserID || user.id);
    sessionStorage.setItem('userName', user.Name || user.name);
    sessionStorage.setItem('userType', user.UserType.toLowerCase());
    sessionStorage.setItem('userEmail', email);

    // Redirect based on stored UserType
    const target = user.UserType.toLowerCase() === 'admin' ? 'adminHome.html' : 'userHome.html';
    console.log('[login.js] Redirecting to:', target);
    window.location.href = target;
  } catch (err) {
    console.error('[login.js] Login error:', err);
    alert('Server error. Try again later.');
  }
}

// Optional helper to logout
function logout() {
  console.log('[login.js] Logging out user');
  sessionStorage.clear();
  window.location.href = 'login.html';
}