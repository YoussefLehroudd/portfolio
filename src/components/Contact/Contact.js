import React, { useState, useEffect, useMemo } from 'react';
import styles from './Contact.module.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const messages = useMemo(() => [
    "Hi, I'd love to work together...",
    "I have a project idea...",
    "Let's build something amazing...",
    "I'm interested in your services...",
    "Got a question about your work..."
  ], []);
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseDuration = 2000;

  useEffect(() => {
    const currentMessage = messages[messageIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentMessage.length) {
          setPlaceholder(currentMessage.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholder(currentMessage.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setMessageIndex((messageIndex + 1) % messages.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, messageIndex, isDeleting, messages, deletingSpeed, typingSpeed, pauseDuration]);

  const handleChange = (e) => {
    const { name: fieldName, value } = e.target;
    setFormData({
      ...formData,
      [fieldName]: value
    });

    if (fieldName === 'name') {
      setNameError('');
      const nameRegex = /^[a-zA-Z\s]{3,}$/;
      if (value && !nameRegex.test(value)) {
        setNameError("Le nom doit contenir au moins 3 lettres et ne pas contenir de chiffres");
      }
    }

    if (fieldName === 'email') {
      setEmailError('');
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (value && !emailRegex.test(value)) {
        setEmailError("Veuillez entrer une adresse e-mail valide (exemple: nom@domaine.com)");
      }
    }
  };

  // Clear status message after timeout
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('');
      }, 3000); // Clear message after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name and email before submitting
    const nameRegex = /^[a-zA-Z\s]{3,}$/;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!nameRegex.test(formData.name)) {
      setNameError("Le nom doit contenir au moins 3 lettres et ne pas contenir de chiffres");
      return;
    }

    if (!emailRegex.test(formData.email)) {
      setEmailError("Veuillez entrer une adresse e-mail valide (exemple: nom@domaine.com)");
      return;
    }

    setStatus('sending');


    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className={styles.contact}>
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Get in Touch</h2>
          <p>Have a question or want to work together? Let me know!</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="Your name"
            />
            {nameError && <p className={styles.emailError}>{nameError}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
              placeholder="your.email@example.com"
            />
            {emailError && <p className={styles.emailError}>{emailError}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              className={styles.textarea}
              placeholder={placeholder}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            className={styles.button}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          {status === 'success' && (
            <p className={styles.success}>Message sent successfully!</p>
          )}
          {status === 'error' && (
            <p className={styles.error}>Failed to send message. Please try again.</p>
          )}
        </form>
      </div>
    </section>
  );
};

export default Contact;
