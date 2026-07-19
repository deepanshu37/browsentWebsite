(() => {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const nav = $('#nav');
  const toggle = $('#navToggle');
  const navLinks = $('.nav-links');

  const closeNav = () => {
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  };

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      navLinks.classList.toggle('active');
      document.body.style.overflow = expanded ? '' : 'hidden';
    });

    $$('.nav-links a:not(.dropdown-toggle):not(.dropdown-toggle-sub)').forEach(a => {
      a.addEventListener('click', closeNav);
    });

    $$('.dropdown-toggle').forEach(tgl => {
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

    $$('.dropdown-toggle-sub').forEach(tgl => {
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

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });

  const tabs = $('.tabs-nav');
  if (tabs) {
    const tabBtns = $$('.tab-btn', tabs);
    const tabPanels = $$('.tab-panel');

    function activateTab(id) {
      tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
      tabPanels.forEach(panel => panel.classList.toggle('active', panel.id === id));
    }

    const firstTab = $('.tab-btn.active', tabs) || tabBtns[0];
    if (firstTab) activateTab(firstTab.dataset.tab);

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => activateTab(btn.dataset.tab));
    });

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

  const form = $('#contactForm');
  const note = $('#formNote');
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

  /* ============================================= */
  /*  GLASSMORPHISM CARD ENHANCEMENTS              */
  /* ============================================= */

  const glassCards = $$('.feature-card');
  if (glassCards.length) {
    glassCards.forEach((card, idx) => {
      /* Reflection sweep layer */
      const reflection = document.createElement('div');
      reflection.className = 'feature-card-reflection';
      card.appendChild(reflection);

      /* Expanding glass blob (bottom-right origin) */
      const blob = document.createElement('div');
      blob.className = 'feature-card-blob';
      card.appendChild(blob);

      /* Circular action button */
      const btn = document.createElement('button');
      btn.className = 'feature-card-btn';
      btn.setAttribute('aria-label', 'Learn more about this service');
      btn.setAttribute('tabindex', '0');
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
      card.appendChild(btn);

      /* Cursor-responsive lighting */
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', x);
        card.style.setProperty('--mouse-y', y);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--mouse-x', '30');
        card.style.setProperty('--mouse-y', '20');
      });

      /* Stagger animation delay based on data-delay for reveal */
      const delay = parseInt(card.getAttribute('data-delay')) || idx * 100;
      btn.style.transitionDelay = (delay + 160) + 'ms';

      /* Click handler for the action button (links to contact or relevant page) */
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const link = card.closest('a') || card.querySelector('a');
        if (link) {
          link.click();
        } else {
          const contact = document.querySelector('.contact');
          if (contact) {
            contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes rippleEffect {
      to { width:300px; height:300px; opacity:0; }
    }
  `;
  document.head.appendChild(rippleStyle);
})();
