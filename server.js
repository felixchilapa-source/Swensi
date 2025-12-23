
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const apiKey = process.env.API_KEY;

// --- REAL WORLD CONFIGURATION ---
// To enable Real SMS in Zambia:
// 1. Sign up at africastalking.com
// 2. Set AT_USERNAME to 'sandbox' (dev) or your app username (prod)
// 3. Set AT_API_KEY to your generated API key
// 4. (Optional) Register a Sender ID like 'SWENSI'

const AT_USERNAME = process.env.AT_USERNAME;
const AT_API_KEY = process.env.AT_API_KEY;

let atClient = null;

if (AT_USERNAME && AT_API_KEY) {
    try {
        const AfricasTalking = require('africastalking');
        const at = AfricasTalking({ apiKey: AT_API_KEY, username: AT_USERNAME });
        atClient = at;
        console.log("✅ Africa's Talking SMS Gateway: ENABLED");
    } catch (e) {
        console.warn("⚠️ Africa's Talking dependency found but failed to initialize. Check credentials.");
    }
} else {
    console.log("ℹ️ SMS Gateway Config Missing. Running in SIMULATION mode.");
}

app.use(express.json());

// Production-ready OTP Store
// Structure: { phone: { code: string, expires: number } }
const otpStore = new Map();

// Cleanup Routine: Remove expired OTPs every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of otpStore.entries()) {
        if (data.expires < now) {
            otpStore.delete(phone);
        }
    }
}, 300000);

// Health check
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Swensi Backend Online', mode: atClient ? 'PRODUCTION_SMS' : 'SIMULATION', timestamp: Date.now() });
});

// --- AUTHENTICATION & SMS API ---

app.post('/api/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  // 1. Generate secure random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 2. Store with expiration (10 minutes)
  otpStore.set(phone, {
      code: code,
      expires: Date.now() + 10 * 60 * 1000
  });

  // 3. Send SMS (Real or Simulation)
  if (atClient) {
      try {
          // Real World SMS Send
          const result = await atClient.SMS.send({
              to: `+260${phone}`, // Force Zambia country code
              message: `Your Swensi Verification Code is: ${code}. Valid for 10 minutes.`,
              // from: 'SWENSI' // Only use if you have a registered Sender ID
          });
          
          console.log(`[REAL SMS SENT] To: +260${phone} | ID: ${result.SMSMessageData.Recipients[0].messageId}`);
          res.json({ success: true, message: 'OTP Sent via SMS Network' });

      } catch (error) {
          console.error('[SMS GATEWAY ERROR]', error);
          res.status(502).json({ error: 'SMS Gateway Unreachable' });
      }
  } else {
      // Simulation for Dev/Demo
      console.log('------------------------------------------------');
      console.log(`[SMS SIMULATION]`);
      console.log(`To: +260 ${phone}`);
      console.log(`Message: "Your Swensi Verification Code is: ${code}"`);
      console.log('------------------------------------------------');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({ success: true, message: 'OTP Generated (Simulation)' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code required' });
  }

  // Admin/App Store Review Override
  if (code === '123456') {
     return res.json({ success: true });
  }

  const record = otpStore.get(phone);

  if (!record) {
      return res.status(401).json({ error: 'Code expired or not requested' });
  }

  if (Date.now() > record.expires) {
      otpStore.delete(phone);
      return res.status(401).json({ error: 'Code expired' });
  }

  if (record.code === code) {
    otpStore.delete(phone); // Burn code after successful use (Replay Protection)
    return res.json({ success: true });
  } else {
    return res.status(401).json({ error: 'Invalid verification code' });
  }
});

// --------------------------------

app.get('/env-config.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: '${apiKey || ""}' } };`);
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('-------------------------------------------');
  console.log('SWENSI NAKONDE TERMINAL - SERVER START');
  console.log(`Port: ${PORT}`);
  console.log(`SMS Mode: ${atClient ? 'REAL (Africa\'s Talking)' : 'SIMULATION (Console)'}`);
  console.log('-------------------------------------------');
});
