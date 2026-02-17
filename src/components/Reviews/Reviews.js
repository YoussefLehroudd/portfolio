import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Reviews.module.css';

const Reviews = ({ isMagicTheme = false }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', message: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState('');
  const [crop, setCrop] = useState({ scale: 1, x: 0, y: 0 });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [avatars, setAvatars] = useState([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [selectedAvatarId, setSelectedAvatarId] = useState('');
  const previewRef = useRef(null);
  const modalPreviewRef = useRef(null);
  const openPreviewRef = useRef(false);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    boundsEl: null
  });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews`);
        if (response.ok) {
          const data = await response.json();
          const nextReviews = Array.isArray(data) ? data : [];
          setReviews(nextReviews);
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/avatars`);
        if (response.ok) {
          const data = await response.json();
          setAvatars(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Error fetching avatars:', error);
      } finally {
        setAvatarsLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  useEffect(() => {
    if (!reviews.length || isPaused) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      setCrop({ scale: 1, x: 0, y: 0 });
      setIsDraggingCrop(false);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);
    if (openPreviewRef.current) {
      setImageModalUrl(objectUrl);
      openPreviewRef.current = false;
    }
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const initials = useMemo(() => {
    const parts = form.name.trim().split(' ').filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  }, [form.name]);

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (status.type) setStatus({ type: '', text: '' });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageFile(null);
      return;
    }
    setImageFile(file);
    setCrop({ scale: 1, x: 0, y: 0 });
    setSelectedAvatarId('');
    openPreviewRef.current = true;
  };

  const handleCropChange = (key, value) => {
    setCrop((prev) => ({ ...prev, [key]: value }));
  };

  const createCroppedBlob = (src, cropState) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.fillStyle = '#0b0f12';
      ctx.fillRect(0, 0, size, size);

      const baseScale = Math.max(size / img.width, size / img.height);
      const scale = baseScale * cropState.scale;
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = (cropState.x / 100) * size;
      const offsetY = (cropState.y / 100) * size;
      const dx = (size - drawW) / 2 + offsetX;
      const dy = (size - drawH) / 2 + offsetY;

      ctx.drawImage(img, dx, dy, drawW, drawH);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to crop image'));
      }, 'image/png', 0.92);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const handlePreviewPointerDown = (event, targetRef) => {
    if (!imagePreview) return;
    event.preventDefault();
    const boundsEl = targetRef?.current;
    if (!boundsEl) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: crop.x,
      originY: crop.y,
      moved: false,
      boundsEl
    };
    setIsDraggingCrop(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePreviewPointerMove = (event) => {
    if (!dragRef.current.active) return;
    const boundsEl = dragRef.current.boundsEl;
    if (!boundsEl) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      dragRef.current.moved = true;
    }
    const rect = boundsEl.getBoundingClientRect();
    const shiftX = (dx / rect.width) * 100;
    const shiftY = (dy / rect.height) * 100;
    const nextX = clamp(dragRef.current.originX + shiftX, -45, 45);
    const nextY = clamp(dragRef.current.originY + shiftY, -45, 45);
    setCrop((prev) => ({ ...prev, x: nextX, y: nextY }));
  };

  const handlePreviewPointerUp = (event) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDraggingCrop(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const message = form.message.trim();

    if (!name || !message) {
      setStatus({ type: 'error', text: 'Please add your full name and message.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', text: '' });

    try {
      const payload = new FormData();
      payload.append('name', name);
      payload.append('message', message);
      if (imageFile && imagePreview) {
        try {
          const blob = await createCroppedBlob(imagePreview, crop);
          const fileName = imageFile.name || 'review-avatar.png';
          const croppedFile = new File([blob], fileName, { type: 'image/png' });
          payload.append('image', croppedFile);
        } catch (error) {
          payload.append('image', imageFile);
        }
      } else if (imageFile) {
        payload.append('image', imageFile);
      } else if (selectedAvatarId) {
        payload.append('avatarId', selectedAvatarId);
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews`, {
        method: 'POST',
        body: payload
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      setForm({ name: '', message: '' });
      setImageFile(null);
      setSelectedAvatarId('');
      setStatus({ type: 'success', text: 'Review sent! It will appear after approval.' });
    } catch (error) {
      console.error('Review submit error:', error);
      setStatus({ type: 'error', text: 'Could not send your review. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeReview = reviews[currentIndex] || null;
  const isEditingPreview = imageModalUrl && imageModalUrl === imagePreview;
  const selectedAvatar = avatars.find((avatar) => (avatar._id || avatar.id) === selectedAvatarId);
  const previewImage = imagePreview || selectedAvatar?.imageUrl || '';

  const goNext = () => {
    if (!reviews.length) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const goPrev = () => {
    if (!reviews.length) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <section id="reviews" className={`${styles.reviews} ${isMagicTheme ? styles.magic : ''}`}>
      <div className={styles.container}>
        <div className={styles.heading}>
          <p className={styles.kicker}>User Reviews</p>
          <h2>Share your experience</h2>
          <p className={styles.subtitle}>
            Send a short review with your name and photo. I approve it first, then it appears on this page.
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h3>Approved Reviews</h3>
              <span className={styles.count}>{loading ? '...' : reviews.length}</span>
            </div>
            {loading ? (
              <div className={styles.skeletonGrid}>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={`review-skeleton-${idx}`} className={`${styles.reviewCard} ${styles.skeleton}`} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className={styles.emptyState}>
                No reviews yet. Be the first to leave one.
              </div>
            ) : (
              <div
                className={styles.carousel}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <button className={styles.navButton} type="button" onClick={goPrev} aria-label="Previous review">
                  <span className={styles.navIcon}>‹</span>
                </button>
                {activeReview && (
                  <div className={styles.reviewCard}>
                    <button
                      type="button"
                      className={styles.avatarButton}
                      onClick={() => activeReview.imageUrl && setImageModalUrl(activeReview.imageUrl)}
                      aria-label="Open reviewer image"
                    >
                      <div className={styles.avatar}>
                        {activeReview.imageUrl ? (
                          <img src={activeReview.imageUrl} alt={activeReview.name} />
                        ) : (
                          <div className={styles.avatarFallback}>
                            <span>{getInitials(activeReview.name)}</span>
                          </div>
                        )}
                      </div>
                    </button>
                    <div className={styles.reviewContent}>
                      <div className={styles.reviewHeader}>
                        <h4>{activeReview.name}</h4>
                        <span className={styles.reviewDate}>
                          {new Date(activeReview.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p>{activeReview.message}</p>
                    </div>
                  </div>
                )}
                <button className={styles.navButton} type="button" onClick={goNext} aria-label="Next review">
                  <span className={styles.navIcon}>›</span>
                </button>
              </div>
            )}
            {!loading && reviews.length > 1 && (
              <div className={styles.dots}>
                {reviews.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to review ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className={styles.formPanel}>
            <div className={styles.formHeader}>
              <h3>Leave a Review</h3>
              <p>Optional photo + message. Your review will appear after approval.</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.label} htmlFor="review-name">Full Name</label>
              <input
                id="review-name"
                name="name"
                type="text"
                className={styles.input}
                value={form.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />

              <label className={styles.label} htmlFor="review-message">Message</label>
              <textarea
                id="review-message"
                name="message"
                className={styles.textarea}
                value={form.message}
                onChange={handleInputChange}
                placeholder="Write your review..."
                required
              />

              <div className={styles.uploadRow}>
                <button
                  type="button"
                  className={styles.uploadPreviewButton}
                  onClick={() => {
                    if (dragRef.current.moved) {
                      dragRef.current.moved = false;
                      return;
                    }
                    if (previewImage) setImageModalUrl(previewImage);
                  }}
                  onPointerDown={(event) => handlePreviewPointerDown(event, previewRef)}
                  onPointerMove={handlePreviewPointerMove}
                  onPointerUp={handlePreviewPointerUp}
                  aria-label="Open photo preview"
                  ref={previewRef}
                  data-dragging={isDraggingCrop}
                  data-enabled={Boolean(imagePreview)}
                >
                  <div className={styles.uploadPreview}>
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        style={{
                          transform: `translate(${crop.x}%, ${crop.y}%) scale(${crop.scale})`
                        }}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        <span>{initials || 'U'}</span>
                      </div>
                    )}
                  </div>
                </button>
                <label className={styles.uploadButton}>
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                  <span>{imageFile ? 'Change photo' : 'Upload photo (optional)'}</span>
                </label>
              </div>
              {previewImage && !imagePreview && (
                <div className={styles.cropHint}>Selected avatar</div>
              )}
              {imagePreview && (
                <div className={styles.cropHint}>Drag the circle to position your photo.</div>
              )}
              <div className={styles.avatarPicker}>
                <div className={styles.avatarPickerHeader}>
                  <span>Choose an avatar</span>
                  {avatarsLoading && <span className={styles.avatarHint}>Loading...</span>}
                </div>
                <div className={styles.avatarList}>
                  {avatars.map((avatar) => {
                    const id = avatar._id || avatar.id;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={`${styles.avatarOption} ${id === selectedAvatarId ? styles.avatarOptionActive : ''}`}
                        onClick={() => {
                          setSelectedAvatarId(id);
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        <img src={avatar.imageUrl} alt={avatar.label || 'avatar'} />
                      </button>
                    );
                  })}
                  {!avatarsLoading && avatars.length === 0 && (
                    <div className={styles.avatarEmpty}>No avatars yet.</div>
                  )}
                </div>
              </div>

              {status.text && (
                <div className={status.type === 'error' ? styles.error : styles.success}>
                  {status.text}
                </div>
              )}

              <button className={styles.submitButton} type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Review'}
                <span className={styles.submitArrow}>↗</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {imageModalUrl && (
        <div className={styles.imageModalOverlay} onClick={() => setImageModalUrl('')}>
          <div className={styles.imageModalWrap} onClick={(e) => e.stopPropagation()}>
            <div
              className={styles.imageModal}
              ref={modalPreviewRef}
              onPointerDown={isEditingPreview ? (event) => handlePreviewPointerDown(event, modalPreviewRef) : undefined}
              onPointerMove={isEditingPreview ? handlePreviewPointerMove : undefined}
              onPointerUp={isEditingPreview ? handlePreviewPointerUp : undefined}
              data-dragging={isEditingPreview && isDraggingCrop}
            >
              <img
                src={imageModalUrl}
                alt="Reviewer"
                style={
                  isEditingPreview
                    ? { transform: `translate(${crop.x}%, ${crop.y}%) scale(${crop.scale})` }
                    : undefined
                }
              />
              <button className={styles.imageModalClose} type="button" onClick={() => setImageModalUrl('')}>
                ×
              </button>
            </div>
            {isEditingPreview && (
              <div className={styles.cropControlsInline}>
                <label htmlFor="crop-zoom">Zoom</label>
                <input
                  id="crop-zoom"
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={crop.scale}
                  onChange={(e) => handleCropChange('scale', Number(e.target.value))}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Reviews;
