'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Car as CarIcon, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  ArrowLeft, 
  Check, 
  X, 
  Star, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminCarsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('2024');
  const [category, setCategory] = useState('Hatchback');
  const [pricePerDay, setPricePerDay] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [description, setDescription] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Manual');
  const [seats, setSeats] = useState('5');
  const [horsepower, setHorsepower] = useState('89');
  const [acceleration, setAcceleration] = useState('11.5s (0-100 km/h)');
  const [location, setLocation] = useState('Mumbai, Delhi, Bengaluru');
  const [featuresText, setFeaturesText] = useState('Touchscreen Infotainment, Rear Camera, Dual Airbags, ABS with EBD');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/cars');
      return;
    }
    if (session && (session.user as any)?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    if (session) {
      loadCars();
    }
  }, [session, status, router]);

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
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingCarId(null);
    setBrand('');
    setModel('');
    setYear('2024');
    setCategory('Hatchback');
    setPricePerDay('');
    setImagesText('https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80');
    setDescription('');
    setFuelType('Petrol');
    setTransmission('Manual');
    setSeats('5');
    setHorsepower('89');
    setAcceleration('11.5s (0-100 km/h)');
    setLocation('Mumbai & Delhi');
    setFeaturesText('Touchscreen Infotainment, Rear Parking Sensors, Dual Airbags, Power Steering, ABS with EBD');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (car: Car) => {
    setEditingCarId(car.id);
    setBrand(car.brand);
    setModel(car.model);
    setYear(car.year.toString());
    setCategory(car.category);
    setPricePerDay(car.pricePerDay.toString());
    setImagesText(car.images.join('\n'));
    setDescription(car.description);
    setFuelType(car.fuelType);
    setTransmission(car.transmission);
    setSeats(car.seats.toString());
    setHorsepower(car.horsepower ? car.horsepower.toString() : '500');
    setAcceleration(car.acceleration || '3.2s');
    setLocation(car.location);
    setFeaturesText(car.features.join(', '));
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, carName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${carName} from the fleet?`)) return;

    try {
      const res = await fetch(`/api/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCars(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete car', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!brand || !model || !pricePerDay || !description) {
      setErrorMsg('Brand, Model, Price per Day, and Description are required.');
      return;
    }

    const images = imagesText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 5);

    const features = featuresText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const payload = {
      brand,
      model,
      year: Number(year),
      category,
      pricePerDay: Number(pricePerDay),
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80'],
      description,
      fuelType,
      transmission,
      seats: Number(seats),
      horsepower: Number(horsepower),
      acceleration,
      location,
      features,
    };

    setSubmitting(true);
    try {
      const endpoint = editingCarId ? `/api/cars/${editingCarId}` : '/api/cars';
      const method = editingCarId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to save car');
        setSubmitting(false);
        return;
      }

      await loadCars();
      setIsModalOpen(false);
    } catch {
      setErrorMsg('Network error while saving vehicle entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCars = cars.filter(c => 
    c.brand.toLowerCase().includes(search.toLowerCase()) ||
    c.model.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Top Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Admin Overview</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Manage Cars ({cars.length})
            </h1>
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary text-xs inline-flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Car</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 mb-6 flex items-center gap-3 shadow-subtle">
          <Search className="w-4 h-4 text-slate-400 ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cars by brand, model, or category..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
        </div>

        {/* Cars Table */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">Car Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Daily Price</th>
                  <th className="p-4">Engine / Speed</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={car.images[0]}
                          alt={car.model}
                          className="w-16 h-11 object-cover rounded-lg border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {car.brand} {car.model}
                          </p>
                          <span className="text-xs text-slate-500">
                            Year: {car.year} • {car.location}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-xs font-medium">
                        {car.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900 text-sm">
                      {formatCurrency(car.pricePerDay)}/day
                    </td>
                    <td className="p-4 text-slate-600">
                      <span>{car.horsepower || 500} HP</span> • <span>{car.acceleration || '3.2s'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{car.rating.toFixed(1)}</span>
                        <span className="text-slate-400 text-xs font-normal">({car.reviewsCount})</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/cars/${car.id}`}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="View Public Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(car)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit Car"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(car.id, `${car.brand} ${car.model}`)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete Car"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Car Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CarIcon className="w-5 h-5 text-brand-600" />
                <span>{editingCarId ? 'Edit Car Details' : 'Add New Car to Fleet'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Maruti Suzuki, Tata, Hyundai, Mahindra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Swift, Nexon, Scorpio-N, Fortuner"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Hatchback">Hatchback</option>
                    <option value="Crossover">Crossover</option>
                    <option value="Compact SUV">Compact SUV</option>
                    <option value="SUV">SUV</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Daily Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    placeholder="1500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Exact Image URLs */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Image URLs (One URL per line) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={imagesText}
                  onChange={(e) => setImagesText(e.target.value)}
                  placeholder="https://images.unsplash.com/...&#10;https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Specs */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Horsepower (HP)</label>
                  <input
                    type="number"
                    value={horsepower}
                    onChange={(e) => setHorsepower(e.target.value)}
                    placeholder="89"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">0-100 Speed</label>
                  <input
                    type="text"
                    value={acceleration}
                    onChange={(e) => setAcceleration(e.target.value)}
                    placeholder="11.5s"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="CNG">CNG</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Features (Comma separated)
                </label>
                <input
                  type="text"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                  placeholder="Sunroof, Autopilot, Premium Audio, Leather Seats"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about the driving experience, luxury interior, and condition..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Saving...' : editingCarId ? 'Save Changes' : 'Add Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
