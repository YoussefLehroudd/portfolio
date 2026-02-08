import React from 'react';
import styles from './DecorativePattern.module.css';

const navItems = [
  { href: '#about', label: 'About', aria: 'About section' },
  { href: '#projects', label: 'Projects', aria: 'Projects section' },
  { href: '#skills', label: 'Skills', aria: 'Skills section' },
  { href: '#contact', label: 'Contact', aria: 'Contact section' },
];

const MagicNav = ({ onToggleTheme = () => {} }) => (
  <div className={styles.magicNav}>
    {navItems.map(({ href, label, aria }) => (
      <a key={href} href={href} aria-label={aria} data-full-label={label}>
        <span className={styles.navInitial}>{label[0]}</span>
        <span className={styles.navFull}>{label}</span>
      </a>
    ))}
    <button
      type="button"
      className={styles.magicSwitch}
      onClick={onToggleTheme}
      aria-label="Switch to simple theme"
      data-full-label="Switch to simple"
    >
      <span className={styles.navInitial}>S</span>
      <span className={styles.navFull}>Switch to simple</span>
    </button>
  </div>
);

export default MagicNav;
