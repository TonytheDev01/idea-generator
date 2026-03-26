'use strict';

// GROQ API CONFIGURATION - PRODUCTION VERSION

const AI_MODEL = 'llama-3.1-8b-instant'; // Fast and reliable

// API Key is loaded from config.js into window.ENV

// USER DATA & AUTH CHECK

let currentUser = null;
let userData = null;

function initializeUser() {
  const userEmail = localStorage.getItem('ideaEngneUser');
  const storedUserData = localStorage.getItem('ideaEngneUserData');
  
  if (!userEmail || !storedUserData) {
    // No user logged in - redirect to signup
    window.location.href = 'signup.html';
    return false;
  }
  
  // ✅ PARSE and assign the stored data to userData
  let parsedData;
  try {
    parsedData = JSON.parse(storedUserData);
  } catch (error) {
    console.error('Corrupted user data:', error);
    localStorage.removeItem('ideaEngneUserData');
    window.location.href = 'signup.html';
    return false;
  }
  
  // ✅ NOW set userData with proper defaults
  userData = {
    subscription: 'free',
    freeIdeasRemaining: 15,
    totalIdeasGenerated: 0,
    preferences: {},
    ...parsedData
  };
  userData.preferences = userData.preferences || {};
  
  // Display user info with null checks
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userEmailEl) userEmailEl.textContent = userData.name || userEmail;
  if (userAvatarEl) {
    const initials = userData.name
      ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : userEmail.charAt(0).toUpperCase() + userEmail.split('@')[0].slice(-1).toUpperCase();
    userAvatarEl.textContent = initials;
  }
  
  // Update quota display
  updateQuotaDisplay();
  
  return true;
}

function updateQuotaDisplay() {
  const quotaInfo = document.querySelector('.quota-info');
  if (!quotaInfo || !userData) return;
  
  const remaining = Number(userData.freeIdeasRemaining || 0);
  const subscription = String(userData.subscription || 'free').toLowerCase();
  
  if (subscription === 'free') {
    quotaInfo.innerHTML = `
      <strong><i class="fas fa-gift"></i> Free Tier</strong>
      <p>You have <strong>${remaining} free ideas</strong> remaining. ${remaining === 0 ? '<a href="#pricing" style="color: var(--primary); text-decoration: underline; font-weight: 700;">Upgrade to Pro</a> for unlimited generations.' : 'Upgrade to Creator plan for unlimited generations.'}</p>
    `;
  } else {
    quotaInfo.innerHTML = `
      <strong><i class="fas fa-crown"></i> ${subscription.charAt(0).toUpperCase() + subscription.slice(1)} Plan</strong>
      <p>Unlimited ideas generation. <strong>${userData.totalIdeasGenerated || 0} ideas</strong> generated this month.</p>
    `;
  }
}

// Initialize user on page load
if (typeof initializeUser === 'function' && !initializeUser()) {
  console.error('User not authenticated, redirecting to signup');
  // Error already handled in initializeUser()
}

// DOM Elements - will be initialized in DOMContentLoaded
let platformTags = null;
let selectedPlatforms = new Set();
let form = null;
let generateBtn = null;
let emptyState = null;
let loadingState = null;
let errorState = null;
let ideasList = null;
let resultsCount = null;
let exportBtn = null;

