import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Projects from './components/Projects/Projects';
import Contact from './components/Contact/Contact';
import Career from './components/Career/Career';
import Reviews from './components/Reviews/Reviews';
import Login from './components/Admin/Login';
import Dashboard from './components/Admin/Dashboard';
import Loading from './components/Loading/Loading';
import DecorativePattern from './components/DecorativePattern/DecorativePattern';
import MagicNav from './components/DecorativePattern/MagicNav';
import TechSlider from './components/Hero/TechSlider';
import HeroMarquee from './components/Hero/HeroMarquee';
import SlantedTicker from './components/Highlights/SlantedTicker';
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
  const [isMagicTheme, setIsMagicTheme] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mode') === 'magic';
  });
  const [isSwitchingTheme, setIsSwitchingTheme] = useState(false);
  const isAdminRoute = typeof window !== 'undefined'
    ? window.location.pathname.startsWith('/admin')
    : false;
  const [isGpuLite, setIsGpuLite] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const forceScrollTop = useRef(false);

  // Toggle a class on the root element so styles can react to magic/simple theme
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isMagicTheme) {
      root.classList.add('magic-theme');
    } else {
      root.classList.remove('magic-theme');
    }
    root.classList.toggle('gpu-lite', isGpuLite);

    if (forceScrollTop.current) {
      forceScrollTop.current = false;
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    }
  }, [isMagicTheme, isGpuLite]);

  useEffect(() => {
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setIsGpuLite(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const [isLowPower, setIsLowPower] = useState(() => {
    if (typeof window === 'undefined') return false;
    const mq = window.matchMedia('(max-width: 768px)');
    const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
    const lowCPU = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
    const saveData = navigator.connection && navigator.connection.saveData;
    return mq.matches || lowMemory || lowCPU || saveData;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => {
      const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
      const lowCPU = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
      const saveData = navigator.connection && navigator.connection.saveData;
      setIsLowPower(mq.matches || lowMemory || lowCPU || saveData);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const ribbonsConfig = useMemo(() => {
    if (!isLowPower) {
      return {
        baseThickness: 26,
        speedMultiplier: 0.55,
        maxAge: 480,
        pointCount: 50,
        enableShaderEffect: true,
        effectAmplitude: 2,
        dpr: 2
      };
    }
    return {
      baseThickness: 20,
      speedMultiplier: 0.42,
      maxAge: 360,
      pointCount: 32,
      enableShaderEffect: false,
      effectAmplitude: 0,
      dpr: 1
    };
  }, [isLowPower]);

  // Persist magic/simple mode across refresh
  useEffect(() => {
    localStorage.setItem('mode', isMagicTheme ? 'magic' : 'simple');
  }, [isMagicTheme]);

  const triggerThemeSwitch = (nextIsMagic) => {
    if (nextIsMagic === isMagicTheme) return;
    forceScrollTop.current = true;
    setIsSwitchingTheme(true);
    setIsMagicTheme(nextIsMagic);
    setTimeout(() => setIsSwitchingTheme(false), 1200);
  };

  useEffect(() => {
    const currentPath = window.location.pathname;
    const isAdminRoute = currentPath.startsWith('/admin');
    let timer;

    if (!isAdminRoute) {
      // Keep a short, non-blocking splash without hurting LCP
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 250);
    } else {
      setIsLoading(false);
    }

    // Record visit only for non-admin pages and count once per day
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (!currentPath.includes('/admin') && lastVisitDate !== today) {
      localStorage.setItem('lastVisitDate', today);
      const visitPayload = {
        path: currentPath,
        referrer: document.referrer || '',
        language: navigator.language || '',
        screen: window.screen ? `${window.screen.width}x${window.screen.height}` : '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        platform: navigator.platform || '',
        device: /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };
      fetch(`${process.env.REACT_APP_API_URL}/api/statistics/visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitPayload)
      }).catch(error => console.error('Error recording visit:', error));
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'));
    revealElements.forEach((el) => {
      el.dataset.revealState = 'hidden';
    });

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach((el) => {
        el.dataset.revealState = 'visible';
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.dataset.revealState = entry.isIntersecting ? 'visible' : 'hidden';
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -12% 0px' }
    );

    const observed = new WeakSet();

    const observeAll = (elements) => {
      elements.forEach((el) => {
        if (!el || observed.has(el)) return;
        observed.add(el);
        if (!el.dataset.revealState) {
          el.dataset.revealState = 'hidden';
        }
        observer.observe(el);
      });
    };

    observeAll(revealElements);

    const mutationObserver = new MutationObserver((mutations) => {
      const newTargets = [];
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const element = node;
          if (element.matches && element.matches('[data-reveal]')) {
            newTargets.push(element);
          }
          if (element.querySelectorAll) {
            element.querySelectorAll('[data-reveal]').forEach((child) => newTargets.push(child));
          }
        });
      });

      if (newTargets.length) {
        observeAll(newTargets);
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [isLoading, isMagicTheme]);

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
                colors={['#7df9ff']}
                baseThickness={ribbonsConfig.baseThickness}
                speedMultiplier={ribbonsConfig.speedMultiplier}
                maxAge={ribbonsConfig.maxAge}
                pointCount={ribbonsConfig.pointCount}
                enableFade={false}
                enableShaderEffect={ribbonsConfig.enableShaderEffect}
                effectAmplitude={ribbonsConfig.effectAmplitude}
                dpr={ribbonsConfig.dpr}
              />
            </div>
          )}
          {isLoading ? (
            <Loading />
          ) : (
            <Routes>
              <Route path="/" element={
                <>
                  {!isMagicTheme && (
                    <Header
                      showSwitch={!isAdminRoute}
                      isMagicTheme={isMagicTheme}
                      onToggleTheme={triggerThemeSwitch}
                    />
                  )}
                  <main className={`${isMagicTheme ? 'magic-main' : ''}`}>
                    <HeroMarquee isMagicTheme={isMagicTheme} />
                    <Hero isMagicTheme={isMagicTheme} isLowPower={isLowPower} />
                    <TechSlider />
                    <About isMagicTheme={isMagicTheme} />
                    <Career isMagicTheme={isMagicTheme} />
                    <SlantedTicker />
                    <Projects />
                    <Reviews isMagicTheme={isMagicTheme} />
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
                    <Dashboard
                      isMagicTheme={isMagicTheme}
                      onToggleTheme={triggerThemeSwitch}
                    />
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
