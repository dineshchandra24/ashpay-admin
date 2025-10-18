import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, User, Wallet, Clock, TrendingUp, RefreshCw, AlertCircle, Eye, EyeOff, LogOut, Edit2, Save, X, Users, Gift, CreditCard, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';

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
  
  // Withdrawal states
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [withdrawalStatus, setWithdrawalStatus] = useState('pending');
  const [withdrawalErrors, setWithdrawalErrors] = useState({});
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  // Remark modal states
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkTransactionId, setRemarkTransactionId] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [processingRemark, setProcessingRemark] = useState(false);

  // Add balance modal states
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [addBalanceAmount, setAddBalanceAmount] = useState('');
  const [addBalanceType, setAddBalanceType] = useState('bonus');
  const [addBalanceRemark, setAddBalanceRemark] = useState('');
  const [addBalanceErrors, setAddBalanceErrors] = useState({});
  const [processingAddBalance, setProcessingAddBalance] = useState(false);

  const API_BASE = 'https://ashpay-backend.onrender.com/api';
  const ADMIN_PASSWORD = 'Dcmishra@5474';

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
      const userResponse = await fetch(`${API_BASE}/user/${searchId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!userResponse.ok) {
        throw new Error('User not found');
      }

      const userData = await userResponse.json();
      const user = userData.user;

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
      await searchUser();
      setProcessingDeposit(null);
    } catch (err) {
      setError(err.message || 'Failed to approve deposit');
      setProcessingDeposit(null);
    }
  };

  const rejectDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to reject this deposit?')) {
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
      await searchUser();
      setProcessingDeposit(null);
    } catch (err) {
      setError(err.message || 'Failed to reject deposit');
      setProcessingDeposit(null);
    }
  };

  const validateWithdrawal = () => {
    const errors = {};

    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    } else if (parseFloat(withdrawalAmount) > userData.balance) {
      errors.amount = `Amount exceeds balance (₹${userData.balance.toFixed(2)})`;
    }

    if (!selectedPaymentId) {
      errors.payment = 'Please select a payment method';
    }

    setWithdrawalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processWithdrawal = async () => {
    if (!validateWithdrawal()) {
      return;
    }

    setProcessingWithdrawal(true);
    setError('');
    setSuccessMessage('');

    try {
      const selectedPayment = userData.paymentDetails.find(p => p.id === parseInt(selectedPaymentId));
      
      if (!selectedPayment) {
        throw new Error('Payment method not found');
      }

      const withdrawalAmount_num = parseFloat(withdrawalAmount);
      
      // Create withdrawal transaction with pending status
      const withdrawalTx = {
        id: Date.now(),
        type: 'withdrawal',
        amount: withdrawalAmount_num,
        status: 'pending',
        method: selectedPayment.type,
        paymentDetails: {
          id: selectedPayment.id,
          type: selectedPayment.type,
          accountName: selectedPayment.accountName,
          accountNumber: selectedPayment.accountNumber,
          ifsc: selectedPayment.ifsc,
          bankName: selectedPayment.bankName,
          upiId: selectedPayment.upiId
        },
        date: new Date().toISOString(),
        remark: ''
      };

      const updatedTransactions = [...(userData.transactions || []), withdrawalTx];

      const response = await fetch(`${API_BASE}/user/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: updatedTransactions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process withdrawal');
      }

      const responseData = await response.json();
      
      // Update state
      setUserData(prev => ({
        ...prev,
        transactions: responseData.user.transactions || updatedTransactions
      }));

      setSuccessMessage(`✅ Withdrawal request created as pending!`);
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setSelectedPaymentId('');
      setWithdrawalErrors({});
      setProcessingWithdrawal(false);
    } catch (err) {
      setError(err.message || 'Failed to process withdrawal');
      setProcessingWithdrawal(false);
    }
  };

  const updateWithdrawalStatus = async (transactionId, newStatus) => {
    if (newStatus === 'failed') {
      setRemarkTransactionId(transactionId);
      setShowRemarkModal(true);
      return;
    }

    if (!window.confirm(`Mark this withdrawal as ${newStatus}?`)) {
      return;
    }

    setProcessingDeposit(transactionId);
    setError('');
    setSuccessMessage('');

    try {
      const updatedTransactions = userData.transactions.map(tx => {
        if (tx.id === transactionId) {
          const oldStatus = tx.status;
          let newBalance = userData.balance;
          
          if (oldStatus !== 'successful' && newStatus === 'successful') {
            newBalance = userData.balance - tx.amount;
          } else if (oldStatus === 'successful' && newStatus !== 'successful') {
            newBalance = userData.balance + tx.amount;
          }

          return { ...tx, status: newStatus, remark: '' };
        }
        return tx;
      });

      const tx = userData.transactions.find(t => t.id === transactionId);
      let finalBalance = userData.balance;

      if (tx.status !== 'successful' && newStatus === 'successful') {
        finalBalance = userData.balance - tx.amount;
      } else if (tx.status === 'successful' && newStatus !== 'successful') {
        finalBalance = userData.balance + tx.amount;
      }

      const response = await fetch(`${API_BASE}/user/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: updatedTransactions,
          balance: finalBalance
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const responseData = await response.json();
      
      setUserData(prev => ({
        ...prev,
        transactions: responseData.user.transactions || updatedTransactions,
        balance: responseData.user.balance || finalBalance
      }));

      setSuccessMessage(`✅ Withdrawal marked as ${newStatus}!`);
      setProcessingDeposit(null);
    } catch (err) {
      setError(err.message || 'Failed to update withdrawal status');
      setProcessingDeposit(null);
    }
  };

  const updateWithdrawalRemark = async () => {
    if (!remarkText.trim()) {
      setError('Please enter a remark');
      return;
    }

    setProcessingRemark(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!window.confirm(`Mark as failed with remark: "${remarkText}"?`)) {
        setProcessingRemark(false);
        return;
      }

      const updatedTransactions = userData.transactions.map(tx => {
        if (tx.id === remarkTransactionId) {
          return { ...tx, status: 'failed', remark: remarkText };
        }
        return tx;
      });

      const tx = userData.transactions.find(t => t.id === remarkTransactionId);
      let finalBalance = userData.balance;

      if (tx.status === 'successful') {
        finalBalance = userData.balance + tx.amount;
      }

      const response = await fetch(`${API_BASE}/user/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: updatedTransactions,
          balance: finalBalance
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update withdrawal');
      }

      const responseData = await response.json();
      
      setUserData(prev => ({
        ...prev,
        transactions: responseData.user.transactions || updatedTransactions,
        balance: responseData.user.balance || finalBalance
      }));

      setSuccessMessage(`✅ Withdrawal marked as failed with remark!`);
      setShowRemarkModal(false);
      setRemarkText('');
      setRemarkTransactionId(null);
      setProcessingRemark(false);
    } catch (err) {
      setError(err.message || 'Failed to update withdrawal');
      setProcessingRemark(false);
    }
  };

  const validateAddBalance = () => {
    const errors = {};

    if (!addBalanceAmount || parseFloat(addBalanceAmount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    if (!addBalanceRemark.trim()) {
      errors.remark = 'Please enter a remark/description';
    }

    setAddBalanceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const processAddBalance = async () => {
    if (!validateAddBalance()) {
      return;
    }

    setProcessingAddBalance(true);
    setError('');
    setSuccessMessage('');

    try {
      const amount = parseFloat(addBalanceAmount);
      
      // Create new transaction
      const newTransaction = {
        id: Date.now(),
        type: addBalanceType,
        amount: amount,
        description: addBalanceRemark,
        date: new Date().toISOString()
      };

      // Calculate new balance
      const newBalance = userData.balance + amount;

      const updatedTransactions = [...(userData.transactions || []), newTransaction];

      const response = await fetch(`${API_BASE}/user/${userData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: updatedTransactions,
          balance: newBalance
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add balance');
      }

      const responseData = await response.json();
      
      // Update state
      setUserData(prev => ({
        ...prev,
        transactions: responseData.user.transactions || updatedTransactions,
        balance: responseData.user.balance || newBalance
      }));

      setSuccessMessage(`✅ Successfully added ₹${amount.toFixed(2)} as ${addBalanceType}!`);
      setShowAddBalanceModal(false);
      setAddBalanceAmount('');
      setAddBalanceRemark('');
      setAddBalanceType('bonus');
      setAddBalanceErrors({});
      setProcessingAddBalance(false);
    } catch (err) {
      setError(err.message || 'Failed to add balance');
      setProcessingAddBalance(false);
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

              {/* Withdrawal Button */}
              <button
                onClick={() => setShowWithdrawalModal(true)}
                disabled={!userData.paymentDetails || userData.paymentDetails.length === 0}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                <ArrowUpRight className="w-5 h-5" />
                Process Withdrawal
              </button>

              {/* Add Balance Button */}
              <button
                onClick={() => setShowAddBalanceModal(true)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Gift className="w-5 h-5" />
                Add Balance / Gift
              </button>

              {/* Additional Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                              <p className="text-white font-semibold">{payment.ifsc}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Bank Name</p>
                              <p className="text-white font-semibold">{payment.bankName}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Account Holder</p>
                              <p className="text-white font-semibold">{payment.accountName}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Transaction History ({userData.transactions?.length || 0})
              </h2>
              {userData.transactions && userData.transactions.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[...userData.transactions].reverse().map((transaction) => (
                    <div key={transaction.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-500/20 text-green-400'
                                : transaction.type === 'withdrawal'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {transaction.type === 'deposit' ? 'Deposit' : transaction.type === 'withdrawal' ? 'Withdrawal' : 'Bonus'}
                            </span>
                            
                            {transaction.status && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                transaction.status === 'successful'
                                  ? 'bg-green-500/20 text-green-400'
                                  : transaction.status === 'failed'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {transaction.status === 'successful' ? '✅ Success' : transaction.status === 'failed' ? '❌ Failed' : '🕐 Pending'}
                              </span>
                            )}
                            
                            {transaction.method && (
                              <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-gray-300">
                                {transaction.method === 'bank' ? '🏦 Bank' : '📱 UPI'}
                              </span>
                            )}
                          </div>

                          {transaction.amount && (
                            <p className="text-white text-sm font-semibold mb-1">
                              Amount: ₹{transaction.amount.toFixed(2)}
                            </p>
                          )}

                          {transaction.paymentDetails && (
                            <div className="bg-white/5 rounded-lg p-2 mb-2 text-xs border border-white/10">
                              {transaction.paymentDetails.type === 'bank' ? (
                                <>
                                  <p className="text-gray-400">Bank: <span className="text-white font-semibold">{transaction.paymentDetails.bankName}</span></p>
                                  <p className="text-gray-400">A/C: <span className="text-white font-semibold">****{transaction.paymentDetails.accountNumber?.slice(-4)}</span></p>
                                </>
                              ) : (
                                <p className="text-gray-300"><span className="text-gray-400">UPI:</span> <span className="text-white font-semibold">{transaction.paymentDetails.upiId}</span></p>
                              )}
                            </div>
                          )}

                          {transaction.remark && (
                            <div className="bg-red-500/10 rounded-lg p-2 mb-2 text-xs border border-red-500/30">
                              <p className="text-red-300"><span className="font-semibold">Remark:</span> {transaction.remark}</p>
                            </div>
                          )}

                          <p className="text-gray-400 text-xs">
                            {new Date(transaction.date).toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right">
                          {transaction.type === 'withdrawal' && transaction.status === 'failed' ? (
                            <div>
                              <p className="text-lg font-bold text-red-400">
                                ❌ ₹{transaction.amount?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">Not Deducted</p>
                            </div>
                          ) : (
                            <p className={`text-lg font-bold ${
                              transaction.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {transaction.type === 'withdrawal' ? '-' : '+'}₹{transaction.amount?.toFixed(2) || '0.00'}
                            </p>
                          )}

                          {/* Status update buttons for withdrawals */}
                          {transaction.type === 'withdrawal' && transaction.status === 'pending' && (
                            <div className="flex gap-1 mt-2">
                              <button
                                onClick={() => updateWithdrawalStatus(transaction.id, 'successful')}
                                disabled={processingDeposit === transaction.id}
                                className="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                                title="Mark as successful"
                              >
                                ✅
                              </button>
                              <button
                                onClick={() => updateWithdrawalStatus(transaction.id, 'failed')}
                                disabled={processingDeposit === transaction.id}
                                className="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                                title="Mark as failed"
                              >
                                ❌
                              </button>
                            </div>
                          )}

                          {transaction.type === 'withdrawal' && transaction.status === 'successful' && (
                            <button
                              onClick={() => updateWithdrawalStatus(transaction.id, 'pending')}
                              disabled={processingDeposit === transaction.id}
                              className="w-full mt-2 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                              title="Mark as pending"
                            >
                              Back to Pending
                            </button>
                          )}
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
                            className="flex-1 md:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => rejectDeposit(deposit.id)}
                            disabled={processingDeposit === deposit.id}
                            className="flex-1 md:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
          </>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && userData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-violet-900 to-purple-900 rounded-3xl p-6 max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ArrowUpRight className="w-6 h-6 text-red-400" />
                Process Withdrawal
              </h2>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setSelectedPaymentId('');
                  setWithdrawalAmount('');
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-gray-300 text-sm mb-1">Current Balance</p>
              <p className="text-white text-2xl font-bold">₹{userData.balance.toFixed(2)}</p>
            </div>

            {!userData.paymentDetails || userData.paymentDetails.length === 0 ? (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
                <p className="text-red-300">❌ No saved payment methods</p>
                <p className="text-red-400 text-sm mt-2">User must add a payment method first</p>
              </div>
            ) : (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Withdrawal Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawalAmount}
                    onChange={(e) => {
                      setWithdrawalAmount(e.target.value);
                      setWithdrawalErrors({});
                    }}
                    className={`w-full px-4 py-3 bg-white/10 border ${withdrawalErrors.amount ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400`}
                  />
                  {withdrawalErrors.amount && (
                    <p className="text-red-400 text-sm mt-1">{withdrawalErrors.amount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Payment Method</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userData.paymentDetails.map((payment) => (
                      <label
                        key={payment.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedPaymentId === payment.id.toString()
                            ? 'bg-purple-500/30 border-purple-500'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={payment.id}
                          checked={selectedPaymentId === payment.id.toString()}
                          onChange={(e) => setSelectedPaymentId(e.target.value)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          {payment.type === 'bank' ? (
                            <>
                              <p className="text-white font-semibold text-sm truncate">
                                {payment.accountName}
                              </p>
                              <p className="text-gray-400 text-xs">
                                {payment.bankName} - {payment.accountNumber?.slice(-4)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-white font-semibold text-sm">{payment.upiId}</p>
                              <p className="text-gray-400 text-xs">UPI Payment</p>
                            </>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  {withdrawalErrors.payment && (
                    <p className="text-red-400 text-sm mt-1">{withdrawalErrors.payment}</p>
                  )}
                </div>

                {withdrawalAmount && (
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Amount</span>
                      <span className="text-white font-bold">₹{parseFloat(withdrawalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Status</span>
                      <span className="text-yellow-400 font-bold">🕐 Pending</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-2">Balance will be deducted when marked as successful</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setSelectedPaymentId('');
                  setWithdrawalAmount('');
                }}
                disabled={processingWithdrawal}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processWithdrawal}
                disabled={processingWithdrawal || !userData.paymentDetails || userData.paymentDetails.length === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {processingWithdrawal ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    Process
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-violet-900 to-purple-900 rounded-3xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                Failure Reason
              </h2>
              <button
                onClick={() => {
                  setShowRemarkModal(false);
                  setRemarkText('');
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Why did this withdrawal fail?</label>
                <textarea
                  placeholder="Enter reason (e.g., Account details incorrect, Insufficient balance, Technical error)"
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none h-32"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemarkModal(false);
                  setRemarkText('');
                }}
                disabled={processingRemark}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={updateWithdrawalRemark}
                disabled={processingRemark || !remarkText.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {processingRemark ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Mark as Failed
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      {showAddBalanceModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-violet-900 to-purple-900 rounded-3xl p-6 max-w-md w-full border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gift className="w-6 h-6 text-green-400" />
                Add Balance
              </h2>
              <button
                onClick={() => {
                  setShowAddBalanceModal(false);
                  setAddBalanceAmount('');
                  setAddBalanceRemark('');
                  setAddBalanceType('bonus');
                  setAddBalanceErrors({});
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-gray-300 text-sm mb-1">Current Balance</p>
              <p className="text-white text-2xl font-bold">₹{userData.balance.toFixed(2)}</p>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount to add"
                  value={addBalanceAmount}
                  onChange={(e) => {
                    setAddBalanceAmount(e.target.value);
                    setAddBalanceErrors({});
                  }}
                  className={`w-full px-4 py-3 bg-white/10 border ${addBalanceErrors.amount ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400`}
                />
                {addBalanceErrors.amount && (
                  <p className="text-red-400 text-sm mt-1">{addBalanceErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Type</label>
                <select
                  value={addBalanceType}
                  onChange={(e) => setAddBalanceType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
                >
                  <option value="bonus">🎁 Bonus</option>
                  <option value="gift">🎀 Gift</option>
                  <option value="reward">⭐ Reward</option>
                  <option value="refund">💰 Refund</option>
                  <option value="compensation">🤝 Compensation</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2">Description / Remark</label>
                <textarea
                  placeholder="Enter reason (e.g., Welcome bonus, Referral reward, Compensation for issue)"
                  value={addBalanceRemark}
                  onChange={(e) => {
                    setAddBalanceRemark(e.target.value);
                    setAddBalanceErrors({});
                  }}
                  className={`w-full px-4 py-3 bg-white/10 border ${addBalanceErrors.remark ? 'border-red-500' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 resize-none h-24`}
                />
                {addBalanceErrors.remark && (
                  <p className="text-red-400 text-sm mt-1">{addBalanceErrors.remark}</p>
                )}
              </div>

              {addBalanceAmount && (
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Amount to Add</span>
                    <span className="text-white font-bold">₹{parseFloat(addBalanceAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">New Balance</span>
                    <span className="text-green-400 font-bold">₹{(userData.balance + parseFloat(addBalanceAmount)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddBalanceModal(false);
                  setAddBalanceAmount('');
                  setAddBalanceRemark('');
                  setAddBalanceType('bonus');
                  setAddBalanceErrors({});
                }}
                disabled={processingAddBalance}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processAddBalance}
                disabled={processingAddBalance}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {processingAddBalance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    Add Balance
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AshPayAdmin;
