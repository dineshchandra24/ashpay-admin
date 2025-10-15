import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, User, Wallet, Clock, TrendingUp, RefreshCw, AlertCircle, Eye, EyeOff, LogOut, Edit2, Save, X, Users, Gift, CreditCard, Calendar } from 'lucide-react';

const AshPayAdmin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [searchId, setSearchId] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processingDeposit, setProcessingDeposit] = useState(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  const API_BASE = 'https://ashpay-backend.onrender.com/api';
  const ADMIN_PASSWORD = 'Dcmishra@5474'; // Change this to your secure password

  useEffect(() => {
    const savedLogin = sessionStorage.getItem('ashpay_admin_logged_in');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      sessionStorage.setItem('ashpay_admin_logged_in', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('ashpay_admin_logged_in');
    setAdminPassword('');
    setUserData(null);
    setSearchId('');
  };

  const searchUser = async () => {
    if (!searchId.trim()) {
      setError('Please enter a user ID');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    setUserData(null);
    setEditingBalance(false);

    try {
      // Get user data directly using the user ID endpoint
      // We'll make a PUT request with empty body to trigger user fetch
      const userResponse = await fetch(`${API_BASE}/user/${searchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty update to get user data
      });

      if (!userResponse.ok) {
        throw new Error('User not found');
      }

      const userData = await userResponse.json();
      const user = userData.user;

      // Set complete user data
      setUserData({
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        balance: user.balance,
        transactions: user.transactions || [],
        pendingDeposits: user.pendingDeposits || [],
        paymentDetails: user.paymentDetails || [],
        referrals: user.referrals || [],
        referralCommission: user.referralCommission || 0,
        usedReferralCode: user.usedReferralCode || null,
        createdAt: user.createdAt || null
      });

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch user data');
      setLoading(false);
    }
  };

  const updateBalance = async () => {
    if (!newBalance || isNaN(newBalance)) {
      setError('Please enter a valid balance');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/user/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          balance: parseFloat(newBalance)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update balance');
      }

      setSuccessMessage('✅ Balance updated successfully!');
      setEditingBalance(false);
      await searchUser();
    } catch (err) {
      setError(err.message || 'Failed to update balance');
    }
  };

  const approveDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to approve this deposit?')) {
      return;
    }

    setProcessingDeposit(depositId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE}/user/${userData.id}/pending-deposit/${depositId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve deposit');
      }

      const data = await response.json();
      setSuccessMessage(`✅ Deposit approved! New balance: ₹${data.newBalance.toFixed(2)}`);

      // Refresh user data
      await searchUser();
      setProcessingDeposit(null);
    } catch (err) {
      setError(err.message || 'Failed to approve deposit');
      setProcessingDeposit(null);
    }
  };

  const rejectDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to reject this deposit? This action cannot be undone.')) {
      return;
    }

    setProcessingDeposit(depositId);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${API_BASE}/user/${userData.id}/pending-deposit/${depositId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject deposit');
      }

      setSuccessMessage('✅ Deposit rejected successfully');

      // Refresh user data
      await searchUser();
      setProcessingDeposit(null);
    } catch (err) {
      setError(err.message || 'Failed to reject deposit');
      setProcessingDeposit(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl mb-4 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">AshPay Admin</h1>
            <p className="text-gray-300">Dashboard Login</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter Admin Password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className={`w-full px-4 py-3 bg-white/10 border ${passwordError ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 pr-12`}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-shadow"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4 pb-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AshPay Admin</h1>
                <p className="text-gray-300 text-sm">Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-300 font-semibold flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Section */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">Search User</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter User ID (e.g., 123456)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400"
            />
            <button
              onClick={searchUser}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Messages */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300">{successMessage}</p>
            </div>
          )}
        </div>

        {/* User Data Display */}
        {userData && (
          <>
            {/* Balance Card */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Account Overview
                </h2>
                <button
                  onClick={searchUser}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              
              {/* User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                  <p className="text-gray-300 text-sm mb-1">User ID</p>
                  <p className="text-white text-2xl font-bold">{userData.id}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                  <p className="text-gray-300 text-sm mb-1">Name</p>
                  <p className="text-white text-xl font-bold">{userData.name}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                  <p className="text-gray-300 text-sm mb-1">Mobile</p>
                  <p className="text-white text-xl font-bold">{userData.mobile}</p>
                </div>
              </div>

              {/* Balance Section */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-300 text-sm mb-1">Current Balance</p>
                    {editingBalance ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white text-xl">₹</span>
                        <input
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(e.target.value)}
                          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-xl font-bold w-40"
                          placeholder={userData.balance.toFixed(2)}
                        />
                      </div>
                    ) : (
                      <p className="text-white text-3xl font-bold">₹{userData.balance.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editingBalance ? (
                      <>
                        <button
                          onClick={updateBalance}
                          className="px-3 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingBalance(false);
                            setNewBalance('');
                          }}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingBalance(true);
                          setNewBalance(userData.balance.toString());
                        }}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Balance
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <p className="text-gray-300 text-sm">Referrals</p>
                  </div>
                  <p className="text-white text-2xl font-bold">{userData.referrals?.length || 0}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-green-400" />
                    <p className="text-gray-300 text-sm">Referral Commission</p>
                  </div>
                  <p className="text-green-400 text-2xl font-bold">₹{userData.referralCommission?.toFixed(2) || '0.00'}</p>
                </div>
                {userData.usedReferralCode && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-blue-400" />
                      <p className="text-gray-300 text-sm">Used Referral Code</p>
                    </div>
                    <p className="text-blue-400 text-xl font-bold">{userData.usedReferralCode}</p>
                  </div>
                )}
                {userData.createdAt && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-cyan-400" />
                      <p className="text-gray-300 text-sm">Account Created</p>
                    </div>
                    <p className="text-white text-sm">{new Date(userData.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            {userData.paymentDetails && userData.paymentDetails.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  Payment Methods ({userData.paymentDetails.length})
                </h2>
                <div className="space-y-3">
                  {userData.paymentDetails.map((payment, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold">
                          {payment.type}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Added: {new Date(payment.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {payment.upiId && (
                          <div>
                            <p className="text-gray-400">UPI ID</p>
                            <p className="text-white font-semibold">{payment.upiId}</p>
                          </div>
                        )}
                        {payment.accountNumber && (
                          <>
                            <div>
                              <p className="text-gray-400">Account Number</p>
                              <p className="text-white font-semibold">{payment.accountNumber}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">IFSC Code</p>
                              <p className="text-white font-semibold">{payment.ifscCode}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Bank Name</p>
                              <p className="text-white font-semibold">{payment.bankName}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Account Holder</p>
                              <p className="text-white font-semibold">{payment.accountHolderName}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referrals List */}
            {userData.referrals && userData.referrals.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-400" />
                  Referred Users ({userData.referrals.length})
                </h2>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {userData.referrals.map((referral, index) => (
                    <div key={index} className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{referral.name}</p>
                          <p className="text-gray-400 text-sm">ID: {referral.id}</p>
                        </div>
                        <p className="text-gray-400 text-sm">
                          {new Date(referral.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Deposits */}
            {userData.pendingDeposits.length > 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-400" />
                  Pending Deposits ({userData.pendingDeposits.length})
                </h2>
                <div className="space-y-3">
                  {userData.pendingDeposits.map((deposit) => (
                    <div key={deposit.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-yellow-500/20 px-3 py-1 rounded-lg">
                              <p className="text-yellow-300 text-sm font-semibold">{deposit.network}</p>
                            </div>
                            <div className="bg-white/10 px-3 py-1 rounded-lg">
                              <p className="text-gray-300 text-sm">ID: {deposit.id}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-xs">USDT Amount</p>
                              <p className="text-white text-lg font-bold">{deposit.usdtAmount} USDT</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">INR Amount</p>
                              <p className="text-green-400 text-lg font-bold">₹{deposit.inrAmount.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-400 text-xs">Submitted</p>
                            <p className="text-gray-300 text-sm">{new Date(deposit.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex md:flex-col gap-2">
                          <button
                            onClick={() => approveDeposit(deposit.id)}
                            disabled={processingDeposit === deposit.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDeposit(deposit.id)}
                            disabled={processingDeposit === deposit.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userData.pendingDeposits.length === 0 && (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 text-lg">No pending deposits</p>
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Transaction History ({userData.transactions.length})
              </h2>
              {userData.transactions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userData.transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {transaction.type === 'deposit' ? 'Deposit' : 'Referral Bonus'}
                            </span>
                            {transaction.network && (
                              <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-gray-300">
                                {transaction.network}
                              </span>
                            )}
                          </div>
                          {transaction.usdtAmount && (
                            <p className="text-white text-sm font-semibold mb-1">
                              {transaction.usdtAmount} USDT
                            </p>
                          )}
                          {transaction.from && (
                            <p className="text-gray-400 text-xs">From: {transaction.from}</p>
                          )}
                          <p className="text-gray-400 text-xs">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-lg font-bold">
                            ₹{(transaction.inrAmount || transaction.amount).toFixed(2)}
                          </p>
                          <span className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs">
                            Completed
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300">No transactions yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AshPayAdmin;
