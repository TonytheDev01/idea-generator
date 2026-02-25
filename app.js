'use strict';

// ========================================
// GROQ API CONFIGURATION
// FAST, FREE, HIGH-QUALITY AI
// ========================================

const GROQ_API_KEY = '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';

// Model to use (don't change unless you know what you're doing)
const AI_MODEL = 'llama-3.1-70b-versatile';


// ========== AUTH CHECK ==========
const userEmail = localStorage.getItem('ideaEngneUser');
if (!userEmail) {
  window.location.href = 'index.html';
}

// Display user info
document.getElementById('userEmail').textContent = userEmail;
const initials = userEmail.charAt(0).toUpperCase() + (userEmail.split('@')[0].slice(-1).toUpperCase());
document.getElementById('userAvatar').textContent = initials;

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('ideaEngneUser');
  localStorage.removeItem('ideaEngneNiche');
  localStorage.removeItem('ideaEngneLastIdeas');
  window.location.href = 'index.html';
});


// ========== PLATFORM SELECTION ==========
const platformTags = document.querySelectorAll('.platform-tag');
const selectedPlatforms = new Set();

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


// ========== FORM SUBMISSION & AI GENERATION ==========
const form = document.getElementById('generatorForm');
const generateBtn = document.getElementById('generateBtn');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const ideasList = document.getElementById('ideasList');
const resultsCount = document.getElementById('resultsCount');
const exportBtn = document.getElementById('exportBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
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


// ========== AI GENERATION FUNCTION - GROQ ==========
async function generateIdeas({ niche, audience, tone, platforms }) {
  // ✅ FIXED: Now checking against placeholder, not actual key
  if (GROQ_API_KEY === 'YOUR-GROQ-API-KEY-HERE') {
    errorState.classList.add('active');
    document.getElementById('errorMessage').innerHTML = 
      '⚠️ <strong>Groq not configured!</strong><br><br>' +
      '1. Go to <a href="https://console.groq.com" target="_blank" style="color:#22D3EE">console.groq.com</a><br>' +
      '2. Create free account (no credit card)<br>' +
      '3. Get API key from "API Keys" section<br>' +
      '4. Paste key in app.js (line 10)<br><br>' +
      '<small>Key starts with: gsk_...</small>';
    return;
  }

  // Show loading state
  emptyState.style.display = 'none';
  errorState.classList.remove('active');
  loadingState.classList.add('active');
  ideasList.classList.remove('active');
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  try {
    // Build prompt
    const platformsText = platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ');
    const audienceText = audience ? `Target audience: ${audience}. ` : '';
    const toneText = tone ? `Brand tone: ${tone}. ` : '';

    const prompt = `You are an expert social media content strategist. Generate exactly 10 unique, specific, and actionable content ideas.

Niche: ${niche}
${audienceText}${toneText}Platforms: ${platformsText}

Return ONLY a valid JSON array with exactly 10 objects. Each object must have this structure:
{
  "idea": "The post idea/hook here (1-2 sentences max)",
  "platform": "instagram" (or linkedin, tiktok, twitter, youtube - lowercase),
  "format": "Reel" (or Carousel, Story, Thread, Video, Post)
}

Requirements:
- Specific to the niche (not generic advice anyone could Google)
- Varied in approach (mix educational, entertaining, behind-the-scenes, storytelling, controversial takes)
- Actionable (creator should know exactly what to make)
- Engaging (hooks that make people stop scrolling)

Return ONLY the JSON array, no other text, no markdown, no explanation.`;

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
            content: 'You are a helpful assistant that generates social media content ideas. Always respond with valid JSON arrays only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData);
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('=== GROQ RESPONSE ===');
    console.log('Full response:', data);
    
    // Extract the AI's message
    const aiMessage = data.choices[0].message.content;
    console.log('AI message:', aiMessage);
    
    // Clean up the response
    let ideasText = aiMessage.trim();
    
    // Remove markdown code blocks if present
    ideasText = ideasText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Cleaned text:', ideasText);
    
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

    // Validate and fix ideas if needed
    ideas = ideas.map((idea, i) => ({
      idea: idea.idea || idea.content || idea.text || `Content idea ${i + 1}`,
      platform: (idea.platform || platforms[i % platforms.length]).toLowerCase(),
      format: idea.format || 'Post'
    }));

    // Display ideas (take first 10)
    displayIdeas(ideas.slice(0, 10));
    
    // Save to localStorage
    localStorage.setItem('ideaEngneNiche', niche);
    localStorage.setItem('ideaEngneLastIdeas', JSON.stringify(ideas.slice(0, 10)));

    showToast('✨ 10 ideas generated successfully!');

  } catch (error) {
    console.error('Generation error:', error);
    
    loadingState.classList.remove('active');
    errorState.classList.add('active');
    
    // Provide helpful error messages
    if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('Invalid')) {
      document.getElementById('errorMessage').innerHTML = 
        '❌ <strong>Invalid API Key</strong><br><br>' +
        'Your Groq API key is invalid or expired.<br><br>' +
        '1. Go to <a href="https://console.groq.com" target="_blank" style="color:#22D3EE">console.groq.com</a><br>' +
        '2. Click "API Keys"<br>' +
        '3. Create a new key<br>' +
        '4. Update it in app.js (line 10)';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      document.getElementById('errorMessage').textContent = 
        'Rate limit exceeded (14,400 requests/day). This is very unlikely! Try again in a few minutes or create a new Groq account.';
    } else if (error.message.includes('model')) {
      document.getElementById('errorMessage').textContent = 
        'Model error. Don\'t change the AI_MODEL in app.js - use the default: llama-3.1-70b-versatile';
    } else {
      document.getElementById('errorMessage').textContent = 
        `${error.message} Check browser console (F12) for details.`;
    }
    
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate 10 Ideas';
  }
}


