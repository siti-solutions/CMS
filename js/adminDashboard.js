'use strict';

var currentPage = 1;

/**
 * Compute how many rows fit in the available table container.
 */
function getPageSize() {
  const tableWrapper = document.getElementById('complaintRows').parentElement;
  const rowHeight = 48; // approximate height of one <tr>
  const availableHeight = tableWrapper.clientHeight;
  return Math.max(7, Math.floor(availableHeight / rowHeight));
}

var prevBtnId = 'prevPage';
var nextBtnId = 'nextPage';


initDashboard();

async function initDashboard() {
  await updateCountsAndCharts();
  renderComplaintTable();
  document.getElementById('searchInput')
    .addEventListener('input', () => { currentPage = 1; renderComplaintTable(); });
  document.getElementById('statusFilter')
    .addEventListener('change', () => { currentPage = 1; renderComplaintTable(); });
    
  document.getElementById(prevBtnId).addEventListener('click', e => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      renderComplaintTable();
    }
  });
  document.getElementById(nextBtnId).addEventListener('click', e => {
    e.preventDefault();
    currentPage++;
    renderComplaintTable();
  });
}

async function fetchData() {
  try {
    const [complaintsRes, departmentsRes] = await Promise.all([
      fetch('http://localhost:3000/Complaints'),
      fetch('http://localhost:3000/Departments')
    ]);

    if (!complaintsRes.ok || !departmentsRes.ok) {
      throw new Error(`Fetch error: Complaints (${complaintsRes.status}), Departments (${departmentsRes.status})`);
    }

    const complaints = await complaintsRes.json();
    const departments = await departmentsRes.json();
    return { complaints, departments };
  } catch (error) {
    console.error('[adminDashboard.js] fetchData error:', error);
    return { complaints: [], departments: [] };
  }
}

async function updateCountsAndCharts() {
  console.log('[adminDashboard.js] updateCountsAndCharts executing...');
  const { complaints, departments } = await fetchData();

  document.getElementById('totalCount').innerText = complaints.length;
  document.getElementById('resolvedCount').innerText = complaints.filter(c => c.Status === 'Resolved').length;
  document.getElementById('pendingCount').innerText = complaints.filter(c => c.Status === 'Pending').length;
  document.getElementById('escalatedCount').innerText = complaints.filter(c => c.Status === 'Escalated').length;

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
    data: { labels: Object.keys(dataObj), datasets: [{ data: Object.values(dataObj), backgroundColor: generateColors(Object.keys(dataObj).length) }] },
    options: {
      maintainAspectRatio: false,
      aspectRatio: 2,
      responsive: true,
      plugins: {
        legend: { position: 'left', align: 'start' },
        title: { display: true, text: 'Complaints by Department' }
      },
      layout: { padding: { left: 20 } }
    }
  });
}

function renderBarChart(dataObj) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: { labels: Object.keys(dataObj), datasets: [{ label: 'Complaints', data: Object.values(dataObj), backgroundColor: 'rgba(54, 162, 235, 0.6)' }] },
    options: { plugins: { title: { display: true, text: 'Complaints by Status' } }, scales: { y: { beginAtZero: true } }, responsive: true }
  });
}

function generateColors(n) {
  const base = ['#cce5ff','#99ccff','#66b2ff','#80d4ff','#b3ecff','#99e6ff','#80dfff','#66d9ff','#4dd2ff','#33ccff'];
  return Array.from({ length: n }, (_, i) => base[i % base.length]);
}

async function renderComplaintTable() {
  const { complaints, departments } = await fetchData();

  const search = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  let items = complaints;
  if (search) {
    items = items.filter(c => c.Title.toLowerCase().includes(search) || String(c.ComplaintID).padStart(4, '0').includes(search));
  }
  if (statusFilter) {
    items = items.filter(c => c.Status === statusFilter);
  }

  const pageSize = getPageSize();
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  // Pagination controls
  const prevLi = document.getElementById(prevBtnId);
  const nextLi = document.getElementById(nextBtnId);
  if (prevLi) prevLi.classList.toggle('disabled', currentPage === 1);
  if (nextLi) nextLi.classList.toggle('disabled', currentPage === totalPages);

  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const tbody = document.getElementById('complaintRows');
  tbody.innerHTML = '';
  pageItems.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:.5rem .75rem;">#CMP${String(c.ComplaintID).padStart(4, '0')}</td>
      <td style="padding:.5rem .75rem;">${c.Title}</td>
      <td style="padding:.5rem .75rem;">${c.submittedByName||c.submittedByEmail||'Unknown'}</td>
      <td style="padding:.5rem .75rem;"><select class="form-select form-select-sm status-dropdown" data-id="${c.id}" style="padding:.25rem .5rem; border: none; box-shadow: none;">  
        <option value="Submitted"${c.Status==='Submitted'?' selected':''}>Submitted</option>
        <option value="Pending"${c.Status==='Pending'?' selected':''}>Pending</option>
        <option value="Resolved"${c.Status==='Resolved'?' selected':''}>Resolved</option>
        <option value="Escalated"${c.Status==='Escalated'?' selected':''}>Escalated</option>
      </select></td>
      <td style="padding:.5rem .75rem;">${formatDate(c.LastUpdated)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Status update handler
  document.querySelectorAll('.status-dropdown').forEach(select => {
    select.addEventListener('change', async function() {
      const id = this.dataset.id;
      const newStatus = this.value;
      await fetch(`http://localhost:3000/Complaints/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ Status:newStatus, LastUpdated:new Date().toISOString().split('T')[0] }) });
      await updateCountsAndCharts();
    });
  });

  // Page numbers
  const pagContainer = document.getElementById('tablePagination');
  pagContainer.innerHTML = '';
  for (let i=1; i<=totalPages; i++) {
    const li = document.createElement('li');
    li.className = 'page-item'+(i===currentPage?' active':'');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', e => { e.preventDefault(); currentPage=i; renderComplaintTable(); });
    pagContainer.appendChild(li);
  }
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' });
}