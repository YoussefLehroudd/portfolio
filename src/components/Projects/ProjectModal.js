import React from 'react';
import styles from './ProjectModal.module.css';
import { FaTimes, FaGithub, FaLink } from 'react-icons/fa';

const ProjectModal = ({ project, onClose }) => {
  const imageWrapRef = React.useRef(null);
  const bodyStylesRef = React.useRef({ overflow: '', paddingRight: '' });

  React.useEffect(() => {
    const { body, documentElement } = document;
    bodyStylesRef.current = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight
    };

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = bodyStylesRef.current.overflow || '';
      body.style.paddingRight = bodyStylesRef.current.paddingRight || '';
    };
  }, []);

  const handleImageMove = (event) => {
    const wrap = imageWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    wrap.style.setProperty('--zoom-x', `${x}%`);
    wrap.style.setProperty('--zoom-y', `${y}%`);
  };

  const handleImageLeave = () => {
    const wrap = imageWrapRef.current;
    if (!wrap) return;
    wrap.style.setProperty('--zoom-x', '50%');
    wrap.style.setProperty('--zoom-y', '50%');
  };
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
          <FaTimes />
        </button>

        <div className={styles.header}>
          <span className={styles.kicker}>project.inspect()</span>
          <h2>{project.title}</h2>
          <p className={styles.subtitle}>{project.type}</p>
        </div>

        <div className={styles.body}>
          <div className={styles.preview}>
            <div
              className={styles.imageContainer}
              ref={imageWrapRef}
              onMouseMove={handleImageMove}
              onMouseLeave={handleImageLeave}
            >
              <img 
                src={project.image} 
                alt={project.title} 
                loading="eager"
                decoding="async"
              />
            </div>
            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span>Category</span>
                <strong>{project.category}</strong>
              </div>
              <div className={styles.metaCard}>
                <span>Timeline</span>
                <strong>{project.timeline}</strong>
              </div>
            </div>
          </div>

          <div className={styles.info}>
            <p className={styles.description}>{project.description}</p>

            <div className={styles.section}>
              <h3>Tech Stack</h3>
              <div className={styles.tags}>
                {project.technologies.map((tech, index) => (
                  <span key={index} className={styles.tag}>{tech}</span>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h3>Key Features</h3>
              <ul className={styles.featureList}>
                {project.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.links}>
          <a href={project.demoLink} target="_blank" rel="noopener noreferrer" className={styles.button}>
            <FaLink /> Live Demo
          </a>
          <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className={styles.button}>
            <FaGithub /> Source Code
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
