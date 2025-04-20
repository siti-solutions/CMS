
// js/loadPage.js

/**
 * Dynamically loads an HTML page into the #sub-content container,
 * executes its inline scripts, and then loads any matching external JS.
 *
 * @param {string} page - Relative path to the HTML file to load.
 * @param {HTMLElement|null} element - Optional sidebar link element to mark active.
 */
function loadPage(page, element = null) {
  fetch(page)
    .then(response => {
      if (!response.ok) throw new Error(`Page not found: ${page}`);
      return response.text();
    })
    .then(html => {
      const container = document.getElementById('sub-content');
      container.innerHTML = html;

      // Execute inline <script> tags
      const inlineScripts = container.querySelectorAll('script');
      inlineScripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        if (oldScript.src) {
          newScript.src = oldScript.src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        document.body.appendChild(newScript);
        oldScript.remove();
      });

      // Load matching external JS file
      const baseName = page.split('/').pop().replace('.html', '');
      const externalScript = document.createElement('script');
      externalScript.src = `../js/${baseName}.js`;
      externalScript.onerror = () => console.warn(`No JS file found: ../js/${baseName}.js`);
      document.body.appendChild(externalScript);

      // Highlight active sidebar link
      document.querySelectorAll('.sidebar a').forEach(link => link.classList.remove('active'));
      if (element) element.classList.add('active');
    })
    .catch(err => {
      console.error(err);
      const container = document.getElementById('sub-content');
      container.innerHTML = `<p class="text-danger">Failed to load <strong>${page}</strong>.</p>`;
    });
}