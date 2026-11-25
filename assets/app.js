/* Year 9 Science Digital Companion: navigation, collapsible sections and practice questions. */
(function () {
  'use strict';
  var STORE = 'y9sci-answers';
  var store = {};
  try { store = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { store = {}; }
  function persist() { try { localStorage.setItem(STORE, JSON.stringify(store)); } catch (e) { /* no storage */ } }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------ navigation ---- */
  var toggle = $('.nav-toggle');
  var scrim = $('.scrim');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (scrim) scrim.hidden = !open;
  }
  if (toggle) toggle.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });
  var cur = $('.site-nav a.current');
  if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });

  /* ------------------------------------------- collapsible sections ---- */
  var page = document.body.getAttribute('data-page');
  var OPENKEY = 'y9sci-open-' + page;
  var secs = $$('details.sec');
  var openSaved = null;
  try { openSaved = JSON.parse(sessionStorage.getItem(OPENKEY) || 'null'); } catch (e) { openSaved = null; }
  if (secs.length) {
    if (openSaved) secs.forEach(function (d) { d.open = openSaved.indexOf(d.id) >= 0; });
    else secs[0].open = true;
  }
  function saveOpen() {
    try { sessionStorage.setItem(OPENKEY, JSON.stringify(secs.filter(function (d) { return d.open; }).map(function (d) { return d.id; }))); } catch (e) { /* ignore */ }
  }
  secs.forEach(function (d) { d.addEventListener('toggle', saveOpen); });
  function openTarget(hash) {
    if (!hash || hash.length < 2) return;
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!el) return;
    var p = el;
    while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
    setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30);
  }
  window.addEventListener('hashchange', function () { openTarget(location.hash); });
  openTarget(location.hash);
  // images above the target can shift it once they load, so scroll again afterwards
  window.addEventListener('load', function () { openTarget(location.hash); });
  $$('.toc a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); openTarget(a.getAttribute('href')); });
  });
  var bx = $('.btn-expand'), bc = $('.btn-collapse');
  if (bx) bx.addEventListener('click', function () { $$('details.sec, details.sub').forEach(function (d) { d.open = true; }); saveOpen(); });
  if (bc) bc.addEventListener('click', function () { secs.forEach(function (d) { d.open = false; }); saveOpen(); });

  /* ------------------------------------------------ answer checking ---- */
  var SUBS = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-' };
  function clean(s) {
    return String(s == null ? '' : s)
      .replace(/[₀-₉⁰-⁹⁺⁻¹²³]/g, function (c) { return SUBS[c] || c; })
      .replace(/[‐-―−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
      .replace(/[~^]/g, '').replace(/\s+/g, '').replace(/[.]+$/, '');
  }
  function parseNum(s) {
    s = String(s).trim().replace(/\s+/g, '');
    if (/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    s = s.replace(/[×x*]10\^?/i, 'e').replace(/−/g, '-');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  // Chemical formulas and symbols (no spaces, mixed case or digits) are case-sensitive; words are not.
  function caseSensitive(ans) {
    if (/^=/.test(ans)) return true;
    if (/\s/.test(ans)) return false;
    return /^[A-Z(][A-Za-z0-9()+\-^~]*$/.test(ans) && /[a-z][A-Z]|[A-Z].*[A-Z]|[A-Za-z)]\d|\d[A-Za-z(]|[+-]$/.test(ans);
  }
  function words(s) { return s.toLowerCase().replace(/sulph/g, 'sulf').replace(/aluminum/g, 'aluminium'); }
  function matchBlank(given, answers) {
    var g = clean(given);
    if (!g) return false;
    return answers.some(function (a) {
      if (/^~/.test(a)) {  // "~19.3" accepts any number within 5%
        var tg = parseNum(given), ta = parseFloat(a.slice(1));
        return !isNaN(tg) && Math.abs(tg - ta) <= Math.abs(ta) * 0.05 + 1e-9;
      }
      var cs = caseSensitive(a);
      var ca = clean(a.replace(/^=/, ''));
      var gn = parseNum(given), an = parseNum(a.replace(/^=/, ''));
      if (!isNaN(gn) && !isNaN(an)) return Math.abs(gn - an) <= Math.abs(an) * 1e-6 + 1e-12;
      return cs ? g === ca : words(g) === words(ca);
    });
  }
  function answersOf(el) { try { return JSON.parse(el.getAttribute('data-answer')); } catch (e) { return []; } }

  function feedback(q, cls, msg) {
    var f = $('.q-feedback', q);
    f.className = 'q-feedback ' + (cls || '');
    f.textContent = msg || '';
  }

  function showAnswerButton(q, show) {
    var b = $('.btn-show', q);
    if (show && !b) {
      b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-reset btn-show'; b.textContent = 'Show answer';
      $('.q-actions', q).insertBefore(b, $('.q-feedback', q));
      b.addEventListener('click', function () { reveal(q); });
    } else if (!show && b) b.remove();
  }

  function reveal(q) {
    var t = q.getAttribute('data-type');
    if (t === 'mcq' || t === 'multi') {
      var ans = answersOf($('.q-options', q));
      $$('.opt', q).forEach(function (o, i) { if (ans.indexOf(i) >= 0) o.classList.add('missed'); });
    }
    $$('.blank', q).forEach(function (b) {
      if (b.classList.contains('ok')) return;
      if (b.nextElementSibling && b.nextElementSibling.classList.contains('reveal-ans')) return;
      var s = document.createElement('span');
      s.className = 'reveal-ans';
      s.textContent = '→ ' + answersOf(b).map(function (a) {
        var o = b.tagName === 'SELECT' && $$('option', b).filter(function (x) { return x.value === a; })[0];
        return o ? o.textContent : a.replace(/^[=~]/, '');
      }).join(' / ');
      b.insertAdjacentElement('afterend', s);
    });
    $$('.tf-btns', q).forEach(function (g) {
      var row = g.closest('.tf-row');
      if (row.classList.contains('ok')) return;
      var a = g.getAttribute('data-answer');
      if (!$('.reveal-ans', row)) {
        var s = document.createElement('span'); s.className = 'reveal-ans'; s.textContent = '→ ' + (a === 'true' ? 'True' : 'False');
        g.appendChild(s);
      }
    });
    var n = $('.num-input', q);
    if (n && !n.classList.contains('ok') && !$('.reveal-ans', q)) {
      var s2 = document.createElement('span'); s2.className = 'reveal-ans'; s2.textContent = '→ ' + n.getAttribute('data-answer');
      n.parentElement.appendChild(s2);
    }
    var exp = $('.q-exp', q);
    if (exp) exp.hidden = false;
  }

  function collect(q) {
    var v = {};
    $$('input.blank, select.blank, .num-input, .short-input', q).forEach(function (el) { v[el.id] = el.value; });
    $$('.q-options input', q).forEach(function (el, i) { if (el.checked) v['o' + i] = 1; });
    $$('.tf-btns', q).forEach(function (g) { var s = $('.tf-btn.sel', g); if (s) v[g.id] = s.getAttribute('data-v'); });
    return v;
  }

  function check(q, silent) {
    var t = q.getAttribute('data-type');
    var total = 0, right = 0, answered = 0;
    if (t === 'short') {
      var model = $('.model', q);
      model.hidden = false;
      var txt = $('.short-input', q).value.toLowerCase();
      var kws = answersOf({ getAttribute: function () { return model.getAttribute('data-keywords'); } });
      var kr = $('.kw-result', q);
      if (kws.length && txt.trim()) {
        kr.innerHTML = 'Key ideas in your answer: ' + kws.map(function (k) {
          var alts = k.toLowerCase().split('/');
          var hit = alts.some(function (a) { return txt.indexOf(a.trim()) >= 0; });
          return '<span class="kw ' + (hit ? 'hit' : 'miss') + '">' + (hit ? '✓ ' : '✗ ') + alts[0].trim() + '</span>';
        }).join(' ');
      } else kr.innerHTML = kws.length ? 'Look for these key ideas: ' + kws.map(function (k) { return '<span class="kw">' + k.split('/')[0] + '</span>'; }).join(' ') : '';
      var exp = $('.q-exp', q); if (exp) exp.hidden = false;
      $('.btn-check', q).textContent = 'Hide model answer';
      q.setAttribute('data-shown', '1');
      var rec = store[q.id] || {};
      rec.v = collect(q); rec.s = rec.s || 'shown';
      store[q.id] = rec; persist(); updateProgress();
      return;
    }
    if (t === 'mcq' || t === 'multi') {
      var ans = answersOf($('.q-options', q));
      var opts = $$('.opt', q);
      var sel = [];
      opts.forEach(function (o, i) { o.classList.remove('ok', 'bad', 'missed'); if ($('input', o).checked) sel.push(i); });
      if (!sel.length) { if (!silent) feedback(q, 'bad', 'Choose an answer first.'); return; }
      sel.forEach(function (i) { opts[i].classList.add(ans.indexOf(i) >= 0 ? 'ok' : 'bad'); });
      total = 1; answered = 1;
      var allRight = sel.length === ans.length && sel.every(function (i) { return ans.indexOf(i) >= 0; });
      right = allRight ? 1 : 0;
      if (!allRight && ans.length > 1 && sel.every(function (i) { return ans.indexOf(i) >= 0; })) {
        finish(q, 'part', 'Correct so far, but there are more correct options.', silent, sel.length / ans.length); return;
      }
    } else {
      $$('.blank', q).forEach(function (b) {
        total++;
        b.classList.remove('ok', 'bad');
        var nx = b.nextElementSibling; if (nx && nx.classList.contains('reveal-ans')) nx.remove();
        if (!b.value.trim()) return;
        answered++;
        var ok = matchBlank(b.value, answersOf(b));
        b.classList.add(ok ? 'ok' : 'bad');
        if (ok) right++;
      });
      $$('.tf-btns', q).forEach(function (g) {
        total++;
        var row = g.closest('.tf-row');
        row.classList.remove('ok', 'bad');
        var r = $('.reveal-ans', row); if (r) r.remove();
        var s = $('.tf-btn.sel', g);
        if (!s) return;
        answered++;
        var ok = s.getAttribute('data-v') === g.getAttribute('data-answer');
        row.classList.add(ok ? 'ok' : 'bad');
        if (ok) right++;
      });
      var n = $('.num-input', q);
      if (n) {
        total++;
        n.classList.remove('ok', 'bad');
        var rr = $('.reveal-ans', q); if (rr) rr.remove();
        if (n.value.trim()) {
          answered++;
          var a = parseFloat(n.getAttribute('data-answer'));
          var tol = parseFloat(n.getAttribute('data-tol')) / 100;
          var g = parseNum(n.value);
          var ok2 = !isNaN(g) && Math.abs(g - a) <= Math.max(Math.abs(a) * tol, 1e-9);
          n.classList.add(ok2 ? 'ok' : 'bad');
          if (ok2) right++;
        }
      }
    }
    if (!answered) { if (!silent) feedback(q, 'bad', 'Enter an answer first.'); return; }
    if (right === total) finish(q, 'ok', total > 1 ? 'All ' + total + ' correct — well done!' : 'Correct — well done!', silent, 1);
    else if (total > 1) finish(q, right ? 'part' : 'bad', right + ' of ' + total + ' correct' + (answered < total ? ' (' + (total - answered) + ' left blank)' : '') + '. Fix the red ones and check again.', silent, right / total);
    else finish(q, 'bad', 'Not quite — have another go.', silent, 0);
  }

  function fmt(x) { return String(Math.round(x * 10) / 10); }
  function finish(q, status, msg, silent, fr) {
    var mk = q.getAttribute('data-marks');
    if (mk != null && fr != null) msg += ' (' + fmt(Math.round(+mk * fr * 2) / 2) + ' / ' + mk + ' mark' + (mk === '1' ? '' : 's') + ')';
    feedback(q, status, msg);
    q.classList.toggle('done-ok', status === 'ok');
    showAnswerButton(q, status !== 'ok');
    if (status === 'ok') { var exp = $('.q-exp', q); if (exp) exp.hidden = false; }
    if (!silent) {
      store[q.id] = { v: collect(q), s: status, f: fr == null ? (status === 'ok' ? 1 : 0) : fr };
      persist(); updateProgress();
    }
  }

  function resetQ(q) {
    $$('input.blank, select.blank, .num-input, .short-input', q).forEach(function (el) { el.value = ''; el.classList.remove('ok', 'bad'); });
    $$('.q-options input', q).forEach(function (el) { el.checked = false; });
    $$('.opt, .tf-row', q).forEach(function (el) { el.classList.remove('ok', 'bad', 'missed'); });
    $$('.tf-btn', q).forEach(function (el) { el.classList.remove('sel'); });
    $$('.reveal-ans', q).forEach(function (el) { el.remove(); });
    $$('.self-mark button', q).forEach(function (el) { el.classList.remove('sel'); });
    var m = $('.model', q); if (m) m.hidden = true;
    var e = $('.q-exp', q); if (e) e.hidden = true;
    if (q.getAttribute('data-type') === 'short') $('.btn-check', q).textContent = 'Compare with model answer';
    q.removeAttribute('data-shown');
    q.classList.remove('done-ok');
    showAnswerButton(q, false);
    feedback(q, '', '');
    delete store[q.id];
  }

  function restore(q) {
    var rec = store[q.id];
    if (!rec || !rec.v) return;
    var v = rec.v;
    $$('input.blank, select.blank, .num-input, .short-input', q).forEach(function (el) { if (v[el.id] != null) el.value = v[el.id]; });
    $$('.q-options input', q).forEach(function (el, i) { el.checked = !!v['o' + i]; });
    $$('.tf-btns', q).forEach(function (g) {
      if (v[g.id]) $$('.tf-btn', g).forEach(function (b) { b.classList.toggle('sel', b.getAttribute('data-v') === v[g.id]); });
    });
    if (q.getAttribute('data-type') === 'short') {
      if (rec.s && rec.s !== 'draft') check(q, true);
      $$('.self-mark button', q).forEach(function (b) { b.classList.toggle('sel', b.getAttribute('data-m') === (rec.m != null ? String(rec.m) : rec.s)); });
    } else if (rec.s && rec.s !== 'draft') check(q, true);
  }

  $$('.q').forEach(function (q) {
    restore(q);
    $('.btn-check', q).addEventListener('click', function () {
      if (q.getAttribute('data-type') === 'short' && q.getAttribute('data-shown')) {
        $('.model', q).hidden = true;
        var e = $('.q-exp', q); if (e) e.hidden = true;
        q.removeAttribute('data-shown');
        this.textContent = 'Compare with model answer';
        return;
      }
      check(q);
    });
    $('.btn-reset', q).addEventListener('click', function () { resetQ(q); persist(); updateProgress(); });
    $$('.tf-btn', q).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.tf-btn', b.parentElement).forEach(function (x) { x.classList.toggle('sel', x === b); });
        draft(q);
      });
    });
    $$('.self-mark button', q).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.self-mark button', q).forEach(function (x) { x.classList.toggle('sel', x === b); });
        var m = b.getAttribute('data-m'), mk = q.getAttribute('data-marks');
        if (mk != null && /^[\d.]+$/.test(m)) {
          // marks out of the question's total; full marks counts as "got it"
          store[q.id] = { v: collect(q), s: +m >= +mk ? 'got' : (+m > 0 ? 'part' : 'miss'), m: +m };
        } else store[q.id] = { v: collect(q), s: m };
        persist(); updateProgress();
      });
    });
    $$('input, select, textarea', q).forEach(function (el) {
      el.addEventListener('change', function () { draft(q); });
      if (el.matches('input.blank, .num-input')) {
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(q); } });
      }
    });
    var ta = $('.short-input', q);
    if (ta) ta.addEventListener('input', function () { draft(q); });
  });

  var draftTimer = null;
  function draft(q) {
    var rec = store[q.id] || { s: 'draft' };
    rec.v = collect(q);
    store[q.id] = rec;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(persist, 300);
  }

  /* ------------------------------------------------ progress ---- */
  function stats(prefix) {
    var done = 0, ok = 0;
    Object.keys(store).forEach(function (k) {
      if (k.indexOf(prefix) !== 0) return;
      var s = store[k].s;
      if (!s || s === 'draft') return;
      done++;
      if (s === 'ok' || s === 'got') ok++;
    });
    return { done: done, ok: ok };
  }
  function updateProgress() {
    showTestScore();
    var cp = $('.ch-progress');
    if (cp) {
      var total = +cp.getAttribute('data-total');
      var st = stats(page + '-q');
      $('.ch-progress-text', cp).innerHTML = '<b>' + total + '</b> practice question' + (total === 1 ? '' : 's') +
        ' in this chapter &middot; <b>' + st.done + '</b> attempted &middot; <b>' + st.ok + '</b> correct';
    }
    $$('.topic-progress').forEach(function (el) {
      var total = +el.getAttribute('data-total');
      if (!total) { el.textContent = ''; return; }
      var st = stats(el.getAttribute('data-topic') + '-');
      var pct = Math.round(100 * st.ok / total);
      el.innerHTML = total + ' practice questions &middot; ' + st.ok + ' correct' +
        '<div class="bar" title="' + pct + '%"><i style="width:' + pct + '%"></i></div>';
    });
  }
  /* ------------------------------------------------ tests and exams ---- */
  var testBar = $('.test-bar');
  var TESTS = 'y9sci-tests';
  var mode = 'practice';
  var timerId = null, elapsed = 0, startAt = 0;

  function testScore() {
    var sc = { auto: 0, autoMax: 0, self: 0, selfMax: 0, pending: 0, done: 0, n: 0 };
    $$('.q[data-marks]').forEach(function (q) {
      var mk = +q.getAttribute('data-marks'), rec = store[q.id];
      var attempted = rec && rec.s && rec.s !== 'draft';
      sc.n++;
      if (attempted) sc.done++;
      if (q.getAttribute('data-type') === 'short') {
        if (rec && rec.m != null) { sc.self += rec.m; sc.selfMax += mk; } else if (attempted) sc.pending++;
      } else if (attempted) { sc.auto += Math.round(mk * (rec.f || 0) * 2) / 2; sc.autoMax += mk; }
    });
    return sc;
  }
  function showTestScore() {
    if (!testBar) return;
    var sc = testScore(), total = +testBar.getAttribute('data-total');
    var got = sc.auto + sc.self, marked = sc.autoMax + sc.selfMax;
    var h = '<div class="ts-main"><b>' + fmt(got) + '</b> / ' + fmt(total) + ' marks' +
      (marked && marked < total ? ' <span class="ts-pct">(' + Math.round(100 * got / marked) + '% of the ' + fmt(marked) + ' marks you have marked so far)</span>' :
        marked ? ' <span class="ts-pct">(' + Math.round(100 * got / total) + '%)</span>' : '') + '</div>' +
      '<div class="ts-parts">Auto-marked ' + fmt(sc.auto) + ' / ' + fmt(sc.autoMax) +
      ' &middot; self-marked ' + fmt(sc.self) + ' / ' + fmt(sc.selfMax) +
      (sc.pending ? ' &middot; <span class="ts-pending">' + sc.pending + ' written answer' + (sc.pending === 1 ? '' : 's') + ' still to self-mark</span>' : '') + '</div>' +
      '<div class="bar"><i style="width:' + Math.min(100, 100 * got / total) + '%"></i></div>';
    $$('.tb-score').forEach(function (el) { el.innerHTML = h; });
    var all = {};
    try { all = JSON.parse(localStorage.getItem(TESTS) || '{}') || {}; } catch (e) { all = {}; }
    all[testBar.getAttribute('data-test')] = { got: got, marked: marked, total: total, done: sc.done, pending: sc.pending };
    try { localStorage.setItem(TESTS, JSON.stringify(all)); } catch (e) { /* no storage */ }
  }
  var HELP = {
    practice: 'Check each answer as you go. Auto-marked questions are marked straight away; for written answers, compare yours with the model answer and award yourself marks.',
    exam: 'Answer every question without help, then press <b>Mark my paper</b>. Answers and model answers stay hidden until then.',
    marked: 'Your paper has been marked. Now go through your <b>written answers</b>: compare each with the model answer and choose the marks you would award yourself. Your total updates as you go.'
  };
  function setMode(m) {
    mode = m;
    document.body.classList.remove('marked');
    document.body.classList.toggle('exam-mode', m === 'exam');
    $$('.tb-modes button').forEach(function (b) { b.classList.toggle('sel', b.getAttribute('data-mode') === m); });
    $('.tb-help').innerHTML = HELP[m];
    try { localStorage.setItem('y9sci-mode-' + page, m); } catch (e) { /* ignore */ }
  }
  function hasAnswer(q) {
    var v = collect(q);
    return Object.keys(v).some(function (k) { return v[k] && String(v[k]).trim(); });
  }
  function markAll() {
    document.body.classList.remove('exam-mode');
    document.body.classList.add('marked');
    $$('.q').forEach(function (q) {
      if (q.getAttribute('data-type') === 'short') { if (!q.getAttribute('data-shown')) check(q); return; }
      if (hasAnswer(q)) check(q);
      else {
        store[q.id] = { v: collect(q), s: 'bad', f: 0 };
        feedback(q, 'bad', 'Not answered (0 / ' + q.getAttribute('data-marks') + ')');
      }
      if (!q.classList.contains('done-ok')) { reveal(q); showAnswerButton(q, false); }
    });
    persist(); updateProgress();
    $('.tb-help').innerHTML = HELP.marked;
    $$('details.sec, details.sub').forEach(function (d) { d.open = true; });
    stopTimer();
    testBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function stopTimer() {
    if (timerId) { elapsed += Date.now() - startAt; clearInterval(timerId); timerId = null; }
    var b = $('.tb-timer-btn');
    if (b) b.textContent = elapsed ? 'Resume timer' : 'Start timer';
  }
  function tick() {
    var clock = $('.tb-clock'), mins = +testBar.getAttribute('data-minutes') || 0;
    var sec = Math.floor((elapsed + (timerId ? Date.now() - startAt : 0)) / 1000);
    var two = function (x) { return ('0' + x).slice(-2); };
    if (mins) {
      var left = mins * 60 - sec, a = Math.abs(left);
      clock.textContent = (left < 0 ? '−' : '') + Math.floor(a / 60) + ':' + two(a % 60) + (left < 0 ? ' over time' : ' left');
      clock.classList.toggle('over', left < 0);
    } else clock.textContent = Math.floor(sec / 60) + ':' + two(sec % 60);
  }
  function resetTimer() { stopTimer(); elapsed = 0; tick(); $('.tb-timer-btn').textContent = 'Start timer'; }

  if (testBar) {
    try { mode = localStorage.getItem('y9sci-mode-' + page) || 'practice'; } catch (e) { mode = 'practice'; }
    setMode(mode);
    $$('.tb-modes button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); }); });
    $$('.btn-mark-all').forEach(function (b) {
      b.addEventListener('click', function () {
        var left = $$('.q').filter(function (q) { return !hasAnswer(q); }).length;
        if (left && !confirm(left + ' question' + (left === 1 ? ' has' : 's have') + ' no answer yet. Mark your paper anyway?')) return;
        markAll();
      });
    });
    $('.tb-timer-btn').addEventListener('click', function () {
      if (timerId) { stopTimer(); return; }
      startAt = Date.now(); timerId = setInterval(tick, 1000); this.textContent = 'Pause timer';
    });
    $('.tb-timer-reset').addEventListener('click', resetTimer);
    tick();
  }

  var ra = $('.btn-reset-all');
  if (ra) ra.addEventListener('click', function () {
    if (!confirm(testBar ? 'Clear all your answers on this paper?' : 'Clear all your answers in this chapter?')) return;
    $$('.q').forEach(resetQ);
    if (testBar) { setMode(mode); resetTimer(); }
    persist(); updateProgress();
  });

  // home page: latest score on each test link
  var tscores = {};
  try { tscores = JSON.parse(localStorage.getItem(TESTS) || '{}') || {}; } catch (e) { tscores = {}; }
  $$('.tl-score').forEach(function (el) {
    var r = tscores[el.getAttribute('data-test')];
    if (!r || !r.done) return;
    el.textContent = fmt(r.got) + ' / ' + fmt(r.total) + (r.pending ? ' · ' + r.pending + ' to mark' : '');
    el.title = r.done + ' questions attempted';
  });

  updateProgress();
})();
