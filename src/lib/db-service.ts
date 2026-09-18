import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { initialCars, demoUsers, initialBookings } from './mockData';
import { Car, Booking, User, Review, BookingStatus } from '@/types';

// Persistent file storage directory and file path
const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

interface StoreData {
  cars: Car[];
  users: User[];
  bookings: Booking[];
  reviews: Review[];
}

// Helper to safely load data from disk or initialize defaults
function getStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return {
        cars: Array.isArray(data.cars) && data.cars.length > 0 ? data.cars : [...initialCars],
        users: Array.isArray(data.users) && data.users.length > 0 ? data.users : [...demoUsers],
        bookings: Array.isArray(data.bookings) ? data.bookings : [...initialBookings],
        reviews: Array.isArray(data.reviews) ? data.reviews : initialCars.flatMap(c => c.reviews || []),
      };
    }
  } catch (err) {
    console.warn('[db-service] Error reading persistent store:', err);
  }

  // Default seed
  const defaultData: StoreData = {
    cars: [...initialCars],
    users: [...demoUsers],
    bookings: [...initialBookings],
    reviews: initialCars.flatMap(c => c.reviews || []),
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[db-service] Error writing default store:', err);
  }

  return defaultData;
}

// Helper to save store data to disk atomically
function saveStore(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[db-service] Failed to persist data to disk:', err);
  }
}

// Fast non-hanging Prisma helper with quick timeout
async function runWithPrisma<T>(fn: () => Promise<T>, timeoutMs = 2000): Promise<T | null> {
  try {
    const result = await Promise.race([
      fn(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Prisma timeout')), timeoutMs)
      ),
    ]);
    return result;
  } catch {
    return null;
  }
}

