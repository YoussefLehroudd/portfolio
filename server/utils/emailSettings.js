const EmailSettings = require('../models/EmailSettings');

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

const resolveEmailSettings = async () => {
  const settings = await EmailSettings.findOne();
  const fallback = parseFromEnv(process.env.RESEND_FROM);

  const fromName = settings?.fromName || fallback.fromName;
  const fromEmail = settings?.fromEmail || fallback.fromEmail;
  const notifyEmail = String(settings?.notifyEmail || process.env.RESEND_NOTIFY_EMAIL || '')
    .trim()
    .toLowerCase();
  const logoUrl = String(settings?.logoUrl || process.env.EMAIL_LOGO_URL || '')
    .trim();
  return {
    fromName,
    fromEmail,
    from: buildFromAddress({ fromName, fromEmail }),
    notifyEmail,
    logoUrl
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

module.exports = {
  parseFromEnv,
  buildFromAddress,
  resolveEmailSettings,
  normalizeSettings
};
