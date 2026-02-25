import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './SeoPreviewModal.module.css';

const resolvePreviewImage = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (typeof window === 'undefined') return value;
  const origin = window.location.origin || '';
  if (!origin) return value;
  if (value.startsWith('/')) return `${origin}${value}`;
  return `${origin}/${value}`;
};

const SeoPreviewModal = ({ isOpen, onClose, title, description, image, url }) => {
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

  const resolvedImage = resolvePreviewImage(image || '');
  const safeTitle = title || 'Your SEO title';
  const safeDescription = description || 'Your SEO description will appear here.';
  const safeUrl = url || 'https://yourdomain.com';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>SEO Preview</p>
            <h3 className={styles.title}>How it will appear</h3>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close preview">
            <FaTimes />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.previewSection}>
            <div className={styles.sectionTitle}>Search Preview</div>
            <div className={styles.searchCard}>
              <div className={styles.searchUrl}>{safeUrl}</div>
              <div className={styles.searchTitle}>{safeTitle}</div>
              <div className={styles.searchDescription}>{safeDescription}</div>
            </div>
          </div>

          <div className={styles.previewSection}>
            <div className={styles.sectionTitle}>Social Preview</div>
            <div className={styles.socialCard}>
              <div className={styles.socialImage}>
                {resolvedImage ? (
                  <img src={resolvedImage} alt="OG preview" />
                ) : (
                  <div className={styles.imagePlaceholder}>No image</div>
                )}
              </div>
              <div className={styles.socialContent}>
                <div className={styles.socialTitle}>{safeTitle}</div>
                <div className={styles.socialDescription}>{safeDescription}</div>
                <div className={styles.socialUrl}>{safeUrl}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoPreviewModal;
