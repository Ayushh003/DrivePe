'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  CheckCircle2, 
  Fuel, 
  ChevronRight,
  QrCode,
  KeyRound,
  Users,
  Settings2,
  Clock,
  Sparkles
} from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency } from '@/lib/utils';
import UpiPaymentModal from '@/components/booking/UpiPaymentModal';

export default function HomePage() {
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  // Search Bar state
  const [searchLocation, setSearchLocation] = useState('Mumbai');
  const [pickupDate, setPickupDate] = useState('2026-09-18');
  const [returnDate, setReturnDate] = useState('2026-09-20');
  const [searchCategory, setSearchCategory] = useState('All');

  // Quick booking modal
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<Car | null>(null);

  useEffect(() => {
    async function loadCars() {
      try {
        const res = await fetch('/api/cars');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCars(data);
        }
      } catch (e) {
        console.error('Failed to load cars', e);
      } finally {
        setLoadingCars(false);
      }
    }
    loadCars();
  }, []);

  const categories = ['All', 'Hatchback', 'Crossover', 'Compact SUV', 'SUV', 'Electric'];

  const filteredCars = activeCategory === 'All'
    ? cars
    : cars.filter((c) => c.category.toLowerCase() === activeCategory.toLowerCase());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      location: searchLocation,
      category: searchCategory,
      startDate: pickupDate,
      endDate: returnDate,
    });
    router.push(`/cars?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Friendly Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>DrivePe • Fast & Easy Self-Drive Rentals • Instant UPI Booking</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.15] text-slate-900">
            Rent Self-Drive Cars on <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DrivePe with Instant UPI</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choose from popular hatchbacks, crossovers, SUVs, and electric cars. Transparent pricing with instant UPI booking and zero hidden charges.
          </p>

          {/* Clean Search Bar Widget */}
          <div className="mt-10 max-w-4xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left"
            >
              {/* City Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  City / Location
                </label>
                <select
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Goa">Goa</option>
                </select>
              </div>

              {/* Pickup Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Return Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>Search Cars</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto pt-6 text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
              <p className="text-2xl font-bold text-slate-900">500+</p>
              <p className="text-xs text-slate-500 mt-0.5">Trips Completed</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
              <p className="text-2xl font-bold text-blue-600">100%</p>
              <p className="text-xs text-slate-500 mt-0.5">Verified & Insured</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
              <p className="text-2xl font-bold text-emerald-600">4.9 ★</p>
              <p className="text-xs text-slate-500 mt-0.5">Customer Rating</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
              <p className="text-2xl font-bold text-slate-900">₹0</p>
              <p className="text-xs text-slate-500 mt-0.5">Hidden Fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CARS SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Featured Cars
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Handpicked luxury cars, fully inspected and ready for your drive.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cars Grid */}
        {loadingCars ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.slice(0, 6).map((car) => (
              <div
                key={car.id}
                className="clean-card overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Car Image Container */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-slate-800 shadow-sm">
                        {car.category}
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 text-xs font-bold text-amber-600 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{car.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Car Info */}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-bold text-slate-900">
                        {car.brand} {car.model}
                      </h3>
                      <span className="text-xs font-medium text-slate-400">{car.year}</span>
                    </div>

                    {/* Key Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 mt-2 border-y border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{car.seats} Seats</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{car.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-slate-400" />
                        <span>{car.fuelType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price and Action Buttons */}
                <div className="p-5 pt-0 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Price per day</span>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(car.pricePerDay)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/cars/${car.id}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => setSelectedCarForBooking(car)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Book Now</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link
            href="/cars"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-sm shadow-subtle transition-all"
          >
            <span>View All Cars ({cars.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
              Easy 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How DrivePe Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Simple booking, fast confirmation, and doorstep car delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Choose Your Car</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select your favorite car, pickup dates, and preferred location in Mumbai, Delhi, or Bengaluru.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Pay via UPI QR</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan the UPI QR code on your phone using Google Pay, PhonePe, or Paytm and enter the 12-digit transaction ID.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm mb-4 shadow-sm">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">Doorstep Delivery</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your sanitized, fully fueled car is delivered to your doorstep at your chosen pickup time. Enjoy your drive!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="benefits" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block mb-1">
              Why Choose Us
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
              A Hassle-Free Way to Drive Luxury Cars
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              We provide clean, fully insured luxury vehicles with transparent pricing and direct support.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Doorstep Delivery & Pickup</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Car delivered directly to your home, airport, or hotel.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">100% Insured Fleet</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Comprehensive insurance coverage included with every booking.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">24/7 Roadside Assistance</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Dedicated support team available anytime during your rental.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-card">
            <img
              src="https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80"
              alt="Luxury car interior"
              className="w-full h-[380px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-lg font-bold">
                &ldquo;Super smooth booking and flawless car condition.&rdquo;
              </p>
              <p className="text-xs text-slate-300 mt-1">— Rahul M., Mumbai</p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK BOOKING MODAL */}
      {selectedCarForBooking && (
        <UpiPaymentModal
          car={selectedCarForBooking}
          startDate={pickupDate}
          endDate={returnDate}
          onClose={() => setSelectedCarForBooking(null)}
        />
      )}
    </div>
  );
}
