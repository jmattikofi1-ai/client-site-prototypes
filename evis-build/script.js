(function () {
  'use strict';

  var doc = document;
  var header = doc.querySelector('.site-header');
  var nav = doc.getElementById('site-nav');
  var menuBtn = doc.querySelector('.menu-btn');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mobile menu */
  function setMenu(open) {
    if (!menuBtn || !nav) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 64em)').matches) setMenu(false);
    });
  }

  /* Header shadow */
  function onScroll() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Scroll reveal */
  var revealEls = doc.querySelectorAll('.reveal, .art');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* Active section in nav */
  var navLinks = nav ? nav.querySelectorAll('a[href^="#"]') : [];
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = doc.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* Accordion */
  doc.querySelectorAll('[data-accordion]').forEach(function (acc) {
    acc.querySelectorAll('.acc-btn').forEach(function (btn) {
      var panel = doc.getElementById(btn.getAttribute('aria-controls'));
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (open) panel.setAttribute('hidden', ''); else panel.removeAttribute('hidden');
      });
    });
  });

  /* Enquiry form -> prefilled mailto */
  var form = doc.getElementById('enquiry');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return (doc.getElementById(id).value || '').trim(); };
      var lines = [
        'Name: ' + v('f-name'),
        'Telephone: ' + v('f-phone'),
        'Email: ' + v('f-email'),
        'Project area: ' + (v('f-area') || 'Not specified'),
        'Looking for: ' + (v('f-type') || 'Not specified'),
        '',
        v('f-msg')
      ];
      var subject = 'Enquiry from ' + v('f-name') + (v('f-type') ? ' — ' + v('f-type') : '');
      var href = 'mailto:info@evisbuild.co.uk?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\r\n'));
      var status = doc.getElementById('form-status');
      if (status) status.textContent = 'Opening your email app… if nothing happens, email info@evisbuild.co.uk or call 020 3397 3379.';
      window.location.href = href;
    });
  }
})();
