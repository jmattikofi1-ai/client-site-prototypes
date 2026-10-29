(function () {
  'use strict';

  // Set this to the garage's confirmed email address to switch the form to a prefilled mailto: link.
  var BOOKING_EMAIL = '';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile navigation */
  var toggle = $('.nav-toggle');
  var nav = $('#site-nav');
  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setNav(false); toggle.focus(); }
    });
    window.matchMedia('(min-width: 70em)').addEventListener('change', function (e) { if (e.matches) setNav(false); });
  }

  /* Live opening hours (Europe/London, Mon–Fri 08:30–17:30) */
  var OPEN = 8 * 60 + 30, CLOSE = 17 * 60 + 30;
  var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function londonNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return { day: DAYS[o.weekday], mins: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }
  function nextOpenText(day, mins) {
    var d = day;
    if (d >= 1 && d <= 5 && mins < OPEN) return 'Opens today at 8:30am';
    var add = 1;
    do { d = (d + 1) % 7; if (d >= 1 && d <= 5) break; add++; } while (add < 8);
    return add === 1 ? 'Opens tomorrow at 8:30am' : 'Opens ' + NAMES[d] + ' at 8:30am';
  }
  function updateStatus() {
    var n = londonNow();
    var weekday = n.day >= 1 && n.day <= 5;
    var isOpen = weekday && n.mins >= OPEN && n.mins < CLOSE;
    var label = isOpen ? 'Open now' : 'Closed';
    var detail = isOpen ? 'Closes at 5:30pm' : nextOpenText(n.day, n.mins);
    $$('[data-status]').forEach(function (el) {
      el.setAttribute('data-state', isOpen ? 'open' : 'closed');
      $('.status-label', el).textContent = label;
      $('.status-detail', el).textContent = detail;
    });
    $$('#hours-table [data-day]').forEach(function (row) {
      row.classList.toggle('today', parseInt(row.getAttribute('data-day'), 10) === n.day);
    });
  }
  try { updateStatus(); setInterval(updateStatus, 30000); } catch (e) { /* keep static hours text */ }

  /* Scroll reveal */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Inspection explorer */
  var groups = $$('.insp-group');
  var tabList = $('#insp-tabs');
  var items = $$('.insp-list li');
  var total = items.length;
  var n = 0;
  items.forEach(function (li) {
    n++;
    var badge = document.createElement('span');
    badge.className = 'n';
    badge.innerHTML = '<span>' + n + '</span>';
    li.insertBefore(badge, li.firstChild);
    var text = document.createElement('span');
    text.textContent = li.childNodes[1].textContent;
    li.removeChild(li.childNodes[1]);
    li.appendChild(text);
  });
  $$('.insp-list').forEach(function (ol) { ol.setAttribute('role', 'list'); });

  var tabs = [];
  function selectGroup(i, focus) {
    groups.forEach(function (g, idx) { g.hidden = idx !== i; });
    tabs.forEach(function (t, idx) {
      t.setAttribute('aria-selected', String(idx === i));
      t.tabIndex = idx === i ? 0 : -1;
    });
    if (focus) tabs[i].focus();
  }
  groups.forEach(function (g, i) {
    var t = document.createElement('button');
    t.type = 'button';
    t.className = 'insp-tab';
    t.setAttribute('role', 'tab');
    t.id = 'tab-' + g.id;
    t.setAttribute('aria-controls', g.id);
    t.innerHTML = '<span></span><span class="count">' + $$('li', g).length + '</span>';
    t.firstChild.textContent = g.getAttribute('data-title');
    t.addEventListener('click', function () { selectGroup(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, next = null;
      if (k === 'ArrowRight' || k === 'ArrowDown') next = (i + 1) % groups.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') next = (i - 1 + groups.length) % groups.length;
      else if (k === 'Home') next = 0;
      else if (k === 'End') next = groups.length - 1;
      if (next !== null) { e.preventDefault(); selectGroup(next, true); }
    });
    g.setAttribute('role', 'tabpanel');
    g.setAttribute('aria-labelledby', t.id);
    tabs.push(t);
    tabList.appendChild(t);
  });
  if (groups.length) selectGroup(0);

  var gaugeFill = $('#gauge-fill');
  var gaugeNum = $('#gauge-num');
  var gaugeLabel = $('#gauge-label');
  var gaugeNote = $('#gauge-note');
  var timer = null;
  function setGauge(done) {
    gaugeFill.setAttribute('stroke-dasharray', (done / total * 100) + ' 100');
    gaugeFill.style.opacity = done ? '1' : '0';
    gaugeNum.textContent = done;
    gaugeLabel.textContent = 'of ' + total + ' points checked';
  }
  function resetDemo() {
    clearInterval(timer);
    items.forEach(function (li) { li.classList.remove('done', 'flash'); });
    setGauge(0);
    gaugeNote.textContent = 'Demo only – not a real test result.';
    selectGroup(0);
  }
  function runDemo() {
    resetDemo();
    var i = 0;
    function step() {
      var li = items[i];
      li.classList.add('done');
      var gi = groups.indexOf(li.closest('.insp-group'));
      if (!groups[gi] || groups[gi].hidden) selectGroup(gi);
      i++;
      setGauge(i);
      if (i >= total) {
        clearInterval(timer);
        gaugeNote.textContent = 'Demo complete – every point covered. (Illustration only, not a real result.)';
      }
    }
    if (reduceMotion) {
      while (i < total) step();
      selectGroup(0);
    } else {
      gaugeNote.textContent = 'Inspecting…';
      timer = setInterval(step, 110);
    }
  }
  $('#run-demo').addEventListener('click', runDemo);
  $('#reset-demo').addEventListener('click', resetDemo);
  setGauge(0);

  /* FAQ accordion */
  $$('.faq-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      document.getElementById(btn.getAttribute('aria-controls')).hidden = open;
    });
  });

  /* Plate inputs */
  $$('.plate input').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var pos = inp.selectionStart;
      inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
      try { inp.setSelectionRange(pos, pos); } catch (e) { /* not supported */ }
    });
  });

  /* Hero quick start -> booking form */
  var quick = $('#quick-form');
  var regField = $('#f-reg');
  if (quick) {
    quick.addEventListener('submit', function (e) {
      e.preventDefault();
      regField.value = $('#quick-reg').value;
      var target = document.getElementById('book');
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { $('#f-name').focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
    });
  }

  /* Booking form */
  var form = $('#book-form');
  var result = $('#form-result');
  var resultText = $('#result-text');
  function fieldError(id, msg) {
    var input = document.getElementById('f-' + id);
    var err = document.getElementById('e-' + id);
    err.textContent = msg;
    if (msg) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', 'e-' + id); }
    else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
    return !msg;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { return document.getElementById('f-' + id).value.trim(); };
    var ok1 = fieldError('name', v('name') ? '' : 'Please enter your name.');
    var ok2 = fieldError('phone', /^[0-9 +()-]{7,}$/.test(v('phone')) ? '' : 'Please enter a phone number we can call you on.');
    var ok3 = fieldError('reg', v('reg').length >= 2 ? '' : 'Please enter your vehicle registration.');
    if (!(ok1 && ok2 && ok3)) {
      var bad = $('[aria-invalid="true"]', form);
      if (bad) bad.focus();
      return;
    }
    var lines = [
      'Booking request – Motest Newport Pagnell',
      'Name: ' + v('name'),
      'Phone: ' + v('phone'),
      'Registration: ' + v('reg'),
      v('make') ? 'Vehicle: ' + v('make') : '',
      'Service: ' + document.getElementById('f-service').value,
      'Preferred day: ' + document.getElementById('f-day').value,
      v('notes') ? 'Notes: ' + v('notes') : ''
    ].filter(Boolean);
    var text = lines.join('\n');
    if (BOOKING_EMAIL) {
      window.location.href = 'mailto:' + BOOKING_EMAIL + '?subject=' + encodeURIComponent('Booking request – ' + v('reg')) + '&body=' + encodeURIComponent(text);
      return;
    }
    resultText.textContent = text;
    result.hidden = false;
    $('#result-title').textContent = 'Nearly there – call to book';
    result.focus();
    result.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
  $('#copy-btn').addEventListener('click', function () {
    var status = $('#copy-status');
    var text = resultText.textContent;
    function done(ok) { status.textContent = ok ? 'Copied – ready to read out or paste.' : 'Couldn’t copy automatically – please select the text above.'; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    } else { done(false); }
  });

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
