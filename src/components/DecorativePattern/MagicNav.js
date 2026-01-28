import React from 'react';
import styles from './DecorativePattern.module.css';

const MagicNav = ({ onToggleTheme = () => {} }) => (
  <div className={styles.magicNav}>
    <a href="#about" aria-label="About section">About</a>
    <a href="#projects" aria-label="Projects section">Projects</a>
    <a href="#skills" aria-label="Skills section">Skills</a>
    <a href="#contact" aria-label="Contact section">Contact</a>
    <button type="button" className={styles.magicSwitch} onClick={onToggleTheme}>
      Switch to simple
    </button>
  </div>
);

export default MagicNav;
