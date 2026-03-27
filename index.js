'use strict';

// ========================================
// IDEA-ENGNE - LANDING PAGE SCRIPTS
// Built by Anthony Michael (TonyDev)
// ========================================

// ========== MOBILE SIDEBAR MENU (ENHANCED) ==========
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const body = document.body;
  
  // Guard: only proceed if mobile menu elements exist on this page
  if (!hamburger || !mobileMenu) {
    return; // This page doesn't have mobile menu structure
  }
  
  // Get backdrop (now in HTML, inside header)
  let backdrop = document.querySelector('.mobile-menu-backdrop');
  if (!backdrop) {
    // Fallback: create if doesn't exist
    backdrop = document.createElement('div');
    backdrop.className = 'mobile-menu-backdrop';
    mobileMenu.parentElement.insertBefore(backdrop, mobileMenu.nextSibling);
  }
  
  // Create close button in sidebar if it doesn't exist
  let closeBtn = mobileMenu.querySelector('.mobile-menu-close');
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-menu-close';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.setAttribute('aria-label', 'Close menu');
    mobileMenu.insertBefore(closeBtn, mobileMenu.firstChild);
  }
  
  // Open menu
  function openMenu() {
    hamburger.classList.add('active');
    mobileMenu.classList.add('active');
    backdrop.classList.add('active');
    body.style.overflow = 'hidden';
  }
  
  // Close menu
  function closeMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('active');
    backdrop.classList.remove('active');
    body.style.overflow = '';
  }
  
  if (hamburger && mobileMenu) {
    // Hamburger click
    hamburger.addEventListener('click', () => {
      if (mobileMenu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
    
    // Close button click
    closeBtn.addEventListener('click', closeMenu);
    
    // Backdrop click
    backdrop.addEventListener('click', closeMenu);
    
    // Close when clicking on links
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
        
        // Add active class to clicked link
        mobileLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
    
    // Add icons to nav links if they don't have them
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
  }
  
  // Close menu on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('active')) {
      closeMenu();
    }
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
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  
  window.addEventListener('scroll', highlightActiveSection, { passive: true });
});

// ========== CHECK USER LOGIN STATUS ==========
document.addEventListener('DOMContentLoaded', () => {
  const loggedInUser = localStorage.getItem('ideaEngneUser');
  const storedData = localStorage.getItem('ideaEngneUserData');
  let user = null;
  
  if (storedData) {
    try {
      user = JSON.parse(storedData);
    } catch (error) {
      console.warn('Corrupted user data in localStorage', error);
    }
  }
  
  if (loggedInUser && user) {
    
    // Update CTA buttons to "Go to Dashboard"
    const ctaTriggers = document.querySelectorAll('.cta-trigger');
    ctaTriggers.forEach(btn => {
      if (btn.textContent.includes('Start') || btn.textContent.includes('Free')) {
        btn.innerHTML = '<i class="fas fa-tachometer-alt"></i> Go to Dashboard';
        btn.onclick = (e) => {
          e.preventDefault();
          window.location.href = 'app.html';
        };
      }
    });
    
    // Show user info in mobile sidebar
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
        </div>
      `;
      
      mobileMenu.insertBefore(userInfo, mobileMenu.firstChild);
    }
    
    // Update mobile CTA to show dashboard and logout
    const mobileCTA = document.querySelector('.mobile-cta');
    if (mobileCTA) {
      mobileCTA.innerHTML = `
        <button class="btn-primary" onclick="window.location.href='app.html'">
          <i class="fas fa-tachometer-alt"></i> Dashboard
        </button>
        <button class="btn-outline" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      `;
    }
  }
});

// Logout handler
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('ideaEngneUser');
    localStorage.removeItem('ideaEngneUserData');
    localStorage.removeItem('ideaEngneRememberMe');
    localStorage.removeItem('ideaEngneLastIdeas');
    window.location.reload();
  }
}

// ========== HEADER SCROLL EFFECT ==========
const header = document.getElementById('site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

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
    const words = ['Creators', 'Coaches', 'Founders', 'Brands', 'Bloggers', 'Marketers'];
    new TypingEffect(typingEl, words).start();
  }
});

// ========== ANIMATED COUNTER ==========
function animateCounter(el, target, duration = 2000) {
  // Guard against invalid inputs
  if (!el || typeof target !== 'number' || Number.isNaN(target) || target < 0) {
    return;
  }
  
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

// ========== CTA MODAL (UPDATED) ==========
class CTAModal {
  constructor() {
    this.modal = document.getElementById('ctaModal');
    this.form = document.getElementById('ctaModalForm');
    this.successEl = document.getElementById('modalSuccess');
    this.submitBtn = document.getElementById('modalSubmitBtn');
    this.init();
  }

  init() {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('ideaEngneUser');
    
    // Open triggers
    document.querySelectorAll('.cta-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // If user is logged in, go to dashboard
        if (loggedInUser) {
          window.location.href = 'app.html';
        } else {
          // Otherwise, go to signup
          window.location.href = 'signup.html';
        }
      });
    });

    // CTA section email input → redirect to signup with pre-filled email
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

    // Close triggers (if modal exists)
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

document.addEventListener('DOMContentLoaded', () => {
  new CTAModal();
});

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

// ========== CONSOLE BRANDING ==========
console.log('%c⚡ Idea-Engne', 'font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cBuilt by Anthony Michael (TonyDev)', 'font-size:14px;color:#22D3EE;font-weight:600;');
console.log('%c→ GitHub: github.com/TonytheDev01', 'font-size:13px;color:#666;');