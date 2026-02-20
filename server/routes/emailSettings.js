const express = require('express');
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const EmailSettings = require('../models/EmailSettings');

const router = express.Router();

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const isValidUrl = (value) => {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

const parseFromEnv = (fromValue = '') => {
  const raw = String(fromValue || '').trim();
  if (!raw) return { fromName: '', fromEmail: '' };
  const match = raw.match(/^\s*"?([^"<]+?)"?\s*<([^>]+)>\s*$/);
  if (match) {
    return { fromName: match[1].trim(), fromEmail: match[2].trim().toLowerCase() };
  }
  return { fromName: '', fromEmail: raw.toLowerCase() };
};

const buildFromAddress = ({ fromName, fromEmail }) => {
  if (!fromEmail) return '';
  const cleanName = String(fromName || '').trim();
  if (cleanName) {
    return `${cleanName} <${fromEmail}>`;
  }
  return fromEmail;
};

const resolveSettings = async () => {
  const settings = await EmailSettings.findOne();
  if (settings) {
    const data = settings.toJSON ? settings.toJSON() : settings;
    return {
      fromName: data.fromName || '',
      fromEmail: data.fromEmail || '',
      notifyEmail: data.notifyEmail || '',
      logoUrl: data.logoUrl || ''
    };
  }
  const fallback = parseFromEnv(process.env.RESEND_FROM);
  return {
    fromName: fallback.fromName,
    fromEmail: fallback.fromEmail,
    notifyEmail: process.env.RESEND_NOTIFY_EMAIL || '',
    logoUrl: process.env.EMAIL_LOGO_URL || ''
  };
};

const normalizeSettings = (settings) => {
  if (!settings) {
    const fallback = parseFromEnv(process.env.RESEND_FROM);
    return {
      fromName: fallback.fromName,
      fromEmail: fallback.fromEmail,
      notifyEmail: process.env.RESEND_NOTIFY_EMAIL || '',
      logoUrl: process.env.EMAIL_LOGO_URL || ''
    };
  }

  const data = settings.toJSON ? settings.toJSON() : settings;
  return {
    fromName: data.fromName || '',
    fromEmail: data.fromEmail || '',
    notifyEmail: data.notifyEmail || '',
    logoUrl: data.logoUrl || ''
  };
};

router.get('/', auth, async (req, res) => {
  try {
    const settings = await EmailSettings.findOne();
    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error('Error fetching email settings:', error);
    res.status(500).json({ message: 'Error fetching email settings' });
  }
});

router.put('/', auth, async (req, res) => {
  try {
    const { fromName, fromEmail, notifyEmail, logoUrl } = req.body || {};

    const cleanedFromName = typeof fromName === 'string' ? fromName.trim() : '';
    const cleanedFromEmail = typeof fromEmail === 'string' ? fromEmail.trim().toLowerCase() : '';
    const cleanedNotifyEmail = typeof notifyEmail === 'string' ? notifyEmail.trim().toLowerCase() : '';
    const cleanedLogoUrl = typeof logoUrl === 'string' ? logoUrl.trim() : '';

    if (cleanedFromEmail && !emailRegex.test(cleanedFromEmail)) {
      return res.status(400).json({ message: 'Invalid from email address' });
    }

    if (cleanedNotifyEmail && !emailRegex.test(cleanedNotifyEmail)) {
      return res.status(400).json({ message: 'Invalid notification email address' });
    }

    if (cleanedLogoUrl && !isValidUrl(cleanedLogoUrl)) {
      return res.status(400).json({ message: 'Logo URL must be a valid http(s) URL' });
    }

    let settings = await EmailSettings.findOne();
    if (!settings) {
      settings = new EmailSettings({
        fromName: cleanedFromName,
        fromEmail: cleanedFromEmail,
        notifyEmail: cleanedNotifyEmail,
        logoUrl: cleanedLogoUrl
      });
    } else {
      settings.fromName = cleanedFromName;
      settings.fromEmail = cleanedFromEmail;
      settings.notifyEmail = cleanedNotifyEmail;
      settings.logoUrl = cleanedLogoUrl;
    }

    await settings.save();
    res.json(normalizeSettings(settings));
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ message: 'Error updating email settings' });
  }
});

router.post('/test', auth, async (req, res) => {
  try {
    const { email } = req.body || {};
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return res.status(400).json({ message: 'A valid test email is required' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ message: 'RESEND_API_KEY is not configured' });
    }

    const settings = await resolveSettings();
    const from = buildFromAddress(settings);

    if (!from) {
      return res.status(400).json({ message: 'From email is not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: [targetEmail],
      subject: 'Test email from portfolio',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
          ${settings.logoUrl ? `
            <div style="margin-bottom: 14px;">
              <img src="${settings.logoUrl}" alt="${settings.fromName || 'Logo'}" style="height: 48px; width: 48px; object-fit: contain; border-radius: 10px;" />
            </div>
          ` : ''}
          ${settings.fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${settings.fromName}</div>` : ''}
          <h2 style="margin: 0 0 12px;">Test email</h2>
          <p style="margin: 0;">Your portfolio email settings are working.</p>
        </div>
      `.trim()
    });

    if (error) {
      return res.status(error.statusCode || 400).json({
        message: error.message || 'Failed to send test email'
      });
    }

    return res.json({ status: 'sent' });
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ message: 'Failed to send test email' });
  }
});

module.exports = router;
