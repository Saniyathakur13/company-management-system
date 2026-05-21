
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_management',
    port: process.env.DB_PORT || 3306,
    dateStrings: true,
    waitForConnections: true,
    connectionLimit: 10,
    ssl: {
        rejectUnauthorized: false
    }
}).promise();

// ... rest of your code

// Helper function - keep date exactly as received
function cleanDate(date) {
    if (!date) return '';
    // Date is already in YYYY-MM-DD format from frontend
    // Just return it as is, no conversion
    return date;
}
// ============ LOGIN ============
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email, password);
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const user = users[0];
        
        if (user.password_hash !== password) {
            return res.json({ success: false, message: 'Wrong password' });
        }
        
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, 'secret');
        
        // MUST return success: true
        res.json({ 
            success: true,  // THIS IS IMPORTANT
            token, 
            role: user.role, 
            userId: user.id 
        });
    } catch(err) { 
        res.json({ success: false, message: err.message }); 
    }
});
// ============ INVOICES ============
app.get('/api/invoices', async (req, res) => {
    try {
        // Force MySQL to return date as STRING, not DATE object
        const [invoices] = await db.query(`
            SELECT 
                id, 
                invoice_number, 
                DATE_FORMAT(invoice_date, '%Y-%m-%d') as invoice_date,
                invoice_amount, 
                financial_year, 
                created_by, 
                created_at 
            FROM invoices 
            ORDER BY CAST(invoice_number AS UNSIGNED) ASC
        `);
        
        console.log('First invoice date from DB:', invoices[0]?.invoice_date);
        res.json(invoices);
    } catch(err) { 
        console.error(err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/invoices', async (req, res) => {
    const { number, date, amount } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        
        // Use date exactly as received - NO CONVERSION
        const invoiceDate = date;
        
        // Extract year and month directly from string
        const year = parseInt(invoiceDate.substring(0, 4));
        const month = parseInt(invoiceDate.substring(5, 7));
        const financialYear = month >= 4 ? `${year}-${year+1}` : `${year-1}-${year}`;
        
        const [existing] = await db.query(
            'SELECT * FROM invoices WHERE invoice_number = ? AND financial_year = ?', 
            [number, financialYear]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Invoice number already exists' });
        }
        
        // Store date exactly as received
        await db.query(
            'INSERT INTO invoices (invoice_number, invoice_date, invoice_amount, financial_year, created_by) VALUES (?, ?, ?, ?, ?)',
            [number, invoiceDate, amount, financialYear, decoded.id]
        );
        
        res.json({ success: true, message: 'Invoice created!' });
    } catch(err) { 
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});

app.put('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const { invoice_number, invoice_date, invoice_amount } = req.body;
    
    console.log('PUT - Received date:', invoice_date);
    
    if (!invoice_number || !invoice_date || !invoice_amount) {
        return res.status(400).json({ message: 'All fields required' });
    }
    
    try {
        // Use date exactly as received - NO CONVERSION
        const invoiceDate = invoice_date;
        
        // Extract year and month from string
        const year = parseInt(invoiceDate.substring(0, 4));
        const month = parseInt(invoiceDate.substring(5, 7));
        const financialYear = month >= 4 ? `${year}-${year+1}` : `${year-1}-${year}`;
        
        // Direct UPDATE - let MySQL store the date as is
        await db.query(
            'UPDATE invoices SET invoice_number = ?, invoice_date = ?, invoice_amount = ?, financial_year = ? WHERE id = ?',
            [invoice_number, invoiceDate, invoice_amount, financialYear, id]
        );
        
        // Verify what was stored
        const [verify] = await db.query('SELECT invoice_date FROM invoices WHERE id = ?', [id]);
        console.log('Stored date in DB:', verify[0]?.invoice_date);
        
        res.json({ success: true, message: 'Invoice updated!' });
    } catch(err) { 
        console.error('Update error:', err);
        res.status(500).json({ message: err.message }); 
    }
});

app.delete('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        await db.query('DELETE FROM invoices WHERE id = ?', [id]);
        res.json({ success: true, message: 'Invoice deleted' });
    } catch(err) { 
        res.status(500).json({ message: err.message }); 
    }
});
// ============ USERS ============
app.get('/api/users', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        console.log('=== GET USERS ===');
        console.log('Logged in as:', decoded.role, 'ID:', decoded.id);
        
        let query = '';
        
        if (decoded.role === 'SUPER_ADMIN') {
            query = 'SELECT id, user_id, username, email, role, created_by, created_at FROM users WHERE role != "SUPER_ADMIN" ORDER BY id DESC';
        } 
        else if (decoded.role === 'ADMIN') {
            query = 'SELECT id, user_id, username, email, role, created_by, created_at FROM users WHERE role = "UNIT_MANAGER" OR role = "USER" ORDER BY id DESC';
        } 
        else if (decoded.role === 'UNIT_MANAGER') {
            // UNIT MANAGER SEES ALL USERS
            query = 'SELECT id, user_id, username, email, role, created_by, created_at FROM users WHERE role = "USER" ORDER BY id DESC';
        } 
        else {
            query = 'SELECT id, user_id, username, email, role, created_by, created_at FROM users WHERE 1=0';
        }
        
        const [users] = await db.query(query);
        console.log('Users found:', users.length);
        res.json(users);
    } catch(err) { 
        console.error('GET users error:', err);
        res.status(500).json({ error: err.message }); 
    }
});

