const { Resend } = require('resend');
const Subscriber = require('../models/Subscriber');
const { resolveEmailSettings } = require('./emailSettings');

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const escapeHtml = (value = '') => (
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
);

const getSiteUrl = (req) => {
  if (!req || typeof req.get !== 'function') return '';
  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  const protocol = forwardedProto || req.protocol || 'https';
  const host = forwardedHost || req.get('host') || '';
  if (!host) return '';
  return `${protocol}://${host}`.replace(/\/$/, '');
};

const resolveImageUrl = (image, siteUrl) => {
  if (!image) return '';
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (!siteUrl) return '';
  return image.startsWith('/') ? `${siteUrl}${image}` : `${siteUrl}/${image}`;
};

const renderLayout = ({ fromName, title, bodyHtml, ctaLabel, ctaUrl, secondaryCtaLabel, secondaryCtaUrl, logoUrl }) => {
  const safeTitle = escapeHtml(title);
  const safeFromName = escapeHtml(fromName || '');
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : '';
  const headerBlock = (safeLogoUrl || safeFromName) ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 12px;">
      <tr>
        ${safeLogoUrl ? `<td style="padding-right: 10px; vertical-align: middle;">
          <img src="${safeLogoUrl}" alt="${safeFromName || 'Logo'}" style="height: 32px; width: auto; display: block;" />
        </td>` : ''}
        ${safeFromName ? `<td style="vertical-align: middle;">
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; color: #0f766e;">${safeFromName}</div>
        </td>` : ''}
      </tr>
    </table>
  ` : '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6; padding: 24px 0;" bgcolor="#f3f4f6">
      <tr>
        <td align="center" style="padding: 0 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;" bgcolor="#ffffff">
            <tr>
              <td style="padding: 26px 22px; font-family: Arial, sans-serif; color:#111827;">
                ${headerBlock}
                <h1 style="margin: 0 0 16px; font-size: 24px; line-height: 1.25; color:#111827;">${safeTitle}</h1>
                <div style="font-size: 15px; line-height: 1.6; color: #374151;">
                  ${bodyHtml}
                </div>
                ${(ctaUrl || secondaryCtaUrl) ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                    <tr>
                      ${ctaUrl ? `
                        <td bgcolor="#0f766e" style="border-radius: 10px;">
                          <a href="${ctaUrl}" style="display: inline-block; padding: 12px 18px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; border-radius: 10px;">
                            ${escapeHtml(ctaLabel || 'View update')}
                          </a>
                        </td>
                      ` : ''}
                      ${ctaUrl && secondaryCtaUrl ? `<td width="10"></td>` : ''}
                      ${secondaryCtaUrl ? `
                        <td bgcolor="#ffffff" style="border-radius: 10px; border: 1px solid #e5e7eb;">
                          <a href="${secondaryCtaUrl}" style="display: inline-block; padding: 12px 18px; color: #111827; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 10px;">
                            ${escapeHtml(secondaryCtaLabel || 'Learn more')}
                          </a>
                        </td>
                      ` : ''}
                    </tr>
                  </table>
                ` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 22px; background-color:#f9fafb; color:#6b7280; font-size: 12px; font-family: Arial, sans-serif;" bgcolor="#f9fafb">
                You are receiving this because you subscribed for updates.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `.trim();
};

const sendToSubscribers = async ({ subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    return { skipped: 'missing_api_key' };
  }

  const { from } = await resolveEmailSettings();
  if (!from) {
    return { skipped: 'missing_from' };
  }

  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  const recipients = subscribers
    .map((sub) => sub?.email)
    .filter(Boolean);

  if (!recipients.length) {
    return { skipped: 'no_subscribers' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const messages = recipients.map((email) => ({
    from,
    to: [email],
    subject,
    html
  }));

  const chunks = chunkArray(messages, 100);
  for (const chunk of chunks) {
    const { error } = await resend.batch.send(chunk);
    if (error) {
      console.error('Resend batch send error:', error);
    }
  }

  return { sent: recipients.length };
};

const renderProjectEmail = (project, { siteUrl, fromName, logoUrl }) => {
  const imageUrl = resolveImageUrl(project?.image || '', siteUrl);
  const resolvedLogoUrl = resolveImageUrl(logoUrl || '', siteUrl);
  const rawDescription = String(project?.description || '');
  const snippet = rawDescription.length > 240 ? `${rawDescription.slice(0, 240)}...` : rawDescription;
  const preview = escapeHtml(snippet);
  const technologies = Array.isArray(project?.technologies) ? project.technologies : [];
  const stackPreview = technologies.slice(0, 6).join(', ');
  const stackSuffix = technologies.length > 6 ? ` +${technologies.length - 6} more` : '';

  const details = `
    <div style="margin-top: 12px;">
      ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(project?.title || 'Project')}" width="560" style="width: 100%; max-width: 560px; height: auto; border-radius: 14px; margin: 0 0 16px; display: block; border: 0; outline: none;" />` : ''}
      <p style="margin: 0 0 12px;">${preview || 'A new project is now live.'}</p>
      <div style="padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f9fafb; color: #111827;">
        ${project?.type ? `<div style="margin-bottom: 6px;"><strong>Type:</strong> ${escapeHtml(project.type)}</div>` : ''}
        ${project?.category ? `<div style="margin-bottom: 6px;"><strong>Category:</strong> ${escapeHtml(project.category)}</div>` : ''}
        ${project?.timeline ? `<div style="margin-bottom: 6px;"><strong>Timeline:</strong> ${escapeHtml(project.timeline)}</div>` : ''}
        ${stackPreview ? `<div><strong>Stack:</strong> ${escapeHtml(stackPreview)}${escapeHtml(stackSuffix)}</div>` : ''}
      </div>
    </div>
  `;

  return renderLayout({
    fromName,
    title: `New project: ${project?.title || 'Just launched'}`,
    bodyHtml: details,
    ctaLabel: 'See the new project',
    ctaUrl: siteUrl ? `${siteUrl}/#projects` : (project?.demoLink || ''),
    secondaryCtaLabel: siteUrl && project?.demoLink ? 'Open demo' : '',
    secondaryCtaUrl: siteUrl && project?.demoLink ? project.demoLink : '',
    logoUrl: resolvedLogoUrl
  });
};

