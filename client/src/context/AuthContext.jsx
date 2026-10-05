import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('ai_resume_token') || '');
  const [geminiKey, setGeminiKeyState] = useState(localStorage.getItem('ai_resume_gemini_key') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const res = await axiosClient.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('ai_resume_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ai_resume_token');
    localStorage.removeItem('ai_resume_current_draft');
    setToken('');
    setUser(null);
  };

  const setGeminiKey = (key) => {
    if (key) {
      localStorage.setItem('ai_resume_gemini_key', key);
    } else {
      localStorage.removeItem('ai_resume_gemini_key');
    }
    setGeminiKeyState(key);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, geminiKey, setGeminiKey, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
