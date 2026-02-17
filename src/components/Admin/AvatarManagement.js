import React, { useEffect, useRef, useState } from 'react';
import styles from './AvatarManagement.module.css';

const AvatarManagement = () => {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAvatars = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/avatars`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load avatars');
      }
      const data = await response.json();
      setAvatars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load avatars.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!uploadFiles.length) return;
    setUploading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const payload = new FormData();
      uploadFiles.forEach((file) => payload.append('images', file));
      if (label.trim()) payload.append('label', label.trim());

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/avatars`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const saved = await response.json();
      const savedList = Array.isArray(saved) ? saved : [saved];
      setAvatars((prev) => [...savedList, ...prev]);
      setUploadFiles([]);
      setLabel('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Could not upload avatar.');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (avatar) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/avatars/${avatar._id || avatar.id}/active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !avatar.isActive })
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      const updated = await response.json();
      setAvatars((prev) =>
        prev.map((item) => ((item._id || item.id) === (updated._id || updated.id) ? updated : item))
      );
    } catch (err) {
      setError('Could not update avatar.');
    }
  };

  const handleDelete = async (avatar) => {
    const confirmDelete = window.confirm('Delete this avatar?');
    if (!confirmDelete) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/avatars/${avatar._id || avatar.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setAvatars((prev) => prev.filter((item) => (item._id || item.id) !== (avatar._id || avatar.id)));
    } catch (err) {
      setError('Could not delete avatar.');
    }
  };

  return (
    <section className={styles.avatarManagement}>
      <div className={styles.header}>
        <div>
          <h2>Avatar Library</h2>
          <p>Upload avatars to let users pick them in reviews.</p>
        </div>
        <form className={styles.uploadForm} onSubmit={handleUpload}>
          <label className={styles.fileInput}>
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <span>
              {uploadFiles.length
                ? `${uploadFiles.length} image${uploadFiles.length > 1 ? 's' : ''} selected`
                : 'Choose images'}
            </span>
          </label>
          <input
            type="text"
            placeholder="Label (optional)"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className={styles.labelInput}
          />
          <button type="submit" className={styles.uploadButton} disabled={!uploadFiles.length || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading avatars...</div>
      ) : avatars.length === 0 ? (
        <div className={styles.empty}>No avatars uploaded yet.</div>
      ) : (
        <div className={styles.grid}>
          {avatars.map((avatar) => (
            <div key={avatar._id || avatar.id} className={styles.card}>
              <div className={styles.cardImage}>
                <img src={avatar.imageUrl} alt={avatar.label || 'avatar'} />
              </div>
              <div className={styles.cardInfo}>
                <div>
                  <h4>{avatar.label || 'Avatar'}</h4>
                  <span className={avatar.isActive ? styles.active : styles.inactive}>
                    {avatar.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => toggleActive(avatar)} className={styles.toggle}>
                    {avatar.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(avatar)} className={styles.delete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AvatarManagement;
