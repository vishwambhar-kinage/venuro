import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Calendar, ShieldCheck, ArrowRight, AlertCircle, Sparkles, Building2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrganizerLoginPage = () => {
  const navigate = useNavigate();
  const { organizerLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await organizerLogin(email, password);
      toast.success('Welcome to Venuro Organizer Studio!');
      navigate('/organizer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please verify credentials.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('coordinator@venuro.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-[#f84464] flex items-center justify-center shadow-md">
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#22243a] font-['Space_Grotesk']">
            venuro
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
            Organizer Portal
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-[#22243a]">
          Organizer & Partner Studio
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Manage event catalog, submit showtimes for platform approval, and track real-time ticket sales.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-gray-200 shadow-xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-[#f84464] shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Organizer Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="organizer@venuro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white text-slate-900 pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#f84464] font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white text-slate-900 pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#f84464] font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#f84464] hover:bg-[#d83552] text-white font-bold text-sm shadow-md shadow-[#f84464]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating Organizer...
                </span>
              ) : (
                <>
                  <span>Sign In to Organizer Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Presentation Demo Button */}
          <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Fill Verified Demo Credentials</span>
            </button>
            <span className="text-[11px] text-slate-400">
              coordinator@venuro.com / password123
            </span>
          </div>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
              &larr; Return to Customer Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerLoginPage;
