import type { ReactNode } from 'react';
import { CalendarCheck, CheckCircle2 } from 'lucide-react';

interface Props { children: ReactNode; }

const FEATURES = [
  'Real-time availability & instant booking',
  'Intelligent scheduling & conflict prevention',
  'Instructor & resource optimization',
  'Enterprise-grade control & reporting',
];

export default function AuthLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT — Branding panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-14 py-12 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0078D7 0%, #025DB6 55%, #0169C9 100%)' }}
      >
        {/* Decorative depth layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.10),_transparent_60%)]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 w-56 h-56 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 rounded-full bg-white/[0.04]" />

        {/* Top — Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
            <CalendarCheck size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">NexBook</span>
        </div>

        {/* Center — Main messaging */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Welcome to<br />NexBook
            </h1>
            <p className="text-xl font-medium text-white/90 leading-snug">
              Smart booking. Seamless experience.
            </p>
            <p className="text-white/75 text-base leading-relaxed max-w-sm">
              Manage facilities, activities, and schedules with precision and ease — all in one intelligent platform.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3 pt-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white/85">
                <span className="w-6 h-6 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={13} className="text-white" />
                </span>
                <span className="text-sm font-medium">{f}</span>
              </li>
            ))}
          </ul>

          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white/90 font-medium backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Built for modern communities &amp; enterprises
          </div>
        </div>

        {/* Bottom — Copyright */}
        <p className="relative z-10 text-white/40 text-xs">
          © 2026 Dynovative Technologies. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          {/* Mobile logo — shown only when left panel is hidden */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0078D7] to-[#025DB6] flex items-center justify-center shadow-md">
              <CalendarCheck size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">NexBook</span>
          </div>
          {children}
        </div>
      </div>

    </div>
  );
}
