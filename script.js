(() => {
  'use strict';

  // ---- 1. Helpers ----
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  // ---- 2. Footer year ----
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- 3. Loader ----
  const loader = $('#loader');
  const loaderBar = loader?.querySelector('.loader-bar i');
  let frameImagesTotal = 0, frameImagesLoaded = 0;
  let framesAllLoaded = false, windowLoaded = false, fontsLoaded = false;

  const setLoaderProgress = (pct) => {
    if (loaderBar) {
      loaderBar.style.width = Math.min(pct, 100) + '%';
      loaderBar.style.animation = 'none';
    }
  };

  const updateLoaderFromFrameProgress = () => {
    if (frameImagesTotal > 0) {
      const framePct = frameImagesLoaded / frameImagesTotal;
      const totalPct = framePct * 50 + (windowLoaded ? 25 : 0) + (fontsLoaded ? 25 : 0);
      setLoaderProgress(totalPct);
    }
  };

  const checkLoaderDone = () => {
    if (framesAllLoaded && windowLoaded && fontsLoaded) {
      setTimeout(() => loader.classList.add('hidden'), 500);
    }
  };

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

  // ---- 4. Navigation ----
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const navLinks = $('.nav-links');
  const navLinksArr = navLinks ? $$('a:not(.dropdown-toggle):not(.dropdown-toggle-sub)', navLinks) : [];
  const dropdownToggles = navLinks ? $$('.dropdown-toggle', navLinks) : [];
  const subDropdownToggles = navLinks ? $$('.dropdown-toggle-sub', navLinks) : [];

  const closeNav = () => {
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  };

  const toggleNav = () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    navLinks.classList.toggle('active');
    document.body.style.overflow = expanded ? '' : 'hidden';
  };

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && navLinks) {
    toggle.addEventListener('click', toggleNav);

    navLinksArr.forEach(a => {
      a.addEventListener('click', (e) => {
        if (a.getAttribute('href') === '#') e.preventDefault();
        closeNav();
        const dd = a.closest('.dropdown-menu');
        if (dd) {
          dd.style.display = 'none';
          const parent = a.closest('.nav-dropdown');
          if (parent) {
            const reopen = () => {
              dd.style.display = '';
              parent.removeEventListener('mouseenter', reopen);
            };
            parent.addEventListener('mouseenter', reopen);
          }
        }
      });
    });

    dropdownToggles.forEach(tgl => {
      tgl.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth <= 900) {
          const menu = tgl.nextElementSibling;
          if (menu && menu.classList.contains('dropdown-menu')) {
            menu.classList.toggle('active');
          }
        }
      });
    });

    subDropdownToggles.forEach(tgl => {
      tgl.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.innerWidth <= 900) {
          const menu = tgl.nextElementSibling;
          if (menu && menu.classList.contains('dropdown-menu-sub')) {
            menu.classList.toggle('active');
          }
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !toggle.contains(e.target)) {
        closeNav();
      }
    });
  }

  // ---- 5. Active nav link tracking ----
  const updateActiveNav = () => {
    let current = '';
    const scrollPos = window.scrollY + 120;
    ['contact'].forEach(id => {
      const sec = document.getElementById(id);
      if (sec && sec.offsetTop <= scrollPos && sec.offsetTop + sec.offsetHeight > scrollPos) {
        current = sec.id;
      }
    });
    navLinksArr.forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', href === '#' + current);
    });
  };
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  // ---- 6. Metrics counter ----
  let metrics = $$('[data-count]');
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
  if (metrics.length) metricObserver.observe($('#hero') || document.body);

  // ---- 7. Reveal animations ----
  const revealEls = $$('[data-reveal]');
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
    $$('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
  }, 2000);

  // ---- 8. Smooth anchor scroll ----
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } else if (window.__router) {
      e.preventDefault();
      window.__router.navigate('index.html#' + id);
    }
  });

  // ---- 9. Parallax hero elements ----
  const heroOrb = $('.hero-orb');
  if (heroOrb && window.innerWidth > 900) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const hero = $('#hero');
      if (!hero) return;
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      if (scrollY > heroBottom) return;
      const factor = scrollY * 0.15;
      heroOrb.style.transform = `translateY(calc(-50% + ${factor}px))`;
    }, { passive: true });
  }

  // ---- 10. Contact form ----
  function initContactForm() {
    const form = $('#contactForm');
    if (!form || form._formInit) return;
    form._formInit = true;
    const note = $('#formNote');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = data.get('name')?.trim();
      const email = data.get('email')?.trim();
      const message = data.get('message')?.trim();
      if (!name || !email || !message) return;
      if (note) note.hidden = false;
      form.reset();
      if (note) setTimeout(() => { note.hidden = true; }, 6000);
    });
  }
  initContactForm();

  // ---- 12. Button ripple effect ----
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

  // ---- 12. Tabs initialization ----
  function initTabs() {
    const tabsNav = $('.tabs-nav');
    if (!tabsNav) return;
    const tabBtns = $$('.tab-btn', tabsNav);
    const tabPanels = $$('.tab-panel');
    function activateTab(id) {
      tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
      tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === id));
    }
    if (!tabsNav._tabInit) {
      tabsNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.tab-btn');
        if (btn && btn.dataset.tab) {
          if (window.__stickyStackReInit) window.__stickyStackReInit();
          activateTab(btn.dataset.tab);
        }
      });
      tabsNav._tabInit = true;
    }
    const firstTab = $('.tab-btn.active', tabsNav) || tabBtns[0];
    if (firstTab) activateTab(firstTab.dataset.tab);
    const hash = window.location.hash.slice(1);
    if (hash && document.getElementById(hash)) {
      activateTab(hash);
      setTimeout(() => {
        const target = document.getElementById(hash);
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 100);
    }
  }
  initTabs();

  // ---- 13. Frame background — scroll-driven canvas ----
  (function() {
    const TOTAL = 235;
    const fb = $('#frameBg');
    if (!fb) return;

    const path = (i) => 'frame/frame_' + String(i + 2).padStart(3, '0') + '.jpg';

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none';
    fb.insertBefore(cv, fb.firstChild);

    const cx = cv.getContext('2d');
    let img = new Image(), idx = -1, dpr = 1, cache = [];

    const dims = () => ({ w: cv.clientWidth || window.innerWidth, h: cv.clientHeight || window.innerHeight });

    const resize = () => {
      const d = dims();
      dpr = window.devicePixelRatio || 1;
      cv.width = d.w * dpr; cv.height = d.h * dpr;
      if (img.complete && img.naturalWidth) draw(img, d.w, d.h);
    };

    const draw = (im, w, h) => {
      const iw = im.naturalWidth, ih = im.naturalHeight, ir = iw / ih, cr = w / h;
      let sx = 0, sy = 0, sw = iw, sh = ih;
      if (ir > cr) { sw = ih * cr; sx = (iw - sw) / 2; }
      else if (ir < cr) { sh = iw / cr; sy = (ih - sh) / 2; }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    };

    frameImagesTotal = TOTAL;

    const preload = () => {
      let pos = 0;
      const next = () => {
        const end = Math.min(pos + 10, TOTAL);
        for (let i = pos; i < end; i++) {
          const j = i;
          const im = new Image();
          im.onload = () => {
            cache[j] = im;
            frameImagesLoaded++;
            updateLoaderFromFrameProgress();
            if (frameImagesLoaded >= TOTAL) {
              framesAllLoaded = true;
              checkLoaderDone();
            }
          };
          im.src = path(j);
        }
        pos = end;
        if (pos < TOTAL) setTimeout(next, 50);
      };
      next();
    };

    const show = (i) => {
      if (i === idx) return;
      idx = i;
      const d = dims();
      const cached = cache[i];
      if (cached && cached.complete && cached.naturalWidth) { img = cached; draw(img, d.w, d.h); return; }
      const src = path(i);
      if (img.src === src && img.complete && img.naturalWidth) { draw(img, d.w, d.h); return; }
      const ni = new Image();
      ni.onload = () => {
        cache[i] = ni;
        if (idx === i) { img = ni; const nd = dims(); draw(ni, nd.w, nd.h); }
      };
      ni.src = src;
    };


    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const st = window.scrollY;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        const p = sh > 0 ? Math.min(st / sh, 1) : 0;
        show(Math.round(p * (TOTAL - 1)));
        ticking = false;
      });
    };

    const onKey = (e) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) return;
      e.preventDefault();
      const sh = document.documentElement.scrollHeight - window.innerHeight;
      const cp = window.scrollY / sh;
      const np = (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp')
        ? Math.max(0, cp - 0.02) : Math.min(1, cp + 0.02);
      window.scrollTo({ top: np * sh, behavior: 'auto' });
    };

    preload();
    resize();
    show(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('keydown', onKey);

    let rc = 0;
    const ri = setInterval(() => {
      rc++;
      if (img.complete && img.naturalWidth) { clearInterval(ri); const dd = dims(); draw(img, dd.w, dd.h); }
      if (rc > 25) clearInterval(ri);
    }, 200);
  })();

  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

  // ---- 15. Sticky stacked work-grid cascade ----
  function initStickyStack() {
    $$('.work-grid').forEach(grid => {
      if (grid._stickyInit) return;
      grid._stickyInit = true;
      if ($$('.work-card', grid).length >= 2) {
        grid.classList.add('sticky-stack');
      }
    });
  }

  window.__stickyStackReInit = function() {
    $$('.work-grid').forEach(grid => {
      grid.classList.remove('sticky-stack');
      grid._stickyInit = false;
    });
    initStickyStack();
  };

  initStickyStack();

  // ---- 16. SPA Router ----
  (function() {
    if (!window.history.pushState) return;

    let isLoading = false;

    async function navigateTo(path) {
      if (isLoading) return;
      isLoading = true;

      const url = new URL(path, window.location.href);

      if (url.pathname === window.location.pathname) {
        if (url.hash) {
          history.pushState({ path: url.pathname }, '', url.pathname + url.hash);
          initTabs();
          setTimeout(() => {
            const target = document.getElementById(url.hash.slice(1));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 50);
        }
        isLoading = false;
        return;
      }

      try {
        const res = await fetch(url.pathname);
        if (!res.ok) throw new Error('Fetch failed');
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMain = doc.querySelector('#main-content');
        const newTitle = doc.title;
        if (!newMain) throw new Error('No main content');

        const currentMain = document.querySelector('#main-content');
        if (!currentMain) throw new Error('No current main');

        currentMain.style.opacity = '0';
        currentMain.style.transition = 'opacity 0.25s ease';

        setTimeout(() => {
          currentMain.innerHTML = newMain.innerHTML;
          currentMain.className = newMain.className;

          requestAnimationFrame(() => {
            currentMain.style.transition = 'opacity 0.35s ease';
            currentMain.style.opacity = '1';
          });

          if (newTitle) document.title = newTitle;

          const newUrl = url.pathname + (url.hash || '');
          history.pushState({ path: url.pathname }, '', newUrl);

          setTimeout(() => {
            currentMain.style.opacity = '';
            currentMain.style.transition = '';

            reInit();

            if (url.hash) {
              setTimeout(() => {
                const target = document.getElementById(url.hash.slice(1));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            isLoading = false;
          }, 400);
        }, 250);
      } catch {
        window.location.href = url.pathname + (url.hash || '');
      }
    }

    window.__router = { navigate: navigateTo };

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      let href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#')) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (link.hasAttribute('download') || link.target === '_blank') return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        e.preventDefault();
        navigateTo(url.pathname + (url.hash || ''));
      } catch { return; }
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.path) navigateTo(e.state.path);
    });

    function reInit() {
      const newRevealEls = $$('[data-reveal]');
      newRevealEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 20 && rect.bottom > 0) {
          const delay = parseInt(el.getAttribute('data-delay')) || 0;
          if (delay) setTimeout(() => el.classList.add('in'), delay);
          else el.classList.add('in');
        } else {
          revealObserver.observe(el);
        }
      });
      setTimeout(() => {
        $$('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
      }, 2000);

      initTabs();
      initContactForm();
      initStickyStack();
      metrics = $$('[data-count]');
      if (metrics.length) {
        metricsCounted = false;
        const hero = $('#hero');
        metricObserver.observe(hero || document.body);
      }
    }
  })();

})();
