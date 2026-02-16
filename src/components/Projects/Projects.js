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

  const handleMoreClick = () => {
    onMoreClick(project);
    recordProjectClick();
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

const FilterButton = React.memo(React.forwardRef(({ filter, isActive, onClick, isDraggingRef, revealDelay = '0s' }, ref) => {
  const handleClick = (event) => {
    if (isDraggingRef?.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <button
      ref={ref}
      className={`${styles.filterBtn} ${isActive ? styles.active : ''} reveal-pop`}
      data-reveal
      style={{ '--reveal-delay': revealDelay }}
      onClick={handleClick}
      type="button"
    >
      {filter}
    </button>
  );
}));
FilterButton.displayName = 'FilterButton';

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
  const indicatorRef = useRef(null);
  const trailRef = useRef(null);
  const filterButtonRefs = useRef({});
  const prevActiveRef = useRef(null);
  const isDraggingRef = useRef(false);
  const [gridMinHeight, setGridMinHeight] = useState(null);
  const layoutRef = useRef(null);
  const [showFiltersHint, setShowFiltersHint] = useState(true);
  const updateIndicator = useCallback(() => {
    const container = filtersRef.current;
    const indicator = indicatorRef.current;
    const activeEl = filterButtonRefs.current[activeFilter];
    if (!container || !indicator || !activeEl) return;

    const left = activeEl.offsetLeft;
    const top = activeEl.offsetTop;

    indicator.style.opacity = '1';
    indicator.style.width = `${activeEl.offsetWidth}px`;
    indicator.style.height = `${activeEl.offsetHeight}px`;
    indicator.style.setProperty('--indicator-x', `${left}px`);
    indicator.style.setProperty('--indicator-y', `${top}px`);
  }, [activeFilter]);

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
    if (loading || error) return;
    const el = filtersRef.current;
    if (!el) return;

    let isDown = false;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let activePointerId = null;
    let usingWindowListeners = false;
    const dragThreshold = 8;

    const updateEdges = () => {
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const hasOverflow = maxScroll > 6;
      const atStart = Math.round(el.scrollLeft) <= 1;
      const atEnd = Math.ceil(el.scrollLeft) >= Math.floor(maxScroll - 2);

      el.classList.toggle(styles.filtersAtStart, atStart);
      el.classList.toggle(styles.filtersAtEnd, atEnd);

      const shouldShowHint = hasOverflow && atStart && !atEnd;
      setShowFiltersHint((prev) => (prev === shouldShowHint ? prev : shouldShowHint));
      updateIndicator();
    };

    const onPointerMove = (event) => {
      if (!isDown) return;
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      const x = event.clientX;
      const delta = x - startX;
      if (!isDragging && Math.abs(delta) > dragThreshold) {
        isDragging = true;
        isDraggingRef.current = true;
        el.classList.add(styles.dragging);
      }

      if (isDragging) {
        event.preventDefault();
        const walk = delta * 1.2;
        el.scrollLeft = startScrollLeft - walk;
        updateEdges();
      }
    };

    const clearDrag = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove(styles.dragging);

      if (usingWindowListeners) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        usingWindowListeners = false;
      }

      activePointerId = null;
      updateEdges();
      isDragging = false;

      if (isDraggingRef.current) {
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 0);
      }
    };

    const onPointerUp = (event) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      clearDrag();
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      activePointerId = event.pointerId;
      isDown = true;
      isDraggingRef.current = false;
      isDragging = false;
      startX = event.clientX;
      startScrollLeft = el.scrollLeft;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      usingWindowListeners = true;
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    window.addEventListener('blur', clearDrag);
    const frame = requestAnimationFrame(updateEdges);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
      window.removeEventListener('blur', clearDrag);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [categories.length, loading, error, updateIndicator]);

  useEffect(() => {
    if (loading || error) return;
    const el = filtersRef.current;
    if (!el || !window.matchMedia) return;

    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = () => {
      el.scrollLeft = 0;
      updateIndicator();
    };

    handleChange();
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [loading, error, updateIndicator]);

  useEffect(() => {
    if (loading || error) return;
    const frame = requestAnimationFrame(updateIndicator);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [updateIndicator, loading, error, categories.length]);

  useEffect(() => {
    if (loading || error) return;
    const indicator = indicatorRef.current;
    if (!indicator) return;
    indicator.classList.remove(styles.activeIndicatorPulse);
    void indicator.offsetWidth;
    indicator.classList.add(styles.activeIndicatorPulse);
  }, [activeFilter, loading, error, styles.activeIndicatorPulse]);

  useEffect(() => {
    if (loading || error) return;
    const trail = trailRef.current;
    const currentEl = filterButtonRefs.current[activeFilter];
    const prevKey = prevActiveRef.current;
    const prevEl = prevKey ? filterButtonRefs.current[prevKey] : null;

    if (trail && currentEl && prevEl && currentEl !== prevEl) {
      const startLeft = prevEl.offsetLeft;
      const endLeft = currentEl.offsetLeft;
      const startRight = startLeft + prevEl.offsetWidth;
      const endRight = endLeft + currentEl.offsetWidth;
      const minLeft = Math.min(startLeft, endLeft);
      const maxRight = Math.max(startRight, endRight);
      const width = Math.max(8, maxRight - minLeft);

      trail.style.width = `${width}px`;
      trail.style.height = `${currentEl.offsetHeight}px`;
      trail.style.setProperty('--trail-x', `${minLeft}px`);
      trail.style.setProperty('--trail-y', `${currentEl.offsetTop}px`);
      trail.style.setProperty('--trail-distance', `${width}px`);

      trail.classList.remove(styles.trailActive);
      void trail.offsetWidth;
      trail.classList.add(styles.trailActive);
    }

    prevActiveRef.current = activeFilter;
  }, [activeFilter, loading, error, styles.trailActive]);

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
    const getLayoutKey = () => (window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop');
    let remeasureFrame = null;
    const measure = (rect) => {
      const height = rect?.height ?? grid.getBoundingClientRect().height;
      if (height > 0) {
        const layoutKey = getLayoutKey();
        if (layoutRef.current !== layoutKey) {
          layoutRef.current = layoutKey;
          setGridMinHeight(null);
          if (remeasureFrame) cancelAnimationFrame(remeasureFrame);
          remeasureFrame = requestAnimationFrame(() => {
            const freshHeight = grid.getBoundingClientRect().height;
            if (freshHeight > 0) {
              setGridMinHeight(freshHeight);
            }
          });
          return;
        }
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
      if (remeasureFrame) cancelAnimationFrame(remeasureFrame);
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
          <div ref={trailRef} className={styles.trail} aria-hidden="true" />
          <div ref={indicatorRef} className={styles.activeIndicator} aria-hidden="true" />
          <div className={`${styles.dragHint} ${showFiltersHint ? '' : styles.dragHintHidden}`}>
            Drag -&gt;
          </div>
          {categories.map((filter, index) => (
            <FilterButton
              key={filter}
              filter={filter}
              isActive={filter === activeFilter}
              onClick={() => handleFilterClick(filter)}
              isDraggingRef={isDraggingRef}
              revealDelay={`${Math.min(index, 6) * 0.06}s`}
              ref={(node) => {
                if (node) {
                  filterButtonRefs.current[filter] = node;
                }
              }}
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
