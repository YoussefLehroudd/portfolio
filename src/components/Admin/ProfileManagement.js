import React, { useState, useEffect, useRef } from 'react';
import styles from './ProfileManagement.module.css';
import AdminSkeleton from './AdminSkeleton';
import SeoPreviewModal from './SeoPreviewModal';

const ProfileManagement = () => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    seoTitle: '',
    seoDescription: '',
    seoImage: '',
    password: '',
    currentPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOgUploading, setIsOgUploading] = useState(false);
  const ogFileInputRef = useRef(null);
  const [seoPreviewOpen, setSeoPreviewOpen] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          seoImage: data.seoImage || ''
        }));
      } else {
        setError('Failed to fetch profile data');
      }
    } catch (error) {
      setError('Error loading profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOgUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      event.target.value = '';
      return;
    }

    try {
      setIsOgUploading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      setProfileData(prev => ({
        ...prev,
        seoImage: data.url || ''
      }));
      setSuccess('OG image uploaded. Save changes to apply.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload image');
    } finally {
      setIsOgUploading(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={styles.heroManagement}>
      <h2>Profile Management</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            value={profileData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            value={profileData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profileData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeader}>
            <h3>SEO Settings</h3>
            <p>Control title, description, and the image shown on social previews.</p>
          </div>
          <button
            type="button"
            className={styles.previewButton}
            onClick={() => setSeoPreviewOpen(true)}
          >
            Preview
          </button>
        </div>

        <div className={styles.formGroup}>
          <label>SEO Title</label>
          <input
            type="text"
            name="seoTitle"
            value={profileData.seoTitle}
            onChange={handleChange}
            placeholder="Portfolio | Full Stack Developer"
          />
        </div>

        <div className={styles.formGroup}>
          <label>SEO Description</label>
          <textarea
            name="seoDescription"
            value={profileData.seoDescription}
            onChange={handleChange}
            placeholder="Short summary for search engines and social sharing."
            rows="4"
          />
        </div>

        <div className={styles.formGroup}>
          <label>OG Image URL</label>
          <input
            type="text"
            name="seoImage"
            value={profileData.seoImage}
            onChange={handleChange}
            placeholder="https://yourdomain.com/og-image.png"
          />
          <div className={styles.uploadRow}>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={() => ogFileInputRef.current?.click()}
              disabled={isOgUploading}
            >
              {isOgUploading ? 'Uploading...' : 'Upload image'}
            </button>
            <span className={styles.uploadHint}>Recommended size: 1200×630</span>
            <input
              ref={ogFileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleOgUpload}
              disabled={isOgUploading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={profileData.currentPassword}
            onChange={handleChange}
            placeholder="Enter current password to make changes"
          />
        </div>

        <div className={styles.formGroup}>
          <label>New Password</label>
          <input
            type="password"
            name="password"
            value={profileData.password}
            onChange={handleChange}
            placeholder="Leave blank to keep current password"
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>

      <SeoPreviewModal
        isOpen={seoPreviewOpen}
        onClose={() => setSeoPreviewOpen(false)}
        title={profileData.seoTitle}
        description={profileData.seoDescription}
        image={profileData.seoImage}
        url={typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}
      />
    </div>
  );
};

export default ProfileManagement;
