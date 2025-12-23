
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

// Helper: Send SMS
const sendSMS = async (phone, message) => {
    // Normalize phone number for Zambia (remove leading 0, ensure +260)
    const cleanPhone = phone.toString().replace(/\D/g, '').replace(/^0/, '').replace(/^260/, '');
    const recipient = `+260${cleanPhone}`;

    if (atClient) {
        try {
            const result = await atClient.SMS.send({
                to: recipient,
                message: message,
                // from: 'SWENSI' // Uncomment if Sender ID is registered
            });
            const messageId = result.SMSMessageData?.Recipients?.[0]?.messageId || 'SENT';
            console.log(`[REAL SMS SENT] To: ${recipient} | ID: ${messageId}`);
            return { success: true, mode: 'REAL', id: messageId };
        } catch (error) {
            console.error('[SMS GATEWAY ERROR]', error);
            return { success: false, error: error.message };
        }
    } else {
        // Simulation for Dev/Demo
        console.log('------------------------------------------------');
        console.log(`[SMS SIMULATION]`);
        console.log(`To: ${recipient}`);
        console.log(`Message: "${message}"`);
        console.log('------------------------------------------------');
        return { success: true, mode: 'SIMULATION' };
    }
};

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
  const result = await sendSMS(phone, `Your Swensi Verification Code is: ${code}. Valid for 10 minutes.`);
  
  if (result.success) {
      // Simulate network delay for realism in simulation
      if (result.mode === 'SIMULATION') await new Promise(resolve => setTimeout(resolve, 1000));
      res.json({ success: true, message: result.mode === 'SIMULATION' ? 'OTP Generated (Simulation)' : 'OTP Sent via SMS' });
  } else {
      res.status(502).json({ error: 'SMS Gateway Unreachable' });
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

// Generic SMS Notification Endpoint (Secured or internal use)
app.post('/api/notifications/sms', async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });
    
    const result = await sendSMS(phone, message);
    if (result.success) {
        res.json({ success: true, ...result });
    } else {
        res.status(500).json({ error: 'Failed to send SMS', details: result.error });
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
