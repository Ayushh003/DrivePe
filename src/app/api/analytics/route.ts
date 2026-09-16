import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const [cars, bookings] = await Promise.all([
      dbService.getCars(),
      dbService.getBookings(),
    ]);

    const totalCars = cars.length;
    const availableCars = cars.filter(c => c.isAvailable).length;

    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
    const activeBookings = bookings.filter(b => b.status === 'APPROVED').length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

    // Revenue only counted for confirmed/approved/completed
    const totalRevenue = bookings
      .filter(b => b.status === 'APPROVED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const pendingRevenue = bookings
      .filter(b => b.status === 'PENDING')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Fleet breakdown by category
    const categoryStats: Record<string, number> = {};
    cars.forEach(c => {
      categoryStats[c.category] = (categoryStats[c.category] || 0) + 1;
    });

    return NextResponse.json({
      totalRevenue,
      pendingRevenue,
      totalCars,
      availableCars,
      totalBookings,
      activeBookings,
      pendingBookings,
      completedBookings,
      categoryStats,
      recentBookings: bookings.slice(0, 5),
    });
  } catch (error: any) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to generate analytics report' }, { status: 500 });
  }
}
