import { useState, useEffect } from 'react';
import { Bell, Mail, Save, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface EmailSettings {
  provider: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpUseSsl: boolean;
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

interface NotificationSetting {
  eventType: number;
  notifyCustomer: boolean;
  notifyOrganizer: boolean;
  notifyTenantAdmin: boolean;
}

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const EVENT_LABELS: Record<number, string> = {
  0: 'Booking Created',
  1: 'Booking Confirmed',
  2: 'Booking Rejected',
  3: 'Booking Cancelled',
  4: 'Booking Rescheduled',
  5: 'Complaint Created',
  6: 'Complaint Status Changed',
  7: 'Welcome Organizer',
  8: 'Welcome Customer',
};

const EVENT_GROUPS: { label: string; events: number[] }[] = [
  { label: 'Bookings',    events: [0, 1, 2, 3, 4] },
  { label: 'Complaints',  events: [5, 6] },
  { label: 'Welcome',     events: [7, 8] },
];

const PROVIDER_LABELS: Record<number, string> = { 0: 'SMTP', 1: 'SendGrid', 2: 'Mailgun' };

// â”€â”€ Toast â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Toast({ ok, msg, onClose }: { ok: boolean; msg: string; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white
      ${ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">âœ•</button>
    </div>
  );
}

// â”€â”€ Section card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <Icon size={17} className="text-[#0078D7]" />
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function NotificationSettingsPage() {
  const { tenantId } = useAuth();

  const [loading,  setLoading]  = useState(true);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3500);
  }

  // â”€â”€ Email settings state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [email, setEmail] = useState<EmailSettings>({
    provider: 0,
    smtpUseSsl: true,
    fromEmail: '',
    fromName: '',
  });

  function setE(key: keyof EmailSettings, val: unknown) {
    setEmail(e => ({ ...e, [key]: val }));
  }

  // â”€â”€ Notification settings state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const [notifs, setNotifs] = useState<NotificationSetting[]>(
    Object.keys(EVENT_LABELS).map(k => ({
      eventType: Number(k),
      notifyCustomer: true,
      notifyOrganizer: true,
      notifyTenantAdmin: true,
    }))
  );

  function updateNotif(eventType: number, field: keyof Omit<NotificationSetting, 'eventType'>, val: boolean) {
    setNotifs(n => n.map(s => s.eventType === eventType ? { ...s, [field]: val } : s));
  }

  // â”€â”€ Load on mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    Promise.all([
      api.get<EmailSettings>('/settings/email').then(r => r.data).catch(() => null),
      api.get<NotificationSetting[]>('/settings/notifications').then(r => r.data).catch(() => null),
    ]).then(([emailData, notifData]) => {
      if (emailData) setEmail(emailData);
      if (notifData && notifData.length > 0) setNotifs(notifData);
    }).finally(() => setLoading(false));
  }, [tenantId]);

  // â”€â”€ Save handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async function saveEmailSettings() {
    setSavingEmail(true);
    try {
      await api.put('/settings/email', email);
      showToast(true, 'Email settings saved successfully.');
    } catch {
      showToast(false, 'Failed to save email settings.');
    } finally {
      setSavingEmail(false);
    }
  }

  async function saveNotificationSettings() {
    setSavingNotif(true);
    try {
      await api.put('/settings/notifications', { settings: notifs });
      showToast(true, 'Notification preferences saved.');
    } catch {
      showToast(false, 'Failed to save notification settings.');
    } finally {
      setSavingNotif(false);
    }
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  if (loading) return <Spinner fullPage />;

  return (
    <div className="w-[80%] mx-auto space-y-6">

      {/* â”€â”€ Email Provider â”€â”€ */}
      <SectionCard icon={Mail} title="Email Provider">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Provider</label>
              <div className="relative">
                <select
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  value={email.provider}
                  onChange={e => setE('provider', Number(e.target.value))}
                >
                  {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Name *</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                placeholder="BookingPlatform"
                value={email.fromName}
                onChange={e => setE('fromName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Email *</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                placeholder="noreply@yourdomain.com"
                value={email.fromEmail}
                onChange={e => setE('fromEmail', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reply-To Email</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                placeholder="support@yourdomain.com"
                value={email.replyToEmail ?? ''}
                onChange={e => setE('replyToEmail', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* SMTP fields */}
          {email.provider === 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <p className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">SMTP Settings</p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Host</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  placeholder="smtp.yourdomain.com"
                  value={email.smtpHost ?? ''}
                  onChange={e => setE('smtpHost', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SMTP Port</label>
                <input
                  type="number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  placeholder="587"
                  value={email.smtpPort ?? ''}
                  onChange={e => setE('smtpPort', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  placeholder="username@yourdomain.com"
                  value={email.smtpUsername ?? ''}
                  onChange={e => setE('smtpUsername', e.target.value || undefined)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={email.smtpPassword ?? ''}
                  onChange={e => setE('smtpPassword', e.target.value || undefined)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtp-ssl"
                  className="w-4 h-4 rounded accent-[#0078D7]"
                  checked={email.smtpUseSsl}
                  onChange={e => setE('smtpUseSsl', e.target.checked)}
                />
                <label htmlFor="smtp-ssl" className="text-sm text-gray-700 cursor-pointer">Use SSL/TLS</label>
              </div>
            </div>
          )}

          {/* API key providers */}
          {(email.provider === 1 || email.provider === 2) && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {PROVIDER_LABELS[email.provider]} API Key
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  API Key <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0078D7]/30"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={email.apiKey ?? ''}
                  onChange={e => setE('apiKey', e.target.value || undefined)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="primary" size="sm"
              onClick={saveEmailSettings}
              disabled={savingEmail || !email.fromEmail || !email.fromName}
              className="flex items-center gap-1.5"
            >
              <Save size={13} />
              {savingEmail ? 'Saving...' : 'Save Email Settings'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* â”€â”€ Notification Events â”€â”€ */}
      <SectionCard icon={Bell} title="Notification Preferences">
        <div className="space-y-6">
          <p className="text-sm text-gray-500">
            Control which recipients receive emails for each event. All are enabled by default.
          </p>

          {EVENT_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {group.label}
              </p>
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2 text-left font-medium">Event</th>
                      <th className="px-4 py-2 text-center font-medium w-28">Customer</th>
                      <th className="px-4 py-2 text-center font-medium w-28">Organizer</th>
                      <th className="px-4 py-2 text-center font-medium w-28">Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.events.map(evt => {
                      const setting = notifs.find(s => s.eventType === evt)!;
                      return (
                        <tr key={evt} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-gray-700">{EVENT_LABELS[evt]}</td>
                          {(['notifyCustomer', 'notifyOrganizer', 'notifyTenantAdmin'] as const).map(field => (
                            <td key={field} className="px-4 py-2.5 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-[#0078D7]"
                                checked={setting[field]}
                                onChange={e => updateNotif(evt, field, e.target.checked)}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              variant="primary" size="sm"
              onClick={saveNotificationSettings}
              disabled={savingNotif}
              className="flex items-center gap-1.5"
            >
              <Save size={13} />
              {savingNotif ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Toast */}
      {toast && <Toast ok={toast.ok} msg={toast.msg} onClose={() => setToast(null)} />}
    </div>
  );
}


