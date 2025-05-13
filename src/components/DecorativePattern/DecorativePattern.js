import React, { useState, useEffect } from 'react';
import styles from './DecorativePattern.module.css';
import { FaGithub, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';

const DecorativePattern = () => {
  const [socialLinks, setSocialLinks] = useState({
    github: 'https://github.com',
    whatsapp: 'https://wa.me',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com'
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/social`);
        if (response.ok) {
          const data = await response.json();
          setSocialLinks(data);
        }
      } catch (error) {
        console.error('Error fetching social links:', error);
      }
    };

    fetchSocialLinks();
  }, []);

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
        <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaGithub />
        </a>
        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaWhatsapp />
        </a>
        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaInstagram />
        </a>
        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
          <FaLinkedin />
        </a>
      </div>
    </div>
  );
};

export default DecorativePattern;
