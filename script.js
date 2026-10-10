(() => {
  'use strict';

  // ---- 1. Helpers ----
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* Resolve asset URLs against script.js's own location instead of the page
     URL. script.js sits at the site root and is loaded from every page (/,
     /about-us/, /quality-engineering/, ...), so a page-relative path like
     "assets/images/foo.avif" would resolve to /about-us/assets/images/foo.avif
     on subpages and 404. document.currentScript.src is already absolute and
     already collapsed (../script.js -> /script.js), so new URL('.', src) is
     always the site root, whichever depth the current page lives at. This
     also keeps the site working when deployed to a subdirectory (e.g. a
     GitHub Pages project site). Falls back to the page URL if the script is
     ever loaded in a way that hides currentScript. */
  const SCRIPT_BASE = new URL('.', (document.currentScript && document.currentScript.src) || window.location.href);
  const asset = (path) => new URL(path, SCRIPT_BASE).href;

  /* Internal links are authored relative to the page that owns them: the
     homepage writes "about-us/" while every subpage writes "../about-us/".
     The SPA router swaps only <main>, so <header>/<footer> keep the hrefs of
     the page the visitor first landed on — and those rot the moment
     pushState moves the URL to another depth. That is how clicks produced
     …/ai-solutions/ai-solutions/#ai-agent, …/contact-us/about-us/ and even
     URLs that escaped the site root (GitHub's "There isn't a GitHub Pages
     site here"). Rewriting every internal href to an absolute URL — at load
     time, and against the SOURCE page's URL before a swap — makes links
     immune to wherever the URL currently points. Idempotent: absolute hrefs
     and external schemes are left untouched, and href="#" stays "#" so the
     dropdown toggles keep working. */
  const EXTERNAL_HREF = /^(?:https?:|mailto:|tel:|javascript:|data:)/i;
  function absolutizeLinks(scope, base) {
    $$('a[href]', scope).forEach((a) => {
      const raw = a.getAttribute('href');
      if (!raw || raw === '#' || EXTERNAL_HREF.test(raw)) return;
      if (a.hasAttribute('download') || a.target === '_blank') return;
      try { a.href = new URL(raw, base).href; } catch { /* keep the raw href */ }
    });
  }
  /* Script sits at the end of <body>, so the DOM (header, footer and all) is
     already parsed when this runs. */
  absolutizeLinks(document, document.baseURI);

  // ---- 2. Footer year ----
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // Must match the CSS drawer breakpoint (@media max-width:1000px) — the
  // drawer exists at 901-1000px too, so a 900px check would leave a dead zone.
  const drawerMQ = window.matchMedia('(max-width: 1000px)');

  // Every element that carries an open/closed state in the drawer.
  const BRANCH = '.nav-dropdown, .nav-dropdown-sub, .dropdown-menu, .dropdown-menu-sub';
  const TOGGLES = '.dropdown-toggle, .dropdown-toggle-sub';

  // Close one branch *and everything nested inside it*, so a collapsed parent
  // can never leave an orphaned open sub-menu behind.
  const closeBranch = (branch) => {
    if (!branch) return;
    branch.classList.remove('active', 'active-dropdown');
    $$(BRANCH, branch).forEach(el => el.classList.remove('active', 'active-dropdown'));
    $$(TOGGLES, branch).forEach(el => el.setAttribute('aria-expanded', 'false'));
  };

  const closeAllBranches = () => {
    if (!navLinks) return;
    $$(BRANCH, navLinks).forEach(el => el.classList.remove('active', 'active-dropdown'));
    $$(TOGGLES, navLinks).forEach(el => el.setAttribute('aria-expanded', 'false'));
  };

  const closeNav = () => {
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    closeAllBranches();
    // Lock <html>, not <body>: <body>'s overflow no longer propagates to the
    // viewport, so setting it there is a no-op.
    document.documentElement.classList.remove('nav-open');
  };

  const toggleNav = () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    navLinks.classList.toggle('active', !expanded);
    if (!expanded) {
      closeAllBranches();
      navLinks.scrollTop = 0;
    }
    document.documentElement.classList.toggle('nav-open', !expanded);
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

    // Mobile dropdowns are hover-driven in CSS, which never fires on touch,
    // so each branch needs a tap handler. Accordion: one branch per level open
    // at a time — but closing siblings must never touch an ancestor branch.
    const bindDropdown = (tgl, menuClass, wrapSelector, siblingSelector) => {
      tgl.setAttribute('aria-expanded', 'false');
      tgl.addEventListener('click', (e) => {
        if (!drawerMQ.matches) {
          // Desktop opens on hover; just kill the href="#" jump-to-top.
          if (tgl.getAttribute('href') === '#') e.preventDefault();
          return;
        }
        e.preventDefault();
        const menu = tgl.nextElementSibling;
        if (!menu || !menu.classList.contains(menuClass)) return;
        const wrap = tgl.closest(wrapSelector);
        if (!wrap) return;

        if (menu.classList.contains('active')) {
          closeBranch(wrap);
          return;
        }
        // Only same-level siblings collapse: closing a top-level branch also
        // resets its sub-menus, but opening a sub must keep its parent open.
        $$(siblingSelector, navLinks).forEach(sib => {
          if (sib !== wrap) closeBranch(sib);
        });
        menu.classList.add('active');
        // 'active' reveals the panel; 'active-dropdown' is the hook the CSS
        // uses to flip the sub-menu chevron.
        wrap.classList.add('active', 'active-dropdown');
        tgl.setAttribute('aria-expanded', 'true');
      });
    };

    $$('.dropdown-toggle', navLinks).forEach(t => bindDropdown(t, 'dropdown-menu', '.nav-dropdown', '.nav-dropdown'));
    $$('.dropdown-toggle-sub', navLinks).forEach(t => bindDropdown(t, 'dropdown-menu-sub', '.nav-dropdown-sub', '.nav-dropdown-sub'));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) closeNav();
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

  // Safety net for the case the observer silently misses something that is
  // already on screen. Deliberately scoped to the viewport: it must never
  // pre-reveal content the visitor has not scrolled to yet, or the staggered
  // reveal in every section below the fold becomes a no-op. Stops itself as
  // soon as nothing on screen is stuck.
  let revealWatchdog = null;
  const startRevealWatchdog = () => {
    if (revealWatchdog) clearInterval(revealWatchdog);
    revealWatchdog = setInterval(() => {
      const stuck = $$('[data-reveal]:not(.in)').filter(el => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      if (!stuck.length) {
        clearInterval(revealWatchdog);
        revealWatchdog = null;
        return;
      }
      stuck.forEach(revealElement);
    }, 1000);
  };

  revealEls.forEach(el => {
    const rect = el.getBoundingClientRect();
    const inViewport = rect.top < window.innerHeight - 20 && rect.bottom > 0;
    if (inViewport) { revealElement(el); }
    else { revealObserver.observe(el); }
  });

  // Late-loading images shift layout, so re-check once the page has settled.
  window.addEventListener('load', () => {
    $$('[data-reveal]:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight - 20 && r.bottom > 0) revealElement(el);
    });
    startRevealWatchdog();
  });

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
      img: "assets/images/card content/footmob.avif",
      alt: "Neobank consumer banking interface"
    },
    {
      tag: "INDUSTRIAL",
      title: "IoT Predictive Analytics",
      desc: "Real-time sensor data platform processing 2M events/second with millisecond-level precision for predictive maintenance across 12 manufacturing facilities.",
      stack: "Rust · gRPC · InfluxDB",
      perf: "Millisecond-level precision",
      img: "assets/images/card content/Novela Play.avif",
      alt: "IoT predictive analytics dashboard"
    },
    {
      tag: "COMMERCE",
      title: "Enterprise Commerce Platform",
      desc: "Full-spectrum e-commerce ecosystem with cognitive mapping of user flows and technical synergy across 50+ microservices driving 3x conversion uplift.",
      stack: "Node · GraphQL · K8s",
      perf: "3x conversion uplift",
      img: "assets/images/card content/sellbuyplay.avif",
      alt: "Enterprise commerce platform interface"
    },
    // {
    //   tag: "LOGISTICS",
    //   title: "Supply Chain Intelligence",
    //   desc: "Integrated logistics platform unifying 200+ partner APIs with real-time inventory intelligence and predictive routing, reducing operational costs by 25%.",
    //   stack: "TypeScript · Terraform · AWS",
    //   perf: "25% cost reduction",
    //   img: "assets/images/uc/Supply%20Chain.png",
    //   alt: "Supply chain intelligence map"
    // },
    // {
    //   tag: "PORTFOLIO",
    //   title: "Digital Portfolio Platform",
    //   desc: "Modern portfolio & agency showcase website featuring interactive project galleries, dynamic filtering, and seamless content management for creative professionals.",
    //   stack: "HTML · CSS · JavaScript",
    //   perf: "Full responsive design",
    //   img: "assets/images/uc/Portfolio.png",
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
      /* No data-reveal here: these cards are position:sticky and pin over one
         another, so an opacity/transform reveal fights the stacking and can
         strand the last card at opacity 0. */

      const glow = document.createElement('div');
      glow.className = 'work-showcase-glow';

      const figure = document.createElement('figure');
      figure.className = 'work-showcase-media';

      const img = document.createElement('img');
      img.src = asset(project.img);
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
    /* No reveal observation for these cards — see the data-reveal note above. */
  }
  initWorkList();
  initStickyStack();

  // ---- 16. SPA Router ----
  (function() {
    if (!window.history.pushState) return;

    let isLoading = false;
    let queuedNav = null;
    /* The pathname whose markup is currently in #main-content. navigateTo()
       pushes the URL BEFORE render() runs, so comparing against
       location.pathname would always say "same document" and never swap the
       content — this variable is the real source of truth for that decision. */
    let renderedPath = window.location.pathname;
    /* /page and /page/ serve the same document (a server may or may not
       redirect between them), as do /page/ and /page/index.html. Compare
       normalised, or a trailing slash would turn a same-page tab switch into
       a full re-swap of identical content. */
    function normPath(p) {
      return p.replace(/index\.html$/, '').replace(/([^/])$/, '$1/');
    }

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /* GitHub Pages answers every miss with a real 404 page, and a deploy or
       CDN hiccup can make a valid path 404 for a few seconds — retry once
       before giving up so a transient blip never bounces the visitor onto an
       error page. */
    async function fetchPage(pathname) {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const res = await fetch(pathname);
          if (res.ok) return await res.text();
        } catch { /* network error — retry */ }
        if (attempt === 0) await delay(400);
      }
      return null;
    }

    /* Renders a route into the page WITHOUT touching history. navigateTo()
       owns pushState; popstate calls this directly because the browser has
       already restored the URL — pushing there would duplicate history
       entries and drop the hash. */
    async function render(path) {
      /* A click landing mid-transition used to be swallowed outright (the
         click handler already ran preventDefault). Remember it and run it the
         moment the current navigation settles instead of dropping it. */
      if (isLoading) { queuedNav = path; return; }
      isLoading = true;

      try {
        const url = new URL(path, window.location.href);

        if (normPath(url.pathname) === normPath(renderedPath)) {
          /* Same document: initTabs() reads location.hash, so the URL must
             already carry the hash when this runs (navigateTo pushes first). */
          initTabs();
          if (url.hash) {
            setTimeout(() => {
              const target = document.getElementById(url.hash.slice(1));
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 50);
          } else {
            /* Same page, no hash — "Who We Are" on /about-us/, "Contact Us"
               on /contact-us/: scroll to the top instead of doing nothing. */
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return;
        }

        const html = await fetchPage(url.pathname);
        if (!html) throw new Error('Page not found: ' + url.pathname);

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const newMain = doc.querySelector('#main-content');
        if (!newMain) throw new Error('No main content');

        const currentMain = document.querySelector('#main-content');
        if (!currentMain) throw new Error('No current main');

        /* The fetched markup came from ANOTHER page, so its relative hrefs
           only make sense against that page's URL — absolutise them before
           they meet the new location. */
        absolutizeLinks(newMain, new URL(url.pathname, window.location.href));

        currentMain.style.opacity = '0';
        currentMain.style.transition = 'opacity 0.25s ease';
        await delay(250);

        currentMain.innerHTML = newMain.innerHTML;
        currentMain.className = newMain.className;
        renderedPath = url.pathname;

        requestAnimationFrame(() => {
          currentMain.style.transition = 'opacity 0.35s ease';
          currentMain.style.opacity = '1';
        });

        if (doc.title) document.title = doc.title;

        await delay(400);

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
      } catch {
        /* Last resort: a real page load. A genuinely missing path now lands on
           the branded 404.html (GitHub Pages serves it for every miss), which
           offers "Back to home" / "Go back" instead of a dead end. A URL
           outside the site root is never loaded — that is what produced
           deepanshu37.github.io/<page> ("There isn't a GitHub Pages site
           here"). */
        const url = new URL(path, window.location.href);
        const inSite = url.origin === window.location.origin
          && url.pathname.startsWith(SCRIPT_BASE.pathname);
        window.location.href = inSite
          ? url.pathname + (url.hash || '')
          : SCRIPT_BASE.pathname;
      } finally {
        /* Always release the lock — an exception anywhere above used to leave
           every button on the page dead until a manual reload. */
        isLoading = false;
        if (queuedNav) {
          const next = queuedNav;
          queuedNav = null;
          render(next);
        }
      }
    }

    async function navigateTo(path) {
      const url = new URL(path, window.location.href);
      /* Update the URL first: initTabs() reads location.hash, so the URL is
         the single source of truth for which tab is open. Push only when it
         actually changes — a duplicate entry breaks the Back button. */
      const target = url.pathname + (url.hash || '');
      if (target !== window.location.pathname + window.location.hash) {
        history.pushState({ path: url.pathname }, '', target);
      }
      render(target);
    }

    window.__router = { navigate: navigateTo };

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      const link = e.target.closest('a[href]');
      if (!link) return;
      const raw = link.getAttribute('href');
      /* Dropdown toggles keep href="#" and are handled by their own code. */
      if (!raw || raw === '#') return;
      if (link.hasAttribute('download') || link.target === '_blank') return;

      /* Decide by the RESOLVED url, never by string prefix. Internal hrefs
         are absolutised at load time, so a "startsWith('http')" test rejects
         every internal link and silently disables the router — hash links
         then only move the URL while the visible tab stays where it was.
         mailto:, tel: and javascript: resolve with an opaque "null" origin,
         so the origin check below filters those out as well. */
      let url;
      try { url = new URL(raw, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      /* Never fetch a URL that lives outside the site root: a relative link
         that climbs above it is a bug, and fetching it 404s on GitHub
         Pages. Let the browser handle such links normally. */
      if (!url.pathname.startsWith(SCRIPT_BASE.pathname)) return;

      e.preventDefault();
      navigateTo(url.pathname + (url.hash || ''));
    });

    window.addEventListener('popstate', () => {
      /* The browser has already restored the URL — render it as-is. Pushing
         here would duplicate history entries and drop the hash, which is what
         made Back/Forward through #ai-consulting → #ai-roadmap mangle the
         URL and leave the tabs out of sync. */
      render(window.location.pathname + window.location.hash);
    });

    /* Safety net: any hash change the router did not cause (Back/Forward, a
       native click on a link, a manually edited URL) still has to open the
       matching tab — the URL stays the source of truth for tab state. */
    window.addEventListener('hashchange', () => {
      const id = window.location.hash.slice(1);
      if (id && document.getElementById(id)) initTabs();
    });

    function reInit() {
      /* Safety net: any markup injected after the initial load gets the same
         absolute-link treatment (already-absolute hrefs are untouched). */
      absolutizeLinks(document, document.baseURI);

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
      startRevealWatchdog();

      initTabs();
      initContactForm();
      initWorkList();
      initStickyStack();
      metrics = $$('[data-count]');
      if (metrics.length) {
        metricsCounted = false;
        metricObserver.observe($('.hero-pin') || $('#hero') || document.body);
      }
    }
  })();

  // ---- Hero Image Slider ----
  (() => {
    const slides = $$('.hero-fill-image');
    const cards = $$('.hero-card');
    if (!slides.length) return;

    let current = 0;
    let interval = null;
    let running = false;
    const INTERVAL_MS = 3000;
    const BREAKPOINT_MIN = 1000;
    const BREAKPOINT_MAX = 1240;

    function inThreeColRange() {
      const w = window.innerWidth;
      return w >= BREAKPOINT_MIN && w < BREAKPOINT_MAX;
    }

    function goTo(index) {
      slides[current].classList.remove('active');
      if (cards[current]) cards[current].classList.remove('is-active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      if (cards[current]) cards[current].classList.add('is-active');
    }

    function showAll() {
      slides.forEach(img => img.classList.add('active'));
    }

    function hideAll() {
      slides.forEach(img => img.classList.remove('active'));
    }

    function startAutoPlay() {
      stopAutoPlay();
      hideAll();
      goTo(current);
      interval = setInterval(() => goTo(current + 1), INTERVAL_MS);
      running = true;
    }

    function stopAutoPlay() {
      if (interval) clearInterval(interval);
      interval = null;
      running = false;
    }

    function syncState() {
      if (inThreeColRange()) {
        if (running) stopAutoPlay();
        showAll();
      } else {
        if (!running) startAutoPlay();
      }
    }

    // The capability cards are non-interactive: no click, no hover-pause.
    // They only mirror which frame image the autoplay is currently showing,
    // via the .is-active ring that goTo() sets. (A hover-pause here also
    // misbehaved on touch, where `mouseenter` latches on tap and
    // `mouseleave` only fires on some later tap.)

    // Sync on resize (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncState, 150);
    });

    // Initial state
    syncState();
  })();

})();
