'use strict';

// ========================================
// IDEA-ENGNE - SIGNUP/LOGIN SYSTEM
// Powered by Supabase Auth
// Built by Anthony Michael (TonyDev)
// ========================================

const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText    = document.getElementById('loadingText');
const successModal   = document.getElementById('successModal');
const authTabs       = document.querySelectorAll('.auth-tab');

// ========== TAB SWITCHING ==========
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(
      tab.dataset.tab === 'signup' ? 'signupForm' : 'loginForm'
    ).classList.add('active');
    clearAllErrors();
  });
});

// ========== PASSWORD TOGGLE ==========
function setupToggle(toggleId, inputId) {
  document.getElementById(toggleId).addEventListener('click', () => {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    document.querySelector(`#${toggleId} i`).classList.toggle('fa-eye');
    document.querySelector(`#${toggleId} i`).classList.toggle('fa-eye-slash');
  });
}

setupToggle('toggleSignupPassword', 'signupPassword');
setupToggle('toggleLoginPassword',  'loginPassword');

// ========== LIVE PASSWORD REQUIREMENTS ==========
const requirements = {
  'req-length':  { test: p => p.length >= 8,           label: 'At least 8 characters'        },
  'req-upper':   { test: p => /[A-Z]/.test(p),          label: 'One uppercase letter (A-Z)'   },
  'req-lower':   { test: p => /[a-z]/.test(p),          label: 'One lowercase letter (a-z)'   },
  'req-number':  { test: p => /\d/.test(p),             label: 'One number (0-9)'              },
  'req-special': { test: p => /[@$!%*?&#^()_+\-=]/.test(p), label: 'One special character (!@#$%)' }
};

document.getElementById('signupPassword').addEventListener('input', function () {
  const password = this.value;
  const reqBox   = document.getElementById('passwordRequirements');
  const fill     = document.getElementById('strengthFill');
  const text     = document.getElementById('strengthText');
  const strength = document.getElementById('passwordStrength');

  if (password.length === 0) {
    reqBox.classList.remove('show');
    strength.classList.remove('show');
    return;
  }

  reqBox.classList.add('show');
  strength.classList.add('show');

  let passed = 0;

  Object.entries(requirements).forEach(([id, rule]) => {
    const el   = document.getElementById(id);
    const icon = el.querySelector('i');
    const met  = rule.test(password);

    if (met) {
      el.classList.add('met');
      el.classList.remove('unmet');
      icon.className = 'fas fa-check-circle';
      passed++;
    } else {
      el.classList.remove('met');
      el.classList.add('unmet');
      icon.className = 'fas fa-times-circle';
    }
  });

  // Update strength bar
  fill.className = 'strength-fill';
  text.className = 'strength-text';

  if (passed <= 2) {
    fill.classList.add('weak');
    text.classList.add('weak');
    text.textContent = 'Weak — keep going';
  } else if (passed <= 3) {
    fill.classList.add('medium');
    text.classList.add('medium');
    text.textContent = 'Medium — almost there';
  } else if (passed === 4) {
    fill.classList.add('strong');
    text.classList.add('strong');
    text.textContent = 'Strong password';
  } else {
    fill.classList.add('strong');
    text.classList.add('strong');
    text.textContent = '✅ Very strong password!';
  }
});

// ========== VALIDATION HELPERS ==========
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input)  { input.classList.add('error'); input.classList.remove('success'); }
  if (error)  { error.textContent = message; error.classList.add('show'); }
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input)  { input.classList.remove('error'); input.classList.add('success'); }
  if (error)  { error.classList.remove('show'); }
}

function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(i => {
    i.classList.remove('error', 'success');
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isPasswordStrong(password) {
  return Object.values(requirements).every(r => r.test(password));
}

function showLoading(message = 'Please wait...') {
  loadingText.textContent = message;
  loadingOverlay.classList.add('show');
}

function hideLoading() {
  loadingOverlay.classList.remove('show');
}

// ========== SIGNUP ==========
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const terms    = document.getElementById('termsCheckbox').checked;

  let valid = true;

  if (name.length < 2) {
    showError('signupName', 'nameError', 'Name must be at least 2 characters');
    valid = false;
  }

  if (!validateEmail(email)) {
    showError('signupEmail', 'emailError', 'Please enter a valid email address');
    valid = false;
  }

  if (!isPasswordStrong(password)) {
    showError('signupPassword', 'passwordError', 'Please meet all password requirements above');
    valid = false;
  }

  if (!terms) {
    showError('termsCheckbox', 'termsError', 'You must accept the terms and conditions');
    valid = false;
  }

  if (!valid) return;

  showLoading('Creating your account...');

  try {
    // Create auth user in Supabase
    const data = await signUp(name, email, password);

    // Save extended profile to localStorage as cache
    const userProfile = {
      id: data.user.id,
      name,
      email,
      subscription: 'free',
      freeIdeasRemaining: 15,
      totalIdeasGenerated: 0,
      preferences: { platforms: [], niche: '', tone: '', audience: '' },
      savedIdeas: [],
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('ideaEngneUser', email);
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userProfile));

    hideLoading();
    successModal.classList.add('show');

  } catch (error) {
    hideLoading();
    console.error('Signup error:', error);

    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      showError('signupEmail', 'emailError', 'This email is already registered. Please sign in.');
    } else if (error.message.includes('Password')) {
      showError('signupPassword', 'passwordError', error.message);
    } else {
      showError('signupEmail', 'emailError', 'Signup failed: ' + error.message);
    }
  }
});

