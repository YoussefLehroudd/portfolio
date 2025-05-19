import React from 'react';
import styles from './ProjectModal.module.css';
import { FaTimes, FaGithub, FaLink } from 'react-icons/fa';

const ProjectModal = ({ project, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <div className={styles.modalContent}>
          <div className={styles.imageContainer}>
            <img 
              src={project.image} 
              alt={project.title} 
              loading="lazy"
              decoding="async"
            />
          </div>
          <h2>{project.title}</h2>
          <div className={styles.type}>{project.type}</div>
          <p className={styles.description}>{project.description}</p>
          
          <div className={styles.details}>
            <div className={styles.section}>
              <h3>Technologies Used</h3>
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

            <div className={styles.section}>
              <h3>Project Details</h3>
              <ul className={styles.detailsList}>
                <li><strong>Category:</strong> {project.category}</li>
                <li><strong>Timeline:</strong> {project.timeline}</li>
              </ul>
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
    </div>
  );
};

export default ProjectModal;
