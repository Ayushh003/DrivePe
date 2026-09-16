'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Star, 
  Fuel, 
  ShieldCheck, 
  Calendar, 
  Check, 
  MapPin, 
  Users, 
  QrCode, 
  MessageSquarePlus,
  Settings2,
  Gauge,
  Timer
} from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency, formatDate, calculateDaysBetween } from '@/lib/utils';
import UpiPaymentModal from '@/components/booking/UpiPaymentModal';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const carId = params?.id as string;

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic Date Range Picker
  const today = new Date().toISOString().split('T')[0];
  const nextTwoDays = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextTwoDays);

  // Booking Modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Review Form Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function fetchCar() {
      try {
        const res = await fetch(`/api/cars/${carId}`);
        const data = await res.json();
        if (res.ok) {
          setCar(data);
        }
      } catch (e) {
        console.error('Failed to load car details', e);
      } finally {
        setLoading(false);
      }
    }
    if (carId) fetchCar();
  }, [carId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Car Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The requested car does not exist or has been removed.</p>
        <Link
          href="/cars"
          className="btn-primary text-xs"
        >
          Return to Cars Catalog
        </Link>
      </div>
    );
  }

  const rentalDays = calculateDaysBetween(startDate, endDate);
  const rentalTotal = rentalDays * car.pricePerDay;
  const securityDeposit = Math.round(car.pricePerDay * 0.2);
  const grandTotal = rentalTotal + securityDeposit;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.review) {
        setCar((prev) => {
          if (!prev) return null;
          const updatedReviews = [data.review, ...(prev.reviews || [])];
          const newAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
          return {
            ...prev,
            reviews: updatedReviews,
            rating: Number(newAvg.toFixed(2)),
            reviewsCount: updatedReviews.length,
          };
        });
        setShowReviewModal(false);
        setReviewComment('');
      }
    } catch (e) {
      console.error('Failed to submit review', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/cars"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all cars</span>
        </Link>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {car.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">Model Year {car.year}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              {car.brand} {car.model}
            </h1>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-subtle">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-slate-900">{car.rating.toFixed(2)}</span>
              <span className="text-xs text-slate-500">({car.reviewsCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Gallery & Pricing Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Gallery - 7 cols */}
          <div className="lg:col-span-7 space-y-3">
            {/* Main Image */}
            <div className="relative h-[340px] sm:h-[420px] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-card">
              <img
                src={car.images[activeImageIndex] || car.images[0]}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 text-xs font-medium text-slate-800 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Available in {car.location}</span>
              </div>
            </div>

            {/* Thumbnails */}
            {car.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {car.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-blue-600 shadow-sm scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Calculator - 5 cols */}
          <div className="lg:col-span-5">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-5 sticky top-24">
              <div>
                <span className="text-xs text-slate-500 block font-medium">Rental Tariff</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatCurrency(car.pricePerDay)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ day</span>
                </div>
              </div>

              {/* Date Selection */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Select Dates
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Pickup Date</label>
                    <input
                      type="date"
                      min={today}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Return Date</label>
                    <input
                      type="date"
                      min={startDate || today}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs border-y border-slate-100 py-3.5">
                <div className="flex justify-between text-slate-600">
                  <span>Duration</span>
                  <span className="text-slate-900 font-semibold">
                    {rentalDays} {rentalDays === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Daily Rate ({formatCurrency(car.pricePerDay)} × {rentalDays})</span>
                  <span className="text-slate-900 font-semibold">{formatCurrency(rentalTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Refundable Security Deposit</span>
                  <span className="text-slate-900 font-semibold">+{formatCurrency(securityDeposit)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Insurance</span>
                  <span className="text-emerald-600 font-semibold">Free (Included)</span>
                </div>
                <div className="pt-2 flex justify-between items-baseline text-sm font-bold border-t border-slate-100">
                  <span className="text-slate-900">Total Amount</span>
                  <span className="text-2xl font-black text-blue-600">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Book Button */}
              <button
                onClick={() => {
                  if (!session) {
                    router.push(`/login?callbackUrl=/cars/${car.id}`);
                    return;
                  }
                  setIsBookingOpen(true);
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>{session ? 'Book with UPI QR' : 'Sign in to Rent Car'}</span>
              </button>

              <div className="space-y-1 text-xs text-slate-500 text-center">
                <p className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant booking verification via UPI
                </p>
                <p className="text-[11px]">Free cancellation up to 24 hours before pickup.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Specs & Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left: Specs */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
              <h3 className="text-lg font-bold text-slate-900">About this car</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {car.description}
              </p>
            </div>

            {/* Performance Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
                <Gauge className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Power</span>
                <span className="text-base font-bold text-slate-900">{car.horsepower || 500} HP</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
                <Timer className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 uppercase font-medium block">0-100 km/h</span>
                <span className="text-base font-bold text-slate-900">{car.acceleration || '3.2s'}</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
                <Fuel className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Fuel</span>
                <span className="text-base font-bold text-slate-900">{car.fuelType}</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 text-center shadow-subtle">
                <Users className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
                <span className="text-[10px] text-slate-400 uppercase font-medium block">Seats</span>
                <span className="text-base font-bold text-slate-900">{car.seats} Seats</span>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card">
              <h3 className="text-base font-bold text-slate-900 mb-3">Features & Equipment</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {car.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Requirements */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-card space-y-3">
              <h4 className="text-sm font-bold text-slate-900">
                Rental Requirements
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Valid Driving License (Min. 2 years experience)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Govt. ID Proof (Aadhaar or Passport)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>12-digit UPI transaction UTR after payment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Customer Reviews</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ratings and feedback from verified drivers.</p>
            </div>

            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-subtle"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Write a Review</span>
            </button>
          </div>

          {car.reviews && car.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {car.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-subtle"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                        {rev.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          {rev.userName || 'Verified Driver'}
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold">
                            Verified
                          </span>
                        </p>
                        <span className="text-[10px] text-slate-400">{formatDate(rev.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center">
              <p className="text-xs text-slate-500">
                No reviews yet. Be the first to share your rental experience!
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <UpiPaymentModal
          car={car}
          startDate={startDate}
          endDate={endDate}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Review {car.brand} {car.model}</h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your driving experience..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
