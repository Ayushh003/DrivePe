'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  QrCode, 
  Car as CarIcon, 
  Mail, 
  Phone, 
  User, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Booking, BookingStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/bookings');
      return;
    }
    if (session && (session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (session) {
      loadBookings();
    }
  }, [session, status, router]);

  async function loadBookings(isManual = false) {
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
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setActionLoadingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setToastMessage(`Booking #${bookingId} status updated to ${newStatus}. Customer notified by email.`);
        setTimeout(() => setToastMessage(null), 4000);
        await loadBookings();
      }
    } catch (e) {
      console.error('Failed to update status', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.utrNumber.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.car?.model && b.car.model.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-24 right-8 z-50 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-card flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Overview</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Verify Bookings & Payments
              </h1>
              {bookings.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {bookings.length} Total
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Check customer 12-digit UTR IDs with your UPI bank account to approve or reject reservations.
            </p>
          </div>

          <button
            onClick={() => loadBookings(true)}
            disabled={refreshing}
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 shadow-xs transition-colors disabled:opacity-60"
            title="Refresh bookings list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Bookings'}</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 mb-6 space-y-3 shadow-subtle">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, UTR..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
              {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {st === 'PENDING' ? 'Pending' : st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Car</th>
                  <th className="p-4">Dates</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">UPI UTR Number</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-500">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-brand-600" />
                            {b.customerName}
                          </p>
                          <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                            <p className="flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-400" /> {b.customerEmail}
                            </p>
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {b.customerPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              b.car?.images?.[0] ||
                              'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=300&q=80'
                            }
                            alt="Car"
                            className="w-14 h-10 object-cover rounded-lg border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">
                              {b.car?.brand} {b.car?.model}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatCurrency(b.car?.pricePerDay || 0)} /day
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="p-4 text-slate-600">
                        <div>
                          <p className="text-slate-900 font-medium">
                            {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}
                          </p>
                          <span className="text-xs text-slate-500">
                            {b.totalDays} Day{b.totalDays > 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="p-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(b.totalPrice)}
                        </span>
                      </td>

                      {/* PROMINENT UTR NUMBER WITH COPY BUTTON */}
                      <td className="p-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                          <QrCode className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span className="font-mono font-bold text-slate-900">
                            {b.utrNumber}
                          </span>
                          <button
                            onClick={() => copyToClipboard(b.utrNumber)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Copy UTR ID"
                          >
                            {copiedUtr === b.utrNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {b.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                          </span>
                        ) : b.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Under Review
                          </span>
                        ) : b.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'APPROVED')}
                                disabled={actionLoadingId === b.id}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Verify UTR and approve booking"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'REJECTED')}
                                disabled={actionLoadingId === b.id}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs transition-all disabled:opacity-50"
                                title="Decline booking / invalid UTR"
                              >
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {b.status === 'APPROVED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                                disabled={actionLoadingId === b.id}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 flex items-center gap-1"
                                title="Mark as completed after car return"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Completed</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, 'REJECTED')}
                                disabled={actionLoadingId === b.id}
                                className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs transition-all disabled:opacity-50"
                                title="Cancel booking"
                              >
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                          {b.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>Closed</span>
                            </span>
                          )}

                          {b.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60">
                              <XCircle className="w-3.5 h-3.5 text-red-400" />
                              <span>Closed</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
