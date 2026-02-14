import React, { useState, useEffect, useRef, useMemo } from 'react';
import ElectricBorder from './ElectricBorder';
import styles from './About.module.css';

const About = ({ isMagicTheme = false }) => {
  const [aboutData, setAboutData] = useState(null);
  const descriptionRef = useRef(null);
  const [litCount, setLitCount] = useState(0);
  const litCountRef = useRef(0);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/about`);
      if (response.ok) {
        const data = await response.json();
        setAboutData(data);
      } else {
        setError('Failed to fetch about data');
      }
    } catch (error) {
      setError('Error loading about data');
    }
  };

  const descriptionText = typeof aboutData?.description === 'string' ? aboutData.description : '';
  const tokens = useMemo(() => descriptionText.split(/(\s+)/), [descriptionText]); // keep spaces
  const totalWords = useMemo(
    () => tokens.filter((t) => t.trim().length > 0).length || 1,
    [tokens]
  );
  const skillCategories = Array.isArray(aboutData?.skillCategories) ? aboutData.skillCategories : [];
  const showSkeleton = !aboutData || error;
  const skeletonSkillCards = useMemo(() => Array.from({ length: 4 }), []);
  const skeletonLines = useMemo(() => Array.from({ length: 3 }), []);

  useEffect(() => {
    if (!aboutData || !descriptionRef.current) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setLitCount(totalWords);
      litCountRef.current = totalWords;
      return;
    }

    // Link the description highlight to how far it has travelled through the viewport
    const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
    let frame = null;

    const updateReveal = () => {
      const element = descriptionRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height));
      const targetLit = Math.min(totalWords, Math.max(0, Math.round(progress * totalWords)));

      if (targetLit !== litCountRef.current) {
        litCountRef.current = targetLit;
        setLitCount(targetLit);
      }

      frame = null;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateReveal);
    };

    updateReveal();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateReveal);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateReveal);
    };
  }, [aboutData, totalWords, isMagicTheme]);

  useEffect(() => {
    if (!descriptionText) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setLitCount(totalWords);
      litCountRef.current = totalWords;
      return;
    }
    // Show at least the first word so the line isn't empty before scrolling
    const initial = Math.min(1, totalWords);
    setLitCount(initial);
    litCountRef.current = initial;
  }, [descriptionText, totalWords, isMagicTheme]);

  if (showSkeleton) {
    return (
      <section id="about" className={`${styles.about} ${isMagicTheme ? styles.magicAbout : ''}`}>
        {isMagicTheme ? (
          <div className={styles.magicShell}>
            <div className={styles.gridBackdrop} aria-hidden />
            <ElectricBorder
              color="#7df9ff"
              speed={1}
              chaos={0.5}
              thickness={2}
              className={styles.electricFrame}
              style={{ borderRadius: 28 }}
            >
              <div className={styles.magicGlass}>
                <div className={styles.glowSoft} aria-hidden />
                <div className={styles.magicContent}>
                  <div className={styles.magicIntro}>
                    <div className={`${styles.skeletonKicker} skeleton`} />
                    <div className={`${styles.skeletonTitle} skeleton`} />
                    <div className={styles.skeletonParagraph}>
                      {skeletonLines.map((_, index) => (
                        <div
                          key={`about-skeleton-line-${index}`}
                          className={`${styles.skeletonLine} ${index === skeletonLines.length - 1 ? styles.skeletonLineShort : ''} skeleton`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className={styles.magicSkills}>
                    <div className={`${styles.skeletonSubtitle} skeleton`} />
                    <div className={styles.magicSkillGrid}>
                      {skeletonSkillCards.map((_, index) => (
                        <div key={`magic-skeleton-skill-${index}`} className={`${styles.magicSkillCard} ${styles.skeletonCard}`}>
                          <div className={`${styles.skeletonSkillTitle} skeleton`} />
                          <div className={styles.skeletonSkillList}>
                            {skeletonLines.map((__, lineIndex) => (
                              <div
                                key={`magic-skill-line-${index}-${lineIndex}`}
                                className={`${styles.skeletonLine} ${lineIndex === 2 ? styles.skeletonLineShort : ''} skeleton`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ElectricBorder>
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.content}>
              <span className={styles.borderFx}></span>
              <div className={styles.aboutColumn}>
                <div className={`${styles.skeletonTitle} skeleton`} />
                <div className={styles.skeletonParagraph}>
                  {skeletonLines.map((_, index) => (
                    <div
                      key={`simple-skeleton-line-${index}`}
                      className={`${styles.skeletonLine} ${index === skeletonLines.length - 1 ? styles.skeletonLineShort : ''} skeleton`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.skillsColumn}>
                <div className={`${styles.skeletonSubtitle} skeleton`} />
                <div className={styles.skillGrid}>
                  {skeletonSkillCards.map((_, index) => (
                    <div key={`simple-skeleton-skill-${index}`} className={`${styles.skillCategory} ${styles.skeletonCard}`}>
                      <span className={styles.borderFx}></span>
                      <div className={`${styles.skeletonSkillTitle} skeleton`} />
                      <div className={styles.skeletonSkillList}>
                        {skeletonLines.map((__, lineIndex) => (
                          <div
                            key={`simple-skill-line-${index}-${lineIndex}`}
                            className={`${styles.skeletonLine} ${lineIndex === 2 ? styles.skeletonLineShort : ''} skeleton`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  const renderAnimatedDescription = (className) => {
    let wordIndex = 0;
    return (
      <p
        ref={descriptionRef}
        className={`${className} ${styles.scrollReveal}`}
        aria-label={descriptionText}
      >
        {tokens.map((token, index) => {
          const isWord = token.trim().length > 0;
          if (!isWord) {
            return token;
          }
          const currentIndex = wordIndex;
          wordIndex += 1;
          const lit = currentIndex < litCount;
          return (
            <span
              key={index}
              className={`${styles.word} ${lit ? styles.lit : ''}`}
              aria-hidden="true"
            >
              {token}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <section id="about" className={`${styles.about} ${isMagicTheme ? styles.magicAbout : ''}`}>
      {isMagicTheme ? (
        <div className={styles.magicShell}>
          <div className={styles.gridBackdrop} aria-hidden />
          <ElectricBorder
            color="#7df9ff"
            speed={1}
            chaos={0.5}
            thickness={2}
            className={styles.electricFrame}
            style={{ borderRadius: 28 }}
          >
            <div className={styles.magicGlass}>
              <div className={styles.glowSoft} aria-hidden />
              <div className={styles.magicContent}>
                <div className={styles.magicIntro}>
                  <p
                    className={`${styles.eyebrow} reveal-down`}
                    data-reveal
                    style={{ '--reveal-delay': '0.06s' }}
                  >
                    About Me
                  </p>
                  <h2
                    className={`${styles.magicTitle} reveal-up`}
                    data-reveal
                    style={{ '--reveal-delay': '0.12s' }}
                  >
                    About <span>Me</span>
                  </h2>
                  {renderAnimatedDescription(styles.magicDescription)}
                </div>

                <div className={styles.magicSkills}>
                  <p
                    className={`${styles.eyebrow} reveal-down`}
                    data-reveal
                    style={{ '--reveal-delay': '0.22s' }}
                  >
                    Technical Skills
                  </p>
                  <div className={styles.magicSkillGrid}>
                    {skillCategories.map((category, index) => (
                      <div
                        key={category.title || index}
                        className={`${styles.magicSkillCard} ${index % 2 === 0 ? 'reveal-left' : 'reveal-right'}`}
                        data-reveal
                        style={{ '--reveal-delay': `${0.28 + index * 0.08}s` }}
                      >
                        <h4>{category.title}</h4>
                        <ul>
                          {(Array.isArray(category.skills) ? category.skills : []).map((skill, skillIndex) => (
                            <li key={skillIndex}>{skill}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ElectricBorder>
        </div>
      ) : (
        <div className={styles.container}>
          <div className={styles.content}>
            <span className={styles.borderFx}></span>
            <div className={styles.aboutColumn}>
              <h2
                className={`${styles.title} reveal-up`}
                data-reveal
                style={{ '--reveal-delay': '0.1s' }}
              >
                About Me
              </h2>
              {renderAnimatedDescription(styles.description)}
            </div>
            <div className={styles.skillsColumn}>
              <h3
                className={`reveal-up`}
                data-reveal
                style={{ '--reveal-delay': '0.26s' }}
              >
                Technical Skills
              </h3>
              <div className={styles.skillGrid}>
                {skillCategories.map((category, index) => (
                  <div
                    key={category.title || index}
                    className={`${styles.skillCategory} ${index % 2 === 0 ? 'reveal-left' : 'reveal-right'}`}
                    data-reveal
                    style={{ '--reveal-delay': `${0.32 + index * 0.08}s` }}
                  >
                    <span className={styles.borderFx}></span>
                    <h4>{category.title}</h4>
                    <ul>
                      {(Array.isArray(category.skills) ? category.skills : []).map((skill, skillIndex) => (
                        <li key={skillIndex}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default About;
