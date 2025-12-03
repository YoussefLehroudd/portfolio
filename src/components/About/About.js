import React, { useState, useEffect } from 'react';
import styles from './About.module.css';
import { apiUrl } from '../../config/api';

const About = () => {
  const [aboutData, setAboutData] = useState(null);

  const [error, setError] = useState('');

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await fetch(apiUrl('/api/about'));
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

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!aboutData) {
    return null;
  }

  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span></span>
          <h2 className={styles.title}>About Me</h2>
          <p className={styles.description}>{aboutData.description}</p>
          <div className={styles.skills}>
            <h3>Technical Skills</h3>
            <div className={styles.skillGrid}>
              {aboutData.skillCategories.map((category, index) => (
                <div key={index} className={styles.skillCategory}>
                  <span></span>
                  <h4>{category.title}</h4>
                  <ul>
                    {category.skills.map((skill, skillIndex) => (
                      <li key={skillIndex}>{skill}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
