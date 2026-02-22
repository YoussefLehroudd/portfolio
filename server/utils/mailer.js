const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { resolveEmailSettings } = require('./emailSettings');

const normalizeProvider = (value) => (value === 'smtp' ? 'smtp' : 'resend');

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

const sendEmail = async ({ to, subject, html, text, headers }) => {
  const settings = await resolveEmailSettings();
  const provider = normalizeProvider(settings.provider);
  const recipients = Array.isArray(to) ? to : [to];

  if (!settings.from) {
    return { error: { message: 'From email is not configured' } };
  }

  if (provider === 'smtp') {
    const validation = validateSmtpConfig(settings);
    if (validation) {
      return { error: { message: validation } };
    }

    const smtp = resolveSmtpConfig(settings);
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth
    });

    await transporter.sendMail({
      from: settings.from,
      to: recipients,
      subject,
      html,
      text,
      headers
    });

    return { sent: true, provider };
  }

  if (!process.env.RESEND_API_KEY) {
    return { error: { message: 'RESEND_API_KEY is not configured' } };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: settings.from,
    to: recipients,
    subject,
    html,
    text,
    headers
  });

  if (error) {
    return { error };
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
