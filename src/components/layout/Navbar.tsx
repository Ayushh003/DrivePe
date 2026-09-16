'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Car, 
  ShieldCheck, 
  CalendarCheck, 
  User, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  ChevronDown
} from 'lucide-react';

import Logo from '@/components/common/Logo';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const navLinks = [
    { name: 'Browse Cars', href: '/cars' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Why Choose Us', href: '/#benefits' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Logo size="md" theme="light" href="/" />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-150 ${
                    isActive ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Customer My Bookings */}
            {session && !isAdmin && (
              <Link
                href="/my-bookings"
                className={`text-sm font-medium flex items-center gap-2 transition-colors ${
                  pathname === '/my-bookings' ? 'text-blue-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                My Bookings
              </Link>
            )}

            {/* Admin Portal Link */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {session.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[120px]">
                      {session.user?.name || 'User'}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium capitalize">
                      {(session.user as any)?.role?.toLowerCase() || 'customer'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/cars"
                  className="btn-primary text-sm shadow-sm"
                >
                  Rent a Car
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-base font-medium text-slate-700 hover:text-blue-600"
            >
              {link.name}
            </Link>
          ))}

          {session && !isAdmin && (
            <Link
              href="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-base font-medium text-slate-700 hover:text-blue-600"
            >
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              My Bookings
            </Link>
          )}

          {isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs uppercase text-slate-400 font-semibold mb-2">Admin Options</p>
              <div className="space-y-2">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1.5 text-sm font-medium text-slate-800 hover:text-blue-600"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/cars"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1.5 text-sm font-medium text-slate-800 hover:text-blue-600"
                >
                  <Car className="w-4 h-4 text-blue-600" />
                  Manage Cars
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            {session ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{session.user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{(session.user as any)?.role?.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1.5 text-xs text-red-600 font-medium py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary text-center text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary text-center text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
