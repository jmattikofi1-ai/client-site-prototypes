(function () {
  'use strict';

  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };

  var yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Mobile menu */
  var menuBtn = $('.menu-btn');
  var nav = $('#site-nav');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.matchMedia('(min-width: 72em)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* Tabs */
  $$('[data-tabs]').forEach(function (wrap) {
    var tabs = $$('[role="tab"]', wrap);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        panel.classList.remove('is-in');
        if (on) { void panel.offsetWidth; panel.classList.add('is-in'); }
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') n = tabs[0];
        else if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* Scroll reveal */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Scroll-driven bits: page progress line and safe-isolation process */
  var line = $('.scroll-line span');
  var process = $('[data-process]');
  var steps = process ? $$('.step', process) : [];
  var stepList = process ? $('[data-steps]', process) : null;
  var breaker = process ? $('.breaker', process) : null;
  var readout = process ? $('[data-readout]', process) : null;
  var ticking = false;

  function updateProcess() {
    if (!stepList) return;
    var vh = window.innerHeight;
    var mark = vh * 0.55;
    var rect = stepList.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
    if (reduce.matches) p = 1;
    stepList.style.setProperty('--p', p.toFixed(3));
    var active = -1;
    steps.forEach(function (s, i) {
      var node = $('.step__node', s).getBoundingClientRect();
      var on = reduce.matches || node.top + node.height / 2 < mark;
      s.classList.toggle('is-on', on);
      if (on) active = i;
    });
    var cur = steps[Math.max(active, 0)];
    if (breaker && cur) {
      breaker.setAttribute('data-state', reduce.matches ? 'live' : cur.getAttribute('data-state'));
      if (readout) readout.innerHTML = cur.getAttribute('data-read');
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (line) {
        var max = doc.documentElement.scrollHeight - window.innerHeight;
        line.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
      }
      updateProcess();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
  updateProcess();

  /* "What do you need?" selector -> enquiry form */
  var form = $('#enquiry-form');
  var picks = $$('input[name="need"]');
  var chips = $('[data-chips]');
  var none = $('[data-none]');
  var formSel = $('[data-form-sel]');
  var msg = $('#f-msg');

  function selected() {
    return picks.filter(function (p) { return p.checked; }).map(function (p) { return p.value; });
  }
  function syncSelection() {
    var vals = selected();
    chips.innerHTML = '';
    vals.forEach(function (v) {
      var li = doc.createElement('li');
      li.textContent = v;
      chips.appendChild(li);
    });
    none.hidden = vals.length > 0;
    formSel.textContent = vals.length ? vals.join(', ') : 'Choose above or describe below';
  }
  picks.forEach(function (p) { p.addEventListener('change', syncSelection); });
  syncSelection();

  /* Enquiry -> mailto */
  if (form) {
    var status = $('[data-status]', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = form.getAttribute('data-mailto');
      var v = function (id) { return (doc.getElementById(id).value || '').trim(); };
      var needs = selected();
      var lines = [
        'Hello John,',
        '',
        'I would like to make an enquiry.',
        '',
        'Job: ' + (needs.length ? needs.join(', ') : 'Not specified'),
        'Property type: ' + (v('f-type') || 'Not specified'),
        'Town / postcode: ' + (v('f-place') || 'Not specified'),
        '',
        v('f-msg') || '(No further details)',
        '',
        'Name: ' + v('f-name'),
        'Phone: ' + (v('f-phone') || 'Not given'),
        'Email: ' + (v('f-email') || 'Not given')
      ];
      var subject = 'Website enquiry' + (needs.length ? ': ' + needs[0] + (needs.length > 1 ? ' +' + (needs.length - 1) : '') : '');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\r\n'));
      status.textContent = 'Opening your email app. If nothing happens, email ' + to + ' or call 01296 415476.';
    });
  }
})();