const renderCareerEmail = (items, { siteUrl, fromName, logoUrl }) => {
  const resolvedLogoUrl = resolveImageUrl(logoUrl || '', siteUrl);
  const cards = items.map((item) => {
    const tags = Array.isArray(item?.tags) && item.tags.length
      ? `<div style="margin-top: 6px; color: #0f766e; font-size: 12px;">${escapeHtml(item.tags.join(' · '))}</div>`
      : '';
    return `
      <div style="padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 12px; background: #f9fafb; color: #111827;">
        <div style="font-weight: 700; color: #111827;">${escapeHtml(item.title || 'New role')}</div>
        <div style="color: #374151; font-size: 14px; margin-top: 2px;">${escapeHtml(item.place || '')}</div>
        <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">${escapeHtml(item.period || '')}</div>
        ${item.description ? `<p style="margin: 8px 0 0; color: #4b5563;">${escapeHtml(item.description)}</p>` : ''}
        ${tags}
      </div>
    `;
  }).join('');

  return renderLayout({
    fromName,
    title: 'New career update',
    bodyHtml: `
      <p style="margin: 0 0 12px;">I just added a new milestone to my career timeline.</p>
      ${cards}
    `,
    ctaLabel: 'View the update',
    ctaUrl: siteUrl ? `${siteUrl}/#career` : '',
    logoUrl: resolvedLogoUrl
  });
};

module.exports = {
  escapeHtml,
  getSiteUrl,
  resolveImageUrl,
  sendToSubscribers,
  renderProjectEmail,
  renderCareerEmail
};
