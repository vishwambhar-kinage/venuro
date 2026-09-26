import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Ticket, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, verifyOTP, demoLogin } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'verify'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState('');

  const redirectPath = searchParams.get('redirect') || '/';

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in both email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res && (res.token || res.user)) {
        toast.success(`Welcome back, ${res.user?.name || 'Customer'}!`);
        navigate(redirectPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please enter name, email, and password');
      return;
    }
    setLoading(true);
    try {
      const res = await register(name, email, password);
      if (res?.success) {
        setOtpSentMsg(res.message);
        setActiveTab('verify');
        toast.success('OTP sent! Check server terminal in dev mode.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP(email, otp, 'register');
      if (res && (res.token || res.user)) {
        toast.success('🎉 Account verified and created successfully!');
        navigate(redirectPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomerDemo = async () => {
    setLoading(true);
    try {
      const res = await demoLogin('customer');
      toast.success('Signed in as Customer');
      navigate(redirectPath);
    } catch (err) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#f5f5f7] flex items-center justify-center p-4 py-8">
      {/* BookMyShow Style Clean Modal Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f84464] flex items-center justify-center shadow-sm">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">
              {activeTab === 'verify' ? 'Verify Email' : (activeTab === 'register' ? 'Create Account' : 'Get Started with Venuro')}
            </h2>
          </div>
          <Link to="/" className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </Link>
        </div>

        <div className="p-6 space-y-5">
          
          {/* OAuth Continue Options */}
          {activeTab !== 'verify' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleQuickCustomerDemo}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-3 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google (1-Click Demo)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'login' ? 'register' : 'login')}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-3 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4 text-gray-500" />
                <span>{activeTab === 'login' ? 'Continue with Email' : 'Back to Login'}</span>
              </button>
            </div>
          )}

          {/* Divider */}
          {activeTab !== 'verify' && (
            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full"></div>
              <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                OR
              </span>
            </div>
          )}

          {/* Form Flow: Login */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@venuro.com"
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white font-medium"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white font-medium"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#f84464] hover:bg-[#e23754] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Continue</span>}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-gray-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="text-xs font-bold text-[#f84464] hover:underline"
                >
                  Sign up free
                </button>
              </div>
            </form>
          )}

          {/* Form Flow: Register */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white font-medium"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white font-medium"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full bg-gray-50 border border-gray-300 text-xs text-gray-900 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white font-medium"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#f84464] hover:bg-[#e23754] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit OTP &rarr;</span>}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-gray-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-[#f84464] hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* Form Flow: Verify OTP */}
          {activeTab === 'verify' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-gray-700 space-y-1">
                <p className="font-bold text-[#f84464]">📧 Verification Code Sent</p>
                <p>We generated a 6-digit code for <strong>{email}</strong>.</p>
                <p className="text-[11px] text-gray-500">In Dev Mode, check your server console terminal for the code.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  className="w-full tracking-widest text-center text-lg font-mono font-bold bg-gray-50 border border-gray-300 text-gray-900 rounded-xl py-2.5 focus:outline-none focus:ring-1 focus:ring-[#f84464] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#f84464] hover:bg-[#e23754] text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Create Account</span>}
              </button>
            </form>
          )}

          {/* Partner & Admin Portal Links (Subtle & clean) */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <Link to="/organizer/login" className="hover:text-[#f84464] flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>Organizer Portal</span>
            </Link>
            <Link to="/admin/login" className="hover:text-purple-600 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              <span>Admin Login</span>
            </Link>
          </div>

          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            By continuing, you agree to Venuro's Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
