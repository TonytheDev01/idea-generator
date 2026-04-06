'use strict';

// GROQ API CONFIGURATION
const AI_MODEL = 'llama-3.3-70b-versatile';

// API Key loaded from config.js into window.ENV

// USER DATA & AUTH CHECK
let currentUser = null;
let userData = null;

function initializeUser() {
  const userEmail = localStorage.getItem('ideaEngneUser');
  const storedUserData = localStorage.getItem('ideaEngneUserData');

  if (!userEmail || !storedUserData) {
    window.location.href = 'signup.html';
    return false;
  }

  let parsedData;
  try {
    parsedData = JSON.parse(storedUserData);
  } catch (error) {
    console.error('Corrupted user data:', error);
    localStorage.removeItem('ideaEngneUserData');
    window.location.href = 'signup.html';
    return false;
  }

  userData = {
    subscription: 'free',
    freeIdeasRemaining: 15,
    totalIdeasGenerated: 0,
    preferences: {},
    ...parsedData
  };
  userData.preferences = userData.preferences || {};

  // Update header display
  const userEmailEl = document.getElementById('userEmail');
  const userAvatarEl = document.getElementById('userAvatar');
  const dropdownNameEl = document.getElementById('dropdownName');
  const dropdownEmailEl = document.getElementById('dropdownEmail');
  const dropdownAvatarEl = document.getElementById('dropdownAvatar');
  const dropdownPlanEl = document.getElementById('dropdownPlan');

  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : userEmail.charAt(0).toUpperCase() + userEmail.split('@')[0].slice(-1).toUpperCase();

  if (userEmailEl) userEmailEl.textContent = userData.name || userEmail;

  if (userAvatarEl) {
    if (userData.avatar_url) {
      userAvatarEl.innerHTML = `<img src="${userData.avatar_url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      userAvatarEl.textContent = initials;
    }
  }

  if (dropdownNameEl)  dropdownNameEl.textContent  = userData.name  || userEmail.split('@')[0];
  if (dropdownEmailEl) dropdownEmailEl.textContent = userData.email || userEmail;
  if (dropdownPlanEl)  dropdownPlanEl.textContent  =
    (userData.subscription?.charAt(0).toUpperCase() + userData.subscription?.slice(1)) + ' Plan' || 'Free Plan';

  if (dropdownAvatarEl) {
    if (userData.avatar_url) {
      dropdownAvatarEl.innerHTML = `<img src="${userData.avatar_url}" alt="Avatar">`;
    } else {
      dropdownAvatarEl.textContent = initials;
    }
  }

  updateQuotaDisplay();
  return true;
}

function updateQuotaDisplay() {
  const quotaInfo = document.querySelector('.quota-info');
  if (!quotaInfo || !userData) return;

  const remaining     = Number(userData.freeIdeasRemaining || 0);
  const subscription  = String(userData.subscription || 'free').toLowerCase();

  if (subscription === 'free') {
    quotaInfo.innerHTML = `
      <strong><i class="fas fa-gift"></i> Free Tier</strong>
      <p>You have <strong>${remaining} free ideas</strong> remaining.
      ${remaining === 0
        ? '<a href="#pricing" style="color:var(--primary);text-decoration:underline;font-weight:700;">Upgrade to Pro</a> for unlimited generations.'
        : 'Upgrade to Creator plan for unlimited generations.'
      }</p>`;
  } else {
    quotaInfo.innerHTML = `
      <strong><i class="fas fa-crown"></i> ${subscription.charAt(0).toUpperCase() + subscription.slice(1)} Plan</strong>
      <p>Unlimited ideas generation. <strong>${userData.totalIdeasGenerated || 0} ideas</strong> generated this month.</p>`;
  }
}

// Initialize user
if (typeof initializeUser === 'function' && !initializeUser()) {
  console.error('User not authenticated, redirecting to signup');
}

// DOM Elements
let platformTags      = null;
let selectedPlatforms = new Set();
let form              = null;
let generateBtn       = null;
let emptyState        = null;
let loadingState      = null;
let errorState        = null;
let ideasList         = null;
let resultsCount      = null;
let exportBtn         = null;

document.addEventListener('DOMContentLoaded', () => {

  // PROFILE DROPDOWN
  const profileTrigger = document.getElementById('profileTrigger');
  const dropdownMenu   = document.getElementById('dropdownMenu');

  if (profileTrigger && dropdownMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.classList.contains('open');
      profileTrigger.classList.toggle('open', !isOpen);
      dropdownMenu.classList.toggle('open', !isOpen);
      profileTrigger.setAttribute('aria-expanded', String(!isOpen));
    });

    document.addEventListener('click', () => {
      profileTrigger.classList.remove('open');
      dropdownMenu.classList.remove('open');
      profileTrigger.setAttribute('aria-expanded', 'false');
    });

    dropdownMenu.addEventListener('click', e => e.stopPropagation());
  }

  // LOGOUT
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        if (typeof supabaseClient !== 'undefined') {
          supabaseClient.auth.signOut().then(() => {
            localStorage.removeItem('ideaEngneUser');
            localStorage.removeItem('ideaEngneUserData');
            localStorage.removeItem('ideaEngneRememberMe');
            window.location.href = 'index.html';
          });
        } else {
          localStorage.removeItem('ideaEngneUser');
          localStorage.removeItem('ideaEngneUserData');
          localStorage.removeItem('ideaEngneRememberMe');
          window.location.href = 'index.html';
        }
      }
    });
  }

  // SETTINGS MODAL
  const settingsModal   = document.getElementById('settingsModal');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsClose   = document.getElementById('settingsClose');
  const settingsTabs    = document.querySelectorAll('.settings-tab');
  const settingsPanels  = document.querySelectorAll('.settings-panel');

  function openSettings() {
    if (!settingsModal) return;
    settingsModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    populateSettings();
  }

  function closeSettings() {
    if (!settingsModal) return;
    settingsModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
  document.getElementById('profileBtn')?.addEventListener('click', openSettings);
  settingsClose?.addEventListener('click', closeSettings);
  settingsOverlay?.addEventListener('click', closeSettings);

  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      settingsTabs.forEach(t   => t.classList.remove('active'));
      settingsPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  function populateSettings() {
    if (!userData) return;

    document.getElementById('settingsName').value     = userData.name                      || '';
    document.getElementById('settingsEmail').value    = userData.email                     || '';
    document.getElementById('settingsNiche').value    = userData.preferences?.niche        || '';
    document.getElementById('settingsAudience').value = userData.preferences?.audience     || '';
    document.getElementById('settingsTone').value     = userData.preferences?.tone         || '';

    // Avatar preview
    const preview = document.getElementById('avatarPreview');
    if (preview) {
      if (userData.avatar_url) {
        preview.innerHTML = `<img src="${userData.avatar_url}" alt="Avatar">`;
      } else {
        const initials = userData.name
          ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
          : '?';
        preview.textContent = initials;
      }
    }

    // Account stats
    const statIdeas  = document.getElementById('statIdeas');
    const statPlan   = document.getElementById('statPlan');
    const statJoined = document.getElementById('statJoined');
    if (statIdeas)  statIdeas.textContent  = userData.totalIdeasGenerated || 0;
    if (statPlan)   statPlan.textContent   = userData.subscription        || 'Free';
    if (statJoined) statJoined.textContent = userData.createdAt
      ? new Date(userData.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : '-';

    // Default platforms
    const settingsPlatformTags = document.querySelectorAll('.settings-platforms .platform-tag');
    settingsPlatformTags.forEach(tag => {
      tag.classList.toggle('selected', userData.preferences?.platforms?.includes(tag.dataset.platform));
      tag.addEventListener('click', () => tag.classList.toggle('selected'));
    });
  }

  // SAVE PROFILE
  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const name     = document.getElementById('settingsName').value.trim();
    const niche    = document.getElementById('settingsNiche').value.trim();
    const audience = document.getElementById('settingsAudience').value.trim();
    const tone     = document.getElementById('settingsTone').value.trim();

    try {
      if (typeof updateProfile !== 'undefined' && userData.id) {
        await updateProfile(userData.id, { name, niche, tone, audience });
      }

      userData.name = name;
      userData.preferences = { ...userData.preferences, niche, audience, tone };
      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));

      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      document.getElementById('userEmail').textContent        = name || userData.email;
      document.getElementById('dropdownName').textContent     = name;
      document.getElementById('userAvatar').textContent       = initials;
      document.getElementById('dropdownAvatar').textContent   = initials;

      showToast('✅ Profile saved successfully!');
      closeSettings();
    } catch (error) {
      showToast('❌ Failed to save: ' + error.message);
    }
  });

  // SAVE PREFERENCES
  document.getElementById('savePreferencesBtn')?.addEventListener('click', async () => {
    const platforms = [...document.querySelectorAll('.settings-platforms .platform-tag.selected')]
      .map(t => t.dataset.platform);

    userData.preferences = { ...userData.preferences, platforms };
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));

    try {
      if (typeof updateProfile !== 'undefined' && userData.id) {
        await updateProfile(userData.id, { preferences: userData.preferences });
      }
    } catch (e) { /* non-critical */ }

    showToast('✅ Preferences saved!');
    closeSettings();
  });

  // SAVE PASSWORD
  document.getElementById('savePasswordBtn')?.addEventListener('click', async () => {
    const newPass     = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass.length < 8) {
      showToast('⚠️ Password must be at least 8 characters');
      return;
    }
    if (newPass !== confirmPass) {
      showToast('⚠️ Passwords do not match');
      return;
    }

    try {
      const { error } = await supabaseClient.auth.updateUser({ password: newPass });
      if (error) throw error;
      showToast('✅ Password updated successfully!');
      document.getElementById('newPassword').value     = '';
      document.getElementById('confirmPassword').value = '';
    } catch (error) {
      showToast('❌ ' + error.message);
    }
  });

  // AVATAR UPLOAD
  document.getElementById('uploadAvatarBtn')?.addEventListener('click', () => {
    document.getElementById('avatarInput').click();
  });

  document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('⚠️ Image must be under 2MB');
      return;
    }

    showToast('⏳ Uploading photo...');

    try {
      const url = await uploadAvatar(userData.id, file);
      userData.avatar_url = url;
      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));

      document.getElementById('avatarPreview').innerHTML  = `<img src="${url}" alt="Avatar">`;
      document.getElementById('userAvatar').innerHTML     = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      document.getElementById('dropdownAvatar').innerHTML = `<img src="${url}" alt="Avatar">`;

      showToast('✅ Photo updated!');
    } catch (error) {
      showToast('❌ Upload failed: ' + error.message);
    }
  });

  // DELETE ACCOUNT
  document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    if (!confirm('⚠️ This will permanently delete your account. Are you sure?')) return;
    if (!confirm('This CANNOT be undone. Delete anyway?')) return;

    try {
      await supabaseClient.auth.admin.deleteUser(userData.id);
      localStorage.clear();
      window.location.href = 'index.html';
    } catch {
      showToast('⚠️ Contact support to delete your account.');
    }
  });

  // SAVED IDEAS BUTTON
  document.getElementById('savedIdeasBtn')?.addEventListener('click', () => {
    showToast('💾 Saved Ideas vault coming soon!');
  });

  // PLATFORM SELECTION
  platformTags      = document.querySelectorAll('.platform-tags:not(.settings-platforms) .platform-tag');
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

  // FORM SUBMISSION & AI GENERATION
  form        = document.getElementById('generatorForm');
  generateBtn = document.getElementById('generateBtn');
  emptyState  = document.getElementById('emptyState');
  loadingState= document.getElementById('loadingState');
  errorState  = document.getElementById('errorState');
  ideasList   = document.getElementById('ideasList');
  resultsCount= document.getElementById('resultsCount');
  exportBtn   = document.getElementById('exportBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (userData.subscription === 'free' && userData.freeIdeasRemaining <= 0) {
      showUpgradeModal();
      return;
    }

    const niche    = document.getElementById('niche').value.trim();
    const audience = document.getElementById('audience').value.trim();
    const tone     = document.getElementById('tone').value.trim();

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

  // EXPORT BUTTON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const ideas = JSON.parse(localStorage.getItem('ideaEngneLastIdeas') || '[]');
      if (ideas.length === 0) return;

      const niche = userData.preferences.niche || 'Unknown niche';
      const date  = new Date().toLocaleDateString();

      let text = `IDEA-ENGNE CONTENT IDEAS\n`;
      text += `Generated: ${date}\n`;
      text += `Niche: ${niche}\n`;
      text += `Generated by: ${userData.name || userData.email}\n`;
      text += `\n${'='.repeat(60)}\n\n`;

      ideas.forEach((idea, i) => {
        const ideaText = idea.idea || idea.content || idea.text;
        const platform = idea.platform || 'General';
        const format   = idea.format   || 'Post';
        const hook     = idea.hook     || '';
        const cta      = idea.cta      || '';

        text += `${i + 1}. ${ideaText}\n`;
        if (hook) text += `   Hook: "${hook}"\n`;
        if (cta)  text += `   CTA: "${cta}"\n`;
        text += `   Platform: ${platform.toUpperCase()} | Format: ${format}\n\n`;
      });

      text += `\n${'='.repeat(60)}\nDownloaded from Idea-Engne\n`;

      const blob = new Blob([text], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ideas-${niche.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      showToast('📥 Exported successfully!');
    });
  }

  // RETRY BUTTON
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      errorState.classList.remove('active');
      emptyState.style.display = 'flex';
    });
  }
});

// AI GENERATION FUNCTION
async function generateIdeas({ niche, audience, tone, platforms }) {
  const GROQ_API_KEY = window.ENV?.GROQ_API_KEY;

  console.log('🔍 Checking API Key...');
  console.log('window.ENV exists?', !!window.ENV);
  console.log('API Key exists?', !!GROQ_API_KEY);

  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR-GROQ-API-KEY-HERE') {
    errorState.classList.add('active');
    document.getElementById('errorMessage').innerHTML =
      '⚠️ <strong>Groq API Key Not Configured!</strong><br><br>' +
      'window.ENV = ' + JSON.stringify(window.ENV || 'undefined') + '<br><br>' +
      '<strong>Solution:</strong><br>1. Hard refresh (Ctrl+Shift+R)<br>2. Check console (F12)';
    return;
  }

  const ideasCount = userData.subscription === 'free' ? 15 : 30;

  emptyState.style.display = 'none';
  errorState.classList.remove('active');
  loadingState.classList.add('active');
  ideasList.classList.remove('active');
  generateBtn.disabled     = true;
  generateBtn.innerHTML    = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  try {
    const platformsText = platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    const audienceText  = audience ? `Target audience: ${audience}. ` : '';
    const toneText      = tone     ? `Brand tone: ${tone}. `          : '';

    const prompt = `You are an expert social media content strategist and copywriter. Generate exactly ${ideasCount} unique, platform-native, publish-ready content pieces.

Niche: ${niche}
${audienceText}${toneText}Platforms: ${platformsText}

CRITICAL REQUIREMENTS:
- Each idea must be COMPLETE and PUBLISH-READY — the creator copies and posts immediately, zero editing needed
- Write in a natural human voice that matches the platform culture
- Content must be specific to the niche, NOT generic advice
- Include full post copy with line breaks where appropriate

Return ONLY a valid JSON array with exactly ${ideasCount} objects. Each object MUST follow this structure:
{
  "idea": "The FULL post copy exactly as it should be posted. Open with the hook line, then 3-5 lines of value-packed body content separated by \\n, close with the CTA naturally woven in. Minimum 80 words.",
  "platform": "instagram",
  "format": "Reel",
  "hook": "Opening line designed to stop the scroll (10-15 words max)",
  "cta": "Call-to-action closing line (8-12 words)"
}

Platform tone guide:
- Instagram: Visual storytelling, aspirational, conversational, emojis welcome
- TikTok: Bold, fast, trend-aware, punchy
- LinkedIn: Professional but personal, insight-driven, no fluff
- Twitter: Sharp, punchy, under 280 chars
- YouTube: Educational, searchable hook, detailed value

Return ONLY the JSON array. No markdown, no explanation, no extra text.`;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a world-class social media content strategist. Always respond with valid JSON arrays only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens:  4000,
        top_p:       0.95,
        stream:      false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try { errorData = JSON.parse(errorText); }
      catch (e) { errorData = { error: { message: errorText } }; }
      throw new Error(errorData.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();

    if (!data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response structure');
    }

    let ideasText = data.choices[0].message.content.trim();
    ideasText     = ideasText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let ideas;
    try {
      ideas = JSON.parse(ideasText);
    } catch {
      const jsonMatch = ideasText.match(/\[[\s\S]*\]/);
      if (jsonMatch) { ideas = JSON.parse(jsonMatch[0]); }
      else { throw new Error('Could not parse AI response as JSON. Try again.'); }
    }

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('AI did not return a valid array of ideas.');
    }

    ideas = ideas.slice(0, ideasCount).map((idea, i) => ({
      idea:     idea.idea     || idea.content || idea.text || `Content idea ${i + 1}`,
      platform: (idea.platform || platforms[i % platforms.length]).toLowerCase(),
      format:   idea.format   || 'Post',
      hook:     idea.hook     || '',
      cta:      idea.cta      || ''
    }));

    // Update user data
    userData.totalIdeasGenerated = (userData.totalIdeasGenerated || 0) + ideas.length;
    if (userData.subscription === 'free') {
      userData.freeIdeasRemaining = Math.max(0, (userData.freeIdeasRemaining || 0) - 1);
    }

    userData.preferences        = userData.preferences || {};
    userData.preferences.niche  = niche;
    userData.preferences.platforms = platforms;
    if (tone)     userData.preferences.tone     = tone;
    if (audience) userData.preferences.audience = audience;

    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    updateQuotaDisplay();

    // Sync ideas count to Supabase
    try {
      if (typeof incrementIdeasGenerated !== 'undefined') {
        await incrementIdeasGenerated(ideas.length);
      }
      if (typeof updateProfile !== 'undefined' && userData.id) {
        await updateProfile(userData.id, {
          total_ideas_generated: userData.totalIdeasGenerated,
          free_ideas_remaining:  userData.freeIdeasRemaining,
          niche:    niche,
          tone:     tone     || null,
          audience: audience || null
        });
      }
    } catch (syncError) {
      console.warn('Supabase sync non-critical error:', syncError);
    }

    displayIdeas(ideas);
    localStorage.setItem('ideaEngneLastIdeas', JSON.stringify(ideas));
    showToast(`✨ ${ideas.length} ideas generated successfully!`);

    if (userData.subscription === 'free' && userData.freeIdeasRemaining === 0) {
      setTimeout(() => showUpgradeModal(), 2000);
    }

  } catch (error) {
    console.error('Generation error:', error.message);
    loadingState.classList.remove('active');
    errorState.classList.add('active');

    let errorMessage = '';
    if (error.name === 'AbortError') {
      errorMessage = `<strong>⏰ Request Timeout</strong><br><br>Request took too long. Check your connection and try again.`;
    } else if (error.message.includes('401')) {
      errorMessage = `<strong>❌ Invalid API Key</strong><br><br>Your API key is not working. Please check config.js`;
    } else if (error.message.includes('429')) {
      errorMessage = `<strong>⏰ Rate Limit</strong><br><br>You've hit the API rate limit. Wait a few minutes.`;
    } else {
      errorMessage = `<strong>❌ Generation Failed</strong><br><br>${error.message}<br><br>
        <strong>Try:</strong><br>• Simplify your niche<br>• Check your connection<br>• Try again in a few seconds`;
    }

    document.getElementById('errorMessage').innerHTML = errorMessage;

  } finally {
    generateBtn.disabled  = false;
    generateBtn.innerHTML = `<i class="fas fa-magic"></i> Generate ${userData.subscription === 'free' ? '15' : '30'} Ideas`;
  }
}

