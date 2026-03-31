import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track whether we have signalled offline so we don't spam events
let _isApiDown = false;

function emitOnline() {
  if (_isApiDown) {
    _isApiDown = false;
    window.dispatchEvent(new CustomEvent('api:online'));
  }
}
function emitOffline() {
  if (!_isApiDown) {
    _isApiDown = true;
    window.dispatchEvent(new CustomEvent('api:offline'));
  }
}

api.interceptors.response.use(
  (res) => {
    // Any successful response means the server is reachable
    emitOnline();
    return res;
  },
  (error) => {
    const url: string = error.config?.url ?? '';
    const isAuthEndpoint = url.includes('/auth/');
    const status: number | undefined = error.response?.status;

    // Network error (no response at all) or server-side 5xx = API is down
    if (!error.response || (status !== undefined && status >= 500)) {
      emitOffline();
    } else {
      // 4xx and other errors mean server is up, just a business error
      emitOnline();
    }

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('bp_token');
      localStorage.removeItem('bp_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
