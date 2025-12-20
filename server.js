const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

console.log('-------------------------------------------');
console.log('   SWENSI NAKONDE - COMMAND NODE STARTUP   ');
console.log('-------------------------------------------');
console.log(`Node Version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`API Key Status: ${apiKey ? 'CONFIGURED (SECURE)' : 'MISSING'}`);
console.log(`Target Port: ${PORT}`);
console.log('-------------------------------------------');

// Inject environment variables for the frontend
// This route is consumed by <script src="env-config.js"></script> in index.html
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  // Inject the key into the window.process object for frontend compatibility
  res.send(`window.process = { env: { API_KEY: '${apiKey || ""}' } };`);
});

/**
 * STATIC ASSETS WITH MIME OVERRIDE
 * Since we are serving .tsx and .ts files directly for Babel Standalone,
 * we must ensure the browser treats them as JavaScript modules.
 */
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Add caching for assets
    if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico|json|js|css)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// SPA Wildcard Routing
// This allows users to refresh the page on routes like /trips without a 404
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[READY] Swensi Terminal is live on port ${PORT}`);
  console.log(`[INFO] Serving production assets from: /build`);
});