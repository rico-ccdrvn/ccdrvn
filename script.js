/* CC Driving Instruction — Main Script */

// ── HAMBURGER NAV ────────────────────────────────────────────────────────────
const hamburger  = document.querySelector('.hamburger');
const navLinks   = document.querySelector('.nav-links');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    hamburger.textContent = open ? '✕' : '☰';
  });

  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.textContent = '☰';
      hamburger.setAttribute('aria-expanded', false);
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.textContent = '☰';
    }
  });
}

// ── ACTIVE NAV HIGHLIGHT ─────────────────────────────────────────────────────
(function () {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').split('/').pop();
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── REFERRAL MODAL ───────────────────────────────────────────────────────────
//
// !! SETUP REQUIRED — fill in your Google Form details below !!
//
// How to get your Google Form action URL and entry IDs:
//   1. Create a Google Form with "Full Name" and "Email Address" fields
//      (optional: add a "Package" field to track which package was selected)
//   2. Open the form, right-click the page > View Source (or Inspect)
//   3. Find the <form> action URL — it looks like:
//      https://docs.google.com/forms/d/e/XXXXXXXXXX/formResponse
//   4. Each field has an entry ID like entry.1234567890
//      (hover over an input in the source to find its name attribute)
//   5. Paste them below.
//
const GOOGLE_FORM_ACTION  = 'YOUR_GOOGLE_FORM_ACTION_URL';  // ← Replace
const ENTRY_NAME          = 'entry.XXXXXXXXXX';              // ← Replace
const ENTRY_EMAIL         = 'entry.XXXXXXXXXX';              // ← Replace
const ENTRY_PACKAGE       = 'entry.XXXXXXXXXX';              // ← Replace (optional)

const overlay    = document.getElementById('modalOverlay');
const pkgLabel   = document.getElementById('modalPackageName');
const modalForm  = document.getElementById('modalForm');
const closeBtn   = document.querySelector('.modal-close');

let pendingRedirect = '';
let pendingPackage  = '';

function openModal(packageName, enrollUrl) {
  pendingRedirect = enrollUrl;
  pendingPackage  = packageName;
  if (pkgLabel) pkgLabel.innerHTML = '<strong>' + packageName + '</strong>';
  if (overlay)  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Auto-focus first field after animation
  setTimeout(() => {
    const first = modalForm && modalForm.querySelector('input');
    if (first) first.focus();
  }, 150);
}

function closeModal() {
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  if (modalForm) {
    modalForm.reset();
    const btn = modalForm.querySelector('.modal-submit');
    if (btn) { btn.textContent = 'Continue to Enrollment →'; btn.disabled = false; }
  }
}

// Wire close triggers
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (overlay)  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Wire enroll buttons (set via data attributes in HTML)
document.querySelectorAll('[data-package]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    openModal(btn.dataset.package, btn.dataset.enroll);
  });
});

// Form submit → Google Forms (no-cors fire-and-forget) → redirect
if (modalForm) {
  modalForm.addEventListener('submit', async e => {
    e.preventDefault();

    const name  = document.getElementById('inputName').value.trim();
    const email = document.getElementById('inputEmail').value.trim();
    if (!name || !email) return;

    const submitBtn = modalForm.querySelector('.modal-submit');
    submitBtn.textContent = 'Redirecting…';
    submitBtn.disabled = true;

    // Only submit to Google Forms if the action URL has been configured
    if (GOOGLE_FORM_ACTION !== 'YOUR_GOOGLE_FORM_ACTION_URL') {
      const fd = new FormData();
      fd.append(ENTRY_NAME,    name);
      fd.append(ENTRY_EMAIL,   email);
      fd.append(ENTRY_PACKAGE, pendingPackage);
      try {
        await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: fd });
      } catch (_) {
        // Silently continue — never block the redirect on a network error
      }
    }

    window.location.href = pendingRedirect;
  });
}
