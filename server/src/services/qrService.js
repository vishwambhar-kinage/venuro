import QRCode from 'qrcode';
import crypto from 'crypto';

const QR_SECRET = process.env.QR_HMAC_SECRET || process.env.QR_SECRET || 'venuro-super-secret-qr-key-2026';

/**
 * QR Service — Venuro Platform
 *
 * Generates and verifies HMAC-SHA256 signed QR ticket payloads.
 *
 * Interview explanation:
 * The QR data is signed with HMAC-SHA256(payload, QR_SECRET).
 * When a coordinator scans the ticket, we recompute the signature and compare.
 * This prevents counterfeit tickets — you can't generate a valid signature without the secret.
 */

// ── Named exports (used by paymentController and bookingController) ────────────

/**
 * Generate a signed QR code for a booking
 * @returns { qrCode: string (base64 PNG), qrData: string (signed payload) }
 */
export const generateBookingQR = async (bookingId, userId, showId) => {
  const timestamp = Date.now();
  const payloadStr = `${bookingId}:${userId}:${showId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payloadStr)
    .digest('hex')
    .slice(0, 16);

  const qrData = `venuro://ticket/${payloadStr}/${signature}`;

  const qrCode = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    width: 300,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });

  return { qrCode, qrData };
};

/**
 * Verify a scanned QR code string
 */
export const verifyQR = (qrData) => {
  try {
    const raw = qrData.replace('venuro://ticket/', '');
    const parts = raw.split('/');
    const signature = parts.pop();
    const payloadStr = parts.join('/');

    const expected = crypto
      .createHmac('sha256', QR_SECRET)
      .update(payloadStr)
      .digest('hex')
      .slice(0, 16);

    if (expected !== signature) {
      return { valid: false, message: 'Invalid ticket: signature mismatch' };
    }

    const [bookingId, userId, showId, timestamp] = payloadStr.split(':');
    return { valid: true, bookingId, userId, showId, timestamp: Number(timestamp) };
  } catch {
    return { valid: false, message: 'Malformed QR data' };
  }
};

// ── Class-based API (backward compatibility with old bookingController) ────────
export class QRService {
  static createTicketPayload(booking, event, show) {
    const dataString = `${booking._id || booking.id}|${booking.bookingNumber || ''}|${event?.title || ''}|${show?.date || ''}|${show?.startTime || ''}|${(booking.seats || []).map(s => s.id || s.seatId).join(',')}`;
    const signature = crypto.createHmac('sha256', QR_SECRET).update(dataString).digest('hex').substring(0, 16);
    return {
      bookingId: booking._id || booking.id,
      bookingNumber: booking.bookingNumber,
      eventTitle: event?.title || '',
      venue: event?.venueName || '',
      date: show?.date || '',
      time: show?.startTime || '',
      seats: (booking.seats || []).map(s => s.id || s.seatId),
      totalAmount: booking.finalAmount || booking.grandTotal,
      signature,
    };
  }

  static async generateQRCodeDataUrl(payload) {
    try {
      return await QRCode.toDataURL(JSON.stringify(payload), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 320,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    } catch { return null; }
  }

  static verifyTicketPayload(payload) {
    if (!payload?.bookingId || !payload?.signature) {
      return { valid: false, message: 'Malformed ticket QR payload' };
    }
    const dataString = `${payload.bookingId}|${payload.bookingNumber}|${payload.eventTitle}|${payload.date}|${payload.time}|${(payload.seats || []).join(',')}`;
    const expectedSig = crypto.createHmac('sha256', QR_SECRET).update(dataString).digest('hex').substring(0, 16);
    if (expectedSig !== payload.signature) {
      return { valid: false, message: 'Digital signature mismatch: Invalid ticket!' };
    }
    return { valid: true, payload };
  }
}
