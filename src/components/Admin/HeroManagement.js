import React, { useState, useEffect } from 'react';
import styles from './HeroManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

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

const normalizeHeroData = (data = {}) => {
  const safeString = (val, fallback = '') => (typeof val === 'string' ? val : fallback);
  const normalizeButton = (btn = {}, defaults) => {
    const parsed = parseMaybeJson(btn) || btn;
    return {
      text: safeString(parsed?.text, defaults.text),
      link: safeString(parsed?.link, defaults.link)
    };
  };

  const defaultButtons = {
    primary: { text: 'View My Work', link: '#projects' },
    secondary: { text: 'Get in Touch', link: '#contact' },
    cv: { text: 'Download CV', link: '/youssef_cv.pdf' }
  };

  return {
    firstName: safeString(data.firstName, "Hi, I'm"),
    lastName: safeString(data.lastName, 'Youssef'),
    title: safeString(data.title, 'Full Stack Developer'),
    description: safeString(data.description, 'I create engaging web experiences with modern technologies'),
    splineUrl: safeString(data.splineUrl, 'https://prod.spline.design/daHslO6sl8nd7EVW/scene.splinecode'),
    primaryButton: normalizeButton(data.primaryButton, defaultButtons.primary),
    secondaryButton: normalizeButton(data.secondaryButton, defaultButtons.secondary),
    cvButton: normalizeButton(data.cvButton, defaultButtons.cv)
  };
};

const getFileName = (url = '') => {
  if (typeof url !== 'string') return '';
  const parts = url.split('/');
  const last = parts[parts.length - 1] || '';
  // Preserve extension if present, default to png otherwise
  const match = last.match(/\\.([^.]+)$/);
  if (!match) return last || '';
  return last;
};

const HeroManagement = () => {
  const [heroData, setHeroData] = useState({
    firstName: "Hi, I'm",
    lastName: "Youssef",
    title: "Full Stack Developer",
    description: "I create engaging web experiences with modern technologies",
    splineUrl: "https://prod.spline.design/daHslO6sl8nd7EVW/scene.splinecode",
    primaryButton: {
      text: "View My Work",
      link: "#projects"
    },
    secondaryButton: {
      text: "Get in Touch",
      link: "#contact"
    },
    cvButton: {
      text: "Download CV",
      link: "/youssef_cv.pdf"
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hero`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHeroData(normalizeHeroData(data));
      } else {
        setError('Failed to fetch hero data');
      }
    } catch (error) {
      setError('Error loading hero data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/hero`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(heroData)
      });

      if (response.ok) {
        setSuccess('Hero section updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update hero section');
      }
    } catch (error) {
      setError('Error updating hero section');
    } finally {
      setLoading(false);
    }
  };

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name.includes('.')) {
    const [parentKey, childKey] = name.split('.');
    setHeroData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  } else {
    setHeroData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};


  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={styles.heroManagement}>
      <h2>Hero Section Management</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="firstName">First Part</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={heroData.firstName}
            onChange={handleChange}
            placeholder="Hi, I'm"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName">Second Part</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={heroData.lastName}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={heroData.title}
            onChange={handleChange}
            placeholder="Your title"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={heroData.description}
            onChange={handleChange}
            placeholder="Your description"
            rows="3"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="splineUrl">Spline Scene URL</label>
          <input
            type="text"
            id="splineUrl"
            name="splineUrl"
            value={heroData.splineUrl}
            onChange={handleChange}
            placeholder="https://prod.spline.design/your-scene-url/scene.splinecode"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Primary Button</label>
          <div className={styles.buttonFields}>
            <input
              type="text"
              name="primaryButton.text"
              value={heroData.primaryButton.text}
              onChange={(e) => setHeroData(prev => ({
                ...prev,
                primaryButton: { ...prev.primaryButton, text: e.target.value }
              }))}
              placeholder="Button Text"
            />
            <input
              type="text"
              name="primaryButton.link"
              value={heroData.primaryButton.link}
              onChange={(e) => setHeroData(prev => ({
                ...prev,
                primaryButton: { ...prev.primaryButton, link: e.target.value }
              }))}
              placeholder="Button Link"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Secondary Button</label>
          <div className={styles.buttonFields}>
            <input
              type="text"
              name="secondaryButton.text"
              value={heroData.secondaryButton.text}
              onChange={(e) => setHeroData(prev => ({
                ...prev,
                secondaryButton: { ...prev.secondaryButton, text: e.target.value }
              }))}
              placeholder="Button Text"
            />
            <input
              type="text"
              name="secondaryButton.link"
              value={heroData.secondaryButton.link}
              onChange={(e) => setHeroData(prev => ({
                ...prev,
                secondaryButton: { ...prev.secondaryButton, link: e.target.value }
              }))}
              placeholder="Button Link"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>CV Button</label>
          <div className={styles.buttonFields}>
            <input
              type="text"
              name="cvButton.text"
              value={heroData.cvButton.text}
              onChange={(e) => setHeroData(prev => ({
                ...prev,
                cvButton: { ...prev.cvButton, text: e.target.value }
              }))}
              placeholder="CV Button Text"
            />
            <div className={styles.fileUploadContainer}>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.pdf"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('cv', file);
                    
                    try {
                      setLoading(true);
                      const token = localStorage.getItem('adminToken');
                      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload/cv`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`
                        },
                        body: formData
                      });

                      if (response.ok) {
                        // Fetch updated hero data to ensure we have the latest state
                        await fetchHeroData();
                        setSuccess('CV uploaded successfully');
                      } else {
                        setError('Failed to upload CV');
                      }
                    } catch (error) {
                      setError('Error uploading CV');
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
              <span className={styles.currentFile}>
                {heroData.cvButton.link ? 
                  'Current CV: ' + getFileName(heroData.cvButton.link) :
                  'No CV uploaded yet'
                }
              </span>
            </div>
          </div>
        </div>

        <div className={styles.preview}>
          <h3>Preview</h3>
          <div className={styles.previewContent}>
            <h1>
              <span>{heroData.firstName}</span>
              <span>{heroData.lastName}</span>
            </h1>
            <h2>{heroData.title}</h2>
            <p>{heroData.description}</p>
            <div className={styles.previewButtons}>
              <button className={styles.previewPrimaryBtn}>
                {heroData.primaryButton.text}
              </button>
              <button className={styles.previewSecondaryBtn}>
                {heroData.secondaryButton.text}
              </button>
              <a
                href={heroData.cvButton.link}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={styles.previewSecondaryBtn}
              >
                {heroData.cvButton.text}
              </a>
            </div>
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
};


export default HeroManagement;
