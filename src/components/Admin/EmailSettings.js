import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import styles from './EmailSettings.module.css';
import AdminSkeleton from './AdminSkeleton';
import DeleteModal from './DeleteModal';
import EmailPreviewModal from './EmailPreviewModal';

const EmailSettings = () => {
  const [formData, setFormData] = useState({
    provider: 'resend',
    fromName: '',
    fromEmail: '',
    notifyEmail: '',
    logoUrl: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false
  });
  const [smtpPassSet, setSmtpPassSet] = useState(false);
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
  const [blastProjectId, setBlastProjectId] = useState('');
  const [blastStatus, setBlastStatus] = useState('');
  const [blastMessage, setBlastMessage] = useState('');
  const [isBlastSending, setIsBlastSending] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('html');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewContent, setPreviewContent] = useState({ subject: '', html: '', text: '' });
  const [emailLogs, setEmailLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const logLimit = 60;
  const getLogId = useCallback((log) => log?._id || log?.id || log?.trackingId, []);
  const normalizeId = useCallback((value) => (value ? String(value) : ''), []);

  const fetchSettings = useCallback(async () => {
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
          provider: data.provider || 'resend',
          fromName: data.fromName || '',
          fromEmail: data.fromEmail || '',
          notifyEmail: data.notifyEmail || '',
          logoUrl: data.logoUrl || '',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort ? String(data.smtpPort) : '',
          smtpUser: data.smtpUser || '',
          smtpPass: '',
          smtpSecure: Boolean(data.smtpSecure)
        });
        setSmtpPassSet(Boolean(data.smtpPassSet));
      } else {
        setError('Failed to fetch email settings');
      }
    } catch (err) {
      setError('Error loading email settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
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
        if (!blastProjectId && list.length) {
          setBlastProjectId(list[0]._id || list[0].id || '');
        }
      }
    } catch (err) {
      console.error('Failed to load projects for test email:', err);
    }
  }, [selectedProjectId, blastProjectId]);

  const fetchEmailLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      setLogsError('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-logs?limit=${logLimit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmailLogs(Array.isArray(data) ? data : []);
      } else {
        setLogsError('Failed to fetch email activity');
      }
    } catch (err) {
      setLogsError('Error loading email activity');
    } finally {
      setLogsLoading(false);
    }
  }, [logLimit]);

  useEffect(() => {
    fetchSettings();
    fetchProjects();
    fetchEmailLogs();
  }, [fetchSettings, fetchProjects, fetchEmailLogs]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return undefined;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ['websocket'],
      auth: { token }
    });

    socket.on('email:updated', (log) => {
      if (!log) return;
      const id = getLogId(log);
      if (!id) return;
      setEmailLogs((prev) => {
        const index = prev.findIndex((item) => normalizeId(getLogId(item)) === normalizeId(id));
        if (index === -1) {
          return [log, ...prev].slice(0, logLimit);
        }
        const updated = [...prev];
        updated[index] = { ...updated[index], ...log };
        return updated;
      });
    });

    socket.on('email:deleted', ({ id }) => {
      if (!id) return;
      setSelectedLogIds((prev) => prev.filter((item) => normalizeId(item) !== normalizeId(id)));
      setEmailLogs((prev) => prev.filter((item) => normalizeId(getLogId(item)) !== normalizeId(id)));
    });

    socket.on('connect_error', (socketError) => {
      console.error('Email socket connection error:', socketError?.message || socketError);
    });

    return () => {
      socket.disconnect();
    };
  }, [getLogId, logLimit, normalizeId]);

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

  useEffect(() => {
    if (!blastStatus) return;
    const timer = setTimeout(() => {
      setBlastStatus('');
      setBlastMessage('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [blastStatus]);

  useEffect(() => {
    setSelectedLogIds((prev) => {
      if (!prev.length) return prev;
      const existing = new Set(
        emailLogs
          .map((log) => normalizeId(getLogId(log)))
          .filter(Boolean)
      );
      return prev.filter((id) => existing.has(normalizeId(id)));
    });
  }, [emailLogs, getLogId, normalizeId]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
          provider: data.provider || 'resend',
          fromName: data.fromName || '',
          fromEmail: data.fromEmail || '',
          notifyEmail: data.notifyEmail || '',
          logoUrl: data.logoUrl || '',
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort ? String(data.smtpPort) : '',
          smtpUser: data.smtpUser || '',
          smtpPass: '',
          smtpSecure: Boolean(data.smtpSecure)
        });
        setSmtpPassSet(Boolean(data.smtpPassSet));
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

  const handleBlastSubmit = async (e) => {
    e.preventDefault();
    setBlastMessage('');
    setBlastStatus('');

    if (!blastProjectId) {
      setBlastStatus('error');
      setBlastMessage('Please select a project.');
      return;
    }

    try {
      setIsBlastSending(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings/send-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ projectId: blastProjectId })
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data?.status === 'skipped') {
          setBlastStatus('error');
          setBlastMessage(data?.message || 'No subscribers found.');
        } else {
          setBlastStatus('success');
          setBlastMessage('Project announcement sent to subscribers.');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setBlastStatus('error');
        setBlastMessage(errorData.message || 'Failed to send project announcement.');
      }
    } catch (err) {
      setBlastStatus('error');
      setBlastMessage('Failed to send project announcement.');
    } finally {
      setIsBlastSending(false);
    }
  };

  const handlePreviewProject = async () => {
    if (!blastProjectId) {
      setBlastStatus('error');
      setBlastMessage('Please select a project.');
      return;
    }

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError('');
    setPreviewContent({ subject: '', html: '', text: '' });
    setPreviewMode('html');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-settings/preview-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ projectId: blastProjectId })
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent({
          subject: data.subject || '',
          html: data.html || '',
          text: data.text || ''
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setPreviewError(errorData.message || 'Failed to load preview.');
      }
    } catch (err) {
      setPreviewError('Failed to load preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleLogSelection = (logId) => {
    const id = normalizeId(logId);
    if (!id) return;
    setSelectedLogIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleLogCardClick = (logId, event) => {
    if (!isSelectMode) return;
    const target = event?.target;
    if (target && typeof target.closest === 'function') {
      const interactive = target.closest('button, a, input, select, textarea, label');
      if (interactive) return;
    }
    toggleLogSelection(logId);
  };

  const startSelectMode = () => {
    if (!filteredLogs.length) return;
    setIsSelectMode(true);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedLogIds([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedLogIds.length) {
      setBulkDeleteOpen(false);
      return;
    }

    try {
      setBulkDeleting(true);
      setLogsError('');
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-logs/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedLogIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete email logs');
      }

      const selectedSet = new Set(selectedLogIds.map((item) => normalizeId(item)));
      setEmailLogs((prev) =>
        prev.filter((log) => !selectedSet.has(normalizeId(getLogId(log))))
      );
      setSelectedLogIds([]);
    } catch (err) {
      setLogsError(err?.message || 'Failed to delete email logs');
    } finally {
      setBulkDeleting(false);
      setBulkDeleteOpen(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return emailLogs;
    const isOpened = (log) => Boolean(log.openedAt) || Number(log.openCount) > 0;
    if (logFilter === 'opened') {
      return emailLogs.filter((log) => isOpened(log));
    }
    if (logFilter === 'not_opened') {
      return emailLogs.filter((log) => !isOpened(log));
    }
    return emailLogs;
  }, [emailLogs, logFilter]);

  const selectedSet = useMemo(() => new Set(selectedLogIds), [selectedLogIds]);
  const visibleLogIds = useMemo(() => (
    filteredLogs
      .map((log) => normalizeId(getLogId(log)))
      .filter(Boolean)
  ), [filteredLogs, getLogId, normalizeId]);
  const visibleSet = useMemo(() => new Set(visibleLogIds), [visibleLogIds]);
  const allVisibleSelected = visibleLogIds.length > 0
    && visibleLogIds.every((id) => selectedSet.has(id));

  const handleSelectAllVisible = () => {
    if (!isSelectMode) return;
    if (!visibleLogIds.length) return;
    setSelectedLogIds((prev) => {
      if (allVisibleSelected) {
        return prev.filter((id) => !visibleSet.has(id));
      }
      const next = new Set(prev);
      visibleLogIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  const selectedCount = selectedLogIds.length;

  if (loading) {
    return <AdminSkeleton compact />;
  }

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  };

  const getStatusLabel = (status) => {
    if (status === 'failed') return 'Failed';
    if (status === 'pending') return 'Pending';
    return 'Sent';
  };

  const requestDelete = (log) => {
    if (!log) return;
    setDeleteTarget(log);
  };

  const confirmDelete = async () => {
    const id = deleteTarget?._id || deleteTarget?.id;
    if (!id) {
      setDeleteTarget(null);
      return;
    }
    try {
      setDeletingId(String(id));
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/email-logs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete email log');
      }

      setEmailLogs((prev) =>
        prev.filter((item) => (item._id || item.id) !== id)
      );
    } catch (err) {
      setLogsError(err?.message || 'Failed to delete email log');
    } finally {
      setDeletingId('');
      setDeleteTarget(null);
    }
  };

  return (
    <div className={styles.emailSettings}>
      <h2>Email Settings</h2>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.helper}>
        <p>Choose how emails are sent. Resend is easiest, SMTP lets you use your own provider.</p>
        <p>Example sender: <strong>Acme</strong> + <strong>hello@yourdomain.com</strong>.</p>
        <p>If From Email is empty, confirmation emails will not be sent.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Email Provider</label>
          <div className={styles.providerToggle}>
            <button
              type="button"
              className={`${styles.providerOption} ${formData.provider === 'resend' ? styles.providerActive : ''}`}
              onClick={() => setFormData((prev) => ({ ...prev, provider: 'resend' }))}
            >
              Resend
            </button>
            <button
              type="button"
              className={`${styles.providerOption} ${formData.provider === 'smtp' ? styles.providerActive : ''}`}
              onClick={() => setFormData((prev) => ({ ...prev, provider: 'smtp' }))}
            >
              SMTP
            </button>
          </div>
          <p className={styles.inlineHint}>
            SMTP requires host, port, and credentials from your email provider.
          </p>
        </div>

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

        {formData.provider === 'smtp' && (
          <div className={styles.smtpSection}>
            <div className={styles.smtpHeader}>
              <h3>SMTP Settings</h3>
              <p className={styles.inlineHint}>
                Leave the password blank to keep the saved value. Leave username/password empty if no auth is required.
              </p>
            </div>
            <div className={styles.smtpGrid}>
              <div className={styles.formGroup}>
                <label>SMTP Host</label>
                <input
                  type="text"
                  name="smtpHost"
                  value={formData.smtpHost}
                  onChange={handleChange}
                  placeholder="smtp.yourdomain.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>SMTP Port</label>
                <input
                  type="number"
                  name="smtpPort"
                  value={formData.smtpPort}
                  onChange={handleChange}
                  placeholder="587"
                  min="1"
                />
              </div>
              <div className={styles.formGroup}>
                <label>SMTP Username</label>
                <input
                  type="text"
                  name="smtpUser"
                  value={formData.smtpUser}
                  onChange={handleChange}
                  placeholder="username@yourdomain.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label>SMTP Password</label>
                <input
                  type="password"
                  name="smtpPass"
                  value={formData.smtpPass}
                  onChange={handleChange}
                  placeholder={smtpPassSet ? 'Saved password' : 'SMTP password'}
                />
              </div>
            </div>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="smtpSecure"
                checked={formData.smtpSecure}
                onChange={handleChange}
              />
              Use TLS/SSL (secure)
            </label>
          </div>
        )}

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
        <p className={styles.testHint}>Pick a project and send a test announcement.</p>
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

      <div className={styles.testSection}>
        <h3>Send Project Announcement</h3>
        <p className={styles.testHint}>Send the selected project to all subscribers, or preview the template first.</p>
        <form onSubmit={handleBlastSubmit} className={styles.projectBlastForm}>
          <select
            value={blastProjectId}
            onChange={(e) => setBlastProjectId(e.target.value)}
            className={styles.testSelect}
            disabled={projects.length === 0 || isBlastSending}
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
          <button
            type="button"
            className={styles.previewButton}
            onClick={handlePreviewProject}
            disabled={projects.length === 0 || isBlastSending || previewLoading}
          >
            {previewLoading ? 'Loading...' : 'Preview'}
          </button>
          <button type="submit" className={styles.testButton} disabled={isBlastSending || projects.length === 0}>
            {isBlastSending ? 'Sending...' : 'Send to Subscribers'}
          </button>
        </form>

        {blastStatus === 'success' && <div className={styles.success}>{blastMessage}</div>}
        {blastStatus === 'error' && <div className={styles.error}>{blastMessage}</div>}
      </div>

      <div className={styles.logsSection}>
        <div className={styles.logsHeader}>
          <div>
            <h3>Email Activity</h3>
            <p className={styles.testHint}>Live delivery + open tracking for recent emails.</p>
          </div>
          <div className={styles.logsHeaderActions}>
            <div className={styles.logsFilters}>
              {['all', 'opened', 'not_opened'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${styles.filterBtn} ${logFilter === item ? styles.filterBtnActive : ''}`}
                  onClick={() => setLogFilter(item)}
                >
                  {item === 'all' ? 'All' : item === 'opened' ? 'Opened' : 'Not opened'}
                </button>
              ))}
            </div>
            {isSelectMode ? (
              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className={styles.bulkButton}
                  onClick={handleSelectAllVisible}
                  disabled={visibleLogIds.length === 0}
                >
                  {allVisibleSelected ? 'Unselect visible' : 'Select visible'}
                </button>
                {selectedCount > 0 && (
                  <div className={styles.selectedPill}>{selectedCount} selected</div>
                )}
                <button
                  type="button"
                  className={styles.bulkDeleteButton}
                  onClick={() => setBulkDeleteOpen(true)}
                  disabled={selectedCount === 0 || bulkDeleting}
                >
                  {bulkDeleting ? 'Deleting...' : 'Delete selected'}
                </button>
                <button
                  type="button"
                  className={styles.bulkCancelButton}
                  onClick={exitSelectMode}
                >
                  Done
                </button>
              </div>
            ) : (
              <div className={styles.bulkActions}>
                <button
                  type="button"
                  className={styles.bulkButton}
                  onClick={startSelectMode}
                  disabled={visibleLogIds.length === 0}
                >
                  Select
                </button>
              </div>
            )}
            <div className={styles.countPill}>{emailLogs.length} recent</div>
          </div>
        </div>

        {logsError && <div className={styles.error}>{logsError}</div>}

        {logsLoading ? (
          <div className={styles.empty}>Loading email activity...</div>
        ) : emailLogs.length === 0 ? (
          <div className={styles.empty}>No email activity yet.</div>
        ) : filteredLogs.length === 0 ? (
          <div className={styles.empty}>No emails match this filter.</div>
        ) : (
          <div className={styles.logsList}>
            {filteredLogs.map((log) => {
              const logId = normalizeId(getLogId(log));
              const status = log.status || 'sent';
              const opened = Boolean(log.openedAt) || Number(log.openCount) > 0;
              return (
                <div
                  key={logId}
                  className={`${styles.logItem} ${isSelectMode ? styles.logItemSelectable : ''} ${selectedSet.has(logId) ? styles.logItemSelected : ''}`}
                  onClick={(event) => handleLogCardClick(logId, event)}
                >
                  <div className={styles.logHeaderRow}>
                    {isSelectMode && (
                      <label className={styles.logCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedSet.has(logId)}
                          onChange={() => toggleLogSelection(logId)}
                        />
                      </label>
                    )}
                    <div className={styles.logMain}>
                      <div className={styles.logEmail}>{log.recipient || log.to || 'Unknown recipient'}</div>
                      <div className={styles.logSubject}>{log.subject || '—'}</div>
                      {log.category && <div className={styles.logCategory}>{log.category}</div>}
                    </div>
                  </div>
                  <div className={styles.logMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status${getStatusLabel(status)}`]}`}>
                      {getStatusLabel(status)}
                    </span>
                    {status === 'failed' && log.error && (
                      <span className={styles.logError}>{log.error}</span>
                    )}
                    <button
                      type="button"
                      className={styles.logDelete}
                      onClick={() => requestDelete(log)}
                      disabled={deletingId === String(logId)}
                    >
                      {deletingId === String(logId) ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                  <div className={styles.logMeta}>
                    <span className={`${styles.openBadge} ${opened ? styles.opened : styles.notOpened}`}>
                      {opened ? 'Opened' : 'Not opened'}
                    </span>
                    <span className={styles.logTimestamp}>
                      Sent: {formatDateTime(log.sentAt || log.createdAt)}
                    </span>
                    <span className={styles.logTimestamp}>
                      Opened: {formatDateTime(log.openedAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        message="Delete this email log? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <DeleteModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete selected logs"
        message={`Delete ${selectedCount} selected email logs? This action cannot be undone.`}
        confirmLabel={bulkDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
      />

      <EmailPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={previewContent.subject}
        html={previewContent.html}
        text={previewContent.text}
        mode={previewMode}
        onModeChange={setPreviewMode}
        loading={previewLoading}
        error={previewError}
      />
    </div>
  );
};

export default EmailSettings;
