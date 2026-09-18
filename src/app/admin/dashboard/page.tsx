'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Car, 
  CreditCard, 
  CalendarCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  TrendingUp, 
  QrCode, 
  Plus, 
  Check, 
  X,
  Copy
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Booking } from '@/types';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/dashboard');
      return;
    }

    if (session && (session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    if (session) {
      loadAnalytics();
    }
  }, [session, status, router]);

  async function loadAnalytics() {
    try {
      const res = await fetch(`/api/analytics?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (bookingId: string, newStatus: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadAnalytics();
      }
    } catch (e) {
      console.error('Failed to update booking status', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200">
                Admin Panel
              </span>
              <span className="text-xs text-slate-500">Welcome, {session.user?.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Fleet & Booking Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/cars"
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <Car className="w-4 h-4 text-brand-600" />
              <span>Manage Cars</span>
            </Link>
            <Link
              href="/admin/bookings"
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Bookings</span>
            </Link>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Revenue */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Approved Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Under verification: {formatCurrency(analytics?.pendingRevenue || 0)}
            </p>
          </div>

          {/* Total Fleet */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Cars</span>
              <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {analytics?.totalCars || 0}
            </p>
            <p className="text-xs text-emerald-600 font-medium mt-2">
              {analytics?.availableCars || 0} available for rent
            </p>
          </div>

          {/* Pending Approvals */}
          <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-subtle relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Payments</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {analytics?.pendingBookings || 0}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Requires UTR check
            </p>
          </div>

          {/* Active Bookings */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle relative">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {analytics?.activeBookings || 0}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {analytics?.completedBookings || 0} completed rentals
            </p>
          </div>
        </div>

        {/* Pending UPI Verification Queue */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-subtle mb-8">
          <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Recent Bookings
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-semibold">
                  Queue
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify customer UTR reference numbers in your bank app to approve or decline reservations.
              </p>
            </div>

            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {analytics?.recentBookings && analytics.recentBookings.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {analytics.recentBookings.map((b: Booking) => (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Customer & Car Info */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{b.customerName}</h4>
                        <span className="text-xs text-slate-500 font-mono">({b.customerPhone})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Car: <strong className="text-slate-900">{b.car?.brand} {b.car?.model}</strong> • {formatDate(b.startDate)} &rarr; {formatDate(b.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* UTR & Price */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    {/* UTR Pill with Copy */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                      <QrCode className="w-3.5 h-3.5 text-brand-600" />
                      <span className="text-slate-500">UTR:</span>
                      <span className="font-mono font-bold text-slate-800">{b.utrNumber}</span>
                      <button
                        onClick={() => copyToClipboard(b.utrNumber)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="Copy UTR ID"
                      >
                        {copiedUtr === b.utrNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 block">
                        {formatCurrency(b.totalPrice)}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          b.status === 'APPROVED'
                            ? 'text-emerald-600'
                            : b.status === 'PENDING'
                            ? 'text-amber-600'
                            : b.status === 'COMPLETED'
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }`}
                      >
                        {b.status === 'PENDING' ? 'Under Review' : b.status}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    {b.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'APPROVED')}
                          disabled={updatingId === b.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'REJECTED')}
                          disabled={updatingId === b.id}
                          className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-medium transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No recent bookings in the queue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
