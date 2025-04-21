/**
 * adminDashboard.js
 * -----------------
 * Handles:
 *  • Fetching complaints and department data from the backend.
 *  • Computing and displaying dashboard KPI counts.
 *  • Rendering dynamic charts (Pie & Bar) via Chart.js.
 *  • Building a paginated, filterable complaints table with in‑line status updates.
 *  • Responsive calculation of rows per page based on available table height.
 */
'use strict'; // Enable strict mode for safer JavaScript execution

/* ---------- Pagination State ---------- */
var currentPage = 1; // Tracks the current page number in the complaints table

/**
 * Calculate how many rows fit in the visible table area.
 * Rows per page depend on the container's height and an estimated row height.
 */
function getPageSize() { // Determine rows per page dynamically
  const tableWrapper = document.getElementById('complaintRows').parentElement; // Container around <tbody>
  const rowHeight = 48; // Approximate pixel height of one <tr>
  const availableHeight = tableWrapper.clientHeight; // Total vertical space available for rows
  return Math.max(7, Math.floor(availableHeight / rowHeight)); // Always show at least 7 rows
}

/* ---------- Pagination Button IDs ---------- */
var prevBtnId = 'prevPage'; // ID of the "previous" page button
var nextBtnId = 'nextPage'; // ID of the "next" page button

/* ---------- Main Bootstrap ---------- */
initDashboard(); // Kick off initialization immediately after script load

/**
 * Initialize dashboard:
 *  • Populates KPI cards and charts.
 *  • Renders the complaints table.
 *  • Hooks up search, status filter, and pagination events.
 */
async function initDashboard() { // Entry point for page setup
  await updateCountsAndCharts(); // Load data and draw charts
  renderComplaintTable();        // Build the table for the first time

  /* ---- Live Search Filter ---- */
  document.getElementById('searchInput') // Text box for searching complaints
    .addEventListener('input', () => {   // Re-render table on every keystroke
      currentPage = 1;                   // Reset to first page when searching
      renderComplaintTable();            // Update table rows
    });

  /* ---- Status Dropdown Filter ---- */
  document.getElementById('statusFilter') // <select> element for status
    .addEventListener('change', () => {   // When user picks a status…
      currentPage = 1;                    // Reset pagination
      renderComplaintTable();             // Update table rows
    });

  /* ---- Previous Page Button ---- */
  document.getElementById(prevBtnId).addEventListener('click', e => {
    e.preventDefault();   // Keep the page from navigating
    if (currentPage > 1) { // Only move if not already on page 1
      currentPage--;       // Decrement page number
      renderComplaintTable(); // Refresh table contents
    }
  });

  /* ---- Next Page Button ---- */
  document.getElementById(nextBtnId).addEventListener('click', e => {
    e.preventDefault();   // Prevent link navigation
    currentPage++;        // Increment page number
    renderComplaintTable(); // Refresh table contents
  });
}

/* ======================================================================== */
/*                             Data Fetching                                */
/* ======================================================================== */

/**
 * Fetch the lists of complaints and departments in parallel.
 * Returns empty arrays if a network error occurs.
 */
async function fetchData() {
  try {
    // Perform parallel API requests for better performance
    const [complaintsRes, departmentsRes] = await Promise.all([
      fetch('http://localhost:3000/Complaints'),  // Endpoint for complaints
      fetch('http://localhost:3000/Departments')  // Endpoint for departments
    ]);

    // Throw an error if either request fails (non‑2xx HTTP status)
    if (!complaintsRes.ok || !departmentsRes.ok) {
      throw new Error(`Fetch error: Complaints (${complaintsRes.status}), Departments (${departmentsRes.status})`);
    }

    // Parse the JSON bodies
    const complaints = await complaintsRes.json();   // Array of complaint objects
    const departments = await departmentsRes.json(); // Array of department objects
    return { complaints, departments };              // Return both datasets
  } catch (error) {
    console.error('[adminDashboard.js] fetchData error:', error); // Debug logging
    return { complaints: [], departments: [] }; // Provide safe fallbacks
  }
}

/* ======================================================================== */
/*                       KPI Counts & Chart Rendering                       */
/* ======================================================================== */

/**
 * Update KPI cards and redraw charts based on the latest data.
 */
