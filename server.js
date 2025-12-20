
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

console.log('-------------------------------------------');
console.log('SWENSI NODE STARTUP');
console.log(`API Key Configured: ${apiKey ? 'YES' : 'NO'}`);
console.log('-------------------------------------------');

// Inject environment variables for the frontend
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: '${apiKey || ""}' } };`);
});

/**
 * STATIC ASSETS WITH MIME OVERRIDE
 * Browsers require .tsx files to be served as application/javascript 
 * when using Babel Standalone.
 */
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// SPA Wildcard Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('Status: Serving Production Build Assets from /build');
});
