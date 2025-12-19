const express = require('express');
const path = require('path');
const app = express();

// Google Cloud Run and other providers inject the PORT variable.
const port = process.env.PORT || 8080;

// This endpoint allows the frontend to access the API key securely.
// The key is injected via environment variables in the deployment platform.
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const apiKey = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${apiKey}' } };`);
});

// Serve static files
app.use(express.static(__dirname));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`SWENSI NODE OPERATIONAL`);
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`API Key Configured: ${process.env.API_KEY ? 'YES' : 'NO'}`);
  console.log(`-------------------------------------------`);
});
