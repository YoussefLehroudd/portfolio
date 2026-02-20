const express = require('express');
const { Resend } = require('resend');
const Subscriber = require('../models/Subscriber');
const EmailSettings = require('../models/EmailSettings');

const router = express.Router();

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
};

const parseFromEnv = (fromValue = '') => {
  const raw = String(fromValue || '').trim();
  if (!raw) return { fromName: '', fromEmail: '' };
  const match = raw.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) {
    return { fromName: match[1].trim(), fromEmail: match[2].trim() };
  }
  return { fromName: '', fromEmail: raw };
};

const buildFromAddress = ({ fromName, fromEmail }) => {
  if (!fromEmail) return '';
  const cleanName = String(fromName || '').trim();
  if (cleanName) {
    return `${cleanName} <${fromEmail}>`;
  }
  return fromEmail;
};

const resolveEmailSettings = async () => {
  const settings = await EmailSettings.findOne();
  if (settings) {
    const data = settings.toJSON ? settings.toJSON() : settings;
    return {
      from: buildFromAddress({
        fromName: data.fromName,
        fromEmail: data.fromEmail
      }),
      notifyEmail: String(data.notifyEmail || '').trim().toLowerCase(),
      fromName: data.fromName || '',
      logoUrl: data.logoUrl || ''
    };
  }

  const fallback = parseFromEnv(process.env.RESEND_FROM);
  return {
    from: buildFromAddress(fallback),
    notifyEmail: String(process.env.RESEND_NOTIFY_EMAIL || '').trim().toLowerCase(),
    fromName: fallback.fromName,
    logoUrl: process.env.EMAIL_LOGO_URL || ''
  };
};

router.post('/', async (req, res) => {
  const { email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    const existing = await Subscriber.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(200).json({ status: 'already' });
    }

    const subscriber = new Subscriber({ email: normalizedEmail });
    await subscriber.save();

    const resend = getResendClient();
    const { from, notifyEmail, fromName, logoUrl } = await resolveEmailSettings();

    if (!resend || !from) {
      return res.status(202).json({ status: 'subscribed', emailSent: false });
    }

    const baseEmail = {
      from,
      to: [normalizedEmail],
      subject: 'You are in the loop',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
          ${logoUrl ? `
            <div style="margin-bottom: 14px;">
              <img src="${logoUrl}" alt="${fromName || 'Logo'}" style="height: 48px; width: 48px; object-fit: contain; border-radius: 10px;" />
            </div>
          ` : ''}
          ${fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${fromName}</div>` : ''}
          <h2 style="margin: 0 0 12px;">Welcome aboard</h2>
          <p style="margin: 0 0 10px;">Thanks for subscribing. I will send you updates whenever I ship something new.</p>
          <p style="margin: 0;">If you did not request this, you can ignore this message.</p>
        </div>
      `.trim()
    };

    const { error: sendError } = await resend.emails.send(baseEmail);
    if (sendError) {
      console.error('Resend welcome email error:', sendError);
      return res.status(201).json({ status: 'subscribed', emailSent: false });
    }

    if (notifyEmail) {
      const { error: notifyError } = await resend.emails.send({
        from,
        to: [notifyEmail],
        subject: 'New portfolio subscriber',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
            ${logoUrl ? `
              <div style="margin-bottom: 12px;">
                <img src="${logoUrl}" alt="${fromName || 'Logo'}" style="height: 40px; width: 40px; object-fit: contain; border-radius: 8px;" />
              </div>
            ` : ''}
            ${fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${fromName}</div>` : ''}
            <p style="margin: 0 0 10px;">New subscriber:</p>
            <strong>${normalizedEmail}</strong>
          </div>
        `.trim()
      });
      if (notifyError) {
        console.error('Resend notify email error:', notifyError);
      }
    }

    return res.status(201).json({ status: 'subscribed', emailSent: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

module.exports = router;
