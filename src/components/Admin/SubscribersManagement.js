import React, { useEffect, useState } from 'react';
import styles from './SubscribersManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

const SubscribersManagement = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscribers();
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
              <div className={styles.email}>{subscriber.email}</div>
              <div className={styles.meta}>
                {subscriber.createdAt
                  ? new Date(subscriber.createdAt).toLocaleString()
                  : '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscribersManagement;
