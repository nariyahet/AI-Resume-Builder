import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercept requests to attach JWT token and optional client Gemini API Key
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_resume_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const geminiKey = localStorage.getItem('ai_resume_gemini_key');
  if (geminiKey) {
    config.headers['x-gemini-api-key'] = geminiKey;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default axiosClient;
