import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = 'https://company-management-system-tp93.onrender.com/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Logging in with:', email, password);
    
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      
      console.log('Server response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        localStorage.setItem('userId', response.data.userId);
        console.log('Login successful, redirecting...');
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch(err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { role: 'SUPER ADMIN', email: 'super@admin.com', pass: '123' },
    { role: 'ADMIN', email: 'admin@test.com', pass: '123' },
    { role: 'UNIT MANAGER', email: 'manager@test.com', pass: '123' },
    { role: 'USER', email: 'user@test.com', pass: '123' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: 30, borderRadius: 10, width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 5 }}>📊 Company Management System</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 30 }}>Login to your account</p>
        
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: 10, padding: 10, background: '#fee', borderRadius: 5 }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: 12, marginBottom: 10, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: 12, marginBottom: 20, border: '1px solid #ddd', borderRadius: 5, boxSizing: 'border-box' }} 
            required 
          />
          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: 12, background: loading ? '#ccc' : '#667eea', color: 'white', border: 'none', borderRadius: 5, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 16 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div style={{ marginTop: 30 }}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: 10, fontSize: 12 }}>Demo Accounts (Password: 123)</p>
          {demoUsers.map((u, i) => (
            <div 
              key={i} 
              onClick={() => { setEmail(u.email); setPassword(u.pass); }} 
              style={{ padding: 10, marginBottom: 8, background: '#f8f9fa', borderRadius: 5, cursor: 'pointer', textAlign: 'center', border: '1px solid #e9ecef' }}
            >
              {u.role}: {u.email}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;
