'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency, formatDate, calculateDaysBetween } from '@/lib/utils';

interface UpiPaymentModalProps {
  car: Car;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export default function UpiPaymentModal({
  car,
  startDate,
  endDate,
  onClose,
}: UpiPaymentModalProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [customerName, setCustomerName] = useState(session?.user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(session?.user?.email || '');
  const [customerPhone, setCustomerPhone] = useState((session?.user as any)?.phone || '');
  const [utrNumber, setUtrNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Keep customer name and email in sync when session loads
  useEffect(() => {
    if (session?.user) {
      if (!customerName && session.user.name) setCustomerName(session.user.name);
      if (!customerEmail && session.user.email) setCustomerEmail(session.user.email);
      if (!customerPhone && (session.user as any)?.phone) setCustomerPhone((session.user as any).phone);
    }
  }, [session, customerName, customerEmail, customerPhone]);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedBookingId, setSubmittedBookingId] = useState('');

  const upiId = process.env.NEXT_PUBLIC_ADMIN_UPI_ID || 'drivepe@okaxis';
  const upiName = process.env.NEXT_PUBLIC_ADMIN_UPI_NAME || 'DrivePe Mobility';
  const qrImage = process.env.NEXT_PUBLIC_ADMIN_QR_IMAGE || '/images/qr/phonepe-qr.jpg';

  const totalDays = calculateDaysBetween(startDate, endDate);
  const rentalTotal = totalDays * car.pricePerDay;
  const securityDeposit = Math.round(car.pricePerDay * 0.2); // 20% refundable deposit
  const grandTotal = rentalTotal + securityDeposit;

  // Generate real UPI Pay URI and render QR (used as fallback or for dynamic apps)
  useEffect(() => {
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
      upiName
    )}&am=${grandTotal}&cu=INR&tn=${encodeURIComponent(`Booking-${car.brand}-${car.model}`)}`;

    QRCode.toDataURL(upiUri, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [upiId, upiName, grandTotal, car]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (status !== 'authenticated' || !session?.user) {
      setErrorMsg('You must be signed in to complete this booking.');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone || !utrNumber) {
      setErrorMsg('Please fill all required fields and enter the UPI Transaction ID.');
      return;
    }

    if (utrNumber.trim().length < 8) {
      setErrorMsg('Please enter a valid 12-digit UPI Transaction / UTR ID.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          startDate,
          endDate,
          customerName,
          customerEmail,
          customerPhone,
          utrNumber: utrNumber.trim(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit booking');
        setSubmitting(false);
        return;
      }

      // Success
      setIsSuccess(true);
      setSubmittedBookingId(data.booking?.id || 'NEW');

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      setErrorMsg('Network error while submitting booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // If user is not logged in, show authentication required modal gate
  if (status === 'unauthenticated' || (!session && status !== 'loading')) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-md my-8 rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Sign In Required to Rent Car
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Please sign in to your account before booking the <strong>{car.brand} {car.model}</strong>. This ensures verified booking security and instant email notifications.
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => router.push(`/login?callbackUrl=/cars/${car.id}`)}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In to Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/register?callbackUrl=/cars/${car.id}`)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
            >
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const maskUpiId = (id: string) => {
    return id.replace(/(\d{5})\d+(\d{4})/, '$1XXXX$2');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-extrabold text-slate-900">
                Pay with UPI & Confirm Booking
              </h3>
              <p className="text-xs text-slate-500">
                Scan with Google Pay, PhonePe, or Paytm and enter the 12-digit transaction ID.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: QR Code & UPI */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-50/90 border border-slate-200/80 text-center shadow-xs">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200/60 mb-3 shadow-xs">
                  <span>⚡ Scan & Pay with Any UPI App</span>
                </div>

                {/* QR Code Container - Clean Zoomed Square */}
                <div className="p-3 bg-black rounded-2xl shadow-md border border-slate-800 mb-3 overflow-hidden flex items-center justify-center group">
                  <img
                    src={qrImage}
                    alt="Official UPI QR Code"
                    className="w-44 h-44 object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      if (qrDataUrl) {
                        (e.target as HTMLImageElement).src = qrDataUrl;
                      }
                    }}
                  />
                </div>

                {/* Amount to Pay */}
                <div className="mb-3">
                  <span className="text-[11px] text-slate-500 font-medium">Total Payable Amount</span>
                  <p className="text-2xl font-heading font-extrabold text-blue-600 tracking-tight">
                    {formatCurrency(grandTotal)}
                  </p>
                </div>

                {/* Copy UPI ID with Masked Display */}
                <div className="w-full">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-xs">
                    <div className="text-left overflow-hidden">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">UPI ID</span>
                      <span className="font-mono font-medium text-slate-700 truncate block text-xs">{maskUpiId(upiId)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors ml-2 flex-shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PhonePe • GPay • Paytm • BHIM</span>
                </div>
              </div>

              {/* Right: Booking Form */}
              <div className="lg:col-span-7 space-y-4">
                {/* Car Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <img
                    src={car.images[0]}
                    alt={car.model}
                    className="w-14 h-11 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {car.brand} {car.model}
                    </h4>
                    <p className="text-xs text-blue-600 font-medium">
                      {formatCurrency(car.pricePerDay)} / day
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">
                      {totalDays} Day{totalDays > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {formatDate(startDate)}
                    </span>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Arjun Kapoor"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 9067XXXX89"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* 12-Digit UTR ID Field */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center justify-between">
                    <span>12-Digit UPI Transaction / UTR ID *</span>
                    <span className="text-[11px] text-blue-700 font-normal">From your UPI payment receipt</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 428194829104"
                    maxLength={24}
                    className="w-full bg-white border border-blue-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Admin verifies this transaction ID before booking confirmation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Airport pickup at Terminal 2"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2.5 px-5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Booking</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Booking Request Submitted!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your transaction (UTR: <strong className="font-mono text-slate-800">{utrNumber}</strong>) has been received for verification.
              </p>
            </div>

            <div className="max-w-sm mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID:</span>
                <span className="text-slate-900 font-mono font-bold">#{submittedBookingId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="text-slate-900 font-medium">{car.brand} {car.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500 font-medium">Total Amount:</span>
                <span className="text-blue-600 font-bold font-mono">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              A confirmation email was sent to <span className="text-slate-800 font-medium">{customerEmail}</span>.
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  window.location.href = '/my-bookings';
                }}
                className="btn-primary text-xs py-2.5 px-6"
              >
                View My Bookings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
