'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  QrCode, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  ArrowRight,
  Headphones
} from 'lucide-react';

import Logo from '@/components/common/Logo';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Simple & Decent CTA Banner */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Ready to rent your self-drive car?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Instant booking with verified UPI QR payment and doorstep delivery.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/cars"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2"
            >
              <span>Browse Cars</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>+91 9067XXXX89</span>
            </div>
          </div>
        </div>

        {/* Clean 4-Column Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Logo size="lg" theme="dark" href="/" />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              DrivePe is India&apos;s trusted self-drive car rental service. Clean, well-maintained cars with transparent pricing and zero security deposit hassles.
            </p>
            <div className="flex flex-wrap gap-y-1.5 gap-x-4 pt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified Fleet
              </span>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-400" /> Instant UPI
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> 100% Insured
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/cars" className="hover:text-white transition-colors">All Cars</Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="/#benefits" className="hover:text-white transition-colors">Why Choose Us</Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-white transition-colors">My Bookings</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Categories (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">
              Car Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/cars?category=Hatchback" className="hover:text-white transition-colors">City Hatchbacks</Link>
              </li>
              <li>
                <Link href="/cars?category=Crossover" className="hover:text-white transition-colors">Urban Crossovers</Link>
              </li>
              <li>
                <Link href="/cars?category=Compact%20SUV" className="hover:text-white transition-colors">Compact SUVs</Link>
              </li>
              <li>
                <Link href="/cars?category=SUV" className="hover:text-white transition-colors">7-Seater Family SUVs</Link>
              </li>
              <li>
                <Link href="/cars?category=Electric" className="hover:text-white transition-colors">Electric Vehicles (EV)</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Help (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">
              Support & Contact
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-300">+91 9067XXXX89 (Helpline)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@drivepe.in" className="text-slate-300 hover:text-white transition-colors">
                  support@drivepe.in
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-slate-300">Mumbai, Delhi NCR, Bengaluru</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-medium">24x7 Customer Support</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Decent Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} DrivePe Mobility. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/cars" className="hover:text-slate-300 transition-colors">Browse Fleet</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Login</Link>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">UPI Verified & Secure</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

