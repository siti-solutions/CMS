/**
 * complaintType.js
 * ----------------
 * CRUD + UI logic for Complaint Types master table.
 * Features:
 *  • Fetch, create, update, delete complaint types via json‑server REST API.
 *  • Client‑side search, sort (by severity), inline edit/delete buttons.
 *  • Simple Bootstrap 5 validation and dynamic form label switching.
 */

'use strict'; // Enforce strict mode

/* ------------------------------------------------------------------ */
/*                            Globals                                 */
/* ------------------------------------------------------------------ */

const apiUrl = 'http://localhost:3000/ComplaintTypes'; // REST endpoint root
let types   = [];   // Holds list fetched from server
let editId  = null; // Currently edited row's primary id (null ⇒ creating)
let sortAsc = true; // Sort direction toggle for severity column

/* ------------------------------------------------------------------ */
/*                   DOM Ready → bootstrap UI                         */
/* ------------------------------------------------------------------ */

document.addEventListener('DOMContentLoaded', () => {
  /* ------------ Cache frequently used DOM elements ---------------- */
  const form          = document.getElementById('complaintForm');     // <form>
  const typeInput     = document.getElementById('complaintType');     // <input>
  const severityInput = document.getElementById('complaintSeverity'); // <select>
  const submitBtn     = document.getElementById('submit');            // <button>
  const table         = document.querySelector('table');              // <table>
  const tableBody     = document.getElementById('complaintTableBody'); // <tbody>

  /* ------------ Inject search box just above the table ------------ */
  const searchContainer      = document.createElement('div');
  searchContainer.className  = 'mb-3';
  searchContainer.innerHTML  =
    `<input id="searchInput" type="text" class="form-control" placeholder="Search by type...">`;
  table.parentNode.insertBefore(searchContainer, table); // Insert into DOM

  /* ---- Live search: filter list on every keystroke ---------------- */
  document.getElementById('searchInput').addEventListener('input', () => {
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    renderTable(types.filter(t => t.ComplaintType.toLowerCase().includes(term)));
  });

  /* ---- Form submit: create or update ----------------------------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();                  // Do not reload page
    if (!form.checkValidity()) {         // Bootstrap validation
      form.classList.add('was-validated');
      return;
    }

    /* Build requestBody ------------------------------------------------- */
    const requestBody = {
      ComplaintType: typeInput.value.trim(),
      severity     : severityInput.value
    };

    try {
      if (editId) { /* ---------- UPDATE existing ------------------- */
        await fetch(`${apiUrl}/${editId}`, {
          method : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(requestBody)
        });
      } else {      /* ---------- CREATE new ------------------------ */
        await fetch(apiUrl, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(requestBody)
        });
      }
      resetForm();  // Clear form / reset state
      loadTypes();  // Refresh table
    } catch (err) {
      console.error('[complaintType.js] Error saving type:', err);
    }
  });

  /* ---- Severity column sort toggle ------------------------------- */
  const severityTh = document.querySelector('th:nth-child(2)'); // 2nd <th>
  severityTh.style.cursor = 'pointer';                          // Indicate clickable
  severityTh.addEventListener('click', () => {
    sortAsc = !sortAsc; // Flip sort order
    const sorted = [...types].sort((a, b) =>
      a.severity.localeCompare(b.severity) * (sortAsc ? 1 : -1)
    );
    renderTable(sorted);
  });

  /* ---- Initial load ---------------------------------------------- */
  loadTypes();
});

/* ------------------------------------------------------------------ */
/*                    Fetch & render functions                        */
/* ------------------------------------------------------------------ */

/**
 * Load types from API, then render
 */
async function loadTypes() {
  try {
    const res   = await fetch(apiUrl); // GET /ComplaintTypes
    types       = await res.json();    // Update global list
    renderTable(types);                // Draw table
  } catch (err) {
    console.error('[complaintType.js] Error loading types:', err);
  }
}

/**
 * Render given list of types into <tbody>
 * @param {Array<Object>} list – subset to display
 */
function renderTable(list) {
  const tbody = document.getElementById('complaintTableBody');
  tbody.innerHTML = ''; // Clear previous rows

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.ComplaintType}</td>
      <td>${item.severity}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 edit-btn"
                data-id="${item.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-btn"
                data-id="${item.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachRowListeners(); // Attach click handlers after rows exist
}

/* ------------------------------------------------------------------ */
/*                  Row‑level edit/delete handlers                     */
/* ------------------------------------------------------------------ */

function attachRowListeners() {
  /* ------------ Edit buttons -------------------------------------- */
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = async () => {
      editId = btn.dataset.id;                      // Store id of row being edited
      const res  = await fetch(`${apiUrl}/${editId}`); // GET single record
      const data = await res.json();
      /* Populate form with existing values ------------------------- */
      document.getElementById('complaintType').value     = data.ComplaintType;
      document.getElementById('complaintSeverity').value = data.severity;
      document.getElementById('submit').textContent      = 'Update'; // Change button text
    };
  });

  /* ------------ Delete buttons ------------------------------------ */
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this type?')) return;      // Confirm delete
      const id = btn.dataset.id;
      try {
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE' }); // DELETE request
        loadTypes();                                         // Refresh table
      } catch (err) {
        console.error('[complaintType.js] Error deleting type:', err);
      }
    };
  });
}

/* ------------------------------------------------------------------ */
/*                           Utilities                                */
/* ------------------------------------------------------------------ */

/**
 * Reset form to pristine "Add" state.
 */
function resetForm() {
  const form = document.getElementById('complaintForm');
  form.reset();                                         // Clear fields
  form.classList.remove('was-validated');               // Remove validation styles
  editId = null;                                        // Back to create mode
  document.getElementById('submit').textContent = 'Add';// Reset button label
}