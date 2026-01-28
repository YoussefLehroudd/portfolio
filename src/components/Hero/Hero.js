import React, { useState, useEffect } from 'react';
import styles from './Hero.module.css';

const Hero = ({ isMagicTheme = false }) => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const [currentLine, setCurrentLine] = useState(1);
  const [data, setData] = useState(null);
  const [animationPosition, setAnimationPosition] = useState({ x: 75, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch hero data
    const fetchHeroData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hero`);
        if (response.ok) {
          const heroData = await response.json();
          const parseMaybeJson = (value) => {
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return undefined;
              }
            }
            return value;
          };

          setData({
            ...heroData,
            primaryButton: parseMaybeJson(heroData.primaryButton) || heroData.primaryButton,
            secondaryButton: parseMaybeJson(heroData.secondaryButton) || heroData.secondaryButton,
            cvButton: parseMaybeJson(heroData.cvButton) || heroData.cvButton
          });
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      }
    };

    fetchHeroData();
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

  // Drag functionality
  const handleMouseDown = (e) => {
    if (e.button === 2) { // Right click
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - (animationPosition.x * window.innerWidth / 100),
        y: e.clientY - (animationPosition.y * window.innerHeight / 100)
      });
    }
  };
  useEffect(() => {
    const handleMouseMoveEvent = (e) => {
      if (isDragging) {
        const newX = ((e.clientX - dragStart.x) / window.innerWidth) * 100;
        const newY = ((e.clientY - dragStart.y) / window.innerHeight) * 100;
        
        // Keep within bounds
        const boundedX = Math.max(10, Math.min(90, newX));
        const boundedY = Math.max(10, Math.min(90, newY));
        
        setAnimationPosition({ x: boundedX, y: boundedY });
      }
    };

    const handleMouseUpEvent = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveEvent);
      document.addEventListener('mouseup', handleMouseUpEvent);
      document.body.style.cursor = 'grabbing';
    } else {
      document.removeEventListener('mousemove', handleMouseMoveEvent);
      document.removeEventListener('mouseup', handleMouseUpEvent);
      document.body.style.cursor = 'default';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveEvent);
      document.removeEventListener('mouseup', handleMouseUpEvent);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, dragStart]);

  if (!data) return null;

  const resolveBtn = (btnData = {}, defaults) => {
    const text = typeof btnData.text === 'string' ? btnData.text.trim() : '';
    const link = typeof btnData.link === 'string' ? btnData.link.trim() : '';
    return {
      text: text || defaults.text,
      link: link || defaults.link
    };
  };

  const primaryBtn = resolveBtn(data?.primaryButton, { text: 'View My Work', link: '#projects' });
  const secondaryBtn = resolveBtn(data?.secondaryButton, { text: 'Get in Touch', link: '#contact' });
  const cvBtn = resolveBtn(data?.cvButton, { text: 'Download CV', link: '/youssef_cv.pdf' });
  const isCvPdf = cvBtn.link?.toLowerCase().includes('.pdf');
  const cvDownloadName = (() => {
    if (typeof cvBtn.link !== 'string') return 'youssef_cv';
    const parts = cvBtn.link.split('/').pop() || 'youssef_cv';
    return parts.includes('.') ? parts : `${parts}.png`;
  })();

  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.animationContainer}>
        <div 
          className={styles.superAnimation}
          style={{
            left: `${animationPosition.x}%`,
            top: `${animationPosition.y}%`,
            transform: 'translate(-50%, -50%)',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Main pulsing core */}
          <div className={styles.mainCore}></div>
          
          {/* Orbiting particles */}
          <div className={styles.orbitRing1}>
            <div className={styles.particle1}></div>
            <div className={styles.particle2}></div>
            <div className={styles.particle3}></div>
          </div>
          
          <div className={styles.orbitRing2}>
            <div className={styles.particle4}></div>
            <div className={styles.particle5}></div>
          </div>
          
          <div className={styles.orbitRing3}>
            <div className={styles.particle6}></div>
            <div className={styles.particle7}></div>
            <div className={styles.particle8}></div>
            <div className={styles.particle9}></div>
          </div>
          
          {/* Floating sparkles */}
          <div className={styles.sparkle1}></div>
          <div className={styles.sparkle2}></div>
          <div className={styles.sparkle3}></div>
          <div className={styles.sparkle4}></div>
          <div className={styles.sparkle5}></div>
          <div className={styles.sparkle6}></div>
          <div className={styles.sparkle7}></div>
          <div className={styles.sparkle8}></div>
          
          {/* Energy waves */}
          <div className={styles.energyWave1}></div>
          <div className={styles.energyWave2}></div>
          <div className={styles.energyWave3}></div>
          
          {/* Rotating rings */}
          <div className={styles.rotatingRing1}></div>
          <div className={styles.rotatingRing2}></div>
          <div className={styles.rotatingRing3}></div>
          
          {/* Lightning effects */}
          <div className={styles.lightning1}></div>
          <div className={styles.lightning2}></div>
          <div className={styles.lightning3}></div>
          
          {/* Motivational words */}
          <div className={styles.motivationalWord1}>Success</div>
          <div className={styles.motivationalWord2}>Dream</div>
          <div className={styles.motivationalWord3}>Achieve</div>
          <div className={styles.motivationalWord4}>Create</div>
          <div className={styles.motivationalWord5}>Inspire</div>
          <div className={styles.motivationalWord6}>Build</div>
          <div className={styles.motivationalWord7}>Code</div>
          <div className={styles.motivationalWord8}>Innovate</div>
        </div>
      </div>
      {isMagicTheme && (
        <div className={styles.wordOrbit}>
          {['Dream', 'Build', 'Create', 'Inspire', 'Achieve', 'Innovate', 'Lead', 'Imagine'].map((word, idx) => (
            <span key={word} className={`${styles.orbitWord} ${styles[`orbitWord${idx + 1}`]}`}>
              {word}
            </span>
          ))}
        </div>
      )}
      <div className={styles.heroContent}>
        <div className={`${styles.heroRibbon} md:gap-3 gap-2`}>
          <span className={`${styles.ribbonBadge} rounded-full bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em]`}>
            Magic 2026
          </span>
          <span className={`${styles.ribbonNote} text-sm text-white/80`}>
            Product-led full stack experiences with motion, 3D and intent.
          </span>
        </div>
        <h1 className={styles.title}>
          <span>{text1}</span>
          <span className={styles.nameRotate}>{text2}</span>
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
          <a href={primaryBtn.link} className={styles.primaryBtn}>
            {primaryBtn.text}
          </a>
          <a href={secondaryBtn.link} className={styles.secondaryBtn}>
            {secondaryBtn.text}
          </a>
          {cvBtn.link && (
            <a 
              href={cvBtn.link} 
              className={styles.secondaryBtn}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                if (isCvPdf) {
                  // Direct download for PDFs (handles CORS by fetching first)
                  fetch(cvBtn.link)
                    .then(resp => {
                      if (!resp.ok) throw new Error('Download failed');
                      return resp.blob();
                    })
                    .then(blob => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = cvDownloadName.endsWith('.pdf') ? cvDownloadName : `${cvDownloadName}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    })
                    .catch(() => {
                      // Fallback to opening in new tab if download fails
                      window.open(cvBtn.link, '_blank', 'noopener');
                    });
                  return;
                }

                const win = window.open('', 'CV Preview');
                win.document.write(`<!DOCTYPE html>
                  <html>
                    <head>
                      <title>Youssef Lehroud - CV</title>
                      <style>
                        html, body { margin: 0; padding: 0; height: 100%; }
                        body { 
                          background: #0e0e0e; 
                          display: flex; 
                          flex-direction: column; 
                          align-items: center; 
                          padding: 32px 16px 140px;
                          box-sizing: border-box;
                          overflow-y: auto;
                        }
                        .container { width: min(1200px, 100%); display: flex; justify-content: center; }
                        img { width: 100%; height: auto; display: block; box-shadow: 0 0 20px rgba(0,0,0,0.3); }
                        .actions { 
                          position: fixed;
                          bottom: 20px;
                          left: 50%;
                          transform: translateX(-50%);
                          display: flex;
                          gap: 10px;
                          z-index: 1000;
                          background: rgba(0,0,0,0.85);
                          padding: 10px 18px;
                          border-radius: 12px;
                          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
                        }
                        .btn { 
                          background: #00ff9d; 
                          color: #0e0e0e; 
                          padding: 12px 20px; 
                          border: none; 
                          border-radius: 8px; 
                          cursor: pointer;
                          font-size: 15px;
                          font-weight: 700;
                          text-decoration: none;
                          display: inline-flex;
                          align-items: center;
                          transition: all 0.25s ease;
                        }
                        .btn:hover {
                          background: #00cc7d;
                          transform: translateY(-2px);
                        }
                        @media print {
                          .actions { display: none; }
                          body { background: white; padding: 0; }
                          img { box-shadow: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <img src="${cvBtn.link}" alt="CV" />
                      </div>
                      <div class="actions">
                        <a href="${cvBtn.link}" download="${cvDownloadName}" class="btn">Download</a>
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
                              a.download = '${cvDownloadName}';
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
    </section>
  );
};

export default React.memo(Hero);
