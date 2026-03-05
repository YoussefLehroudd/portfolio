import React, { useEffect, useState } from 'react';
import styles from './StockForm.module.css';
import { useAuth } from '../../context/AuthContext';

const StockForm = ({ stock, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    emailBody: '',
    imageUrl: '',
    status: 'draft',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [errors, setErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const { admin } = useAuth();

  useEffect(() => {
    const className = 'modal-open';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, []);

  useEffect(() => {
    if (stock) {
      setFormData({
        title: stock.title || '',
        emailBody: stock.emailBody || '',
        imageUrl: stock.imageUrl || '',
        status: stock.status || 'draft',
        tags: Array.isArray(stock.tags) ? stock.tags : []
      });
      setImagePreview(stock.imageUrl || '');
    }
  }, [stock]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!admin) {
      setErrors(['You must be logged in to upload images']);
      return;
    }

    try {
      setUploading(true);
      setErrors([]);
      const imageData = new FormData();
      imageData.append('image', file);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: imageData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const imageUrl = data.url?.startsWith('http') ? data.url : `https:${data.url}`;
      setFormData((prev) => ({
        ...prev,
        imageUrl
      }));
      setImagePreview(imageUrl);
    } catch (error) {
      setErrors(['Failed to upload image']);
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: ''
    }));
    setImagePreview('');
  };

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    const tags = tagInput
      .split(/[#,]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag));

    setFormData((prev) => ({
      ...prev,
      tags: Array.from(new Set([...(prev.tags || []), ...tags]))
    }));
    setTagInput('');
  };

  const handleTagRemove = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, idx) => idx !== index)
    }));
  };

  const validate = () => {
    const nextErrors = [];
    if (!formData.title.trim()) nextErrors.push('Title is required');
    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      title: formData.title.trim(),
      emailBody: formData.emailBody,
      imageUrl: formData.imageUrl,
      status: formData.status,
      tags: formData.tags
    });
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleTagAdd();
    }
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        <button className={styles.closeButton} onClick={onClose} type="button">×</button>
        <h2>{stock ? 'Edit Stock Item' : 'Add Stock Item'}</h2>

        {errors.length > 0 && (
          <div className={styles.error}>
            <ul className={styles.errorList}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Netflix"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="emailBody">Email Text</label>
            <textarea
              id="emailBody"
              name="emailBody"
              value={formData.emailBody}
              onChange={handleChange}
              placeholder="Write the email body here..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">Image (optional)</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              className={styles.fileInput}
              disabled={uploading}
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <button type="button" className={styles.removeImageButton} onClick={removeImage}>
                  Remove image
                </button>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Tags</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add tags (separate by # or comma)"
              />
              <button type="button" onClick={handleTagAdd}>Add</button>
            </div>
            <div className={styles.tags}>
              {formData.tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                  <button type="button" onClick={() => handleTagRemove(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {stock ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockForm;
