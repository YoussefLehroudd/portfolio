import React, { useState, useEffect } from 'react';
import styles from './ProjectsManagement.module.css';
import ProjectForm from './ProjectForm';
import DeleteModal from './DeleteModal';
import CategoryManagement from './CategoryManagement';
import ProjectDetailModal from './ProjectDetailModal';
import AdminSkeleton from './AdminSkeleton';

const ProjectsManagement = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setError('');
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      setError('Error loading projects');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (projectId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${projectId}/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProjects(projects.map(project => 
          project._id === projectId ? updatedProject : project
        ));
        setSuccess('Project visibility updated successfully');
      } else {
        setError('Failed to toggle project visibility');
      }
    } catch (error) {
      setError('Error updating project');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleDelete = (project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/${projectToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setProjects(projects.filter(project => project._id !== projectToDelete._id));
        setSuccess('Project deleted successfully');
        setIsDeleteModalOpen(false);
        setProjectToDelete(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete project');
      }
    } catch (error) {
      setError('Error deleting project');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingProject 
        ? `${process.env.REACT_APP_API_URL}/api/projects/${editingProject._id}`
        : `${process.env.REACT_APP_API_URL}/api/projects`;
      
      const method = editingProject ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        if (editingProject) {
          setProjects(projects.map(project => 
            project._id === editingProject._id ? data : project
          ));
          setSuccess('Project updated successfully');
        } else {
          setProjects([data, ...projects]);
          setSuccess('Project created successfully');
        }
        setIsFormOpen(false);
        setEditingProject(null);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save project');
      }
    } catch (error) {
      setError('Error saving project');
    }
  };

  if (loading) {
    return <AdminSkeleton />;
  }

  return (
    <div className={styles.projectsManagement}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Projects Management</h2>
          <button 
            onClick={() => setShowCategories(!showCategories)}
            className={styles.manageCategoriesButton}
          >
            {showCategories ? 'Hide Categories' : 'Manage Categories'}
          </button>
        </div>
        <button 
          onClick={() => {
            setEditingProject(null);
            setIsFormOpen(true);
          }}
          className={styles.addButton}
        >
          Add Project
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {showCategories && <CategoryManagement />}

      <div className={styles.projectsList}>
        {projects.map(project => (
          <div key={project._id} className={styles.projectCard}>
            <div className={styles.projectImage}>
              <img src={project.image} alt={project.title} />
            </div>
            <div className={styles.projectHeader}>
              <h3>{project.title}</h3>
              <div className={styles.actions}>
                <button
                  onClick={() => setSelectedProject(project)}
                  className={styles.viewButton}
                >
                  View
                </button>
                <button
                  onClick={() => handleToggleVisibility(project._id)}
                  className={`${styles.visibilityButton} ${project.isVisible ? styles.visible : ''}`}
                >
                  {project.isVisible ? 'Visible' : 'Hidden'}
                </button>
                <button
                  onClick={() => handleEdit(project)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className={styles.projectInfo}>
              <p className={styles.category}>{project.category}</p>
              <p className={styles.description}>{project.description}</p>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <ProjectForm
          project={editingProject}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProject(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        message="Are you sure you want to delete this project? This action cannot be undone."
      />

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
};

export default ProjectsManagement;
