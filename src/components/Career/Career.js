import React, { useEffect, useMemo, useState, useRef } from 'react';
import styles from './Career.module.css';

const Career = ({ isMagicTheme = false }) => {
  const [careerData, setCareerData] = useState(null);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFocusActive, setIsFocusActive] = useState(false);
  const scrollZoneRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchCareer = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/career`);
        if (!response.ok) throw new Error('Failed to fetch career data');
        const data = await response.json();
        setCareerData(data);
      } catch (err) {
        setError('Error loading career data');
      }
    };

    fetchCareer();
  }, []);

  const items = useMemo(
    () => (Array.isArray(careerData?.items) ? careerData.items : []),
    [careerData]
  );
  const orderedItems = useMemo(() => {
    if (!items.length) return [];
    return [...items].reverse();
  }, [items]);
  const showSkeleton = !careerData || error;

  useEffect(() => {
    if (!scrollZoneRef.current || orderedItems.length === 0) return;

    let frame = null;

    const updateProgress = () => {
      const zone = scrollZoneRef.current;
      const section = sectionRef.current;
      if (!zone) return;

      const rect = zone.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const total = Math.max(1, zone.offsetHeight - viewport);
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      const nextIndex = Math.min(orderedItems.length - 1, Math.floor(progress * orderedItems.length));

      setScrollProgress(progress);
      setActiveIndex(nextIndex);

      if (section) {
        const active = rect.bottom > 0 && rect.top < viewport;
        setIsFocusActive(active);
      }

      frame = null;
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [orderedItems.length]);

  useEffect(() => {
    document.body.classList.toggle('career-focus', isFocusActive);
    return () => {
      document.body.classList.remove('career-focus');
    };
  }, [isFocusActive]);

  if (showSkeleton) {
    const skeletonItems = Array.from({ length: 3 });
    const skeletonLines = Array.from({ length: 3 });
    return (
      <section id="career" ref={sectionRef} className={`${styles.career} ${isMagicTheme ? styles.magicCareer : ''}`}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div className={`${styles.skeletonKicker} skeleton`} />
            <div className={`${styles.skeletonTitle} skeleton`} />
            <div className={styles.titleRule} aria-hidden="true" />
            <div className={styles.skeletonParagraph}>
              {skeletonLines.map((_, index) => (
                <div
                  key={`career-skeleton-line-${index}`}
                  className={`${styles.skeletonLine} ${index === skeletonLines.length - 1 ? styles.skeletonLineShort : ''} skeleton`}
                />
              ))}
            </div>
          </div>

          <div
            className={styles.timeline}
            ref={scrollZoneRef}
            style={{ '--steps': skeletonItems.length, '--progress': scrollProgress }}
          >
            <div className={styles.stickyStage}>
              <div className={styles.stageInner}>
                <span className={styles.trunk} aria-hidden="true" />
                {skeletonItems.map((_, index) => {
                  const sideClass = index % 2 === 0 ? styles.right : styles.left;
                  const stateClass = index === 0 ? styles.cardActive : styles.cardInactive;
                  return (
                    <article
                      key={`career-skeleton-${index}`}
                      className={`${styles.card} ${sideClass} ${styles.skeletonCard} ${stateClass}`}
                    >
                      <span className={styles.cardSweep} aria-hidden="true" />
                      <span className={styles.connector} aria-hidden="true" />
                      <div className={styles.skeletonRow}>
                        <span className={`${styles.skeletonChip} skeleton`} />
                        <span className={`${styles.skeletonChipSmall} skeleton`} />
                      </div>
                      <div className={`${styles.skeletonTitleLine} skeleton`} />
                      <div className={`${styles.skeletonLine} skeleton`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} skeleton`} />
                      <div className={styles.skeletonTags}>
                        <span className={`${styles.skeletonTag} skeleton`} />
                        <span className={`${styles.skeletonTag} skeleton`} />
                        <span className={`${styles.skeletonTag} skeleton`} />
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="career" ref={sectionRef} className={`${styles.career} ${isMagicTheme ? styles.magicCareer : ''}`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={`${styles.kicker} reveal-down`} data-reveal style={{ '--reveal-delay': '0.05s' }}>
            Career
          </span>
          <h2 className={`${styles.title} reveal-up`} data-reveal style={{ '--reveal-delay': '0.1s' }}>
            {careerData.headline || 'Career Journey'}
          </h2>
          <div
            className={`${styles.titleRule} reveal-left`}
            data-reveal
            style={{ '--reveal-delay': '0.14s' }}
            aria-hidden="true"
          />
          <p className={`${styles.subtitle} reveal-up`} data-reveal style={{ '--reveal-delay': '0.16s' }}>
            {careerData.subheadline || 'Where I studied and what I build today'}
          </p>
          <p className={`${styles.intro} reveal-up`} data-reveal style={{ '--reveal-delay': '0.22s' }}>
            {careerData.intro}
          </p>
        </div>

        <div
          className={styles.timeline}
          ref={scrollZoneRef}
          style={{ '--steps': orderedItems.length, '--progress': scrollProgress }}
        >
          <div className={styles.stickyStage}>
            <div className={styles.stageInner}>
              <span className={styles.trunk} aria-hidden="true" />
              {orderedItems.map((item, index) => {
                const sideClass = index % 2 === 0 ? styles.right : styles.left;
                const stateClass = index === activeIndex ? styles.cardActive : styles.cardInactive;
                const createdTime = item?.createdAt ? new Date(item.createdAt).getTime() : 0;
                const isNew = createdTime && Number.isFinite(createdTime)
                  ? (Date.now() - createdTime) < 24 * 60 * 60 * 1000
                  : false;
                return (
                  <article
                    key={`${item.title}-${index}`}
                    className={`${styles.card} ${sideClass} ${stateClass} ${item.isCurrent ? styles.current : ''}`}
                    aria-hidden={index !== activeIndex}
                  >
                    <span className={styles.cardSweep} aria-hidden="true" />
                    <span className={styles.connector} aria-hidden="true" />
                    <div className={styles.cardTop}>
                      <span className={styles.period}>{item.period}</span>
                      {isNew && <span className={styles.now}>Now</span>}
                    </div>
                    <h3>{item.title}</h3>
                    <p className={styles.place}>{item.place}</p>
                    <p className={styles.description}>{item.description}</p>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className={styles.tags}>
                        {item.tags.map((tag, tagIndex) => (
                          <span key={`${tag}-${tagIndex}`} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Career);
