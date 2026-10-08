// Defaults to port 5000 on whichever machine served the page, so the site works
// from other devices on the network (e.g. http://192.168.x.x:5173 → :5000).
export const API_URL = import.meta.env.VITE_API_BASE_URL;

// Calls the backend and always resolves to { ok, status, data }.
// Network failures come back as status 0 instead of throwing.
export const apiRequest = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: 'Cannot reach the server. Please check your connection and try again.' }
    };
  }
};

// Admin session token lives in sessionStorage: cleared when the tab closes.
const TOKEN_KEY = 'adminToken';

export const getStoredToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const storeToken = (token) => {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable (private mode) — session simply won't survive a reload
  }
};
