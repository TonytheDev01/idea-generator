'use strict';

// IDEA-ENGNE - LANDING PAGE SCRIPTS
// Built by Anthony Michael (TonyDev)

// ─── MOBILE SIDEBAR MENU ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;

  if (!hamburger || !mobileMenu) return;

  let backdrop = document.querySelector('.mobile-menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    mobileMenu.parentElement.insertBefore(backdrop, mobileMenu.nextSibling);
  }

  let closeBtn = mobileMenu.querySelector('.mobile-menu-close');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-menu-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('aria-label', 'Close menu');
    mobileMenu.insertBefore(closeBtn, mobileMenu.firstChild);
  }

  function openMenu() {
    hamburger.classList.add('active');
    mobileMenu.classList.add('active');
    backdrop.classList.add('active');
    body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    backdrop.classList.remove('active');
    body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.contains('active') ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
      mobileLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  const navIcons = {
    'how-it-works': 'fa-map-signs',
    'features': 'fa-star',
    'testimonials': 'fa-comments',
    'pricing': 'fa-tags',
    'faq': 'fa-question-circle'
  };

  mobileLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = href.substring(1);
      const iconClass = navIcons[section];
      if (iconClass && !link.querySelector('i')) {
        const icon = document.createElement('i');
        icon.className = `fas ${iconClass}`;
        link.insertBefore(icon, link.firstChild);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) closeMenu();
  });

  // Highlight active section on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.mobile-nav-links a[href^="#"]');

  function highlightActiveSection() {
    const scrollY = window.pageYOffset;
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) link.classList.add('active');
        });
      }
    });
  }

  window.addEventListener('scroll', highlightActiveSection, { passive: true });
});

// ─── CHECK USER LOGIN STATUS ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('ideaEngneUser');
  const storedData   = localStorage.getItem('ideaEngneUserData');
  let user = null;

  if (storedData) {
    try { user = JSON.parse(storedData); }
    catch (error) { console.warn('Corrupted user data in localStorage', error); }
  }

  if (loggedInUser && user) {
    const ctaTriggers = document.querySelectorAll('.cta-trigger');
    ctaTriggers.forEach(btn => {
      if (btn.textContent.includes('Start') || btn.textContent.includes('Free')) {
        btn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Go to Dashboard';
        btn.onclick = (e) => { e.preventDefault(); window.location.href = 'app.html'; };
      }
    });

    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu && !mobileMenu.querySelector('.mobile-user-info')) {
      const userInfo = document.createElement('div');
      userInfo.className = 'mobile-user-info show';
      const initials = user.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : loggedInUser.charAt(0).toUpperCase() + loggedInUser.split('@')[0].slice(-1).toUpperCase();
      userInfo.innerHTML = `
        <div class="mobile-user-avatar">${initials}</div>
        <div class="mobile-user-text">
          <strong>${user.name || 'User'}</strong>
          <span>${user.subscription === 'free' ? `${user.freeIdeasRemaining || 0} free ideas left` : 'Pro member'}</span>
        </div>`;
      mobileMenu.insertBefore(userInfo, mobileMenu.firstChild);
    }

    const mobileCTA = document.querySelector('.mobile-cta');
    if (mobileCTA) {
      mobileCTA.innerHTML = `
        <button class="btn-primary" onclick="window.location.href='app.html'">
          <i class="fas fa-tachometer-alt"></i> Dashboard
        </button>
        <button class="btn-outline" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>`;
    }
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('ideaEngneUser');
    localStorage.removeItem('ideaEngneUserData');
    localStorage.removeItem('ideaEngneRememberMe');
    localStorage.removeItem('ideaEngneLastIdeas');
    window.location.reload();
  }
}

// ─── HEADER SCROLL EFFECT ─────────────────────────────────────
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ─── SCROLL FADE-IN OBSERVER ──────────────────────────────────
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => fadeObserver.observe(el));
});

// ─── TYPING EFFECT ────────────────────────────────────────────
class TypingEffect {
  constructor(el, words, typeSpeed = 90, deleteSpeed = 45, pause = 2200) {
    this.el = el;
    this.words = words;
    this.typeSpeed = typeSpeed;
    this.deleteSpeed = deleteSpeed;
    this.pause = pause;
    this.wordIndex = 0;
    this.text = '';
    this.isDeleting = false;
  }

  tick() {
    const word = this.words[this.wordIndex];
    this.text = this.isDeleting
      ? word.substring(0, this.text.length - 1)
      : word.substring(0, this.text.length + 1);
    this.el.textContent = this.text;

    let speed = this.isDeleting ? this.deleteSpeed : this.typeSpeed;
    if (!this.isDeleting && this.text === word) {
      speed = this.pause;
      this.isDeleting = true;
    } else if (this.isDeleting && this.text === '') {
      this.isDeleting = false;
      this.wordIndex = (this.wordIndex + 1) % this.words.length;
      speed = 400;
    }
    setTimeout(() => this.tick(), speed);
  }

  start(delay = 600) { setTimeout(() => this.tick(), delay); }
}

document.addEventListener('DOMContentLoaded', () => {
  const typingEl = document.getElementById('typing-hero');
  if (typingEl) {
    new TypingEffect(typingEl, ['Creators', 'Coaches', 'Founders', 'Brands', 'Bloggers', 'Marketers']).start();
  }
});

