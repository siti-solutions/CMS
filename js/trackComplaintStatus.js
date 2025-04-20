(function() {
  'use strict';
  console.log('[trackComplaintStatus] Script loaded');

  // Retrieve logged-in user email
  const userEmail = sessionStorage.getItem('userEmail');
  console.log('[trackComplaintStatus] Logged-in userEmail:', userEmail);

  // Department ID → Name map
  const deptMap = {
    1: "Human Resources",
    2: "Payroll and Benefits",
    3: "Office Supplies & Admin",
    4: "Facilities & Maintenance",
    5: "Training and Development",
    6: "IT Support",
    7: "Legal & Compliance",
    8: "Employee Relations",
    9: "Security & Access Control",
    10: "Travel and Reimbursements",
    0: "Other"
  };

  // Helper to format dates
  function formatDate(str) {
    try {
      return new Date(str).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return str;
    }
  }

  // Helper to pick badge color
  function getStatusColor(status) {
    switch (status) {
      case 'Pending':     return 'warning';
      case 'In Progress': return 'info';
      case 'Resolved':    return 'success';
      case 'Escalated':   return 'danger';
      default:            return 'secondary';
    }
  }

  // Main renderer
  async function renderTrackTable() {
    console.log('[trackComplaintStatus] renderTrackTable called');

    const tbody = document.getElementById('complaintTableBody');
    if (!tbody) {
      console.warn('[trackComplaintStatus] Table body not found');
      return;
    }
    tbody.innerHTML = '';

    // Get current filter values
    const searchTerm = document.getElementById('searchInput')?.value.trim().toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    console.log(`[trackComplaintStatus] Filters: search="${searchTerm}", status="${statusFilter}"`);

    try {
      const response = await fetch('http://localhost:3000/Complaints');
      if (!response.ok) throw new Error(`Fetch error: ${response.status}`);
      const allComplaints = await response.json();
      console.log(`[trackComplaintStatus] Total complaints fetched: ${allComplaints.length}]`);

      // Filter by logged-in user email
      let complaints = allComplaints.filter(c => c.submittedByEmail === userEmail);
      console.log(`[trackComplaintStatus] Complaints for user: ${complaints.length}]`);

      // Apply search filter
      if (searchTerm) {
        const before = complaints.length;
        complaints = complaints.filter(c =>
          c.Title.toLowerCase().includes(searchTerm) ||
          String(c.ComplaintID).padStart(4, '0').includes(searchTerm)
        );
        console.log(`[trackComplaintStatus] After search filter: ${complaints.length} (was ${before})]`);
      }

      // Apply status filter
      if (statusFilter) {
        const before = complaints.length;
        complaints = complaints.filter(c => c.Status === statusFilter);
        console.log(`[trackComplaintStatus] After status filter: ${complaints.length} (was ${before})]`);
      }

      // Populate table rows
      for (const c of complaints) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#CMP${String(c.ComplaintID).padStart(4, '0')}</td>
          <td>${c.Title}</td>
          <td>${deptMap[c.DeptID] || 'Unknown'}</td>
          <td><span class="badge bg-${getStatusColor(c.Status)}">${c.Status}</span></td>
          <td>${formatDate(c.SubmittedOn)}</td>
          <td>${formatDate(c.LastUpdated)}</td>
        `;
        tbody.appendChild(tr);
      }
      console.log('[trackComplaintStatus] Table populated');
    } catch (err) {
      console.error('[trackComplaintStatus] Error rendering table:', err);
    }
  }

  // Attach listeners and initial draw immediately
  (function initTrackPage() {
    console.log('[trackComplaintStatus] Initializing track complaints page');
    const searchEl = document.getElementById('searchInput');
    const filterEl = document.getElementById('statusFilter');

    if (searchEl) {
      searchEl.addEventListener('input', renderTrackTable);
      console.log('[trackComplaintStatus] Search input listener attached');
    } else {
      console.warn('[trackComplaintStatus] Search input not found');
    }

    if (filterEl) {
      filterEl.addEventListener('change', renderTrackTable);
      console.log('[trackComplaintStatus] Status filter listener attached');
    } else {
      console.warn('[trackComplaintStatus] Status filter not found');
    }

    renderTrackTable();
  })();

})();