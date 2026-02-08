import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaGithub, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './GradientBackground.css';

const GradientBackground = () => {
  const location = useLocation();
  const hideSocial = location.pathname.startsWith('/admin');
  const [socialLinks, setSocialLinks] = useState({
    github: 'https://github.com',
    whatsapp: 'https://wa.me',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com'
  });
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [scrambledLabels, setScrambledLabels] = useState({
    github: 'GitHub',
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    linkedin: 'LinkedIn'
  });
  const scrambleFrame = useRef(null);

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

  const lastChangeRef = useRef({});

  const startScramble = (key, target) => {
    cancelAnimationFrame(scrambleFrame.current || 0);
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    const duration = 900;
    const start = performance.now();
    lastChangeRef.current[key] = start;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // smooth ease-out
      const revealCount = Math.floor(eased * target.length);

      // throttle random swaps for smoother effect
      if (now - (lastChangeRef.current[key] || 0) < 70 && progress < 1) {
        scrambleFrame.current = requestAnimationFrame(step);
        return;
      }
      lastChangeRef.current[key] = now;

      const scrambled = target
        .split('')
        .map((ch, i) =>
          i < revealCount
            ? ch
            : chars[Math.floor(Math.random() * chars.length)]
        )
        .join('');

      setScrambledLabels((prev) => ({ ...prev, [key]: scrambled }));

      if (progress < 1) {
        scrambleFrame.current = requestAnimationFrame(step);
      } else {
        setScrambledLabels((prev) => ({ ...prev, [key]: target }));
      }
    };

    scrambleFrame.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const scene = document.querySelector('.gradient-scene');
    if (!scene) return;

    const handleClick = (e) => {
      // only show effect in magic theme
      if (!document.documentElement.classList.contains('magic-theme')) return;

      const flash = document.createElement('span');
      flash.className = 'click-flash';
      const size = 260;
      flash.style.width = `${size}px`;
      flash.style.height = `${size}px`;
      flash.style.left = `${e.clientX - size / 2}px`;
      flash.style.top = `${e.clientY - size / 2}px`;
      scene.appendChild(flash);
      flash.addEventListener('animationend', () => flash.remove());
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <div className="gradient-scene" aria-hidden="true">
        <div className="gradient-layer">
          <div className="gradient-sphere sphere-1"></div>
          <div className="gradient-sphere sphere-2"></div>
          <div className="gradient-sphere sphere-3"></div>
          <div className="gradient-sphere sphere-4"></div>
          <div className="glow"></div>
          <div className="grid-overlay"></div>
          <div className="noise-overlay"></div>
          <div className="particles"></div>
        </div>
      </div>
      {!hideSocial && (
      <div className="floating-icons">
        <a
          className="floating-icon"
          href={socialLinks.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          onMouseEnter={() => {
            setHoveredIcon('github');
            startScramble('github', 'GitHub');
          }}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaGithub />
          {hoveredIcon === 'github' && <span className="icon-label">{scrambledLabels.github}</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.whatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          onMouseEnter={() => {
            setHoveredIcon('whatsapp');
            startScramble('whatsapp', 'WhatsApp');
          }}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaWhatsapp />
          {hoveredIcon === 'whatsapp' && <span className="icon-label">{scrambledLabels.whatsapp}</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          onMouseEnter={() => {
            setHoveredIcon('instagram');
            startScramble('instagram', 'Instagram');
          }}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaInstagram />
          {hoveredIcon === 'instagram' && <span className="icon-label">{scrambledLabels.instagram}</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          onMouseEnter={() => {
            setHoveredIcon('linkedin');
            startScramble('linkedin', 'LinkedIn');
          }}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaLinkedin />
          {hoveredIcon === 'linkedin' && <span className="icon-label">{scrambledLabels.linkedin}</span>}
        </a>
      </div>
      )}
      {!hideSocial && (
      <div className="mobile-social">
        <a href={socialLinks.github} target="_blank" rel="noreferrer" aria-label="GitHub">
          <FaGithub />
        </a>
        <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          <FaWhatsapp />
        </a>
        <a href={socialLinks.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
          <FaInstagram />
        </a>
        <a href={socialLinks.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
          <FaLinkedin />
        </a>
      </div>
      )}
    </>
  );
};

export default GradientBackground;
