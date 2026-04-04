/* ════════════════════════════════════════════════════════
   HIVEAPP — auth.js
   Theme toggle (dark/light) — partagé sur toutes les pages
   Guard d'authentification à ajouter ici pour client.html / admin.html
════════════════════════════════════════════════════════ */

/* ── THEME TOGGLE ──────────────────────────────────────── */
(function initTheme() {
  const tBtn = document.getElementById('themeBtn');
  if (!tBtn) return;

  const applyTheme = function(t) {
    document.documentElement.setAttribute('data-theme', t);
    tBtn.textContent = t === 'dark' ? '☀️' : '🌙';
    localStorage.setItem('hive_theme', t);
  };

  tBtn.addEventListener('click', function() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Apply saved or default theme
  applyTheme(localStorage.getItem('hive_theme') || 'dark');
})();
