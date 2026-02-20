import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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
import CareerManagement from './CareerManagement';
import ReviewsManagement from './ReviewsManagement';
import AvatarManagement from './AvatarManagement';
import EmailSettings from './EmailSettings';
import SubscribersManagement from './SubscribersManagement';

const StatisticsSection = ({ stats, visits, visitsLoading }) => {
  const [projects, setProjects] = useState([]);
  const safeStats = Array.isArray(stats) ? stats : [];
  const safeVisits = Array.isArray(visits) ? visits : [];
  const formatCountry = (countryCode) => {
    if (!countryCode || countryCode === 'Unknown') return 'Unknown';
    if (countryCode.length === 2 && typeof Intl !== 'undefined' && Intl.DisplayNames) {
      try {
        const display = new Intl.DisplayNames(['en'], { type: 'region' });
        return display.of(countryCode) || countryCode;
      } catch (error) {
        return countryCode;
      }
    }
    return countryCode;
  };
  
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
          <div className={styles.tableScroll}>
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
                  <td data-label="Date">{new Date(stat.date).toLocaleDateString()}</td>
                  <td data-label="Visits">{stat.visits}</td>
                  <td data-label="Project Clicks">{clicks}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
        <div className={styles.messageCard}>
          <h3>Recent Visits</h3>
          <div className={styles.tableScroll}>
            <table className={styles.statsTable}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>IP</th>
                  <th>Entry</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {visitsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`visit-skeleton-${index}`}>
                      <td data-label="Time"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="Location"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="IP"><div className={`${styles.tableSkeleton} ${styles.tableSkeletonShort} skeleton`} /></td>
                      <td data-label="Entry"><div className={`${styles.tableSkeleton} skeleton`} /></td>
                      <td data-label="Device"><div className={`${styles.tableSkeleton} ${styles.tableSkeletonShort} skeleton`} /></td>
                    </tr>
                  ))
                ) : safeVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>No visit logs yet.</td>
                  </tr>
                ) : (
                  safeVisits.map((visit) => {
                    const location = [visit.city, visit.region, formatCountry(visit.country)]
                      .filter(Boolean)
                      .join(', ') || 'Unknown';
                    const entryPath = visit.path || '-';
                    const referrer = visit.referrer || 'Direct';
                    const device = visit.device || 'Unknown';
                    const platform = visit.platform ? ` · ${visit.platform}` : '';
                    return (
                      <tr key={visit._id || visit.id || visit.createdAt}>
                        <td className={styles.monoCell} data-label="Time">
                          {new Date(visit.createdAt || visit.updatedAt).toLocaleString()}
                        </td>
                        <td data-label="Location">
                          <div className={styles.locationText}>{location}</div>
                          {visit.timezone && <div className={styles.visitMeta}>{visit.timezone}</div>}
                        </td>
                        <td className={styles.monoCell} data-label="IP">{visit.ip || 'Unknown'}</td>
                        <td data-label="Entry">
                          <div className={styles.pathText}>{entryPath}</div>
                          <div className={styles.visitMeta}>Ref: {referrer}</div>
                        </td>
                        <td data-label="Device">
                          <div className={styles.deviceText}>{device}{platform}</div>
                          {visit.screen && <div className={styles.visitMeta}>{visit.screen}</div>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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

const MessagesSection = ({ messages, error, onDeleteClick, onMarkRead, isLoading }) => {
  const skeletons = Array.from({ length: 3 });

  return (
    <section className={styles.messagesSection}>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.messagesList}>
        {isLoading ? (
          skeletons.map((_, index) => (
            <div key={`message-skeleton-${index}`} className={styles.messageCard}>
              <div className={styles.messageHeader}>
                <div className={`${styles.skeletonHeader} skeleton`} />
                <div className={`${styles.skeletonChip} skeleton`} />
              </div>
              <div className={`${styles.skeletonLine} skeleton`} />
              <div className={`${styles.skeletonLine} skeleton`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort} skeleton`} />
              <div className={`${styles.skeletonMeta} skeleton`} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <p>No messages found.</p>
        ) : (
          messages.map(message => (
            <div
              key={message._id}
              className={`${styles.messageCard} ${message.isRead ? styles.messageRead : styles.messageUnread}`}
            >
              <div className={styles.messageHeader}>
                <div className={styles.messageTitle}>
                  <h3>{message.name}</h3>
                  {message.isRead ? (
                    <span className={styles.readBadge}>Read</span>
                  ) : (
                    <span className={styles.unreadBadge}>New</span>
                  )}
                </div>
                <div className={styles.messageActions}>
                  {!message.isRead && (
                    <button
                      onClick={() => onMarkRead(message)}
                      className={styles.readButton}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteClick(message)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
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
};

const Dashboard = ({ isMagicTheme = false, onToggleTheme }) => {
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [statistics, setStatistics] = useState([]);
  const [visitLogs, setVisitLogs] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchMessages();
    fetchStatistics();
    fetchVisitLogs();
    // Check initial sidebar state
    setIsSidebarCollapsed(document.body.classList.contains('sidebar-collapsed'));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return undefined;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    const getMessageId = (message) => message?._id || message?.id;
    const getVisitId = (visit) => visit?._id || visit?.id || visit?.createdAt;

    socket.on('message:new', (message) => {
      setMessages((prev) => {
        const id = getMessageId(message);
        if (!id || prev.some((item) => getMessageId(item) === id)) return prev;
        return [{ ...message, isRead: Boolean(message?.isRead) }, ...prev];
      });
    });

    socket.on('message:delete', ({ id }) => {
      if (!id) return;
      setMessages((prev) => prev.filter((message) => getMessageId(message) !== id));
    });

    socket.on('message:read', ({ id, isRead }) => {
      if (!id) return;
      setMessages((prev) =>
        prev.map((message) =>
          getMessageId(message) === id ? { ...message, isRead: Boolean(isRead) } : message
        )
      );
    });

    socket.on('visit:new', (visit) => {
      setVisitLogs((prev) => {
        const id = getVisitId(visit);
        if (!id || prev.some((item) => getVisitId(item) === id)) return prev;
        return [visit, ...prev].slice(0, 60);
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error?.message || error);
    });

    return () => {
      socket.disconnect();
    };
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
        const normalized = Array.isArray(data)
          ? data.map((item) => ({ ...item, isRead: Boolean(item.isRead) }))
          : [];
        setMessages(normalized);
      } else {
        setError('Failed to fetch messages');
      }
    } catch (error) {
      setError('Error loading messages');
    }
    setMessagesLoading(false);
  };

  const fetchVisitLogs = async () => {
    setVisitsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/statistics/visits?limit=60`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVisitLogs(data);
      } else {
        console.error('Failed to fetch visit logs');
      }
    } catch (error) {
      console.error('Error loading visit logs:', error);
    }
    setVisitsLoading(false);
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

  const handleMarkRead = async (message) => {
    try {
      const token = localStorage.getItem('adminToken');
      const messageId = message.id || message._id;
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/messages/${messageId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        const updated = await response.json();
        setMessages((prev) =>
          prev.map((item) =>
            (item._id || item.id) === (updated._id || updated.id || messageId)
              ? { ...item, isRead: true }
              : item
          )
        );
      } else {
        setError('Failed to update message');
      }
    } catch (error) {
      setError('Error updating message');
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
    if (path.includes('/career')) {
      return 'Career Section Management';
    }
    if (path.includes('/social')) {
      return 'Social Links Management';
    }
    if (path.includes('/profile')) {
      return 'Profile Management';
    }
    if (path.includes('/email-settings')) {
      return 'Email Settings';
    }
    if (path.includes('/subscribers')) {
      return 'Subscribers';
    }
    if (path.includes('/reviews')) {
      return 'Reviews Management';
    }
    if (path.includes('/avatars')) {
      return 'Avatar Library';
    }
    if (path.includes('/statistics')) {
      return 'Statistics';
    }
    if (path.includes('/messages')) {
      return 'Messages';
    }
    return 'Statistics';
  };

  const unreadCount = messages.filter((message) => !message.isRead).length;

  return (
    <div className={`${styles.dashboardContainer} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar messageCount={unreadCount} />
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>{getPageTitle()}</h1>
          <div className={styles.headerActions}>
            <div className={styles.themeToggle} role="group" aria-label="Theme switch">
              <button
                type="button"
                className={`${styles.themeOption} ${!isMagicTheme ? styles.themeOptionActive : ''}`}
                aria-pressed={!isMagicTheme}
                onClick={() => onToggleTheme && onToggleTheme(false)}
              >
                Simple
              </button>
              <button
                type="button"
                className={`${styles.themeOption} ${isMagicTheme ? styles.themeOptionActive : ''}`}
                aria-pressed={isMagicTheme}
                onClick={() => onToggleTheme && onToggleTheme(true)}
              >
                Magic
              </button>
            </div>
            <div className={styles.userInfo}>
              <span>Welcome, {admin?.username}</span>
              <button onClick={handleLogout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route 
              path="/" 
              element={<StatisticsSection stats={statistics} visits={visitLogs} visitsLoading={visitsLoading} />} 
            />
            <Route 
              path="messages/*" 
              element={
                <MessagesSection 
                  messages={messages}
                  isLoading={messagesLoading}
                  error={error}
                  onDeleteClick={handleDeleteClick}
                  onMarkRead={handleMarkRead}
                />
              }
            />
            <Route path="projects/*" element={<ProjectsManagement />} />
            <Route path="about/*" element={<AboutManagement />} />
            <Route path="career/*" element={<CareerManagement />} />
            <Route path="hero/*" element={<HeroManagement />} />
            <Route path="social/*" element={<SocialManagement />} />
            <Route path="profile/*" element={<ProfileManagement />} />
            <Route path="reviews/*" element={<ReviewsManagement />} />
            <Route path="avatars/*" element={<AvatarManagement />} />
            <Route path="email-settings/*" element={<EmailSettings />} />
            <Route path="subscribers/*" element={<SubscribersManagement />} />
            <Route 
              path="statistics/*" 
              element={<StatisticsSection stats={statistics} visits={visitLogs} visitsLoading={visitsLoading} />}
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
