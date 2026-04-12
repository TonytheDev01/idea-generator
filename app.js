'use strict';

// IDEA-ENGNE DASHBOARD
// Built by Anthony Michael (TonyDev)

// ─── GROQ CONFIG ──────────────────────────────────────────────
const AI_MODEL = 'llama-3.3-70b-versatile';

// ─── STATE ────────────────────────────────────────────────────
let userData          = null;
let platformTags      = null;
let selectedPlatforms = new Set();
let form, generateBtn, emptyState, loadingState, errorState, ideasList, resultsCount, exportBtn;

// ─── INITIALIZE USER ──────────────────────────────────────────
function initializeUser() {
  const userEmail      = localStorage.getItem('ideaEngneUser');
  const storedUserData = localStorage.getItem('ideaEngneUserData');
  if (!userEmail || !storedUserData) { window.location.href = 'signup.html'; return false; }

  let parsedData;
  try { parsedData = JSON.parse(storedUserData); }
  catch (err) {
    console.error('Corrupted user data:', err);
    localStorage.removeItem('ideaEngneUserData');
    window.location.href = 'signup.html';
    return false;
  }

  userData = { subscription: 'free', freeIdeasRemaining: 15, totalIdeasGenerated: 0, preferences: {}, ...parsedData };
  userData.preferences = userData.preferences || {};

  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : userEmail.charAt(0).toUpperCase() + userEmail.split('@')[0].slice(-1).toUpperCase();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('userEmail',    userData.name  || userEmail);
  set('dropdownName', userData.name  || userEmail.split('@')[0]);
  set('dropdownEmail',userData.email || userEmail);
  set('dropdownPlan', ((userData.subscription?.charAt(0).toUpperCase() + userData.subscription?.slice(1)) || 'Free') + ' Plan');

  const setAvatar = (id, img) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = img ? `<img src="${img}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials;
  };
  setAvatar('userAvatar',     userData.avatar_url);
  setAvatar('dropdownAvatar', userData.avatar_url);

  updateQuotaDisplay();
  return true;
}

function updateQuotaDisplay() {
  const el  = document.querySelector('.quota-info');
  if (!el || !userData) return;
  const rem = Number(userData.freeIdeasRemaining || 0);
  const sub = String(userData.subscription || 'free').toLowerCase();
  el.innerHTML = sub === 'free'
    ? `<strong><i class="fas fa-gift"></i> Free Tier</strong>
       <p>You have <strong>${rem} free idea${rem === 1 ? '' : 's'}</strong> remaining.
       ${rem === 0 ? '<a href="index.html#pricing" style="color:var(--primary);font-weight:700;">Upgrade to Pro</a> for unlimited.' : 'Upgrade for unlimited generations.'}</p>`
    : `<strong><i class="fas fa-crown"></i> ${sub.charAt(0).toUpperCase()+sub.slice(1)} Plan</strong>
       <p>Unlimited generation · <strong>${userData.totalIdeasGenerated||0} ideas</strong> this month.</p>`;
}

// ─── DOM READY ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!initializeUser()) return;

  // ── CRITICAL FIX: modal inits run BEFORE the form null-guard so they
  //   always execute regardless of whether #generatorForm exists.
  initReviewModal();
  initSavedIdeasModal();

  // ── PROFILE DROPDOWN ────────────────────────────────────────
  const profileTrigger = document.getElementById('profileTrigger');
  const dropdownMenu   = document.getElementById('dropdownMenu');
  if (profileTrigger && dropdownMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dropdownMenu.classList.contains('open');
      profileTrigger.classList.toggle('open', !open);
      dropdownMenu.classList.toggle('open', !open);
      profileTrigger.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('click', () => {
      profileTrigger.classList.remove('open');
      dropdownMenu.classList.remove('open');
      profileTrigger.setAttribute('aria-expanded', 'false');
    });
    dropdownMenu.addEventListener('click', e => e.stopPropagation());
  }

  // ── LOGOUT ──────────────────────────────────────────────────
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (!confirm('Are you sure you want to logout?')) return;
    const clear = () => {
      ['ideaEngneUser','ideaEngneUserData','ideaEngneRememberMe'].forEach(k => localStorage.removeItem(k));
      window.location.href = 'index.html';
    };
    window.supabaseClient ? window.supabaseClient.auth.signOut().then(clear) : clear();
  });

  // ── SETTINGS ────────────────────────────────────────────────
  const settingsModal  = document.getElementById('settingsModal');
  const settingsTabs   = document.querySelectorAll('.settings-tab');
  const settingsPanels = document.querySelectorAll('.settings-panel');

  const openSettings  = () => { if (!settingsModal) return; settingsModal.classList.add('open');    document.body.style.overflow = 'hidden'; populateSettings(); };
  const closeSettings = () => { if (!settingsModal) return; settingsModal.classList.remove('open'); document.body.style.overflow = ''; };

  document.getElementById('settingsBtn')?.addEventListener('click', openSettings);
  document.getElementById('profileBtn')?.addEventListener('click', openSettings);
  document.getElementById('settingsClose')?.addEventListener('click', closeSettings);
  document.getElementById('settingsOverlay')?.addEventListener('click', closeSettings);

  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      settingsTabs.forEach(t => t.classList.remove('active'));
      settingsPanels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  function populateSettings() {
    if (!userData) return;
    ['settingsName','settingsEmail','settingsNiche','settingsAudience','settingsTone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = ({
        settingsName:     userData.name,
        settingsEmail:    userData.email,
        settingsNiche:    userData.preferences?.niche,
        settingsAudience: userData.preferences?.audience,
        settingsTone:     userData.preferences?.tone
      })[id] || '';
    });
    const preview = document.getElementById('avatarPreview');
    if (preview) preview.innerHTML = userData.avatar_url
      ? `<img src="${userData.avatar_url}" alt="Avatar">`
      : (userData.name ? userData.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : '?');

    const si = document.getElementById('statIdeas');  if (si) si.textContent = userData.totalIdeasGenerated || 0;
    const sp = document.getElementById('statPlan');   if (sp) sp.textContent = userData.subscription || 'Free';
    const sj = document.getElementById('statJoined'); if (sj) sj.textContent = userData.createdAt
      ? new Date(userData.createdAt).toLocaleDateString('en-GB', { month:'short', year:'numeric' }) : '-';

    document.querySelectorAll('.settings-platforms .platform-tag').forEach(tag => {
      tag.classList.toggle('selected', userData.preferences?.platforms?.includes(tag.dataset.platform));
      tag.addEventListener('click', () => tag.classList.toggle('selected'));
    });
  }

  document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('settingsName').value.trim();
    const niche = document.getElementById('settingsNiche').value.trim();
    const audience = document.getElementById('settingsAudience').value.trim();
    const tone = document.getElementById('settingsTone').value.trim();
    try {
      if (window.updateProfile && userData.id) await window.updateProfile(userData.id, { name, niche, tone, audience });
      userData.name = name;
      userData.preferences = { ...userData.preferences, niche, audience, tone };
      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
      const ini = name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      ['userEmail','dropdownName'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = id==='userEmail' ? name||userData.email : name; });
      ['userAvatar','dropdownAvatar'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = ini; });
      showToast('✅ Profile saved!'); closeSettings();
    } catch (err) { showToast('❌ Failed: ' + err.message); }
  });

  document.getElementById('savePreferencesBtn')?.addEventListener('click', async () => {
    const platforms = [...document.querySelectorAll('.settings-platforms .platform-tag.selected')].map(t => t.dataset.platform);
    userData.preferences = { ...userData.preferences, platforms };
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    try { if (window.updateProfile && userData.id) await window.updateProfile(userData.id, { preferences: userData.preferences }); } catch {}
    showToast('✅ Preferences saved!'); closeSettings();
  });

  document.getElementById('savePasswordBtn')?.addEventListener('click', async () => {
    const np = document.getElementById('newPassword').value;
    const cp = document.getElementById('confirmPassword').value;
    if (np.length < 8) { showToast('⚠️ At least 8 characters'); return; }
    if (np !== cp)      { showToast('⚠️ Passwords do not match'); return; }
    try {
      if (!window.supabaseClient) throw new Error('Auth not ready — refresh the page');
      const { error } = await window.supabaseClient.auth.updateUser({ password: np });
      if (error) throw error;
      showToast('✅ Password updated!');
      ['newPassword','confirmPassword'].forEach(id => { document.getElementById(id).value = ''; });
    } catch (err) { showToast('❌ ' + err.message); }
  });

  document.getElementById('uploadAvatarBtn')?.addEventListener('click', () => document.getElementById('avatarInput')?.click());
  document.getElementById('avatarInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { showToast('⚠️ Image must be under 2MB'); return; }
    showToast('⏳ Uploading...');
    try {
      const url = await window.uploadAvatar(userData.id, file);
      userData.avatar_url = url;
      localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
      document.getElementById('avatarPreview').innerHTML = `<img src="${url}" alt="Avatar">`;
      ['userAvatar','dropdownAvatar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<img src="${url}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
      });
      showToast('✅ Photo updated!');
    } catch (err) { showToast('❌ ' + err.message); }
  });

  document.getElementById('deleteAccountBtn')?.addEventListener('click', async () => {
    if (!confirm('⚠️ Permanently delete your account?')) return;
    if (!confirm('CANNOT be undone. Delete anyway?')) return;
    try { await window.supabaseClient?.auth.admin.deleteUser(userData.id); localStorage.clear(); window.location.href = 'index.html'; }
    catch { showToast('⚠️ Contact support to delete your account.'); }
  });

  document.getElementById('savedIdeasBtn')?.addEventListener('click', openSavedIdeasModal);

  // ── PLATFORMS ───────────────────────────────────────────────
  platformTags = document.querySelectorAll('.platform-tags:not(.settings-platforms) .platform-tag');
  platformTags.forEach(tag => {
    tag.addEventListener('click', () => {
      const p = tag.dataset.platform;
      if (selectedPlatforms.has(p)) { selectedPlatforms.delete(p); tag.classList.remove('selected'); }
      else if (selectedPlatforms.size < 3) { selectedPlatforms.add(p); tag.classList.add('selected'); }
      else showToast('⚠️ Maximum 3 platforms');
    });
  });

  // ── FORM REFS ────────────────────────────────────────────────
  form         = document.getElementById('generatorForm');
  generateBtn  = document.getElementById('generateBtn');
  emptyState   = document.getElementById('emptyState');
  loadingState = document.getElementById('loadingState');
  errorState   = document.getElementById('errorState');
  ideasList    = document.getElementById('ideasList');
  resultsCount = document.getElementById('resultsCount');
  exportBtn    = document.getElementById('exportBtn');

  if (!form) { console.error('❌ #generatorForm not found in app.html'); return; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (userData.subscription === 'free' && userData.freeIdeasRemaining <= 0) { showUpgradeModal(); return; }
    const niche    = document.getElementById('niche')?.value.trim()    || '';
    const audience = document.getElementById('audience')?.value.trim() || '';
    const tone     = document.getElementById('tone')?.value.trim()     || '';
    if (!niche)                       { showToast('⚠️ Please describe your niche'); return; }
    if (selectedPlatforms.size === 0) { showToast('⚠️ Select at least 1 platform'); return; }
    await generateIdeas({ niche, audience, tone, platforms: Array.from(selectedPlatforms) });
  });

  exportBtn?.addEventListener('click', () => {
    const ideas = JSON.parse(localStorage.getItem('ideaEngneLastIdeas') || '[]');
    if (!ideas.length) return;
    const niche = userData.preferences?.niche || 'Unknown';
    let text = `IDEA-ENGNE CONTENT IDEAS\nGenerated: ${new Date().toLocaleDateString()}\nNiche: ${niche}\nBy: ${userData.name||userData.email}\n\n${'='.repeat(60)}\n\n`;
    ideas.forEach((idea,i) => {
      text += `${i+1}. ${idea.idea||idea.content||idea.text}\n`;
      if (idea.hook) text += `   Hook: "${idea.hook}"\n`;
      if (idea.cta)  text += `   CTA:  "${idea.cta}"\n`;
      text += `   Platform: ${(idea.platform||'General').toUpperCase()} | Format: ${idea.format||'Post'}\n\n`;
    });
    text += `${'='.repeat(60)}\nDownloaded from Idea-Engne`;
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([text], {type:'text/plain'})),
      download: `ideas-${niche.replace(/\s+/g,'-').toLowerCase()}-${Date.now()}.txt`
    });
    a.click(); URL.revokeObjectURL(a.href); showToast('📥 Exported!');
  });

  document.getElementById('retryBtn')?.addEventListener('click', () => {
    errorState?.classList.remove('active');
    if (emptyState) emptyState.style.display = 'flex';
  });

  // ── RESTORE PREVIOUS IDEAS ──────────────────────────────────
  const lastIdeas = localStorage.getItem('ideaEngneLastIdeas');
  if (lastIdeas && userData?.preferences?.niche) {
    try {
      const ideas = JSON.parse(lastIdeas);
      const ni = document.getElementById('niche');     if (ni) ni.value = userData.preferences.niche;
      const au = document.getElementById('audience');  if (au) au.value = userData.preferences.audience || '';
      const to = document.getElementById('tone');      if (to) to.value = userData.preferences.tone     || '';
      userData.preferences.platforms?.forEach(p => {
        selectedPlatforms.add(p);
        document.querySelector(`.platform-tags:not(.settings-platforms) [data-platform="${p}"]`)?.classList.add('selected');
      });
      displayIdeas(ideas);
      if (emptyState) emptyState.style.display = 'none';
    } catch (e) { console.error('Could not restore previous ideas:', e); }
  }
});

// ─── GENERATE IDEAS ───────────────────────────────────────────
async function generateIdeas({ niche, audience, tone, platforms }) {
  const GROQ_API_KEY = window.ENV?.GROQ_API_KEY;

  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR-GROQ-API-KEY-HERE') {
    // This fires when GitHub Pages is still serving the placeholder config.js.
    // Fix: GitHub repo → Settings → Pages → Source → "GitHub Actions" (not branch).
    if (errorState) errorState.classList.add('active');
    const msg = document.getElementById('errorMessage');
    if (msg) msg.innerHTML = `
      ⚠️ <strong>Service temporarily unavailable</strong><br><br>
      Our AI engine is being configured. Please try again in a few minutes.<br><br>
      If this persists, try a hard-refresh: <kbd>Ctrl+Shift+R</kbd>`;
    if (loadingState) loadingState.classList.remove('active');
    if (generateBtn)  { generateBtn.disabled = false; generateBtn.innerHTML = `<i class="fas fa-magic"></i> Generate Ideas`; }
    console.warn('[Idea-Engne] API key not injected. Check GitHub Pages source is set to "GitHub Actions" not branch.');
    return;
  }

  const ideasCount = userData.subscription === 'free' ? 15 : 30;
  if (emptyState)   emptyState.style.display = 'none';
  if (errorState)   errorState.classList.remove('active');
  if (loadingState) loadingState.classList.add('active');
  if (ideasList)    ideasList.classList.remove('active');
  if (generateBtn)  { generateBtn.disabled = true; generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }

  try {
    const prompt = `You are an expert social media content strategist. Generate exactly ${ideasCount} unique, platform-native, publish-ready content pieces.

Niche: ${niche}
${audience ? `Target audience: ${audience}. ` : ''}${tone ? `Brand tone: ${tone}. ` : ''}Platforms: ${platforms.map(p=>p.charAt(0).toUpperCase()+p.slice(1)).join(', ')}

REQUIREMENTS:
- Each idea COMPLETE and PUBLISH-READY — creator copies and posts immediately
- Natural human voice matching platform culture
- Specific to niche, NOT generic advice
- Minimum 80 words per idea

Return ONLY a valid JSON array with exactly ${ideasCount} objects:
{
  "idea": "Full post copy — minimum 80 words",
  "platform": "instagram",
  "format": "Reel",
  "hook": "Opening line to stop the scroll (10-15 words)",
  "cta": "Call-to-action closing line (8-12 words)"
}
Return ONLY the JSON array. No markdown. No explanation.`;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: 'You are a world-class social media content strategist. Respond with valid JSON arrays ONLY.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8, max_tokens: 4000, top_p: 0.95, stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      const txt = await response.text();
      let errData; try { errData = JSON.parse(txt); } catch { errData = { error: { message: txt } }; }
      throw new Error(errData.error?.message || `API error ${response.status}`);
    }

    const data = await response.json();
    if (!data?.choices?.[0]?.message?.content) throw new Error('Invalid API response structure');

    let raw = data.choices[0].message.content.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    let ideas;
    try { ideas = JSON.parse(raw); }
    catch {
      const m = raw.match(/\[[\s\S]*\]/);
      if (m) ideas = JSON.parse(m[0]); else throw new Error('Could not parse AI response. Try again.');
    }
    if (!Array.isArray(ideas) || !ideas.length) throw new Error('AI returned empty or invalid data.');

    ideas = ideas.slice(0, ideasCount).map((idea, i) => ({
      idea:     idea.idea     || idea.content || idea.text || `Idea ${i+1}`,
      platform: (idea.platform || platforms[i % platforms.length]).toLowerCase(),
      format:   idea.format   || 'Post',
      hook:     idea.hook     || '',
      cta:      idea.cta      || ''
    }));

    userData.totalIdeasGenerated = (userData.totalIdeasGenerated || 0) + ideas.length;
    if (userData.subscription === 'free') userData.freeIdeasRemaining = Math.max(0, (userData.freeIdeasRemaining||0) - 1);
    userData.preferences = { ...userData.preferences, niche, platforms };
    if (tone)     userData.preferences.tone     = tone;
    if (audience) userData.preferences.audience = audience;
    localStorage.setItem('ideaEngneUserData', JSON.stringify(userData));
    updateQuotaDisplay();

    try {
      if (window.incrementIdeasGenerated) await window.incrementIdeasGenerated(ideas.length);
      if (window.updateProfile && userData.id) await window.updateProfile(userData.id, {
        total_ideas_generated: userData.totalIdeasGenerated,
        free_ideas_remaining:  userData.freeIdeasRemaining,
        niche, tone: tone||null, audience: audience||null
      });
    } catch (syncErr) { console.warn('Supabase sync (non-critical):', syncErr.message); }

    displayIdeas(ideas);
    localStorage.setItem('ideaEngneLastIdeas', JSON.stringify(ideas));
    showToast(`✨ ${ideas.length} ideas generated!`);
    maybeShowReviewPrompt();
    if (userData.subscription === 'free' && userData.freeIdeasRemaining === 0) setTimeout(showUpgradeModal, 2000);

  } catch (error) {
    console.error('Generation error:', error.message);
    if (errorState) errorState.classList.add('active');
    const msg = document.getElementById('errorMessage');
    if (msg) {
      if      (error.name === 'AbortError')          msg.innerHTML = `<strong>⏰ Timeout</strong><br>Request too slow. Check your connection.`;
      else if (error.message.includes('401'))        msg.innerHTML = `<strong>❌ Invalid Key</strong><br>Groq API key rejected. Check config.js.`;
      else if (error.message.includes('429'))        msg.innerHTML = `<strong>⏰ Rate Limited</strong><br>Too many requests. Wait a minute.`;
      else msg.innerHTML = `<strong>❌ Generation Failed</strong><br><br>${error.message}<br><br>Try simplifying your niche or checking your connection.`;
    }
  } finally {
    if (loadingState) loadingState.classList.remove('active');
    if (generateBtn)  { generateBtn.disabled = false; generateBtn.innerHTML = `<i class="fas fa-magic"></i> Generate ${userData?.subscription==='free'?'15':'30'} Ideas`; }
  }
}

// ─── DISPLAY IDEAS ────────────────────────────────────────────
function displayIdeas(ideas) {
  if (!ideasList) return;
  if (loadingState) loadingState.classList.remove('active');
  ideasList.classList.add('active');
  ideasList.innerHTML = '';
  if (exportBtn)    exportBtn.style.display  = 'flex';
  if (resultsCount) resultsCount.textContent = `${ideas.length} ideas`;

  ideas.forEach((idea, index) => {
    const card     = document.createElement('div');
    card.className = 'idea-card';
    const ideaText = idea.idea || idea.content || idea.text || 'No idea text';
    const pLabel   = (idea.platform||'General').charAt(0).toUpperCase() + (idea.platform||'General').slice(1);

    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-number">${index + 1}</div>
        <div class="idea-content">
          ${idea.hook ? `<p class="idea-hook"><i class="fas fa-quote-left"></i> ${escapeHtml(idea.hook)}</p>` : ''}
          <p class="idea-text">${escapeHtml(ideaText)}</p>
          ${idea.cta ? `<p class="idea-cta"><strong>CTA:</strong> ${escapeHtml(idea.cta)}</p>` : ''}
          <div class="idea-meta">
            <span class="meta-tag"><i class="fas fa-layer-group"></i> ${idea.format||'Post'}</span>
            <span class="platform-badge ${(idea.platform||'general').toLowerCase()}">${pLabel}</span>
          </div>
        </div>
      </div>
      <div class="idea-actions">
        <button class="btn-icon btn-save" data-index="${index}" title="Save idea"><i class="fas fa-bookmark"></i></button>
        <button class="btn-icon btn-copy" data-text="${escapeHtml(ideaText)}" title="Copy idea"><i class="fas fa-copy"></i></button>
      </div>`;
    ideasList.appendChild(card);
  });

  ideasList.querySelectorAll('.btn-save').forEach(btn => {
    const idea = ideas[parseInt(btn.dataset.index)];
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('saved')) { showToast('Already saved!'); return; }
      btn.disabled = true;
      try {
        if (window.saveIdea && userData.id) await window.saveIdea(userData.id, idea);
        else {
          if (!userData.savedIdeas) userData.savedIdeas = [];
          if (!userData.savedIdeas.some(s => s.idea === idea.idea)) { userData.savedIdeas.push(idea); localStorage.setItem('ideaEngneUserData', JSON.stringify(userData)); }
        }
        btn.classList.add('saved'); btn.querySelector('i').className = 'fas fa-check';
        showToast('💾 Saved to your vault!');
      } catch (err) { btn.disabled = false; showToast('❌ Save failed.'); console.error(err); }
    });
  });

  ideasList.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.text).then(() => {
        const i = btn.querySelector('i');
        i.className = 'fas fa-check'; btn.classList.add('copied');
        showToast('📋 Copied!');
        setTimeout(() => { i.className = 'fas fa-copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
  });
}

// ─── SAVED IDEAS MODAL ────────────────────────────────────────
function initSavedIdeasModal() {
  const modal = document.getElementById('savedIdeasModal');
  if (!modal) return;
  const close = () => { modal.classList.add('hidden'); document.body.style.overflow = ''; };
  document.getElementById('closeSavedModal')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.getElementById('clearAllSavedBtn')?.addEventListener('click', async () => {
    const list  = document.getElementById('savedIdeasList');
    const cards = list?.querySelectorAll('.saved-idea-card');
    if (!cards?.length) return;
    for (const card of cards) { try { if (window.deleteSavedIdea) await window.deleteSavedIdea(card.dataset.id); } catch {} card.remove(); }
    if (list) list.innerHTML = '<div class="saved-empty-state"><i class="fas fa-bookmark"></i><p>All ideas cleared.</p></div>';
    showToast('🗑️ All ideas cleared.');
  });
}

async function openSavedIdeasModal() {
  const modal = document.getElementById('savedIdeasModal');
  const list  = document.getElementById('savedIdeasList');
  if (!modal) { showToast('💾 Saved Ideas vault coming soon!'); return; }
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (list) list.innerHTML = '<p class="saved-loading"><i class="fas fa-spinner fa-spin"></i> Loading your vault...</p>';
  try {
    if (!window.getSavedIdeas || !userData?.id) throw new Error('Not available');
    const ideas = await window.getSavedIdeas(userData.id);
    if (!ideas.length) {
      if (list) list.innerHTML = `<div class="saved-empty-state"><i class="fas fa-bookmark"></i><p>Your vault is empty</p><span>Generate ideas and hit <i class="fas fa-bookmark"></i> to save them here.</span></div>`;
      return;
    }
    if (list) list.innerHTML = ideas.map(idea => `
      <div class="saved-idea-card" data-id="${idea.id}">
        <div class="saved-idea-badges">
          <span class="saved-badge saved-badge--platform">${escapeHtml(idea.platform||'General')}</span>
          <span class="saved-badge saved-badge--format">${escapeHtml(idea.format||'Post')}</span>
        </div>
        ${idea.hook ? `<p class="saved-idea-hook">"${escapeHtml(idea.hook)}"</p>` : ''}
        <p class="saved-idea-text">${escapeHtml(idea.idea)}</p>
        ${idea.cta  ? `<p class="saved-idea-cta"><strong>CTA:</strong> ${escapeHtml(idea.cta)}</p>` : ''}
        <div class="saved-idea-actions">
          <button class="saved-copy-btn"   data-text="${escapeHtml(idea.idea)}"><i class="fas fa-copy"></i> Copy</button>
          <button class="saved-delete-btn" data-id="${idea.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>`).join('');

    list.querySelectorAll('.saved-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => { navigator.clipboard.writeText(btn.dataset.text); showToast('📋 Copied!'); });
    });
    list.querySelectorAll('.saved-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          if (window.deleteSavedIdea) await window.deleteSavedIdea(btn.dataset.id);
          btn.closest('.saved-idea-card').remove();
          showToast('🗑️ Deleted.');
          if (!list.querySelectorAll('.saved-idea-card').length) list.innerHTML = `<div class="saved-empty-state"><i class="fas fa-bookmark"></i><p>Vault is empty.</p></div>`;
        } catch { showToast('❌ Delete failed.'); }
      });
    });
  } catch (err) {
    if (list) list.innerHTML = '<p class="saved-loading" style="color:#dc2626;">Error loading vault. Try again.</p>';
    console.error(err);
  }
}

