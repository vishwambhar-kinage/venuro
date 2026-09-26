import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('venuro_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally and unwrap response data
api.interceptors.response.use(
  (res) => {
    const data = res.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (!data.data) {
        data.data = data;
      }
    }
    return data !== undefined ? data : res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('venuro_token');
      localStorage.removeItem('venuro_user');
    }
    return Promise.reject(err);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  organizerLogin: (data) => api.post('/auth/organizer-login', data),
  adminLogin: (data) => api.post('/auth/admin-login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
};

// ── Events API ────────────────────────────────────────────────────────────────
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  getMyEvents: () => api.get('/events/organizer/my-events'),
  getCoordinatorEvents: () => api.get('/events/organizer/my-events'),
  search: (q) => api.get('/events', { params: { search: q } }),
  getByCategory: (cat) => api.get('/events', { params: { category: cat } }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  submitForApproval: (id) => api.post(`/events/${id}/submit-approval`),
  cancel: (id) => api.post(`/events/${id}/cancel`),
  delete: (id) => api.delete(`/events/${id}`),
};

// ── Shows API ─────────────────────────────────────────────────────────────────
export const showAPI = {
  getByEvent: (eventId) => api.get(`/shows/event/${eventId}`),
  getById: (id) => api.get(`/shows/${id}`),
  getSeatMap: (showId) => api.get(`/shows/${showId}/seat-map`),
  lockSeat: (showId, seatId) => api.post(`/shows/${showId}/lock`, { seatId }),
  unlockSeat: (showId, seatId) => api.post(`/shows/${showId}/unlock`, { seatId }),
  create: (data) => api.post('/shows', data),
  createShow: (data) => api.post('/shows', data),
};

// ── Booking API ───────────────────────────────────────────────────────────────
export const bookingAPI = {
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancelBooking: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  lockSeats: (showId, seatIds) => api.post('/bookings/lock-seats', { showId, seatIds }),
  releaseSeats: (showId, seatIds) => api.post('/bookings/release-seats', { showId, seatIds }),
  checkout: (data) => api.post('/bookings/checkout', data),
  verifyTicketScan: (data) => api.post('/bookings/verify-qr', data),
  verifyQR: (data) => api.post('/bookings/verify-qr', data),
};

// ── Payment API ───────────────────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data) => api.post('/payment/create-order', data),
  verifyPayment: (data) => api.post('/payment/verify', data),
  simulatePayment: (data) => api.post('/payment/simulate', data),
};

// ── AI API ────────────────────────────────────────────────────────────────────
export const aiAPI = {
  chat: (message, history = []) => api.post('/ai/chat', { message, history }),
  getRecommendations: () => api.get('/ai/recommendations'),
  getStatus: () => api.get('/ai/status'),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getHealth: () => api.get('/admin/health'),
  getPendingEvents: () => api.get('/admin/events/pending'),
  approveEvent: (id) => api.post(`/admin/events/${id}/approve`),
  rejectEvent: (id, reason) => api.post(`/admin/events/${id}/reject`, { reason }),
  suspendEvent: (id) => api.post(`/admin/events/${id}/suspend`),
  getOrganizers: () => api.get('/admin/organizers'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  updateOrganizerStatus: (id, status) => api.put(`/admin/organizers/${id}/status`, { status }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/status`),
  getBookings: () => api.get('/admin/bookings'),
};

export default api;
