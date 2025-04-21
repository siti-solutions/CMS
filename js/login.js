'use strict'; // Enable strict mode for safer JS

/* ------------------------------------------------------------------ */
/*                     DOM READY  →  attach handler                   */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');                    // Locate <form>

  if (!form) {                                                          // Guard: form missing?
    console.warn('[login.js] No login form found, skipping initialization');
    return;                                                             // Abort early
  }

  form.addEventListener('submit', handleLogin);                         // Bind submit handler
  console.log('[login.js] DOMContentLoaded, login form initialized');
});

/* ------------------------------------------------------------------ */
/*                   Handle user login submission                      */
/* ------------------------------------------------------------------ */
async function handleLogin(event) {
  event.preventDefault();                                               // Stop default POST
  console.log('[login.js] handleLogin called');

  const emailEl    = document.getElementById('email');                  // <input type="email">
  const passwordEl = document.getElementById('password');               // <input type="password">

  if (!emailEl || !passwordEl) {                                        // Inputs missing?
    console.error('[login.js] Missing email or password inputs');
    return;
  }

  const email    = emailEl.value.trim();                                // Trimmed email
  const password = passwordEl.value;                                    // Raw password
  console.log('[login.js] Inputs:', { email, password: password ? '***' : '' });

  if (!email || !password) {                                            // Client‑side required check
    console.warn('[login.js] Missing email or password');
    alert('Email and password are required.');
    return;
  }

  try {
    console.log('[login.js] Fetching users from API');
    const res   = await fetch('http://localhost:3000/Users');           // GET all users
    const users = await res.json();                                     // Parse JSON array
    console.log('[login.js] Users fetched:', users);

    /* -------------------- Credential match ----------------------- */
    const user = users.find(u =>                                        // Find first match
      u.Email.toLowerCase() === email.toLowerCase() &&                  // Case‑insensitive email
      u.Password === password                                           // Exact password match
    );
    console.log('[login.js] Matched user:', user);

    if (!user) {                                                        // No user found
      console.error('[login.js] Invalid credentials');
      alert('Invalid credentials.');
      return;
    }

    /* -------------------- Session persistence -------------------- */
    console.log('[login.js] Login successful, storing session');
    sessionStorage.setItem('userId',   user.UserID || user.id);         // Primary ID
    sessionStorage.setItem('userName', user.Name   || user.name);       // Friendly name
    sessionStorage.setItem('userType', user.UserType.toLowerCase());    // 'admin' | 'user'
    sessionStorage.setItem('userEmail', email);                         // Email identity

    /* -------------------- Role‑based redirect -------------------- */
    const target = user.UserType.toLowerCase() === 'admin'              // Decide landing page
      ? 'adminHome.html'
      : 'userHome.html';
    console.log('[login.js] Redirecting to:', target);
    window.location.href = target;                                      // Navigate
  } catch (err) {
    console.error('[login.js] Login error:', err);
    alert('Server error. Try again later.');
  }
}

/* ------------------------------------------------------------------ */
/*                           Logout helper                            */
/* ------------------------------------------------------------------ */
function logout() {
  console.log('[login.js] Logging out user');
  sessionStorage.clear();                                               // Remove session keys
  window.location.href = 'login.html';                                  // Back to login page
}