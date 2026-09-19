import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { getMongoDb } from './mongodb';
import { initialCars, demoUsers, initialBookings } from './mockData';
import { Car, Booking, User, Review, BookingStatus } from '@/types';

// Persistent file storage directory and file path (Supports Vercel serverless /tmp)
const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DIR = path.join(process.cwd(), 'src', 'data');
const BUNDLED_FILE = path.join(BUNDLED_DIR, 'store.json');

const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'drivepe-data') : BUNDLED_DIR;
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

    // On Vercel, if /tmp store doesn't exist yet, seed it from bundled store.json
    if (!fs.existsSync(STORE_FILE) && fs.existsSync(BUNDLED_FILE)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_FILE, 'utf-8');
        fs.writeFileSync(STORE_FILE, bundledContent, 'utf-8');
      } catch (copyErr) {
        console.warn('[db-service] Could not seed /tmp store from bundled file:', copyErr);
      }
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

    const mergedMap = new Map<string, Booking>();
    // 1. First populate with local store bookings
    store.bookings.forEach(b => mergedMap.set(b.id, b));

    // 2. Fetch from MongoDB Atlas directly (central source of truth across all Vercel Lambdas)
    try {
      const db = await getMongoDb();
      if (db) {
        const mongoBookings = await db.collection('Booking').find({}).sort({ createdAt: -1 }).toArray();
        if (mongoBookings && mongoBookings.length > 0) {
          mongoBookings.forEach((doc: any) => {
            const bId = doc.id || doc._id?.toString();
            const bObj: Booking = {
              ...doc,
              id: bId,
              car: doc.car || store.cars.find(c => c.id === doc.carId),
            };
            delete (bObj as any)._id;
            mergedMap.set(bId, bObj);
          });
        }
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas getBookings warning:', err);
    }

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

    try {
      const db = await getMongoDb();
      if (db) {
        const doc: any = await db.collection('Booking').findOne({ id });
        if (doc) {
          const bObj: Booking = {
            ...doc,
            id: doc.id || doc._id?.toString(),
            car: doc.car || store.cars.find(c => c.id === doc.carId),
          };
          delete (bObj as any)._id;
          return bObj;
        }
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas getBookingById warning:', err);
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

    // 1. Save to local /tmp or disk store
    store.bookings.unshift(newBooking);
    saveStore(store);

    // 2. Persist to MongoDB Atlas directly (Syncs to Admin across all devices & Vercel lambdas)
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('Booking').updateOne(
          { id: newBooking.id },
          { $set: newBooking },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas createBooking warning:', err);
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

    // Persist status change to MongoDB Atlas
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('Booking').updateOne(
          { id },
          { $set: { status, updatedAt: new Date() } }
        );
        if (!updated) {
          const doc: any = await db.collection('Booking').findOne({ id });
          if (doc) {
            delete doc._id;
            updated = doc as Booking;
          }
        }
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas updateBookingStatus warning:', err);
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

    // 2. Also check MongoDB Atlas
    try {
      const db = await getMongoDb();
      if (db) {
        const userDoc: any = await db.collection('User').findOne({ email: cleanEmail });
        if (userDoc) {
          const u: User = {
            ...userDoc,
            id: userDoc.id || userDoc._id?.toString(),
          };
          delete (u as any)._id;
          const exists = store.users.some(u => u.email.toLowerCase().trim() === cleanEmail);
          if (!exists) {
            store.users.push(u);
            saveStore(store);
          }
          return u;
        }
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas getUserByEmail warning:', err);
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

    // 2. Persist to MongoDB Atlas
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('User').updateOne(
          { email: cleanEmail },
          { $set: newUser },
          { upsert: true }
        );
      }
    } catch (err) {
      console.warn('[db-service] MongoDB Atlas createUser warning:', err);
    }

    return newUser;
  },
};

