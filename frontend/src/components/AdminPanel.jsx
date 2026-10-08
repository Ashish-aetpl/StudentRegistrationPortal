import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_URL, apiRequest } from '../api';

const formatDateTime = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

// Older records in registrations.json may be missing fields or use other names
const parentsOf = (item) => item.parentNames || item.guardians || [];

const AdminPanel = ({ token, onLogout }) => {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const { ok, status, data } = await apiRequest('/api/registrations', { token });
    setIsLoading(false);

    if (status === 401) {
      onLogout();
      return;
    }
    if (ok) setRegistrations(data.data);
    else setError(data.message || 'Could not load registrations.');
  }, [token, onLogout]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  const handleLogout = async () => {
    await apiRequest('/api/admin/logout', { method: 'POST', token });
    onLogout();
  };

  // The CSV needs the auth header, so it's fetched here and saved as a file
  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/registrations/export.csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      if (!res.ok) throw new Error();

      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not export registrations.');
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return registrations;
    return registrations.filter((item) =>
      [item.id, item.fullName, item.schoolName, item.contactNumber, item.category, ...parentsOf(item)]
        .some((value) => String(value || '').toLowerCase().includes(query)));
  }, [registrations, search]);

  return (
    <div>
      <div className="admin-bar">
        <div className="container-fluid px-3 px-md-4">
          <h1>Special Campaign 6.0 — Registered Students</h1>
          <button type="button" className="btn-accent btn-sm-plain" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <main className="container-fluid px-3 px-md-4 py-4" id="main-content">
        <div className="admin-toolbar">
          <span className="count-badge">Total: {registrations.length}</span>
          <input
            type="search"
            className="form-control"
            placeholder="Search name, school, mobile, ID…"
            aria-label="Search registrations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn-outline-main btn-sm-plain" onClick={loadRegistrations}>
            ↻ Refresh
          </button>
          <button
            type="button"
            className="btn-main btn-sm-plain"
            onClick={handleExport}
            disabled={registrations.length === 0}
          >
            ⬇ Export CSV
          </button>
        </div>

        {error && <div className="form-alert danger" role="alert">{error}</div>}

        {isLoading ? (
          <p className="text-muted-soft">Loading registrations…</p>
        ) : filtered.length === 0 ? (
          <div className="panel">
            <div className="panel-body text-center text-muted-soft">
              {registrations.length === 0 ? 'No students have registered yet.' : 'No registrations match your search.'}
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Registration ID</th>
                  <th>Student Name</th>
                  <th>Date of Birth</th>
                  <th>Category</th>
                  <th>School / Institution</th>
                  <th>Mobile</th>
                  <th>Parents / Guardians</th>
                  <th>Events</th>
                  <th>Registered On</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => {
                  const parents = parentsOf(item);
                  return (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>
                      <td className="text-nowrap small">{item.id || '-'}</td>
                      <td className="fw-semibold">{item.fullName || '-'}</td>
                      <td className="text-nowrap">{item.dob || '-'}</td>
                      <td>{item.category || '-'}</td>
                      <td>{item.schoolName || '-'}</td>
                      <td className="text-nowrap">{item.contactNumber || '-'}</td>
                      <td>{parents.length > 0 ? parents.join(', ') : <span className="text-muted-soft">—</span>}</td>
                      <td>
                        {(item.participation || []).map((event) => (
                          <span key={event} className="event-tag">{event}</span>
                        ))}
                      </td>
                      <td className="text-nowrap">{formatDateTime(item.registeredAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
