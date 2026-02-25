import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import styles from './ReviewsManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const refreshAbortRef = useRef(null);
  const reviewsChannelRef = useRef(null);

  useEffect(() => {
    const className = 'modal-open';
    if (selectedReview || deleteTarget) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => document.body.classList.remove(className);
  }, [selectedReview, deleteTarget]);

  const getReviewKey = useCallback((review) => {
    const id = review?._id || review?.id || '';
    const updated = review?.updatedAt || review?.createdAt || '';
    return `${id}:${updated}`;
  }, []);

  const isSameReviews = useCallback((prevList, nextList) => {
    if (prevList.length !== nextList.length) return false;
    for (let i = 0; i < prevList.length; i += 1) {
      if (getReviewKey(prevList[i]) !== getReviewKey(nextList[i])) return false;
    }
    return true;
  }, [getReviewKey]);

  const fetchReviews = useCallback(async ({ silent = false } = {}) => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (refreshAbortRef.current) {
      refreshAbortRef.current.abort();
    }
    const controller = new AbortController();
    refreshAbortRef.current = controller;

    if (!silent || !hasLoadedRef.current) {
      setLoading(true);
    }
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      const nextReviews = Array.isArray(data) ? data : [];
      if (requestIdRef.current !== requestId) return;
      setReviews((prev) => (isSameReviews(prev, nextReviews) ? prev : nextReviews));
      hasLoadedRef.current = true;
    } catch (err) {
      if (requestIdRef.current !== requestId) return;
      if (err?.name !== 'AbortError') {
        setError('Could not load reviews.');
      }
    } finally {
      if (requestIdRef.current !== requestId) return;
      setLoading(false);
    }
  }, [isSameReviews]);

  const notifyReviewsUpdated = useCallback(() => {
    if (reviewsChannelRef.current) {
      reviewsChannelRef.current.postMessage({ type: 'reviews:updated', at: Date.now() });
    }
    try {
      localStorage.setItem('reviews:updated', String(Date.now()));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    return () => {
      if (refreshAbortRef.current) {
        refreshAbortRef.current.abort();
      }
    };
  }, [fetchReviews]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return undefined;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const getReviewId = (review) => review?._id || review?.id;

    socket.on('review:new', (review) => {
      const id = getReviewId(review);
      if (!id) return;
      setReviews((prev) => {
        if (prev.some((item) => getReviewId(item) === id)) return prev;
        return [review, ...prev];
      });
    });

    socket.on('connect_error', (socketError) => {
      console.error('Reviews socket connection error:', socketError?.message || socketError);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel('reviews');
      channel.onmessage = (event) => {
        if (event?.data?.type === 'reviews:updated') {
          fetchReviews({ silent: true });
        }
      };
      reviewsChannelRef.current = channel;
    }

    const handleStorage = (event) => {
      if (event.key === 'reviews:updated') {
        fetchReviews({ silent: true });
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      if (reviewsChannelRef.current) {
        reviewsChannelRef.current.close();
        reviewsChannelRef.current = null;
      }
    };
  }, [fetchReviews]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      fetchReviews({ silent: true });
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchReviews]);

  useEffect(() => {
    const handleFocus = () => fetchReviews({ silent: true });
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchReviews]);

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews;
    return reviews.filter((review) => review.status === filter);
  }, [reviews, filter]);

  const updateStatus = async (review, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/reviews/${review._id || review.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      const updated = await response.json();
      setReviews((prev) =>
        prev.map((item) =>
          (item._id || item.id) === (updated._id || updated.id) ? updated : item
        )
      );
      notifyReviewsUpdated();
    } catch (err) {
      setError('Could not update review.');
    }
  };

  const handleDelete = (review) => {
    setDeleteTarget(review);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/reviews/${deleteTarget._id || deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      setReviews((prev) =>
        prev.filter((item) => (item._id || item.id) !== (deleteTarget._id || deleteTarget.id))
      );
      if (selectedReview && (selectedReview._id || selectedReview.id) === (deleteTarget._id || deleteTarget.id)) {
        setSelectedReview(null);
      }
      notifyReviewsUpdated();
    } catch (err) {
      setError('Could not delete review.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  };

  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length
  };

  if (loading) {
    return <AdminSkeleton compact rows={6} cards={3} showActions={false} />;
  }

  return (
    <section className={styles.reviewsManagement}>
      <div className={styles.header}>
        <div>
          <h2>Reviews</h2>
          <p className={styles.subtitle}>Approve reviews before they show on the public page.</p>
        </div>
        <div className={styles.filters}>
          {['all', 'pending', 'approved', 'rejected'].map((item) => (
            <button
              key={item}
              className={`${styles.filterBtn} ${filter === item ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
              <span>{counts[item]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {filtered.length === 0 ? (
        <div className={styles.empty}>No reviews found.</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((review) => (
            <div
              key={review._id || review.id}
              className={styles.card}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedReview(review)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedReview(review);
                }
              }}
            >
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {review.imageUrl ? (
                    <img src={review.imageUrl} alt={review.name} />
                  ) : (
                    <div className={styles.avatarFallback}>
                      <span>{getInitials(review.name)}</span>
                    </div>
                  )}
                </div>
                <div className={styles.identity}>
                  <h4>{review.name}</h4>
                  <span className={`${styles.badge} ${styles[`status${review.status}`]}`}>
                    {review.status}
                  </span>
                </div>
              </div>
              <p className={styles.message}>{review.message}</p>
              <div className={styles.meta}>
                <span>{new Date(review.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles.actions}>
                {review.status !== 'approved' && (
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(review, 'approved'); }} className={styles.approve}>
                    Approve
                  </button>
                )}
                {review.status !== 'rejected' && (
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(review, 'rejected'); }} className={styles.reject}>
                    Reject
                  </button>
                )}
                {review.status !== 'pending' && (
                  <button onClick={(e) => { e.stopPropagation(); updateStatus(review, 'pending'); }} className={styles.pending}>
                    Unpublish
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(review); }} className={styles.delete}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReview && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReview(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalAvatar}>
                {selectedReview.imageUrl ? (
                  <img src={selectedReview.imageUrl} alt={selectedReview.name} />
                ) : (
                  <div className={styles.avatarFallback}>
                    <span>{getInitials(selectedReview.name)}</span>
                  </div>
                )}
              </div>
              <div className={styles.modalIdentity}>
                <h3>{selectedReview.name}</h3>
                <span className={styles.modalDate}>
                  {new Date(selectedReview.createdAt).toLocaleString()}
                </span>
                <span className={`${styles.badge} ${styles[`status${selectedReview.status}`]}`}>
                  {selectedReview.status}
                </span>
              </div>
              <button className={styles.modalClose} onClick={() => setSelectedReview(null)} type="button">
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>{selectedReview.message}</p>
            </div>
            <div className={styles.modalActions}>
              {selectedReview.status !== 'approved' && (
                <button onClick={() => updateStatus(selectedReview, 'approved')} className={styles.approve}>
                  Approve
                </button>
              )}
              {selectedReview.status !== 'rejected' && (
                <button onClick={() => updateStatus(selectedReview, 'rejected')} className={styles.reject}>
                  Reject
                </button>
              )}
              {selectedReview.status !== 'pending' && (
                <button onClick={() => updateStatus(selectedReview, 'pending')} className={styles.pending}>
                  Unpublish
                </button>
              )}
              <button onClick={() => handleDelete(selectedReview)} className={styles.delete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>Delete review?</h3>
            <p>
              This will permanently remove the review from your dashboard and the public page.
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmCancel} onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className={styles.confirmDelete} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReviewsManagement;
