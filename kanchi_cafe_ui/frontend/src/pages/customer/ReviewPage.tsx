import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { Star, Send, CheckCircle2 } from 'lucide-react';

const RATING_LABELS: { [key: number]: string } = {
  1: '1 / 5 • Poor',
  2: '2 / 5 • Fair',
  3: '3 / 5 • Good',
  4: '4 / 5 • Very Good',
  5: '5 / 5 • Excellent!',
};

export const ReviewPage: React.FC = () => {
  const { pendingReviewOrder, setPendingReviewOrder, refreshOrders } = useCustomer();
  const navigate = useNavigate();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const activeDisplayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingReviewOrder) {
      navigate('/history');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/reviews', {
        orderId: pendingReviewOrder.id,
        rating,
        comment,
      });

      if (res.data.success) {
        setSubmitted(true);
        setPendingReviewOrder(null);
        await refreshOrders();
        setTimeout(() => {
          navigate('/history');
        }, 1800);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {submitted ? (
          <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-8 text-center space-y-4 shadow-xl my-8">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
              Thank You!
            </h2>
            <p className="text-xs text-cafe-600 dark:text-cream-200/80">
              Your feedback has been saved and helps us make Kanchi Cafe even better.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase text-gold-500 tracking-wider">
                FEEDBACK & REVIEW
              </span>
              <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 mt-1">
                How was your experience?
              </h2>
              <p className="text-xs text-cafe-600 dark:text-cream-200/70 mt-1">
                KOT: <strong className="font-mono text-gold-400">{pendingReviewOrder?.kotNumber || 'Recent Order'}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Interactive Selector */}
              <div className="text-center space-y-2">
                <div className="flex justify-center items-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= activeDisplayRating;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 focus:outline-none transform hover:scale-125 transition-transform duration-150"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors duration-200 ${
                            isFilled
                              ? 'fill-[#FBBF24] text-[#FBBF24] filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                              : 'fill-transparent text-cafe-300 dark:text-cafe-700'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Rating Label */}
                <p className="font-mono text-xs font-bold text-gold-500 dark:text-gold-300 transition-all">
                  {RATING_LABELS[activeDisplayRating] || 'Tap stars to rate'}
                </p>
              </div>

              {/* Comment Box */}
              <div>
                <label className="block text-xs font-semibold text-cafe-800 dark:text-gold-300 mb-1.5">
                  Comments or Suggestions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your thoughts about food taste, service, or cleanliness..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-2xl p-3 text-xs text-cafe-900 dark:text-cream-100 placeholder-cafe-400 dark:placeholder-cream-200/40 outline-none focus:border-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Submit Review'} <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
};
