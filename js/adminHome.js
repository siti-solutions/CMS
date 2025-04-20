 'use strict';
 
let currentPage = 1;
const pageSize = 10;
const prevBtnId = 'prevPage';
const nextBtnId = 'nextPage';

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

async function initDashboard() {
  await updateCountsAndCharts();
  await renderComplaintTable();
  document.getElementById('searchInput').addEventListener('input', renderComplaintTable);
  document.getElementById('statusFilter').addEventListener('change', renderComplaintTable);
}

async function fetchData() { 
  const [complaintsRes, departmentsRes] = await Promise.all([
    fetch('http://localhost:3000/Complaints'),
    fetch('http://localhost:3000/Departments')
  ]);
  const complaints = await complaintsRes.json();
  const departments = await departmentsRes.json();
  return { complaints, departments };
}

async function updateCountsAndCharts() {
  const { complaints, departments } = await fetchData();

  const total = complaints.length;
  const resolved = complaints.filter(c => c.Status === 'Resolved').length;
  const pending = complaints.filter(c => c.Status === 'Pending').length;
  const escalated = complaints.filter(c => c.Status === 'Escalated').length;

  document.getElementById('totalCount').innerText = total;
  document.getElementById('resolvedCount').innerText = resolved;
  document.getElementById('pendingCount').innerText = pending;
  document.getElementById('escalatedCount').innerText = escalated;

  const deptMap = {};
  departments.forEach(d => { deptMap[d.DeptID] = d.Name; });

  const deptCount = {};
  complaints.forEach(c => {
    const name = deptMap[c.DeptID] || 'Unknown';
    deptCount[name] = (deptCount[name] || 0) + 1;
  });
  renderPieChart(deptCount);

  const statusCount = {};
  complaints.forEach(c => {
    const s = c.Status || 'Unknown';
    statusCount[s] = (statusCount[s] || 0) + 1;
  });
  renderBarChart(statusCount);
}

function renderPieChart(dataObj) {
  const ctx = document.getElementById('deptChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(dataObj),
      datasets: [{
        data: Object.values(dataObj),
        backgroundColor: generateColors(Object.keys(dataObj).length)
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Complaints by Department' }
      },
      responsive: true
    }
  });
}

function renderBarChart(dataObj) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(dataObj),
      datasets: [{
        label: 'Complaints',
        data: Object.values(dataObj),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      plugins: {
        title: { display: true, text: 'Complaints by Status' }
      },
      scales: { y: { beginAtZero: true } },
      responsive: true
    }
  });
}

function generateColors(n) {
  const base = ['#cce5ff','#99ccff','#66b2ff','#80d4ff','#b3ecff','#99e6ff','#80dfff','#66d9ff','#4dd2ff','#33ccff'];
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

async function renderComplaintTable() {
  const { complaints, departments } = await fetchData();

  const deptMap = {};
  departments.forEach(d => { deptMap[d.DeptID] = d.Name; });

  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  let items = complaints;
  if (search) {
    items = items.filter(c =>
      c.Title.toLowerCase().includes(search) ||
      String(c.ComplaintID).padStart(4, '0').includes(search)
    );
  }
  if (statusFilter) {
    items = items.filter(c => c.Status === statusFilter);
  }
  const totalPages = Math.ceil(items.length / pageSize) || 1;
  // Ensure currentPage is within bounds
  if (currentPage > totalPages) currentPage = totalPages;
  // Configure arrow buttons
  const prevLi = document.getElementById(prevBtnId);
  const nextLi = document.getElementById(nextBtnId);
  if (prevLi) {
    prevLi.classList.toggle('disabled', currentPage === 1);
    prevLi.onclick = e => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        renderComplaintTable();
      }
    };
  }
  if (nextLi) {
    nextLi.classList.toggle('disabled', currentPage === totalPages);
    nextLi.onclick = e => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        renderComplaintTable();
      }
    };
  }
  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const tbody = document.getElementById('complaintRows');
  tbody.innerHTML = '';

  pageItems.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>#CMP${String(c.ComplaintID).padStart(4, '0')}</td>
      <td>${c.Title}</td>
      <td>
        <select class="form-select form-select-sm status-dropdown" data-id="${c.id}">
          <option value="Submitted" ${c.Status==='Submitted'?'selected':''}>Submitted</option>
          <option value="Pending" ${c.Status==='Pending'?'selected':''}>Pending</option>
          <option value="Resolved" ${c.Status==='Resolved'?'selected':''}>Resolved</option>
          <option value="Escalated" ${c.Status==='Escalated'?'selected':''}>Escalated</option>
        </select>
      </td>
      <td>${formatDate(c.LastUpdated)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Attach status change handlers
  document.querySelectorAll('.status-dropdown').forEach(select => {
    select.addEventListener('change', async function() {
      const id = this.getAttribute('data-id');
      const newStatus = this.value;
      try {
        const res = await fetch(`http://localhost:3000/Complaints/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Status: newStatus,
            LastUpdated: new Date().toISOString().split('T')[0]
          })
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        console.log(`[AdminHome.js] Updated status for ${id} -> ${newStatus}`);
        // window.location.reload();
      } catch (err) {
        console.error('[AdminHome.js] Error updating status:', err);
      }
    });
  });
  const pagContainer = document.getElementById('tablePagination');
  pagContainer.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item' + (i === currentPage ? ' active' : '');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', e => {
      e.preventDefault();
      currentPage = i;
      renderComplaintTable();
    });
    pagContainer.appendChild(li);
  }
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}