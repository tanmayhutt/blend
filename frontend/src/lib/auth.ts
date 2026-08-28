// Authentication utilities
import axios from 'axios';

// API base from environment; no hardcoded fallback per deployment policy
const API_BASE = import.meta.env.VITE_API_URL as string;
if (!API_BASE) {
  console.error("VITE_API_URL is not set. Please configure it in your deployment environment.");
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export const authClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Add auth token to requests
authClient.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.access_token) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  return config;
});

// Handle token refresh on 401
authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getTokens();
        if (tokens?.refresh_token) {
          // Request new access token
          const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: tokens.refresh_token,
          });

          if (response.data.access_token && response.data.refresh_token) {
            saveTokens({
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token,
            });

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
            return authClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.warn("Blend session expired.");
        clearTokens();
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export const saveTokens = (tokens: AuthTokens) => {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
};

export const getTokens = (): AuthTokens | null => {
  const stored = localStorage.getItem('auth_tokens');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<AuthTokens>;
    return parsed.access_token && parsed.refresh_token ? parsed as AuthTokens : null;
  } catch {
    localStorage.removeItem('auth_tokens');
    return null;
  }
};

export const clearTokens = () => {
  localStorage.removeItem('auth_tokens');
};

export const isAuthenticated = (): boolean => {
  return !!getTokens()?.access_token;
};

export const initiateLogin = async () => {
  if (!API_BASE) throw new Error("VITE_API_URL is not configured");
  const response = await axios.get<{ url: string }>(`${API_BASE}/auth/login`);
  if (!response.data.url) throw new Error("Google sign-in URL was not returned");
  window.location.assign(response.data.url);
};
