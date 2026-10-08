import React, { useState } from 'react';
import { apiRequest } from '../api';

const AdminLogin = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setErrorMessage('Enter the administrator password.');
      return;
    }

    setIsSubmitting(true);
    const { ok, data } = await apiRequest('/api/admin/login', { method: 'POST', body: { password } });
    setIsSubmitting(false);

    if (ok) {
      onSuccess(data.token);
    } else {
      setErrorMessage(data.message || 'Login failed.');
      setPassword('');
    }
  };

  return (
    <div className="panel login-panel">
      <h1 className="panel-title">Admin Login</h1>

      <form className="panel-body" onSubmit={handleSubmit}>
        <p className="small text-muted-soft">Enter the password to view registered students.</p>

        {errorMessage && <div className="form-alert danger py-2" role="alert">{errorMessage}</div>}

        <label htmlFor="admin-password" className="form-label">Password</label>
        <input
          id="admin-password"
          type="password"
          className="form-control mb-3"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage('');
          }}
          autoFocus
        />

        <button type="submit" className="btn-main w-100" disabled={isSubmitting}>
          {isSubmitting ? 'Checking…' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
