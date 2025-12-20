const express = require('express');
const path = require('path');
const app = express();

const port = process.env.PORT || 8080;

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

app.listen(port, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`SWENSI NODE OPERATIONAL`);
  console.log(`Port: ${port}`);
  console.log(`API Key Configured: ${process.env.API_KEY ? 'YES' : 'NO'}`);
  console.log(`-------------------------------------------`);
});