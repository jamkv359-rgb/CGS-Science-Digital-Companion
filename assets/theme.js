/* Theme engine: loaded in <head> on every page so the saved theme applies before first paint. */
(function () {
  var KEY = 'y9sci-theme';

  var PRESETS = {
    classic:   { name: 'Classic',       bg: '#f4f6fb', section: '#ffffff', text: '#1d2433', accent: '#2f5fd0', radius: 12, borders: true },
    navy:      { name: 'Navy & Gold',   bg: '#0f1b33', section: '#18284a', text: '#eef2fa', accent: '#e3b23c', radius: 10, borders: true },
    midnight:  { name: 'Midnight',      bg: '#111318', section: '#1b1e26', text: '#e4e7ee', accent: '#7aa2ff', radius: 12, borders: true },
    forest:    { name: 'Forest',        bg: '#eef3ec', section: '#fbfdf9', text: '#1f2d22', accent: '#2e7d4f', radius: 14, borders: true },
    ocean:     { name: 'Ocean',         bg: '#e6f3f7', section: '#ffffff', text: '#10303b', accent: '#0a7ea4', radius: 18, borders: false },
    paper:     { name: 'Paper',         bg: '#f5efe3', section: '#fffaf0', text: '#3a2f22', accent: '#a4512b', radius: 4,  borders: true },
    lavender:  { name: 'Lavender',      bg: '#f1eefb', section: '#ffffff', text: '#2a2540', accent: '#6b4fd1', radius: 20, borders: false },
    contrast:  { name: 'High contrast', bg: '#000000', section: '#000000', text: '#ffffff', accent: '#ffd400', radius: 0,  borders: true },
    sunset:    { name: 'Sunset',        bg: '#2a1b2e', section: '#3a2540', text: '#fbeee6', accent: '#ff8a5c', radius: 16, borders: false }
  };

  function hexToRgb(h) {
    h = String(h || '').replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    if (isNaN(n) || h.length !== 6) return null;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function luminance(h) {
    var c = hexToRgb(h);
    if (!c) return 1;
    var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function contrastText(h) { return luminance(h) > 0.4 ? '#111111' : '#ffffff'; }

  function load() {
    var t = null;
    try { t = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { t = null; }
    var base = PRESETS.classic;
    if (!t || typeof t !== 'object') t = {};
    var out = {};
    for (var k in base) out[k] = (t[k] !== undefined ? t[k] : base[k]);
    out.preset = t.preset || (t.bg ? 'custom' : 'classic');
    return out;
  }

  function apply(t) {
    var r = document.documentElement;
    var dark = luminance(t.section) < 0.2;
    r.style.setProperty('--bg', t.bg);
    r.style.setProperty('--section', t.section);
    r.style.setProperty('--text', t.text);
    r.style.setProperty('--accent', t.accent);
    r.style.setProperty('--on-accent', contrastText(t.accent));
    r.style.setProperty('--radius', (parseInt(t.radius, 10) || 0) + 'px');
    r.style.setProperty('--border-w', t.borders ? '1px' : '0px');
    r.setAttribute('data-borders', t.borders ? 'on' : 'off');
    r.setAttribute('data-tone', dark ? 'dark' : 'light');
    r.style.colorScheme = dark ? 'dark' : 'light';
  }

  function save(t) {
    try { localStorage.setItem(KEY, JSON.stringify(t)); } catch (e) { /* storage unavailable: theme lasts this page only */ }
  }

  window.Y9Theme = { PRESETS: PRESETS, load: load, apply: apply, save: save, KEY: KEY };
  apply(load());

  // keep open tabs in sync
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(load()); });
})();
