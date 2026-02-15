import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './Projects.module.css';
import { FaGithub, FaLink } from 'react-icons/fa';
import ProjectModal from './ProjectModal';

const ProjectCard = React.memo(({ project, onMoreClick, revealDelay = '0s', revealVariant = 'reveal-up' }) => {
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
    <div
      className={`${styles.projectCard} ${revealVariant}`}
      data-reveal
      style={{ '--reveal-delay': revealDelay }}
    >
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

const FilterButton = React.memo(({ filter, isActive, onClick, revealDelay = '0s' }) => (
  <button
    className={`${styles.filterBtn} ${isActive ? styles.active : ''} reveal-pop`}
    data-reveal
    style={{ '--reveal-delay': revealDelay }}
    onClick={onClick}
    onMouseDown={(e) => e.preventDefault()}
    type="button"
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
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);
  const filtersRef = useRef(null);
  const [gridMinHeight, setGridMinHeight] = useState(null);

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
      setLoading(true);
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
      } finally {
        setLoading(false);
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

  useEffect(() => {
    const el = filtersRef.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onPointerDown = (event) => {
      isDown = true;
      el.classList.add(styles.dragging);
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      startX = event.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onPointerLeave = () => {
      isDown = false;
      el.classList.remove(styles.dragging);
    };

    const onPointerUp = (event) => {
      isDown = false;
      el.classList.remove(styles.dragging);
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    };

    const onPointerMove = (event) => {
      if (!isDown) return;
      event.preventDefault();
      const x = event.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.2;
      el.scrollLeft = scrollLeft - walk;
    };

    const updateEdges = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const atStart = el.scrollLeft <= 1;
      const atEnd = el.scrollLeft >= maxScroll - 1;
      el.classList.toggle(styles.filtersAtStart, atStart);
      el.classList.toggle(styles.filtersAtEnd, atEnd);
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerleave', onPointerLeave);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    const frame = requestAnimationFrame(updateEdges);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [categories.length]);

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
  
  useEffect(() => {
    if (loading) return;
    if (!gridRef.current) return;
    if (activeFilter !== 'All Projects') return;

    const grid = gridRef.current;
    const measure = (rect) => {
      const height = rect?.height ?? grid.getBoundingClientRect().height;
      if (height > 0) {
        setGridMinHeight((prev) => (prev ? Math.max(prev, height) : height));
      }
    };

    let frame = requestAnimationFrame(() => measure());

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => measure(entry.contentRect));
      });
      observer.observe(grid);
    }

    const handleResize = () => measure();
    window.addEventListener('resize', handleResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [activeFilter, projects.length, loading]);

  const filteredProjects = activeFilter === 'All Projects' 
    ? projects 
    : projects.filter(project => project.category === activeFilter);

  const showSkeleton = loading || error;

  if (showSkeleton) {
    const skeletonCards = Array.from({ length: 6 });
    const skeletonFilters = Array.from({ length: 4 });
    return (
      <section id="projects" className={styles.projects}>
        <div className={styles.container}>
          <div className={styles.filters}>
            {skeletonFilters.map((_, index) => (
              <div
                key={`projects-filter-skeleton-${index}`}
                className={`${styles.filterSkeleton} skeleton`}
              />
            ))}
          </div>
          <div className={styles.grid}>
            {skeletonCards.map((_, index) => (
              <div
                key={`project-skeleton-${index}`}
                className={`${styles.projectCard} ${styles.skeletonCard}`}
                data-reveal
                style={{ '--reveal-delay': `${Math.min(index, 6) * 0.06}s` }}
              >
                <div className={`${styles.imageContainer} ${styles.skeletonMedia} skeleton`} />
                <div className={styles.content}>
                  <div className={`${styles.skeletonTitle} skeleton`} />
                  <div className={`${styles.skeletonLine} skeleton`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} skeleton`} />
                  <div className={styles.skeletonLinks}>
                    <span className={`${styles.skeletonIcon} skeleton`} />
                    <span className={`${styles.skeletonIcon} skeleton`} />
                    <span className={`${styles.skeletonMore} skeleton`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className={styles.projects}>
      <div className={styles.container}>
        <div className={styles.filters} ref={filtersRef}>
          {categories.map((filter, index) => (
            <FilterButton
              key={filter}
              filter={filter}
              isActive={filter === activeFilter}
              onClick={() => handleFilterClick(filter)}
              revealDelay={`${Math.min(index, 6) * 0.06}s`}
            />
          ))}
        </div>
        <div
          ref={gridRef}
          className={`${styles.grid} ${animationState ? styles[animationState] : ''}`}
          style={gridMinHeight ? { minHeight: `${gridMinHeight}px` } : undefined}
        >
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              onMoreClick={setSelectedProject}
              revealDelay={`${Math.min(index, 6) * 0.08}s`}
              revealVariant={index % 2 === 0 ? 'reveal-left' : 'reveal-right'}
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
