const express = require('express');
const auth = require('../middleware/auth');
const EmailSettings = require('../models/EmailSettings');
const Project = require('../models/Project');
const { buildFromAddress, resolveEmailSettings, normalizeSettings } = require('../utils/emailSettings');
const {
  renderProjectEmail,
  renderProjectEmailText,
  sendToSubscribers,
  getSiteUrl,
  resolveImageUrl
} = require('../utils/subscriberMailer');
const { sendEmail } = require('../utils/mailer');

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
    const {
      fromName,
      fromEmail,
      notifyEmail,
      logoUrl,
      provider,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure
    } = req.body || {};

    const cleanedFromName = typeof fromName === 'string' ? fromName.trim() : '';
    const cleanedFromEmail = typeof fromEmail === 'string' ? fromEmail.trim().toLowerCase() : '';
    const cleanedNotifyEmail = typeof notifyEmail === 'string' ? notifyEmail.trim().toLowerCase() : '';
    const cleanedLogoUrl = typeof logoUrl === 'string' ? logoUrl.trim() : '';
    const cleanedProvider = provider === 'smtp' ? 'smtp' : 'resend';
    const cleanedSmtpHost = typeof smtpHost === 'string' ? smtpHost.trim() : '';
    const cleanedSmtpUser = typeof smtpUser === 'string' ? smtpUser.trim() : '';
    const cleanedSmtpPass = typeof smtpPass === 'string' ? smtpPass : '';
    const cleanedSmtpSecure = smtpSecure === true || smtpSecure === 'true' || smtpSecure === 1 || smtpSecure === '1';
    const parsedPort = typeof smtpPort === 'number' ? smtpPort : Number(String(smtpPort || '').trim());
    const cleanedSmtpPort = Number.isFinite(parsedPort) ? parsedPort : null;

    if (smtpPort && !Number.isFinite(parsedPort)) {
      return res.status(400).json({ message: 'Invalid SMTP port' });
    }

    if (cleanedFromEmail && !emailRegex.test(cleanedFromEmail)) {
      return res.status(400).json({ message: 'Invalid from email address' });
    }

    if (cleanedNotifyEmail && !emailRegex.test(cleanedNotifyEmail)) {
      return res.status(400).json({ message: 'Invalid notification email address' });
    }

    let settings = await EmailSettings.findOne();
    const shouldUpdatePass = typeof smtpPass === 'string' && smtpPass.length > 0;
    if (!settings) {
      settings = new EmailSettings({
        fromName: cleanedFromName,
        fromEmail: cleanedFromEmail,
        notifyEmail: cleanedNotifyEmail,
        logoUrl: cleanedLogoUrl,
        provider: cleanedProvider,
        smtpHost: cleanedSmtpHost,
        smtpPort: cleanedSmtpPort,
        smtpUser: cleanedSmtpUser,
        smtpPass: cleanedSmtpPass,
        smtpSecure: cleanedSmtpSecure
      });
    } else {
      settings.fromName = cleanedFromName;
      settings.fromEmail = cleanedFromEmail;
      settings.notifyEmail = cleanedNotifyEmail;
      settings.logoUrl = cleanedLogoUrl;
      settings.provider = cleanedProvider;
      settings.smtpHost = cleanedSmtpHost;
      settings.smtpPort = cleanedSmtpPort;
      settings.smtpUser = cleanedSmtpUser;
      settings.smtpSecure = cleanedSmtpSecure;
      if (shouldUpdatePass) {
        settings.smtpPass = cleanedSmtpPass;
      }
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

    const settings = await resolveEmailSettings();
    const from = buildFromAddress(settings);

    if (!from) {
      return res.status(400).json({ message: 'From email is not configured' });
    }

    const siteUrl = getSiteUrl(req);
    const logoUrl = resolveImageUrl(settings.logoUrl || '', siteUrl);

    const result = await sendEmail({
      to: [targetEmail],
      subject: 'Test email from portfolio',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
          ${logoUrl ? `<img src="${logoUrl}" alt="${settings.fromName || 'Logo'}" style="height: 32px; width: auto; display: block; margin-bottom: 10px;" />` : ''}
          ${settings.fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${settings.fromName}</div>` : ''}
          <h2 style="margin: 0 0 12px;">Test email</h2>
          <p style="margin: 0;">Your portfolio email settings are working.</p>
        </div>
      `.trim(),
      text: [
        settings.fromName ? settings.fromName : '',
        'Test email',
        'Your portfolio email settings are working.'
      ].filter(Boolean).join('\n'),
      tracking: { enabled: true, category: 'test', siteUrl }
    });

    if (result?.error) {
      return res.status(result.error.statusCode || 400).json({
        message: result.error.message || 'Failed to send test email'
      });
    }

    return res.json({ status: 'sent', provider: result.provider || 'resend' });
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

    const result = await sendEmail({
      to: [targetEmail],
      subject: `Test project: ${project.title || 'Update'}`,
      html,
      text: [
        settings.fromName ? settings.fromName : '',
        `Test project: ${project.title || 'Update'}`,
        project?.description ? String(project.description).slice(0, 240) : 'A project update.'
      ].filter(Boolean).join('\n'),
      tracking: { enabled: true, category: 'project_test', siteUrl }
    });

    if (result?.error) {
      return res.status(result.error.statusCode || 400).json({
        message: result.error.message || 'Failed to send test email'
      });
    }

    return res.json({ status: 'sent', provider: result.provider || 'resend' });
  } catch (error) {
    console.error('Error sending test project email:', error);
    return res.status(500).json({ message: 'Failed to send test email' });
  }
});

router.post('/send-project', auth, async (req, res) => {
  try {
    const { projectId } = req.body || {};

    if (!projectId) {
      return res.status(400).json({ message: 'Project is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const settings = await resolveEmailSettings();
    const from = buildFromAddress(settings);

    if (!from) {
      return res.status(400).json({ message: 'From email is not configured' });
    }

    const siteUrl = getSiteUrl(req);
    const result = await sendToSubscribers({
      subject: `New project: ${project.title || 'Update'}`,
      siteUrl,
      tracking: { enabled: true, category: 'project_blast' },
      renderEmail: ({ unsubscribeUrl }) => ({
        html: renderProjectEmail(project, {
          siteUrl,
          fromName: settings.fromName,
          logoUrl: settings.logoUrl,
          unsubscribeUrl
        }),
        text: renderProjectEmailText(project, {
          siteUrl,
          fromName: settings.fromName,
          unsubscribeUrl
        })
      })
    });

    if (result?.skipped === 'no_subscribers') {
      return res.json({ status: 'skipped', message: 'No subscribers found.' });
    }

    return res.json({ status: 'sent', sent: result?.sent || 0 });
  } catch (error) {
    console.error('Error sending project announcement:', error);
    return res.status(500).json({ message: 'Failed to send project announcement' });
  }
});

module.exports = router;
