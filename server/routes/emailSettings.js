const express = require('express');
const { Resend } = require('resend');
const auth = require('../middleware/auth');
const EmailSettings = require('../models/EmailSettings');
const Project = require('../models/Project');
const { buildFromAddress, resolveEmailSettings, normalizeSettings } = require('../utils/emailSettings');
const { renderProjectEmail, getSiteUrl, resolveImageUrl } = require('../utils/subscriberMailer');

const router = express.Router();

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


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

    const settings = await resolveEmailSettings();
    const from = buildFromAddress(settings);

    if (!from) {
      return res.status(400).json({ message: 'From email is not configured' });
    }

    const siteUrl = getSiteUrl(req);
    const logoUrl = resolveImageUrl(settings.logoUrl || '', siteUrl);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: [targetEmail],
      subject: 'Test email from portfolio',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${settings.fromName || 'Logo'}" style="height: 32px; width: auto; display: block; margin-bottom: 10px;" />` : ''}
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

router.post('/test-project', auth, async (req, res) => {
  try {
    const { email, projectId } = req.body || {};
    const targetEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!targetEmail || !emailRegex.test(targetEmail)) {
      return res.status(400).json({ message: 'A valid test email is required' });
    }

    if (!projectId) {
      return res.status(400).json({ message: 'Project is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(400).json({ message: 'RESEND_API_KEY is not configured' });
    }

    const settings = await resolveEmailSettings();
    const from = buildFromAddress(settings);

    if (!from) {
      return res.status(400).json({ message: 'From email is not configured' });
    }

    const siteUrl = getSiteUrl(req);
    const html = renderProjectEmail(project, {
      siteUrl,
      fromName: settings.fromName,
      logoUrl: settings.logoUrl
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from,
      to: [targetEmail],
      subject: `Test project: ${project.title || 'Update'}`,
      html
    });

    if (error) {
      return res.status(error.statusCode || 400).json({
        message: error.message || 'Failed to send test email'
      });
    }

    return res.json({ status: 'sent' });
  } catch (error) {
    console.error('Error sending test project email:', error);
    return res.status(500).json({ message: 'Failed to send test email' });
  }
});

module.exports = router;
