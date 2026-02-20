import React, { useState, useEffect, useMemo } from 'react';
import styles from './Contact.module.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState('');
  const [subscribeNote, setSubscribeNote] = useState('');
  const [subscribeError, setSubscribeError] = useState('');
  const [status, setStatus] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const messages = useMemo(() => [
    "$ git checkout -b feature/your-idea",
    "$ npm run build && npm run deploy",
    "$ curl -X POST /api/project --data '{\"idea\":\"...\"}'",
    "$ docker build -t your-idea .",
    "$ pnpm dev --host 0.0.0.0"
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

  useEffect(() => {
    if (subscribeStatus && subscribeStatus !== 'sending') {
      const timer = setTimeout(() => {
        setSubscribeStatus('');
        setSubscribeNote('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [subscribeStatus]);

  const handleSubscribeChange = (e) => {
    setSubscribeEmail(e.target.value);
    setSubscribeError('');
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    setSubscribeNote('');

    if (!emailRegex.test(subscribeEmail)) {
      setSubscribeError('Please enter a valid email address.');
      return;
    }

    setSubscribeStatus('sending');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: subscribeEmail }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        if (data.status === 'already') {
          setSubscribeStatus('already');
          setSubscribeNote('You are already subscribed.');
        } else {
          setSubscribeStatus('success');
          setSubscribeNote(
            data.emailSent === false
              ? 'Subscribed! Confirmation email may arrive shortly.'
              : 'Thanks! Check your inbox for a confirmation.'
          );
        }
        setSubscribeEmail('');
      } else {
        setSubscribeStatus('error');
        setSubscribeNote(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      setSubscribeStatus('error');
      setSubscribeNote('Failed to subscribe. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate name and email before submitting
    const nameRegex = /^[a-zA-Z\s]{3,}$/;

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
        <div className={styles.layout}>
          <div className={styles.intro}>
            <div className={`${styles.kicker} reveal-up`} data-reveal style={{ '--reveal-delay': '0.05s' }}>
              Dev Channel Online
              <span className={styles.caret} aria-hidden="true">_</span>
            </div>
            <h2 className="reveal-up" data-reveal style={{ '--reveal-delay': '0.12s' }}>
              Let&apos;s ship your next <span className={styles.neon}>build</span>
            </h2>
            <p className="reveal-up" data-reveal style={{ '--reveal-delay': '0.18s' }}>
              Tell me about your idea and I&apos;ll turn it into a fast, polished product. Clean code, smooth UX, and measurable impact.
            </p>

            <div className={`${styles.console} reveal-up`} data-reveal style={{ '--reveal-delay': '0.24s' }}>
              <div className={styles.consoleHeader}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.consoleTitle}>terminal</span>
              </div>
              <div className={styles.consoleBody}>
                <div className={styles.codeLine}><span className={styles.prompt}>$</span> git clone your-idea</div>
                <div className={styles.codeLine}><span className={styles.prompt}>$</span> npm install && npm run build</div>
                <div className={styles.codeLine}><span className={styles.prompt}>$</span> deploy --prod</div>
                <div className={styles.statusRow}>
                  <span className={styles.pulseDot} />
                  Available for new projects
                </div>
              </div>
            </div>

            <div className={`${styles.stack} reveal-up`} data-reveal style={{ '--reveal-delay': '0.3s' }}>
              <span>React</span>
              <span>Node.js</span>
              <span>API</span>
              <span>UI/UX</span>
              <span>Performance</span>
            </div>
          </div>

          <div className={`${styles.formPanel} reveal-up`} data-reveal style={{ '--reveal-delay': '0.32s' }}>
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
                  placeholder="you@email.com"
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

              <button type="submit" disabled={status === 'sending'} className={styles.button}>
                <span>{status === 'sending' ? 'Sending...' : 'Send Message'}</span>
                <span className={styles.buttonIcon} aria-hidden="true">↗</span>
              </button>

              {status === 'success' && (
                <p className={styles.success}>Message sent successfully!</p>
              )}
              {status === 'error' && (
                <p className={styles.error}>Failed to send message. Please try again.</p>
              )}
            </form>
          </div>
        </div>

        <div className={`${styles.subscribePanel} reveal-up`} data-reveal style={{ '--reveal-delay': '0.4s' }}>
          <div className={styles.subscribe}>
            <div className={styles.subscribeHeader}>
              <h3 className={styles.subscribeTitle}>Stay in the loop</h3>
              <p className={styles.subscribeText}>Get a short email when I ship something new.</p>
            </div>
            <form onSubmit={handleSubscribeSubmit} className={styles.subscribeForm}>
              <label htmlFor="subscribeEmail" className={styles.srOnly}>
                Email address
              </label>
              <input
                type="email"
                id="subscribeEmail"
                name="subscribeEmail"
                value={subscribeEmail}
                onChange={handleSubscribeChange}
                className={styles.input}
                placeholder="your@email.com"
                autoComplete="email"
                disabled={subscribeStatus === 'sending'}
                required
              />
              <button
                type="submit"
                disabled={subscribeStatus === 'sending'}
                className={`${styles.button} ${styles.subscribeButton}`}
              >
                <span>{subscribeStatus === 'sending' ? 'Joining...' : 'Notify me'}</span>
                <span className={styles.buttonIcon} aria-hidden="true">↗</span>
              </button>
            </form>

            {subscribeError && <p className={styles.emailError}>{subscribeError}</p>}
            {subscribeStatus === 'sending' && (
              <p className={styles.subscribeHint}>Subscribing...</p>
            )}
            {subscribeStatus === 'success' && (
              <p className={styles.success}>{subscribeNote || 'Subscribed!'}</p>
            )}
            {subscribeStatus === 'already' && (
              <p className={styles.success}>{subscribeNote || 'Already subscribed.'}</p>
            )}
            {subscribeStatus === 'error' && (
              <p className={styles.error}>{subscribeNote || 'Failed to subscribe. Please try again.'}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
