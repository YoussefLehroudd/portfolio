const rawBaseUrl = (process.env.REACT_APP_API_URL || '').trim();

// Remove trailing slash to avoid double slashes when joining paths
const normalizedBase = rawBaseUrl.endsWith('/')
  ? rawBaseUrl.slice(0, -1)
  : rawBaseUrl;

/**
 * Build a full API URL using the configured base.
 * Falls back to same-origin relative paths when no base is provided.
 */
export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};

export const API_BASE_URL = normalizedBase;

