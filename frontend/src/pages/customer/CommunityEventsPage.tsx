import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Phone, Mail, User } from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  communityService,
  type MemberEvent,
  type RsvpStatus,
} from '../../services/communityService';

function badge(status: string) {
  if (status === 'Going') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Maybe') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'NotGoing') return 'bg-gray-50 text-gray-600 border-gray-100';
  return 'bg-gray-50 text-gray-500 border-gray-100';
}

export default function CommunityEventsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MemberEvent[]>([]);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<MemberEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await communityService.listEvents();
      setRows(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function setRsvp(ev: MemberEvent, status: RsvpStatus) {
    setSaving(true);
    try {
      await communityService.rsvp(ev.id, status);
      setRows((prev) => prev.map((x) => (x.id === ev.id ? { ...x, myRsvpStatus: status } : x)));
      if (open?.id === ev.id) setOpen({ ...ev, myRsvpStatus: status });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to update RSVP.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#cce7f9] rounded-lg">
          <CalendarDays size={20} className="text-[#0078D7]" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Events</h1>
          <p className="text-sm text-gray-500">What’s happening in your community</p>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] overflow-hidden">
        <div className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No events yet.</div>
          ) : (
            rows.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setOpen(e)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {e.mainImageUrl ? (
                      <img
                        src={e.mainImageUrl}
                        alt={e.title}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-100 flex-none" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(e.startsAt).toLocaleString()}
                      {e.endsAt ? ` – ${new Date(e.endsAt).toLocaleString()}` : ''}
                    </p>
                    {(e.communityName || e.areaName || e.locationText || e.addressText) && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {[e.locationText, e.addressText, e.communityName, e.areaName].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${badge(e.myRsvpStatus)}`}>
                    {e.myRsvpStatus === 'None' ? 'Not responded' : e.myRsvpStatus}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? 'Event'}
        size="lg"
        footer={(
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" loading={saving} onClick={() => open && setRsvp(open, 'Going')}>
                Going
              </Button>
              <Button size="sm" variant="secondary" loading={saving} onClick={() => open && setRsvp(open, 'Maybe')}>
                Maybe
              </Button>
              <Button size="sm" variant="ghost" loading={saving} onClick={() => open && setRsvp(open, 'NotGoing')}>
                Not going
              </Button>
            </div>
            <Button size="sm" onClick={() => setOpen(null)}>Close</Button>
          </div>
        )}
      >
        <div className="space-y-4">
          {open?.mainImageUrl && (
            <img
              src={open.mainImageUrl}
              alt={open.title}
              className="w-full max-h-[280px] object-cover rounded-2xl border border-gray-100"
            />
          )}
          <p className="text-sm text-gray-600">
            <span className="font-semibold">When:</span> {open?.startsAt ? new Date(open.startsAt).toLocaleString() : '—'}
            {open?.endsAt ? ` – ${new Date(open.endsAt).toLocaleString()}` : ''}
          </p>
          {open?.locationText && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> {open.locationText}
            </p>
          )}
          {open?.addressText && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> {open.addressText}
            </p>
          )}
          {(open?.contactPersonName || open?.contactPersonEmail || open?.contactPersonPhone) && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-2">
              {open?.contactPersonName && (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <User size={14} className="text-gray-400" /> {open.contactPersonName}
                </p>
              )}
              {open?.contactPersonEmail && (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" /> {open.contactPersonEmail}
                </p>
              )}
              {open?.contactPersonPhone && (
                <p className="text-sm text-gray-700 flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" /> {open.contactPersonPhone}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{open?.description}</p>
          <div className="text-xs text-gray-400">
            RSVP: <span className="font-semibold text-gray-600">{open?.myRsvpStatus ?? 'None'}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

