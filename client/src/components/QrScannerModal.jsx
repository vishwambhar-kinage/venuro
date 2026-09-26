import React, { useState } from 'react';
import { 
  X, 
  ScanLine, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin,
  RefreshCw
} from 'lucide-react';
import { bookingAPI } from '../services/api';

export const QrScannerModal = ({ isOpen, onClose }) => {
  const [qrJsonInput, setQrJsonInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleVerifyPayload = async (payloadToVerify) => {
    setVerifying(true);
    setScanResult(null);
    setErrorMsg('');

    try {
      let parsed = null;
      if (typeof payloadToVerify === 'string') {
        try {
          parsed = JSON.parse(payloadToVerify);
        } catch (e) {
          throw new Error('Invalid QR payload format. Please input valid ticket JSON data.');
        }
      } else {
        parsed = payloadToVerify;
      }

      const res = await bookingAPI.verifyQR(parsed);
      if (res.success && res.ticket) {
        setScanResult({
          valid: true,
          status: res.status,
          message: res.message,
          ticket: res.ticket
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'QR Verification failed. Signature invalid or ticket forged.');
      setScanResult({
        valid: false,
        message: err.message
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleQuickDemoScan = () => {
    const samplePayload = {
      bookingId: 'bkg_demo_sample_1',
      bookingNumber: 'VNR-89421-2026',
      eventTitle: 'Dune: Part Two (IMAX 3D Laser)',
      venue: 'PVR INOX IMAX Laser, Palladium Lower Parel',
      date: new Date().toISOString().split('T')[0],
      time: '19:45',
      seats: ['C5', 'C6'],
      totalAmount: 1870
    };
    setQrJsonInput(JSON.stringify(samplePayload, null, 2));
    handleVerifyPayload(samplePayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#333545] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base">Gate Admission QR Scanner</h3>
              <p className="text-xs text-slate-300">Coordinator & Admin Ticket Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#f8f9fa]">
          {/* Scanner Optical Simulation Viewport */}
          <div className="relative rounded-2xl bg-white border-2 border-dashed border-amber-400 p-6 flex flex-col items-center justify-center text-center shadow-sm overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#f84464] to-transparent animate-bounce" />
            <ScanLine className="w-12 h-12 text-[#f84464] mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-900">Live Optical Scanner Active</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Point camera at guest M-Ticket or paste raw ticket QR payload below for instant HMAC signature validation.
            </p>

            <button
              onClick={handleQuickDemoScan}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Simulate Guest QR Scan (Demo Pass)</span>
            </button>
          </div>

          {/* Manual / Pasted QR Payload input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Raw QR Code JSON Payload
            </label>
            <textarea
              rows={3}
              placeholder='{"bookingId": "bkg_...", "signature": "..."}'
              value={qrJsonInput}
              onChange={(e) => setQrJsonInput(e.target.value)}
              className="w-full bg-white text-xs text-slate-900 p-3 rounded-xl border border-gray-300 font-mono focus:outline-none focus:border-[#f84464]"
            />
            <button
              onClick={() => handleVerifyPayload(qrJsonInput)}
              disabled={!qrJsonInput.trim() || verifying}
              className="w-full py-2.5 rounded-xl bg-[#333545] hover:bg-[#22243a] text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
            >
              {verifying ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying Cryptographic Signature...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verify Gate Admission</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Result Box */}
          {scanResult && (
            <div className={`p-4 rounded-xl border transition-all animate-in zoom-in-95 duration-150 ${
              scanResult.valid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}>
              <div className="flex items-center gap-2.5 mb-1.5">
                {scanResult.valid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-extrabold text-sm">
                  {scanResult.valid ? 'ADMISSION GRANTED — VALID PASS' : 'ADMISSION DENIED — INVALID PASS'}
                </span>
              </div>
              <p className="text-xs opacity-90">{scanResult.message}</p>

              {scanResult.valid && scanResult.ticket && (
                <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-2 text-[11px] text-slate-800">
                  <div>
                    <span className="text-emerald-700 block font-bold">Event</span>
                    <span className="font-bold">{scanResult.ticket.eventTitle}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Seats ({scanResult.ticket.admitCount})</span>
                    <span className="font-mono font-bold text-[#f84464]">{scanResult.ticket.seats.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Booking ID</span>
                    <span className="font-mono">{scanResult.ticket.bookingNumber}</span>
                  </div>
                  <div>
                    <span className="text-emerald-700 block font-bold">Show Date/Time</span>
                    <span>{scanResult.ticket.date} @ {scanResult.ticket.time}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