// ─── ANIMATED COUNTER 
function animateCounter(el, target, duration = 2000) {
  if (!el || typeof target !== 'number' || Number.isNaN(target) || target < 0) return;

  const isLarge   = target >= 10000;
  const increment = target / (duration / 16);
  let current     = 0;

  const update = () => {
    current = Math.min(current + increment, target);
    if (isLarge) {
      el.textContent = current >= 1000
        ? (current / 1000).toFixed(current >= 100000 ? 0 : 1) + 'K+'
        : Math.floor(current).toLocaleString();
    } else {
      el.textContent = Math.floor(current) + (target === 98 ? '%' : '+');
    }
    if (current < target) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.count);
      animateCounter(el, target);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// ─── DYNAMIC STATS (Supabase) 
// Fetches real numbers from platform_stats table and updates data-count
// so the existing animated counter picks them up on scroll.

async function loadDynamicStats() {
  try {
    // window.getPlatformStats is exposed by supabase.js
    if (typeof window.getPlatformStats !== 'function') return;

    const stats = await window.getPlatformStats();
    if (!stats) return;

    // Map stat fields to the data-count elements in index.html
    const statMap = [
      { selector: '[data-count="12000"]', value: stats.total_users            },
      { selector: '[data-count="500000"]', value: stats.total_ideas_generated },
      { selector: '[data-count="98"]',    value: stats.satisfaction_percentage }
    ];

    statMap.forEach(({ selector, value }) => {
      if (!value) return;
      const el = document.querySelector(selector);
      if (!el) return;
      // Update data-count so counterObserver uses real value
      el.dataset.count = value;
      // If element is already visible (observer already fired), update text directly
      if (el.textContent !== '0') animateCounter(el, value);
    });

  } catch (err) {
    console.warn('Dynamic stats load failed — using hardcoded values:', err.message);
    // Graceful fallback: hardcoded values in HTML remain visible
  }
}

// ─── DYNAMIC TESTIMONIALS (Supabase) 
// Fetches approved testimonials and replaces static cards in the grid.
// If DB has no approved rows, static cards remain untouched.

async function loadDynamicTestimonials() {
  try {
    if (typeof window.getApprovedTestimonials !== 'function') return;

    const testimonials = await window.getApprovedTestimonials();
    if (!testimonials || testimonials.length === 0) return; // Keep static cards

    const grid = document.querySelector('.testimonials-grid');
    if (!grid) return;

    const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3'];

    grid.innerHTML = testimonials.map((t, i) => {
      const rating   = Math.min(5, Math.max(1, t.rating || 5));
      const stagger  = staggerClasses[i % 3];
      const stars    = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const ariaLabel = `${rating} out of 5 stars`;

      return `
        <article class="testimonial-card fade-in ${stagger}">
          <div class="testimonial-stars" aria-label="${ariaLabel}">${stars}</div>
          <p class="testimonial-text">"${escapeHtmlLanding(t.message)}"</p>
          <div class="testimonial-author">
            <div class="author-avatar" aria-hidden="true"
                 style="width:45px;height:45px;border-radius:50%;background:var(--primary);
                        display:flex;align-items:center;justify-content:center;
                        color:#fff;font-weight:700;font-size:1.4rem;flex-shrink:0;">
              ${(t.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div class="author-info">
              <strong>${escapeHtmlLanding(t.name || 'Anonymous')}</strong>
              <span>Verified Creator</span>
            </div>
            <i class="fas fa-check-circle verified-badge" title="Verified creator" aria-label="Verified"></i>
          </div>
        </article>`;
    }).join('');

    // Re-observe new cards for fade-in animation
    grid.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  } catch (err) {
    console.warn('Dynamic testimonials load failed — using static cards:', err.message);
  }
}

function escapeHtmlLanding(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ─── FAQ ACCORDION 
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ─── CTA MODAL 
class CTAModal {
  constructor() {
    this.modal = document.getElementById('ctaModal');
    this.init();
  }

  init() {
    const loggedInUser = localStorage.getItem('ideaEngneUser');

    document.querySelectorAll('.cta-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = loggedInUser ? 'app.html' : 'signup.html';
      });
    });

    const ctaEmailMain = document.getElementById('ctaEmailMain');
    if (ctaEmailMain) {
      ctaEmailMain.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const email = ctaEmailMain.value.trim();
          localStorage.setItem('ideaEngnePrefilledEmail', email);
          window.location.href = 'signup.html';
        }
      });
    }

    if (this.modal) {
      this.modal.querySelector('.modal-close')?.addEventListener('click', () => this.close());
      this.modal.querySelector('.cta-modal-overlay')?.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('active')) this.close();
      });
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
}

// ─── SMOOTH SCROLL 
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── INIT 
document.addEventListener('DOMContentLoaded', () => {
  new CTAModal();

  // Load dynamic data from Supabase
  // Small delay ensures supabase.js module has fully executed
  setTimeout(() => {
    loadDynamicStats();
    loadDynamicTestimonials();
  }, 300);
});

console.log('%c⚡ Idea-Engne', 'font-size:18px;font-weight:700;color:#4f39f6;');
console.log('%c→ GitHub: github.com/TonytheDev01', 'font-size:13px;color:#666;');