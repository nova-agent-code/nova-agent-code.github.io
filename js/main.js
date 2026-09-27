/* ============================================================
   Nova Agent — main.js
   Smooth scrolling · mobile menu · reveal animations · cursor
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year stamp ---------- */
  document.querySelectorAll('#year').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.getElementById('navbar');
  function onScroll() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 12);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  function closeMenu() {
    if (!menuToggle || !mobileMenu) return;
    mobileMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', function () {
      const isOpen = mobileMenu.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 768) closeMenu();
    });
  }

  /* ---------- Smooth scrolling for anchor links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const offset = 88;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Scroll reveal (Intersection Observer) ---------- */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = el.parentElement
            ? Array.from(el.parentElement.children).filter(function (c) { return c.classList.contains('reveal'); })
            : [el];
          const index = siblings.indexOf(el);
          el.style.transitionDelay = (index > 0 ? Math.min(index, 8) * 70 : 0) + 'ms';
          el.classList.add('is-visible');
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });

    // Safety net: reveal anything still hidden after load (e.g. above-the-fold edge cases)
    window.addEventListener('load', function () {
      setTimeout(function () {
        revealEls.forEach(function (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add('is-visible');
        });
      }, 250);
    });
  }

  /* ---------- Feature card pointer glow ---------- */
  document.querySelectorAll('.feature-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - rect.left + 'px');
      card.style.setProperty('--my', e.clientY - rect.top + 'px');
    });
  });

  /* ---------- Custom cursor (dot + outline) ---------- */
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (dot && ring && finePointer && !prefersReducedMotion) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let visible = false;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = 'translate(' + (mouseX - 3.5) + 'px,' + (mouseY - 3.5) + 'px)';
      if (!visible) {
        visible = true;
        document.body.classList.add('cursor-ready');
      }
    });

    document.addEventListener('mouseleave', function () {
      document.body.classList.remove('cursor-ready');
      visible = false;
    });
    document.addEventListener('mouseenter', function () {
      if (visible) document.body.classList.add('cursor-ready');
    });

    const interactiveSelector = 'a, button, [role="button"], input, textarea, select, .feature-card, .mega-btn';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactiveSelector)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactiveSelector)) ring.classList.remove('is-hover');
    });

    (function raf() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      const size = ring.classList.contains('is-hover') ? 28 : 17;
      ring.style.transform = 'translate(' + (ringX - size) + 'px,' + (ringY - size) + 'px)';
      requestAnimationFrame(raf);
    })();
  }

  /* ---------- Active nav highlight on scroll ---------- */
  const sections = ['features', 'security', 'how', 'download']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            const active = link.getAttribute('href') === '#' + entry.target.id;
            link.style.color = active ? '#fff' : '';
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Read version manifest (optional, non-blocking) ---------- */
  fetch('version.json', { cache: 'no-cache' })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      if (!data || !data.version) return;
      const installed = document.getElementById('installed-version');
      if (installed && installed.dataset.dynamic !== 'false') {
        const params = new URLSearchParams(window.location.search);
        const current = params.get('from') || params.get('current');
        if (current) installed.textContent = current;
      }
      document.querySelectorAll('[data-latest-version]').forEach(function (el) {
        el.textContent = data.version;
      });
    })
    .catch(function () { /* manifest optional — page still works offline */ });

  /* ---------- Lightbox (click to zoom) ---------- */
  (function initLightbox() {
    const SELECTOR = 'img[data-lightbox], .shot-card img, .glass-window img, main figure img';

    // Query every relevant image currently in the document (index.html + update.html)
    const zoomables = Array.from(document.querySelectorAll(SELECTOR)).filter(function (img) {
      if (img.classList.contains('no-zoom')) return false;
      if (img.closest('.lightbox')) return false;
      return true;
    });
    if (!zoomables.length) return;

    // Build the overlay once
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<button class="lightbox-close" type="button" aria-label="Close image preview">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
        '</svg>' +
      '</button>' +
      '<figure class="lightbox-figure">' +
        '<img class="lightbox-img" alt="" />' +
        '<figcaption class="lightbox-caption"></figcaption>' +
      '</figure>' +
      '<span class="lightbox-hint">Click outside to close &middot; <kbd>Esc</kbd></span>';
    document.body.appendChild(overlay);

    const overlayImg = overlay.querySelector('.lightbox-img');
    const overlayCaption = overlay.querySelector('.lightbox-caption');
    const closeBtn = overlay.querySelector('.lightbox-close');
    let lastFocused = null;
    let isOpen = false;

    function getCaption(img) {
      const figure = img.closest('figure');
      const caption = figure ? figure.querySelector('figcaption') : null;
      const text = caption ? caption.textContent.trim() : '';
      return text || (img.getAttribute('alt') || '').trim();
    }

    function openLightbox(img) {
      if (isOpen) return;
      isOpen = true;
      lastFocused = document.activeElement;
      overlayImg.src = img.currentSrc || img.src;
      overlayImg.alt = img.alt || '';
      overlayCaption.textContent = getCaption(img);
      overlayCaption.style.display = getCaption(img) ? '' : 'none';
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      closeBtn.focus({ preventScroll: true });
    }

    function closeLightbox() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus({ preventScroll: true });
      }
      window.setTimeout(function () {
        if (!isOpen) overlayImg.removeAttribute('src');
      }, 320);
    }

    // 1) Click on any image → open
    zoomables.forEach(function (img) {
      img.addEventListener('click', function () { openLightbox(img); });
    });

    // 2) Click anywhere outside the image (backdrop, caption, gaps) → close
    overlay.addEventListener('click', function (e) {
      if (e.target === overlayImg) return;
      closeLightbox();
    });

    // 3) "X" button → close
    closeBtn.addEventListener('click', closeLightbox);

    // 4) Escape key → close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeLightbox();
      }
    });
  })();
})();
