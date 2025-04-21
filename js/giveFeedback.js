// js/giveFeedback.js
// ------------------
// Handles feedback submission for resolved complaints.
// Steps:
//   • On load: fetch resolved complaints for current user and populate the <select>.
//   • Validate required fields on submit.
//   • POST feedback to /Feedback endpoint.
//   • Reset form and notify user on success.

(function () {
  // Guard against the script being injected twice
  if (window._giveFeedbackInitialized) return;
  window._giveFeedbackInitialized = true;

  'use strict'; // Enforce strict mode

  console.log('[giveFeedback.js] script loaded');

  /* --------------------------------------------------------------- */
  /*                    Cache frequently‑used elements               */
  /* --------------------------------------------------------------- */
  const selectEl   = document.getElementById('complaintSelect'); // Dropdown of complaints
  const formEl     = document.getElementById('feedbackForm');    // Feedback <form>
  const commentsEl = document.getElementById('feedbackText');    // <textarea> for comments

  /* Validate markup presence */
  if (!selectEl || !formEl || !commentsEl) {
    console.error('[giveFeedback.js] Missing required form elements');
    return;
  }

  /* Logged‑in user identity */
  const userEmail = sessionStorage.getItem('userEmail');
  console.log('[giveFeedback.js] Retrieved userEmail:', userEmail);

  /* ---------------------------------------------------------------- */
  /*              Load resolved complaints for current user           */
  /* ---------------------------------------------------------------- */
  async function loadResolvedComplaints() {
    try {
      // Fetch every complaint on the server
      const res = await fetch('http://localhost:3000/Complaints');
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

      const complaints = await res.json(); // Parse JSON array
      console.log('[giveFeedback.js] All complaints:', complaints);

      // Filter to complaints submitted by this user *and* resolved
      const resolved = complaints.filter(c =>
        c.submittedByEmail === userEmail &&
        ((c.Status || c.status || '').toLowerCase() === 'resolved')
      );
      console.log(`[giveFeedback.js] Resolved complaints count: ${resolved.length}`);

      /* Build <option> list */
      selectEl.innerHTML = '<option value="">Select a resolved complaint</option>';
      resolved.forEach(c => {
        const complaintNum = c.ComplaintID ?? c.complaintID ?? c.id;   // Fallbacks
        const titleText    = c.Title ?? c.title ?? 'No Title';

        const opt   = document.createElement('option');
        opt.value   = c.id;                                            // Primary key
        opt.textContent = `#CMP${String(complaintNum).padStart(4, '0')} – ${titleText}`;
        selectEl.appendChild(opt);
      });
    } catch (err) {
      console.error('[giveFeedback.js] Error loading complaints:', err);
    }
  }

  loadResolvedComplaints(); // Kick off load on script init

  /* ---------------------------------------------------------------- */
  /*                    Handle feedback submission                    */
  /* ---------------------------------------------------------------- */
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();                       // Prevent normal form POST
    formEl.classList.add('was-validated');    // Bootstrap validation state

    /* Gather form values */
    const complaintId = selectEl.value;                       // Selected complaint
    const ratingEl    = formEl.querySelector('input[name="rating"]:checked'); // Selected rating
    const comments    = commentsEl.value.trim();              // Comment text

    /* Basic client‑side validation */
    if (!complaintId || !ratingEl || !comments) {
      console.warn('[giveFeedback.js] Validation failed: missing fields');
      return;
    }

    /* Build requestBody for API */
    const requestBody = {
      complaintId,
      rating  : ratingEl.value,
      comments
    };
    console.log('[giveFeedback.js] Submitting feedback:', requestBody);

    try {
      /* POST feedback */
      await fetch('http://localhost:3000/Feedback', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(requestBody)
      });
      alert('Thank you for your feedback!');   // Notify user
      formEl.reset();                         // Reset form
      formEl.classList.remove('was-validated');
    } catch (error) {
      console.error('[giveFeedback.js] Error submitting feedback:', error);
      alert('Failed to submit feedback.');     // Notify failure
    }
  });
})();