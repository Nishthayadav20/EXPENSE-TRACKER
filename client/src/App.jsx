import { useState, useEffect } from 'react'
import './App.css'

const API_URL = '/api/expenses';

const CATEGORY_MAP = {
  food: '🍔 Food',
  travel: '✈️ Travel',
  bills: '🧾 Bills',
  shopping: '🛍️ Shopping',
  other: '📦 Other'
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = categoryFilter === 'all' ? API_URL : `${API_URL}?category=${categoryFilter}`;
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(url),
        fetch(`${API_URL}/summary`)
      ]);
      
      if (!expensesRes.ok || !summaryRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const expensesData = await expensesRes.json();
      const summaryData = await summaryRes.json();
      
      setExpenses(expensesData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [categoryFilter]);

  const handleAddExpense = async (expense) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add expense');
      }
      
      fetchData();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete expense');
      }
      
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <Navbar />
      <div className="app-container">
        
        <div className="dashboard">
          <div className="dashboard-sidebar">
          <ExpenseForm onAdd={handleAddExpense} />
        </div>
        
        <div className="dashboard-main">
          <ExpenseSummary summary={summary} />
          
          <div className="card">
            <div className="filter-bar">
              <h2>Recent Expenses</h2>
              <select 
                className="form-control" 
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">🌟 All Categories</option>
                <option value="food">{CATEGORY_MAP.food}</option>
                <option value="travel">{CATEGORY_MAP.travel}</option>
                <option value="bills">{CATEGORY_MAP.bills}</option>
                <option value="shopping">{CATEGORY_MAP.shopping}</option>
                <option value="other">{CATEGORY_MAP.other}</option>
              </select>
            </div>
            
            {loading ? (
              <div className="loading">Loading expenses...</div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : expenses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🍃</div>
                <h3>All caught up!</h3>
                <p>You haven't recorded any expenses yet. Add one to get started.</p>
              </div>
            ) : (
              <div className="expense-list">
                {expenses.map(expense => (
                  <ExpenseItem 
                    key={expense._id} 
                    expense={expense} 
                    onDelete={handleDeleteExpense} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">Expense Tracker Pro</div>
      <div className="navbar-links">
        <a href="#">Dashboard</a>
        <a href="#">Analytics</a>
        <a href="#">Settings</a>
      </div>
    </nav>
  );
}

function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (title.length < 2) {
      return setError('Title must be at least 2 characters');
    }
    if (Number(amount) <= 0) {
      return setError('Amount must be greater than 0');
    }
    
    const res = await onAdd({ title, amount: Number(amount), category });
    if (res.success) {
      setTitle('');
      setAmount('');
      setCategory('food');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="card">
      <h2>Add Expense</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input 
            type="text" 
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Groceries"
          />
        </div>
        <div className="form-group">
          <label>Amount (₹)</label>
          <input 
            type="number" 
            step="0.01"
            className="form-control"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select 
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="food">{CATEGORY_MAP.food}</option>
            <option value="travel">{CATEGORY_MAP.travel}</option>
            <option value="bills">{CATEGORY_MAP.bills}</option>
            <option value="shopping">{CATEGORY_MAP.shopping}</option>
            <option value="other">{CATEGORY_MAP.other}</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Add Expense</button>
      </form>
    </div>
  );
}

function ExpenseItem({ expense, onDelete }) {
  const date = new Date(expense.createdAt).toLocaleDateString();
  const catText = CATEGORY_MAP[expense.category] || expense.category;
  const emoji = catText.split(' ')[0] || '📦';
  const label = catText.substring(catText.indexOf(' ') + 1) || catText;
  
  return (
    <div className="expense-item">
      <div className="expense-info">
        <div className="expense-icon-circle">{emoji}</div>
        <div className="expense-details">
          <h3>{expense.title}</h3>
          <div className="expense-meta">
            <span className="expense-category">{label}</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
      <div className="expense-actions">
        <div className="expense-amount-wrap">
          <div className="expense-amount">₹{expense.amount.toFixed(2)}</div>
        </div>
        <button 
          className="btn-danger-minimal"
          onClick={() => onDelete(expense._id)}
          title="Delete Expense"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function ExpenseSummary({ summary }) {
  const grandTotal = summary.reduce((acc, curr) => acc + curr.total, 0);
  
  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2>Summary</h2>
      <div className="summary-grid">
        <div className="summary-card total">
          <p>Grand Total</p>
          <h4>₹{grandTotal.toFixed(2)}</h4>
        </div>
        {summary.map(item => (
          <div key={item.category} className="summary-card">
            <p>{CATEGORY_MAP[item.category] || item.category}</p>
            <h4>₹{item.total.toFixed(2)}</h4>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
