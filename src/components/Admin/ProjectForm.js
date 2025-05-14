import React, { useState, useEffect } from 'react';
import styles from './ProjectForm.module.css';

const ProjectForm = ({ project, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    demoLink: '',
    githubLink: '',
    type: '',
    category: '',
    technologies: [],
    timeline: '',
    features: [],
    isVisible: true
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [newTechnology, setNewTechnology] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (project) {
      setFormData(project);
      if (project.image) {
        setImagePreview(project.image);
      }
    }
  }, [project]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setErrors([]);
      } else {
        setErrors(['Failed to fetch categories']);
      }
    } catch (error) {
      setErrors(['Error loading categories']);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        try {
          // Create FormData for image upload
          const imageData = new FormData();
          imageData.append('image', file);

          // Upload to Cloudinary through our API
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload/image`, {
            method: 'POST',
            body: imageData,
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to upload image');
          }
          
          // Ensure the Cloudinary URL is absolute
          const imageUrl = data.url.startsWith('http') ? data.url : `https:${data.url}`;
          
          // Update form with Cloudinary URL
          setFormData(prev => ({
            ...prev,
            image: imageUrl
          }));
          
          // Set preview to Cloudinary URL
          setImagePreview(imageUrl);
          setErrors([]);
        } catch (error) {
          setErrors(prev => [...prev, 'Failed to upload image']);
          console.error('Error uploading image:', error);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleTechnologyAdd = () => {
    if (!newTechnology.trim()) return;

    // Split by # or comma and trim each technology
    const technologies = newTechnology
      .split(/[#,]/)
      .map(tech => tech.trim())
      .filter(tech => tech !== '')
      .map(tech => tech.startsWith('#') ? tech.substring(1) : tech);

    setFormData(prev => ({
      ...prev,
      technologies: [...new Set([...prev.technologies, ...technologies])]
    }));
    setNewTechnology('');
  };

  const handleTechnologyRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureAdd = () => {
    if (!newFeature.trim()) return;
    
    // Split by # or comma and trim each feature
    const features = newFeature
      .split(/[#,]/)
      .map(feature => feature.trim())
      .filter(feature => feature !== '')
      .map(feature => feature.startsWith('#') ? feature.substring(1) : feature);

    setFormData(prev => ({
      ...prev,
      features: [...new Set([...prev.features, ...features])]
    }));
    setNewFeature('');
  };

  const handleFeatureRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.title.trim()) errors.push('Title is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (!formData.image && !imagePreview) errors.push('Image is required');
    if (!formData.demoLink.trim()) errors.push('Demo URL is required');
    if (!formData.githubLink.trim()) errors.push('GitHub URL is required');
    if (!formData.type.trim()) errors.push('Project type is required');
    if (!formData.category) errors.push('Category is required');
    if (!formData.timeline.trim()) errors.push('Timeline is required');
    if (formData.technologies.length === 0) errors.push('At least one technology is required');
    if (formData.features.length === 0) errors.push('At least one feature is required');
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create data object for submission
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'technologies' || key === 'features') {
        submitData.append(key, JSON.stringify(formData[key]));
      } else if (key === 'image') {
        // Use the Cloudinary URL directly
        submitData.append(key, formData.image || imagePreview || '');
      } else {
        submitData.append(key, formData[key]);
      }
    });

    onSubmit(submitData);
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'technology') {
        handleTechnologyAdd();
      } else if (action === 'feature') {
        handleFeatureAdd();
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading categories...</div>;
  }

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formContainer}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        <h2>{project ? 'Edit Project' : 'Add New Project'}</h2>
        
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
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">Project Image</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleChange}
              accept="image/*"
              className={styles.fileInput}
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="demoLink">Demo URL</label>
            <input
              type="url"
              id="demoLink"
              name="demoLink"
              value={formData.demoLink}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="githubLink">GitHub URL</label>
            <input
              type="url"
              id="githubLink"
              name="githubLink"
              value={formData.githubLink}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type">Project Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="timeline">Timeline</label>
            <input
              type="text"
              id="timeline"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              required
              placeholder="e.g., 6 weeks"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Technologies</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'technology')}
                placeholder="Add technologies (separate by # or comma)"
              />
              <button type="button" onClick={handleTechnologyAdd}>Add</button>
            </div>
            <div className={styles.tags}>
              {formData.technologies.map((tech, index) => (
                <span key={index} className={styles.tag}>
                  {tech}
                  <button type="button" onClick={() => handleTechnologyRemove(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Features</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'feature')}
                placeholder="Add features (separate by # or comma)"
              />
              <button type="button" onClick={handleFeatureAdd}>Add</button>
            </div>
            <div className={styles.tags}>
              {formData.features.map((feature, index) => (
                <span key={index} className={styles.tag}>
                  {feature}
                  <button type="button" onClick={() => handleFeatureRemove(index)}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleChange}
              />
              Visible to public
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton}>
              {project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
