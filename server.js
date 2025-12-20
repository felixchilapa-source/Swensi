const express = require('express');
const path = require('path');
const app = express();

// Use dynamic port binding for Render compatibility (defaulting to 10000 for local dev)
const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

// Explicitly define MIME types for browser-side transpilation of TSX/TS files
express.static.mime.define({ 'application/javascript': ['tsx', 'ts', 'jsx'] });

/**
 * Environment Configuration Injection
 * Reads API_KEY from the server environment and makes it available to the frontend.
 */
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${key}' } };`);
});

// Serve static assets from the current directory
app.use(express.static(__dirname));

// SPA Routing: Redirect all unmatched requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('SWENSI NODE OPERATIONAL');
  console.log(`Port: ${PORT}`);
  console.log(`API Key Configured: ${apiKey ? 'YES' : 'NO'}`);
  console.log('Status: Ready for Nakonde Corridor');
  console.log('-------------------------------------------');
});