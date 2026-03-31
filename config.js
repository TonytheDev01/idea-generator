'use strict';
// config.js
// LOCAL: reads from .env | PRODUCTION: injected by GitHub Actions
// Never commit a real key here.

window.ENV = {
  GROQ_API_KEY: 'YOUR-GROQ-API-KEY-HERE',
  NODE_ENV: 'development'
};