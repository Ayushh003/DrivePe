'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Fuel, 
  Star, 
  ArrowUpDown, 
  Car as CarIcon,
  ChevronRight,
  Users,
  Settings2,
  X,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency } from '@/lib/utils';
import UpiPaymentModal from '@/components/booking/UpiPaymentModal';

export default function FleetPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'rating'>('rating');

  // Booking Modal
  const [bookingCar, setBookingCar] = useState<Car | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const defaultReturn = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  useEffect(() => {
    // Read URL search params if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCategory = params.get('category');
      const urlQuery = params.get('q') || params.get('search');
      if (urlCategory) {
        setSelectedCategory(urlCategory);
      }
      if (urlQuery) {
        setSearchQuery(urlQuery);
      }
    }

    async function fetchFleet() {
      try {
        const res = await fetch('/api/cars');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCars(data);
        }
      } catch (e) {
        console.error('Failed to fetch cars', e);
      } finally {
        setLoading(false);
      }
    }
    fetchFleet();
  }, []);

  const categories = [
    { name: 'All', icon: '🚗' },
    { name: 'Hatchback', icon: '⚡' },
    { name: 'Crossover', icon: '🏔️' },
    { name: 'Compact SUV', icon: '🚙' },
    { name: 'SUV', icon: '👑' },
    { name: 'Electric', icon: '🔋' }
  ];

  const fuelTypes = [
    { name: 'All', icon: null },
    { name: 'Petrol', icon: '⛽' },
    { name: 'Diesel', icon: '🛢️' },
    { name: 'Electric', icon: '⚡' }
  ];

  const filteredCars = useMemo(() => {
    return cars
      .filter((car) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            car.brand.toLowerCase().includes(q) ||
            car.model.toLowerCase().includes(q) ||
            car.category.toLowerCase().includes(q);
          if (!match) return false;
        }
        if (selectedCategory !== 'All' && car.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        if (selectedFuel !== 'All' && !car.fuelType.toLowerCase().includes(selectedFuel.toLowerCase())) {
          return false;
        }
        if (car.pricePerDay > maxPrice) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.pricePerDay - b.pricePerDay;
        if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
        return b.rating - a.rating;
      });
  }, [cars, searchQuery, selectedCategory, selectedFuel, maxPrice, sortBy]);

  const hasActiveFilters = selectedCategory !== 'All' || selectedFuel !== 'All' || Boolean(searchQuery) || maxPrice < 10000;

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedFuel('All');
    setSearchQuery('');
    setMaxPrice(10000);
    setSortBy('rating');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-semibold mb-3.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Verified Self-Drive Fleet (20 Models Available)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-slate-900 tracking-tight">
            Explore All Rental Cars
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-2xl font-normal leading-relaxed">
            Choose from popular hatchbacks, crossovers, compact SUVs, luxury SUVs, and electric vehicles. Instant UPI QR booking with transparent zero-hidden fees.
          </p>
        </div>

        {/* Premium Filter & Search Hub */}
        <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-[0_10px_35px_rgba(15,23,42,0.04)] mb-8 space-y-5 transition-all">
          
          {/* Top Row: Search, Sort, Price Slider */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="lg:col-span-5 relative group">
              <Search className="w-4 h-4 text-blue-600 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Swift, Fortuner, Nexon EV, Scorpio..."
                className="w-full bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 rounded-2xl pl-11 pr-10 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="lg:col-span-3">
              <div className="relative">
                <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full appearance-none bg-slate-50/90 hover:bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-9 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all shadow-xs cursor-pointer"
                >
                  <option value="rating">Sort: Top Rated ⭐</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Max Budget Slider */}
            <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl p-3 px-4 shadow-xs">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-blue-600" /> Max Budget:
                </span>
                <span className="font-heading font-extrabold text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded-md border border-blue-200/50 text-xs tracking-tight">
                  {formatCurrency(maxPrice)}/day
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={10000}
                step={200}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1">
                <span>₹1,000</span>
                <span>₹10,000/day</span>
              </div>
            </div>

          </div>

          {/* Bottom Row: Category & Fuel Chips */}
          <div className="pt-3 border-t border-slate-100 space-y-3.5">
            
            {/* Category Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 min-w-[75px]">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Type</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {categories.map((cat) => {
                  const count = cat.name === 'All' 
                    ? cars.length 
                    : cars.filter((c) => c.category.toLowerCase() === cat.name.toLowerCase()).length;
                  const isSelected = selectedCategory === cat.name;

                  return (
                    <button
                      key={cat.name}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        if (cat.name !== 'All' && selectedFuel !== 'All') {
                          const hasFuelMatch = cars.some(
                            (c) => c.category.toLowerCase() === cat.name.toLowerCase() && c.fuelType.toLowerCase().includes(selectedFuel.toLowerCase())
                          );
                          if (!hasFuelMatch) {
                            setSelectedFuel('All');
                          }
                        }
                      }}
                      className={`group px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-xs ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 ring-1 ring-slate-900 scale-[1.02]'
                          : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 border border-slate-200/50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-slate-500 border border-slate-200/70 group-hover:text-slate-700'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuel Row */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 min-w-[75px]">
                <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fuel</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {fuelTypes.map((fuel) => {
                  const count = fuel.name === 'All' 
                    ? cars.length 
                    : cars.filter((c) => c.fuelType.toLowerCase().includes(fuel.name.toLowerCase())).length;
                  const isSelected = selectedFuel === fuel.name;

                  return (
                    <button
                      key={fuel.name}
                      onClick={() => {
                        setSelectedFuel(fuel.name);
                        if (fuel.name !== 'All' && selectedCategory !== 'All') {
                          const hasCategoryMatch = cars.some(
                            (c) => c.category.toLowerCase() === selectedCategory.toLowerCase() && c.fuelType.toLowerCase().includes(fuel.name.toLowerCase())
                          );
                          if (!hasCategoryMatch) {
                            setSelectedCategory('All');
                          }
                        }
                      }}
                      className={`group px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-xs ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-1 ring-blue-600 scale-[1.02]'
                          : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 hover:text-slate-900 border border-slate-200/50'
                      }`}
                    >
                      {fuel.icon && <span>{fuel.icon}</span>}
                      <span>{fuel.name}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
                          isSelected
                            ? 'bg-blue-700/80 text-white'
                            : 'bg-white text-slate-500 border border-slate-200/70 group-hover:text-slate-700'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Live Filter Tags & Result Count */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading font-semibold text-slate-700 text-sm">
              Showing <span className="text-blue-600 font-bold">{filteredCars.length}</span> of {cars.length} vehicles
            </span>

            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white font-medium text-xs shadow-xs">
                <span>Category: {selectedCategory}</span>
                <button onClick={() => setSelectedCategory('All')} className="hover:text-red-300 ml-0.5 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {selectedFuel !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-xs">
                <span>Fuel: {selectedFuel}</span>
                <button onClick={() => setSelectedFuel('All')} className="hover:text-blue-200 ml-0.5 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-semibold border border-slate-200 text-xs">
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-slate-500 ml-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {maxPrice < 10000 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 font-medium border border-amber-200/80 text-xs">
                <span>Under {formatCurrency(maxPrice)}/day</span>
                <button onClick={() => setMaxPrice(10000)} className="hover:text-amber-900 ml-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Fleet Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-white border border-slate-200/80 animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredCars.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-slate-200/80 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <CarIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-slate-900">No cars match your filters</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Try widening your price range or clearing the category and fuel selections.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={resetFilters}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="group bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:border-slate-300/80 transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                    <img
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    <div className="absolute top-3.5 left-3.5">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm border border-slate-200/50">
                        {car.category}
                      </span>
                    </div>

                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/95 text-xs font-extrabold text-amber-600 shadow-sm backdrop-blur-sm border border-slate-200/50">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{car.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <h3 className="text-lg font-heading font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {car.brand} {car.model}
                      </h3>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{car.year}</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {car.description}
                    </p>

                    {/* Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100/90 text-xs text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600/70" />
                        <span className="truncate">{car.seats} Seats</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Settings2 className="w-3.5 h-3.5 text-blue-600/70" />
                        <span className="truncate">{car.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-emerald-600/70" />
                        <span className="truncate">{car.fuelType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="p-5 pt-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Daily Rental</span>
                    <p className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
                      {formatCurrency(car.pricePerDay)}
                      <span className="text-xs font-normal text-slate-400">/day</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/cars/${car.id}`}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => setBookingCar(car)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                    >
                      <span>Book</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingCar && (
        <UpiPaymentModal
          car={bookingCar}
          startDate={today}
          endDate={defaultReturn}
          onClose={() => setBookingCar(null)}
        />
      )}
    </div>
  );
}
