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

  const filters = [
    'All Projects',
    'HTML & CSS',
    'JavaScript',
    'React & MUI',
    'Node & Express'
  ];

  const projects = [
    {
      title: "Mochaccino Dalgona",
      description: "A modern e-commerce platform for a premium coffee brand, featuring a sleek user interface, real-time inventory management, and secure payment processing.",
      image: "/images/projects/mochaccino.png",
      demoLink: "#",
      githubLink: "https://github.com/YoussefLehroudd",
      type: "React Project",
      category: "React & MUI",
      technologies: ["React", "Material-UI", "Node.js", "MongoDB", "Stripe API"],
      timeline: "6 weeks",
      features: [
        "Responsive design for all devices",
        "Real-time inventory tracking",
        "Secure payment processing",
        "User authentication and profiles"
      ]
    },
    {
      title: "Unleash Your Energy",
      description: "A fitness tracking application that helps users monitor their workouts, set goals, and track their progress over time with interactive visualizations.",
      image: "/images/projects/energy.png",
      demoLink: "#",
      githubLink: "https://github.com/YoussefLehroudd",
      type: "React & CSS Project",
      category: "React & MUI",
      technologies: ["React", "Chart.js", "Firebase", "CSS Modules"],
      timeline: "4 weeks",
      features: [
        "Custom workout planning",
        "Progress tracking with charts",
        "Social sharing features",
        "Personalized recommendations"
      ]
    },
    {
      title: "Disrupt",
      description: "A modern landing page for a tech startup, showcasing their innovative products and services with stunning animations and interactive elements.",
      image: "/images/projects/disrupt.png",
      demoLink: "#",
      githubLink: "https://github.com/YoussefLehroudd",
      type: "CSS Project",
      category: "HTML & CSS",
      technologies: ["HTML5", "CSS3", "JavaScript", "GSAP"],
      timeline: "2 weeks",
      features: [
        "Smooth scroll animations",
        "Responsive design",
        "Performance optimized",
        "Modern UI/UX design"
      ]
    }
  ];

  useEffect(() => {
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
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [projects]);

  const handleFilterClick = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const filteredProjects = activeFilter === 'All Projects' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.container}>
        <div className={styles.filters}>
          {filters.map((filter) => (
            <FilterButton
              key={filter}
              filter={filter}
              isActive={filter === activeFilter}
              onClick={() => handleFilterClick(filter)}
            />
          ))}
        </div>
        <div className={`${styles.grid} ${isLoading ? styles.loading : ''}`}>
          {filteredProjects.map((project, index) => (
            <ProjectCard 
              key={`${project.title}-${index}`} 
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
