(() => {
  'use strict';

  // ---- 1. Helpers ----
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  // ---- 2. Footer year ----
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- 2b. Reset hero state on bfcache restore ----
  window.addEventListener('pageshow', () => {
    const heroEl = $('#hero');
    if (heroEl && window.scrollY <= 0) heroEl.classList.remove('is-playing');
  });

  // ---- 3. Loader ----
  const loader = $('#loader');
  const loaderBar = loader?.querySelector('.loader-bar i');
  let windowLoaded = false, fontsLoaded = false, imagesLoaded = false;
  let imageLoadProgress = 0;

  const setLoaderProgress = (pct) => {
    if (loaderBar) {
      loaderBar.style.width = Math.min(pct, 100) + '%';
      loaderBar.style.animation = 'none';
    }
  };

  const updateLoaderProgress = () => {
    const totalPct = (windowLoaded ? 34 : 0) + (fontsLoaded ? 33 : 0) + (imagesLoaded ? 33 : Math.round(imageLoadProgress * 33));
    setLoaderProgress(totalPct);
  };

  const checkLoaderDone = () => {
    if (windowLoaded && fontsLoaded && imagesLoaded) {
      setTimeout(() => loader.classList.add('hidden'), 500);
    }
  };

  if (loader) {
    window.addEventListener('load', () => {
      windowLoaded = true;
      updateLoaderProgress();
      checkLoaderDone();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fontsLoaded = true;
        updateLoaderProgress();
        checkLoaderDone();
      });
    } else {
      fontsLoaded = true;
    }

    const allImages = $$('img');
    const totalImages = allImages.length;
    let loadedCount = 0;

    if (totalImages === 0) {
      imagesLoaded = true;
      updateLoaderProgress();
      checkLoaderDone();
    } else {
      allImages.forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          loadedCount++;
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            imageLoadProgress = loadedCount / totalImages;
            updateLoaderProgress();
            if (loadedCount >= totalImages) {
              imagesLoaded = true;
              checkLoaderDone();
            }
          }, { once: true });
          img.addEventListener('error', () => {
            loadedCount++;
            imageLoadProgress = loadedCount / totalImages;
            updateLoaderProgress();
            if (loadedCount >= totalImages) {
              imagesLoaded = true;
              checkLoaderDone();
            }
          }, { once: true });
        }
      });
      loadedCount = allImages.filter(img => img.complete && img.naturalWidth > 0).length;
      imageLoadProgress = loadedCount / totalImages;
      if (loadedCount >= totalImages) {
        imagesLoaded = true;
        updateLoaderProgress();
        checkLoaderDone();
      } else {
        updateLoaderProgress();
      }
    }

    setTimeout(() => {
      if (!loader.classList.contains('hidden')) {
        imagesLoaded = true;
        loader.classList.add('hidden');
      }
    }, 10000);
  }

  // ---- 4. Navigation ----
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const navLinks = $('.nav-links');
  const navLinksArr = navLinks ? $$('a:not(.dropdown-toggle):not(.dropdown-toggle-sub)', navLinks) : [];

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
  if (metrics.length) metricObserver.observe($('.hero-pin') || $('#hero') || document.body);

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

  if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

  // ---- 15. Sticky stacked work-grid cascade ----
  function initStickyStack() {
    $$('.work-grid, .work-list').forEach(grid => {
      if (grid._stickyInit) return;
      grid._stickyInit = true;
      if ($$('.work-card, .work-showcase', grid).length >= 2) {
        grid.classList.add('sticky-stack');
      }
    });
  }

  window.__stickyStackReInit = function() {
    $$('.work-grid, .work-list').forEach(grid => {
      grid.classList.remove('sticky-stack');
      grid._stickyInit = false;
    });
    initStickyStack();
  };

  // ---- 15a. Editorial work showcase list ----
  const workProjects = [
    {
      tag: "FINTECH",
      title: "Neobank Consumer Ecosystem",
      desc: "End-to-end digital banking experience architected from user journey mapping through backend systems. 40% increase in retention across 200K active users.",
      stack: "Go · Kafka · React",
      perf: "40% increase in retention",
      img: "assets/images/card content/footmob.jpeg",
      alt: "Neobank consumer banking interface"
    },
    {
      tag: "INDUSTRIAL",
      title: "IoT Predictive Analytics",
      desc: "Real-time sensor data platform processing 2M events/second with millisecond-level precision for predictive maintenance across 12 manufacturing facilities.",
      stack: "Rust · gRPC · InfluxDB",
      perf: "Millisecond-level precision",
      img: "assets/images/card content/Novela Play.png",
      alt: "IoT predictive analytics dashboard"
    },
    {
      tag: "COMMERCE",
      title: "Enterprise Commerce Platform",
      desc: "Full-spectrum e-commerce ecosystem with cognitive mapping of user flows and technical synergy across 50+ microservices driving 3x conversion uplift.",
      stack: "Node · GraphQL · K8s",
      perf: "3x conversion uplift",
      img: "assets/images/card content/sellbuyplay.png",
      alt: "Enterprise commerce platform interface"
    },
    // {
    //   tag: "LOGISTICS",
    //   title: "Supply Chain Intelligence",
    //   desc: "Integrated logistics platform unifying 200+ partner APIs with real-time inventory intelligence and predictive routing, reducing operational costs by 25%.",
    //   stack: "TypeScript · Terraform · AWS",
    //   perf: "25% cost reduction",
    //   img: "assets/images/Supply%20Chain.png",
    //   alt: "Supply chain intelligence map"
    // },
    // {
    //   tag: "PORTFOLIO",
    //   title: "Digital Portfolio Platform",
    //   desc: "Modern portfolio & agency showcase website featuring interactive project galleries, dynamic filtering, and seamless content management for creative professionals.",
    //   stack: "HTML · CSS · JavaScript",
    //   perf: "Full responsive design",
    //   img: "assets/images/Portfolio.png",
    //   alt: "Digital portfolio platform showcase"
    // }
  ];

  function initWorkList() {
    const list = $('#workList');
    if (!list || list._workInit) return;
    list._workInit = true;

    const frag = document.createDocumentFragment();

    workProjects.forEach((project, i) => {
      const article = document.createElement('article');
      article.className = 'work-showcase';
      article.dataset.reveal = 'up';
      article.dataset.delay = String(i * 90);

      const glow = document.createElement('div');
      glow.className = 'work-showcase-glow';

      const figure = document.createElement('figure');
      figure.className = 'work-showcase-media';

      const img = document.createElement('img');
      img.src = project.img;
      img.alt = project.alt || project.title;
      figure.appendChild(img);

      const tag = document.createElement('div');
      tag.className = 'work-showcase-tag';

      const index = document.createElement('span');
      index.className = 'work-showcase-index';
      index.textContent = String(i + 1).padStart(2, '0');

      const cat = document.createElement('span');
      cat.className = 'work-showcase-cat';
      cat.textContent = project.tag;

      tag.append(index, cat);

      const title = document.createElement('h3');
      title.className = 'work-showcase-title';
      title.textContent = project.title;

      const desc = document.createElement('p');
      desc.className = 'work-showcase-desc';
      desc.textContent = project.desc;

      const stack = document.createElement('span');
      stack.className = 'work-showcase-stack';
      stack.textContent = project.stack;

      const perf = document.createElement('span');
      perf.className = 'work-showcase-perf';
      perf.textContent = project.perf;

      const meta = document.createElement('div');
      meta.className = 'work-showcase-meta';
      meta.append(stack, perf);

      const info = document.createElement('div');
      info.className = 'work-showcase-info';
      info.append(tag, title, desc, meta);

      article.append(glow, figure, info);
      frag.appendChild(article);
    });

    list.appendChild(frag);

    $$('[data-reveal]', list).forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 20 && rect.bottom > 0) {
        revealElement(el);
      } else {
        revealObserver.observe(el);
      }
    });
  }
  initWorkList();
  initStickyStack();

  // ---- 15b. Hero scroll-driven frame background (index page only) ----
  function initHeroFrames() {
    const canvas = $('#heroFrames');
    const hero = $('#hero');
    if (!canvas || !hero) return;

    const mainWrap = $('#main-content');
    if (mainWrap && !mainWrap._heroRevealWired) {
      mainWrap._heroRevealWired = true;
      const reveal = () => {
        if (window.scrollY <= 0) return;
        if (getComputedStyle(canvas).display === 'none') {
          window.removeEventListener('scroll', reveal);
          return;
        }
        const h = $('#hero');
        if (h) h.classList.add('is-playing');
        window.removeEventListener('scroll', reveal);
      };
      window.addEventListener('scroll', reveal, { passive: true });
    }

    if (getComputedStyle(canvas).display === 'none') return;
    if (canvas._heroFramesInit) return;
    canvas._heroFramesInit = true;

    const FRAMES = [];
    for (let i = 1; i <= 233; i++) {
      if (i === 205 || i === 218 || i === 222) continue;
      FRAMES.push('monitor frames/frame_' + String(i).padStart(3, '0') + '.jpg');
    }
    const TOTAL = FRAMES.length;

    const ctx = canvas.getContext('2d');
    const cache = [];
    let img = new Image();
    let idx = -1;
    let dpr = 1;

    const dims = () => ({ w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight });

    const resize = () => {
      const d = dims();
      dpr = window.devicePixelRatio || 1;
      canvas.width = d.w * dpr;
      canvas.height = d.h * dpr;
      if (img.complete && img.naturalWidth) draw(img, d.w, d.h);
    };

    const draw = (im, w, h) => {
      const iw = im.naturalWidth, ih = im.naturalHeight, ir = iw / ih, cr = w / h;
      let sx = 0, sy = 0, sw = iw, sh = ih;
      if (ir > cr) {
        sw = ih * cr;
        const k = Math.min(cr / ir, 1);
        sx = (iw - sw) * (0.5 + 0.45 * (1 - k));
      }
      else if (ir < cr) { sh = iw / cr; sy = (ih - sh) / 2; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    };

    const show = (i) => {
      if (i === idx) return;
      idx = i;
      const d = dims();
      const cached = cache[i];
      if (cached && cached.complete && cached.naturalWidth) { img = cached; draw(img, d.w, d.h); return; }
      const src = FRAMES[i];
      if (img.src === src && img.complete && img.naturalWidth) { draw(img, d.w, d.h); return; }
      const ni = new Image();
      ni.onload = () => {
        cache[i] = ni;
        if (idx === i) { img = ni; const nd = dims(); draw(ni, nd.w, nd.h); }
      };
      ni.onerror = () => { cache[i] = img; };
      ni.src = src;
    };

    const scrollRange = () => Math.max(1, hero.offsetHeight - window.innerHeight);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const range = scrollRange();
        const p = Math.min(Math.max(window.scrollY / range, 0), 1);
        if (hero.classList.contains('is-playing')) show(Math.round(p * (TOTAL - 1)));
        ticking = false;
      });
    };

    for (let i = 0; i < TOTAL; i++) {
      const j = i;
      const im = new Image();
      im.onload = () => { cache[j] = im; };
      im.src = FRAMES[j];
    }

    resize();
    const d = dims();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, d.w, d.h);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
  }
  initHeroFrames();

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      const heroCanvas = $('#heroFrames');
      if (heroCanvas) {
        heroCanvas._heroFramesInit = false;
        const heroEl = $('#hero');
        if (heroEl) heroEl.classList.add('is-playing');
        initHeroFrames();
      }
    }
  });

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
      const mainWrap = $('#main-content');
      if (mainWrap) mainWrap._heroRevealWired = false;

      const heroCanvas = $('#heroFrames');
      if (heroCanvas) {
        heroCanvas._heroFramesInit = false;
        const heroEl = $('#hero');
        if (heroEl && window.scrollY > 0) heroEl.classList.add('is-playing');
      }

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
      initHeroFrames();
      initWorkList();
      initStickyStack();
      metrics = $$('[data-count]');
      if (metrics.length) {
        metricsCounted = false;
        metricObserver.observe($('.hero-pin') || $('#hero') || document.body);
      }
    }
  })();

})();
