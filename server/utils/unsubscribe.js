const jwt = require('jsonwebtoken');

const createUnsubscribeToken = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !process.env.JWT_SECRET) return '';
  return jwt.sign({ email: normalized }, process.env.JWT_SECRET, { expiresIn: '365d' });
};

const verifyUnsubscribeToken = (token) => {
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = typeof decoded?.email === 'string' ? decoded.email.trim().toLowerCase() : '';
    return email || null;
  } catch (error) {
    return null;
  }
};

const buildUnsubscribeUrl = (siteUrl, token) => {
  const base = String(siteUrl || '').replace(/\/$/, '');
  if (!base || !token) return '';
  return `${base}/api/subscribers/unsubscribe?token=${encodeURIComponent(token)}`;
};

module.exports = {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl
};
