import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;
    const search = searchParams.get('search') || undefined;
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

    const cars = await dbService.getCars({
      category,
      brand,
      search,
      minPrice,
      maxPrice,
    });

    return NextResponse.json(cars);
  } catch (error: any) {
    console.error('Error fetching cars:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const {
      brand,
      model,
      year,
      category,
      pricePerDay,
      images,
      description,
      fuelType,
      transmission,
      seats,
      mileage,
      horsepower,
      acceleration,
      location,
      features,
    } = body;

    if (!brand || !model || !pricePerDay || !description) {
      return NextResponse.json({ error: 'Brand, model, pricePerDay, and description are required' }, { status: 400 });
    }

    const newCar = await dbService.createCar({
      brand,
      model,
      year: Number(year) || new Date().getFullYear(),
      category: category || 'Luxury',
      pricePerDay: Number(pricePerDay),
      images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80'],
      description,
      fuelType: fuelType || 'Petrol',
      transmission: transmission || 'Automatic',
      seats: Number(seats) || 4,
      mileage: mileage || '10 km/l',
      horsepower: horsepower ? Number(horsepower) : 450,
      acceleration: acceleration || '3.5s (0-100 km/h)',
      location: location || 'Mumbai & Delhi',
      features: Array.isArray(features) ? features : ['GPS Navigation', 'Leather Interior', 'Premium Sound'],
      isAvailable: true,
    });

    return NextResponse.json(newCar, { status: 201 });
  } catch (error: any) {
    console.error('Error creating car:', error);
    return NextResponse.json({ error: 'Failed to create car entry' }, { status: 500 });
  }
}
