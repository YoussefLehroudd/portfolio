import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = ({ messageCount = 0 }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('sidebar-collapsed', isCollapsed);
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === 'statistics') {
      return currentPath.includes('/statistics') || currentPath === '/admin/dashboard' || currentPath === '/admin';
    }
    return currentPath.includes(path);
  };

  const handleNavigation = (path) => {
    navigate(`/admin/dashboard/${path}`);
  };

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.logo}>
        <div className={styles.logoWrapper}>
          <svg 
            className={`${styles.logoIcon} ${isCollapsed ? styles.hidden : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className={styles.logoText}>Dashboard</span>
        <button 
          onClick={toggleSidebar} 
          className={styles.toggleButton}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg 
            className={styles.toggleIcon} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            {isCollapsed ? (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      <nav className={styles.nav}>
        <div 
          className={`${styles.navItem} ${isActive('statistics') ? styles.active : ''}`}
          onClick={() => handleNavigation('statistics')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <span>Statistics</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('messages') ? styles.active : ''}`}
          onClick={() => handleNavigation('messages')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span>Messages</span>
          {messageCount > 0 && (
            <span className={styles.badge}>{messageCount}</span>
          )}
        </div>

        <div 
          className={`${styles.navItem} ${isActive('reviews') ? styles.active : ''}`}
          onClick={() => handleNavigation('reviews')}
        >
          <div className={styles.iconWrapper}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M8 10h8"></path>
              <path d="M8 14h5"></path>
            </svg>
          </div>
          <span>Reviews</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('avatars') ? styles.active : ''}`}
          onClick={() => handleNavigation('avatars')}
        >
          <div className={styles.iconWrapper}>
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path>
            </svg>
          </div>
          <span>Avatars</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('projects') ? styles.active : ''}`}
          onClick={() => handleNavigation('projects')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <span>Projects</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('hero') ? styles.active : ''}`}
          onClick={() => handleNavigation('hero')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
              <line x1="16" y1="8" x2="2" y2="22"></line>
              <line x1="17.5" y1="15" x2="9" y2="15"></line>
            </svg>
          </div>
          <span>Hero Section</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('about') ? styles.active : ''}`}
          onClick={() => handleNavigation('about')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>About Section</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('career') ? styles.active : ''}`}
          onClick={() => handleNavigation('career')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M3 7h18"></path>
              <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"></path>
              <path d="M9 7V5a3 3 0 0 1 6 0v2"></path>
            </svg>
          </div>
          <span>Career</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('social') ? styles.active : ''}`}
          onClick={() => handleNavigation('social')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </div>
          <span>Social Links</span>
        </div>

        <div 
          className={`${styles.navItem} ${isActive('profile') ? styles.active : ''}`}
          onClick={() => handleNavigation('profile')}
        >
          <div className={styles.iconWrapper}>
            <svg 
              className={styles.icon} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
