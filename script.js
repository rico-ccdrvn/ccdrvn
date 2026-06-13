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
// On submit, the lead (name + email + selected package) is POSTed to the site's
// own Cloudflare Worker at /api/lead, which emails it to rico@ccdrvn.com via
// SendGrid. The visitor is then redirected to the partner school's enrollment
// page. See worker.js.
//
const LEAD_ENDPOINT = '/api/lead';

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

    // Send the lead to our Worker (→ emails rico@ccdrvn.com). Never block the
    // redirect on a slow/failed network — capture is best-effort.
    try {
      await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, package: pendingPackage }),
      });
    } catch (_) {
      // Silently continue.
    }

    window.location.href = pendingRedirect;
  });
}