async function updateCountsAndCharts() {
  console.log('[adminDashboard.js] updateCountsAndCharts executing...');
  const { complaints, departments } = await fetchData(); // Get fresh data

  /* ---- KPI Cards ---- */
  document.getElementById('totalCount').innerText     = complaints.length;                                      // Total complaints
  document.getElementById('resolvedCount').innerText  = complaints.filter(c => c.Status === 'Resolved').length; // Resolved complaints
  document.getElementById('pendingCount').innerText   = complaints.filter(c => c.Status === 'Pending').length;  // Pending complaints
  document.getElementById('escalatedCount').innerText = complaints.filter(c => c.Status === 'Escalated').length;// Escalated complaints

  /* ---- Build Helper Maps ---- */
  const deptMap = {};                    // Lookup: DeptID -> Name
  departments.forEach(d => {             // Translate dept IDs to names
    deptMap[d.DeptID] = d.Name;          // Populate lookup table
  });

  /* ---- Complaints per Department ---- */
  const deptCount = {};                              // { 'IT': 5, 'HR': 3, … }
  complaints.forEach(c => {                          // Count for each complaint
    const name = deptMap[c.DeptID] || 'Unknown';     // Default to 'Unknown'
    deptCount[name] = (deptCount[name] || 0) + 1;    // Increment tally
  });
  renderPieChart(deptCount);                         // Draw department pie chart

  /* ---- Complaints per Status ---- */
  const statusCount = {};                            // { 'Pending': 4, … }
  complaints.forEach(c => {                          // Count for each complaint
    const s = c.Status || 'Unknown';                 // Default to 'Unknown'
    statusCount[s] = (statusCount[s] || 0) + 1;      // Increment tally
  });
  renderBarChart(statusCount);                       // Draw status bar chart
}

/* ---------- Chart Helpers ---------- */

/**
 * Draw pie chart for complaints distribution by department.
 * @param {Object} dataObj – keys = department names, values = counts
 */
function renderPieChart(dataObj) {
  const ctx = document.getElementById('deptChart').getContext('2d'); // Canvas context
  new Chart(ctx, {                           // eslint-disable-line no-undef
    type: 'pie',                             // Pie chart
    data: {
      labels: Object.keys(dataObj),          // Department names
      datasets: [{
        data: Object.values(dataObj),        // Corresponding counts
        backgroundColor: generateColors(Object.keys(dataObj).length) // Distinct colors
      }]
    },
    options: {
      maintainAspectRatio: false,            // Fill the parent element
      aspectRatio: 2,                        // Preferred aspect ratio
      responsive: true,                      // Re‑draw on resize
      plugins: {
        legend: { position: 'left', align: 'start' },              // Legend position
        title: { display: true, text: 'Complaints by Department' } // Chart title
      },
      layout: { padding: { left: 20 } }      // Add some left padding
    }
  });
}

/**
 * Draw bar chart for complaints distribution by status.
 * @param {Object} dataObj – keys = status values, values = counts
 */
function renderBarChart(dataObj) {
  const ctx = document.getElementById('statusChart').getContext('2d'); // Canvas context
  new Chart(ctx, {                           // eslint-disable-line no-undef
    type: 'bar',                             // Bar chart
    data: {
      labels: Object.keys(dataObj),          // Status names
      datasets: [{
        label: 'Complaints',                 // Dataset label
        data: Object.values(dataObj),        // Corresponding counts
        backgroundColor: 'rgba(54, 162, 235, 0.6)' // Semi‑transparent blue
      }]
    },
    options: {
      plugins: { title: { display: true, text: 'Complaints by Status' } }, // Chart title
      scales: { y: { beginAtZero: true } }, // Y‑axis starts at zero
      responsive: true                      // Re‑draw on resize
    }
  });
}

/**
 * Generate an array of visually distinct blue‑hued colors.
 * @param {number} n – Number of colors needed
 * @returns {string[]} – Hex color codes
 */
function generateColors(n) {
  const base = [
    '#cce5ff', '#99ccff', '#66b2ff', '#80d4ff', '#b3ecff',
    '#99e6ff', '#80dfff', '#66d9ff', '#4dd2ff', '#33ccff'
  ];
  return Array.from({ length: n }, (_, i) => base[i % base.length]); // Cycle base palette
}

/* ======================================================================== */
/*                          Complaints Table                                */
/* ======================================================================== */

/**
 * Build the complaints table according to search text, status filter,
 * and current pagination state. Also wires up in‑table status updates.
 */
