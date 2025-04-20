// js/FileComplaintForm.js

'use strict';
let complaintTypeMap = {};
let nextComplaintID = 1;
const apiBase = 'http://localhost:3000';

async function initForm() {
  await loadDepartments();
  await loadComplaintTypes();
  await computeNextComplaintID();

  const deptSelect = document.getElementById('department');
  deptSelect.addEventListener('change', onDeptChange);

  document.getElementById('complaintForm').addEventListener('submit', onSubmit);
}

// Initialize form when script is loaded
initForm();

async function loadDepartments() {
  try {
    const res = await fetch(`${apiBase}/Departments`);
    const data = await res.json();
    const deptSelect = document.getElementById('department');
    data.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.DeptID;
      opt.textContent = d.Name;
      deptSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading departments:', err);
  }
}

async function loadComplaintTypes() {
  try {
    const res = await fetch(`${apiBase}/ComplaintTypes`);
    const data = await res.json();
    data.forEach(ct => {
      if (!complaintTypeMap[ct.DeptID]) complaintTypeMap[ct.DeptID] = [];
      complaintTypeMap[ct.DeptID].push(ct);
    });
  } catch (err) {
    console.error('Error loading complaint types:', err);
  }
}

function onDeptChange(e) {
  const deptId = e.target.value;
  const typeSelect = document.getElementById('type');
  typeSelect.innerHTML = '<option value="" disabled selected>Choose...</option>';

  const list = complaintTypeMap[deptId] || [];
  list.forEach(ct => {
    const opt = document.createElement('option');
    opt.value = ct.CTID;
    opt.textContent = ct.ComplaintType;
    typeSelect.appendChild(opt);
  });

  const uploadSection = document.getElementById('uploadSection');
  const allowed = ['4', '6', '7', '9'];
  if (allowed.includes(deptId)) uploadSection.classList.remove('d-none');
  else uploadSection.classList.add('d-none');
}

async function computeNextComplaintID() {
  try {
    const res = await fetch(`${apiBase}/Complaints`);
    const data = await res.json();
    const max = data.reduce((m, c) => Math.max(m, c.ComplaintID || 0), 0);
    nextComplaintID = max + 1;
  } catch (err) {
    console.error('Error computing next ID:', err);
  }
}

async function onSubmit(evt) {
  evt.preventDefault();
  const form = evt.target;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const deptId = parseInt(document.getElementById('department').value, 10);
  const CTID = parseInt(document.getElementById('type').value, 10);
  const title = document.getElementById('subject').value.trim();
  const description = document.getElementById('description').value.trim();
  const date = new Date().toISOString().split('T')[0];
  const userEmail = sessionStorage.getItem('userEmail') || 'anonymous@example.com';
  const userName = sessionStorage.getItem('userName') || 'Anonymous';

  const payload = {
    ComplaintID: nextComplaintID,
    DeptID: deptId,
    CTID: CTID,
    Title: title,
    Description: description,
    Status: 'Submitted',
    SubmittedOn: date,
    LastUpdated: date,
    submittedBy: 'user',
    submittedByEmail: userEmail,
    submittedByName: userName
  };

  try {
    await fetch(`${apiBase}/Complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    alert('Complaint Submitted Successfully!');
    form.reset();
    form.classList.remove('was-validated');
    nextComplaintID++;
  } catch (err) {
    console.error('Error submitting complaint:', err);
    alert('Submission failed. Please try again.');
  }
}
