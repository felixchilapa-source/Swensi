const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

// Explicitly define MIME types for browser-side transpilation
express.static.mime.define({ 'application/javascript': ['tsx', 'ts', 'jsx'] });

app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const apiKey = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: '${apiKey}' } };`);
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`SWENSI NODE OPERATIONAL`);
  console.log(`Port: ${PORT}`);
  console.log(`API Key Configured: ${process.env.API_KEY ? 'YES' : 'NO'}`);
  console.log(`Status: Ready for Nakonde Corridor`);
  console.log(`-------------------------------------------`);
});