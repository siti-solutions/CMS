// js/loadPage.js
// --------------
// Dynamically injects an HTML fragment into the `#sub-content` container
// and ensures any <script> tags (inline or external) run afterwards.
//
// Public API:
//    loadPage(page[, element])
//       @param {string}      page     – Relative path to the HTML file to fetch.
//       @param {HTMLElement} [element]– Optional sidebar link to mark as "active".
//
// Typical usage example (sidebar link):
//    <a onclick="loadPage('pages/dashboard.html', this)">Dashboard</a>

'use strict';                       // Safer JavaScript

/**
 * Fetch the requested HTML file, swap it into the UI, execute scripts,
 * then highlight the active sidebar link.
 *
 * @param {string} page             Relative path to an .html file.
 * @param {HTMLElement|null} element Sidebar <a> element that was clicked (optional).
 */
function loadPage(page, element = null) {
  /* ------------------------------------------------------------- */
  /*                Step 1: Fetch HTML content                     */
  /* ------------------------------------------------------------- */
  fetch(page)                           // Issue GET request for the HTML file
    .then(response => {
      if (!response.ok)                 // 4xx / 5xx ?
        throw new Error(`Page not found: ${page}`);
      return response.text();           // Return raw HTML string
    })
    .then(html => {
      /* --------------------------------------------------------- */
      /*                Step 2: Inject into DOM                   */
      /* --------------------------------------------------------- */
      const container = document.getElementById('sub-content'); // Target region
      container.innerHTML = html;                               // Replace old markup

      /* --------------------------------------------------------- */
      /*                Step 3: Run inline scripts                */
      /* --------------------------------------------------------- */
      const inlineScripts = container.querySelectorAll('script'); // <script> inside fragment
      inlineScripts.forEach(oldScript => {
        const newScript = document.createElement('script');       // Clone as fresh tag
        if (oldScript.src) {                                      // <script src="...">
          newScript.src = oldScript.src;                          // Preserve src attribute
        } else {                                                  // Inline JS code
          newScript.textContent = oldScript.textContent;          // Copy code
        }
        document.body.appendChild(newScript);  // Append so browser executes it
        oldScript.remove();                    // Remove original script tag from fragment
      });

      /* --------------------------------------------------------- */
      /*            Step 4: Load matched external JS              */
      /* --------------------------------------------------------- */
      const baseName = page.split('/').pop().replace('.html', ''); // e.g. 'dashboard'
      const externalScript = document.createElement('script');
      externalScript.src = `../js/${baseName}.js`;                 // Convention‑based path
      externalScript.onerror = () =>
        console.warn(`No JS file found: ../js/${baseName}.js`);
      document.body.appendChild(externalScript);                   // Dynamically load file

      /* --------------------------------------------------------- */
      /*         Step 5: Update sidebar link highlighting          */
      /* --------------------------------------------------------- */
      document.querySelectorAll('.sidebar a')                      // Every sidebar link
              .forEach(link => link.classList.remove('active'));   // Remove any active class
      if (element) element.classList.add('active');                // Add active class to clicked link
    })
    .catch(err => {
      /* --------------------------------------------------------- */
      /*                Error handling / fallback                 */
      /* --------------------------------------------------------- */
      console.error(err);
      const container = document.getElementById('sub-content');
      container.innerHTML =
        `<p class="text-danger">Failed to load <strong>${page}</strong>.</p>`;
    });
}