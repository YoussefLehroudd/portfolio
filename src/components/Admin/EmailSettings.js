import React, { useEffect, useState } from 'react';
import styles from './EmailSettings.module.css';
import AdminSkeleton from './AdminSkeleton';

const EmailSettings = () => {
  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    notifyEmail: '',
    logoUrl: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectTestEmail, setProjectTestEmail] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectTestStatus, setProjectTestStatus] = useState('');
  const [projectTestMessage, setProjectTestMessage] = useState('');
  const [isProjectTesting, setIsProjectTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    fetchSettings();
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!testStatus) return;
    const timer = setTimeout(() => {
      setTestStatus('');
      setTestMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [testStatus]);

  useEffect(() => {
    if (!projectTestStatus) return;
    const timer = setTimeout(() => {
      setProjectTestStatus('');
      setProjectTestMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [projectTestStatus]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          fromName: data.fromName || '',
          fromEmail: data.fromEmail || '',
          notifyEmail: data.notifyEmail || '',
          logoUrl: data.logoUrl || ''
        });
      } else {
        setError('Failed to fetch email settings');
      }
    } catch (err) {
      setError('Error loading email settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/projects/admin`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        if (!selectedProjectId && list.length) {
          setSelectedProjectId(list[0]._id || list[0].id || '');
        }
      }
    } catch (err) {
      console.error('Failed to load projects for test email:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          fromName: data.fromName || '',
          fromEmail: data.fromEmail || '',
          notifyEmail: data.notifyEmail || '',
          logoUrl: data.logoUrl || ''
        });
        setSuccess('Email settings updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update email settings');
      }
    } catch (err) {
      setError('Error updating email settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    setTestMessage('');
    setTestStatus('');

    const normalized = testEmail.trim().toLowerCase();
    if (!emailRegex.test(normalized)) {
      setTestStatus('error');
      setTestMessage('Please enter a valid test email address.');
      return;
    }

    try {
      setIsTesting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: normalized })
      });

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('Test email sent successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setTestStatus('error');
        setTestMessage(errorData.message || 'Failed to send test email.');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage('Failed to send test email.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleProjectTestSubmit = async (e) => {
    e.preventDefault();
    setProjectTestMessage('');
    setProjectTestStatus('');

    const normalized = projectTestEmail.trim().toLowerCase();
    if (!emailRegex.test(normalized)) {
      setProjectTestStatus('error');
      setProjectTestMessage('Please enter a valid test email address.');
      return;
    }

    if (!selectedProjectId) {
      setProjectTestStatus('error');
      setProjectTestMessage('Please select a project.');
      return;
    }

    try {
      setIsProjectTesting(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings/test-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: normalized, projectId: selectedProjectId })
      });

      if (response.ok) {
        setProjectTestStatus('success');
        setProjectTestMessage('Project test email sent successfully.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setProjectTestStatus('error');
        setProjectTestMessage(errorData.message || 'Failed to send project test email.');
      }
    } catch (err) {
      setProjectTestStatus('error');
      setProjectTestMessage('Failed to send project test email.');
    } finally {
      setIsProjectTesting(false);
    }
  };

  if (loading) {
    return <AdminSkeleton compact />;
  }

  return (
    <div className={styles.emailSettings}>
      <h2>Email Settings</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.helper}>
        <p>Use a verified sender from Resend. Example: <strong>Acme</strong> + <strong>hello@yourdomain.com</strong>.</p>
        <p>If From Email is empty, confirmation emails will not be sent.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>From Name</label>
          <input
            type="text"
            name="fromName"
            value={formData.fromName}
            onChange={handleChange}
            placeholder="Acme"
          />
        </div>

        <div className={styles.formGroup}>
          <label>From Email</label>
          <input
            type="email"
            name="fromEmail"
            value={formData.fromEmail}
            onChange={handleChange}
            placeholder="hello@yourdomain.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Notification Email</label>
          <input
            type="email"
            name="notifyEmail"
            value={formData.notifyEmail}
            onChange={handleChange}
            placeholder="you@yourdomain.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label>Logo URL</label>
          <input
            type="text"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://yourdomain.com/logo.png"
          />
        </div>

        <button type="submit" className={styles.submitButton} disabled={loading}>
          Save Changes
        </button>
      </form>

      <div className={styles.testSection}>
        <h3>Send Test Email</h3>
        <p className={styles.testHint}>Send a quick message to verify delivery.</p>
        <form onSubmit={handleTestSubmit} className={styles.testForm}>
          <input
            type="email"
            name="testEmail"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@yourdomain.com"
            className={styles.testInput}
            required
            disabled={isTesting}
          />
          <button type="submit" className={styles.testButton} disabled={isTesting}>
            {isTesting ? 'Sending...' : 'Send Test'}
          </button>
        </form>

        {testStatus === 'success' && <div className={styles.success}>{testMessage}</div>}
        {testStatus === 'error' && <div className={styles.error}>{testMessage}</div>}
      </div>

      <div className={styles.testSection}>
        <h3>Send Project Test</h3>
        <p className={styles.testHint}>Pick a project and preview the announcement email.</p>
        <form onSubmit={handleProjectTestSubmit} className={styles.projectTestForm}>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={styles.testSelect}
            disabled={projects.length === 0 || isProjectTesting}
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((project) => (
                <option key={project._id || project.id} value={project._id || project.id}>
                  {project.title || 'Untitled project'}
                </option>
              ))
            )}
          </select>
          <input
            type="email"
            name="projectTestEmail"
            value={projectTestEmail}
            onChange={(e) => setProjectTestEmail(e.target.value)}
            placeholder="test@yourdomain.com"
            className={styles.testInput}
            required
            disabled={isProjectTesting}
          />
          <button type="submit" className={styles.testButton} disabled={isProjectTesting || projects.length === 0}>
            {isProjectTesting ? 'Sending...' : 'Send Project Test'}
          </button>
        </form>

        {projectTestStatus === 'success' && <div className={styles.success}>{projectTestMessage}</div>}
        {projectTestStatus === 'error' && <div className={styles.error}>{projectTestMessage}</div>}
      </div>
    </div>
  );
};

export default EmailSettings;