// DISPLAY IDEAS
function displayIdeas(ideas) {
  loadingState.classList.remove('active');
  ideasList.classList.add('active');
  ideasList.innerHTML     = '';
  exportBtn.style.display = 'flex';
  resultsCount.textContent = `${ideas.length} ideas`;

  ideas.forEach((idea, index) => {
    const card         = document.createElement('div');
    card.className     = 'idea-card';

    const platformClass = (idea.platform || 'general').toLowerCase();
    const ideaText      = idea.idea || idea.content || idea.text || 'No idea text';
    const format        = idea.format   || 'Post';
    const platform      = idea.platform || 'General';
    const hook          = idea.hook     || '';
    const cta           = idea.cta      || '';

    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-number">${index + 1}</div>
        <div class="idea-content">
          ${hook ? `<p class="idea-hook"><i class="fas fa-quote-left"></i> ${escapeHtml(hook)}</p>` : ''}
          <p class="idea-text">${escapeHtml(ideaText)}</p>
          ${cta  ? `<p class="idea-cta"><strong>CTA:</strong> ${escapeHtml(cta)}</p>`  : ''}
          <div class="idea-meta">
            <span class="meta-tag">
              <i class="fas fa-layer-group"></i> ${format}
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
      </div>`;

    ideasList.appendChild(card);
  });

  // Save handlers
  document.querySelectorAll('.btn-save').forEach(btn => {
    const index = parseInt(btn.dataset.index);
    const idea  = ideas[index];

    const isSaved = userData.savedIdeas?.some(s => s.idea === idea.idea);
    if (isSaved) { btn.classList.add('saved'); }

    btn.addEventListener('click', () => {
      if (!userData.savedIdeas) userData.savedIdeas = [];
      const savedIndex = userData.savedIdeas.findIndex(s => s.idea === idea.idea);

      if (savedIndex === -1) {
        userData.savedIdeas.push(idea);
        btn.classList.add('saved');
        showToast('💾 Idea saved!');
      } else {
        userData.savedIdeas.splice(savedIndex, 1);
        btn.classList.remove('saved');
        showToast('🗑️ Idea removed');
      }

      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    });
  });

  // Copy handlers
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.text).then(() => {
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
  const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' };
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
      <div class="upgrade-icon"><i class="fas fa-crown"></i></div>
      <h3>Upgrade to Creator Plan</h3>
      <p>You've used all your free ideas! Upgrade for unlimited generation.</p>
      <div class="upgrade-benefits">
        <div class="upgrade-benefit"><i class="fas fa-infinity"></i><span>Unlimited idea generation</span></div>
        <div class="upgrade-benefit"><i class="fas fa-bolt"></i><span>30 ideas per generation</span></div>
        <div class="upgrade-benefit"><i class="fas fa-save"></i><span>Save unlimited ideas</span></div>
        <div class="upgrade-benefit"><i class="fas fa-headset"></i><span>Priority support</span></div>
      </div>
      <div class="upgrade-pricing">
        <div class="price-tag">
          <span class="price">$9</span>
          <span class="period">/month</span>
        </div>
        <p class="price-note">Cancel anytime. No hidden fees.</p>
      </div>
      <button class="btn-upgrade" onclick="alert('Payment integration coming soon!')">
        <i class="fas fa-rocket"></i> Upgrade Now
      </button>
      <a href="#" class="upgrade-later">Maybe later</a>
    </div>`;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);

  modal.querySelector('.upgrade-close').addEventListener('click',   () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-overlay').addEventListener('click', () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-later').addEventListener('click',   (e) => { e.preventDefault(); closeUpgradeModal(modal); });
}

function closeUpgradeModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => modal.remove(), 300);
}

// TOAST NOTIFICATION
function showToast(message) {
  const toast        = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  toastMessage.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// LOAD PREVIOUS IDEAS
document.addEventListener('DOMContentLoaded', () => {
  const lastIdeas = localStorage.getItem('ideaEngneLastIdeas');
  if (lastIdeas && userData?.preferences?.niche) {
    try {
      const ideas = JSON.parse(lastIdeas);
      document.getElementById('niche').value = userData.preferences.niche;
      if (userData.preferences.audience) document.getElementById('audience').value = userData.preferences.audience;
      if (userData.preferences.tone)     document.getElementById('tone').value     = userData.preferences.tone;

      if (userData.preferences.platforms) {
        userData.preferences.platforms.forEach(platform => {
          selectedPlatforms.add(platform);
          const tag = document.querySelector(`.platform-tags:not(.settings-platforms) [data-platform="${platform}"]`);
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

console.log('%c⚡ Idea-Engne Dashboard', 'font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cPowered by Groq + Supabase | Built by TonyDev', 'font-size:14px;color:#22D3EE;font-weight:600;');