// ========== LOGIN ==========
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const remember = document.getElementById('rememberMe').checked;

  let valid = true;

  if (!validateEmail(email)) {
    showError('loginEmail', 'loginEmailError', 'Please enter a valid email address');
    valid = false;
  }

  if (!password) {
    showError('loginPassword', 'loginPasswordError', 'Password is required');
    valid = false;
  }

  if (!valid) return;

  showLoading('Signing you in...');

  try {
    const data = await signIn(email, password);
    const user = data.user;

    // Fetch profile from Supabase
    let profile;
    try {
      profile = await getProfile(user.id);
    } catch {
      // Profile might not exist yet for older users
      profile = {
        id: user.id,
        name: user.user_metadata?.name || email.split('@')[0],
        email,
        subscription: 'free',
        free_ideas_remaining: 15,
        total_ideas_generated: 0
      };
    }

    // Normalise field names
    const userData = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      subscription: profile.subscription || 'free',
      freeIdeasRemaining: profile.free_ideas_remaining ?? 15,
      totalIdeasGenerated: profile.total_ideas_generated ?? 0,
      avatar_url: profile.avatar_url || null,
      preferences: {
        niche:    profile.niche    || '',
        tone:     profile.tone     || '',
        audience: profile.audience || '',
        platforms: []
      },
      savedIdeas: []
    };

    localStorage.setItem('ideaEngneUser', email);
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    if (remember) localStorage.setItem('ideaEngneRememberMe', 'true');

    hideLoading();
    window.location.href = 'app.html';

  } catch (error) {
    hideLoading();
    console.error('Login error:', error);

    if (error.message.includes('Invalid login') || error.message.includes('credentials')) {
      showError('loginEmail', 'loginEmailError', 'Invalid email or password');
    } else if (error.message.includes('Email not confirmed')) {
      showError('loginEmail', 'loginEmailError', 'Please verify your email first. Check your inbox.');
    } else {
      showError('loginEmail', 'loginEmailError', 'Login failed: ' + error.message);
    }
  }
});

// ========== SUCCESS MODAL CONTINUE ==========
document.getElementById('continueBtn').addEventListener('click', () => {
  window.location.href = 'app.html';
});

// ========== FORGOT PASSWORD ==========
document.getElementById('forgotPasswordLink').addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();

  if (!validateEmail(email)) {
    showError('loginEmail', 'loginEmailError', 'Enter your email above first, then click Forgot Password');
    return;
  }

  showLoading('Sending reset email...');

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/signup.html'
    });
    if (error) throw error;
    hideLoading();
    alert(`✅ Password reset email sent to ${email}. Check your inbox.`);
  } catch (error) {
    hideLoading();
    showError('loginEmail', 'loginEmailError', 'Could not send reset email: ' + error.message);
  }
});

// ========== SOCIAL AUTH ==========
document.getElementById('googleSignup').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
});
document.getElementById('githubSignup').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'github' });
});
document.getElementById('googleLogin').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
});
document.getElementById('githubLogin').addEventListener('click', async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: 'github' });
});

// ========== AUTO LOGIN CHECK ==========
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    window.location.href = 'app.html';
  }

  // Pre-fill email if came from landing page
  const prefilled = localStorage.getItem('ideaEngnePrefilledEmail');
  if (prefilled) {
    document.getElementById('signupEmail').value = prefilled;
    localStorage.removeItem('ideaEngnePrefilledEmail');
  }
});

// ========== CONSOLE BRANDING ==========
console.log('%c⚡ Idea-Engne Auth', 'font-size:20px;font-weight:900;color:#4f39f6;');
console.log('%cPowered by Supabase | Built by TonyDev', 'font-size:14px;color:#22D3EE;font-weight:600;');