import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Review } from '../../types';
import { PasswordConfirmModal } from '../../components/admin/PasswordConfirmModal';
import { Star, MessageSquare, Trash2, Reply } from 'lucide-react';

export const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = '/reviews?limit=30';
      if (ratingFilter) url += `&rating=${ratingFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  const handleSendReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      await api.put(`/reviews/${reviewId}/reply`, { adminReply: replyText.trim() });
      setReplyingReviewId(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReviewConfirm = async (password: string) => {
    if (!deleteTargetId) return;
    await api.post(`/reviews/${deleteTargetId}/delete`, { password });
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <Star className="w-6 h-6 text-gold-500 fill-current" /> Customer Reviews & Replies
          </h1>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            View 5-star customer ratings, respond to feedback, and manage review records
          </p>
        </div>

        {/* Rating Filter Buttons */}
        <div className="flex items-center gap-1 bg-white dark:bg-cafe-900 p-1 rounded-2xl border border-cafe-200 dark:border-gold-500/20 text-xs">
          <button
            onClick={() => setRatingFilter('')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              ratingFilter === '' ? 'bg-gold-500 text-cafe-950 shadow' : 'text-cafe-700 dark:text-cream-200'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(String(r))}
              className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition ${
                ratingFilter === String(r) ? 'bg-gold-500 text-cafe-950 shadow' : 'text-cafe-700 dark:text-cream-200'
              }`}
            >
              {r} <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-gold-400 font-mono text-xs animate-pulse">
          Loading Reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-8 text-center text-cafe-500 dark:text-cream-200/50">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-sm">No reviews found matching filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-cafe-900 border border-cafe-100 dark:border-gold-500/10 rounded-[18px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-5 h-5 transition-transform duration-200 hover:scale-110"
                        fill={s <= rev.rating ? '#D4AF37' : '#D8D8D8'}
                        stroke={s <= rev.rating ? '#D4AF37' : '#D8D8D8'}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setDeleteTargetId(rev.id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition duration-200"
                    title="Delete Review (Password Protected)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Speech Bubble Comment Box */}
                <div className="relative bg-cafe-50/50 dark:bg-cafe-950/40 border border-cafe-200/40 dark:border-gold-500/10 p-4 rounded-2xl mt-2 mb-2">
                  <p className="text-sm font-semibold italic text-cafe-900 dark:text-cream-100">
                    "{rev.comment || 'No comment provided'}"
                  </p>
                  <div className="absolute top-[-6px] left-6 w-3 h-3 bg-[#FAF9F6] dark:bg-[#1e130c] border-t border-l border-cafe-200/40 dark:border-gold-500/10 rotate-45"></div>
                </div>

                <div className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-cafe-100 dark:border-gold-500/10 pt-2">
                  <div>
                    <span className="font-bold text-cafe-900 dark:text-cream-100 text-sm">
                      {rev.customer?.name || 'Guest'}
                    </span>
                    <span className="text-[11px] font-normal text-cafe-500 dark:text-cream-200/50 ml-1.5 font-mono">
                      (+91 {rev.customer?.mobile})
                    </span>
                  </div>
                  <span className="bg-gold-500/15 text-gold-700 dark:text-gold-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border border-gold-500/20">
                    KOT: {rev.order?.kotNumber || 'PENDING'}
                  </span>
                </div>

                {/* Existing Admin Reply */}
                {rev.adminReply && (
                  <div className="bg-gold-500/5 border border-gold-500/25 p-3.5 rounded-2xl text-xs space-y-1">
                    <span className="text-gold-600 dark:text-gold-400 font-extrabold flex items-center gap-1">
                      <Reply className="w-3.5 h-3.5" /> Cafe Response:
                    </span>
                    <p className="text-cafe-700 dark:text-cream-200 font-medium leading-relaxed">{rev.adminReply}</p>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              {replyingReviewId === rev.id ? (
                <div className="space-y-2 pt-2 border-t border-cafe-100 dark:border-gold-500/10">
                  <textarea
                    rows={2}
                    placeholder="Type official admin response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-cream-50 dark:bg-cafe-950 border border-gold-500/30 rounded-xl p-2 text-xs text-cafe-900 dark:text-cream-100 outline-none"
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setReplyingReviewId(null)}
                      className="px-3 py-1 bg-cafe-50 border border-cafe-200 text-cafe-800 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSendReply(rev.id)}
                      className="px-3 py-1 bg-gold-500 text-cafe-950 font-bold rounded-lg shadow"
                    >
                      Send Reply
                    </button>
                  </div>
                </div>
              ) : (
                !rev.adminReply && (
                  <button
                    onClick={() => {
                      setReplyText('');
                      setReplyingReviewId(rev.id);
                    }}
                    className="border border-gold-500/40 hover:bg-gold-500 hover:text-cafe-950 text-gold-600 dark:text-gold-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition shadow-sm self-start"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply to Review
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Password Confirmation Modal */}
      <PasswordConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Customer Review"
        message="This will permanently delete this review entry. Admin password is required."
        onConfirm={handleDeleteReviewConfirm}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
