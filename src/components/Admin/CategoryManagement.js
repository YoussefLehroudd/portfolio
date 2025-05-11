import React, { useState, useEffect } from 'react';
import styles from './CategoryManagement.module.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  // Clear success message after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Clear error message after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000); // Error messages stay longer
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setError('');
      } else {
        setError('Failed to fetch categories');
      }
    } catch (error) {
      setError('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategory.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setCategories([...categories, data]);
        setNewCategory('');
        setError('');
        setSuccess('Category added successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add category');
      }
    } catch (error) {
      setError('Error adding category');
    }
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setEditValue(category.name);
  };

  const handleEditSave = async () => {
    if (!editValue.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories/${editingCategory._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editValue.trim() })
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id ? updatedCategory : cat
        ));
        setEditingCategory(null);
        setEditValue('');
        setError('');
        setSuccess('Category updated successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update category');
      }
    } catch (error) {
      setError('Error updating category');
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories/${category._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setCategories(categories.filter(cat => cat._id !== category._id));
        setError('');
        setSuccess('Category deleted successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete category. It may be in use by projects.');
      }
    } catch (error) {
      setError('Error deleting category');
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddCategory();
      } else if (action === 'edit') {
        handleEditSave();
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading categories...</div>;
  }

  return (
    <div className={styles.categoryManagement}>
      <div className={styles.addCategory}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, 'add')}
          placeholder="New category name"
          className={styles.input}
        />
        <button onClick={handleAddCategory} className={styles.addButton}>
          Add Category
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.categoriesList}>
        <h3>Categories</h3>
        <div className={styles.categoryGroup}>
          {categories.map(category => (
            <div key={category._id} className={styles.categoryItem}>
              {editingCategory && editingCategory._id === category._id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'edit')}
                    className={styles.input}
                  />
                  <button onClick={handleEditSave} className={styles.saveButton}>
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingCategory(null);
                      setEditValue('');
                    }} 
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span>{category.name}</span>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleEditClick(category)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
