import React, { useState, useEffect } from 'react';
import styles from './AboutManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

const AboutManagement = () => {
  const [aboutData, setAboutData] = useState({
    description: '',
    skillCategories: [
      { title: 'Frontend', skills: [] },
      { title: 'Backend', skills: [] },
      { title: 'Tools & Others', skills: [] }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const handleDescriptionChange = (e) => {
    setAboutData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleSkillChange = (categoryIndex, skillIndex, value) => {
    setAboutData(prev => {
      const newSkillCategories = [...prev.skillCategories];
      newSkillCategories[categoryIndex].skills[skillIndex] = value;
      return {
        ...prev,
        skillCategories: newSkillCategories
      };
    });
  };

  const handleAddSkill = (categoryIndex) => {
    setAboutData(prev => {
      const newSkillCategories = [...prev.skillCategories];
      // Add only one empty skill if none exists to prevent duplicates
      if (!newSkillCategories[categoryIndex].skills.includes('')) {
        newSkillCategories[categoryIndex].skills.push('');
      }
      return {
        ...prev,
        skillCategories: newSkillCategories
      };
    });
  };

  const handleRemoveSkill = (categoryIndex, skillIndex) => {
    setAboutData(prev => {
      const newSkillCategories = [...prev.skillCategories];
      newSkillCategories[categoryIndex].skills.splice(skillIndex, 1);
      return {
        ...prev,
        skillCategories: newSkillCategories
      };
    });
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
