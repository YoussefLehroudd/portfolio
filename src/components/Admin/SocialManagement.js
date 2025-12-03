import React, { useState, useEffect } from 'react';
import styles from './SocialManagement.module.css';
import { FaGithub, FaWhatsapp, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { apiUrl } from '../../config/api';

const SocialManagement = () => {
  const [socialData, setSocialData] = useState({
    github: '',
    whatsapp: '',
    instagram: '',
    linkedin: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSocialData();
  }, []);

  const fetchSocialData = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/social'));
      if (response.ok) {
        const data = await response.json();
        setSocialData(data);
      } else {
        setError('Failed to fetch social links');
      }
    } catch (error) {
      setError('Error loading social links');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(apiUrl('/api/social'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(socialData)
      });

      if (response.ok) {
        setSuccess('Social links updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update social links');
      }
    } catch (error) {
      setError('Error updating social links');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSocialData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.heroManagement}>
      <h2>Social Links Management</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>GitHub URL</label>
          <input
            type="url"
            name="github"
            value={socialData.github}
            onChange={handleChange}
            placeholder="https://github.com/yourusername"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>WhatsApp URL</label>
          <input
            type="url"
            name="whatsapp"
            value={socialData.whatsapp}
            onChange={handleChange}
            placeholder="https://wa.me/yourphonenumber"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Instagram URL</label>
          <input
            type="url"
            name="instagram"
            value={socialData.instagram}
            onChange={handleChange}
            placeholder="https://instagram.com/yourusername"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>LinkedIn URL</label>
          <input
            type="url"
            name="linkedin"
            value={socialData.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/yourusername"
            required
          />
        </div>

        <div className={styles.preview}>
          <h3>Preview</h3>
          <div className={styles.previewContent}>
            <a href={socialData.github} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
              <FaGithub /> GitHub
            </a>
            <a href={socialData.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
              <FaWhatsapp /> WhatsApp
            </a>
            <a href={socialData.instagram} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
              <FaInstagram /> Instagram
            </a>
            <a href={socialData.linkedin} target="_blank" rel="noopener noreferrer" className={styles.previewLink}>
              <FaLinkedin /> LinkedIn
            </a>
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default SocialManagement;
