require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 3000;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(cors());
app.use(express.json());

const demoUsers = [
  {
    id: 1,
    name: 'Eric Mauti',
    email: 'ericmauti933@gmail.com',
    phone: '0712345678',
    password: 'admin123',
    role: 'administrator'
  },
  {
    id: 2,
    name: 'Clinton',
    email: 'clinton@example.com',
    phone: '0711001122',
    password: 'user123',
    role: 'member'
  }
];

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'CWG API is running.' });
});

app.post('/api/forgot-password', async (req, res) => {
  const { email, phone } = req.body || {};

  if (!email || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Email and phone are required.'
    });
  }

  const user = demoUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found for that email address.'
    });
  }

  const cleanUserPhone = (user.phone || '').replace(/\D/g, '');
  const cleanInputPhone = String(phone).replace(/\D/g, '');

  if (cleanUserPhone !== cleanInputPhone) {
    return res.status(400).json({
      success: false,
      message: 'The phone number does not match our records.'
    });
  }

  const tempPassword = `Tmp${Math.floor(100000 + Math.random() * 900000)}`;

  user.password = tempPassword;

  if (!resend) {
    return res.json({
      success: true,
      temporaryPassword: tempPassword,
      message: 'Demo mode: temporary password generated successfully but no real email was sent. Add RESEND_API_KEY to enable email delivery.'
    });
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Chinese Welfare Group <noreply@yourdomain.com>',
      to: [user.email],
      subject: 'Your Temporary Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Chinese Welfare Group</h2>
          <p>Hello ${user.name},</p>
          <p>Your temporary password is:</p>
          <p style="font-size: 24px; font-weight: bold; color: #2563eb;">${tempPassword}</p>
          <p>Please sign in and change your password immediately.</p>
        </div>
      `
    });

    return res.json({
      success: true,
      temporaryPassword: tempPassword,
      message: 'Temporary password sent to your email.'
    });
  } catch (error) {
    console.error('Email send failed:', error);
    return res.status(500).json({
      success: false,
      message: 'We could not send the temporary password at this time.'
    });
  }
});

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`CWG API running on http://localhost:${port}`);
});
