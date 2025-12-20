const express = require('express');
const path = require('path');
const app = express();

/**
 * CONFIGURATION
 * Render and other cloud providers provide a dynamic port via process.env.PORT.
 */
const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

/**
 * ENVIRONMENT CONFIG INJECTION
 * Injects the API_KEY into a global window object for the frontend to consume.
 * Note: If serving from 'build', ensure the frontend build process or index.html 
 * correctly references this endpoint if needed, or rely on process.env polyfills.
 */
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${key}' } };`);
});

/**
 * STATIC ASSETS
 * Serve files from the 'build/' directory.
 */
app.use(express.static(path.join(__dirname, 'build')));

/**
 * WILD-CARD ROUTING
 * Ensures that any route requested (e.g., /active, /account) 
 * returns the index.html from the build folder to allow React to handle routing.
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

/**
 * INITIALIZATION
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('SWENSI NODE OPERATIONAL');
  console.log(`Port: ${PORT}`);
  console.log(`API Key Configured: ${apiKey ? 'YES' : 'NO'}`);
  console.log('Status: Serving Production Build Assets');
  console.log('-------------------------------------------');
});