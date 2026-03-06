import React, { useCallback, useEffect, useState } from 'react';
import styles from './AboutManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

const BASE_CATEGORIES = [
  { title: 'Frontend Languages / Frameworks', skills: [] },
  { title: 'Backend Languages / Frameworks', skills: [] },
  { title: 'Databases', skills: [] },
  { title: 'Tools & Others', skills: [] }
];

const createBaseCategories = () =>
  BASE_CATEGORIES.map((category) => ({
    ...category,
    skills: [...category.skills]
  }));

const normalizeSkillCategories = (categories) => {
  const list = Array.isArray(categories) ? categories : [];
  const mapped = list
    .filter(Boolean)
    .map((category) => {
      const title = category?.title || '';
      const normalizedTitle =
        title === 'Frontend'
          ? 'Frontend Languages / Frameworks'
          : title === 'Backend'
            ? 'Backend Languages / Frameworks'
            : title;
      return {
        ...category,
        title: normalizedTitle,
        skills: Array.isArray(category?.skills) ? category.skills : []
      };
    })
    .filter((category) => category.title);

  const byTitle = new Map();
  mapped.forEach((category) => {
    if (!byTitle.has(category.title)) {
      byTitle.set(category.title, { ...category });
    } else {
      const existing = byTitle.get(category.title);
      const mergedSkills = Array.from(new Set([...(existing.skills || []), ...(category.skills || [])]));
      byTitle.set(category.title, { ...existing, skills: mergedSkills });
    }
  });

  const baseTitles = BASE_CATEGORIES.map((category) => category.title);
  const ordered = createBaseCategories().map((category) => byTitle.get(category.title) || category);
  const extras = mapped.filter((category) => !baseTitles.includes(category.title));
  return [...ordered, ...extras];
};

const AboutManagement = () => {
  const [aboutData, setAboutData] = useState({
    description: '',
    skillCategories: createBaseCategories()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAboutData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/about`);
      if (response.ok) {
        const data = await response.json();
        setAboutData({
          ...data,
          description: typeof data?.description === 'string' ? data.description : '',
          skillCategories: normalizeSkillCategories(data?.skillCategories)
        });
      } else {
        setError('Failed to fetch about data');
      }
    } catch (error) {
      setError('Error loading about data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAboutData();
  }, [fetchAboutData]);

  const handleDescriptionChange = (e) => {
    setAboutData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleSkillChange = (categoryIndex, skillIndex, value) => {
    setAboutData(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        return {
          ...category,
          skills: category.skills.map((skill, i) => (i === skillIndex ? value : skill))
        };
      })
    }));
  };

  const handleAddSkill = (categoryIndex) => {
    setAboutData(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        if (category.skills.includes('')) return category;
        return {
          ...category,
          skills: [...category.skills, '']
        };
      })
    }));
  };

  const handleRemoveSkill = (categoryIndex, skillIndex) => {
    setAboutData(prev => ({
      ...prev,
      skillCategories: prev.skillCategories.map((category, idx) => {
        if (idx !== categoryIndex) return category;
        return {
          ...category,
          skills: category.skills.filter((_, i) => i !== skillIndex)
        };
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/about`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(aboutData)
      });

      if (response.ok) {
        setSuccess('About section updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update about section');
      }
    } catch (error) {
      setError('Error updating about section');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={styles.aboutManagement}>
      <h2>About Section Management</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={aboutData.description}
            onChange={handleDescriptionChange}
            rows="5"
            placeholder="Enter your about section description"
          />
        </div>

        <div className={styles.skillsSection}>
          <h3>Skills</h3>
          {aboutData.skillCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className={styles.skillCategory}>
              <h4>{category.title}</h4>
              <div className={styles.skillsList}>
                {category.skills.map((skill, skillIndex) => (
                  <div key={skillIndex} className={styles.skillItem}>
                    <input
                      type="text"
                      value={skill}
                      onChange={(e) => handleSkillChange(categoryIndex, skillIndex, e.target.value)}
                      placeholder={`Enter ${category.title.toLowerCase()} skill`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(categoryIndex, skillIndex)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddSkill(categoryIndex)}
                  className={styles.addButton}
                >
                  Add Skill
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.preview}>
          <h3>Preview</h3>
          <div className={styles.previewContent}>
            <p>{aboutData.description}</p>
            <div className={styles.previewSkills}>
              {aboutData.skillCategories.map((category, index) => (
                <div key={index} className={styles.previewCategory}>
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

        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default AboutManagement;