// ─── REVIEW MODAL ─────────────────────────────────────────────
let selectedRating = 0;

function initReviewModal() {
  const modal = document.getElementById('reviewModal');
  if (!modal) return;

  const stars       = modal.querySelectorAll('#starRating span');
  const starLabelEl = document.getElementById('starLabel');
  const reviewText  = document.getElementById('reviewText');
  const charCount   = document.getElementById('charCount');
  const starLabels  = ['', 'Needs improvement', 'Could be better', 'Pretty good', 'Really good!', 'Love it! 🔥'];

  stars.forEach(star => {
    star.addEventListener('mouseover', () => stars.forEach(s => s.textContent = +s.dataset.value <= +star.dataset.value ? '★' : '☆'));
    star.addEventListener('mouseout',  () => stars.forEach(s => s.textContent = +s.dataset.value <= selectedRating ? '★' : '☆'));
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach(s => { s.textContent = +s.dataset.value <= selectedRating ? '★' : '☆'; s.classList.toggle('active', +s.dataset.value <= selectedRating); });
      if (starLabelEl) starLabelEl.textContent = starLabels[selectedRating] || '';
    });
  });

  reviewText?.addEventListener('input', () => { if (charCount) charCount.textContent = reviewText.value.length; });

  const closeReview = () => { modal.classList.add('hidden'); document.body.style.overflow = ''; };
  document.getElementById('closeReviewModal')?.addEventListener('click', closeReview);
  document.getElementById('skipReviewBtn')?.addEventListener('click', closeReview);
  modal.addEventListener('click', e => { if (e.target === modal) closeReview(); });

  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    if (!selectedRating) { showToast('⭐ Please pick a star rating first'); return; }
    const message = reviewText?.value.trim() || '';
    const btn     = document.getElementById('submitReviewBtn');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    try {
      if (window.submitTestimonial && userData?.id) await window.submitTestimonial(userData.id, userData.name||'Anonymous', selectedRating, message);
      showToast('🙌 Thanks for your review!');
      closeReview();
      localStorage.setItem('ideaEngneReviewed', 'true');
    } catch (err) {
      showToast('❌ Submission failed.'); btn.disabled = false; btn.innerHTML = 'Submit Review';
      console.error(err);
    }
  });
}