// Initialize app once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // LOGOUT
  // ========================================
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('ideaEngneUser');
        localStorage.removeItem('ideaEngneUserData');
        localStorage.removeItem('ideaEngneRememberMe');
        window.location.href = 'index.html';
      }
    });
  }

  // ========================================
  // PLATFORM SELECTION
  // ========================================
  platformTags = document.querySelectorAll('.platform-tag');
  selectedPlatforms = new Set();

  platformTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const platform = tag.dataset.platform;
      
      if (selectedPlatforms.has(platform)) {
        selectedPlatforms.delete(platform);
        tag.classList.remove('selected');
      } else {
        if (selectedPlatforms.size < 3) {
          selectedPlatforms.add(platform);
          tag.classList.add('selected');
        } else {
          showToast('⚠️ Maximum 3 platforms');
        }
      }
    });
  });

  // ========================================
  // FORM SUBMISSION & AI GENERATION
  // ========================================
  form = document.getElementById('generatorForm');
  generateBtn = document.getElementById('generateBtn');
  emptyState = document.getElementById('emptyState');
  loadingState = document.getElementById('loadingState');
  errorState = document.getElementById('errorState');
  ideasList = document.getElementById('ideasList');
  resultsCount = document.getElementById('resultsCount');
  exportBtn = document.getElementById('exportBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if user has free ideas remaining (free tier only)
    if (userData.subscription === 'free' && userData.freeIdeasRemaining <= 0) {
      showUpgradeModal();
      return;
    }
    
    const niche = document.getElementById('niche').value.trim();
    const audience = document.getElementById('audience').value.trim();
    const tone = document.getElementById('tone').value.trim();
    
    if (!niche) {
      showToast('⚠️ Please describe your niche');
      return;
    }

    if (selectedPlatforms.size === 0) {
      showToast('⚠️ Please select at least 1 platform');
      return;
    }

    await generateIdeas({ niche, audience, tone, platforms: Array.from(selectedPlatforms) });
  });

  // ========================================
  // EXPORT BUTTON
  // ========================================
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const ideas = JSON.parse(localStorage.getItem('ideaEngneLastIdeas') || '[]');
      if (ideas.length === 0) return;

      const niche = userData.preferences.niche || 'Unknown niche';
      const date = new Date().toLocaleDateString();
      
      let text = `IDEA-ENGNE CONTENT IDEAS\n`;
      text += `Generated: ${date}\n`;
      text += `Niche: ${niche}\n`;
      text += `Generated by: ${userData.name || userData.email}\n`;
      text += `\n${'='.repeat(60)}\n\n`;
      
      ideas.forEach((idea, i) => {
        const ideaText = idea.idea || idea.content || idea.text;
        const platform = idea.platform || 'General';
        const format = idea.format || 'Post';
        const hook = idea.hook || '';
        const cta = idea.cta || '';
        
        text += `${i + 1}. ${ideaText}\n`;
        if (hook) text += `   Hook: "${hook}"\n`;
        if (cta) text += `   CTA: "${cta}"\n`;
        text += `   Platform: ${platform.toUpperCase()} | Format: ${format}\n\n`;
      });
      
      text += `\n${'='.repeat(60)}\n`;
      text += `Downloaded from Idea-Engne\n`;

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ideas-${niche.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('📥 Exported successfully!');
    });
  }

  // ========================================
  // RETRY BUTTON
  // ========================================
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      errorState.classList.remove('active');
      emptyState.style.display = 'flex';
    });
  }
});

