const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

/**
 * HEALTH CHECK
 * Required for Render deployment stability.
 */
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

/**
 * API EXAMPLE ROUTE
 * For future backend expansions.
 */
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Swensi Terminal Backend Operational' });
});

/**
 * ENVIRONMENT CONFIG INJECTION
 * Safely passes the API_KEY from Render environment to the browser.
 */
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: '${apiKey || ""}' } };`);
});

/**
 * STATIC ASSETS & SOURCE SERVING
 * Serves the 'dist' folder and ensures .tsx files are treated as JS
 * for browser-side Babel compilation.
 */
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Cache standard web assets
    if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|json|js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

/**
 * SPA CATCH-ALL
 * Ensures frontend routing works correctly.
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('   SWENSI NAKONDE - COMMAND NODE STARTUP   ');
  console.log('-------------------------------------------');
  console.log(`Port: ${PORT}`);
  console.log(`API Key Status: ${apiKey ? 'CONFIGURED' : 'MISSING'}`);
  console.log('Status: Serving Production Build from /dist');
  console.log('-------------------------------------------');
});