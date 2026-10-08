import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

import { apiRequest } from './api';
import SiteLayout from './components/SiteLayout';
import HomePage from './pages/HomePage';
import RegistrationPage from './pages/RegistrationPage';
import GalleryPage from './pages/GalleryPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const [stats, setStats] = useState(null);

  // Seats remaining — shown on the notice board and used to close the form when full
  const loadStats = useCallback(async () => {
    const { ok, data } = await apiRequest('/api/stats');
    if (ok) setStats(data.data);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <Routes>
      {/* Admin page manages its own layout (full-width table once logged in) */}
      <Route path="/admin" element={<AdminPage />} />

      <Route element={<SiteLayout />}>
        <Route index element={<HomePage stats={stats} />} />
        <Route path="registration" element={<RegistrationPage stats={stats} onRegistered={loadStats} />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
