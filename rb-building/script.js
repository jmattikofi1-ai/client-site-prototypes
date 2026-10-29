(function () {
  'use strict';

  // Set a real email here once confirmed by the client to enable "Send by email".
  var EMAIL = '';
  var SMS_NUMBER = '07596493021';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  var menuBtn = $('.menu-btn');
  var nav = $('#site-nav');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  var desktopMq = window.matchMedia('(min-width: 72em)');
  var onDesktop = function () { if (desktopMq.matches) setMenu(false); };
  if (desktopMq.addEventListener) desktopMq.addEventListener('change', onDesktop);

  /* Service explorer tabs */
  var services = $('#services');
  var tabs = $$('.tab', services);
  var panels = { build: $('#panel-build'), landscape: $('#panel-land') };
  var tabFor = { build: $('#tab-build'), landscape: $('#tab-land') };
  function setSide(side, focus) {
    services.setAttribute('data-side', side);
    Object.keys(tabFor).forEach(function (k) {
      var on = k === side;
      tabFor[k].setAttribute('aria-selected', String(on));
      tabFor[k].tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
    });
    if (focus) tabFor[side].focus();
  }
  setSide('build');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { setSide(t === tabFor.build ? 'build' : 'landscape'); });
    t.addEventListener('keydown', function (e) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) === -1) return;
      e.preventDefault();
      var next = e.key === 'Home' ? 'build' : e.key === 'End' ? 'landscape' : (t === tabFor.build ? 'landscape' : 'build');
      setSide(next, true);
    });
  });
  $$('.pane').forEach(function (p) {
    p.addEventListener('click', function () { setSide(p.getAttribute('data-side')); });
  });

  /* Scroll reveal */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Before / after */
  var ba = $('[data-ba]');
  if (ba) {
    var stage = $('.ba-stage', ba);
    var range = $('.ba-range', ba);
    var imgBefore = $('.ba-before', ba);
    var imgAfter = $('.ba-after', ba);
    var caption = $('.ba-caption', ba);
    var pickBtns = $$('.ba-pick button');
    var setPos = function (v) { stage.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { setPos(range.value); });
    var showPair = function (btn) {
      var key = btn.getAttribute('data-key');
      imgBefore.src = 'assets/ba-' + key + '-before.jpg';
      imgAfter.src = 'assets/ba-' + key + '-after.jpg';
      imgBefore.alt = 'Before: ' + btn.getAttribute('data-before');
      imgAfter.alt = 'After: ' + btn.getAttribute('data-after');
      caption.textContent = btn.getAttribute('data-title') + '. Slide to compare.';
      pickBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      range.value = 50; setPos(50);
    };
    pickBtns.forEach(function (b) { b.addEventListener('click', function () { showPair(b); }); });
    showPair(pickBtns[0]);
  }

  /* Gallery filter */
  var items = $$('#grid > li');
  var status = $('#gallery-status');
  var chips = $$('.filters .chip');
  function applyFilter(f) {
    var n = 0;
    items.forEach(function (li) {
      var show = f === 'all' || li.getAttribute('data-cat') === f;
      li.hidden = !show;
      if (show) n++;
    });
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-filter') === f)); });
    status.textContent = 'Showing ' + n + (f === 'all' ? ' photos' : ' ' + f + ' photos');
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { applyFilter(c.getAttribute('data-filter')); }); });

  /* Lightbox */
  var lb = $('#lightbox');
  var lbImg = $('#lb-img');
  var lbCap = $('#lb-cap');
  var lbCount = $('#lb-count');
  var current = 0;
  var visible = function () { return items.filter(function (li) { return !li.hidden; }); };
  function show(i) {
    var list = visible();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    var btn = $('.g-item', list[current]);
    var img = $('img', btn);
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.alt;
    lbImg.width = img.width; lbImg.height = img.height;
    lbCap.textContent = btn.getAttribute('data-caption');
    lbCount.textContent = (current + 1) + ' of ' + list.length;
  }
  function openLb(i) {
    show(i);
    if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeLb() {
    if (typeof lb.close === 'function') lb.close(); else lb.removeAttribute('open');
  }
  lb.addEventListener('close', function () { document.documentElement.style.overflow = ''; });
  items.forEach(function (li) {
    $('.g-item', li).addEventListener('click', function () { openLb(visible().indexOf(li)); });
  });
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', function () { show(current - 1); });
  $('.lb-next', lb).addEventListener('click', function () { show(current + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { show(current - 1); }
    else if (e.key === 'ArrowRight') { show(current + 1); }
    else if (e.key === 'Escape' && typeof lb.showModal !== 'function') { closeLb(); }
  });

  /* Testimonials carousel */
  var track = $('#track');
  function slide(dir) {
    track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.85, 240), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  $('#car-prev').addEventListener('click', function () { slide(-1); });
  $('#car-next').addEventListener('click', function () { slide(1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); slide(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); slide(-1); }
  });

  /* Quote form: builds a prefilled text (and email, if an address is configured) */
  var form = $('#quote-form');
  var note = $('#form-note');
  var mailBtn = $('#send-mail');
  function compose() {
    var v = function (id) { return ($('#' + id).value || '').trim(); };
    var lines = ['Hello RB Building and Landscaping, I would like a quote.'];
    lines.push('Job type: ' + v('f-type'));
    if (v('f-msg')) lines.push('Details: ' + v('f-msg'));
    if (v('f-area')) lines.push('Area: ' + v('f-area'));
    if (v('f-name')) lines.push('Name: ' + v('f-name'));
    if (v('f-phone')) lines.push('Call me on: ' + v('f-phone'));
    return lines.join('\n');
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    window.location.href = 'sms:' + SMS_NUMBER + '?body=' + encodeURIComponent(compose());
    note.textContent = 'Opening your messaging app. If nothing happens, use Copy enquiry or call us on 07596 493021.';
  });
  $('#copy-msg').addEventListener('click', function () {
    var text = compose();
    var done = function () { note.textContent = 'Enquiry copied. Paste it into a message or email.'; };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { note.textContent = 'Could not copy. Please call 07596 493021.'; }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); } else { fallback(); }
  });
  if (EMAIL) {
    mailBtn.hidden = false;
    mailBtn.addEventListener('click', function () {
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote enquiry') + '&body=' + encodeURIComponent(compose());
    });
  }
})();
