// Applies the saved theme before first paint to avoid a flash. A file, not inline, so the CSP can stay strict.
try {
  var t = localStorage.getItem('criticomrade_theme');
  if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
} catch (e) {}
