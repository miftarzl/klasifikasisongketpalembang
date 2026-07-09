import axios from 'axios';

// Configure base URL:
// - If `VITE_API_URL` is provided, use `${VITE_API_URL}/api`
// - Otherwise use a relative `/api` so Vite proxy (dev) or same-origin (prod) handles it.
const rawHost = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
const API_BASE = rawHost ? `${String(rawHost).replace(/\/+$/, '')}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  timeout: 30000, // 30s
});

// Note: baseURL resolved from env or relative '/api'.

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Allow the browser to set the correct multipart/form-data boundary.
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers = config.headers || {};
    if (!config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// Normalize responses from predictions endpoint so UI always gets consistent shape
const normalizePredictionPayload = (data) => {
  if (!data || typeof data !== 'object') return data;

  const payload = data.prediction || data || {};
  const label = data.label || data.prediction_label || data.prediction || payload.label || null;
  const confidence = data.confidence ?? data.confidence_score ?? data.confidence_score_pct ?? payload.confidence ?? payload.confidence_score ?? null;
  const top_predictions = data.top_predictions || data.topPredictions || payload.top_predictions || payload.topPredictions || [];
  const quality = data.quality || payload.quality || null;
  const message = data.message || payload.message || null;

  let conf = null;
  if (typeof confidence === 'string') {
    conf = parseFloat(confidence);
  } else if (typeof confidence === 'number') {
    conf = confidence;
  }
  if (conf != null && conf > 1) {
    conf = conf / 100;
  }

  const normalized = {
    ...data,
    ...payload,
    label,
    prediction: label,
    prediction_label: label,
    confidence: conf,
    confidence_score: conf,
    quality,
    message,
    top_predictions,
    low_confidence: data.low_confidence ?? payload.low_confidence ?? null,
    warning_message: data.warning_message ?? payload.warning_message ?? null,
    model_version: data.model_version ?? payload.model_version ?? data.modelVersion ?? payload.modelVersion ?? null,
    created_at: data.created_at ?? payload.created_at ?? null,
    image_url: data.image_url ?? data.image ?? data.image_path ?? payload.image_url ?? payload.image ?? payload.image_path ?? null,
    image: data.image_url ?? data.image ?? data.image_path ?? payload.image_url ?? payload.image ?? payload.image_path ?? null,
    image_path: data.image_url ?? data.image ?? data.image_path ?? payload.image_url ?? payload.image ?? payload.image_path ?? null,
    _raw: data,
  };

  return normalized;
};

api.interceptors.response.use(
  (response) => {
    try {
      const url = (response.config && response.config.url) || '';
      if (url.includes('/predictions') && response.data && !Array.isArray(response.data)) {
        response.data = normalizePredictionPayload(response.data || {});
      }
    } catch (e) {
      // keep original response if normalization fails
      console.error('Response normalization error:', e);
    }
    return response;
  },
  (error) => {
    // Centralized error messaging
    // Centralized error messaging
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.message || error.response.statusText || 'Server Error';
      // If unauthorized, clear token and force login with message
      if (status === 401) {
        try {
          localStorage.removeItem('admin_token');
          localStorage.setItem('admin_session_message', 'Sesi login telah berakhir. Silakan login kembali.');
          // clear axios default header
          try { delete api.defaults.headers.common['Authorization']; } catch (e) {}
          // redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/admin/login';
          }
        } catch (e) {
          // ignore
        }
      }

      const err = new Error(msg);
      err.status = status;
      err.response = error.response;
      return Promise.reject(err);
    }
    if (error.code === 'ECONNABORTED') {
      const err = new Error('Request timeout');
      err.code = 'ECONNABORTED';
      return Promise.reject(err);
    }
    return Promise.reject(error);
  }
);
