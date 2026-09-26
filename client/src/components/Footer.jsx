import React from 'react';
import { Ticket, Sparkles, Shield, Cpu, Cloud, Database, Lock, HelpCircle, PhoneCall, Gift } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-[#333545] text-slate-300 text-sm">
      {/* Top Value Strip — BookMyShow Style */}
      <div className="border-b border-white/10 bg-[#22243a] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f84464] flex items-center justify-center text-white">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">List Your Show & Experience</span>
              <span className="text-slate-400">Got a concert, sports tournament, or premiere? Host it on Venuro.</span>
            </div>
          </div>
          <a
            href="/coordinator-dashboard"
            className="px-4 py-2 rounded-lg bg-[#f84464] hover:bg-[#d83552] text-white font-bold transition shadow-sm"
          >
            Coordinator Portal
          </a>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#f84464] flex items-center justify-center">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-wider">VENURO</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier real-time entertainment ticketing ecosystem. Featuring Gemini AI semantic recommendations, sub-millisecond Redis seat locking, and HMAC-signed M-Tickets.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cryptographic QR Security & Instant Refunds</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Entertainment</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="/?category=movies" className="hover:text-[#f84464] transition">Movies & IMAX 3D</a></li>
              <li><a href="/?category=concerts" className="hover:text-[#f84464] transition">Live Stadium Concerts</a></li>
              <li><a href="/?category=sports" className="hover:text-[#f84464] transition">Cricket & Sports Matches</a></li>
              <li><a href="/?category=live-shows" className="hover:text-[#f84464] transition">Standup Comedy & Plays</a></li>
              <li><a href="/?category=experiences" className="hover:text-[#f84464] transition">Immersive Experiences</a></li>
            </ul>
          </div>

          {/* Col 3: Key Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Flagship Technology</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5"><span className="text-[#f84464]">⚡</span> Redis Lock (<code className="text-xs text-slate-200">SET NX EX 300</code>)</li>
              <li className="flex items-center gap-1.5"><span className="text-[#f84464]">🤖</span> Gemini 1.5 Flash + Cosine RAG</li>
              <li className="flex items-center gap-1.5"><span className="text-[#f84464]">📱</span> HMAC-Signed Digital Passes</li>
              <li className="flex items-center gap-1.5"><span className="text-[#f84464]">💳</span> Venuro Wallet & Instant Auto-Refunds</li>
              <li className="flex items-center gap-1.5"><span className="text-[#f84464]">📡</span> WebSocket Live Seat Broadcast</li>
            </ul>
          </div>

          {/* Col 4: Demo Switcher Info */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Role-Based Portals</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="font-bold text-white block">Regular User</span>
                <span className="text-[11px]">Seat reservation, M-Tickets & cancellations</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="font-bold text-white block">Event Coordinator</span>
                <span className="text-[11px]">Publish events, showtimes & gate QR scanner</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <span className="font-bold text-white block">Platform Admin</span>
                <span className="text-[11px]">Live GMV, revenue charts & user governance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Venuro Entertainment Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>BookMyShow & District Clean Light Edition</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
