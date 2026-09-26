import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, Shield, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await adminLogin(email, password);
      toast.success('Administrator verified. Accessing Command Center...');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Access denied. Invalid administrator credentials.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@venuro.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#1e202e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white font-['Space_Grotesk']">
            venuro
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Command Center
          </span>
        </Link>
        <h2 className="text-2xl font-black text-white font-['Space_Grotesk']">
          Platform Governance & Security
        </h2>
        <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
          Authorized personnel only. Event approvals, financial audits, Redis telemetry & user governance.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#2a2d3f] py-8 px-6 sm:px-10 rounded-2xl border border-gray-700 shadow-2xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@venuro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1e202e] text-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500 font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Security Passkey / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1e202e] text-white pl-9 pr-4 py-2.5 rounded-xl border border-gray-600 focus:outline-none focus:border-purple-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Cryptographic Credentials...
                </span>
              ) : (
                <>
                  <span>Authenticate as Administrator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Presentation Demo Button */}
          <div className="pt-4 border-t border-gray-700 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full py-2 px-3 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-700/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Fill Admin Demo Credentials</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              admin@venuro.com / password123
            </span>
          </div>

          <div className="text-center pt-2">
            <Link to="/" className="text-xs text-slate-400 hover:text-white font-medium">
              &larr; Return to Customer Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
