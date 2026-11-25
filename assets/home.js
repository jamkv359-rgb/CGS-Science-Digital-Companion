/* Home page theme controls. */
(function () {
  'use strict';
  var T = window.Y9Theme;
  if (!T) return;
  var theme = T.load();
  var grid = document.getElementById('presets');

  Object.keys(T.PRESETS).forEach(function (id) {
    var p = T.PRESETS[id];
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.setAttribute('data-preset', id);
    b.setAttribute('aria-label', 'Use the ' + p.name + ' theme');
    b.innerHTML = '<span class="sw" style="background:' + p.bg + '"><i style="background:' + p.section +
      (p.borders ? ';box-shadow:0 0 0 1px ' + p.text + '33' : '') + ';border-radius:' + Math.min(p.radius, 12) + 'px ' + Math.min(p.radius, 12) + 'px 0 0"></i>' +
      '<b style="background:' + p.text + '"></b><u style="background:' + p.accent + '"></u></span><span class="nm">' + p.name + '</span>';
    b.addEventListener('click', function () {
      theme = {};
      for (var k in p) if (k !== 'name') theme[k] = p[k];
      theme.preset = id;
      commit();
    });
    grid.appendChild(b);
  });

  var inputs = Array.prototype.slice.call(document.querySelectorAll('[data-k]'));
  inputs.forEach(function (el) {
    var k = el.getAttribute('data-k');
    var ev = (el.type === 'checkbox' || el.type === 'text') ? 'change' : 'input';
    el.addEventListener(ev, function () {
      var v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'range') v = parseInt(el.value, 10);
      else {
        v = el.value.trim();
        if (el.type === 'text') {
          if (!/^#?[0-9a-f]{6}$/i.test(v)) { el.value = theme[k]; return; }
          if (v[0] !== '#') v = '#' + v;
        }
        v = v.toLowerCase();
      }
      theme[k] = v;
      theme.preset = 'custom';
      commit();
    });
  });

  document.getElementById('theme-reset').addEventListener('click', function () {
    var p = T.PRESETS.classic;
    theme = {};
    for (var k in p) if (k !== 'name') theme[k] = p[k];
    theme.preset = 'classic';
    commit();
  });

  function contrast(a, b) {
    function lum(h) {
      var n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
        .reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
    }
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  function sync() {
    inputs.forEach(function (el) {
      var k = el.getAttribute('data-k');
      if (el.type === 'checkbox') el.checked = !!theme[k];
      else el.value = theme[k];
    });
    document.getElementById('radius-out').textContent = theme.radius + 'px';
    Array.prototype.forEach.call(grid.children, function (b) {
      b.classList.toggle('sel', b.getAttribute('data-preset') === theme.preset);
    });
    document.getElementById('contrast-warn').hidden = contrast(theme.text, theme.section) >= 3;
  }

  function commit() {
    T.apply(theme);
    T.save(theme);
    sync();
  }

  sync();
})();
