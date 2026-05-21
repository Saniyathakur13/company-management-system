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
    
    try {
        const response = axios.post(`${API_URL}/login`, { email, password })
        
        console.log('Login response:', response.data);
        
        if (response.data.success && response.data.token) {
           localStorage.setItem('token', response.data.token);
localStorage.setItem('role', response.data.role);
localStorage.setItem('userId', response.data.userId);
            
            console.log('Redirecting to dashboard...');
            navigate('/dashboard');
        } else {
            setError(response.data.message || 'Login failed');
        }
    } catch(err) {
        console.error('Login error:', err);
        setError('Server error');
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
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#667eea' }}>
      <div style={{ background: 'white', padding: 30, borderRadius: 10, width: 400 }}>
        <h2 style={{ textAlign: 'center' }}>Company Management System</h2>
        
        {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10, boxSizing: 'border-box' }} required />
          <button type="submit" style={{ width: '100%', padding: 10, background: '#667eea', color: 'white', border: 'none', cursor: 'pointer' }}>Login</button>
        </form>
        
        <div style={{ marginTop: 20 }}>
          <p style={{ textAlign: 'center', fontSize: 12 }}>Demo Accounts (Password: 123)</p>
          {demoUsers.map((u, i) => (
            <div key={i} onClick={() => { setEmail(u.email); setPassword(u.pass); }} style={{ padding: 8, margin: 5, background: '#f0f0f0', borderRadius: 5, cursor: 'pointer', textAlign: 'center' }}>
              {u.role}: {u.email}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Login;
