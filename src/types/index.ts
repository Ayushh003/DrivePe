export type UserRole = 'ADMIN' | 'CUSTOMER';

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string | null;
  createdAt?: string | Date;
}

export interface Review {
  id: string;
  userId: string;
  carId: string;
  rating: number;
  comment: string;
  userName?: string;
  createdAt: string | Date;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  images: string[];
  description: string;
  fuelType: string;
  transmission: string;
  seats: number;
  mileage?: string;
  horsepower?: number;
  acceleration?: string;
  location: string;
  features: string[];
  isAvailable: boolean;
  rating: number;
  reviewsCount: number;
  reviews?: Review[];
  createdAt?: string | Date;
}

export interface Booking {
  id: string;
  userId?: string | null;
  carId: string;
  startDate: string | Date;
  endDate: string | Date;
  totalDays: number;
  totalPrice: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  utrNumber: string;
  status: BookingStatus;
  paymentMethod: string;
  notes?: string | null;
  car?: Car;
  user?: User | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}
