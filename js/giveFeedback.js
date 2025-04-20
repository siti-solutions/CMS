(function () {
  if (window._giveFeedbackInitialized) return;
  window._giveFeedbackInitialized = true;
  'use strict';
  console.log('[giveFeedback.js] script loaded');
  const selectEl = document.getElementById('complaintSelect');
  const formEl = document.getElementById('feedbackForm');
  const commentsEl = document.getElementById('feedbackText');

  if (!selectEl || !formEl || !commentsEl) {
    console.error('[giveFeedback.js] Missing required form elements');
    return;
  }

  const userEmail = sessionStorage.getItem('userEmail');
  console.log('[giveFeedback.js] Retrieved userEmail:', userEmail);

  // Load resolved complaints for this user
  async function loadResolvedComplaints() {
    try {
      const res = await fetch('http://localhost:3000/Complaints');
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const complaints = await res.json();
      console.log('[giveFeedback.js] All complaints:', complaints);

      const resolved = complaints.filter(c =>
        c.submittedByEmail === userEmail &&
        ((c.Status || c.status || '').toLowerCase() === 'resolved')
      );
      console.log(`[giveFeedback.js] Resolved complaints count: ${resolved.length}`);

      selectEl.innerHTML = '<option value="">Select a resolved complaint</option>';
      resolved.forEach(c => {
        const complaintNum = c.ComplaintID ?? c.complaintID ?? c.id;
        const titleText = c.Title ?? c.title ?? 'No Title';
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `#CMP${String(complaintNum).padStart(4, '0')} – ${titleText}`;
        selectEl.appendChild(opt);
      });
    } catch (err) {
      console.error('[giveFeedback.js] Error loading complaints:', err);
    }
  }

  loadResolvedComplaints();
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    formEl.classList.add('was-validated');

    const complaintId = selectEl.value;
    const ratingEl = formEl.querySelector('input[name="rating"]:checked');
    const comments = commentsEl.value.trim();

    if (!complaintId || !ratingEl || !comments) {
      console.warn('[giveFeedback.js] Validation failed: missing fields');
      return;
    }

    const payload = { complaintId, rating: ratingEl.value, comments };
    console.log('[giveFeedback.js] Submitting feedback:', payload);

    try {
      await fetch('http://localhost:3000/Feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Thank you for your feedback!');
      formEl.reset();
      formEl.classList.remove('was-validated');
    } catch (error) {
      console.error('[giveFeedback.js] Error submitting feedback:', error);
      alert('Failed to submit feedback.');
    }
  });
})();