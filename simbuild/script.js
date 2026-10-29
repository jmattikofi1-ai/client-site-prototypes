(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* years since 1995 */
  var yc = $('#yearsCount');
  if (yc) {
    var since = parseInt(yc.getAttribute('data-since'), 10);
    var years = new Date().getFullYear() - since;
    var unit = $('#yearsUnit');
    var setYears = function (n) { yc.textContent = n; };
    unit.textContent = 'years (since ' + since + ')';
    if (reduce) { setYears(years); }
    else {
      setYears(0);
      var t0 = null;
      var tick = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / 1400);
        setYears(Math.round(years * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* mobile menu */
  var menuBtn = $('#menuBtn'), nav = $('#siteNav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100) setMenu(false); });

  /* tabs */
  var tabs = $$('[role="tab"]');
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  function selectTab(tab, focus) {
    tabs.forEach(function (t, i) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });
  selectTab(tabs[0]);

  function showService(key) {
    var t = $('[data-key="' + key + '"]');
    if (t) selectTab(t);
  }

  /* boiler helper */
  var SERVICES = {
    repairs: { name: 'Boiler repairs & servicing', why: 'A qualified Gas Safe engineer can diagnose the fault or give your boiler its annual service.' },
    heating: { name: 'Heating installation', why: 'An older, inefficient boiler may be worth replacing with a new high-efficiency one.' },
    flush: { name: 'Power flushing', why: 'Sludge and debris in the system can cause cold spots and noisy running. A power flush cleans it out.' },
    plumbing: { name: 'Plumbing & drainage', why: 'Leaks, drips and drainage problems are a job for our plumbing and drainage work.' },
    building: { name: 'Building work', why: 'We can help with building work that goes alongside heating and plumbing projects.' },
    emergency: { name: 'Emergency 24h call-out', why: 'This sounds urgent. Call now and speak to an engineer.' }
  };
  var WEIGHTS = {
    nohot: { repairs: 3, emergency: 1 },
    cutout: { repairs: 2, flush: 2 },
    bang: { flush: 3, repairs: 1 },
    coldbottom: { flush: 4 },
    pipes: { flush: 2, plumbing: 1 },
    old: { heating: 4, repairs: 1 },
    service: { repairs: 4 },
    leak: { plumbing: 4 },
    build: { building: 4 },
    urgent: { emergency: 6 }
  };
  var checker = $('#checker'), result = $('#checkResult'), reset = $('#checkReset');
  var CALL = '<a class="btn btn-flame btn-sm" href="tel:+447870601095">Call 07870 601095</a>';
  function recommend() {
    var chosen = $$('input[name="s"]:checked', checker).map(function (i) { return i.value; });
    if (!chosen.length) {
      result.innerHTML = '<p class="result-empty">Pick one or more above to see our suggestion.</p>';
      reset.hidden = true; return;
    }
    var score = {};
    chosen.forEach(function (c) { Object.keys(WEIGHTS[c]).forEach(function (k) { score[k] = (score[k] || 0) + WEIGHTS[c][k]; }); });
    var ranked = Object.keys(score).sort(function (a, b) { return score[b] - score[a]; });
    var top = ranked[0], s = SERVICES[top];
    var also = ranked.slice(1, 3).map(function (k) {
      return '<a href="#services" data-go="' + k + '">' + SERVICES[k].name + '</a>';
    }).join(' &middot; ');
    var urgent = top === 'emergency';
    result.innerHTML =
      '<div class="result-card' + (urgent ? ' result-urgent' : '') + '">' +
      '<p class="eyebrow">We\u2019d suggest</p><h3>' + s.name + '</h3><p>' + s.why + '</p>' +
      '<div class="result-actions">' +
      (urgent ? CALL : '<a class="btn btn-flame btn-sm" href="#services" data-go="' + top + '">See this service</a>' + CALL) +
      '<a class="btn btn-sm ' + (urgent ? 'btn-ghost-dark' : 'btn-ghost') + '" href="#contact" data-prefill="' + s.name.replace('&', '&amp;') + '">Send an enquiry</a></div>' +
      (also ? '<p class="also">Also worth a look: ' + also + '</p>' : '') +
      '<p class="result-note">General guide only &mdash; we\u2019ll confirm the actual cause on site. If you smell gas, call 0800 111 999 and leave the property.</p></div>';
    reset.hidden = false;
  }
  checker.addEventListener('change', recommend);
  checker.addEventListener('reset', function () { setTimeout(recommend, 0); });
  result.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (a) showService(a.getAttribute('data-go'));
  });

  /* prefill enquiry service from CTA links */
  var service = $('#f-service');
  var MAP = {
    'Boiler repair / servicing': 'Boiler repair / servicing',
    'Boiler repairs & servicing': 'Boiler repair / servicing',
    'Heating installation': 'New heating / boiler installation',
    'Power flushing': 'Power flushing',
    'Plumbing & drainage': 'Plumbing / drainage',
    'Building work': 'Building work',
    'Emergency 24h call-out': 'Emergency (24h)'
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-prefill]');
    if (!a) return;
    var v = a.getAttribute('data-prefill').replace(/&amp;/g, '&');
    v = MAP[v] || v;
    $$('option', service).forEach(function (o) { if (o.value === v || o.textContent === v) service.value = o.value; });
  });

  /* power flush demo */
  var svg = $('#flushSvg'), range = $('#flushRange'), flushBtn = $('#flushBtn');
  var raf = null, played = false;
  function setClean(v) {
    svg.style.setProperty('--clean', v);
    range.value = Math.round(v * 100);
    range.setAttribute('aria-valuetext', v < 0.1 ? 'Before: sludge-clogged' : v > 0.9 ? 'After: clean' : Math.round(v * 100) + '% flushed');
  }
  function stopAnim() { if (raf) cancelAnimationFrame(raf); raf = null; svg.classList.remove('is-flushing'); flushBtn.textContent = 'Run the power flush'; }
  function play() {
    played = true;
    if (reduce) { setClean(1); return; }
    stopAnim();
    var from = parseFloat(range.value) / 100; if (from > 0.95) from = 0;
    var dur = 4200 * (1 - from), t0 = null;
    svg.classList.add('is-flushing'); flushBtn.textContent = 'Flushing\u2026';
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      setClean(from + (1 - from) * (p * p * (3 - 2 * p)));
      if (p < 1) raf = requestAnimationFrame(step); else { stopAnim(); flushBtn.textContent = 'Replay'; }
    };
    raf = requestAnimationFrame(step);
  }
  setClean(0);
  flushBtn.addEventListener('click', play);
  range.addEventListener('input', function () { stopAnim(); played = true; setClean(range.value / 100); });
  if ('IntersectionObserver' in window && !reduce) {
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !played) { setTimeout(function () { if (!played) play(); }, 600); fo.disconnect(); } });
    }, { threshold: 0.6 });
    fo.observe(svg);
  }

  /* enquiry -> mailto */
  var form = $('#enquiry'), status = $('#formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.elements.name, msg = form.elements.message, ok = true;
    [name, msg].forEach(function (f) {
      var bad = !f.value.trim();
      f.setAttribute('aria-invalid', String(bad));
      if (bad && ok) { f.focus(); }
      if (bad) ok = false;
    });
    status.classList.remove('ok');
    if (!ok) { status.textContent = 'Please add your name and a short message.'; return; }
    var v = function (n) { return form.elements[n].value.trim(); };
    var body = 'Name: ' + v('name') + '\nPhone: ' + (v('phone') || '-') + '\nPostcode: ' + (v('postcode') || '-') +
      '\nService: ' + v('service') + '\n\n' + v('message');
    var href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent('Website enquiry: ' + v('service')) +
      '&body=' + encodeURIComponent(body);
    status.classList.add('ok');
    status.textContent = 'Opening your email app\u2026 if nothing happens, please call us on 07870 601095.';
    window.location.href = href;
  });

  /* scroll reveal */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else {
    rev.forEach(function (el) { el.classList.add('in'); });
  }
})();
