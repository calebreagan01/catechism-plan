/* Catechism: small browser script. Everything personal (progress, start date, text size,
   night mode) lives in this browser's localStorage. There are no accounts and no tracking. */
(function () {
  'use strict';
  var KEY = 'catechism.v1';
  var BASE = document.documentElement.getAttribute('data-base') || '/';
  var TOTAL = 900;
  var mem = null;
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); s.done = s.done || {}; return s; }
    catch (e) { return mem || { done: {} }; }
  }
  function save(s) { mem = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  var state = load();
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function doneCount() { return Object.keys(state.done).length; }
  function isDone(n) { return !!state.done[n]; }
  function set(n, v) { if (v) state.done[n] = 1; else delete state.done[n]; save(state); }
  function nextAfterLast() {
    var ks = Object.keys(state.done).map(Number); if (!ks.length) return 1;
    var n = Math.max.apply(null, ks) + 1; return Math.min(n, TOTAL);
  }
  function firstUndone() { for (var i = 1; i <= TOTAL; i++) if (!isDone(i)) return i; return TOTAL; }
  function calendarDay() {
    if (!state.start) return null;
    var s = new Date(state.start + 'T00:00:00'); var t = new Date(); t.setHours(0, 0, 0, 0);
    var n = Math.floor((t - s) / 86400000) + 1; return Math.max(1, Math.min(TOTAL, n));
  }
  function currentDay() { return calendarDay() || nextAfterLast(); }

  /* ---------- look and feel ---------- */
  function applyLook() {
    var r = document.documentElement;
    if (state.theme) r.setAttribute('data-theme', state.theme);
    r.setAttribute('data-size', String(state.size == null ? 1 : state.size));
    var tb = $('[data-theme-toggle]'); if (tb) tb.textContent = state.theme === 'dark' ? 'Day' : 'Night';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    if (t.hasAttribute('data-theme-toggle')) { state.theme = state.theme === 'dark' ? 'light' : 'dark'; save(state); applyLook(); }
    if (t.hasAttribute('data-size-up')) { state.size = Math.min(3, (state.size == null ? 1 : state.size) + 1); save(state); applyLook(); }
    if (t.hasAttribute('data-size-down')) { state.size = Math.max(0, (state.size == null ? 1 : state.size) - 1); save(state); applyLook(); }
    if (t.hasAttribute('data-menu')) { var m = t.closest('.menu'); var o = m.classList.toggle('open'); t.setAttribute('aria-expanded', o ? 'true' : 'false'); }
    if (t.hasAttribute('data-export')) exportProgress();
    if (t.hasAttribute('data-done-toggle')) {
      var n = Number(t.getAttribute('data-done-toggle')); set(n, !isDone(n)); refresh();
    }
    if (t.hasAttribute('data-reset')) {
      if (window.confirm('Clear all of your progress on this device? This cannot be undone.')) { state = { done: {}, theme: state.theme, size: state.size }; save(state); refresh(); }
    }
  });

  /* ---------- progress ---------- */
  function refresh() {
    var c = doneCount();
    $$('[data-progress-text]').forEach(function (el) { el.textContent = c + ' of ' + TOTAL + ' finished'; });
    $$('[data-progress-bar]').forEach(function (el) { el.style.width = (c / TOTAL * 100) + '%'; });
    $$('[data-day]').forEach(function (el) { el.classList.toggle('is-done', isDone(Number(el.getAttribute('data-day')))); });
    $$('[data-done-toggle]').forEach(function (b) {
      var d = isDone(Number(b.getAttribute('data-done-toggle')));
      b.classList.toggle('is-finished', d);
      b.textContent = d ? 'Finished ✓' : 'Mark this day as finished';
      b.setAttribute('aria-pressed', d ? 'true' : 'false');
    });
    $$('input[data-ck]').forEach(function (i) { i.checked = isDone(Number(i.getAttribute('data-ck'))); });
    $$('[data-week]').forEach(function (td) {
      var f = Number(td.getAttribute('data-week')); var all = true, any = false;
      for (var d = f; d < f + 7 && d <= TOTAL; d++) { if (isDone(d)) any = true; else all = false; }
      td.textContent = all ? '✓' : (any ? '·' : '');
    });
    var cur = currentDay();
    $$('[data-unit-first]').forEach(function (a) {
      var f = Number(a.getAttribute('data-unit-first')), l = Number(a.getAttribute('data-unit-last'));
      var n = 0; for (var d = f; d <= l; d++) if (isDone(d)) n++;
      a.classList.toggle('done', n === l - f + 1);
      a.classList.toggle('now', cur >= f && cur <= l && n !== l - f + 1);
      var out = $('[data-unit-progress]', a); if (out) out.textContent = n + ' of ' + (l - f + 1);
    });
    $$('[data-unit-progress-for]').forEach(function (el) {
      var parts = el.getAttribute('data-unit-progress-for').split('-'); var f = Number(parts[0]), l = Number(parts[1]); var n = 0;
      for (var d = f; d <= l; d++) if (isDone(d)) n++;
      el.textContent = n + ' of ' + (l - f + 1) + ' days finished';
    });
    $$('[data-continue]').forEach(function (a) { a.href = BASE + 'day/' + cur + '/'; var s = $('[data-continue-n]', a); if (s) s.textContent = 'Day ' + cur; });
    stats();
  }
  function stats() {
    var c = doneCount();
    $$('[data-stat="done"]').forEach(function (e) { e.textContent = c; });
    $$('[data-stat="pct"]').forEach(function (e) { e.textContent = Math.round(c / TOTAL * 100) + '%'; });
    var s = $('#start-date'); if (s && state.start) s.value = state.start;
    var info = $('[data-start-info]'); if (info) info.textContent = state.start ? 'Your start date is ' + new Date(state.start + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' }) + '.' : 'No start date set. The plan will follow the days you finish.';
  }
  function exportProgress() {
    var blob = new Blob([JSON.stringify({ app: 'catechism', version: 1, exported: new Date().toISOString(), start: state.start || null, done: Object.keys(state.done).map(Number) }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'catechism-progress.json'; document.body.appendChild(a); a.click(); a.remove();
  }
  var imp = $('[data-import]');
  if (imp) imp.addEventListener('change', function () {
    var f = imp.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () {
      try {
        var j = JSON.parse(r.result); if (j.app !== 'catechism') throw 0;
        state.done = {}; (j.done || []).forEach(function (n) { state.done[n] = 1; }); state.start = j.start || state.start; save(state); refresh();
        var m = $('[data-import-msg]'); if (m) m.textContent = 'Progress restored: ' + doneCount() + ' days.';
      } catch (e) { var m2 = $('[data-import-msg]'); if (m2) m2.textContent = 'That file is not a Catechism progress backup.'; }
    };
    r.readAsText(f);
  });
  $$('input[data-ck]').forEach(function (i) { i.addEventListener('change', function () { set(Number(i.getAttribute('data-ck')), i.checked); refresh(); }); });
  var form = $('#start-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('#start-date').value; if (v) { state.start = v; save(state); refresh(); fillToday(); }
  });
  $$('[data-start-today]').forEach(function (b) { b.addEventListener('click', function () { var d = new Date(); state.start = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); save(state); refresh(); fillToday(); }); });
  var onDay = $('#on-day');
  if (onDay) onDay.addEventListener('submit', function (e) {
    e.preventDefault(); var n = Number($('#on-day-n').value); if (!n || n < 1 || n > TOTAL) return;
    var d = new Date(); d.setDate(d.getDate() - (n - 1));
    state.start = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    for (var i = 1; i < n; i++) state.done[i] = 1; save(state); refresh(); fillToday();
  });

  /* ---------- today card (home + today page) ---------- */
  var idx = null;
  function fillToday() {
    var roots = $$('[data-today]'); if (!roots.length) return;
    function go() {
      var n = currentDay(); var row = idx.days[n - 1]; if (!row) return;
      roots.forEach(function (root) {
        var u = idx.units.filter(function (x) { return n >= x.first && n <= x.last; })[0];
        function put(k, v) { $$('[data-t="' + k + '"]', root).forEach(function (el) { el.textContent = v; }); }
        put('label', 'Day ' + n + ' · Unit ' + row[1]); put('week', 'Week ' + row[2] + ' · Year ' + (row[1] <= 14 ? 1 : 2));
        put('passage', row[4]); put('theme', row[5]); put('unit', u ? u.title : ''); put('type', idx.labels[row[3]] || '');
        $$('[data-t="link"]', root).forEach(function (a) { a.href = BASE + 'day/' + n + '/'; });
        $$('[data-t="unitlink"]', root).forEach(function (a) { a.href = BASE + 'unit/' + row[1] + '/'; });
        var cal = calendarDay(), nu = firstUndone();
        var alt = $('[data-t="alt"]', root);
        if (alt) { if (cal && nu < cal) { alt.hidden = false; alt.innerHTML = ''; var a = document.createElement('a'); a.href = BASE + 'day/' + nu + '/'; a.textContent = 'Day ' + nu + ' is the first day you have not finished.'; alt.appendChild(a); } else alt.hidden = true; }
        var v = idx.verses[row[2] - 1];
        if (v) { $$('[data-v="text"]', root).forEach(function (e) { e.textContent = '“' + v[1] + '”'; }); $$('[data-v="ref"]', root).forEach(function (e) { e.textContent = v[0]; }); $$('[data-v="week"]', root).forEach(function (e) { e.textContent = 'Memory Verse · Week ' + row[2]; }); }
        var wc = $('[data-week-cards]', root);
        if (wc) {
          wc.innerHTML = '';
          for (var i = n; i < n + 4 && i <= TOTAL; i++) {
            var r = idx.days[i - 1]; var a2 = document.createElement('a'); a2.className = 'tile' + (i === n ? ' current' : ''); a2.href = BASE + 'day/' + i + '/'; a2.setAttribute('data-day', i);
            var tg = document.createElement('div'); tg.className = 'tag'; tg.textContent = 'Day ' + i + ' · ' + (i === n ? 'Today' : (idx.labels[r[3]] || '')); a2.appendChild(tg);
            var t = document.createElement('div'); t.className = 't'; t.textContent = r[4]; a2.appendChild(t);
            var d = document.createElement('div'); d.className = 'd'; d.textContent = r[5]; a2.appendChild(d); wc.appendChild(a2);
          }
        }
        $$('[data-done-toggle]', root).forEach(function (b) { b.setAttribute('data-done-toggle', n); });
      });
      refresh();
    }
    if (idx) return go();
    fetch(BASE + 'data/days.json').then(function (r) { return r.json(); }).then(function (j) { idx = j; go(); }).catch(function () {});
  }

  /* ---------- memory practice ---------- */
  var pt = $('[data-practice-toggle]');
  if (pt) {
    function initials(s) { return s.split(' ').map(function (w) { var m = w.match(/^([^A-Za-z0-9]*)([A-Za-z0-9])(.*?)([^A-Za-z0-9]*)$/); return m ? m[1] + m[2] + m[4] : w; }).join(' '); }
    var on = false;
    function paint() {
      pt.setAttribute('aria-pressed', on ? 'true' : 'false'); pt.textContent = on ? 'Show full verses' : 'Practice: show first letters only';
      $$('.verse-item .t').forEach(function (t) { var full = t.getAttribute('data-full'); t.textContent = on && !t.hasAttribute('data-shown') ? initials(full) : full; });
    }
    pt.addEventListener('click', function () { on = !on; $$('.verse-item .t').forEach(function (t) { t.removeAttribute('data-shown'); }); paint(); });
    $$('.verse-item .t').forEach(function (t) { t.addEventListener('click', function () { if (!on) return; if (t.hasAttribute('data-shown')) t.removeAttribute('data-shown'); else t.setAttribute('data-shown', '1'); paint(); }); });
  }

  /* ---------- filters ---------- */
  $$('[data-filter-group]').forEach(function (g) {
    var chips = $$('button[data-filter]', g); var rows = $$(g.getAttribute('data-filter-group'));
    chips.forEach(function (c) { c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
      var v = c.getAttribute('data-filter');
      rows.forEach(function (r) { r.hidden = !(v === 'all' || r.getAttribute('data-key') === v); });
    }); });
  });
  var gf = $('[data-glossary-filter]');
  if (gf) gf.addEventListener('input', function () {
    var q = gf.value.trim().toLowerCase();
    $$('.gl-item').forEach(function (i) { i.hidden = q && i.textContent.toLowerCase().indexOf(q) < 0; });
  });

  /* ---------- day page: scroll spy + keep current day in view ---------- */
  var left = $('.day-shell .left');
  if (left) { var cur = $('[aria-current="page"]', left); if (cur) left.scrollTop = Math.max(0, cur.offsetTop - left.clientHeight / 2); }
  var secs = $$('.day-sec[id]');
  if (secs.length && 'IntersectionObserver' in window) {
    var links = {}; $$('.rail-steps a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === e.target.id); }); } });
    }, { rootMargin: '-20% 0px -70% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }
  document.addEventListener('keydown', function (e) {
    if (e.target.matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
    var p = $('[data-prev]'), n = $('[data-next]');
    if (e.key === 'ArrowLeft' && p) location.href = p.href;
    if (e.key === 'ArrowRight' && n) location.href = n.href;
  });

  applyLook(); refresh(); fillToday();
})();
