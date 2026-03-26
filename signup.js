'use strict';

// ========================================
// IDEA-ENGNE - SIGNUP/LOGIN SYSTEM
// Built by Anthony Michael (TonyDev)
// ========================================

// ========== DOM ELEMENTS ==========
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const authTabs = document.querySelectorAll('.auth-tab');
const loadingOverlay = document.getElementById('loadingOverlay');
const successModal = document.getElementById('successModal');

// Signup fields
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const termsCheckbox = document.getElementById('termsCheckbox');
const toggleSignupPassword = document.getElementById('toggleSignupPassword');
const passwordStrength = document.getElementById('passwordStrength');

// Login fields
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const rememberMe = document.getElementById('rememberMe');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');

// ========== TAB SWITCHING ==========
authTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Update tab UI
    authTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Toggle forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    
    if (targetTab === 'signup') {
      signupForm.classList.add('active');
    } else {
      loginForm.classList.add('active');
    }
  });
});

// ========== PASSWORD TOGGLE ==========
toggleSignupPassword.addEventListener('click', () => {
  const type = signupPassword.type === 'password' ? 'text' : 'password';
  signupPassword.type = type;
  toggleSignupPassword.querySelector('i').classList.toggle('fa-eye');
  toggleSignupPassword.querySelector('i').classList.toggle('fa-eye-slash');
});

toggleLoginPassword.addEventListener('click', () => {
  const type = loginPassword.type === 'password' ? 'text' : 'password';
  loginPassword.type = type;
  toggleLoginPassword.querySelector('i').classList.toggle('fa-eye');
  toggleLoginPassword.querySelector('i').classList.toggle('fa-eye-slash');
});

// ========== PASSWORD STRENGTH METER ==========
signupPassword.addEventListener('input', () => {
  const password = signupPassword.value;
  const strengthFill = passwordStrength.querySelector('.strength-fill');
  const strengthText = passwordStrength.querySelector('.strength-text');
  
  if (password.length === 0) {
    passwordStrength.classList.remove('show');
    return;
  }
  
  passwordStrength.classList.add('show');
  
  // Calculate strength
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;
  
  // Update UI
  strengthFill.className = 'strength-fill';
  strengthText.className = 'strength-text';
  
  if (strength <= 2) {
    strengthFill.classList.add('weak');
    strengthText.classList.add('weak');
    strengthText.textContent = 'Weak password';
  } else if (strength <= 3) {
    strengthFill.classList.add('medium');
    strengthText.classList.add('medium');
    strengthText.textContent = 'Medium strength';
  } else {
    strengthFill.classList.add('strong');
    strengthText.classList.add('strong');
    strengthText.textContent = 'Strong password';
  }
});

// ========== VALIDATION HELPERS ==========
function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  input.classList.add('error');
  input.classList.remove('success');
  error.textContent = message;
  error.classList.add('show');
}

function clearError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  input.classList.remove('error');
  input.classList.add('success');
  error.classList.remove('show');
}

