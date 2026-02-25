const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const crypto = require('crypto');
const { resolveEmailSettings } = require('./emailSettings');
const EmailLog = require('../models/EmailLog');
const { getIo } = require('./socket');

const normalizeProvider = (value) => (value === 'smtp' ? 'smtp' : 'resend');

const createTrackingId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
};

const buildTrackingUrl = (siteUrl, trackingId) => {
  if (!siteUrl || !trackingId) return '';
  const base = String(siteUrl || '').trim().replace(/\/$/, '');
  if (!base) return '';
  return `${base}/api/email/track/${trackingId}`;
};

const appendTrackingPixel = (html, trackingUrl) => {
  if (!html || !trackingUrl) return html;
  return `${html}
<img src="${trackingUrl}" width="1" height="1" style="display:none; max-height:1px; max-width:1px;" alt="" aria-hidden="true" />`;
};

const normalizeRecipient = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const formatEmailError = (error) => {
  if (!error) return 'Failed to send email';
  if (typeof error === 'string') return error;
  if (typeof error.message === 'string') return error.message;
  if (typeof error.name === 'string') return error.name;
  return 'Failed to send email';
};

const emitEmailUpdate = (log) => {
  const io = getIo();
  if (!io || !log) return;
  const payload = log.toJSON ? log.toJSON() : log;
  io.to('admins').emit('email:updated', payload);
};

const coerceNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveSmtpConfig = (settings) => {
  const port = coerceNumber(settings.smtpPort);
  const secure = Boolean(settings.smtpSecure);
  const host = String(settings.smtpHost || '').trim();
  const user = String(settings.smtpUser || '').trim();
  const pass = typeof settings.smtpPass === 'string' ? settings.smtpPass : '';

  return {
    host,
    port,
    secure,
    user,
    pass,
    auth: user ? { user, pass: pass || '' } : undefined
  };
};

const validateSmtpConfig = (settings) => {
  if (!settings.smtpHost) return 'SMTP host is not configured';
  if (!settings.smtpPort) return 'SMTP port is not configured';
  if (settings.smtpUser && !settings.smtpPass) return 'SMTP password is not configured';
  if (!settings.from) return 'From email is not configured';
  return '';
};

const sendEmail = async ({ to, subject, html, text, headers, tracking }) => {
  const settings = await resolveEmailSettings();
  const provider = normalizeProvider(settings.provider);
  const recipients = Array.isArray(to) ? to : [to];
  const list = recipients.map(normalizeRecipient).filter(Boolean);
  const trackingOptions = tracking && tracking.enabled !== false ? tracking : null;
  const shouldTrack = Boolean(trackingOptions);

  if (!list.length) {
    return { error: { message: 'No recipients specified' } };
  }

  let transportError = '';
  if (!settings.from) {
    transportError = 'From email is not configured';
  } else if (provider === 'smtp') {
    const validation = validateSmtpConfig(settings);
    if (validation) {
      transportError = validation;
    }
  } else if (!process.env.RESEND_API_KEY) {
    transportError = 'RESEND_API_KEY is not configured';
  }

  if (transportError && !shouldTrack) {
    return { error: { message: transportError } };
  }

  let transporter = null;
  let resend = null;

  if (!transportError) {
    if (provider === 'smtp') {
      const smtp = resolveSmtpConfig(settings);
      transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: smtp.auth
      });
    } else {
      resend = new Resend(process.env.RESEND_API_KEY);
    }
  }

  let lastError = null;

  for (const recipient of list) {
    let log = null;
    if (shouldTrack) {
      const trackingId = createTrackingId();
      try {
        log = await EmailLog.create({
          trackingId,
          recipient,
          subject: subject || '',
          category: trackingOptions?.category || '',
          provider,
          status: 'pending',
          openCount: 0
        });
      } catch (error) {
        console.error('Email log create error:', error);
        log = null;
      }
    }

    if (transportError) {
      if (log) {
        log.status = 'failed';
        log.sentAt = new Date();
        log.error = transportError;
        await log.save();
        emitEmailUpdate(log);
      }
      lastError = new Error(transportError);
      continue;
    }

    const trackingUrl = log
      ? buildTrackingUrl(trackingOptions?.siteUrl, log.trackingId)
      : '';
    const htmlWithPixel = appendTrackingPixel(html, trackingUrl);

    try {
      if (provider === 'smtp') {
        await transporter.sendMail({
          from: settings.from,
          to: [recipient],
          subject,
          html: htmlWithPixel,
          text,
          headers
        });
      } else {
        const { error } = await resend.emails.send({
          from: settings.from,
          to: [recipient],
          subject,
          html: htmlWithPixel,
          text,
          headers
        });
        if (error) {
          throw error;
        }
      }

      if (log) {
        log.status = 'sent';
        log.sentAt = new Date();
        await log.save();
        emitEmailUpdate(log);
      }
    } catch (error) {
      lastError = error;
      if (log) {
        log.status = 'failed';
        log.sentAt = new Date();
        log.error = formatEmailError(error);
        await log.save();
        emitEmailUpdate(log);
      }
    }
  }

  if (lastError) {
    return { error: { message: formatEmailError(lastError) } };
  }

  return { sent: true, provider };
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const sendBulkEmails = async ({ recipients = [], subject, html, text, headers }) => {
  const settings = await resolveEmailSettings();
  const provider = normalizeProvider(settings.provider);
  const list = recipients.filter(Boolean);

  if (!list.length) {
    return { skipped: 'no_recipients' };
  }

  if (!settings.from) {
    return { skipped: 'missing_from' };
  }

  if (provider === 'smtp') {
    const validation = validateSmtpConfig(settings);
    if (validation) {
      return { skipped: 'smtp_incomplete', message: validation };
    }

    const smtp = resolveSmtpConfig(settings);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth
    });

    let sent = 0;
    for (const email of list) {
      try {
        await transporter.sendMail({
          from: settings.from,
          to: [email],
          subject,
          html,
          text,
          headers
        });
        sent += 1;
      } catch (error) {
        console.error('SMTP send error:', error);
      }
    }
    return { sent, provider };
  }

  if (!process.env.RESEND_API_KEY) {
    return { skipped: 'missing_api_key' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const messages = list.map((email) => ({
    from: settings.from,
    to: [email],
    subject,
    html,
    text,
    headers
  }));

  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    const { error } = await resend.batch.send(chunk);
    if (error) {
      console.error('Resend batch send error:', error);
    }
  }

  return { sent: list.length, provider };
};

module.exports = {
  sendEmail,
  sendBulkEmails
};