async function renderComplaintTable() {
  const { complaints } = await fetchData(); // Refresh data every render

  /* ---- Gather Filter Values ---- */
  const search       = document.getElementById('searchInput').value.trim().toLowerCase(); // Text search value
  const statusFilter = document.getElementById('statusFilter').value;                     // Selected status value

  /* ---- Apply Search Filter ---- */
  let items = complaints; // Start with all complaints
  if (search) {           // If user typed something…
    items = items.filter(c =>
      c.Title.toLowerCase().includes(search) ||                     // Match title
      String(c.ComplaintID).padStart(4, '0').includes(search)       // Match zero‑padded ID
    );
  }

  /* ---- Apply Status Filter ---- */
  if (statusFilter) {                 // If a particular status is selected…
    items = items.filter(c => c.Status === statusFilter); // Keep only matching status
  }

  /* ---- Pagination Calculations ---- */
  const pageSize   = getPageSize();                            // Rows per page
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize)); // Ensure at least 1 page
  if (currentPage > totalPages) currentPage = totalPages;      // Clamp currentPage within range

  /* ---- Pagination Button States ---- */
  const prevLi = document.getElementById(prevBtnId); // Previous button element
  const nextLi = document.getElementById(nextBtnId); // Next button element
  if (prevLi) prevLi.classList.toggle('disabled', currentPage === 1);          // Disable prev on first page
  if (nextLi) nextLi.classList.toggle('disabled', currentPage === totalPages); // Disable next on last page

  /* ---- Determine Slice for Current Page ---- */
  const start     = (currentPage - 1) * pageSize; // Index of first item on current page
  const pageItems = items.slice(start, start + pageSize); // Items to display

  /* ---- Build Table Body ---- */
  const tbody = document.getElementById('complaintRows'); // <tbody> element
  tbody.innerHTML = '';                                    // Clear existing rows
  pageItems.forEach(c => {
    const tr = document.createElement('tr');              // New <tr> element
    tr.innerHTML = `
      <td style="padding:.5rem .75rem;">#CMP${String(c.ComplaintID).padStart(4, '0')}</td>
      <td style="padding:.5rem .75rem;">${c.Title}</td>
      <td style="padding:.5rem .75rem;">${c.submittedByName || c.submittedByEmail || 'Unknown'}</td>
      <td style="padding:.5rem .75rem;">
        <select class="form-select form-select-sm status-dropdown" data-id="${c.id}" style="padding:.25rem .5rem; border:none; box-shadow:none;">
          <option value="Submitted"${c.Status==='Submitted' ? ' selected' : ''}>Submitted</option>
          <option value="Pending"${  c.Status==='Pending'   ? ' selected' : ''}>Pending</option>
          <option value="Resolved"${ c.Status==='Resolved'  ? ' selected' : ''}>Resolved</option>
          <option value="Escalated"${c.Status==='Escalated' ? ' selected' : ''}>Escalated</option>
        </select>
      </td>
      <td style="padding:.5rem .75rem;">${formatDate(c.LastUpdated)}</td>
    `; // HTML string for row
    tbody.appendChild(tr); // Add row to the table
  });

  /* ---- In‑table Status Update Handler ---- */
  document.querySelectorAll('.status-dropdown').forEach(select => {
    select.addEventListener('change', async function() {
      const id        = this.dataset.id; // Complaint primary ID
      const newStatus = this.value;      // New status chosen by user

      // Send PATCH request to backend with updated status & timestamp
      await fetch(`http://localhost:3000/Complaints/${id}`, {
        method : 'PATCH',
        headers: { 'Content-Type':'application/json' },
        body   : JSON.stringify({
          Status      : newStatus,
          LastUpdated : new Date().toISOString().split('T')[0] // YYYY‑MM‑DD
        })
      });

      await updateCountsAndCharts(); // Update KPI cards & charts after change
    });
  });

  /* ---- Numeric Pagination Links ---- */
  const pagContainer = document.getElementById('tablePagination'); // <ul> container
  pagContainer.innerHTML = '';                                     // Clear old links
  for (let i = 1; i <= totalPages; i++) {                          // One <li> per page
    const li = document.createElement('li');                       // Create <li>
    li.className = 'page-item' + (i === currentPage ? ' active' : ''); // Add 'active' class
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;       // Page number link
    li.addEventListener('click', e => {                            // Pagination click handler
      e.preventDefault();                                          // Prevent navigation
      currentPage = i;                                             // Set new current page
      renderComplaintTable();                                      // Re-render table
    });
    pagContainer.appendChild(li);                                  // Insert into pagination <ul>
  }
}

/* ======================================================================== */
/*                             Utility Functions                            */
/* ======================================================================== */

/**
 * Convert an ISO YYYY-MM-DD date string to "DD MMM YYYY" format.
 * @param {string} str – ISO date string
 * @returns {string} – Human‑readable date (e.g., "21 Apr 2025")
 */
function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', {
    day  : '2-digit',
    month: 'short',
    year : 'numeric'
  });
}