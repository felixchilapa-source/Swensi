
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

// In-memory OTP store for demonstration
// In production, use Redis or a database
const otpStore = new Map();

// Health check route for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Example backend API route
app.get('/api/hello', (req, res) => {
  console.log('API Hit: Frontend successfully connected to Backend');
  res.json({ message: 'Swensi Backend Online', timestamp: Date.now() });
});

// --- AUTHENTICATION & SMS API ---

app.post('/api/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store it (with a short expiry logic in a real app)
  otpStore.set(phone, code);

  console.log('------------------------------------------------');
  console.log(`[SMS GATEWAY SIMULATION]`);
  console.log(`To: +260 ${phone}`);
  console.log(`Message: "Your Swensi verification code is: ${code}"`);
  console.log('------------------------------------------------');

  // Integration Point for Real SMS Providers:
  // 1. Africa's Talking
  // const africastalking = require('africastalking')(credentials);
  // await africastalking.SMS.send({ to: `+260${phone}`, message: `Code: ${code}` });
  
  // 2. Twilio
  // await client.messages.create({ body: `Code: ${code}`, from: 'Swensi', to: `+260${phone}` });

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));

  res.json({ success: true, message: 'OTP Sent successfully' });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  // Master override for Apple/Play Store Review or Admin testing
  if (code === '123456') {
     return res.json({ success: true });
  }

  const storedCode = otpStore.get(phone);

  if (storedCode && storedCode === code) {
    // Valid OTP
    otpStore.delete(phone); // Burn code after use
    return res.json({ success: true });
  } else {
    return res.status(401).json({ error: 'Invalid verification code' });
  }
});

// --------------------------------

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