function clearAllErrors() {
  document.querySelectorAll('.form-error').forEach(err => err.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(input => {
    input.classList.remove('error');
    input.classList.remove('success');
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  // At least 8 characters, 1 letter, 1 number
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

function validateName(name) {
  return name.trim().length >= 2;
}

// ========== SIGNUP FORM SUBMIT ==========
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();
  
  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value;
  const termsAccepted = termsCheckbox.checked;
  
  let isValid = true;
  
  // Validate name
  if (!validateName(name)) {
    showError('signupName', 'nameError', 'Name must be at least 2 characters');
    isValid = false;
  } else {
    clearError('signupName', 'nameError');
  }
  
  // Validate email
  if (!validateEmail(email)) {
    showError('signupEmail', 'emailError', 'Please enter a valid email address');
    isValid = false;
  } else {
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('ideaEngneUsers') || '[]');
    if (users.find(u => u.email === email)) {
      showError('signupEmail', 'emailError', 'This email is already registered. Please login.');
      isValid = false;
    } else {
      clearError('signupEmail', 'emailError');
    }
  }
  
  // Validate password
  if (!validatePassword(password)) {
    showError('signupPassword', 'passwordError', 'Password must be at least 8 characters with letters and numbers');
    isValid = false;
  } else {
    clearError('signupPassword', 'passwordError');
  }
  
  // Validate terms
  if (!termsAccepted) {
    showError('termsCheckbox', 'termsError', 'You must accept the terms and conditions');
    isValid = false;
  } else {
    clearError('termsCheckbox', 'termsError');
  }
  
  if (!isValid) return;
  
  // Show loading
  loadingOverlay.classList.add('show');
  
  // Simulate account creation (1.5 seconds)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create user account
  // ⚠️ NOTE: Password storage is NOT SECURE in this demo
  // In production: Hash passwords with bcrypt or similar (NEVER store plain text)
  const newUser = {
    id: Date.now().toString(),
    name: name,
    email: email,
    password: password, // ⚠️ SECURITY: Should be hashed using bcrypt, Argon2, etc.
    createdAt: new Date().toISOString(),
    freeIdeasRemaining: 15,
    totalIdeasGenerated: 0,
    subscription: 'free',
    savedIdeas: [],
    preferences: {
      platforms: [],
      niche: '',
      tone: ''
    }
  };
  
  // Save to users array with error handling
  try {
    const users = JSON.parse(localStorage.getItem('ideaEngneUsers') || '[]');
    users.push(newUser);
    localStorage.setItem('ideaEngneUsers', JSON.stringify(users));
  } catch (storageError) {
    console.error('Failed to save user data:', storageError);
    loadingOverlay.classList.remove('show');
    showError('signupEmail', 'emailError', 'Failed to create account. Please try again.');
    return;
  }
  
  // Set current user
  localStorage.setItem('ideaEngneUser', email);
  localStorage.setItem('ideaEngneUserData', JSON.stringify(newUser));
  
  // Hide loading
  loadingOverlay.classList.remove('show');
  
  // Show success modal
  successModal.classList.add('show');
  
  console.log('✅ Account created successfully:', { name, email });
});

// ========== LOGIN FORM SUBMIT ==========
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();
  
  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  const remember = rememberMe.checked;
  
  let isValid = true;
  
  // Validate email
  if (!validateEmail(email)) {
    showError('loginEmail', 'loginEmailError', 'Please enter a valid email address');
    isValid = false;
  } else {
    clearError('loginEmail', 'loginEmailError');
  }
  
  // Validate password
  if (password.length === 0) {
    showError('loginPassword', 'loginPasswordError', 'Password is required');
    isValid = false;
  } else {
    clearError('loginPassword', 'loginPasswordError');
  }
  
  if (!isValid) return;
  
  // Show loading
  loadingOverlay.classList.add('show');
  
  // Simulate login check (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check credentials
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('ideaEngneUsers') || '[]');
  } catch (error) {
    console.error('Failed to read user database:', error);
    loadingOverlay.classList.remove('show');
    showError('loginEmail', 'loginEmailError', 'Login system error. Please try again.');
    return;
  }
  
  // ⚠️ SECURITY: This is plain text comparison (not secure for production)
  // In production: Use bcrypt.compare(password, user.passwordHash)
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    loadingOverlay.classList.remove('show');
    showError('loginEmail', 'loginEmailError', 'Invalid email or password');
    showError('loginPassword', 'loginPasswordError', 'Invalid email or password');
    return;
  }
  
  // Successful login
  localStorage.setItem('ideaEngneUser', email);
  localStorage.setItem('ideaEngneUserData', JSON.stringify(user));
  
  if (remember) {
    localStorage.setItem('ideaEngneRememberMe', 'true');
  }
  
  loadingOverlay.classList.remove('show');
  
  console.log('✅ Login successful:', email);
  
  // Redirect to dashboard
  window.location.href = 'app.html';
});

// ========== SUCCESS MODAL CONTINUE ==========
document.getElementById('continueBtn').addEventListener('click', () => {
  // Redirect to homepage so user can explore before going to dashboard
  window.location.href = 'index.html';
});

// ========== SOCIAL AUTH (PLACEHOLDER) ==========
document.querySelectorAll('.btn-social').forEach(btn => {
  btn.addEventListener('click', () => {
    alert('Social authentication coming soon! For now, please use email signup.');
  });
});

// ========== AUTO-LOGIN CHECK ==========
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = localStorage.getItem('ideaEngneUser');
  const rememberMe = localStorage.getItem('ideaEngneRememberMe');
  
  // If user is already logged in and has "remember me" enabled, redirect to dashboard
  if (currentUser && rememberMe === 'true') {
    console.log('🔄 User already logged in, redirecting to dashboard...');
    window.location.href = 'app.html';
  }
});

// ========== CONSOLE BRANDING ==========
console.log('%c⚡ Idea-Engne Signup', 'font-size:20px;font-weight:900;color:#4f39f6;');
console.log('%cBuilt by Anthony Michael (TonyDev)', 'font-size:14px;color:#22D3EE;font-weight:600;');