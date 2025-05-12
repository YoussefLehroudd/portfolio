import React, { useState, useEffect, Suspense } from 'react';
import styles from './Hero.module.css';
import Spline from '@splinetool/react-spline';
import TechSlider from './TechSlider';

const SplineScene = React.memo(({ sceneUrl }) => (
  <Suspense fallback={<div className={styles.splineFallback} />}>
    <Spline scene={sceneUrl}/>
  </Suspense>
));

const Hero = () => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [currentLine, setCurrentLine] = useState(1);
  const [isSplineVisible, setIsSplineVisible] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch hero data
    const fetchHeroData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hero`);
        if (response.ok) {
          const heroData = await response.json();
          setData(heroData);
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      }
    };

    fetchHeroData();
  }, []);

  useEffect(() => {
    // Scroll visibility control
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const threshold = window.innerHeight * 0.8;
      setIsSplineVisible(scrollPosition < threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!data) return;

    // Typing animation
    let index = 0;
    let phase = 1;

    const interval = setInterval(() => {
      if (phase === 1) {
        if (index <= data.firstName.length) {
          setText1(data.firstName.slice(0, index));
          index++;
        } else {
          phase = 2;
          index = 0;
        }
      } else if (phase === 2) {
        if (index <= data.lastName.length) {
          setText2(data.lastName.slice(0, index));
          index++;
        } else {
          phase = 3;
          index = 0;
          setCurrentLine(2);
        }
      } else if (phase === 3) {
        if (index <= data.title.length) {
          setSubtitleText(data.title.slice(0, index));
          index++;
        } else {
          phase = 4;
          index = 0;
          setCurrentLine(3);
        }
      } else if (phase === 4) {
        if (index <= data.description.length) {
          setDescriptionText(data.description.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setCurrentLine(0);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [data]);

  if (!data) return null;

  return (
    <section id="hero" className={styles.hero}>
      {isSplineVisible && (
        <div className={styles.splineContainer}>
          <SplineScene sceneUrl={data.splineUrl} />
        </div>
      )}
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          <span>{text1}</span>
          {text1.length === data?.firstName?.length && <span>&nbsp;</span>}
          <span>{text2}</span>
          {currentLine === 1 && <span className={styles.cursor}>|</span>}
        </h1>
        <h2 className={styles.subtitle}>
          {subtitleText}
          {currentLine === 2 && <span className={styles.cursor}>|</span>}
        </h2>
        <p className={styles.description}>
          {descriptionText}
          {currentLine === 3 && <span className={styles.cursor}>|</span>}
        </p>
        <div className={styles.buttonContainer}>
          <a href={data.primaryButton.link} className={styles.primaryBtn}>
            {data.primaryButton.text}
          </a>
          <a href={data.secondaryButton.link} className={styles.secondaryBtn}>
            {data.secondaryButton.text}
          </a>
        </div>
      </div>
      <TechSlider />
    </section>
  );
};

export default React.memo(Hero);