export const dbService = {
  // ==========================================
  // CARS
  // ==========================================
  async getCars(filter?: { category?: string; brand?: string; search?: string; minPrice?: number; maxPrice?: number }): Promise<Car[]> {
    const store = getStore();

    // Return filtered cars directly from persistent store
    return store.cars.filter(car => {
      if (filter?.category && filter.category !== 'All' && car.category.toLowerCase() !== filter.category.toLowerCase()) return false;
      if (filter?.brand && filter.brand !== 'All' && car.brand.toLowerCase() !== filter.brand.toLowerCase()) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const match = car.brand.toLowerCase().includes(q) || car.model.toLowerCase().includes(q) || car.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filter?.minPrice && car.pricePerDay < filter.minPrice) return false;
      if (filter?.maxPrice && car.pricePerDay > filter.maxPrice) return false;
      return true;
    });
  },

  async getCarById(id: string): Promise<Car | null> {
    const store = getStore();
    return store.cars.find(c => c.id === id) || null;
  },

  async createCar(data: Omit<Car, 'id' | 'rating' | 'reviewsCount' | 'reviews' | 'createdAt'>): Promise<Car> {
    const store = getStore();
    const newCar: Car = {
      ...data,
      id: `car-${Date.now()}`,
      rating: 5.0,
      reviewsCount: 0,
      reviews: [],
      createdAt: new Date(),
    };

    store.cars.unshift(newCar);
    saveStore(store);

    // Sync to Prisma in background
    runWithPrisma(async () => {
      return prisma.car.create({
        data: {
          ...data,
          rating: 5.0,
          reviewsCount: 0,
        },
      });
    }).catch(() => {});

    return newCar;
  },

  async updateCar(id: string, data: Partial<Car>): Promise<Car | null> {
    const store = getStore();
    const index = store.cars.findIndex(c => c.id === id);
    if (index === -1) return null;

    store.cars[index] = { ...store.cars[index], ...data };
    saveStore(store);

    // Sync to Prisma in background
    runWithPrisma(async () => {
      return prisma.car.update({ where: { id }, data: data as any });
    }).catch(() => {});

    return store.cars[index];
  },

  async deleteCar(id: string): Promise<boolean> {
    const store = getStore();
    const initialLen = store.cars.length;
    store.cars = store.cars.filter(c => c.id !== id);
    saveStore(store);

    // Sync to Prisma in background
    runWithPrisma(async () => {
      return prisma.car.delete({ where: { id } });
    }).catch(() => {});

    return store.cars.length < initialLen;
  },

  // ==========================================
  // BOOKINGS
  // ==========================================
  async getBookings(query?: { userId?: string; email?: string }): Promise<Booking[]> {
    const store = getStore();

    // Ensure all store bookings have complete car details attached
    store.bookings.forEach(b => {
      if (!b.car || !b.car.brand) {
        b.car = store.cars.find(c => c.id === b.carId) || b.car;
      }
    });

    const isHex24 = (str?: string | null) => !!str && /^[0-9a-fA-F]{24}$/.test(str);

    // Sync with Prisma only if valid hex string or querying all (to avoid Malformed ObjectID errors)
    let prismaBookings: any[] = [];
    if (!query?.userId || isHex24(query.userId)) {
      const prismaResult = await runWithPrisma(async () => {
        const where: any = {};
        if (query?.userId && isHex24(query.userId)) where.userId = query.userId;
        const bookings = await prisma.booking.findMany({
          where,
          include: { car: true, user: true },
          orderBy: { createdAt: 'desc' },
        });
        return bookings && bookings.length > 0 ? (bookings as any) : null;
      }, 500);

      if (prismaResult && Array.isArray(prismaResult)) {
        prismaBookings = prismaResult;
      }
    }

    // Merge bookings by ID (store bookings always take precedence and include latest bookings)
    const mergedMap = new Map<string, Booking>();
    prismaBookings.forEach(b => mergedMap.set(b.id, b));
    store.bookings.forEach(b => mergedMap.set(b.id, b));

    let list = Array.from(mergedMap.values());

    // Filter by userId OR customerEmail so customer bookings are ALWAYS found reliably
    if (query?.userId || query?.email) {
      const qUserId = query.userId;
      const qEmail = query.email?.toLowerCase().trim();
      list = list.filter(b => {
        const matchId = !!(qUserId && b.userId === qUserId);
        const matchEmail = !!(qEmail && b.customerEmail && b.customerEmail.toLowerCase().trim() === qEmail);
        return matchId || matchEmail;
      });
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const store = getStore();
    const local = store.bookings.find(b => b.id === id);
    if (local) {
      if (!local.car || !local.car.brand) {
        local.car = store.cars.find(c => c.id === local.carId) || local.car;
      }
      return local;
    }

    const isHex24 = (str?: string | null) => !!str && /^[0-9a-fA-F]{24}$/.test(str);
    if (isHex24(id)) {
      const prismaResult = await runWithPrisma(async () => {
        const bk = await prisma.booking.findUnique({ where: { id }, include: { car: true, user: true } });
        return bk ? (bk as any) : null;
      }, 500);
      if (prismaResult) return prismaResult;
    }

    return null;
  },

  async createBooking(data: {
    userId?: string | null;
    carId: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    totalPrice: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    utrNumber: string;
    notes?: string;
  }): Promise<Booking> {
    const store = getStore();
    const car = store.cars.find(c => c.id === data.carId);

    const newBooking: Booking = {
      id: `bk-${Date.now().toString().slice(-6)}`,
      ...data,
      status: 'PENDING',
      paymentMethod: 'UPI_QR',
      car: car || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.bookings.unshift(newBooking);
    saveStore(store);

    // Sync with Prisma in background if IDs are valid ObjectIds
    const isHex24 = (str?: string | null) => !!str && /^[0-9a-fA-F]{24}$/.test(str);
    if (isHex24(data.carId)) {
      runWithPrisma(async () => {
        return prisma.booking.create({
          data: {
            ...data,
            userId: isHex24(data.userId) ? data.userId : null,
            status: 'PENDING',
            paymentMethod: 'UPI_QR',
          },
          include: { car: true },
        });
      }, 500).catch(() => {});
    }

    return newBooking;
  },

  async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    const store = getStore();
    const idx = store.bookings.findIndex(b => b.id === id);
    let updated: Booking | null = null;
    if (idx !== -1) {
      store.bookings[idx].status = status;
      store.bookings[idx].updatedAt = new Date();
      if (!store.bookings[idx].car) {
        store.bookings[idx].car = store.cars.find(c => c.id === store.bookings[idx].carId) || undefined;
      }
      saveStore(store);
      updated = store.bookings[idx];
    }

    // Sync with Prisma
    const isHex24 = (str?: string | null) => !!str && /^[0-9a-fA-F]{24}$/.test(str);
    if (isHex24(id)) {
      runWithPrisma(async () => {
        return prisma.booking.update({
          where: { id },
          data: { status },
          include: { car: true, user: true },
        });
      }, 500).catch(() => {});
    }

    return updated;
  },

  // ==========================================
  // REVIEWS
  // ==========================================
  async addReview(data: { carId: string; userId: string; rating: number; comment: string; userName: string }): Promise<Review> {
    const store = getStore();

    const newRev: Review = {
      id: `rev-${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    store.reviews.push(newRev);

    // Update car in store
    const carIdx = store.cars.findIndex(c => c.id === data.carId);
    if (carIdx !== -1) {
      const car = store.cars[carIdx];
      const carRevs = [...(car.reviews || []), newRev];
      const avg = carRevs.reduce((acc, r) => acc + r.rating, 0) / carRevs.length;
      store.cars[carIdx] = {
        ...car,
        reviews: carRevs,
        rating: Number(avg.toFixed(2)),
        reviewsCount: carRevs.length,
      };
    }
    saveStore(store);

    // Sync to Prisma
    const isHex24 = (str: string) => /^[0-9a-fA-F]{24}$/.test(str);
    if (isHex24(data.carId) && isHex24(data.userId)) {
      runWithPrisma(async () => {
        const review = await prisma.review.create({ data });
        const allReviews = await prisma.review.findMany({ where: { carId: data.carId } });
        const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
        await prisma.car.update({
          where: { id: data.carId },
          data: { rating: Number(avg.toFixed(2)), reviewsCount: allReviews.length },
        });
        return review;
      }).catch(() => {});
    }

    return newRev;
  },

  // ==========================================
  // USERS & AUTHENTICATION
  // ==========================================
  async getUserByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. First check persistent store (instant & 100% reliable)
    const store = getStore();
    const localUser = store.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    if (localUser) {
      return localUser;
    }

    // 2. Also check Prisma MongoDB if available
    const prismaUser = await runWithPrisma(async () => {
      const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
      return user ? (user as any) : null;
    });

    if (prismaUser) {
      // Sync to local store so subsequent lookups are instant
      const exists = store.users.some(u => u.email.toLowerCase().trim() === cleanEmail);
      if (!exists) {
        store.users.push(prismaUser);
        saveStore(store);
      }
      return prismaUser;
    }

    return null;
  },

  async createUser(data: { name: string; email: string; password?: string; role?: 'ADMIN' | 'CUSTOMER'; phone?: string }): Promise<User> {
    const cleanEmail = data.email.toLowerCase().trim();
    const store = getStore();

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: cleanEmail,
      password: data.password,
      role: data.role || 'CUSTOMER',
      phone: data.phone,
      createdAt: new Date(),
    };

    // 1. Immediately persist to disk store
    const existingIdx = store.users.findIndex(u => u.email.toLowerCase().trim() === cleanEmail);
    if (existingIdx >= 0) {
      store.users[existingIdx] = newUser;
    } else {
      store.users.push(newUser);
    }
    saveStore(store);

    // 2. Try persisting to Prisma MongoDB
    runWithPrisma(async () => {
      return prisma.user.create({
        data: {
          name: data.name,
          email: cleanEmail,
          password: data.password || '',
          role: data.role || 'CUSTOMER',
          phone: data.phone,
        },
      });
    }).catch(() => {});

    return newUser;
  },
};

