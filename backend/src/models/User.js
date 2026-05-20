const db = require('../config/database');

// Generate unique User ID based on role
function generateUserId(role, lastId) {
    const prefix = {
        'SUPER_ADMIN': 'SA',
        'ADMIN': 'A',
        'UNIT_MANAGER': 'UM',
        'USER': 'U'
    }[role];
    return `${prefix}${lastId + 1}`;
}

// Create User
async function createUser(username, email, role, password, createdBy = null) {
    // Check if email exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new Error('Email already exists');

    // Get last user ID for this role
    const [lastUser] = await db.execute(
        "SELECT id FROM users WHERE role = ? ORDER BY id DESC LIMIT 1",
        [role]
    );
    const lastId = lastUser.length > 0 ? lastUser[0].id : 0;
    const userId = generateUserId(role, lastId);

    // Hash password (in real app, use bcrypt)
    const hashedPassword = password; // You'll add bcrypt later

    const [result] = await db.execute(
        `INSERT INTO users (user_id, username, email, role, password_hash, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, username, email, role, hashedPassword, createdBy]
    );
    
    return { id: result.insertId, user_id: userId, username, email, role };
}

// Get users with pagination and role-based visibility
async function getUsers(requesterId, requesterRole, page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let query = '';
    let params = [];

    if (requesterRole === 'SUPER_ADMIN') {
        query = `SELECT * FROM users WHERE role != 'SUPER_ADMIN'`;
    } else if (requesterRole === 'ADMIN') {
        // Get all users created by this admin AND users from admin's groups
        query = `
            SELECT DISTINCT u.* FROM users u
            LEFT JOIN group_members gm ON u.id = gm.user_id
            LEFT JOIN groups g ON gm.group_id = g.id
            WHERE u.created_by = ? 
            OR (g.group_type = 'ADMIN' AND g.id IN (
                SELECT group_id FROM group_members WHERE user_id = ?
            ))
        `;
        params = [requesterId, requesterId];
    } else if (requesterRole === 'UNIT_MANAGER') {
        query = `
            SELECT DISTINCT u.* FROM users u
            LEFT JOIN group_members gm ON u.id = gm.user_id
            LEFT JOIN groups g ON gm.group_id = g.id
            WHERE u.created_by = ?
            OR (g.group_type = 'UNIT_MANAGER' AND g.id IN (
                SELECT group_id FROM group_members WHERE user_id = ?
            ))
        `;
        params = [requesterId, requesterId];
    }

    if (search) {
        query += ` AND (username LIKE ? OR email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users] = await db.execute(query, params);
    return users;
}

module.exports = { createUser, getUsers };