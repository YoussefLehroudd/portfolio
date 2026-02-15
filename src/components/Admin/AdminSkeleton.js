import React from 'react';
import styles from './AdminSkeleton.module.css';

const AdminSkeleton = ({
  cards = 3,
  rows = 6,
  showActions = true,
  compact = false
}) => {
  const cardItems = Array.from({ length: cards });
  const rowItems = Array.from({ length: rows });

  return (
    <div className={`${styles.shell} ${compact ? styles.compact : ''}`}>
      <div className={`${styles.title} skeleton`} />

      <div className={styles.cards}>
        {cardItems.map((_, index) => (
          <div key={`admin-skeleton-card-${index}`} className={styles.card}>
            <div className={`${styles.cardLine} skeleton`} />
            <div className={`${styles.cardLine} ${styles.cardLineShort} skeleton`} />
          </div>
        ))}
      </div>

      <div className={styles.form}>
        {rowItems.map((_, index) => (
          <div
            key={`admin-skeleton-row-${index}`}
            className={`${styles.input} skeleton`}
          />
        ))}
        <div className={`${styles.textarea} skeleton`} />
      </div>

      {showActions && (
        <div className={styles.actions}>
          <div className={`${styles.button} skeleton`} />
          <div className={`${styles.button} ${styles.buttonGhost} skeleton`} />
        </div>
      )}
    </div>
  );
};

export default AdminSkeleton;
