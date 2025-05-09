import React from 'react';
import styles from './DecorativePattern.module.css';
import { FaGithub, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';

const DecorativePattern = () => {
  return (
    <div className={styles.pattern}>
      <div className={styles.grid}>
        {[...Array(50)].map((_, i) => (
          <div key={i} className={styles.dot}></div>
        ))}
      </div>
      <div className={styles.waves}>
        <div className={styles.wave}></div>
        <div className={styles.wave}></div>
        <div className={styles.wave}></div>
      </div>
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle}></div>
        ))}
      </div>
      <div className={styles.socialLinks}>
        <a href="https://github.com/YoussefLehroudd" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaGithub />
        </a>
        <a href="https://wa.me/064481899" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaWhatsapp />
        </a>
        <a href="https://www.instagram.com/youssef___hrd/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaInstagram />
        </a>
        <a href="https://www.linkedin.com/in/youssef-lehroud-51952827b" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaLinkedin />
        </a>
      </div>
    </div>
  );
};

export default DecorativePattern;
