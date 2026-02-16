import React from 'react';
import styles from './Hero.module.css';

const HeroMarquee = ({ isMagicTheme = false }) => {
  if (isMagicTheme) return null;

  const marqueeItems = [
    { logo: '<>', text: 'Crafted UI Systems' },
    { logo: 'JS', text: 'Clean JavaScript' },
    { logo: 'API', text: 'Secure REST APIs' },
    { logo: 'UI', text: 'Pixel-perfect UX' },
    { logo: '3D', text: 'Interactive Motion' },
    { logo: 'DB', text: 'Fast Data Layers' },
    { logo: 'TS', text: 'Typed Components' },
    { logo: 'DX', text: 'Developer Experience' }
  ];

  const repeatedMarquee = [...marqueeItems, ...marqueeItems];

  return (
    <div className={styles.heroMarquee} aria-hidden="true">
      <div className={styles.heroMarqueeTrack}>
        {repeatedMarquee.map((item, idx) => (
          <div key={`${item.logo}-${idx}`} className={styles.heroMarqueeItem}>
            <span className={styles.heroMarqueeLogo}>{item.logo}</span>
            <span className={styles.heroMarqueeText}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroMarquee;
