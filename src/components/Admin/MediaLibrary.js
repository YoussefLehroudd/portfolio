import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './MediaLibrary.module.css';
import AdminSkeleton from './AdminSkeleton';
import DeleteModal from './DeleteModal';

const MediaLibrary = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState('');
  const [visibleKeys, setVisibleKeys] = useState(() => new Set());
  const [resourceType, setResourceType] = useState('all');
  const [currentFolder, setCurrentFolder] = useState('portfolio/uploads');
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [folderSearch, setFolderSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [nextCursor, setNextCursor] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPaths, setUploadPaths] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState(null);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const observerRef = useRef(null);
  const visibleKeysRef = useRef(new Set());
  const mediaRequestRef = useRef(0);
  const foldersRequestRef = useRef(0);

  const buildKey = (item) => `${item?.public_id || ''}::${item?.resource_type || 'image'}`;

  const formatBytes = (bytes = 0) => {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const formatDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString();
  };

  const fetchMedia = async ({ append = false } = {}) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    const requestId = ++mediaRequestRef.current;
    const params = new URLSearchParams();
    params.set('resourceType', resourceType);
    if (currentFolder.trim()) {
      params.set('prefix', currentFolder.trim());
    }
    params.set('max', '60');
    if (append && nextCursor) {
      params.set('nextCursor', nextCursor);
    }

    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError('');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load media');
      }
      const data = await response.json();
      if (requestId !== mediaRequestRef.current) return;
      const list = Array.isArray(data?.resources) ? data.resources : [];
      setResources((prev) => (append ? [...prev, ...list] : list));
      setNextCursor(data?.nextCursor || null);
    } catch (err) {
      if (requestId !== mediaRequestRef.current) return;
      setError('Could not load media.');
    } finally {
      if (requestId !== mediaRequestRef.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [resourceType, currentFolder]);

  const fetchFolders = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    const requestId = ++foldersRequestRef.current;
    try {
      setFoldersLoading(true);
      const params = new URLSearchParams();
      if (currentFolder.trim()) {
        params.set('prefix', currentFolder.trim());
      }
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/folders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to load folders');
      }
      const data = await response.json();
      if (requestId !== foldersRequestRef.current) return;
      setFolders(Array.isArray(data?.folders) ? data.folders : []);
    } catch (err) {
      if (requestId !== foldersRequestRef.current) return;
      setFolders([]);
    } finally {
      if (requestId !== foldersRequestRef.current) return;
      setFoldersLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    setVisibleKeys(new Set());
  }, [resourceType, currentFolder]);

  useEffect(() => {
    visibleKeysRef.current = visibleKeys;
  }, [visibleKeys]);

  useEffect(() => () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  }, []);

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (!prev.length) return prev;
      const existing = new Set(resources.map((item) => buildKey(item)));
      return prev.filter((key) => existing.has(key));
    });
  }, [resources]);

  const getObserver = useCallback(() => {
    if (observerRef.current) return observerRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const key = entry.target.dataset.mediaKey;
          if (!key) return;
          setVisibleKeys((prev) => {
            if (prev.has(key)) return prev;
            const next = new Set(prev);
            next.add(key);
            return next;
          });
          observerRef.current?.unobserve(entry.target);
        });
      },
      { rootMargin: '220px 0px', threshold: 0.1 }
    );
    return observerRef.current;
  }, []);

  const getMediaRef = useCallback((key) => (node) => {
    if (!node) return;
    if (visibleKeysRef.current.has(key)) return;
    node.dataset.mediaKey = key;
    getObserver().observe(node);
  }, [getObserver]);

  const handleFilePick = (event, useFolderPaths = false) => {
    const files = Array.from(event.target.files || []);
    setUploadFiles(files);
    if (useFolderPaths) {
      setUploadPaths(
        files.map((file) => file.webkitRelativePath || file.name || '')
      );
    } else {
      setUploadPaths([]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFiles.length) return;
    try {
      setUploading(true);
      setError('');
      const token = localStorage.getItem('adminToken');
      const payload = new FormData();
      uploadFiles.forEach((file) => payload.append('files', file));
      if (currentFolder.trim()) {
        payload.append('folder', currentFolder.trim());
      }
      if (uploadPaths.length === uploadFiles.length && uploadPaths.length > 0) {
        payload.append('paths', JSON.stringify(uploadPaths));
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      const uploaded = Array.isArray(data?.uploaded) ? data.uploaded : [];
      if (uploaded.length) {
        setResources((prev) => [...uploaded, ...prev]);
      }
      setUploadFiles([]);
      setUploadPaths([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
      setSuccess('Files uploaded successfully.');
      setTimeout(() => setSuccess(''), 3000);
      fetchMedia();
      fetchFolders();
    } catch (err) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, parent: currentFolder })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create folder');
      }
      setNewFolderName('');
      fetchFolders();
    } catch (err) {
      setError(err?.message || 'Could not create folder.');
    }
  };

  const requestDeleteFolder = (folderPath) => {
    if (!folderPath) return;
    setFolderDeleteTarget(folderPath);
  };

  const confirmDeleteFolder = async () => {
    if (!folderDeleteTarget) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/folders`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ path: folderDeleteTarget })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete folder');
      }
      if (currentFolder === folderDeleteTarget || currentFolder.startsWith(`${folderDeleteTarget}/`)) {
        const parts = folderDeleteTarget.split('/').filter(Boolean);
        setCurrentFolder(parts.slice(0, -1).join('/'));
      }
      fetchFolders();
      fetchMedia();
    } catch (err) {
      setError(err?.message || 'Could not delete folder.');
    } finally {
      setFolderDeleteTarget(null);
    }
  };

  const handleRenameFolder = async (folderPath) => {
    if (!folderPath) return;
    const parts = folderPath.split('/').filter(Boolean);
    const currentName = parts[parts.length - 1] || '';
    const nextName = window.prompt('New folder name', currentName);
    if (!nextName) return;
    const trimmed = nextName.trim();
    if (!trimmed || trimmed === currentName) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/folders/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ path: folderPath, newName: trimmed })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to rename folder');
      }
      const parent = parts.slice(0, -1).join('/');
      const nextPath = parent ? `${parent}/${trimmed}` : trimmed;
      if (currentFolder === folderPath) {
        setCurrentFolder(nextPath);
      } else if (currentFolder.startsWith(`${folderPath}/`)) {
        setCurrentFolder(`${nextPath}${currentFolder.slice(folderPath.length)}`);
      }
      fetchFolders();
      fetchMedia();
    } catch (err) {
      setError(err?.message || 'Could not rename folder.');
    }
  };

  const requestDelete = (item) => {
    setDeleteTarget(item);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          publicId: deleteTarget.public_id,
          resourceType: deleteTarget.resource_type
        })
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      const removeKey = buildKey(deleteTarget);
      setResources((prev) => prev.filter((item) => buildKey(item) !== removeKey));
      setSelectedKeys((prev) => prev.filter((key) => key !== removeKey));
    } catch (err) {
      setError('Could not delete file.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSelection = (key) => {
    if (!key) return;
    setSelectedKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const handleCardClick = (item, event) => {
    if (!isSelectMode) return;
    const target = event?.target;
    if (target && typeof target.closest === 'function') {
      const interactive = target.closest('button, a, input, select, textarea, label');
      if (interactive) return;
    }
    toggleSelection(buildKey(item));
  };

  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const resourceKeys = useMemo(() => resources.map((item) => buildKey(item)), [resources]);
  const allVisibleSelected = resourceKeys.length > 0 && resourceKeys.every((key) => selectedSet.has(key));

  const handleSelectAll = () => {
    if (!isSelectMode) return;
    if (!resourceKeys.length) return;
    setSelectedKeys((prev) => {
      if (allVisibleSelected) {
        return prev.filter((key) => !resourceKeys.includes(key));
      }
      const next = new Set(prev);
      resourceKeys.forEach((key) => next.add(key));
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedKeys.length) {
      setBulkDeleteOpen(false);
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const items = resources
        .filter((item) => selectedSet.has(buildKey(item)))
        .map((item) => ({ publicId: item.public_id, resourceType: item.resource_type }));
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/media/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      setResources((prev) => prev.filter((item) => !selectedSet.has(buildKey(item))));
      setSelectedKeys([]);
      setIsSelectMode(false);
    } catch (err) {
      setError('Could not delete selected files.');
    } finally {
      setBulkDeleteOpen(false);
    }
  };

  const mediaPublicBase = useMemo(() => {
    const raw = process.env.REACT_APP_MEDIA_PUBLIC_BASE_URL || '';
    return raw ? raw.replace(/\/$/, '') : '';
  }, []);

  const buildPublicUrl = (item) => {
    if (!mediaPublicBase) return item.secure_url;
    const format = item?.format ? `.${item.format}` : '';
    const type = item?.resource_type || 'image';
    return `${mediaPublicBase}/${type}/${item.public_id}${format}`;
  };

  const handleCopy = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setToast('Copied to clipboard.');
      setTimeout(() => setToast(''), 2000);
    } catch (err) {
      setError('Could not copy URL.');
    }
  };

  const folderParts = currentFolder
    ? currentFolder.split('/').filter(Boolean)
    : [];

  const normalizedFolderSearch = folderSearch.trim().toLowerCase();
  const filteredFolders = useMemo(() => {
    if (!normalizedFolderSearch) return folders;
    return folders.filter((folder) => {
      const name = `${folder?.name || ''}`.toLowerCase();
      const path = `${folder?.path || ''}`.toLowerCase();
      return name.includes(normalizedFolderSearch) || path.includes(normalizedFolderSearch);
    });
  }, [folders, normalizedFolderSearch]);

  const breadcrumbs = [{ label: 'Root', path: '' }].concat(
    folderParts.map((part, index) => ({
      label: part,
      path: folderParts.slice(0, index + 1).join('/')
    }))
  );

  if (loading) {
    return <AdminSkeleton compact rows={5} cards={4} showActions={false} />;
  }

  return (
    <section className={styles.mediaLibrary}>
      <div className={styles.header}>
        <div>
          <h2>Media Library</h2>
          <p>Upload images, videos, and files. Organize them with folders.</p>
        </div>
        <div className={styles.uploadPanel}>
          <div className={styles.uploadRow}>
            <label className={styles.filePicker}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(event) => handleFilePick(event, false)}
              />
              <span>Choose files</span>
            </label>
            <label className={styles.filePickerSecondary}>
              <input
                ref={folderInputRef}
                type="file"
                multiple
                webkitdirectory="true"
                directory=""
                onChange={(event) => handleFilePick(event, true)}
              />
              <span>Choose folder</span>
            </label>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={handleUpload}
              disabled={!uploadFiles.length || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className={styles.uploadRow}>
            <input
              type="text"
              value={currentFolder}
              onChange={(event) => setCurrentFolder(event.target.value)}
              placeholder="Current folder (e.g. portfolio/uploads)"
              className={styles.folderInput}
            />
            <span className={styles.uploadHint}>
              {uploadFiles.length
                ? `${uploadFiles.length} file${uploadFiles.length > 1 ? 's' : ''} selected`
                : 'No files selected'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.libraryLayout}>
        <aside className={styles.folderPanel}>
          <div className={styles.folderPanelHeader}>
            <h3>Folders</h3>
            <button
              type="button"
              className={styles.allFilesButton}
              onClick={() => setCurrentFolder('')}
              disabled={!currentFolder}
            >
              All files
            </button>
          </div>

          <div className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path || 'root'} className={styles.crumb}>
                <button
                  type="button"
                  className={`${styles.crumbButton} ${index === breadcrumbs.length - 1 ? styles.crumbActive : ''}`}
                  onClick={() => setCurrentFolder(crumb.path)}
                >
                  {crumb.label}
                </button>
                {index < breadcrumbs.length - 1 && <span className={styles.crumbSeparator}>/</span>}
              </div>
            ))}
          </div>

          <div className={styles.folderSearchRow}>
            <div className={styles.folderSearchWrap}>
              <input
                type="text"
                value={folderSearch}
                onChange={(event) => setFolderSearch(event.target.value)}
                placeholder="Search folders"
                className={styles.folderSearchInput}
              />
              {folderSearch.trim() && (
                <button
                  type="button"
                  className={styles.folderSearchIcon}
                  onClick={() => setFolderSearch('')}
                  aria-label="Clear folder search"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className={styles.folderActions}>
            <input
              type="text"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              placeholder="New folder name"
              className={styles.newFolderInput}
            />
            <button
              type="button"
              className={styles.createFolderButton}
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </button>
            <button
              type="button"
              className={styles.renameFolderButton}
              onClick={() => handleRenameFolder(currentFolder)}
              disabled={folderParts.length === 0}
            >
              Rename
            </button>
            <button
              type="button"
              className={styles.deleteFolderButton}
              onClick={() => requestDeleteFolder(currentFolder)}
              disabled={folderParts.length === 0}
            >
              Delete
            </button>
          </div>

          {foldersLoading ? (
            <div className={styles.folderLoading}>Loading folders...</div>
          ) : filteredFolders.length > 0 ? (
            <div className={styles.folderGrid}>
              {filteredFolders.map((folder) => (
                <div key={folder.path || folder.name} className={styles.folderCard}>
                  <button
                    type="button"
                    className={styles.folderOpenButton}
                    onClick={() => setCurrentFolder(folder.path || folder.name)}
                  >
                    <span>{folder.name || folder.path}</span>
                  </button>
                  <div className={styles.folderCardActions}>
                    <button
                      type="button"
                      className={styles.folderAction}
                      onClick={() => handleRenameFolder(folder.path || folder.name)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={styles.folderDeleteAction}
                      onClick={() => requestDeleteFolder(folder.path || folder.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.folderLoading}>
              {normalizedFolderSearch ? 'No folders match.' : 'No subfolders.'}
            </div>
          )}
        </aside>

        <div className={styles.contentPanel}>
          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <label>Type</label>
              <select value={resourceType} onChange={(event) => setResourceType(event.target.value)}>
                <option value="all">All</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="raw">Files</option>
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label>Folder</label>
              <input
                type="text"
                value={currentFolder}
                onChange={(event) => setCurrentFolder(event.target.value)}
                placeholder="portfolio/uploads"
              />
            </div>
            <div className={styles.filterActions}>
              {isSelectMode ? (
                <>
                  <button type="button" className={styles.bulkButton} onClick={handleSelectAll}>
                    {allVisibleSelected ? 'Unselect all' : 'Select all'}
                  </button>
                  {selectedKeys.length > 0 && (
                    <div className={styles.selectedPill}>{selectedKeys.length} selected</div>
                  )}
                  <button
                    type="button"
                    className={styles.bulkDeleteButton}
                    onClick={() => setBulkDeleteOpen(true)}
                    disabled={selectedKeys.length === 0}
                  >
                    Delete selected
                  </button>
                  <button type="button" className={styles.bulkCancelButton} onClick={() => {
                    setIsSelectMode(false);
                    setSelectedKeys([]);
                  }}>
                    Done
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.bulkButton}
                  onClick={() => setIsSelectMode(true)}
                  disabled={resources.length === 0}
                >
                  Select
                </button>
              )}
              <button type="button" className={styles.refreshButton} onClick={() => fetchMedia()}>
                Refresh
              </button>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {resources.length === 0 ? (
            <div className={styles.empty}>No media found.</div>
          ) : (
            <div className={styles.grid}>
              {resources.map((item) => {
                const key = buildKey(item);
                const isSelected = selectedSet.has(key);
                const format = typeof item?.format === 'string' ? item.format.toLowerCase() : '';
                const isPdf = format === 'pdf';
                const isImage = item.resource_type === 'image' && !isPdf;
                const isVisible = visibleKeys.has(key);
                const typeLabel = isPdf ? 'pdf' : (item.resource_type || 'file');
                return (
                  <div
                    key={key}
                    className={`${styles.card} ${isSelectMode ? styles.cardSelectable : ''} ${isSelected ? styles.cardSelected : ''}`}
                    onClick={(event) => handleCardClick(item, event)}
                  >
                    <div className={styles.cardMedia} ref={getMediaRef(key)}>
                      {!isVisible && (isImage || item.resource_type === 'video') && (
                        <div className={styles.mediaPlaceholder}>
                          <span>{item.resource_type === 'video' ? 'VIDEO' : 'IMAGE'}</span>
                        </div>
                      )}
                      {isVisible && isImage && (
                        <img src={item.secure_url} alt={item.public_id} loading="lazy" decoding="async" />
                      )}
                      {isVisible && item.resource_type === 'video' && (
                        <video src={item.secure_url} controls preload="metadata" />
                      )}
                      {(item.resource_type === 'raw' || isPdf) && (
                        <div className={styles.rawPreview}>
                          <span>{isPdf ? 'PDF' : 'FILE'}</span>
                          <strong>{format || 'raw'}</strong>
                        </div>
                      )}
                      {isSelectMode && (
                        <label className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(key)}
                          />
                        </label>
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <div>
                        <div className={styles.cardTitle}>{item.public_id}</div>
                        <div className={styles.cardMeta}>
                          <span>{typeLabel}</span>
                          {item.bytes ? <span>{formatBytes(item.bytes)}</span> : null}
                          {item.created_at ? <span>{formatDate(item.created_at)}</span> : null}
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <button type="button" onClick={() => handleCopy(buildPublicUrl(item))} className={styles.actionButton}>
                          Copy URL
                        </button>
                        <a href={buildPublicUrl(item)} target="_blank" rel="noreferrer" className={styles.actionLink}>
                          Open
                        </a>
                        <button type="button" onClick={() => requestDelete(item)} className={styles.deleteButton}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {nextCursor && (
            <div className={styles.loadMore}>
              <button type="button" onClick={() => fetchMedia({ append: true })} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete file"
        message="Delete this file from media library?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <DeleteModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete selected files"
        message={`Delete ${selectedKeys.length} selected file(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      <DeleteModal
        isOpen={Boolean(folderDeleteTarget)}
        onClose={() => setFolderDeleteTarget(null)}
        onConfirm={confirmDeleteFolder}
        title="Delete folder"
        message={`Delete folder "${folderDeleteTarget || ''}"? This folder must be empty.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </section>
  );
};

export default MediaLibrary;