app.post('/api/users', async (req, res) => {
    const { username, email, role, password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        
        // Role creation restrictions
        if (decoded.role === 'SUPER_ADMIN' && role !== 'ADMIN') {
            return res.status(403).json({ message: 'Super Admin can only create ADMIN users' });
        }
        if (decoded.role === 'ADMIN' && role !== 'UNIT_MANAGER') {
            return res.status(403).json({ message: 'Admin can only create UNIT MANAGER users' });
        }
        if (decoded.role === 'UNIT_MANAGER' && role !== 'USER') {
            return res.status(403).json({ message: 'Unit Manager can only create USER users' });
        }
        
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        
        // Generate sequential user ID based on role
        let userId;
        
        if (role === 'ADMIN') {
            // Get all ADMIN numbers (A1, A2, A3...)
            const [rows] = await db.query(`SELECT user_id FROM users WHERE role = 'ADMIN' AND user_id REGEXP '^A[0-9]+$'`);
            let numbers = rows.map(row => parseInt(row.user_id.substring(1)));
            numbers.sort((a, b) => a - b);
            
            let newNum = 1;
            while (numbers.includes(newNum)) newNum++;
            userId = `A${newNum}`;
        }
        else if (role === 'UNIT_MANAGER') {
            // Get all UNIT_MANAGER numbers (UM1, UM2, UM3...)
            const [rows] = await db.query(`SELECT user_id FROM users WHERE role = 'UNIT_MANAGER' AND user_id REGEXP '^UM[0-9]+$'`);
            let numbers = rows.map(row => parseInt(row.user_id.substring(2)));
            numbers.sort((a, b) => a - b);
            
            let newNum = 1;
            while (numbers.includes(newNum)) newNum++;
            userId = `UM${newNum}`;
        }
        else {
            // role === 'USER' - Get only USER numbers (U1, U2, U3... not UM1)
            const [rows] = await db.query(`SELECT user_id FROM users WHERE role = 'USER' AND user_id REGEXP '^U[0-9]+$'`);
            let numbers = rows.map(row => parseInt(row.user_id.substring(1)));
            numbers.sort((a, b) => a - b);
            
            console.log('Existing USER numbers:', numbers);
            
            let newNum = 1;
            while (numbers.includes(newNum)) newNum++;
            userId = `U${newNum}`;
        }
        
        console.log('Creating new user with role:', role, 'ID:', userId);
        
        await db.query(
            'INSERT INTO users (user_id, username, email, role, password_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, email, role, password, decoded.id]
        );
        
        res.json({ success: true, message: 'User created!', user_id: userId });
    } catch(err) { 
        console.error(err);
        res.status(500).json({ message: err.message }); 
    }
});
app.put('/api/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        const [user] = await db.query('SELECT role, created_by FROM users WHERE id = ?', [id]);
        if (user.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const currentRole = user[0].role;
        
        // SUPER ADMIN can change any role
        if (decoded.role === 'SUPER_ADMIN') {
            await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
            return res.json({ success: true, message: `Role changed from ${currentRole} to ${role}` });
        }
        
        // ADMIN can change UNIT_MANAGER to USER OR USER back to UNIT_MANAGER
        if (decoded.role === 'ADMIN') {
            if (currentRole === 'UNIT_MANAGER' || currentRole === 'USER') {
                await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
                return res.json({ success: true, message: `Role changed from ${currentRole} to ${role}` });
            }
            return res.status(403).json({ message: 'Admin can only change UNIT MANAGER or USER roles' });
        }
        
        // UNIT_MANAGER can only change USERS they created
        if (decoded.role === 'UNIT_MANAGER') {
            if (currentRole === 'USER' && user[0].created_by === decoded.id && role === 'USER') {
                await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
                return res.json({ success: true, message: `Role updated` });
            }
            return res.status(403).json({ message: 'Cannot change this user' });
        }
        
        res.status(403).json({ message: 'Not authorized' });
    } catch(err) { 
        res.status(500).json({ message: err.message }); 
    }
});

app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    console.log('DELETE request for user:', id);
    console.log('Token:', token);
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(token, 'secret');
        console.log('Decoded token:', decoded);
        
        const currentUserId = decoded.id;
        const currentUserRole = decoded.role;
        
        // Cannot delete yourself
        if (parseInt(id) === currentUserId) {
            return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
        }
        
        // Get user to delete
        const [userToDelete] = await db.query('SELECT role, created_by FROM users WHERE id = ?', [id]);
        if (userToDelete.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const targetRole = userToDelete[0].role;
        console.log('Target user role:', targetRole);
        console.log('Current user role:', currentUserRole);
        
        // ALLOW DELETION BASED ON ROLE
        let canDelete = false;
        
        if (currentUserRole === 'SUPER_ADMIN') {
            // Super Admin can delete anyone except SUPER_ADMIN
            canDelete = targetRole !== 'SUPER_ADMIN';
        } 
        else if (currentUserRole === 'ADMIN') {
            // Admin can delete UNIT_MANAGER users
            canDelete = targetRole === 'UNIT_MANAGER';
        }
        else if (currentUserRole === 'UNIT_MANAGER') {
            // Unit Manager can delete USERS they created
            canDelete = (targetRole === 'USER' && userToDelete[0].created_by === currentUserId);
        }
        
        console.log('Can delete:', canDelete);
        
        if (canDelete) {
            await db.query('DELETE FROM users WHERE id = ?', [id]);
            return res.json({ success: true, message: 'User deleted successfully' });
        } else {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this user' });
        }
        
    } catch(err) { 
        console.error('Delete user error:', err);
        res.status(500).json({ success: false, message: err.message }); 
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server on http://localhost:${PORT}`);
    console.log('\n✅ LOGINS (Password: admin123):');
    console.log('   super@admin.com  - SUPER_ADMIN');
    console.log('   admin@test.com   - ADMIN');
    console.log('   manager1@test.com - UNIT_MANAGER');
    console.log('   user1@test.com   - USER\n');
});
