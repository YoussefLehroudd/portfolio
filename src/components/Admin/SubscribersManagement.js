import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import styles from './SubscribersManagement.module.css';
import AdminSkeleton from './AdminSkeleton';
import DeleteModal from './DeleteModal';

const SubscribersManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [savingId, setSavingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return undefined;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const getSubscriberId = (subscriber) => subscriber?._id || subscriber?.id || subscriber?.email;

    socket.on('subscriber:new', (subscriber) => {
      const id = getSubscriberId(subscriber);
      if (!id) return;
      setSubscribers((prev) => {
        if (prev.some((item) => getSubscriberId(item) === id)) return prev;
        return [subscriber, ...prev];
      });
    });

    socket.on('connect_error', (socketError) => {
      console.error('Subscriber socket connection error:', socketError?.message || socketError);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/subscribers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscribers(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to fetch subscribers');
      }
    } catch (err) {
      setError('Error loading subscribers');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (subscriber) => {
    const id = subscriber?._id || subscriber?.id || '';
    if (!id) return;
    setEditingId(id);
    setEditingEmail(subscriber.email || '');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId('');
    setEditingEmail('');
  };

  const saveEdit = async (subscriber) => {
    const id = subscriber?._id || subscriber?.id || '';
    const nextEmail = editingEmail.trim().toLowerCase();
    if (!id) return;
    if (!emailRegex.test(nextEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSavingId(id);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/subscribers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: nextEmail })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to update subscriber');
      }

      const updated = await response.json();
      setSubscribers((prev) =>
        prev.map((item) =>
          (item._id || item.id) === (updated._id || updated.id)
            ? { ...item, ...updated }
            : item
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err?.message || 'Failed to update subscriber.');
    } finally {
      setSavingId('');
    }
  };

  const requestDelete = (subscriber) => {
    if (!subscriber) return;
    setDeleteTarget(subscriber);
  };

  const confirmDelete = async () => {
    const id = deleteTarget?._id || deleteTarget?.id || '';
    if (!id) {
      setDeleteTarget(null);
      return;
    }
    try {
      setDeletingId(id);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/subscribers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete subscriber');
      }

      setSubscribers((prev) => prev.filter((item) => (item._id || item.id) !== id));
      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      setError(err?.message || 'Failed to delete subscriber.');
    } finally {
      setDeletingId('');
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <AdminSkeleton rows={6} showActions={false} />;
  }

  return (
    <div className={styles.subscribersManagement}>
      <div className={styles.header}>
        <div>
          <h2>Subscribers</h2>
          <p className={styles.subtitle}>All newsletter emails collected from your site.</p>
        </div>
        <div className={styles.countPill}>{subscribers.length} total</div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {subscribers.length === 0 ? (
        <div className={styles.empty}>No subscribers yet.</div>
      ) : (
        <div className={styles.list}>
          {subscribers.map((subscriber) => (
            <div key={subscriber._id || subscriber.id || subscriber.email} className={styles.item}>
              <div className={styles.email}>
                {editingId === (subscriber._id || subscriber.id) ? (
                  <input
                    type="email"
                    value={editingEmail}
                    onChange={(event) => setEditingEmail(event.target.value)}
                    className={styles.editInput}
                    placeholder="Email"
                    disabled={savingId === (subscriber._id || subscriber.id)}
                  />
                ) : (
                  subscriber.email
                )}
              </div>
              <div className={styles.meta}>
                {subscriber.createdAt
                  ? new Date(subscriber.createdAt).toLocaleString()
                  : '—'}
              </div>
              <div className={styles.actions}>
                {editingId === (subscriber._id || subscriber.id) ? (
                  <>
                    <button
                      type="button"
                      className={styles.saveButton}
                      onClick={() => saveEdit(subscriber)}
                      disabled={savingId === (subscriber._id || subscriber.id)}
                    >
                      {savingId === (subscriber._id || subscriber.id) ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={cancelEdit}
                      disabled={savingId === (subscriber._id || subscriber.id)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEdit(subscriber)}
                      disabled={deletingId === (subscriber._id || subscriber.id)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => requestDelete(subscriber)}
                      disabled={deletingId === (subscriber._id || subscriber.id)}
                    >
                      {deletingId === (subscriber._id || subscriber.id) ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        message="Delete this subscriber? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default SubscribersManagement;
