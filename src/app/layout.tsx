import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-sans',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heading',
});

export const metadata: Metadata = {
  title: 'DrivePe | Self-Drive Car Rentals - Instant UPI Booking',
  description: 'Rent hatchbacks, crossovers, compact SUVs, and EVs with doorstep delivery. Instant UPI QR payments on DrivePe, verified fleet, and zero security deposit hassles.',
  keywords: ['DrivePe', 'car rental', 'self drive cars', 'DrivePe car booking', 'UPI car rental', 'Swift rental', 'Nexon EV rental', 'Fortuner rental'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${outfit.variable}`}>
      <body className={`${plusJakarta.className} min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white`}>
        <SessionProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
