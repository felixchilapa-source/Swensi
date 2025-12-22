
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

// Enable JSON parsing for API requests
app.use(express.json());

// Health check route for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Example backend API route
app.get('/api/hello', (req, res) => {
  console.log('API Hit: Frontend successfully connected to Backend');
  res.json({ message: 'Swensi Backend Online', timestamp: Date.now() });
});

// Environment config injection for the client
app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: '${apiKey || ""}' } };`);
});

// Serve Vite production build from /dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route: send index.html for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('SWENSI TERMINAL STARTUP');
  console.log(`Port: ${PORT}`);
  console.log(`API Key Configured: ${apiKey ? 'YES' : 'NO'}`);
  console.log('Status: Serving Production Build from /dist');
  console.log('-------------------------------------------');
});
