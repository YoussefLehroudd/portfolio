import React from 'react';
import styles from './SlantedTicker.module.css';

const topItems = [
  'Product-led full stack builds',
  'Pixel-perfect UI delivery',
  'Performance-first frontends',
  'Secure API design',
  'Realtime-ready systems',
  'Clean, scalable codebases',
  'UX motion that feels premium',
];

const bottomItems = [
  'Design systems that scale',
  'Motion with intent',
  'Ship faster without quality loss',
  'API-first architecture',
  'Growth-ready foundations',
  'Battle-tested CI/CD',
  'Accessibility built-in',
];

const renderTrack = (items, reverse = false) => {
  const loopItems = [...items, ...items];
  return (
    <div className={`${styles.ribbonTrack} ${reverse ? styles.reverse : ''}`}>
      {loopItems.map((text, index) => (
        <React.Fragment key={`${text}-${index}`}>
          <span className={styles.ribbonText}>{text}</span>
          <span className={styles.separator} aria-hidden="true">•</span>
        </React.Fragment>
      ))}
    </div>
  );
};

const SlantedTicker = () => {
  return (
    <section
      className={`${styles.ribbonSection} reveal-up`}
      data-reveal
      style={{ '--reveal-delay': '0.08s' }}
      aria-label="Highlights ticker"
    >
      <div className={`${styles.ribbonStrap} ${styles.strapOne}`}>
        <div className={styles.ribbonContent}>
          {renderTrack(topItems)}
        </div>
      </div>
      <div className={`${styles.ribbonStrap} ${styles.strapTwo}`}>
        <div className={styles.ribbonContent}>
          {renderTrack(bottomItems, true)}
        </div>
      </div>
    </section>
  );
};

export default SlantedTicker;
