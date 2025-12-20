
const express = require('express');
const path = require('path');
const app = express();

// Render and other cloud providers inject the PORT variable automatically.
// We must listen on 0.0.0.0 to allow external traffic to reach the container.
const port = process.env.PORT || 3000;

// This endpoint allows the frontend to access environment variables
// defined in the Render Dashboard securely via window.process.env.
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: '${process.env.API_KEY || ''}' } };`);
});

// Serve the static files from the root directory
app.use(express.static(__dirname));

// For all other routes (SPA handling), serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`-------------------------------------------`);
  console.log(`SWENSI NODE OPERATIONAL`);
  console.log(`Port: ${port}`);
  console.log(`Status: External Link Established`);
  console.log(`-------------------------------------------`);
});
