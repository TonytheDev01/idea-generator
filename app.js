'use strict';

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


// ========== AI GENERATION FUNCTION ==========
async function generateIdeas({ niche, audience, tone, platforms }) {
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

    const prompt = `You are an expert social media content strategist. Generate exactly 10 unique, specific, and actionable content ideas for the following creator:

Niche: ${niche}
${audienceText}${toneText}Platforms: ${platformsText}

For each idea, provide:
1. A clear, compelling post idea/hook (1-2 sentences max)
2. The best-fit platform from: ${platformsText}
3. The content format (e.g., "Reel", "Carousel", "Story", "Thread", "Video", "Post")

Return ONLY a valid JSON array with exactly 10 objects. Each object must have this structure:
{
  "idea": "The post idea/hook here",
  "platform": "instagram" (or linkedin, tiktok, twitter, youtube - lowercase),
  "format": "Reel" (or Carousel, Story, etc.)
}

Make the ideas:
- Specific to the niche (not generic advice anyone could Google)
- Varied in approach (mix educational, entertaining, behind-the-scenes, storytelling, controversial takes)
- Actionable (creator should know exactly what to make)
- Engaging (hooks that make people stop scrolling)

Return ONLY the JSON array, no other text.`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from response
    let ideasText = data.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    // Parse JSON
    // Remove markdown code blocks if present
    ideasText = ideasText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const ideas = JSON.parse(ideasText);

    if (!Array.isArray(ideas) || ideas.length === 0) {
      throw new Error('Invalid response format');
    }

    // Display ideas
    displayIdeas(ideas.slice(0, 10));
    
    // Save to localStorage
    localStorage.setItem('ideaEngneNiche', niche);
    localStorage.setItem('ideaEngneLastIdeas', JSON.stringify(ideas.slice(0, 10)));

    showToast('✨ 10 ideas generated successfully!');

  } catch (error) {
    console.error('Generation error:', error);
    
    loadingState.classList.remove('active');
    errorState.classList.add('active');
    
    if (error.message.includes('API key')) {
      document.getElementById('errorMessage').textContent = 
        'API key is missing or invalid. Please check your configuration.';
    } else if (error.message.includes('rate limit')) {
      document.getElementById('errorMessage').textContent = 
        'Too many requests. Please wait a moment and try again.';
    } else {
      document.getElementById('errorMessage').textContent = 
        'We couldn\'t generate ideas right now. This might be a temporary issue. Please try again in a moment.';
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
    
    const platformClass = idea.platform.toLowerCase();
    
    card.innerHTML = `
      <div class="idea-header">
        <div class="idea-number">${index + 1}</div>
        <div class="idea-content">
          <p class="idea-text">${idea.idea}</p>
          <div class="idea-meta">
            <span class="meta-tag">
              <i class="fas fa-layer-group"></i>
              ${idea.format}
            </span>
            <span class="platform-badge ${platformClass}">
              ${idea.platform.charAt(0).toUpperCase() + idea.platform.slice(1)}
            </span>
          </div>
        </div>
      </div>
      <div class="idea-actions">
        <button class="btn-icon btn-copy" data-text="${escapeHtml(idea.idea)}" title="Copy idea">
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
    text += `${i + 1}. ${idea.idea}\n`;
    text += `   Platform: ${idea.platform.toUpperCase()} | Format: ${idea.format}\n\n`;
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
console.log('%cAI-Powered Content Generation', 'font-size:14px;color:#22D3EE;font-weight:600;');
console.log('%cBuilt by Anthony Michael (TonyDev)', 'font-size:13px;color:#666;');