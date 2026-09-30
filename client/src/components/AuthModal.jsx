import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { name, email, password } : { email, password };

      const res = await axiosClient.post(endpoint, payload);
      if (res.data?.success) {
        login(res.data.token, res.data.user);
        onClose();
      } else {
        setError(res.data?.message || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h3>
          <button className="delete-btn" onClick={onClose} style={{ color: '#94a3b8' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.825rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Darshan Patel" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="name@example.com" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isRegister ? 'Register Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.825rem', color: '#94a3b8' }}>
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button 
                type="button"
                onClick={() => { setIsRegister(true); setError(''); }}
                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontWeight: 600, cursor: 'pointer' }}
              >
                Register Free
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
