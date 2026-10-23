import React, { useState } from 'react';
import { Lock, Phone, KeyRound, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../utils/storage';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [loginMode, setLoginMode] = useState('pin'); // 'pin' or 'password'
  const [phone, setPhone] = useState('9850020793');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Verification logic
    if (loginMode === 'pin') {
      if (pin === '1234' || pin === '9850') {
        const user = { name: 'Yash Mahajan', phone, role: 'ADMIN', loginTime: new Date().toISOString() };
        setCurrentUser(user);
        onLoginSuccess(user);
        onClose();
      } else {
        setError('Invalid 4-digit Mandi PIN. (Default PIN: 1234)');
      }
    } else {
      if (password === 'admin' || password === 'mahajan123' || password.length >= 4) {
        const user = { name: 'Yash Mahajan', phone, role: 'ADMIN', loginTime: new Date().toISOString() };
        setCurrentUser(user);
        onLoginSuccess(user);
        onClose();
      } else {
        setError('Invalid Password. (Use "admin" or your PIN)');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30 text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-amber-300">R. Mahajan Enterprise</h3>
              <p className="text-xs text-slate-400">Owner & Admin Authentication</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setLoginMode('pin'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                loginMode === 'pin' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              4-Digit Mandi PIN
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode('password'); setError(''); }}
              className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                loginMode === 'password' ? 'bg-white shadow text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Full Password
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number / User ID</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="9850020793"
                required
              />
            </div>
          </div>

          {loginMode === 'pin' ? (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Quick Mandi PIN</label>
                <span className="text-[11px] text-amber-600 font-medium">Default: 1234</span>
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full py-2.5 text-center tracking-widest text-xl font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="● ● ● ●"
                autoFocus
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Quick 4-digit unlock for fast mobile access in the APMC yard.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <span className="text-[11px] text-amber-600 font-medium">Default: admin</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Remember me on this device (30 Days)</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-md transition transform active:scale-[0.98] text-sm"
          >
            Access ERP Portal
          </button>
        </form>
      </div>
    </div>
  );
}
