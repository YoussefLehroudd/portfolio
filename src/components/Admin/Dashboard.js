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

const StatisticsSection = ({ stats }) => {
  const [projects, setProjects] = useState([]);
  const safeStats = Array.isArray(stats) ? stats : [];
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, []);

  return (
    <section className={styles.messagesSection}>
      <div className={styles.messagesList}>
        <div className={styles.statsCards}>
          <div className={styles.messageCard}>
            <h3>Total Visits</h3>
            <p className={styles.statsNumber}>
              {safeStats.reduce((total, stat) => total + (stat.visits || 0), 0)}
            </p>
          </div>
          <div className={styles.messageCard}>
            <h3>Total Project Clicks</h3>
            <p className={styles.statsNumber}>
              {safeStats.reduce((total, stat) => {
                const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                const dailyClicks = projectDetails.reduce((sum, project) => sum + (project.clicks || 0), 0);
                return total + dailyClicks;
              }, 0)}
            </p>
          </div>
        </div>
        <div className={styles.messageCard}>
          <h3>Recent Statistics</h3>
          <table className={styles.statsTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Visits</th>
                <th>Project Clicks</th>
              </tr>
            </thead>
            <tbody>
              {safeStats.map((stat) => {
                const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                const clicks = projectDetails.reduce((sum, project) => sum + (project.clicks || 0), 0);
                return (
                <tr key={stat.date}>
                  <td>{new Date(stat.date).toLocaleDateString()}</td>
                  <td>{stat.visits}</td>
                  <td>{clicks}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.messageCard}>
          <h3>Most Clicked Projects</h3>
          <div className={styles.projectGrid}>
            {projects.map(project => {
              const totalClicks = safeStats.reduce((total, stat) => {
                const projectDetails = Array.isArray(stat.project_details) ? stat.project_details : [];
                const projectStat = projectDetails.find(p => p.project_id?.toString?.() === project._id?.toString?.());
                return total + (projectStat?.clicks || 0);
              }, 0);
              
              return (
                <div key={project._id} className={styles.projectThumbnail}>
                  <img src={project.image} alt={project.title} />
                  <div className={styles.projectInfo}>
                    <h4>{project.title}</h4>
                    <p>Clicks: {totalClicks}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

const MessagesSection = ({ messages, error, onDeleteClick, isLoading }) => (
  <section className={styles.messagesSection}>
    {error && <div className={styles.error}>{error}</div>}
    <div className={styles.messagesList}>
      {messages.length === 0 ? (
        isLoading ? null : <p>No messages found.</p>
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
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchMessages();
    fetchStatistics();
    // Check initial sidebar state
    setIsSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        console.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
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
    }
    setMessagesLoading(false);
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

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') {
      return 'Statistics';
    }
    if (path.includes('/projects')) {
      return 'Projects Management';
    }
    if (path.includes('/hero')) {
      return 'Hero Section Management';
    }
    if (path.includes('/about')) {
      return 'About Section Management';
    }
    if (path.includes('/social')) {
      return 'Social Links Management';
    }
    if (path.includes('/profile')) {
      return 'Profile Management';
    }
    if (path.includes('/statistics')) {
      return 'Statistics';
    }
    if (path.includes('/messages')) {
      return 'Messages';
    }
    return 'Statistics';
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
              path="/" 
              element={<StatisticsSection stats={statistics} />} 
            />
            <Route 
              path="messages/*" 
              element={
                <MessagesSection 
                  messages={messages}
                  isLoading={messagesLoading}
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
            <Route 
              path="statistics/*" 
              element={<StatisticsSection stats={statistics} />}
            />
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
