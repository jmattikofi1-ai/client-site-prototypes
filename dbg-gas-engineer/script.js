(function () {
  'use strict';

  var EMAIL = 'dbgasengineer@gmail.com';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Mobile menu */
  var btn = $('.menu-btn');
  var nav = $('#site-nav');
  var wide = window.matchMedia('(min-width: 62em)');
  function setMenu(open) {
    if (!btn) { return; }
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) { setMenu(false); } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); }
    });
    var onWide = function () { if (wide.matches) { setMenu(false); } };
    if (wide.addEventListener) { wide.addEventListener('change', onWide); } else { wide.addListener(onWide); }
  }

  /* Services filter */
  var cards = $$('#svc-grid .svc');
  var chips = $$('.chip-btn');
  var search = $('#svc-search');
  var count = $('#svc-count');
  var empty = $('#svc-empty');
  var active = 'all';
  var labels = {};
  chips.forEach(function (c) { labels[c.getAttribute('data-filter')] = c.textContent; });

  function applyFilter() {
    var q = (search.value || '').trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (li) {
      var cats = li.getAttribute('data-cats').split(' ');
      var text = (li.textContent + ' ' + (li.getAttribute('data-kw') || '')).toLowerCase();
      var ok = (active === 'all' || cats.indexOf(active) > -1) && (!q || q.split(/\s+/).every(function (w) { return text.indexOf(w) > -1; }));
      li.hidden = !ok;
      if (ok) { shown++; }
    });
    var scope = active === 'all' ? '' : ' in ' + labels[active];
    count.textContent = 'Showing ' + shown + ' of ' + cards.length + ' services' + scope + (q ? ' matching \u201c' + search.value.trim() + '\u201d' : '');
    empty.hidden = shown !== 0;
  }
  if (cards.length && search) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        active = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        applyFilter();
      });
    });
    search.addEventListener('input', applyFilter);
    applyFilter();
  }

  /* Prefill the enquiry form from service cards / landlord CTA */
  var select = $('#f-service');
  $$('a[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-service');
      if (select && v) { select.value = v; }
    });
  });

  /* Enquiry form -> prefilled mailto */
  var form = $('#enquiry');
  var status = $('#form-status');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#f-name'), phone = $('#f-phone');
      var bad = [name, phone].filter(function (f) { var v = !f.value.trim(); f.classList.toggle('invalid', v); f.setAttribute('aria-invalid', v ? 'true' : 'false'); return v; });
      if (bad.length) {
        status.textContent = 'Please add your name and a phone number so Derek can get back to you.';
        status.classList.add('err');
        bad[0].focus();
        return;
      }
      status.classList.remove('err');
      var service = select.value || 'General enquiry';
      var body = [
        'Hello Derek,', '',
        'Name: ' + name.value.trim(),
        'Phone: ' + phone.value.trim(),
        'Town / postcode: ' + ($('#f-town').value.trim() || '-'),
        'Service: ' + service, '',
        $('#f-msg').value.trim(), '',
        'Sent from the DBG website enquiry form'
      ].join('\n');
      var href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Website enquiry: ' + service) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app\u2026 if nothing happens, email ' + EMAIL + ' or call 01869 570449.';
      window.location.href = href;
    });
  }

  /* Gallery lightbox */
  var dlg = $('#lightbox');
  var items = $$('.g-item');
  var idx = 0;
  if (dlg && items.length && typeof dlg.showModal === 'function') {
    var img = $('#lb-img'), counter = $('#lb-count');
    var show = function (i) {
      idx = (i + items.length) % items.length;
      var it = items[idx];
      img.src = it.getAttribute('data-full');
      img.alt = it.getAttribute('data-alt');
      img.width = +it.getAttribute('data-w');
      img.height = +it.getAttribute('data-h');
      counter.textContent = (idx + 1) + ' of ' + items.length;
    };
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { show(i); dlg.showModal(); document.documentElement.classList.add('lb-open'); });
    });
    $('#lb-prev').addEventListener('click', function () { show(idx - 1); });
    $('#lb-next').addEventListener('click', function () { show(idx + 1); });
    $('#lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) { dlg.close(); } });
    dlg.addEventListener('close', function () { document.documentElement.classList.remove('lb-open'); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(idx - 1); } else if (e.key === 'ArrowRight') { show(idx + 1); }
    });
  } else {
    items.forEach(function (it) { it.addEventListener('click', function () { window.open(it.getAttribute('data-full'), '_blank', 'noopener'); }); });
  }

  /* Scroll reveal */
  var reveals = $$('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('in'); });
  }

  /* Highlight current section in the nav */
  var links = $$('.nav a[href^="#"]');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.removeAttribute('aria-current'); });
          map[en.target.id].setAttribute('aria-current', 'true');
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) { so.observe(s); } });
  }
})();
