

// js/complaintType.js

'use strict';

const apiUrl = 'http://localhost:3000/ComplaintTypes';
let types = [];
let editId = null;
let sortAsc = true;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('complaintForm');
  const typeInput = document.getElementById('complaintType');
  const severityInput = document.getElementById('complaintSeverity');
  const submitBtn = document.getElementById('submit');
  const table = document.querySelector('table');
  const tableBody = document.getElementById('complaintTableBody');

  // Insert search box
  const searchContainer = document.createElement('div');
  searchContainer.className = 'mb-3';
  searchContainer.innerHTML = `<input id="searchInput" type="text" class="form-control" placeholder="Search by type...">`;
  table.parentNode.insertBefore(searchContainer, table);

  document.getElementById('searchInput').addEventListener('input', () => {
    const term = document.getElementById('searchInput').value.trim().toLowerCase();
    renderTable(types.filter(t => t.ComplaintType.toLowerCase().includes(term)));
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    const payload = {
      ComplaintType: typeInput.value.trim(),
      severity: severityInput.value
    };
    try {
      if (editId) {
        await fetch(`${apiUrl}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      resetForm();
      loadTypes();
    } catch (err) {
      console.error('[complaintType.js] Error saving type:', err);
    }
  });

  document.querySelector('th:nth-child(2)').style.cursor = 'pointer';
  document.querySelector('th:nth-child(2)').addEventListener('click', () => {
    sortAsc = !sortAsc;
    const sorted = [...types].sort((a, b) =>
      a.severity.localeCompare(b.severity) * (sortAsc ? 1 : -1)
    );
    renderTable(sorted);
  });

  loadTypes();
});

async function loadTypes() {
  try {
    const res = await fetch(apiUrl);
    types = await res.json();
    renderTable(types);
  } catch (err) {
    console.error('[complaintType.js] Error loading types:', err);
  }
}

function renderTable(list) {
  const tbody = document.getElementById('complaintTableBody');
  tbody.innerHTML = '';
  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.ComplaintType}</td>
      <td>${item.severity}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${item.id}">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${item.id}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  attachRowListeners();
}

function attachRowListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = async () => {
      editId = btn.dataset.id;
      const res = await fetch(`${apiUrl}/${editId}`);
      const data = await res.json();
      document.getElementById('complaintType').value = data.ComplaintType;
      document.getElementById('complaintSeverity').value = data.severity;
      document.getElementById('submit').textContent = 'Update';
    };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this type?')) return;
      const id = btn.dataset.id;
      try {
        await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
        loadTypes();
      } catch (err) {
        console.error('[complaintType.js] Error deleting type:', err);
      }
    };
  });
}

function resetForm() {
  const form = document.getElementById('complaintForm');
  form.reset();
  form.classList.remove('was-validated');
  editId = null;
  document.getElementById('submit').textContent = 'Add';
}