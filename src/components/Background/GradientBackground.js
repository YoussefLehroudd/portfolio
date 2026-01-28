import React, { useEffect, useState } from 'react';
import { FaGithub, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './GradientBackground.css';

const GradientBackground = () => {
  const [socialLinks, setSocialLinks] = useState({
    github: 'https://github.com',
    whatsapp: 'https://wa.me',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com'
  });
  const [hoveredIcon, setHoveredIcon] = useState(null);

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
      <div className="floating-icons">
        <a
          className="floating-icon"
          href={socialLinks.github}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          onMouseEnter={() => setHoveredIcon('github')}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaGithub />
          {hoveredIcon === 'github' && <span className="icon-label">GitHub</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.whatsapp}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          onMouseEnter={() => setHoveredIcon('whatsapp')}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaWhatsapp />
          {hoveredIcon === 'whatsapp' && <span className="icon-label">WhatsApp</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.instagram}
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram"
          onMouseEnter={() => setHoveredIcon('instagram')}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaInstagram />
          {hoveredIcon === 'instagram' && <span className="icon-label">Instagram</span>}
        </a>
        <a
          className="floating-icon"
          href={socialLinks.linkedin}
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
          onMouseEnter={() => setHoveredIcon('linkedin')}
          onMouseLeave={() => setHoveredIcon(null)}
        >
          <FaLinkedin />
          {hoveredIcon === 'linkedin' && <span className="icon-label">LinkedIn</span>}
        </a>
      </div>
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
    </>
  );
};

export default GradientBackground;
