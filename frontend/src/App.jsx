import React, { useState, useEffect, useRef } from 'react';
import { api } from './services/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: 'athena@example.com', password: 'password123' });
  const [authError, setAuthError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [transferData, setTransferData] = useState({ recipient: '', amount: '', note: '' });
  const [topUpData, setTopUpData] = useState({ amount: '50', method: 'Credit Card' });
  const [expenseData, setExpenseData] = useState({ title: '', amount: '', category: 'Food' });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (token) {
      loadProfileAndData();
    }
  }, [token]);

  const loadProfileAndData = async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile.user);
      const [sum, txns, subs, recs] = await Promise.all([
        api.getDashboardData(),
        api.getTransactions({ limit: 20 }),
        api.getSubscriptions(),
        api.getRecipients()
      ]);
      setSummary(sum);
      setTransactions(txns.transactions || []);
      setSubscriptions(subs.subscriptions || []);
      setRecipients(recs.recipients || []);
    } catch (err) {
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.login(authForm.email, authForm.password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await api.register(authForm.name, authForm.email, authForm.password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      showToast('Account registered! $500 bonus added.');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.transferMoney(transferData.recipient, parseFloat(transferData.amount), transferData.note);
      showToast(res.message);
      setShowTransferModal(false);
      setTransferData({ recipient: '', amount: '', note: '' });
      loadProfileAndData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.topUpWallet(parseFloat(topUpData.amount), topUpData.method);
      showToast(res.message);
      setShowTopUpModal(false);
      loadProfileAndData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addExpense(expenseData.title, expenseData.category, parseFloat(expenseData.amount));
      showToast(res.message);
      setShowExpenseModal(false);
      setExpenseData({ title: '', amount: '', category: 'Food' });
      loadProfileAndData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
              P
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">PayFlow</h1>
              <p className="text-xs text-slate-500">Payment & Expense Management</p>
            </div>
          </div>

          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setAuthView('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${authView === 'login' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition ${authView === 'register' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {authError}
            </div>
          )}

          {authView === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="athena@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                💡 <strong>Demo Credentials:</strong><br />
                Email: <code className="font-mono font-bold">athena@example.com</code><br />
                Password: <code className="font-mono font-bold">password123</code>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-200 transition"
              >
                Sign In to PayFlow
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Athena Lee"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="athena@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-indigo-200 transition"
              >
                Register & Claim $500 Bonus
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const filteredTxns = transactions.filter(t => {
    const matchCategory = filterCategory === 'all' || t.category.toLowerCase() === filterCategory.toLowerCase();
    const matchSearch = (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (t.reference_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl space-x-2 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between py-6 px-4">
        <div>
          <div className="flex items-center space-x-3 px-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200">
              P
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">PayFlow</span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Fintech Core</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'transactions', label: 'Transactions', icon: '💳' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'cards', label: 'My Cards', icon: '🏷️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{user.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg">
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto max-h-screen p-6 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Good Afternoon, {user.name}! 👋</h1>
            <p className="text-xs text-slate-500">Track your workflow and stay in control of your budget.</p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs w-48 shadow-sm"
            />
            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"
            >
              + Add Transaction
            </button>
          </div>
        </header>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Total Balance</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">+5.2%</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              ${(summary?.total_balance ?? 3420.55).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Monthly Income</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">+12%</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              ${(summary?.monthly_income ?? 820.00).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Monthly Expense</span>
              <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full font-bold">-2%</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              ${(summary?.monthly_expense ?? 470.30).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between text-slate-400 text-xs font-semibold mb-2">
              <span>Savings</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">+5.0%</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
              ${(summary?.savings ?? 320.00).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Virtual Card & Subscriptions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Balance Cashflow</h4>
            <div className="text-2xl font-extrabold text-slate-900 mb-4">$4,310.20</div>
            <p className="text-xs text-slate-400">Cashflow visual trends active across accounts.</p>
          </div>

          <div className="space-y-6">
            <div className="card-gradient rounded-2xl p-5 text-white shadow-xl">
              <div className="flex justify-between text-xs mb-4">
                <span className="uppercase text-[10px] text-indigo-200 font-bold">Virtual Platinum</span>
                <span className="font-bold">Primary Bank</span>
              </div>
              <div className="text-lg font-mono tracking-widest font-semibold mb-4">
                {summary?.card?.number || '2216 1245 9814 3892'}
              </div>
              <div className="flex justify-between text-xs">
                <span>{user.name.toUpperCase()}</span>
                <span>{summary?.card?.expiry || '09/29'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-lg"
                >
                  + Top Up
                </button>
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="py-1.5 bg-indigo-900/40 text-white text-xs font-bold rounded-lg"
                >
                  Transfer ➔
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-900 uppercase mb-3">Next Payments</h4>
              <div className="space-y-2">
                {subscriptions.map((sub, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                    <span className="font-bold text-slate-800">{sub.service_name}</span>
                    <span className="font-bold text-slate-900">${parseFloat(sub.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-bold text-slate-900">Transaction History</h4>
            <div className="flex space-x-2">
              {['all', 'Income', 'Housing', 'Shopping', 'Food'].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                    filterCategory.toLowerCase() === c.toLowerCase() ? 'bg-indigo-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                <th className="pb-3">Details</th>
                <th className="pb-3">Reference</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxns.map((t, idx) => {
                const isCredit = t.type === 'TOPUP' || t.type === 'TRANSFER_IN';
                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-800">{t.description || t.category}</td>
                    <td className="py-3 font-mono text-slate-500">{t.reference_id}</td>
                    <td className="py-3"><span className="px-2 py-0.5 bg-slate-100 rounded text-[10px]">{t.category}</span></td>
                    <td className="py-3 text-slate-500">{t.created_at}</td>
                    <td className={`py-3 text-right font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isCredit ? `+$${parseFloat(t.amount).toFixed(2)}` : `-$${parseFloat(t.amount).toFixed(2)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Transfer Money</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Recipient Email or Account #"
                value={transferData.recipient}
                onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Amount ($)"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
              />
              <input
                type="text"
                placeholder="Note (Optional)"
                value={transferData.note}
                onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Send</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Top Up Wallet</h3>
            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="Amount ($)"
                value={topUpData.amount}
                onChange={(e) => setTopUpData({ ...topUpData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
              />
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowTopUpModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Title (e.g. Grocery, Lunch)"
                value={expenseData.title}
                onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Amount ($)"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
              />
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
