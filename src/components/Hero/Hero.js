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
          {data.cvButton.link && (
            <a 
              href={data.cvButton.link} 
              className={styles.secondaryBtn}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                const win = window.open('', 'CV Preview');
                win.document.write(`<!DOCTYPE html>
                  <html>
                    <head>
                      <title>Youssef Lehroud - CV</title>
                      <style>
                        body { margin: 0; background: #1a1a1a; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; }
                        .container { position: relative; max-width: 100%; margin: 20px; }
                        img { max-width: 100%; height: auto; box-shadow: 0 0 20px rgba(0,0,0,0.3); }
                        .actions { 
                          position: fixed;
                          bottom: 20px;
                          left: 50%;
                          transform: translateX(-50%);
                          display: flex;
                          gap: 10px;
                          z-index: 1000;
                          background: rgba(0,0,0,0.8);
                          padding: 10px 20px;
                          border-radius: 10px;
                        }
                        .btn { 
                          background: #00ff9d; 
                          color: #1a1a1a; 
                          padding: 12px 24px; 
                          border: none; 
                          border-radius: 5px; 
                          cursor: pointer;
                          font-size: 16px;
                          font-weight: bold;
                          text-decoration: none;
                          display: inline-flex;
                          align-items: center;
                          transition: all 0.3s ease;
                        }
                        .btn:hover {
                          background: #00cc7d;
                          transform: translateY(-2px);
                        }
                        @media print {
                          .actions { display: none; }
                          body { background: white; }
                          img { box-shadow: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <img src="${data.cvButton.link}" alt="CV" />
                      </div>
                      <div class="actions">
                        <a href="${data.cvButton.link}" download="youssef_cv.png" class="btn">Download</a>
                        <button class="btn" onclick="window.print(); return false;">Print</button>
                      </div>
                      <script>
                        // Force download instead of preview
                        document.querySelector('a[download]').addEventListener('click', (e) => {
                          e.preventDefault();
                          fetch(e.target.href)
                            .then(resp => resp.blob())
                            .then(blob => {
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.style.display = 'none';
                              a.href = url;
                              a.download = 'youssef_cv.png';
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                            });
                        });
                      </script>
                    </body>
                  </html>`);
                win.document.close();
              }}
            >
              {data.cvButton.text}
            </a>
          )}
        </div>
      </div>
      <TechSlider />
    </section>
  );
};

export default React.memo(Hero);
