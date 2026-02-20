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
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploadStatus, setLogoUploadStatus] = useState('');
  const [logoUploadMessage, setLogoUploadMessage] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    fetchSettings();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    setLogoUploadStatus('');
    setLogoUploadMessage('');
  };

  const handleLogoUpload = async () => {
    if (!logoFile) {
      setLogoUploadStatus('error');
      setLogoUploadMessage('Please select an image file first.');
      return;
    }

    try {
      setIsUploadingLogo(true);
      setLogoUploadStatus('');
      setLogoUploadMessage('');
      const token = localStorage.getItem('adminToken');
      const payload = new FormData();
      payload.append('image', logoFile);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.url) {
        setFormData((prev) => ({ ...prev, logoUrl: data.url }));
        setLogoUploadStatus('success');
        setLogoUploadMessage('Logo uploaded. Remember to save changes.');
        setLogoFile(null);
      } else {
        throw new Error('Upload did not return a URL');
      }
    } catch (error) {
      setLogoUploadStatus('error');
      setLogoUploadMessage(error.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
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
        <p>Logo URL should be a public http(s) link.</p>
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
            type="url"
            name="logoUrl"
            value={formData.logoUrl}
            onChange={handleChange}
            placeholder="https://yourdomain.com/favicon-32x32.png"
          />
          <div className={styles.uploadRow}>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className={styles.fileInput}
            />
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handleLogoUpload}
              disabled={!logoFile || isUploadingLogo}
            >
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
          {logoUploadStatus === 'success' && (
            <div className={styles.success}>{logoUploadMessage}</div>
          )}
          {logoUploadStatus === 'error' && (
            <div className={styles.error}>{logoUploadMessage}</div>
          )}
        </div>

        {formData.logoUrl && (
          <div className={styles.logoPreview}>
            <span>Preview</span>
            <img src={formData.logoUrl} alt="Email logo preview" />
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
    </div>
  );
};

export default EmailSettings;
