import React from 'react';
import { Lock, Check, Timer, ShieldCheck, Armchair, Info } from 'lucide-react';

export const SeatMatrix = ({
  show,
  event,
  selectedSeats,
  onToggleSeat,
  isLockedByMe,
  lockSecondsRemaining,
  onProceedCheckout,
  lockingLoading
}) => {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getTierBadge = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'VIP':
      case 'RECLINER':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PREMIUM':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'STANDARD':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const calculateSubtotal = () => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  };

  return (
    <div className="space-y-6">
      {/* Active Redis Lock Countdown Banner */}
      {isLockedByMe && lockSecondsRemaining > 0 && (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all shadow-sm ${
          lockSecondsRemaining < 60
            ? 'bg-red-50 border-red-300 text-red-800 animate-pulse'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Redis Seat Lock Active (SET NX EX 300)</p>
              <p className="text-xs opacity-85">
                Your selected seats are locked in Redis. Complete checkout before timer expires.
              </p>
            </div>
          </div>
          <div className="text-right pl-4">
            <span className="font-mono text-2xl font-black text-[#f84464] block">
              {formatTime(lockSecondsRemaining)}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Remaining</span>
          </div>
        </div>
      )}

      {/* Theater Seating Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Screen / Stage Curve — BookMyShow Style */}
        <div className="relative pt-2 pb-4 text-center max-w-xl mx-auto">
          <div className="h-2 cinema-screen-bms rounded-t-full shadow-sm mb-2" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            All eyes this way please! (Screen / Stage)
          </p>
        </div>

        {/* Seating Matrix Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[640px] max-w-3xl mx-auto space-y-3">
            {show.seatGrid.map((rowSeats, rIdx) => {
              const rowLetter = rowSeats[0]?.row || '';
              const rowTier = rowSeats[0]?.tier || 'STANDARD';
              const rowPrice = rowSeats[0]?.price || 500;

              return (
                <div key={rIdx} className="flex items-center justify-center gap-3">
                  {/* Row Letter & Tier label */}
                  <div className="w-20 flex items-center justify-between text-xs pr-2">
                    <span className="font-bold text-slate-500 font-mono text-sm">{rowLetter}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getTierBadge(rowTier)}`}>
                      ₹{rowPrice}
                    </span>
                  </div>

                  {/* Seats in Row */}
                  <div className="flex items-center gap-2">
                    {rowSeats.map((seat) => {
                      const isSelected = selectedSeats.some((s) => s.id === seat.id);
                      const isBooked = seat.status === 'booked';
                      const isLockedByOthers = seat.status === 'locked' && !seat.isLockedByMe;

                      let seatStyle = 'bg-white border-emerald-500 text-emerald-700 hover:bg-emerald-500 hover:text-white cursor-pointer';

                      if (isBooked) {
                        seatStyle = 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed';
                      } else if (isLockedByOthers) {
                        seatStyle = 'bg-amber-100 border-amber-400 text-amber-700 cursor-not-allowed animate-pulse';
                      } else if (isSelected) {
                        seatStyle = 'bg-[#f84464] border-[#f84464] text-white shadow-md shadow-[#f84464]/30 scale-105';
                      }

                      return (
                        <button
                          key={seat.id}
                          onClick={() => !isBooked && !isLockedByOthers && onToggleSeat(seat)}
                          disabled={isBooked || isLockedByOthers}
                          title={`Seat ${seat.id} (${seat.tier}) - ₹${seat.price}`}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md border text-[11px] font-bold flex items-center justify-center transition-all duration-150 ${seatStyle}`}
                        >
                          {isBooked ? (
                            <XIcon className="w-3.5 h-3.5 text-gray-400" />
                          ) : isLockedByOthers ? (
                            <Lock className="w-3 h-3 text-amber-600" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            seat.col
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-emerald-500 bg-white" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f84464] text-white flex items-center justify-center">
              <Check className="w-3 h-3" />
            </div>
            <span className="font-bold text-[#f84464]">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-400 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-amber-600" />
            </div>
            <span>Locked (Redis 5m TTL)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 flex items-center justify-center">
              <XIcon className="w-2.5 h-2.5 text-gray-400" />
            </div>
            <span>Booked / Sold Out</span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      {selectedSeats.length > 0 && (
        <div className="sticky bottom-4 z-30 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Selected Seats</span>
              <div className="flex flex-wrap gap-1">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-[#f84464] border border-rose-200">
                    {s.id}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#22243a] mt-1">
              ₹{calculateSubtotal()} <span className="text-xs text-slate-400 font-normal">+ convenience fee</span>
            </p>
          </div>

          <button
            onClick={onProceedCheckout}
            disabled={lockingLoading}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-[#f84464] hover:bg-[#d83552] text-white shadow-lg shadow-[#f84464]/30 flex items-center gap-2 transition disabled:opacity-50"
          >
            {lockingLoading ? (
              <span>Acquiring Redis Lock...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pay ₹{calculateSubtotal()} ({selectedSeats.length} Seats)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
