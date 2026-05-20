import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './Navbar';

function InvoiceDashboard() {
    const [invoices, setInvoices] = useState([]);
    const [financialYear, setFinancialYear] = useState('');
    const [search, setSearch] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newInvoice, setNewInvoice] = useState({ number: '', date: '', amount: '' });

    const fetchInvoices = async () => {
        const token = localStorage.getItem('token');
        const params = {};
        if (financialYear) params.financialYear = financialYear;
        if (search) params.search = search;
        
        const response = await axios.get('http://localhost:5000/api/invoices', {
            params,
            headers: { Authorization: `Bearer ${token}` }
        });
        setInvoices(response.data);
    };

    useEffect(() => {
        fetchInvoices();
    }, [financialYear, search]);

    const createInvoice = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:5000/api/invoices', newInvoice, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Invoice created!');
            setShowCreateForm(false);
            fetchInvoices();
        } catch (error) {
            alert(error.response?.data?.message);
        }
    };

    return (
        <div>
            <Navbar />
            <div style={{ padding: 20 }}>
                <h2>Invoice Dashboard</h2>
                
                <div style={{ marginBottom: 20 }}>
                    <input type="text" placeholder="Search by invoice number" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <input type="text" placeholder="Financial Year (e.g., 2022-2023)" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} />
                    <button onClick={() => setShowCreateForm(true)}>Create Invoice</button>
                </div>

                {showCreateForm && (
                    <div style={{ border: '1px solid #ccc', padding: 20, marginBottom: 20 }}>
                        <h3>New Invoice</h3>
                        <input placeholder="Invoice Number" value={newInvoice.number} onChange={(e) => setNewInvoice({...newInvoice, number: e.target.value})} />
                        <input type="date" value={newInvoice.date} onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})} />
                        <input type="number" placeholder="Amount" value={newInvoice.amount} onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})} />
                        <button onClick={createInvoice}>Save</button>
                        <button onClick={() => setShowCreateForm(false)}>Cancel</button>
                    </div>
                )}

                <table border="1" cellPadding="10" style={{ width: '100%' }}>
                    <thead>
                        <tr><th>Invoice Number</th><th>Date</th><th>Amount</th><th>Financial Year</th></tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id}>
                                <td>{inv.invoice_number}</td>
                                <td>{inv.invoice_date}</td>
                                <td>${inv.invoice_amount}</td>
                                <td>{inv.financial_year}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InvoiceDashboard;