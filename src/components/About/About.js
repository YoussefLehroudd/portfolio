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

  useEffect(() => {
    if (!isMagicTheme || !aboutData || !descriptionRef.current) return;

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
    if (!isMagicTheme) return;
    // Show at least the first word so the line isn't empty before scrolling
    const initial = Math.min(1, totalWords);
    setLitCount(initial);
    litCountRef.current = initial;
  }, [descriptionText, totalWords, isMagicTheme]);

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!aboutData) {
    return null;
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
            return token === ' ' ? '\u00A0' : token;
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
                  <p className={styles.eyebrow}>About Me</p>
                  <h2 className={styles.magicTitle}>
                    About <span>Me</span>
                  </h2>
                  {renderAnimatedDescription(styles.magicDescription)}
                </div>

                <div className={styles.magicSkills}>
                  <p className={styles.eyebrow}>Technical Skills</p>
                  <div className={styles.magicSkillGrid}>
                    {skillCategories.map((category, index) => (
                      <div key={category.title || index} className={styles.magicSkillCard}>
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
              <h2 className={styles.title}>About Me</h2>
              <p className={styles.description}>{descriptionText}</p>
            </div>
            <div className={styles.skillsColumn}>
              <h3>Technical Skills</h3>
              <div className={styles.skillGrid}>
                {skillCategories.map((category, index) => (
                  <div key={category.title || index} className={styles.skillCategory}>
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
