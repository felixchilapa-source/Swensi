
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
 * LOGGING
 * Verify API key configuration status during startup.
 */
console.log('-------------------------------------------');
console.log('SWENSI NODE STARTUP');
if (apiKey) {
  console.log('API Key Configured: YES');
} else {
  console.log('API Key Configured: NO');
}
console.log('-------------------------------------------');

/**
 * ENVIRONMENT CONFIG INJECTION
 * Injects the API_KEY into a global window object for the frontend to consume.
 */
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${key}' } };`);
});

/**
 * STATIC ASSETS
 * Serve files from the 'build/' directory.
 * Ensure correct MIME types for .tsx and .ts files to support browser-side transpilation.
 */
express.static.mime.define({ 'application/javascript': ['tsx', 'ts'] });
app.use(express.static(path.join(__dirname, 'build')));

/**
 * WILD-CARD ROUTING
 * Single Page Application (SPA) support: Redirect all non-file requests to index.html
 * within the build folder to allow React's client-side router to function.
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

/**
 * INITIALIZATION
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Status: Serving Production Build Assets from /build');
});
