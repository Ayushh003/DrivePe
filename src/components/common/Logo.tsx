'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  href?: string;
  className?: string;
}

export default function Logo({
  size = 'md',
  theme = 'light',
  showTagline = true,
  href = '/',
  className = '',
}: LogoProps) {
  const isDark = theme === 'dark';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const content = (
    <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
      {/* Sleek, Clean Iconic Mobility Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 transition-transform duration-200 group-hover:scale-105`}>
        {/* Soft Ambient Shadow Glow */}
        <div className="absolute inset-0 rounded-xl bg-blue-600/30 blur-sm group-hover:bg-blue-600/40 transition-colors" />

        {/* Emblem Surface */}
        <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-sm text-white overflow-hidden p-2">
          {/* Subtle light reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

          {/* Clean Modern Car Silhouette + Speed Velocity Vector */}
          <svg
            className="w-full h-full relative z-10 drop-shadow-sm"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Aerodynamic Sportscar Roofline & Body */}
            <path
              d="M3 14.5L5.5 8.8C5.9 7.8 6.9 7.2 8 7.2H16C17.1 7.2 18.1 7.8 18.5 8.8L21 14.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 14.5H22C22.6 14.5 23 15 23 15.6V18C23 18.6 22.6 19 22 19H2C1.4 19 1 18.6 1 18V15.6C1 15 1.4 14.5 2 14.5Z"
              fill="currentColor"
            />
            {/* Sport Wheels */}
            <circle cx="6" cy="18.5" r="2" fill="#0f172a" stroke="white" strokeWidth="1.2" />
            <circle cx="18" cy="18.5" r="2" fill="#0f172a" stroke="white" strokeWidth="1.2" />
            {/* Sleek Windshield & Side Glass */}
            <path
              d="M6.8 13.5L8.5 9H11.5V13.5H6.8Z"
              fill="#0f172a"
              fillOpacity="0.35"
            />
            <path
              d="M12.5 13.5V9H15.5L17.2 13.5H12.5Z"
              fill="#0f172a"
              fillOpacity="0.35"
            />
            {/* Speed Light Streak */}
            <circle cx="20.5" cy="16" r="0.8" fill="#38bdf8" />
            <circle cx="3.5" cy="16" r="0.8" fill="#38bdf8" />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark Text - Clean & Decent */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center tracking-tight">
          <span className={`font-extrabold ${textSizes[size]} tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Drive
          </span>
          <span className={`font-extrabold ${textSizes[size]} tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
            Pe
          </span>
        </div>

        {showTagline && (
          <span className={`text-[9px] uppercase tracking-wider font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Self-Drive Rentals
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}


