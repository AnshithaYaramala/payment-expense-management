const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  // Wallet
  getDashboardData: async () => {
    const res = await fetch(`${API_BASE}/reports/dashboard`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard data');
    return res.json();
  },

  topUpWallet: async (amount, payment_method) => {
    const res = await fetch(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, payment_method })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Top up failed');
    return data;
  },

  transferMoney: async (recipient, amount, note) => {
    const res = await fetch(`${API_BASE}/wallet/transfer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipient, amount, note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Transfer failed');
    return data;
  },

  // Transactions
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  addExpense: async (title, category, amount) => {
    const res = await fetch(`${API_BASE}/transactions/expense`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, category, amount })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');
    return data;
  },

  // Subscriptions & Recipients
  getSubscriptions: async () => {
    const res = await fetch(`${API_BASE}/subscriptions`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch subscriptions');
    return res.json();
  },

  getRecipients: async () => {
    const res = await fetch(`${API_BASE}/users/recipients`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch recipients');
    return res.json();
  }
};