// AI GENERATION FUNCTION - ENHANCED
async function generateIdeas({ niche, audience, tone, platforms }) {
  const GROQ_API_KEY = window.ENV?.GROQ_API_KEY;
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR-GROQ-API-KEY-HERE') {
    errorState.classList.add('active');
    document.getElementById('errorMessage').innerHTML = 
      '⚠️ <strong>Groq not configured!</strong><br><br>' +
      'Please add your API key in config.js';
    return;
  }

  // Determine how many ideas to generate based on subscription
  const ideasCount = userData.subscription === 'free' ? 15 : 30;

  // Show loading state
  emptyState.style.display = 'none';
  errorState.classList.remove('active');
  loadingState.classList.add('active');
  ideasList.classList.remove('active');
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  try {
    // Build enhanced prompt for longer, more detailed ideas
    const platformsText = platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    const audienceText = audience ? `Target audience: ${audience}. ` : '';
    const toneText = tone ? `Brand tone: ${tone}. ` : '';

    const prompt = `You are an expert social media content strategist. Generate exactly ${ideasCount} unique, specific, and actionable content ideas.

Niche: ${niche}
${audienceText}${toneText}Platforms: ${platformsText}

IMPORTANT REQUIREMENTS:
- Each idea should be 2-3 sentences with a clear hook, execution details, and expected outcome
- Ideas must be SPECIFIC to the niche (not generic advice)
- Include variety: educational, entertaining, behind-the-scenes, storytelling, trending topics, controversial takes, tutorials
- Each idea should be actionable - creator should know exactly what to make
- Ideas should have viral potential - hooks that make people stop scrolling

Return ONLY a valid JSON array with exactly ${ideasCount} objects. Each object MUST have this structure:
{
  "idea": "The detailed post idea with hook, execution, and outcome (2-3 sentences, ~40-60 words)",
  "platform": "instagram" (or linkedin, tiktok, twitter, youtube - lowercase),
  "format": "Reel" (or Carousel, Story, Thread, Video, Post, Live),
  "hook": "The opening line or attention grabber (10-15 words)",
  "cta": "Call-to-action for the post (5-10 words)"
}

Return ONLY the JSON array, no other text, no markdown, no explanation.`;

    console.log(`🚀 Calling Groq API for ${ideasCount} ideas...`);

    // Add timeout controller (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a world-class social media content strategist. Generate detailed, specific, actionable content ideas. Always respond with valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Increased for more creativity
        max_tokens: 4000, // Increased for longer content
        top_p: 0.95,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }
      
      throw new Error(errorData.error?.message || `API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ GROQ RESPONSE RECEIVED');
    
    // Validate API response structure
    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure: missing content');
    }
    
    // Extract the AI's message
    const aiMessage = data.choices[0].message.content;
    console.log('AI message length:', aiMessage.length);
    
    // Clean up the response
    let ideasText = aiMessage.trim();
    
    // Remove markdown code blocks if present
    ideasText = ideasText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON
    let ideas;
    try {
      ideas = JSON.parse(ideasText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // Try to extract JSON array from text
      const jsonMatch = ideasText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        console.log('Found JSON in text, parsing...');
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response as JSON. Try again or rephrase your niche.');
      }
    }

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('AI did not return a valid array of ideas. Please try again.');
    }

    // Validate and enhance ideas
    ideas = ideas.slice(0, ideasCount).map((idea, i) => ({
      idea: idea.idea || idea.content || idea.text || `Content idea ${i + 1}`,
      platform: (idea.platform || platforms[i % platforms.length]).toLowerCase(),
      format: idea.format || 'Post',
      hook: idea.hook || '',
      cta: idea.cta || ''
    }));

    console.log(`✅ Successfully generated ${ideas.length} ideas`);

    // Update user data with correct counts
    userData.totalIdeasGenerated = (userData.totalIdeasGenerated || 0) + ideas.length;  // Increment by actual count
    if (userData.subscription === 'free') {
      userData.freeIdeasRemaining = Math.max(0, (userData.freeIdeasRemaining || 0) - 1);  // One generation = one free idea used
    }
    
    // Save preferences (ensure preferences object exists)
    userData.preferences = userData.preferences || {};
    userData.preferences.niche = niche;
    userData.preferences.platforms = platforms;
    if (tone) userData.preferences.tone = tone;
    if (audience) userData.preferences.audience = audience;
    
    // Update localStorage
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    updateQuotaDisplay();

    // Display ideas
    displayIdeas(ideas);
    
    // Save to localStorage for session persistence
    localStorage.setItem('ideaEngneLastIdeas', JSON.stringify(ideas));

    showToast(`✨ ${ideas.length} ideas generated successfully!`);

    // Show upgrade prompt if user is on last free idea
    if (userData.subscription === 'free' && userData.freeIdeasRemaining === 0) {
      setTimeout(() => {
        showUpgradeModal();
      }, 2000);
    }

  } catch (error) {
    console.error('❌ FULL ERROR DETAILS:');
    console.error('Error message:', error.message);
    
    loadingState.classList.remove('active');
    errorState.classList.add('active');
    
    let errorMessage = '';
    
    if (error.name === 'AbortError') {
      errorMessage = `<strong>⏰ Request Timeout</strong><br><br>
        The request took too long. This might be due to:<br><br>
        • Slow internet connection<br>
        • High API load<br>
        • Complex generation request<br><br>
        Please try again with a simpler niche or check your connection.`;
    } else if (error.message.includes('401')) {
      errorMessage = `<strong>❌ Invalid API Key</strong><br><br>
        Your API key is not working.<br><br>
        Please update your API key in config.js`;
    } else if (error.message.includes('429')) {
      errorMessage = `<strong>⏰ Rate Limit Exceeded</strong><br><br>
        You've hit the API rate limit.<br><br>
        Please wait a few minutes and try again.`;
    } else {
      errorMessage = `<strong>❌ Generation Failed</strong><br><br>
        ${error.message}<br><br>
        <strong>Try these fixes:</strong><br>
        • Simplify your niche description<br>
        • Check your internet connection<br>
        • Try again in a few seconds<br>
        • Make sure your API key is valid`;
    }
    
    document.getElementById('errorMessage').innerHTML = errorMessage;
    
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = `<i class="fas fa-magic"></i> Generate ${userData.subscription === 'free' ? '15' : '30'} Ideas`;
  }
}

// DISPLAY IDEAS - ENHANCED
function displayIdeas(ideas) {
  loadingState.classList.remove('active');
  ideasList.classList.add('active');
  ideasList.innerHTML = '';
  exportBtn.style.display = 'flex';
  resultsCount.textContent = `${ideas.length} ideas`;

  ideas.forEach((idea, index) => {
    const card = document.createElement('div');
    card.className = 'idea-card';
    
    const platformClass = (idea.platform || 'general').toLowerCase();
    const ideaText = idea.idea || idea.content || idea.text || 'No idea text';
    const format = idea.format || 'Post';
    const platform = idea.platform || 'General';
    const hook = idea.hook || '';
    const cta = idea.cta || '';
    
    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-number">${index + 1}</div>
        <div class="idea-content">
          ${hook ? `<p class="idea-hook"><i class="fas fa-quote-left"></i> ${escapeHtml(hook)}</p>` : ''}
          <p class="idea-text">${escapeHtml(ideaText)}</p>
          ${cta ? `<p class="idea-cta"><strong>CTA:</strong> ${escapeHtml(cta)}</p>` : ''}
          <div class="idea-meta">
            <span class="meta-tag">
              <i class="fas fa-layer-group"></i>
              ${format}
            </span>
            <span class="platform-badge ${platformClass}">
              ${platform.charAt(0).toUpperCase() + platform.slice(1)}
            </span>
          </div>
        </div>
      </div>
      <div class="idea-actions">
        <button class="btn-icon btn-save" data-index="${index}" title="Save idea">
          <i class="fas fa-bookmark"></i>
        </button>
        <button class="btn-icon btn-copy" data-text="${escapeHtml(ideaText)}" title="Copy idea">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    `;
    
    ideasList.appendChild(card);
  });

  // Add save handlers
  document.querySelectorAll('.btn-save').forEach(btn => {
    const index = parseInt(btn.dataset.index);
    const idea = ideas[index];
    
    // Check if already saved
    const isSaved = userData.savedIdeas?.some(saved => saved.idea === idea.idea);
    if (isSaved) {
      btn.classList.add('saved');
      btn.querySelector('i').classList.remove('fa-bookmark');
      btn.querySelector('i').classList.add('fa-bookmark', 'fas');
    }
    
    btn.addEventListener('click', () => {
      if (!userData.savedIdeas) userData.savedIdeas = [];
      
      const savedIndex = userData.savedIdeas.findIndex(saved => saved.idea === idea.idea);
      
      if (savedIndex === -1) {
        // Save idea
        userData.savedIdeas.push(idea);
        btn.classList.add('saved');
        btn.querySelector('i').classList.add('fas');
        showToast('💾 Idea saved!');
      } else {
        // Unsave idea
        userData.savedIdeas.splice(savedIndex, 1);
        btn.classList.remove('saved');
        btn.querySelector('i').classList.remove('fas');
        btn.querySelector('i').classList.add('far');
        showToast('🗑️ Idea removed');
      }
      
      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    });
  });

  // Add copy handlers
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      navigator.clipboard.writeText(text).then(() => {
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-check';
        btn.classList.add('copied');
        showToast('📋 Copied to clipboard!');
        
        setTimeout(() => {
          icon.className = 'fas fa-copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}


// UPGRADE MODAL
function showUpgradeModal() {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal';
  modal.innerHTML = `
    <div class="upgrade-overlay"></div>
    <div class="upgrade-content">
      <button class="upgrade-close"><i class="fas fa-times"></i></button>
      <div class="upgrade-icon">
        <i class="fas fa-crown"></i>
      </div>
      <h3>Upgrade to Creator Plan</h3>
      <p>You've used all your free ideas! Upgrade now to unlock unlimited idea generation.</p>
      
      <div class="upgrade-benefits">
        <div class="upgrade-benefit">
          <i class="fas fa-infinity"></i>
          <span>Unlimited idea generation</span>
        </div>
        <div class="upgrade-benefit">
          <i class="fas fa-bolt"></i>
          <span>30 ideas per generation</span>
        </div>
        <div class="upgrade-benefit">
          <i class="fas fa-save"></i>
          <span>Save unlimited ideas</span>
        </div>
        <div class="upgrade-benefit">
          <i class="fas fa-headset"></i>
          <span>Priority support</span>
        </div>
      </div>
      
      <div class="upgrade-pricing">
        <div class="price-tag">
          <span class="price">$9</span>
          <span class="period">/month</span>
        </div>
        <p class="price-note">Cancel anytime. No hidden fees.</p>
      </div>
      
      <button class="btn-upgrade" onclick="alert('Payment integration coming soon! For now, this is a demo.')">
        <i class="fas fa-rocket"></i>
        Upgrade Now
      </button>
      
      <a href="#" class="upgrade-later">Maybe later</a>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 10);
  
  modal.querySelector('.upgrade-close').addEventListener('click', () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-overlay').addEventListener('click', () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-later').addEventListener('click', (e) => {
    e.preventDefault();
    closeUpgradeModal(modal);
  });
}

function closeUpgradeModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => modal.remove(), 300);
}

// RETRY BUTTON
document.getElementById('retryBtn').addEventListener('click', () => {
  errorState.classList.remove('active');
  emptyState.style.display = 'flex';
});

// TOAST NOTIFICATION
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// LOAD PREVIOUS IDEAS (IF ANY)
document.addEventListener('DOMContentLoaded', () => {
  const lastIdeas = localStorage.getItem('ideaEngneLastIdeas');
  if (lastIdeas && userData.preferences.niche) {
    try {
      const ideas = JSON.parse(lastIdeas);
      document.getElementById('niche').value = userData.preferences.niche;
      if (userData.preferences.audience) {
        document.getElementById('audience').value = userData.preferences.audience;
      }
      if (userData.preferences.tone) {
        document.getElementById('tone').value = userData.preferences.tone;
      }
      
      // Pre-select platforms
      if (userData.preferences.platforms) {
        userData.preferences.platforms.forEach(platform => {
          selectedPlatforms.add(platform);
          const tag = document.querySelector(`[data-platform="${platform}"]`);
          if (tag) tag.classList.add('selected');
        });
      }
      
      displayIdeas(ideas);
      emptyState.style.display = 'none';
    } catch (e) {
      console.error('Could not load previous ideas:', e);
    }
  }
});

// CONSOLE BRANDING

console.log('%c⚡ Idea-Engne Dashboard', 'font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cPowered by Groq | Built by TonyDev', 'font-size:14px;color:#22D3EE;font-weight:600;');
console.log(`%c👤 User: ${userData.name || currentUser}`, 'font-size:12px;color:#4a4762;');
console.log(`%c📊 Plan: ${userData.subscription} | Ideas remaining: ${userData.freeIdeasRemaining}`, 'font-size:12px;color:#4a4762;');