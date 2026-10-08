import React, { useCallback, useState } from 'react';

import { getStoredToken, storeToken } from '../api';
import SiteLayout from '../components/SiteLayout';
import AdminLogin from '../components/AdminLogin';
import AdminPanel from '../components/AdminPanel';

// /admin — login form inside the normal site layout,
// then the full-width registrations table once logged in.
const AdminPage = () => {
  const [token, setToken] = useState(getStoredToken);

  const handleLogin = (newToken) => {
    storeToken(newToken);
    setToken(newToken);
    window.scrollTo(0, 0);
  };

  const handleLogout = useCallback(() => {
    storeToken('');
    setToken('');
  }, []);

  if (token) {
    return <AdminPanel token={token} onLogout={handleLogout} />;
  }

  return (
    <SiteLayout>
      <div className="container py-5">
        <AdminLogin onSuccess={handleLogin} />
      </div>
    </SiteLayout>
  );
};

export default AdminPage;
