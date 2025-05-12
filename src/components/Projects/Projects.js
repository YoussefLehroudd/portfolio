import React, { useState, useCallback, useEffect } from 'react';
import styles from './Projects.module.css';
import { FaGithub, FaLink } from 'react-icons/fa';
import ProjectModal from './ProjectModal';

const ProjectCard = React.memo(({ project, onMoreClick }) => (
  <div className={styles.projectCard}>
    <div className={styles.imageContainer}>
      <img 
        src={project.image} 
        alt={project.title} 
        loading="lazy"
        decoding="async"
        width="400"
        height="250"
      />
      <div className={styles.overlay}>
        <h3>{project.type}</h3>
      </div>
    </div>
    <div className={styles.content}>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <div className={styles.links}>
        <a href={project.demoLink} target="_blank" rel="noopener noreferrer" aria-label="Live Demo">
          <FaLink />
        </a>
        <a href={project.githubLink} target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
          <FaGithub />
        </a>
        <span className={styles.more} onClick={() => onMoreClick(project)}>more→</span>
      </div>
    </div>
  </div>
));

const FilterButton = React.memo(({ filter, isActive, onClick }) => (
  <button
    className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
    onClick={onClick}
  >
    {filter}
  </button>
));

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState('All Projects');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState(['All Projects']);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(['All Projects', ...data.map(category => category.name)]);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      const loadImages = async () => {
        try {
          await Promise.all(
            projects.map(project => {
              return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = project.image;
                img.onload = resolve;
                img.onerror = reject;
              });
            })
          );
        } catch (error) {
          console.error('Error preloading images:', error);
        }
      };

      loadImages();
    }
  }, [projects]);

  const handleFilterClick = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const filteredProjects = activeFilter === 'All Projects' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  if (error) {
    return <div className={styles.error}>Error loading projects: {error}</div>;
  }

  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.container}>
        <div className={styles.filters}>
          {categories.map((filter) => (
            <FilterButton
              key={filter}
              filter={filter}
              isActive={filter === activeFilter}
              onClick={() => handleFilterClick(filter)}
            />
          ))}
        </div>
        <div className={`${styles.grid} ${isLoading ? styles.loading : ''}`}>
          {isLoading ? (
            <div className={styles.loadingSpinner}>Loading projects...</div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard 
                key={project._id}
                project={project}
                onMoreClick={setSelectedProject}
              />
            ))
          )}
        </div>
      </div>
      
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </section>
  );
};

export default React.memo(Projects);
