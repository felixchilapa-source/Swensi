const express = require('express');
const path = require('path');
const app = express();

// Replace hardcoded port with dynamic port binding for cloud deployment (Render)
const PORT = process.env.PORT || 10000;

// Explicitly define MIME types for browser-side transpilation of TSX/TS files
express.static.mime.define({ 'application/javascript': ['tsx', 'ts', 'jsx'] });

/**
 * Environment Configuration Injection
 * Reads API_KEY from the server environment and makes it available to the frontend.
 */
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const apiKey = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${apiKey}' } };`);
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Update listen call to use the dynamic PORT variable
app.listen(PORT, () => {
  console.log(`-------------------------------------------`);
  console.log(`SWENSI NODE OPERATIONAL`);
  console.log(`Port: ${PORT}`);
  // Log whether the API Key is detected in the environment
  console.log(`API Key Configured: ${process.env.API_KEY ? 'YES' : 'NO'}`);
  console.log(`Status: Ready for Nakonde Corridor Deployment`);
  console.log(`-------------------------------------------`);
});