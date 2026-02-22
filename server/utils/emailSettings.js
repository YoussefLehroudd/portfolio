const EmailSettings = require('../models/EmailSettings');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'on'].includes(normalized);
  }
  return false;
};

const normalizeProvider = (value) => (value === 'smtp' ? 'smtp' : 'resend');

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

  const provider = normalizeProvider(settings?.provider || 'resend');
  const fromName = settings?.fromName || '';
  const fromEmail = settings?.fromEmail || '';
  const notifyEmail = String(settings?.notifyEmail || '').trim().toLowerCase();
  const logoUrl = String(settings?.logoUrl || '').trim();
  const smtpHost = String(settings?.smtpHost || '').trim();
  const smtpPort = Number.isFinite(Number(settings?.smtpPort)) ? Number(settings.smtpPort) : null;
  const smtpUser = String(settings?.smtpUser || '').trim();
  const smtpPass = typeof settings?.smtpPass === 'string' ? settings.smtpPass : '';
  const smtpSecure = typeof settings?.smtpSecure === 'boolean' ? settings.smtpSecure : false;

  return {
    provider,
    fromName,
    fromEmail,
    from: buildFromAddress({ fromName, fromEmail }),
    notifyEmail,
    logoUrl,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPass,
    smtpSecure
  };
};

const normalizeSettings = (settings) => {
  if (!settings) {
    return {
      provider: 'resend',
      fromName: '',
      fromEmail: '',
      notifyEmail: '',
      logoUrl: '',
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpSecure: false,
      smtpPassSet: false
    };
  }

  const data = settings.toJSON ? settings.toJSON() : settings;
  return {
    provider: normalizeProvider(data.provider || 'resend'),
    fromName: data.fromName || '',
    fromEmail: data.fromEmail || '',
    notifyEmail: data.notifyEmail || '',
    logoUrl: data.logoUrl || '',
    smtpHost: data.smtpHost || '',
    smtpPort: data.smtpPort || '',
    smtpUser: data.smtpUser || '',
    smtpSecure: Boolean(data.smtpSecure),
    smtpPassSet: Boolean(data.smtpPass)
  };
};

module.exports = {
  parseFromEnv,
  buildFromAddress,
  resolveEmailSettings,
  normalizeSettings
};
