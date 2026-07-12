/* ==================================================== */
/*  BROWSENT — Premium Interactions & Frame Background   */
/*  Purple theme · Glassmorphism · Scroll-Driven Frames  */
/* ==================================================== */

(() => {
  'use strict';

  // ---- 1. Footer year ----
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- 2. Loader ----
  const loader = document.getElementById('loader');
  const loaderBar = loader?.querySelector('.loader-bar i');
  let frameImagesTotal = 0, frameImagesLoaded = 0;
  let framesAllLoaded = false, windowLoaded = false, fontsLoaded = false;

  function setLoaderProgress(pct) {
    if (loaderBar) {
      loaderBar.style.width = Math.min(pct, 100) + '%';
      loaderBar.style.animation = 'none';
    }
  }

  function updateLoaderFromFrameProgress() {
    if (frameImagesTotal > 0) {
      var framePct = frameImagesLoaded / frameImagesTotal;
      var totalPct = framePct * 50 + (windowLoaded ? 25 : 0) + (fontsLoaded ? 25 : 0);
      setLoaderProgress(totalPct);
    }
  }

  function checkLoaderDone() {
    if (framesAllLoaded && windowLoaded && fontsLoaded) {
      setTimeout(() => loader.classList.add('hidden'), 500);
    }
  }

  if (loader) {
    window.addEventListener('load', () => {
      windowLoaded = true;
      updateLoaderFromFrameProgress();
      checkLoaderDone();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsLoaded = true;
        updateLoaderFromFrameProgress();
        checkLoaderDone();
      });
    } else {
      fontsLoaded = true;
    }

    setTimeout(() => {
      if (!loader.classList.contains('hidden')) {
        loader.classList.add('hidden');
      }
    }, 10000);
  }

  // ---- 3. Navigation ----
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const navLinksArr = navLinks ? Array.from(navLinks.querySelectorAll('a')) : [];

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
      document.body.style.overflow = expanded ? '' : 'hidden';
    });

    navLinksArr.forEach(a => {
      a.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- 4. Active nav link tracking ----
  const sections = ['hero', 'work', 'problem', 'philosophy', 'failures', 'contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const updateActiveNav = () => {
    let current = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollPos && sec.offsetTop + sec.offsetHeight > scrollPos) {
        current = sec.id;
      }
    });
    navLinksArr.forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + current);
    });
  };
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ---- 5. Metrics counter ----
  const metrics = Array.from(document.querySelectorAll('[data-count]'));
  let metricsCounted = false;

  const countUp = (el) => {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    const isFloat = target % 1 !== 0;
    const duration = 2000;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = isFloat ? current.toFixed(2) : Math.round(current) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    };
    requestAnimationFrame(tick);
  };

  const metricObserver = new IntersectionObserver((entries) => {
    if (metricsCounted) return;
    entries.forEach(e => {
      if (e.isIntersecting) {
        metricsCounted = true;
        metrics.forEach(countUp);
        metricObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  if (metrics.length) metricObserver.observe(document.getElementById('hero') || document.body);

  // ---- 6. Reveal animations ----
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        revealElement(e.target);
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  function revealElement(el) {
    const delay = parseInt(el.getAttribute('data-delay')) || 0;
    if (delay) { setTimeout(() => el.classList.add('in'), delay); }
    else { el.classList.add('in'); }
  }

  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight - 20 && rect.bottom > 0;
    if (inViewport) { revealElement(el); }
    else { revealObserver.observe(el); }
  });

  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
  }, 2000);

  // ---- 7. Smooth anchor scroll ----
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  // ---- 8. Parallax hero elements ----
  const heroOrb = document.querySelector('.hero-orb');
  if (heroOrb && window.innerWidth > 900) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const hero = document.getElementById('hero');
      if (!hero) return;
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      if (scrollY > heroBottom) return;
      const factor = scrollY * 0.15;
      heroOrb.style.transform = `translateY(calc(-50% + ${factor}px))`;
    }, { passive: true });
  }

  // ---- 9. Contact form ----
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name')?.trim();
      const email = data.get('email')?.trim();
      const message = data.get('message')?.trim();
      if (!name || !email || !message) return;
      note.hidden = false;
      form.reset();
      setTimeout(() => { note.hidden = true; }, 6000);
    });
  }

  // ---- 10. Button ripple effect ----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute;
      left:${x}px;
      top:${y}px;
      width:0;
      height:0;
      border-radius:50%;
      background:rgba(255,255,255,0.3);
      transform:translate(-50%,-50%);
      animation:rippleEffect 0.6s ease-out forwards;
      pointer-events:none;
    `;
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes rippleEffect {
      to { width:300px; height:300px; opacity:0; }
    }
  `;
  document.head.appendChild(style);

  // ========================================
  //  FRAME BACKGROUND — SCROLL-DRIVEN CANVAS
  //  Frames: frame_002 .. frame_236
  //  Scroll extent: 10× viewport height
  //  Preloads in batches · Keyboard step 2%
  // ========================================

  (function() {
    var TOTAL = 235, fb = document.getElementById('frameBg');
    if (!fb) return;

    function path(i) {
      return 'frame/frame_' + String(i + 2).padStart(3, '0') + '.jpg';
    }

    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none';
    fb.insertBefore(cv, fb.firstChild);

    var cx = cv.getContext('2d'), img = new Image(), idx = -1, dpr = 1, cache = [];

    function dims() {
      return { w: cv.clientWidth || window.innerWidth, h: cv.clientHeight || window.innerHeight };
    }

    function resize() {
      var d = dims();
      dpr = window.devicePixelRatio || 1;
      cv.width = d.w * dpr; cv.height = d.h * dpr;
      if (img.complete && img.naturalWidth) draw(img, d.w, d.h);
    }

    function draw(im, w, h) {
      var iw = im.naturalWidth, ih = im.naturalHeight, ir = iw / ih, cr = w / h;
      var sx = 0, sy = 0, sw = iw, sh = ih;
      if (ir > cr) { sw = ih * cr; sx = (iw - sw) / 2; }
      else if (ir < cr) { sh = iw / cr; sy = (ih - sh) / 2; }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    }

    frameImagesTotal = TOTAL;

    function preload() {
      var pos = 0;
      function next() {
        var end = Math.min(pos + 10, TOTAL);
        for (var i = pos; i < end; i++) (function(j) {
          var im = new Image();
          im.onload = function() {
            cache[j] = im;
            frameImagesLoaded++;
            updateLoaderFromFrameProgress();
            if (frameImagesLoaded >= TOTAL) {
              framesAllLoaded = true;
              checkLoaderDone();
            }
          };
          im.src = path(j);
        })(i);
        pos = end;
        if (pos < TOTAL) setTimeout(next, 50);
      }
      next();
    }

    function show(i) {
      if (i === idx) return;
      idx = i;
      var d = dims(), c = cache[i];
      if (c && c.complete && c.naturalWidth) { img = c; draw(img, d.w, d.h); return; }
      var src = path(i);
      if (img.src === src && img.complete && img.naturalWidth) { draw(img, d.w, d.h); return; }
      var ni = new Image();
      ni.onload = function() {
        cache[i] = ni;
        if (idx === i) { img = ni; var nd = dims(); draw(ni, nd.w, nd.h); }
      };
      ni.src = src;
    }

    extendScroll();

    var ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        var st = window.scrollY, sh = document.documentElement.scrollHeight - window.innerHeight;
        var p = sh > 0 ? Math.min(st / sh, 1) : 0;
        show(Math.round(p * (TOTAL - 1)));
        ticking = false;
      });
    }

    function onKey(e) {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) return;
      e.preventDefault();
      var sh = document.documentElement.scrollHeight - window.innerHeight, cp = window.scrollY / sh;
      var np = (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp')
        ? Math.max(0, cp - 0.02) : Math.min(1, cp + 0.02);
      window.scrollTo({ top: np * sh, behavior: 'auto' });
    }

    function extendScroll() {
      var target = window.innerHeight * 10;
      var sp = document.getElementById('sp');
      if (!sp) {
        sp = document.createElement('div');
        sp.id = 'sp';
        sp.style.cssText = 'pointer-events:none;width:1px';
        document.body.appendChild(sp);
      }
      var current = document.body.scrollHeight - (parseInt(sp.style.height) || 0);
      var needed = target - current;
      if (needed > 0) sp.style.height = needed + 'px';
    }

    preload();
    resize();
    show(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('keydown', onKey);

    var rc = 0, ri = setInterval(function() {
      rc++;
      if (img.complete && img.naturalWidth) { clearInterval(ri); var dd = dims(); draw(img, dd.w, dd.h); }
      if (rc > 25) clearInterval(ri);
    }, 200);
  })();

  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

})();
