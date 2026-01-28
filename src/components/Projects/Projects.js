import React, { useState, useCallback, useEffect } from 'react';
import styles from './Projects.module.css';
import { FaGithub, FaLink } from 'react-icons/fa';
import ProjectModal from './ProjectModal';

const ProjectCard = React.memo(({ project, onMoreClick }) => {
  const recordProjectClick = async () => {
    try {
      // Only record clicks for non-admin pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/admin')) {
        await fetch(`${process.env.REACT_APP_API_URL}/api/statistics/project-click`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            projectId: project._id,
            title: project.title,
            image: project.image
          })
        });
      }
    } catch (error) {
      console.error('Error recording project click:', error);
    }
  };

  const handleLinkClick = async (e) => {
    await recordProjectClick();
  };

  const handleMoreClick = async () => {
    await recordProjectClick();
    onMoreClick(project);
  };

  return (
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
          <a 
            href={project.demoLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="Live Demo"
            onClick={handleLinkClick}
          >
            <FaLink />
          </a>
          <a 
            href={project.githubLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="GitHub Repository"
            onClick={handleLinkClick}
          >
            <FaGithub />
          </a>
          <span 
            className={styles.more} 
            onClick={handleMoreClick}
            aria-label="View More Details"
          >
            More →
          </span>
        </div>
      </div>
    </div>
  );
});

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
  const [animationState, setAnimationState] = useState(''); // '', 'fadeOut', 'fadeIn'
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching projects:', err);
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
    if (filter === activeFilter) return; // no change
    setAnimationState('fadeOut');
    setTimeout(() => {
      setActiveFilter(filter);
      setAnimationState('fadeIn');
      setTimeout(() => {
        setAnimationState('');
      }, 500); // fadeIn duration
    }, 500); // fadeOut duration
  }, [activeFilter]);

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
        <div className={`${styles.grid} ${animationState ? styles[animationState] : ''}`}>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onMoreClick={setSelectedProject}
            />
          ))}
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
