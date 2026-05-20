const db = require('../config/database');

// Get financial year from date (e.g., "2022-2023")
function getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 3) { // April onwards
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

// Validate invoice date logic (between previous and next invoice)
async function validateInvoiceDate(invoiceNumber, invoiceDate, financialYear) {
    // Find previous invoice number
    const [prev] = await db.execute(
        `SELECT invoice_date FROM invoices 
         WHERE financial_year = ? AND invoice_number < ? 
         ORDER BY invoice_number DESC LIMIT 1`,
        [financialYear, invoiceNumber]
    );
    
    // Find next invoice number
    const [next] = await db.execute(
        `SELECT invoice_date FROM invoices 
         WHERE financial_year = ? AND invoice_number > ? 
         ORDER BY invoice_number ASC LIMIT 1`,
        [financialYear, invoiceNumber]
    );

    const date = new Date(invoiceDate);
    
    if (prev.length > 0 && date <= new Date(prev[0].invoice_date)) {
        throw new Error(`Invoice date must be after ${prev[0].invoice_date}`);
    }
    
    if (next.length > 0 && date >= new Date(next[0].invoice_date)) {
        throw new Error(`Invoice date must be before ${next[0].invoice_date}`);
    }
    
    return true;
}

// Create Invoice
async function createInvoice(invoiceNumber, invoiceDate, invoiceAmount, createdBy) {
    const date = new Date(invoiceDate);
    const financialYear = getFinancialYear(date);
    
    // Check unique invoice number in financial year
    const [existing] = await db.execute(
        'SELECT id FROM invoices WHERE invoice_number = ? AND financial_year = ?',
        [invoiceNumber, financialYear]
    );
    if (existing.length > 0) {
        throw new Error('Invoice number already exists in this financial year');
    }
    
    // Validate date logic
    await validateInvoiceDate(invoiceNumber, invoiceDate, financialYear);
    
    const [result] = await db.execute(
        `INSERT INTO invoices (invoice_number, invoice_date, invoice_amount, financial_year, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceNumber, invoiceDate, invoiceAmount, financialYear, createdBy]
    );
    
    return { id: result.insertId, invoice_number: invoiceNumber, invoice_date: invoiceDate, invoice_amount: invoiceAmount };
}

// Get invoices with filters
async function getInvoices(page = 1, limit = 10, financialYear = null, startDate = null, endDate = null, search = '') {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    let params = [];
    
    if (financialYear) {
        query += ' AND financial_year = ?';
        params.push(financialYear);
    }
    
    if (startDate && endDate) {
        query += ' AND invoice_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }
    
    if (search) {
        query += ' AND invoice_number LIKE ?';
        params.push(`%${search}%`);
    }
    
    query += ' ORDER BY invoice_number ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [invoices] = await db.execute(query, params);
    return invoices;
}

module.exports = { createInvoice, getInvoices, validateInvoiceDate, getFinancialYear };