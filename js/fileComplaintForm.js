// js/fileComplaintForm.js
// -----------------------
// Handles the “File Complaint” form on the user dashboard.
// Features:
//   • Loads departments and complaint‑types (masters) from json‑server.
//   • Dynamically shows complaint‑type options when a department is chosen.
//   • Auto‑calculates the next ComplaintID (incremental).
//   • Shows/ hides file‑upload section for specific departments.
//   • Submits the complaint requestBody to /Complaints and resets the form.

'use strict';                                                   // Enable strict mode

/* ------------------------------------------------------------- */
/*                     Global Constants/Vars                     */
/* ------------------------------------------------------------- */
let complaintTypeMap = {};  // { DeptID: [ { CTID, ComplaintType, … } ] }
let nextComplaintID  = 1;   // Will be computed from existing records
const apiBase        = 'http://localhost:3000'; // json‑server root

/* ------------------------------------------------------------- */
/*                   Boot‑strap the form UI                       */
/* ------------------------------------------------------------- */
async function initForm() {
  await loadDepartments();       // Populate <select id="department">
  await loadComplaintTypes();    // Build complaintTypeMap for cascading
  await computeNextComplaintID();// Figure out next available ComplaintID

  const deptSelect = document.getElementById('department');     // Cache <select>
  deptSelect.addEventListener('change', onDeptChange);          // Dept change ⇒ reload types

  document.getElementById('complaintForm')                      // Main <form>
          .addEventListener('submit', onSubmit);                // Handle submit
}

// Immediately invoke init when script is parsed (no defer needed)
initForm();

/* ------------------------------------------------------------- */
/*             Load master data for departments & types          */
/* ------------------------------------------------------------- */

/**
 * Fetch departments and fill <select id="department">
 */
async function loadDepartments() {
  try {
    const res = await fetch(`${apiBase}/Departments`);          // GET /Departments
    const data = await res.json();                              // [{DeptID,Name},…]
    const deptSelect = document.getElementById('department');   // <select>
    data.forEach(d => {                                         // Create <option> for each dept
      const opt   = document.createElement('option');
      opt.value   = d.DeptID;
      opt.textContent = d.Name;
      deptSelect.appendChild(opt);
    });
  } catch (err) {
    console.error('Error loading departments:', err);           // Log fetch error
  }
}

/**
 * Fetch complaint types and organise by DeptID
 */
async function loadComplaintTypes() {
  try {
    const res = await fetch(`${apiBase}/ComplaintTypes`);       // GET /ComplaintTypes
    const data = await res.json();                              // [{CTID,DeptID,…},…]
    data.forEach(ct => {
      if (!complaintTypeMap[ct.DeptID]) complaintTypeMap[ct.DeptID] = [];
      complaintTypeMap[ct.DeptID].push(ct);                     // Push into map
    });
  } catch (err) {
    console.error('Error loading complaint types:', err);
  }
}

/* ------------------------------------------------------------- */
/*                Department → Complaint‑Type cascade            */
/* ------------------------------------------------------------- */

/**
 * When department changes, rebuild the complaint‑type <select>
 * Also show/hide the file‑upload section for certain dept IDs.
 */
function onDeptChange(e) {
  const deptId     = e.target.value;                            // Selected DeptID
  const typeSelect = document.getElementById('type');           // <select id="type">
  typeSelect.innerHTML = '<option value="" disabled selected>Choose...</option>'; // Reset

  const list = complaintTypeMap[deptId] || [];                  // Types for chosen department
  list.forEach(ct => {                                          // Append <option> for each type
    const opt = document.createElement('option');
    opt.value = ct.CTID;
    opt.textContent = ct.ComplaintType;
    typeSelect.appendChild(opt);
  });

  /* ---- Toggle file‑upload section ---------------------------- */
  const uploadSection = document.getElementById('uploadSection');
  const allowed       = ['4','6','7','9']; // DeptIDs requiring upload
  if (allowed.includes(deptId)) uploadSection.classList.remove('d-none');
  else                           uploadSection.classList.add('d-none');
}

/* ------------------------------------------------------------- */
/*          Compute next incrementing ComplaintID value          */
/* ------------------------------------------------------------- */
async function computeNextComplaintID() {
  try {
    const res  = await fetch(`${apiBase}/Complaints`);          // GET /Complaints
    const data = await res.json();                              // Existing complaints
    const max  = data.reduce((m,c)=>Math.max(m,c.ComplaintID||0),0); // Highest ID
    nextComplaintID = max + 1;                                  // Next sequential number
  } catch (err) {
    console.error('Error computing next ID:', err);
  }
}

/* ------------------------------------------------------------- */
/*                  Handle form submission                        */
/* ------------------------------------------------------------- */
async function onSubmit(evt) {
  evt.preventDefault();                                         // Stop default POST
  const form = evt.target;

  // If invalid inputs, show Bootstrap validation styles and abort
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  /* ------- Gather field values -------------------------------- */
  const deptId      = parseInt(document.getElementById('department').value, 10);
  const CTID        = parseInt(document.getElementById('type').value, 10);
  const title       = document.getElementById('subject').value.trim();
  const description = document.getElementById('description').value.trim();
  const date        = new Date().toISOString().split('T')[0];   // YYYY‑MM‑DD

  /* ------- User identity from sessionStorage ------------------ */
  const userEmail = sessionStorage.getItem('userEmail') || 'anonymous@example.com';
  const userName  = sessionStorage.getItem('userName')  || 'Anonymous';

  /* ------- Build request requestBody ------------------------------ */
  const requestBody = {
    ComplaintID     : nextComplaintID, // Newly computed ID
    DeptID          : deptId,          // FK to Departments
    CTID            : CTID,            // FK to ComplaintTypes
    Title           : title,
    Description     : description,
    Status          : 'Submitted',
    SubmittedOn     : date,
    LastUpdated     : date,
    submittedBy     : 'user',
    submittedByEmail: userEmail,
    submittedByName : userName
  };

  /* ------- POST to backend ------------------------------------ */
  try {
    await fetch(`${apiBase}/Complaints`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(requestBody)
    });
    alert('Complaint Submitted Successfully!');                  // Notify success
    form.reset();                                                // Clear fields
    form.classList.remove('was-validated');                      // Remove validation
    nextComplaintID++;                                           // Increment for next submission
  } catch (err) {
    console.error('Error submitting complaint:', err);
    alert('Submission failed. Please try again.');               // Notify failure
  }
}
