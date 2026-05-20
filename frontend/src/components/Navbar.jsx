import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    
    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };
    
    return (
        <nav style={{ background: '#333', padding: 10, display: 'flex', gap: 20 }}>
            <Link to="/invoices" style={{ color: 'white' }}>Invoices</Link>
            {(role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'UNIT_MANAGER') && (
                <Link to="/users" style={{ color: 'white' }}>Users</Link>
            )}
            <button onClick={logout} style={{ marginLeft: 'auto' }}>Logout</button>
        </nav>
    );
}

export default Navbar;