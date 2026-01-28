import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Projects from './components/Projects/Projects';
import Contact from './components/Contact/Contact';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';
import Loading from './components/Loading/Loading';
import DecorativePattern from './components/DecorativePattern/DecorativePattern';
import MagicNav from './components/DecorativePattern/MagicNav';
import TechSlider from './components/Hero/TechSlider';
import GradientBackground from './components/Background/GradientBackground';
import Ribbons from './components/Background/Ribbons';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading && !admin) {
    return <Loading />;
  }

  return admin ? children : <Navigate to="/admin" replace />;
};

function App() {
  const initialPath = window.location.pathname;
  const [isLoading, setIsLoading] = useState(!initialPath.startsWith('/admin'));
  const [isMagicTheme, setIsMagicTheme] = useState(false);
  const [isSwitchingTheme, setIsSwitchingTheme] = useState(false);
  const [isSectionActive, setIsSectionActive] = useState(false);
  const [isSectionInView, setIsSectionInView] = useState(false);
  const [isCursorInSection, setIsCursorInSection] = useState(false);
  const [isGpuLite, setIsGpuLite] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Toggle a class on the root element so styles can react to magic/simple theme
  useEffect(() => {
    const root = document.documentElement;
    if (isMagicTheme) {
      root.classList.add('magic-theme');
    } else {
      root.classList.remove('magic-theme');
    }
    root.classList.toggle('gpu-lite', isGpuLite);
  }, [isMagicTheme, isGpuLite]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setIsGpuLite(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!isMagicTheme) {
      setIsSectionActive(false);
      setIsSectionInView(false);
      setIsCursorInSection(false);
      return;
    }

    const sections = Array.from(document.querySelectorAll('main section'));
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      entries => {
        const active = entries.some(entry => entry.isIntersecting);
        setIsSectionInView(active);
      },
      { threshold: [0, 0.15, 0.3, 0.6, 0.9], rootMargin: '0px 0px -10% 0px' }
    );

    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [isMagicTheme]);

  useEffect(() => {
    if (!isMagicTheme) {
      setIsCursorInSection(false);
      return;
    }

    const sections = Array.from(document.querySelectorAll('main section'));
    if (!sections.length) return undefined;

    const handleEnter = () => setIsCursorInSection(true);
    const handleLeave = () => setIsCursorInSection(false);

    sections.forEach(section => {
      section.addEventListener('pointerenter', handleEnter);
      section.addEventListener('pointerleave', handleLeave);
    });

    return () => {
      sections.forEach(section => {
        section.removeEventListener('pointerenter', handleEnter);
        section.removeEventListener('pointerleave', handleLeave);
      });
    };
  }, [isMagicTheme]);

  useEffect(() => {
    setIsSectionActive(isSectionInView || isCursorInSection);
  }, [isSectionInView, isCursorInSection]);

  const triggerThemeSwitch = (nextIsMagic) => {
    if (nextIsMagic === isMagicTheme) return;
    setIsSwitchingTheme(true);
    setIsMagicTheme(nextIsMagic);
    setTimeout(() => setIsSwitchingTheme(false), 1200);
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isAdminRoute = currentPath.startsWith('/admin');
    let timer;

    if (!isAdminRoute) {
      // Simulate loading time only for public pages
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    } else {
      setIsLoading(false);
    }

    // Record visit only for non-admin pages and count once per day
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (!currentPath.includes('/admin') && lastVisitDate !== today) {
      localStorage.setItem('lastVisitDate', today);
      fetch(`${process.env.REACT_APP_API_URL}/api/statistics/visit`, {
        method: 'POST'
      }).catch(error => console.error('Error recording visit:', error));
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className={`app-shell ${isMagicTheme ? 'magic-app-shell' : ''} ${isSwitchingTheme ? 'theme-switching' : ''}`}>
          {isSwitchingTheme && (
            <div className="theme-transition-overlay" aria-hidden="true">
              <div className="burst"></div>
            </div>
          )}
          {isMagicTheme && <GradientBackground />}
          {isMagicTheme && (
            <div className="magic-ribbons-layer" aria-hidden="true">
              <Ribbons
                baseThickness={26}
                colors={['#7df9ff']}
                speedMultiplier={0.55}
                maxAge={480}
                enableFade={false}
                enableShaderEffect={true}
                effectAmplitude={2}
              />
            </div>
          )}
          {!isMagicTheme && (
            <button
              className="bgToggle"
              type="button"
              onClick={() => triggerThemeSwitch(true)}
            >
              Switch to magic
            </button>
          )}
          {isLoading ? (
            <Loading />
          ) : (
            <Routes>
              <Route path="/" element={
                <>
                  <Header />
                  <main className={isMagicTheme ? 'magic-main' : ''}>
                    <Hero isMagicTheme={isMagicTheme} />
                    <TechSlider />
                    <About isMagicTheme={isMagicTheme} />
                    <Projects />
                    {!isMagicTheme && <DecorativePattern />}
                    {isMagicTheme && <MagicNav onToggleTheme={() => triggerThemeSwitch(false)} />}
                    <Contact />
                  </main>
                </>
              } />
              <Route path="/admin" element={<Login />} />
              <Route
                path="/admin/dashboard/*"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              >
                <Route index element={<Navigate to="messages" />} />
                <Route path="messages/*" element={<Dashboard />} />
                <Route path="projects/*" element={<Dashboard />} />
                <Route path="hero/*" element={<Dashboard />} />
                <Route path="about/*" element={<Dashboard />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
