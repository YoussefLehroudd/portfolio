import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Projects from './components/Projects/Projects';
import Contact from './components/Contact/Contact';
import DecorativePattern from './components/DecorativePattern/DecorativePattern';
import Loading from './components/Loading/Loading';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <div className="App">
        {isLoading ? (
          <Loading />
        ) : (
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
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
