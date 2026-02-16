import React, { useEffect, useRef } from 'react';
import './Header.css';

const Header = ({ showSwitch = false, isMagicTheme = false, onToggleTheme = () => {} }) => {
  const navRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (!navRef.current) return;
      if (window.innerWidth > 640) {
        navRef.current.scrollLeft = 0;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="header">
      <div className="headerSlot" aria-hidden="true"></div>
      <nav className="nav" ref={navRef}>
        <a href="#about">About</a>
        <a href="#career">Career</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
        {showSwitch && (
          <button
            className="bgToggle navSwitch navSwitchMobile"
            type="button"
            onClick={() => onToggleTheme(!isMagicTheme)}
            aria-label={isMagicTheme ? 'Switch to simple theme' : 'Switch to magic theme'}
          >
            {isMagicTheme ? 'Switch to simple' : 'Switch to magic'}
          </button>
        )}
      </nav>
      <div className="headerSlot headerRight">
      </div>
    </header>
  );
};

export default Header;
