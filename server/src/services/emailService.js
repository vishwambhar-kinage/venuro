import nodemailer from 'nodemailer';

/**
 * Email Service — Venuro Platform
 *
 * Sends OTP emails for:
 *  - register   → email verification
 *  - forgot     → password reset
 *  - login      → 2FA login OTP
 *
 * Falls back to console logging in dev mode if Gmail is not configured.
 */

// Generate a 6-digit numeric OTP
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Build the Nodemailer transporter (lazy — called only when needed)
const getTransporter = () => {
  if (
    !process.env.EMAIL_FROM ||
    !process.env.EMAIL_APP_PASSWORD ||
    process.env.EMAIL_APP_PASSWORD.includes('xxxx')
  ) {
    return null; // Dev mode — log OTP to console
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// ── OTP Email Template ────────────────────────────────────────────────────────
const buildOTPTemplate = (otp, type) => {
  const actions = {
    register: { title: 'Verify Your Email', subtitle: 'Welcome to Venuro!', action: 'verify your email address and activate your account' },
    forgot: { title: 'Reset Your Password', subtitle: 'Password Reset Request', action: 'reset your password' },
    login: { title: 'Login OTP', subtitle: 'Secure Login', action: 'log in to your account' },
  };
  const { title, subtitle, action } = actions[type] || actions.register;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f0f23; margin: 0; padding: 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
  .header { background: linear-gradient(135deg, #6c63ff 0%, #f50057 100%); padding: 32px 40px; text-align: center; }
  .logo { font-size: 32px; font-weight: 900; color: white; letter-spacing: -1px; }
  .subtitle { color: rgba(255,255,255,0.8); margin-top: 8px; font-size: 14px; }
  .body { padding: 36px 40px; color: #e0e0e0; }
  .body h2 { color: #ffffff; font-size: 22px; margin: 0 0 12px; }
  .body p { color: #aaaaaa; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
  .otp-box { background: #0d0d1a; border: 2px solid #6c63ff; border-radius: 16px; padding: 28px; text-align: center; margin: 24px 0; }
  .otp { font-size: 48px; font-weight: 900; color: #6c63ff; letter-spacing: 10px; font-family: 'Courier New', monospace; }
  .otp-label { color: #666; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 2px; }
  .warning { background: #1e1e30; border-left: 3px solid #f50057; border-radius: 8px; padding: 12px 16px; color: #aaa; font-size: 13px; margin: 16px 0; }
  .footer { background: #0d0d1a; padding: 20px 40px; text-align: center; color: #444; font-size: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎟️ Venuro</div>
      <div class="subtitle">${subtitle}</div>
    </div>
    <div class="body">
      <h2>${title}</h2>
      <p>Use the OTP below to ${action}. This code is valid for <strong>10 minutes</strong>.</p>
      <div class="otp-box">
        <div class="otp">${otp}</div>
        <div class="otp-label">One-Time Password</div>
      </div>
      <div class="warning">
        ⚠️ Never share this OTP with anyone. Venuro will never ask for your OTP.
        If you didn't request this, please ignore this email.
      </div>
    </div>
    <div class="footer">
      © 2026 Venuro Entertainment Pvt. Ltd. · All rights reserved
    </div>
  </div>
</body>
</html>`;
};

// ── Send OTP Email ────────────────────────────────────────────────────────────
export const sendOTPEmail = async (email, otp, type = 'register') => {
  const transporter = getTransporter();

  if (!transporter) {
    // DEV MODE: Print OTP to console so you can test without a real email
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log(`║  📧 EMAIL OTP (Dev Mode)              ║`);
    console.log(`║  To:    ${email.padEnd(30)} ║`);
    console.log(`║  Type:  ${type.padEnd(30)} ║`);
    console.log(`║  OTP:   ${otp.padEnd(30)} ║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    return { success: true, devMode: true, otp }; // Return OTP in dev mode for testing
  }

  const subjects = {
    register: '🎟️ Venuro — Verify Your Email',
    forgot: '🔑 Venuro — Reset Your Password',
    login: '🔐 Venuro — Your Login OTP',
  };

  await transporter.sendMail({
    from: `"Venuro 🎟️" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: subjects[type] || '🎟️ Venuro — OTP',
    html: buildOTPTemplate(otp, type),
  });

  return { success: true, devMode: false };
};

// ── Booking Confirmation Email ─────────────────────────────────────────────────
export const sendBookingConfirmationEmail = async ({ email, userName, eventTitle, bookingId, seats, grandTotal, showDate, showTime }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`📧 [Email Dev] Booking confirmation → ${email} (booking: ${bookingId})`);
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #0f0f23; margin: 0; padding: 20px; }
  .container { max-width: 480px; margin: 0 auto; background: #1a1a2e; border-radius: 20px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #00b09b, #96c93d); padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 26px; }
  .body { padding: 32px; color: #ddd; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #2a2a3e; }
  .label { color: #888; }
  .value { color: #fff; font-weight: 600; }
  .total { font-size: 22px; color: #00b09b; }
  .footer { background: #0d0d1a; padding: 16px; text-align: center; color: #555; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>✅ Booking Confirmed!</h1></div>
    <div class="body">
      <p>Hi ${userName}, your booking is confirmed! 🎉</p>
      <div class="row"><span class="label">Event</span><span class="value">${eventTitle}</span></div>
      <div class="row"><span class="label">Date & Time</span><span class="value">${showDate} · ${showTime}</span></div>
      <div class="row"><span class="label">Seats</span><span class="value">${seats} seat(s)</span></div>
      <div class="row"><span class="label">Booking ID</span><span class="value">${bookingId}</span></div>
      <div class="row"><span class="label">Amount Paid</span><span class="value total">₹${grandTotal}</span></div>
      <p style="margin-top:20px; color:#888; font-size:14px;">
        Show your QR code at the venue entrance. Check My Bookings in the app. Enjoy the show! 🎉
      </p>
    </div>
    <div class="footer">© 2026 Venuro Entertainment Pvt. Ltd.</div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Venuro 🎟️" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `✅ Booking Confirmed — ${eventTitle}`,
    html,
  });
};
