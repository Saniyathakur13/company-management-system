import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invoices');
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newInvoice, setNewInvoice] = useState({ number: '', date: '', amount: '' });
  const [newUser, setNewUser] = useState({ username: '', email: '', role: '', password: '' });
  const [searchFilter, setSearchFilter] = useState('');
  const API_URL = 'https://company-management-system-tp93.onrender.com/api';
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  useEffect(() => {
    if (!token) navigate('/login');
  }, [token]);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(`${API_URL}/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let data = res.data;
      if (searchFilter) {
        data = data.filter(i => i.invoice_number.toLowerCase().includes(searchFilter.toLowerCase()));
      }
      setInvoices(data);
    } catch(err) { console.error(err); }
  };

 const fetchUsers = async () => {
    try {
        const token = localStorage.getItem('token');
        console.log('Fetching users with token:', token);
        
        const res = await axios.get(`${API_URL}/users`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        console.log('Fetched users response:', res.data);
        setUsers(res.data);
    } catch(err) { 
        console.error('Fetch users error:', err);
        console.error('Error response:', err.response);
    }
};

  useEffect(() => { fetchInvoices(); }, [searchFilter]);
  useEffect(() => { fetchUsers(); }, []);

  const createInvoice = async () => {
    if (!newInvoice.number || !newInvoice.date || !newInvoice.amount) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/invoices`, {
        number: newInvoice.number,
        date: newInvoice.date,
        amount: newInvoice.amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('✅ Invoice created!');
        setShowInvoiceForm(false);
        setNewInvoice({ number: '', date: '', amount: '' });
        fetchInvoices();
      } else {
        alert('❌ ' + response.data.message);
      }
    } catch(err) { 
      alert('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const updateInvoice = async () => {
    if (!editingInvoice.invoice_number || !editingInvoice.invoice_date || !editingInvoice.invoice_amount) {
      alert('Please fill all fields');
      return;
    }
    
    let formattedDate = editingInvoice.invoice_date;
    
    if (formattedDate && formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
    
    if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log('Date is correct format:', formattedDate);
    } else {
      const d = new Date(formattedDate);
      formattedDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    
    console.log('Sending date to server:', formattedDate);
    
    try {
      const response = await axios.put(`${API_URL}/invoices/${editingInvoice.id}`, {
        invoice_number: editingInvoice.invoice_number,
        invoice_date: formattedDate,
        invoice_amount: editingInvoice.invoice_amount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('✅ Invoice updated!');
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        alert('❌ ' + response.data.message);
      }
    } catch(err) { 
      console.error('Update error:', err);
      alert('❌ ' + (err.response?.data?.message || 'Error updating invoice'));
    }
  };

  const deleteInvoice = async (id) => {
    if (confirm('Delete this invoice?')) {
      await axios.delete(`${API_URL}/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvoices();
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.role || !newUser.password) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('✅ User created!');
        setShowUserForm(false);
        setNewUser({ username: '', email: '', role: '', password: '' });
        fetchUsers();
      } else {
        alert('❌ ' + response.data.message);
      }
    } catch(err) { 
      alert('❌ ' + (err.response?.data?.message || 'Error'));
    }
  };

  const updateRole = async (id, newRole, currentRole) => {
    const currentUserId = localStorage.getItem('userId');
    
    if (id == currentUserId) {
        alert('❌ You cannot change your own role!');
        fetchUsers();
        return;
    }
    
    if (!newRole) {
        return;
    }
    
    try {
        const response = await axios.put(`${API_URL}/users/${id}/role`, { role: newRole }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
            alert(`✅ Role changed from ${currentRole} to ${newRole}`);
            fetchUsers();
        } else {
            alert('❌ ' + response.data.message);
            fetchUsers();
        }
    } catch(err) {
        alert('❌ ' + (err.response?.data?.message || 'Error updating role'));
        fetchUsers();
    }
  };

  const deleteUser = async (id) => {
    const currentUserId = localStorage.getItem('userId');
    const currentUserRole = localStorage.getItem('role');
    
    console.log('Attempting to delete user:', id);
    console.log('Current user ID:', currentUserId);
    console.log('Current user role:', currentUserRole);
    
    if (id == currentUserId) {
      alert('❌ You cannot delete your own account!');
      return;
    }
    
    if (!confirm('Delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete response:', response.data);
      
      if (response.data.success) {
        alert('✅ User deleted successfully!');
        fetchUsers();
      } else {
        alert('❌ ' + (response.data.message || 'Cannot delete this user'));
      }
    } catch(err) {
      console.error('Delete error details:', err);
      console.error('Error response:', err.response);
      alert('❌ ' + (err.response?.data?.message || 'Error deleting user'));
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getRoleMsg = () => {
    if (userRole === 'SUPER_ADMIN') return '👑 SUPER ADMIN: You can create ADMIN users and change any role';
    if (userRole === 'ADMIN') return '📋 ADMIN: You can create UNIT MANAGER users and change them to USER or back';
    if (userRole === 'UNIT_MANAGER') return '👥 UNIT MANAGER: You can create USER accounts';
    if (userRole === 'USER') return '👤 USER: You can only create invoices';
    return 'Role: ' + userRole;
  };

  const getAvailableRoles = () => {
    if (userRole === 'SUPER_ADMIN') return [{ value: 'ADMIN', label: 'ADMIN' }];
    if (userRole === 'ADMIN') return [{ value: 'UNIT_MANAGER', label: 'UNIT MANAGER' }];
    if (userRole === 'UNIT_MANAGER') return [{ value: 'USER', label: 'USER' }];
    return [];
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'SUPER_ADMIN': return '#e74c3c';
      case 'ADMIN': return '#e67e22';
      case 'UNIT_MANAGER': return '#3498db';
      case 'USER': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'white' }}>📊 Company Management System</h2>
        <div>
          <span style={{ marginRight: 15, background: '#3498db', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>{userRole}</span>
          <button onClick={logout} style={{ padding: '5px 15px', cursor: 'pointer', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px' }}>Logout</button>
        </div>
      </div>
      
      {/* Role Message */}
      <div style={{ background: '#ecf0f1', padding: '10px 20px', borderLeft: `4px solid ${getRoleBadgeColor(userRole)}` }}>
        <p style={{ margin: 0 }}>{getRoleMsg()}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ddd', background: '#ecf0f1' }}>
        <button onClick={() => setActiveTab('invoices')} style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'invoices' ? '#3498db' : 'transparent', color: activeTab === 'invoices' ? 'white' : 'black', border: 'none', fontWeight: 'bold' }}>📄 Invoices</button>
        {userRole !== 'USER' && <button onClick={() => setActiveTab('users')} style={{ padding: '10px 20px', cursor: 'pointer', background: activeTab === 'users' ? '#3498db' : 'transparent', color: activeTab === 'users' ? 'white' : 'black', border: 'none', fontWeight: 'bold' }}>👥 Users</button>}
      </div>

      <div style={{ padding: 20 }}>
        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <>
            {/* Search Bar */}
            <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', background: '#f8f9fa', padding: 15, borderRadius: 5 }}>
              <input 
                type="text" 
                placeholder="🔍 Search invoice number" 
                value={searchFilter} 
                onChange={(e) => setSearchFilter(e.target.value)} 
                style={{ padding: 8, flex: 1, border: '1px solid #ddd', borderRadius: 4 }} 
              />
            
              <button onClick={() => setShowInvoiceForm(true)} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ New Invoice</button>
            </div>

            {/* Create Invoice Form */}
            {showInvoiceForm && (
              <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20, borderRadius: 5 }}>
                <h3>Create New Invoice</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input placeholder="Invoice Number" value={newInvoice.number} onChange={(e) => setNewInvoice({...newInvoice, number: e.target.value})} style={{ padding: 8, flex: 1, border: '1px solid #ddd', borderRadius: 4 }} />
                  <input type="date" value={newInvoice.date} onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                  <input placeholder="Amount (₹)" type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} style={{ padding: 8, width: 120, border: '1px solid #ddd', borderRadius: 4 }} />
                  <button onClick={createInvoice} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setShowInvoiceForm(false)} style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Edit Invoice Form */}
            {editingInvoice && (
              <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20, borderRadius: 5 }}>
                <h3>Edit Invoice</h3>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input value={editingInvoice.invoice_number} onChange={(e) => setEditingInvoice({...editingInvoice, invoice_number: e.target.value})} style={{ padding: 8, flex: 1, border: '1px solid #ddd', borderRadius: 4 }} />
                  <input 
                    type="date" 
                    value={editingInvoice.invoice_date ? (typeof editingInvoice.invoice_date === 'string' ? editingInvoice.invoice_date.split('T')[0] : editingInvoice.invoice_date) : ''} 
                    onChange={(e) => setEditingInvoice({...editingInvoice, invoice_date: e.target.value})} 
                    style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4 }} 
                  />
                  <input value={editingInvoice.invoice_amount} onChange={(e) => setEditingInvoice({...editingInvoice, invoice_amount: e.target.value})} style={{ padding: 8, width: 120, border: '1px solid #ddd', borderRadius: 4 }} />
                  <button onClick={updateInvoice} style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Update</button>
                  <button onClick={() => setEditingInvoice(null)} style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Invoices Table */}
          {/* Invoices Table */}
<table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead style={{ background: '#34495e', color: 'white' }}>
    <tr>
      <th>Invoice #</th>
      <th>Date</th>
      <th>Amount</th>
      <th>Financial Year</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
    {invoices.length > 0 ? (
      invoices.map(inv => (
        <tr key={inv.id}>
          <td>{inv.invoice_number}</td>

          <td>
            {typeof inv.invoice_date === 'string'
              ? inv.invoice_date.split('T')[0]
              : new Date(inv.invoice_date).toLocaleDateString('en-CA')}
          </td>

          <td>₹{parseFloat(inv.invoice_amount).toFixed(2)}</td>

          <td>{inv.financial_year}</td>

          <td>
            <button
              onClick={() => setEditingInvoice(inv)}
              style={{
                marginRight: 5,
                padding: '4px 8px',
                cursor: 'pointer'
              }}
            >
              Edit
            </button>

            <button
              onClick={() => deleteInvoice(inv.id)}
              style={{
                padding: '4px 8px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>
          📭 No invoices found
        </td>
      </tr>
    )}
  </tbody>
</table>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <button onClick={() => setShowUserForm(true)} style={{ marginBottom: 20, padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+ New User</button>

            {showUserForm && (
              <div style={{ border: '1px solid #ddd', padding: 20, marginBottom: 20, borderRadius: 5 }}>
                <h3>Create New User</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} style={{ padding: 8, flex: 1, border: '1px solid #ddd', borderRadius: 4 }} />
                  <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} style={{ padding: 8, flex: 1, border: '1px solid #ddd', borderRadius: 4 }} />
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} style={{ padding: 8, width: 150, border: '1px solid #ddd', borderRadius: 4 }}>
                    <option value="">Select Role</option>
                    {getAvailableRoles().map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                  <input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} style={{ padding: 8, width: 120, border: '1px solid #ddd', borderRadius: 4 }} />
                  <button onClick={createUser} style={{ padding: '8px 16px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Create</button>
                  <button onClick={() => setShowUserForm(false)} style={{ padding: '8px 16px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#34495e', color: 'white' }}>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Change Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ backgroundColor: user.id == localStorage.getItem('userId') ? '#f0f8ff' : 'white' }}>
                    <td>{user.user_id}</td>
                    <td>
                      {user.username}
                      {user.id == localStorage.getItem('userId') && <span style={{ marginLeft: '8px', fontSize: '11px', background: '#3498db', color: 'white', padding: '2px 6px', borderRadius: '10px' }}>YOU</span>}
                    </td>
                    <td>{user.email}</td>
                    <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: getRoleBadgeColor(user.role), color: 'white', fontSize: '12px' }}>{user.role}</span></td>
                    <td>
                      {user.id != localStorage.getItem('userId') && user.role !== 'SUPER_ADMIN' ? (
                        <select 
                          onChange={(e) => updateRole(user.id, e.target.value, user.role)} 
                          style={{ padding: '8px 12px', borderRadius: '4px', width: '160px', border: '1px solid #3498db', cursor: 'pointer' }}
                          defaultValue=""
                        >
                          <option value="" disabled>Change to:</option>
                          {localStorage.getItem('role') === 'SUPER_ADMIN' && (
                            <>
                              <option value="ADMIN">ADMIN</option>
                              <option value="UNIT_MANAGER">UNIT MANAGER</option>
                              <option value="USER">USER</option>
                            </>
                          )}
                          {localStorage.getItem('role') === 'ADMIN' && (
                            <>
                              <option value="UNIT_MANAGER">UNIT MANAGER</option>
                              <option value="USER">USER</option>
                            </>
                          )}
                          {localStorage.getItem('role') === 'UNIT_MANAGER' && user.role === 'USER' && (
                            <option value="USER">USER</option>
                          )}
                        </select>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        style={{ padding: '4px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: (user.id == localStorage.getItem('userId')) ? 0.5 : 1 }}
                        disabled={user.id == localStorage.getItem('userId')}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {users.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>👥 No users found</td>
                  </tr>
                </tbody>
              )}
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
