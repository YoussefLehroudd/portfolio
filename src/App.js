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
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import { apiUrl } from './config/api';

const PrivateRoute = ({ children }) => {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/admin" />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Record visit only for non-admin pages and count once per day
    const currentPath = window.location.pathname;
    const lastVisitDate = localStorage.getItem('lastVisitDate');
    const today = new Date().toDateString();
    
    if (!currentPath.includes('/admin') && lastVisitDate !== today) {
      localStorage.setItem('lastVisitDate', today);
      fetch(apiUrl('/api/statistics/visit'), {
        method: 'POST'
      }).catch(error => console.error('Error recording visit:', error));
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {isLoading ? (
          <Loading />
        ) : (
          <Routes>
            <Route path="/" element={
              <>
                <Header />
                <main>
                  <Hero />
                  <About />
                  <Projects />
                  <DecorativePattern />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
