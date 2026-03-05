import React, { useEffect, useMemo, useState } from 'react';
import styles from './StocksManagement.module.css';
import AdminSkeleton from './AdminSkeleton';
import DeleteModal from './DeleteModal';
import StockForm from './StockForm';

const StocksManagement = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewStock, setPreviewStock] = useState(null);

  useEffect(() => {
    if (!previewStock) return undefined;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [previewStock]);

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const getId = (item) => item?._id || item?.id;

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/stocks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stocks');
      }

      const data = await response.json();
      setStocks(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Error loading stock items');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (payload) => {
    try {
      const token = localStorage.getItem('adminToken');
      const targetId = editingStock ? getId(editingStock) : null;
      const url = targetId
        ? `${process.env.REACT_APP_API_URL}/api/admin/stocks/${targetId}`
        : `${process.env.REACT_APP_API_URL}/api/admin/stocks`;
      const method = targetId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save stock');
      }

      const saved = await response.json();
      setStocks((prev) => {
        if (targetId) {
          return prev.map((item) => (getId(item) === targetId ? saved : item));
        }
        return [saved, ...prev];
      });
      setSuccess(targetId ? 'Stock updated successfully' : 'Stock created successfully');
      setIsFormOpen(false);
      setEditingStock(null);
    } catch (err) {
      setError(err?.message || 'Error saving stock');
    }
  };

  const handleToggleStatus = async (stock) => {
    const targetId = getId(stock);
    if (!targetId) return;
    const nextStatus = stock.status === 'active' ? 'draft' : 'active';

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/stocks/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updated = await response.json();
      setStocks((prev) => prev.map((item) => (getId(item) === targetId ? updated : item)));
      setSuccess('Status updated');
    } catch (err) {
      setError('Could not update status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = getId(deleteTarget);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/stocks/${targetId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      setStocks((prev) => prev.filter((item) => getId(item) !== targetId));
      setSuccess('Stock deleted');
      setDeleteTarget(null);
    } catch (err) {
      setError('Error deleting stock');
    }
  };

  const handleCopyEmail = async (text) => {
    if (!text) {
      setError('No email found');
      return;
    }
    const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const uniqueEmails = Array.from(new Set(emailMatches));
    if (uniqueEmails.length === 0) {
      setError('No email found');
      return;
    }
    try {
      await navigator.clipboard.writeText(uniqueEmails.join('\n'));
      setToast('Email copied');
    } catch (err) {
      setError('Could not copy email');
    }
  };

  const renderEmailText = (text) => {
    if (!text) return 'No email text yet.';
    const regex = /https?:\/\/[^\s]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        const value = match[0];
        const isEmail = value.includes('@') && !value.startsWith('http');
        parts.push(
          <a
            key={`${value}-${match.index}`}
            href={isEmail ? `mailto:${value}` : value}
            target={isEmail ? undefined : '_blank'}
            rel={isEmail ? undefined : 'noreferrer'}
          >
            {value}
          </a>
        );
        lastIndex = match.index + value.length;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      return (
        <span key={`line-${lineIndex}`}>
          {parts}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      );
    });
  };

  const filteredStocks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let list = [...stocks];

    if (statusFilter !== 'all') {
      list = list.filter((item) => item.status === statusFilter);
    }

    if (normalizedSearch) {
      list = list.filter((item) => {
        const haystack = [
          item.title || '',
          item.emailBody || '',
          ...(Array.isArray(item.tags) ? item.tags : [])
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedSearch);
      });
    }

    const sortByTitle = (a, b) => (a.title || '').localeCompare(b.title || '');
    const sortByDate = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'title-asc':
        list.sort(sortByTitle);
        break;
      case 'title-desc':
        list.sort((a, b) => sortByTitle(b, a));
        break;
      default:
        list.sort(sortByDate);
        break;
    }

    return list;
  }, [stocks, search, statusFilter, sort]);

  const formatDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleString();
  };

  if (loading) {
    return <AdminSkeleton compact rows={4} cards={3} showActions={false} />;
  }

  return (
    <section className={styles.stocksManagement}>
      <header className={styles.header}>
        <div>
          <h2>Stock Panel</h2>
          <p className={styles.subtitle}>Store titles, email drafts, and optional images.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={fetchStocks}
          >
            Refresh
          </button>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => {
              setEditingStock(null);
              setIsFormOpen(true);
            }}
          >
            Add Stock
          </button>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <input
            type="text"
            placeholder="Search title, tags, or email text..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={styles.searchInput}
          />
          {search.trim() && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <label>Status</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Sort</label>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
          </select>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {filteredStocks.length === 0 ? (
        <div className={styles.empty}>No stock items yet.</div>
      ) : (
        <div className={styles.grid}>
          {filteredStocks.map((stock) => {
            const id = getId(stock);
            const isActive = stock.status === 'active';
            const emailText = stock.emailBody || '';
            return (
              <article key={id} className={styles.card}>
                <div className={styles.cardMedia}>
                  {stock.imageUrl ? (
                    <img src={stock.imageUrl} alt={stock.title} />
                  ) : (
                    <div className={styles.imagePlaceholder}>No image</div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.cardTitleRow}>
                    <h3>{stock.title}</h3>
                    <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusDraft}`}>
                      {isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    <span>Updated: {formatDate(stock.updatedAt || stock.createdAt)}</span>
                  </div>
                  {Array.isArray(stock.tags) && stock.tags.length > 0 && (
                    <div className={styles.tags}>
                      {stock.tags.map((tag, index) => (
                        <span key={`${tag}-${index}`} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className={styles.emailSnippet}>
                    {renderEmailText(emailText)}
                  </p>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={() => setPreviewStock(stock)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => {
                        setEditingStock(stock);
                        setIsFormOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.statusButton}
                      onClick={() => handleToggleStatus(stock)}
                    >
                      {isActive ? 'Set Draft' : 'Set Active'}
                    </button>
                    <button
                      type="button"
                      className={styles.copyButton}
                      onClick={() => handleCopyEmail(emailText)}
                      disabled={!emailText}
                    >
                      Copy Email
                    </button>
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => setDeleteTarget(stock)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toast && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {previewStock && (
        <div className={styles.modalOverlay} onClick={() => setPreviewStock(null)}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>{previewStock.title}</h3>
                <div className={styles.modalMetaRow}>
                  <span className={`${styles.statusBadge} ${previewStock.status === 'active' ? styles.statusActive : styles.statusDraft}`}>
                    {previewStock.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                  <span className={styles.modalMetaText}>
                    Updated: {formatDate(previewStock.updatedAt || previewStock.createdAt)}
                  </span>
                </div>
              </div>
              <button type="button" className={styles.modalClose} onClick={() => setPreviewStock(null)}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalImage}>
                {previewStock.imageUrl ? (
                  <img src={previewStock.imageUrl} alt={previewStock.title} />
                ) : (
                  <div className={styles.modalImagePlaceholder}>No image</div>
                )}
              </div>

              {Array.isArray(previewStock.tags) && previewStock.tags.length > 0 && (
                <div className={styles.modalTags}>
                  {previewStock.tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}

              <div className={styles.modalEmail}>
                {renderEmailText(previewStock.emailBody || '')}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.copyButton}
                onClick={() => handleCopyEmail(previewStock.emailBody || '')}
                disabled={!previewStock.emailBody}
              >
                Copy Email
              </button>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => {
                  setPreviewStock(null);
                  setEditingStock(previewStock);
                  setIsFormOpen(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setPreviewStock(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <StockForm
          stock={editingStock}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setEditingStock(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete stock item"
        message="Delete this stock item? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </section>
  );
};

export default StocksManagement;
