import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingEmail, setPendingEmail] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('venuro_token');
    const savedUser = localStorage.getItem('venuro_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    setLoading(false);
  }, []);

  const saveAuth = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('venuro_token', tokenData);
    localStorage.setItem('venuro_user', JSON.stringify(userData));
  };

  // Step 1: Register (creates customer account)
  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    setPendingEmail(email);
    return res.data || res;
  };

  // Step 2: Verify OTP → logs in
  const verifyOTP = async (email, otp, type = 'register') => {
    const res = await authAPI.verifyOTP({ email, otp, type });
    const payload = res.data || res;
    if (payload.token) {
      saveAuth(payload.user, payload.token);
      setPendingEmail(null);
    }
    return payload;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const payload = res.data || res;
    saveAuth(payload.user, payload.token);
    return payload;
  };

  const organizerLogin = async (email, password) => {
    const res = await authAPI.organizerLogin({ email, password });
    const payload = res.data || res;
    saveAuth(payload.user, payload.token);
    return payload;
  };

  const adminLogin = async (email, password) => {
    const res = await authAPI.adminLogin({ email, password });
    const payload = res.data || res;
    saveAuth(payload.user, payload.token);
    return payload;
  };

  const forgotPassword = async (email) => {
    const res = await authAPI.forgotPassword(email);
    setPendingEmail(email);
    return res.data || res;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await authAPI.resetPassword({ email, otp, newPassword });
    const payload = res.data || res;
    if (payload.token) saveAuth(payload.user, payload.token);
    return payload;
  };

  const demoLogin = async (role = 'customer') => {
    const creds = {
      customer: { email: 'user@venuro.com', password: 'password123' },
      user: { email: 'user@venuro.com', password: 'password123' },
      organizer: { email: 'coordinator@venuro.com', password: 'password123' },
      coordinator: { email: 'coordinator@venuro.com', password: 'password123' },
      admin: { email: 'admin@venuro.com', password: 'password123' },
    };
    const target = creds[role] || creds.customer;
    return login(target.email, target.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('venuro_token');
    localStorage.removeItem('venuro_user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('venuro_user', JSON.stringify(updated));
  };

  const userRole = (user?.role || '').toLowerCase();
  const isCustomer = userRole === 'customer' || userRole === 'user';
  const isOrganizer = userRole === 'organizer' || userRole === 'coordinator';
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider value={{
      user, token, loading, pendingEmail,
      register, verifyOTP, login, organizerLogin, adminLogin, demoLogin, logout,
      forgotPassword, resetPassword, updateUser,
      isAuthenticated: !!user,
      isCustomer,
      isOrganizer,
      isAdmin,
      isCoordinator: isOrganizer || isAdmin,
      isUser: isCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
