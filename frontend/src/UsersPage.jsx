import { useEffect, useState } from 'react';
import {
  Users, UserPlus, Search, RefreshCw, Pencil, X,
  ShieldCheck, AlertCircle
} from 'lucide-react';

const ROLES = ['admin', 'manager', 'cashier'];

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error?.message || 'The request could not be completed.');
  }

  return body;
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'cashier', status: 'active',
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadUsers() {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });

      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      try {
        const result = await apiRequest(
          `/api/v1/users?${params.toString()}`,
          { signal: controller.signal },
        );
        setUsers(result.data || []);
        setPagination(result.pagination);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unable to load staff accounts.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadUsers();
    return () => controller.abort();
  }, [page, search, roleFilter, statusFilter, reload]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: '', email: '', password: '', role: 'cashier', status: 'active',
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
    });
    setError('');
    setNotice('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  }

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
    };

    if (!editing || form.password) payload.password = form.password;

    try {
      await apiRequest(
        editing
          ? `/api/v1/users/${encodeURIComponent(editing._id)}`
          : '/api/v1/users',
        {
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      );

      setModalOpen(false);
      setEditing(null);
      setNotice(editing ? 'Staff account updated successfully.' : 'Staff account created successfully.');
      setPage(1);
      setReload(value => value + 1);
    } catch (err) {
      setError(err.message || 'Unable to save the staff account.');
    } finally {
      setSaving(false);
    }
  }

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className="users-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Users &amp; Roles</h1>
          <p>Manage staff accounts and control access to your store.</p>
        </div>
        <button type="button" className="users-primary" onClick={openCreate}>
          <UserPlus size={17} /> Add staff member
        </button>
      </div>

      <div className="users-summary">
        <div className="users-summary-icon"><Users size={21} /></div>
        <div>
          <span>Total staff accounts</span>
          <strong>{pagination.total}</strong>
        </div>
        <div className="users-summary-note">
          <ShieldCheck size={16} />
          Administrator access required
        </div>
      </div>

      {notice && (
        <div className="users-notice" role="status">{notice}</div>
      )}

      <form className="users-toolbar" onSubmit={applySearch}>
        <div className="users-search">
          <Search size={17} />
          <input
            aria-label="Search staff"
            placeholder="Search by name or email..."
            value={searchInput}
            maxLength={100}
            onChange={event => setSearchInput(event.target.value)}
          />
        </div>
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={event => { setPage(1); setRoleFilter(event.target.value); }}
        >
          <option value="">All roles</option>
          {ROLES.map(role => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={event => { setPage(1); setStatusFilter(event.target.value); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="users-secondary">Search</button>
        <button
          type="button"
          className="users-icon-button"
          aria-label="Refresh staff list"
          title="Refresh"
          disabled={loading}
          onClick={() => setReload(value => value + 1)}
        >
          <RefreshCw size={16} />
        </button>
      </form>

      {error && !modalOpen && (
        <div className="users-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setReload(value => value + 1)}>
            Retry
          </button>
        </div>
      )}

      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Staff member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th><span className="users-action-heading">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="users-empty">Loading staff accounts...</td></tr>
            ) : error ? (
              <tr><td colSpan="5" className="users-empty">Staff accounts could not be loaded.</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="users-empty">
                  <Users size={25} />
                  <strong>No staff accounts found</strong>
                  <p>Try another search or add a staff member.</p>
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className="users-identity">
                    <div className="users-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`users-role users-role-${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`users-status users-status-${user.status}`}>
                    <i /> {user.status}
                  </span>
                </td>
                <td className="users-last-login">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : 'Never'}
                </td>
                <td>
                  <button
                    type="button"
                    className="users-edit"
                    onClick={() => openEdit(user)}
                    aria-label={`Edit ${user.name}`}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="users-pagination">
        <span>
          Showing {users.length ? (page - 1) * pagination.limit + 1 : 0}
          {'–'}{(page - 1) * pagination.limit + users.length}
          {' '}of {pagination.total}
        </span>
        <div>
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage(value => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>Page {page} of {Math.max(1, pagination.totalPages)}</span>
          <button
            type="button"
            disabled={loading || page >= pagination.totalPages}
            onClick={() => setPage(value => value + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="users-modal-backdrop"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="users-modal-title"
          >
            <div className="users-modal-heading">
              <div>
                <p className="eyebrow">STAFF MANAGEMENT</p>
                <h2 id="users-modal-title">
                  {editing ? 'Edit staff account' : 'Add staff member'}
                </h2>
                <p>
                  {editing
                    ? 'Update account details, role, or status.'
                    : 'Create a secure account for a team member.'}
                </p>
              </div>
              <button
                type="button"
                className="users-icon-button"
                aria-label="Close dialog"
                disabled={saving}
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </div>

            <form className="users-form" onSubmit={submitForm}>
              {error && <div className="users-form-error" role="alert">{error}</div>}

              <label className="users-field">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                />
              </label>

              <label className="users-field">
                Email address
                <input
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                />
              </label>

              <label className="users-field">
                {editing ? 'New password (optional)' : 'Initial password'}
                <input
                  type="password"
                  required={!editing}
                  minLength={12}
                  maxLength={200}
                  autoComplete="new-password"
                  placeholder={editing ? 'Leave blank to keep current password' : 'At least 12 characters'}
                  value={form.password}
                  onChange={event => setForm({ ...form, password: event.target.value })}
                />
              </label>

              <div className="users-form-grid">
                <label className="users-field">
                  Role
                  <select
                    value={form.role}
                    onChange={event => setForm({ ...form, role: event.target.value })}
                  >
                    {ROLES.map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="users-field">
                  Account status
                  <select
                    value={form.status}
                    onChange={event => setForm({ ...form, status: event.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-secondary"
                  disabled={saving}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="users-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create account'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
