'use strict';

// SUPABASE CLIENT CONFIGURATION
// Built by Anthony Michael (TonyDev)

const SUPABASE_URL = 'https://qbsdwdgevriophxvrybq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFic2R3ZGdldnJpb3BoeHZyeWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTg0NTgsImV4cCI6MjA5MDc5NDQ1OH0.xJMJ5Ap41JJ9UKZ5b3YeL9Rv3zKGOuaKPlwSXclH-9Q';

// Load Supabase from CDN (added to HTML files)
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── AUTH FUNCTIONS ───────────────────────────────────────────

async function signUp(name, email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// ─── PROFILE FUNCTIONS ────────────────────────────────────────

async function getProfile(userId) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function updateProfile(userId, updates) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function uploadAvatar(userId, file) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabaseClient.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage
    .from('avatars')
    .getPublicUrl(filePath);

  await updateProfile(userId, { avatar_url: data.publicUrl });
  return data.publicUrl;
}

// ─── TESTIMONIALS FUNCTIONS ───────────────────────────────────

async function getApprovedTestimonials() {
  const { data, error } = await supabaseClient
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(6);
  if (error) throw error;
  return data;
}

// Single submitTestimonial — accepts (userId, name, rating, message)
// FIX: removed duplicate that was causing SyntaxError and breaking all generation
async function submitTestimonial(userId, name, rating, message) {
  const { data, error } = await supabaseClient
    .from('testimonials')
    .insert([{
      user_id: userId,
      name,
      rating,
      message,
      approved: false
    }]);
  if (error) throw error;
  return data;
}

// ─── PLATFORM STATS FUNCTIONS ────────────────────────────────

async function getPlatformStats() {
  const { data, error } = await supabaseClient
    .from('platform_stats')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

async function incrementIdeasGenerated(count) {
  const { error } = await supabaseClient.rpc('increment_ideas', { amount: count });
  if (error) {
    // Fallback: manual update
    const stats = await getPlatformStats();
    await supabaseClient
      .from('platform_stats')
      .update({ total_ideas_generated: stats.total_ideas_generated + count })
      .eq('id', 1);
  }
}

// ─── SAVED IDEAS FUNCTIONS ────────────────────────────────────

async function saveIdea(userId, idea) {
  const { data, error } = await supabaseClient
    .from('saved_ideas')
    .insert([{
      user_id: userId,
      idea: idea.idea,
      platform: idea.platform,
      format: idea.format,
      hook: idea.hook,
      cta: idea.cta
    }]);
  if (error) throw error;
  return data;
}

async function getSavedIdeas(userId) {
  const { data, error } = await supabaseClient
    .from('saved_ideas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteSavedIdea(ideaId) {
  const { error } = await supabaseClient
    .from('saved_ideas')
    .delete()
    .eq('id', ideaId);
  if (error) throw error;
}

//  EXPOSE GLOBALS 
// FIX: supabase.js is loaded as type="module" so nothing is global by default.
// app.js and signup.js reference these as globals — we expose them via window.

window.supabaseClient        = supabaseClient;
window.signUp                = signUp;
window.signIn                = signIn;
window.signOut               = signOut;
window.getCurrentUser        = getCurrentUser;
window.getProfile            = getProfile;
window.updateProfile         = updateProfile;
window.uploadAvatar          = uploadAvatar;
window.getApprovedTestimonials = getApprovedTestimonials;
window.submitTestimonial     = submitTestimonial;
window.getPlatformStats      = getPlatformStats;
window.incrementIdeasGenerated = incrementIdeasGenerated;
window.saveIdea              = saveIdea;
window.getSavedIdeas         = getSavedIdeas;
window.deleteSavedIdea       = deleteSavedIdea;