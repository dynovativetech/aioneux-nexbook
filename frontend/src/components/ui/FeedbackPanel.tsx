import { useEffect, useState } from 'react';
import Button from './Button';
import RatingStars from './RatingStars';
import Spinner from './Spinner';
import { feedbackService, type FeedbackDto, type FeedbackTargetType } from '../../services/feedbackService';

export default function FeedbackPanel({
  targetType,
  targetId,
}: {
  targetType: FeedbackTargetType;
  targetId: number;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [list, setList] = useState<FeedbackDto[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await feedbackService.list(targetType, targetId);
      setList(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [targetType, targetId]);

  async function submit() {
    setSaving(true);
    setErr('');
    try {
      await feedbackService.upsert({
        targetType,
        targetId,
        rating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save feedback.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_0_rgb(0_0_0_/_0.06)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-800">Feedback</p>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Write your feedback (optional)"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0078D7]/20"
      />

      {err && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-600">
          {err}
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" loading={saving} onClick={submit}>Submit</Button>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-3">
        {list.length === 0 ? (
          <p className="text-sm text-gray-400">No feedback yet.</p>
        ) : (
          list.slice(0, 10).map((f) => (
            <div key={f.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <RatingStars value={f.rating} readOnly />
                <span className="text-[11px] text-gray-400">{new Date(f.updatedAt).toLocaleString()}</span>
              </div>
              {f.comment && <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

