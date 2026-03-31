import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { useApiHealth } from '../../context/ApiHealthContext';

// ── Animated signal-bars illustration ─────────────────────────────────────
function SignalBars({ offline }: { offline: boolean }) {
  return (
    <div className="flex items-end gap-[5px] h-10">
      {[1, 2, 3, 4].map((bar) => {
        const height = `${bar * 25}%`;
        return (
          <div
            key={bar}
            className={`w-4 rounded-sm transition-all duration-700 ${
              offline
                ? bar === 1
                  ? 'bg-red-400 opacity-100'
                  : 'bg-gray-200 opacity-40'
                : 'bg-[#0078D7] opacity-100'
            }`}
            style={{
              height,
              animationDelay: `${bar * 120}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Pulsing ring animation around icon ─────────────────────────────────────
function PulsingRing({ color }: { color: string }) {
  return (
    <>
      <span
        className={`absolute inset-0 rounded-full ${color} opacity-20 animate-ping`}
        style={{ animationDuration: '1.8s' }}
      />
      <span
        className={`absolute inset-0 rounded-full ${color} opacity-10 animate-ping`}
        style={{ animationDuration: '1.8s', animationDelay: '0.6s' }}
      />
    </>
  );
}

// ── "Back Online" toast ─────────────────────────────────────────────────────
function BackOnlineToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5
        bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl
        shadow-[0_8px_24px_-4px_rgb(5_150_105_/_0.5)]
        transition-all duration-500 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <CheckCircle2 size={16} />
      Connected! NexBook is back online.
    </div>
  );
}

// ── Main overlay ────────────────────────────────────────────────────────────
export default function OfflineOverlay() {
  const { status, lastOnlineAt, retryIn, retryNow } = useApiHealth();
  const [showToast, setShowToast] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Show "back online" toast when recovering from offline
  useEffect(() => {
    if (status === 'offline' || status === 'recovering') {
      setWasOffline(true);
    }
    if (status === 'online' && wasOffline) {
      setShowToast(true);
      const t = setTimeout(() => {
        setShowToast(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [status, wasOffline]);

  const isDown = status === 'offline' || status === 'recovering';

  if (!isDown && !showToast) return null;

  return (
    <>
      {/* ── Back-online toast (shown even when overlay is gone) ── */}
      <BackOnlineToast visible={showToast && !isDown} />

      {/* ── Full-screen overlay ── */}
      {isDown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
            bg-[#F5F7FA]/80 backdrop-blur-[3px]"
          style={{ animation: 'fadeIn 0.4s ease' }}
        >
          {/* ── Card ── */}
          <div
            className="relative mx-4 w-full max-w-md bg-white rounded-3xl
              shadow-[0_24px_64px_-12px_rgb(0_0_0_/_0.22)]
              border border-gray-100 px-8 py-10 flex flex-col items-center gap-5
              overflow-hidden"
            style={{ animation: 'slideUp 0.4s ease' }}
          >
            {/* Decorative background circles */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-red-50 opacity-60" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-[#e6f3fc] opacity-50" />

            {/* ── Icon with pulsing ring ── */}
            <div className="relative flex items-center justify-center w-20 h-20">
              <PulsingRing color="bg-red-400" />
              <div className="relative z-10 w-20 h-20 rounded-full bg-red-50 border-2 border-red-100
                flex items-center justify-center">
                {status === 'recovering' ? (
                  <Wifi size={32} className="text-amber-500 animate-pulse" />
                ) : (
                  <WifiOff size={32} className="text-red-400" />
                )}
              </div>
            </div>

            {/* ── Signal bars ── */}
            <SignalBars offline={status === 'offline'} />

            {/* ── Text ── */}
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">
                {status === 'recovering' ? 'Reconnecting…' : 'Connection Lost'}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {status === 'recovering'
                  ? 'Checking connection to the NexBook server…'
                  : "We can't reach the NexBook server right now. This may be a temporary network issue."}
              </p>
              {status === 'offline' && lastOnlineAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Last connected at{' '}
                  <span className="font-medium">
                    {lastOnlineAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              )}
            </div>

            {/* ── Divider ── */}
            <div className="w-full h-px bg-gray-100" />

            {/* ── Auto-retry countdown bar ── */}
            {status === 'offline' && retryIn > 0 && (
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Auto-retrying…</span>
                  <span className="font-semibold text-gray-600 tabular-nums">{retryIn}s</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0078D7] to-[#025DB6] rounded-full"
                    style={{
                      width: `${(retryIn / 12) * 100}%`,
                      transition: 'width 1s linear',
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── Recovering spinner ── */}
            {status === 'recovering' && (
              <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                <RefreshCw size={15} className="animate-spin" />
                Checking server…
              </div>
            )}

            {/* ── Manual retry button ── */}
            {status === 'offline' && (
              <button
                onClick={retryNow}
                className="w-full flex items-center justify-center gap-2
                  bg-gradient-to-r from-[#0078D7] to-[#025DB6]
                  hover:from-[#0087e0] hover:to-[#0169C9]
                  text-white font-semibold text-sm py-3 rounded-xl
                  shadow-[0_4px_14px_-3px_rgb(0_120_215_/_0.45)]
                  hover:-translate-y-0.5 active:translate-y-0
                  transition-all duration-200"
              >
                <RefreshCw size={15} />
                Try Again Now
              </button>
            )}

            {/* ── Info footer ── */}
            <p className="text-[11px] text-gray-400 text-center">
              Your data is safe. Once connected, everything will reload automatically.
            </p>
          </div>

          {/* ── Bouncing dots at bottom of screen ── */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-[#0078D7]/30"
                style={{
                  animation: 'bounce 1.4s infinite ease-in-out',
                  animationDelay: `${i * 0.22}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0);    opacity: 0.3; }
          40%            { transform: translateY(-8px); opacity: 1;   }
        }
      `}</style>
    </>
  );
}
