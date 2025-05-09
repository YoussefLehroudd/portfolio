import React, { useState, useEffect, Suspense } from 'react';
import styles from './Hero.module.css';
import Spline from '@splinetool/react-spline';
import TechSlider from './TechSlider';

const SplineScene = React.memo(() => (
  <Suspense fallback={<div className={styles.splineFallback} />}>
    <Spline scene="https://prod.spline.design/daHslO6sl8nd7EVW/scene.splinecode"/>
  </Suspense>
));


const Hero = () => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [currentLine, setCurrentLine] = useState(1);
  const [isSplineVisible, setIsSplineVisible] = useState(true);

  const firstPart = "Hi, I'm";
  const secondPart = " Youssef";
  const subtitleContent = "Full Stack Developer";
  const descriptionContent = "I create engaging web experiences with modern technologies";

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
    // Typing animation
    let index = 0;
    let phase = 1;

    const interval = setInterval(() => {
      if (phase === 1) {
        if (index <= firstPart.length) {
          setText1(firstPart.slice(0, index));
          index++;
        } else {
          phase = 2;
          index = 0;
        }
      } else if (phase === 2) {
        if (index <= secondPart.length) {
          setText2(secondPart.slice(0, index));
          index++;
        } else {
          phase = 3;
          index = 0;
          setCurrentLine(2);
        }
      } else if (phase === 3) {
        if (index <= subtitleContent.length) {
          setSubtitleText(subtitleContent.slice(0, index));
          index++;
        } else {
          phase = 4;
          index = 0;
          setCurrentLine(3);
        }
      } else if (phase === 4) {
        if (index <= descriptionContent.length) {
          setDescriptionText(descriptionContent.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setCurrentLine(0);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className={styles.hero}>
      {isSplineVisible && (
        <div className={styles.splineContainer}>
          <SplineScene />
        </div>
      )}
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          <span>{text1}</span>
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
          <a href="#projects" className={styles.primaryBtn}>View My Work</a>
          <a href="#contact" className={styles.secondaryBtn}>Get in Touch</a>
        </div>
      </div>
      <TechSlider />
    </section>
  );
};

export default React.memo(Hero);
