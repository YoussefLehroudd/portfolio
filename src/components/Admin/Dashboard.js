import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';
import DeleteModal from './DeleteModal';
import Sidebar from './Sidebar';
import ProjectsManagement from './ProjectsManagement';
import AboutManagement from './AboutManagement';
import HeroManagement from './HeroManagement';
import SocialManagement from './SocialManagement';
import ProfileManagement from './ProfileManagement';

const MessagesSection = ({ messages, error, onDeleteClick }) => (
  <section className={styles.messagesSection}>
    {error && <div className={styles.error}>{error}</div>}
    <div className={styles.messagesList}>
      {messages.length === 0 ? (
        <p>No messages found.</p>
      ) : (
        messages.map(message => (
          <div key={message._id} className={styles.messageCard}>
            <div className={styles.messageHeader}>
              <h3>{message.name}</h3>
              <button
                onClick={() => onDeleteClick(message)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
            <p className={styles.messageEmail}>{message.email}</p>
            <p className={styles.messageContent}>{message.message}</p>
            <p className={styles.messageDate}>
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  </section>
);

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchMessages();
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      setError('Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages/${messageToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages(messages.filter(message => message._id !== messageToDelete._id));
        setIsDeleteModalOpen(false);
        setMessageToDelete(null);
      } else {
        setError('Failed to delete message');
      }
    } catch (error) {
      setError('Error deleting message');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const getPageTitle = () => {
    if (location.pathname.includes('/projects')) {
      return 'Projects Management';
    }
    if (location.pathname.includes('/hero')) {
      return 'Hero Section Management';
    }
    if (location.pathname.includes('/about')) {
      return 'About Section Management';
    }
    if (location.pathname.includes('/social')) {
      return 'Social Links Management';
    }
    if (location.pathname.includes('/profile')) {
      return 'Profile Management';
    }
    return 'Messages';
  };

  return (
    <div className={`${styles.dashboardContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar messageCount={messages.length} />
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>{getPageTitle()}</h1>
          <div className={styles.userInfo}>
            <span>Welcome, {admin?.username}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route 
              path="messages/*" 
              element={
                <MessagesSection 
                  messages={messages}
                  error={error}
                  onDeleteClick={handleDeleteClick}
                />
              }
            />
            <Route path="projects/*" element={<ProjectsManagement />} />
            <Route path="about/*" element={<AboutManagement />} />
            <Route path="hero/*" element={<HeroManagement />} />
            <Route path="social/*" element={<SocialManagement />} />
            <Route path="profile/*" element={<ProfileManagement />} />
          </Routes>
        </main>

        <DeleteModal 
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setMessageToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};

export default Dashboard;
