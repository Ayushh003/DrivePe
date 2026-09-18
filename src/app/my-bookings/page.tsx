'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  QrCode, 
  Car as CarIcon,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { Booking } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review Modal state
  const [reviewCarId, setReviewCarId] = useState<string | null>(null);
  const [reviewCarName, setReviewCarName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchBookings = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/bookings?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (e) {
      console.error('Failed to load bookings', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookings();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCarId || !reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: reviewCarId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewSuccess(false);
          setReviewCarId(null);
          setReviewComment('');
        }, 1500);
      }
    } catch (e) {
      console.error('Failed to post review', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved & Confirmed
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Payment Under Review
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Completed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
          <CalendarCheck className="w-8 h-8 text-brand-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to view your bookings</h2>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          Track your reservation status, UPI payment verification, and car details.
        </p>
        <Link
          href="/login?callbackUrl=/my-bookings"
          className="btn-primary"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider block mb-1">
              Account
            </span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                My Bookings & Payments
              </h1>
              {bookings.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Check payment verification status and view pickup instructions for your booked cars.
            </p>
          </div>

          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-xs transition-colors disabled:opacity-60"
            title="Refresh bookings list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-subtle">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <CarIcon className="w-7 h-7 text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No bookings yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You haven't reserved any cars yet. Browse our collection to find your next ride!
            </p>
            <Link
              href="/cars"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>Explore Available Cars</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-subtle flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-card transition-all"
              >
                {/* Left: Car Details & Thumbnail */}
                <div className="flex items-center gap-4">
                  <img
                    src={
                      booking.car?.images?.[0] ||
                      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={booking.car?.model || 'Car'}
                    className="w-24 h-20 sm:w-28 sm:h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-500">ID #{booking.id.slice(-6)}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{formatDate(booking.createdAt)}</span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {booking.car?.brand} {booking.car?.model}
                    </h3>

                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {formatDate(booking.startDate)} &rarr; {formatDate(booking.endDate)} ({booking.totalDays} Days)
                    </p>

                    {/* UTR Pill */}
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                      <QrCode className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-slate-500">UTR:</span>
                      <span className="font-mono text-slate-800 font-semibold">{booking.utrNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Status */}
                <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right">
                    <span className="text-xs text-slate-500 block">Total Amount</span>
                    <p className="text-xl font-bold text-slate-900">
                      {formatCurrency(booking.totalPrice)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(booking.status)}

                    {/* Review CTA if Approved or Completed */}
                    {(booking.status === 'APPROVED' || booking.status === 'COMPLETED') && booking.car && (
                      <button
                        onClick={() => {
                          setReviewCarId(booking.carId);
                          setReviewCarName(`${booking.car?.brand} ${booking.car?.model}`);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline mt-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Write a Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {reviewCarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Rate {reviewCarName}</h3>

            {reviewSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-bold">
                Thank you! Your review has been submitted.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1 text-2xl focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Experience</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell other customers about car condition, comfort, and performance..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewCarId(null)}
                    className="btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary text-xs"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
