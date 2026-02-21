'use strict';

// ========== HAMBURGER MENU ==========
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;

  if (hamburger && mobileMenu) {
    // Toggle menu on hamburger click
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      
      // Prevent scrolling when menu is open
      body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
      
      // Update aria-expanded for accessibility
      const isExpanded = mobileMenu.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }
});

// ========== HEADER SCROLL EFFECT ==========
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });


// ========== SCROLL FADE-IN OBSERVER ==========
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll(
    '.fade-in, .fade-in-left, .fade-in-right'
  ).forEach(el => fadeObserver.observe(el));
});


// ========== TYPING EFFECT ==========
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
    if (this.isDeleting) {
      this.text = word.substring(0, this.text.length - 1);
    } else {
      this.text = word.substring(0, this.text.length + 1);
    }
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

  start(delay = 600) {
    setTimeout(() => this.tick(), delay);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const typingEl = document.getElementById('typing-hero');
  if (typingEl) {
    const words = ['Creators', 'Coaches', 'Founders', 'Brands', 'Bloggers', 'Tech bro', 'Tech sis'];
    new TypingEffect(typingEl, words).start();
  }
});


// ========== ANIMATED COUNTER ==========
function animateCounter(el, target, duration = 2000) {
  const isLarge = target >= 10000;
  const increment = target / (duration / 16);
  let current = 0;

  const update = () => {
    current = Math.min(current + increment, target);
    if (isLarge) {
      el.textContent = (current >= 1000)
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
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.count));
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));


// ========== FAQ ACCORDION ==========
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');

    // Close all
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));

    // Toggle current
    if (!isOpen) item.classList.add('open');
  });
});


// ========== CTA MODAL (UPDATED WITH APP REDIRECT) ==========
class CTAModal {
  constructor() {
    this.modal = document.getElementById('ctaModal');
    this.form = document.getElementById('ctaModalForm');
    this.successEl = document.getElementById('modalSuccess');
    this.submitBtn = document.getElementById('modalSubmitBtn');
    this.init();
  }

  init() {
    // Open triggers
    document.querySelectorAll('.cta-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    });

    // CTA section email input → open modal with pre-filled email
    const ctaEmailMain = document.getElementById('ctaEmailMain');
    if (ctaEmailMain) {
      ctaEmailMain.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.getElementById('modalEmail').value = ctaEmailMain.value;
          this.open();
        }
      });
    }

    // Close triggers
    this.modal.querySelector('.modal-close').addEventListener('click', () => this.close());
    this.modal.querySelector('.cta-modal-overlay').addEventListener('click', () => this.close());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.close();
    });

    // Form submit
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });

    // Got it button
    document.getElementById('modalGotItBtn').addEventListener('click', () => this.close());
  }

  open() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('modalEmail').focus(), 150);
  }

  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => {
      this.form.reset();
      this.form.style.display = 'flex';
      this.successEl.style.display = 'none';
      this.submitBtn.textContent = 'Get My Free Ideas →';
      this.submitBtn.disabled = false;
      document.getElementById('emailError').style.display = 'none';
    }, 300);
  }

  submit() {
    const email = document.getElementById('modalEmail').value.trim();
    const niche = document.getElementById('modalNiche').value.trim();
    const errorEl = document.getElementById('emailError');

    if (!this.validateEmail(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.style.display = 'block';
      return;
    }

    errorEl.style.display = 'none';
    this.submitBtn.textContent = 'Processing...';
    this.submitBtn.disabled = true;

    // Save user data and redirect to app
    setTimeout(() => {
      // Save to localStorage
      localStorage.setItem('ideaEngneUser', email);
      if (niche) {
        localStorage.setItem('ideaEngneNiche', niche);
      }
      
      console.log('🚀 New signup:', { email, niche });
      
      // Redirect to app dashboard
      window.location.href = 'app.html';
    }, 1400);
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

document.addEventListener('DOMContentLoaded', () => new CTAModal());


// ========== SMOOTH SCROLL (NAV) ==========
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


// ========== CHECK IF USER IS ALREADY LOGGED IN ==========
document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('ideaEngneUser');
  if (loggedInUser) {
    // User is already logged in - update CTA buttons
    const ctaTriggers = document.querySelectorAll('.cta-trigger');
    ctaTriggers.forEach(btn => {
      if (btn.textContent.includes('Start') || btn.textContent.includes('Free')) {
        btn.textContent = '→ Go to Dashboard';
        btn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'app.html';
        };
      }
    });
  }
});


// ========== CONSOLE BRANDING ==========
console.log('%c⚡ Idea-Engne', 'font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cBuilt from scratch by Anthony Michael (TonyDev)', 'font-size:14px;color:#22D3EE;font-weight:600;');
console.log('%c→ GitHub: github.com/TonytheDev01 | LinkedIn: linkedin.com/in/anthony-chuksmichael/', 'font-size:13px;color:#666;');