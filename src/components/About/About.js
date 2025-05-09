import React from 'react';
import styles from './About.module.css';

const About = () => {
  return (
    <section id="about" className={styles.about}>
      <div className={styles.container}>
        <div className={styles.content}>
          <span></span>
          <h2 className={styles.title}>About Me</h2>
          <p className={styles.description}>
            I'm a passionate Full Stack Developer with expertise in modern web technologies. 
            I specialize in creating engaging and responsive web applications using React, Node.js, 
            and other cutting-edge tools. My approach combines clean code practices with creative 
            problem-solving to deliver exceptional user experiences.
          </p>
          <div className={styles.skills}>
            <h3>Technical Skills</h3>
            <div className={styles.skillGrid}>
              <div className={styles.skillCategory}>
                <span></span>
                <h4>Frontend</h4>
                <ul>
                  <li>React.js</li>
                  <li>JavaScript</li>
                  <li>HTML & CSS</li>
                  <li>Responsive Design</li>
                </ul>
              </div>
              <div className={styles.skillCategory}>
                <span></span>
                <h4>Backend</h4>
                <ul>
                  <li>Node.js</li>
                  <li>Express.js</li>
                  <li>RESTful APIs</li>
                  <li>MongoDB</li>
                </ul>
              </div>
              <div className={styles.skillCategory}>
                <span></span>
                <h4>Tools & Others</h4>
                <ul>
                  <li>Git & GitHub</li>
                  <li>VS Code</li>
                  <li>Figma</li>
                  <li>Docker</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
