(function () {                    // Wrap in IIFE to avoid leaking vars
  'use strict';                   // Safer JavaScript
  console.log('[trackComplaintStatus] Script loaded');

  /* ---------------------------------------------------------------- */
  /*                Retrieve logged‑in user context                   */
  /* ---------------------------------------------------------------- */
  const userEmail = sessionStorage.getItem('userEmail');        // Unique identifier
  console.log('[trackComplaintStatus] Logged‑in userEmail:', userEmail);

  /* ---------------------------------------------------------------- */
  /*                 Department ID → Name lookup table                */
  /* ---------------------------------------------------------------- */
  const deptMap = {
    1:  'Human Resources',
    2:  'Payroll and Benefits',
    3:  'Office Supplies & Admin',
    4:  'Facilities & Maintenance',
    5:  'Training and Development',
    6:  'IT Support',
    7:  'Legal & Compliance',
    8:  'Employee Relations',
    9:  'Security & Access Control',
    10: 'Travel and Reimbursements',
    0:  'Other'
  };

  /* ---------------------------------------------------------------- */
  /*                       Utility: format date                        */
  /* ---------------------------------------------------------------- */
  function formatDate(str) {
    try {
      return new Date(str).toLocaleDateString('en-GB', {          // e.g. 21 Apr 2025
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return str;                                                 // Fallback raw string
    }
  }

  /* ---------------------------------------------------------------- */
  /*               Utility: map status → bootstrap color              */
  /* ---------------------------------------------------------------- */
  function getStatusColor(status) {
    switch (status) {
      case 'Pending':     return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved':    return 'success';
      case 'Escalated':   return 'danger';
      default:            return 'secondary';
    }
  }

  /* ---------------------------------------------------------------- */
  /*                    Main renderer: build table                     */
  /* ---------------------------------------------------------------- */
  async function renderTrackTable() {
    console.log('[trackComplaintStatus] renderTrackTable called');

    const tbody = document.getElementById('complaintTableBody');   // <tbody>
    if (!tbody) {                                                  // Safety check
      console.warn('[trackComplaintStatus] Table body not found');
      return;
    }
    tbody.innerHTML = '';                                          // Clear old rows

    /* -------- Gather current filter values from UI -------------- */
    const searchTerm  = document.getElementById('searchInput')
                        ?.value.trim().toLowerCase() || '';        // Search text
    const statusFilter = document.getElementById('statusFilter')
                        ?.value || '';                             // Selected status
    console.log(`[trackComplaintStatus] Filters: search="${searchTerm}", status="${statusFilter}"`);

    try {
      /* -------- Fetch all complaints from API ------------------- */
      const response = await fetch('http://localhost:3000/Complaints');
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const allComplaints = await response.json();                 // Full list
      console.log(`[trackComplaintStatus] Total complaints fetched: ${allComplaints.length}`);

      /* -------- Narrow to current user's complaints ------------- */
      let complaints = allComplaints.filter(c =>                  // Personal subset
        c.submittedByEmail === userEmail
      );
      console.log(`[trackComplaintStatus] Complaints for user: ${complaints.length}`);

      /* -------- Apply text search filter ------------------------ */
      if (searchTerm) {
        const before = complaints.length;
        complaints = complaints.filter(c =>
          c.Title.toLowerCase().includes(searchTerm) ||            // Title match
          String(c.ComplaintID).padStart(4, '0').includes(searchTerm) // ID match
        );
        console.log(`[trackComplaintStatus] After search filter: ${complaints.length} (was ${before})`);
      }

      /* -------- Apply status dropdown filter -------------------- */
      if (statusFilter) {
        const before = complaints.length;
        complaints = complaints.filter(c => c.Status === statusFilter);
        console.log(`[trackComplaintStatus] After status filter: ${complaints.length} (was ${before})`);
      }

      /* -------- Build table rows -------------------------------- */
      for (const c of complaints) {
        const tr = document.createElement('tr');                   // New <tr>
        tr.innerHTML = `
          <td style="padding:.5rem .75rem;">#CMP${String(c.ComplaintID).padStart(4,'0')}</td>
          <td style="padding:.5rem .75rem;">${c.Title}</td>
          <td style="padding:.5rem .75rem;">${deptMap[c.DeptID] || 'Unknown'}</td>
          <td style="padding:.5rem .75rem;">
            <span class="badge bg-${getStatusColor(c.Status)}">${c.Status}</span>
          </td>
          <td style="padding:.5rem .75rem;">${formatDate(c.SubmittedOn)}</td>
          <td style="padding:.5rem .75rem;">${formatDate(c.LastUpdated)}</td>
        `;
        tbody.appendChild(tr);                                     // Append row
      }
      console.log('[trackComplaintStatus] Table populated');
    } catch (err) {
      console.error('[trackComplaintStatus] Error rendering table:', err);
    }
  }

  /* ---------------------------------------------------------------- */
  /*           Init: attach listeners & initial table draw            */
  /* ---------------------------------------------------------------- */
  (function initTrackPage() {
    console.log('[trackComplaintStatus] Initializing track complaints page');

    const searchEl = document.getElementById('searchInput');       // Search box
    const filterEl = document.getElementById('statusFilter');      // Status dropdown

    if (searchEl) {
      searchEl.addEventListener('input', renderTrackTable);        // Live search
      console.log('[trackComplaintStatus] Search input listener attached');
    } else {
      console.warn('[trackComplaintStatus] Search input not found');
    }

    if (filterEl) {
      filterEl.addEventListener('change', renderTrackTable);       // Dropdown change
      console.log('[trackComplaintStatus] Status filter listener attached');
    } else {
      console.warn('[trackComplaintStatus] Status filter not found');
    }

    renderTrackTable();                                            // First paint
  })(); // End init IIFE

})(); // End outer IIFE