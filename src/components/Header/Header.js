import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="navExtras">
        <div className="logoMark">YL / 2026</div>
        <div className="navStatus">
          <span className="statusDot" aria-hidden="true"></span>
          Open for new collabs
        </div>
      </div>
      <nav className="nav">
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        <a href="#about">Skills</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
};

export default Header;
