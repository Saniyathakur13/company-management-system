const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-1cebc44d-company-management-system.j.aivencloud.com',
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'company_management',
    port: process.env.DB_PORT || 23659,
    dateStrings: true,
    connectionLimit: 10,
    ssl: { rejectUnauthorized: false }
}).promise();

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Company Management System API', status: 'running' });
});

// LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login:', email);
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }
        const user = users[0];
        if (user.password_hash !== password) {
            return res.status(401).json({ message: 'Wrong password' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, 'secret');
        res.json({ token, role: user.role, userId: user.id });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// GET ALL USERS (SIMPLIFIED - NO TOKEN CHECK FOR NOW)
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, user_id, username, email, role, created_by, created_at FROM users');
        console.log('Users found:', users.length);
        res.json(users);
    } catch(err) { 
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET INVOICES
app.get('/api/invoices', async (req, res) => {
    try {
        const [invoices] = await db.query('SELECT * FROM invoices ORDER BY CAST(invoice_number AS UNSIGNED) ASC');
        res.json(invoices);
    } catch(err) { 
        res.status(500).json({ error: err.message });
    }
});

// CREATE INVOICE
app.post('/api/invoices', async (req, res) => {
    const { number, date, amount } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        const year = parseInt(date.substring(0, 4));
        const month = parseInt(date.substring(5, 7));
        const financialYear = month >= 4 ? `${year}-${year+1}` : `${year-1}-${year}`;
        
        await db.query(
            'INSERT INTO invoices (invoice_number, invoice_date, invoice_amount, financial_year, created_by) VALUES (?, ?, ?, ?, ?)',
            [number, date, amount, financialYear, decoded.id]
        );
        res.json({ success: true, message: 'Invoice created!' });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// UPDATE INVOICE
app.put('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    const { invoice_number, invoice_date, invoice_amount } = req.body;
    
    try {
        const year = parseInt(invoice_date.substring(0, 4));
        const month = parseInt(invoice_date.substring(5, 7));
        const financialYear = month >= 4 ? `${year}-${year+1}` : `${year-1}-${year}`;
        
        await db.query(
            'UPDATE invoices SET invoice_number = ?, invoice_date = ?, invoice_amount = ?, financial_year = ? WHERE id = ?',
            [invoice_number, invoice_date, invoice_amount, financialYear, id]
        );
        res.json({ success: true, message: 'Invoice updated!' });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// DELETE INVOICE
app.delete('/api/invoices/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM invoices WHERE id = ?', [id]);
        res.json({ success: true });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// CREATE USER
app.post('/api/users', async (req, res) => {
    const { username, email, role, password } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    try {
        const decoded = jwt.verify(token, 'secret');
        
        // Get next user ID
        const prefix = { 'ADMIN': 'A', 'UNIT_MANAGER': 'UM', 'USER': 'U' }[role];
        const [lastUser] = await db.query('SELECT user_id FROM users WHERE user_id LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
        let newNum = 1;
        if (lastUser.length > 0) {
            const match = lastUser[0].user_id.match(/\d+/);
            if (match) newNum = parseInt(match[0]) + 1;
        }
        const userId = `${prefix}${newNum}`;
        
        await db.query(
            'INSERT INTO users (user_id, username, email, role, password_hash, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, email, role, password, decoded.id]
        );
        res.json({ success: true, message: 'User created!', user_id: userId });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// UPDATE USER ROLE
app.put('/api/users/:id/role', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// DELETE USER
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch(err) { 
        res.status(500).json({ message: err.message });
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('✅ Database connected');
});