// ========== DISPLAY IDEAS ==========
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
    
    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-number">${index + 1}</div>
        <div class="idea-content">
          <p class="idea-text">${ideaText}</p>
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
        <button class="btn-icon btn-copy" data-text="${escapeHtml(ideaText)}" title="Copy idea">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    `;
    
    ideasList.appendChild(card);
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

// Helper function to escape HTML
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


// ========== EXPORT FUNCTION ==========
exportBtn.addEventListener('click', () => {
  const ideas = JSON.parse(localStorage.getItem('ideaEngneLastIdeas') || '[]');
  if (ideas.length === 0) return;

  const niche = localStorage.getItem('ideaEngneNiche') || 'Unknown niche';
  const date = new Date().toLocaleDateString();
  
  let text = `IDEA-ENGNE CONTENT IDEAS\n`;
  text += `Generated: ${date}\n`;
  text += `Niche: ${niche}\n`;
  text += `\n${'='.repeat(60)}\n\n`;
  
  ideas.forEach((idea, i) => {
    const ideaText = idea.idea || idea.content || idea.text;
    const platform = idea.platform || 'General';
    const format = idea.format || 'Post';
    text += `${i + 1}. ${ideaText}\n`;
    text += `   Platform: ${platform.toUpperCase()} | Format: ${format}\n\n`;
  });
  
  text += `\n${'='.repeat(60)}\n`;
  text += `Generated with Idea-Engne | Built by TonyDev\n`;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `idea-engne-ideas-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('📥 Exported successfully!');
});


// ========== RETRY BUTTON ==========
document.getElementById('retryBtn').addEventListener('click', () => {
  const lastNiche = localStorage.getItem('ideaEngneNiche');
  if (lastNiche) {
    document.getElementById('niche').value = lastNiche;
  }
  errorState.classList.remove('active');
  emptyState.style.display = 'flex';
});


// ========== TOAST NOTIFICATION ==========
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


// ========== LOAD PREVIOUS IDEAS (IF ANY) ==========
document.addEventListener('DOMContentLoaded', () => {
  const lastIdeas = localStorage.getItem('ideaEngneLastIdeas');
  const lastNiche = localStorage.getItem('ideaEngneNiche');
  
  if (lastIdeas && lastNiche) {
    try {
      const ideas = JSON.parse(lastIdeas);
      document.getElementById('niche').value = lastNiche;
      displayIdeas(ideas);
      emptyState.style.display = 'none';
    } catch (e) {
      console.error('Could not load previous ideas:', e);
    }
  }
});


// ========== CONSOLE BRANDING ==========
console.log('%c⚡ Idea-Engne Dashboard', 'font-size:22px;font-weight:900;color:#4f39f6;');
console.log('%cPowered by Groq (Fast & Free)', 'font-size:14px;color:#22D3EE;font-weight:600;');
console.log('%cBuilt by Anthony Michael (TonyDev)', 'font-size:13px;color:#666;');
console.log('%c14,400 free requests per day! 🚀', 'font-size:12px;color:#04cc6f;font-weight:bold;');