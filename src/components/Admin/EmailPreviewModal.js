import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './EmailPreviewModal.module.css';

const EmailPreviewModal = ({
  isOpen,
  onClose,
  subject,
  html,
  text,
  mode,
  onModeChange,
  loading,
  error
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollBarGap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollBarGap > 0) {
      body.style.paddingRight = `${scrollBarGap}px`;
    }
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Email Preview</p>
            <h3 className={styles.title}>{subject || 'Project announcement'}</h3>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close preview">
            <FaTimes />
          </button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabButton} ${mode === 'html' ? styles.tabActive : ''}`}
              onClick={() => onModeChange('html')}
            >
              HTML
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${mode === 'text' ? styles.tabActive : ''}`}
              onClick={() => onModeChange('text')}
            >
              Text
            </button>
          </div>
          <span className={styles.helper}>
            Review the exact template before sending.
          </span>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={styles.state}>Loading preview...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : mode === 'text' ? (
            <pre className={styles.textPreview}>{text || 'No text preview available.'}</pre>
          ) : (
            <iframe
              title="Email HTML Preview"
              className={styles.iframe}
              sandbox=""
              srcDoc={html || '<p style="font-family: Arial, sans-serif;">No HTML preview available.</p>'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailPreviewModal;
