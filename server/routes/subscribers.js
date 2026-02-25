const express = require('express');
const Subscriber = require('../models/Subscriber');
const { resolveEmailSettings } = require('../utils/emailSettings');
const { sendEmail } = require('../utils/mailer');
const { getSiteUrl } = require('../utils/subscriberMailer');
const { createUnsubscribeToken, verifyUnsubscribeToken, buildUnsubscribeUrl } = require('../utils/unsubscribe');
const { getIo } = require('../utils/socket');

const router = express.Router();

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const buildListUnsubscribeHeaders = (unsubscribeUrl) => {
  if (!unsubscribeUrl) return undefined;
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
  };
};

const renderUnsubscribePage = ({ title, message }) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #0b0d12; color: #e5e7eb; padding: 24px; }
        .card { max-width: 520px; margin: 10vh auto; background: #111827; border-radius: 16px; padding: 24px; border: 1px solid #1f2937; }
        h1 { margin: 0 0 12px; font-size: 22px; }
        p { margin: 0; line-height: 1.6; color: #cbd5f5; }
        a { color: #64ffda; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>${title}</h1>
        <p>${message}</p>
      </div>
    </body>
  </html>
`.trim();

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
    const io = getIo();
    if (io) {
      const payload = subscriber?.toJSON ? subscriber.toJSON() : subscriber;
      io.to('admins').emit('subscriber:new', payload);
    }

    const { notifyEmail, fromName } = await resolveEmailSettings();
    const siteUrl = getSiteUrl(req);
    const token = createUnsubscribeToken(normalizedEmail);
    const unsubscribeUrl = buildUnsubscribeUrl(siteUrl, token);
    const unsubscribeFooter = unsubscribeUrl
      ? `<p style="margin: 16px 0 0;"><a href="${unsubscribeUrl}" style="color:#0f766e; text-decoration:none;">Unsubscribe</a></p>`
      : '';

    const baseEmail = {
      to: [normalizedEmail],
      subject: 'You are in the loop',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
          ${fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${fromName}</div>` : ''}
          <h2 style="margin: 0 0 12px;">Welcome aboard</h2>
          <p style="margin: 0 0 10px;">Thanks for subscribing. I will send you updates whenever I ship something new.</p>
          <p style="margin: 0;">If you did not request this, you can ignore this message.</p>
          ${unsubscribeFooter}
        </div>
      `.trim(),
      text: [
        fromName ? `${fromName}` : '',
        'Welcome aboard',
        'Thanks for subscribing. I will send you updates whenever I ship something new.',
        'If you did not request this, you can ignore this message.',
        unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : ''
      ].filter(Boolean).join('\n'),
      headers: buildListUnsubscribeHeaders(unsubscribeUrl)
    };

    const welcomeResult = await sendEmail({
      ...baseEmail,
      tracking: { enabled: true, category: 'welcome', siteUrl }
    });
    if (welcomeResult?.error) {
      console.error('Welcome email error:', welcomeResult.error);
      return res.status(201).json({ status: 'subscribed', emailSent: false });
    }

    if (notifyEmail) {
      const notifyResult = await sendEmail({
        to: [notifyEmail],
        subject: 'New portfolio subscriber',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #0b0d12;">
            ${fromName ? `<div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${fromName}</div>` : ''}
            <p style="margin: 0 0 10px;">New subscriber:</p>
            <strong>${normalizedEmail}</strong>
          </div>
        `.trim(),
        text: [
          fromName ? `${fromName}` : '',
          'New subscriber:',
          normalizedEmail
        ].filter(Boolean).join('\n')
      });
      if (notifyResult?.error) {
        console.error('Notify email error:', notifyResult.error);
      }
    }

    return res.status(201).json({ status: 'subscribed', emailSent: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ error: 'Failed to subscribe.' });
  }
});

router.get('/unsubscribe', async (req, res) => {
  const token = typeof req.query?.token === 'string' ? req.query.token : '';
  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return res.status(400).send(renderUnsubscribePage({
      title: 'Invalid unsubscribe link',
      message: 'This unsubscribe link is invalid or expired.'
    }));
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (!existing) {
      return res.status(200).send(renderUnsubscribePage({
        title: 'Already unsubscribed',
        message: 'This email is not on the list anymore.'
      }));
    }

    if (typeof existing.deleteOne === 'function') {
      await existing.deleteOne();
    } else if (typeof Subscriber.findByIdAndDelete === 'function') {
      await Subscriber.findByIdAndDelete(existing._id);
    } else if (typeof Subscriber.destroy === 'function') {
      await Subscriber.destroy({ where: { id: existing._id || existing.id } });
    }

    return res.status(200).send(renderUnsubscribePage({
      title: 'Unsubscribed',
      message: 'You have been removed from the list. If this was a mistake, you can subscribe again on the website.'
    }));
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).send(renderUnsubscribePage({
      title: 'Unsubscribe error',
      message: 'Something went wrong. Please try again later.'
    }));
  }
});

router.post('/unsubscribe', async (req, res) => {
  const token = typeof req.body?.token === 'string'
    ? req.body.token
    : (typeof req.query?.token === 'string' ? req.query.token : '');
  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return res.status(400).json({ message: 'Invalid unsubscribe token' });
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (!existing) {
      return res.status(200).json({ status: 'already_unsubscribed' });
    }

    if (typeof existing.deleteOne === 'function') {
      await existing.deleteOne();
    } else if (typeof Subscriber.findByIdAndDelete === 'function') {
      await Subscriber.findByIdAndDelete(existing._id);
    } else if (typeof Subscriber.destroy === 'function') {
      await Subscriber.destroy({ where: { id: existing._id || existing.id } });
    }

    return res.status(200).json({ status: 'unsubscribed' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

module.exports = router;
