import React from 'react';
import styles from './TechSlider.module.css';
import { FaHtml5, FaReact, FaNodeJs, FaPhp, FaLaravel, FaPython } from 'react-icons/fa';
import { SiExpress, SiMongodb, SiMysql, SiJavascript } from 'react-icons/si';
import { TbBrandReactNative } from 'react-icons/tb';

const TechSlider = () => {
  const technologies = [
    { icon: <FaHtml5 className={styles.html} />, name: 'HTML' },
    { icon: <FaReact className={styles.react} />, name: 'React' },
    { icon: <FaNodeJs className={styles.node} />, name: 'Node.js' },
    { icon: <SiExpress className={styles.express} />, name: 'Express' },
    { icon: <SiMongodb className={styles.mongo} />, name: 'MongoDB' },
    { icon: <TbBrandReactNative className={styles.reactNative} />, name: 'React Native' },
    { icon: <SiMysql className={styles.mysql} />, name: 'MySQL' },
    { icon: <FaPhp className={styles.php} />, name: 'PHP' },
    { icon: <FaLaravel className={styles.laravel} />, name: 'Laravel' },
    { icon: <SiJavascript className={styles.javascript} />, name: 'JavaScript' },
    { icon: <FaPython className={styles.python} />, name: 'Python' }
  ];

  // Create multiple copies for smoother infinite scroll
  const repeatedTechnologies = [...technologies, ...technologies, ...technologies, ...technologies];

  return (
    <div className={styles.slider}>
      <div className={styles.track}>
        {repeatedTechnologies.map((tech, index) => (
          <div key={index} className={styles.techItem}>
            <div className={styles.icon}>{tech.icon}</div>
            <span className={styles.name}>{tech.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechSlider;
