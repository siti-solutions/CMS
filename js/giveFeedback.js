'use strict';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[giveFeedback.js] DOMContentLoaded');

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
      const resolved = complaints.filter(c =>
        c.submittedByEmail === userEmail && c.Status === 'Resolved'
      );
      console.log(`[giveFeedback.js] Resolved complaints count: ${resolved.length}`);

      // Reset dropdown
      selectEl.innerHTML = '<option value="">Select a resolved complaint</option>';
      resolved.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `#CMP${String(c.ComplaintID).padStart(4, '0')} – ${c.Title}`;
        selectEl.appendChild(opt);
      });
    } catch (err) {
      console.error('[giveFeedback.js] Error loading complaints:', err);
    }
  }

  loadResolvedComplaints();

  // Handle feedback submission
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

    const payload = {
      complaintId,
      rating: ratingEl.value,
      comments
    };
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
});
