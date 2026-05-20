import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

function UserDashboard() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [userRole, setUserRole] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', role: '', password: '' });
    const [updateRole, setUpdateRole] = useState({ userId: null, newRole: '' });

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        const params = {};
        if (search) params.search = search;
        if (userRole) params.role = userRole;
        
        try {
            const response = await axios.get('http://localhost:5000/api/users', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [search, userRole]);

    const createUser = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/users', newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('User created successfully!');
            setShowCreateForm(false);
            setNewUser({ username: '', email: '', role: '', password: '' });
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating user');
        }
    };

    const updateUserRole = async (userId, newRole) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:5000/api/users/${userId}/role`, 
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Role updated successfully!');
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating role');
        }
    };

    const deleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('User deleted successfully!');
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting user');
        }
    };

    const currentUserRole = localStorage.getItem('role');
    
    // Determine which roles can be created
    const getAvailableRoles = () => {
        if (currentUserRole === 'SUPER_ADMIN') return ['ADMIN'];
        if (currentUserRole === 'ADMIN') return ['UNIT_MANAGER'];
        if (currentUserRole === 'UNIT_MANAGER') return ['USER'];
        return [];
    };

    return (
        <div>
            <Navbar />
            <div style={{ padding: 20 }}>
                <h2>User Dashboard</h2>
                
                <div style={{ marginBottom: 20 }}>
                    <input 
                        type="text" 
                        placeholder="Search by username or email" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ marginRight: 10, padding: 8 }}
                    />
                    <select 
                        value={userRole} 
                        onChange={(e) => setUserRole(e.target.value)}
                        style={{ marginRight: 10, padding: 8 }}
                    >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="UNIT_MANAGER">Unit Manager</option>
                        <option value="USER">User</option>
                    </select>
                    <button onClick={() => setShowCreateForm(true)} style={{ padding: 8, cursor: 'pointer' }}>
                        Create User
                    </button>
                </div>

                {showCreateForm && (
                    <div style={{ border: '1px solid #ccc', padding: 20, marginBottom: 20, borderRadius: 5 }}>
                        <h3>Create New User</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300 }}>
                            <input 
                                placeholder="Username" 
                                value={newUser.username} 
                                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                style={{ padding: 8 }}
                            />
                            <input 
                                placeholder="Email" 
                                type="email"
                                value={newUser.email} 
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                style={{ padding: 8 }}
                            />
                            <select 
                                value={newUser.role} 
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                style={{ padding: 8 }}
                            >
                                <option value="">Select Role</option>
                                {getAvailableRoles().map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <input 
                                placeholder="Password" 
                                type="password"
                                value={newUser.password} 
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                style={{ padding: 8 }}
                            />
                            <div>
                                <button onClick={createUser} style={{ marginRight: 10, padding: 8, cursor: 'pointer' }}>Save</button>
                                <button onClick={() => setShowCreateForm(false)} style={{ padding: 8, cursor: 'pointer' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f0f0f0' }}>
                        <tr>
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.user_id}</td>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <select 
                                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                                        defaultValue=""
                                        style={{ marginRight: 10, padding: 5 }}
                                    >
                                        <option value="">Update Role</option>
                                        {currentUserRole === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN' && (
                                            <option value="ADMIN">Make Admin</option>
                                        )}
                                        {currentUserRole === 'ADMIN' && user.role === 'UNIT_MANAGER' && (
                                            <option value="UNIT_MANAGER">Keep Unit Manager</option>
                                        )}
                                        {currentUserRole === 'UNIT_MANAGER' && user.role === 'USER' && (
                                            <option value="USER">Keep User</option>
                                        )}
                                    </select>
                                    <button 
                                        onClick={() => deleteUser(user.id)}
                                        style={{ padding: 5, cursor: 'pointer', background: 'red', color: 'white', border: 'none' }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default UserDashboard;