function maybeShowReviewPrompt() {
  if (localStorage.getItem('ideaEngneReviewed')) return;
  const count = parseInt(localStorage.getItem('ideaEngneGenCount') || '0') + 1;
  localStorage.setItem('ideaEngneGenCount', count);
  if (count % 5 === 0) setTimeout(() => {
    const modal = document.getElementById('reviewModal');
    if (modal) { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }, 2000);
}

// ─── UPGRADE MODAL ────────────────────────────────────────────
function showUpgradeModal() {
  const modal = document.createElement('div');
  modal.className = 'upgrade-modal';
  modal.innerHTML = `
    <div class="upgrade-overlay"></div>
    <div class="upgrade-content">
      <button class="upgrade-close"><i class="fas fa-times"></i></button>
      <div class="upgrade-icon"><i class="fas fa-crown"></i></div>
      <h3>Upgrade to Creator Plan</h3>
      <p>You have used all your free ideas. Upgrade for unlimited generation.</p>
      <div class="upgrade-benefits">
        <div class="upgrade-benefit"><i class="fas fa-infinity"></i><span>Unlimited generation</span></div>
        <div class="upgrade-benefit"><i class="fas fa-bolt"></i><span>30 ideas per session</span></div>
        <div class="upgrade-benefit"><i class="fas fa-save"></i><span>Unlimited saved ideas</span></div>
        <div class="upgrade-benefit"><i class="fas fa-headset"></i><span>Priority support</span></div>
      </div>
      <div class="upgrade-pricing">
        <div class="price-tag"><span class="price">$9</span><span class="period">/month</span></div>
        <p class="price-note">Cancel anytime. No hidden fees.</p>
      </div>
      <button class="btn-upgrade" onclick="alert('Payment integration coming soon!')"><i class="fas fa-rocket"></i> Upgrade Now</button>
      <a href="#" class="upgrade-later">Maybe later</a>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('show'), 10);
  modal.querySelector('.upgrade-close').addEventListener('click',   () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-overlay').addEventListener('click', () => closeUpgradeModal(modal));
  modal.querySelector('.upgrade-later').addEventListener('click',   e => { e.preventDefault(); closeUpgradeModal(modal); });
}
function closeUpgradeModal(modal) { modal.classList.remove('show'); setTimeout(() => modal.remove(), 300); }

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast'), msg = document.getElementById('toastMessage');
  if (!toast || !msg) return;
  msg.textContent = message; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── ESCAPE HTML ──────────────────────────────────────────────
function escapeHtml(text) {
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
  return String(text||'').replace(/[&<>"']/g, m => map[m]);
}

console.log('%c⚡ Idea-Engne Dashboard','font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cPowered by Groq + Supabase | Built by TonyDev','font-size:14px;color:#22D3EE;font-weight:600;');