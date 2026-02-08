import React from 'react';
import styles from './Loading.module.css';

const Loading = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.energyRing}>
      <div className={styles.ring}></div>
      <div className={styles.ring}></div>
      <div className={styles.ring}></div>
      <div className={styles.core}></div>
    </div>
    <div className={styles.loadingText}>
      <span>I</span>
      <span>N</span>
      <span>I</span>
      <span>T</span>
      <span>I</span>
      <span>A</span>
      <span>L</span>
      <span>I</span>
      <span>Z</span>
      <span>I</span>
      <span>N</span>
      <span>G</span>
    </div>
  </div>
);

export default Loading;
