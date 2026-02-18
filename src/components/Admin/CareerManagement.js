import React, { useEffect, useMemo, useState } from 'react';
import styles from './CareerManagement.module.css';
import AdminSkeleton from './AdminSkeleton';

const emptyItem = {
  title: '',
  place: '',
  period: '',
  description: '',
  tags: [],
  tagsText: '',
  isCurrent: false
};

const CareerManagement = () => {
  const [careerData, setCareerData] = useState({
    headline: '',
    subheadline: '',
    intro: '',
    items: [emptyItem]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const displayItems = useMemo(
    () => careerData.items.map((item, index) => ({ item, index })).reverse(),
    [careerData.items]
  );

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/career`);
      if (response.ok) {
        const data = await response.json();
        setCareerData({
          headline: data.headline || '',
          subheadline: data.subheadline || '',
          intro: data.intro || '',
          items: Array.isArray(data.items) && data.items.length
            ? data.items.map((item) => ({
                ...item,
                tagsText: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tagsText || '')
              }))
            : [emptyItem]
        });
      } else {
        setError('Failed to fetch career data');
      }
    } catch (err) {
      setError('Error loading career data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setCareerData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    setCareerData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], [field]: value };
      return { ...prev, items: nextItems };
    });
  };

  const handleTagsChange = (index, value) => {
    const tags = value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    setCareerData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], tagsText: value, tags };
      return { ...prev, items: nextItems };
    });
  };

  const toggleCurrent = (index) => {
    setCareerData((prev) => {
      const nextItems = [...prev.items];
      nextItems[index] = { ...nextItems[index], isCurrent: !nextItems[index].isCurrent };
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setCareerData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }]
    }));
  };

  const removeItem = (index) => {
    setCareerData((prev) => {
      const nextItems = prev.items.filter((_, idx) => idx !== index);
      return { ...prev, items: nextItems.length ? nextItems : [emptyItem] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const payload = {
        ...careerData,
        items: careerData.items.map((item) => {
          const tagsFromText = typeof item.tagsText === 'string'
            ? item.tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
            : item.tags;
          const { tagsText, ...rest } = item;
          return {
            ...rest,
            tags: Array.isArray(tagsFromText) ? tagsFromText : []
          };
        })
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/career`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess('Career section updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update career section');
      }
    } catch (err) {
      setError('Error updating career section');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={styles.careerManagement}>
      <h2>Career Section Management</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="headline">Headline</label>
          <input
            id="headline"
            type="text"
            value={careerData.headline}
            onChange={(e) => handleFieldChange('headline', e.target.value)}
            placeholder="Career Journey"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="subheadline">Subheadline</label>
          <input
            id="subheadline"
            type="text"
            value={careerData.subheadline}
            onChange={(e) => handleFieldChange('subheadline', e.target.value)}
            placeholder="Where I studied and what I build today"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="intro">Intro</label>
          <textarea
            id="intro"
            rows="4"
            value={careerData.intro}
            onChange={(e) => handleFieldChange('intro', e.target.value)}
            placeholder="Short intro about your journey"
          />
        </div>

        <div className={styles.itemsSection}>
          <div className={styles.sectionHeader}>
            <h3>Career Items</h3>
            <button type="button" className={styles.addButton} onClick={addItem}>
              Add Item
            </button>
          </div>

          {displayItems.map((entry, displayIndex) => {
            const { item, index } = entry;
            return (
            <div key={`career-item-${index}`} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <h4>Item {displayIndex + 1}</h4>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeItem(index)}
                >
                  Remove
                </button>
              </div>

              <div className={styles.itemGrid}>
                <div className={styles.formGroup}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    placeholder="Full Stack Developer"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Place</label>
                  <input
                    type="text"
                    value={item.place}
                    onChange={(e) => handleItemChange(index, 'place', e.target.value)}
                    placeholder="Company / University"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Period</label>
                  <input
                    type="text"
                    value={item.period}
                    onChange={(e) => handleItemChange(index, 'period', e.target.value)}
                    placeholder="2023 — Present"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={item.tagsText ?? (item.tags || []).join(', ')}
                    onChange={(e) => handleTagsChange(index, e.target.value)}
                    placeholder="React, Node.js, UI/UX"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows="3"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Describe what you did or learned"
                />
              </div>

              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={item.isCurrent || false}
                  onChange={() => toggleCurrent(index)}
                />
                Mark as current role
              </label>
            </div>
          );
          })}
        </div>

        <div className={styles.preview}>
          <h3>Preview</h3>
          <div className={styles.previewContent}>
            <h4>{careerData.headline}</h4>
            <p>{careerData.subheadline}</p>
            <p>{careerData.intro}</p>
            <div className={styles.previewItems}>
              {displayItems.map((entry) => {
                const { item, index } = entry;
                return (
                  <div key={`preview-${index}`} className={styles.previewItem}>
                    <strong>{item.title}</strong>
                    <span>{item.place}</span>
                    <em>{item.period}</em>
                  </div>
                );
              })}
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

export default CareerManagement;
