import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { getMongoDb } from '@/lib/mongodb';
import { Booking } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const localBookings: Booking[] = Array.isArray(body?.bookings) ? body.bookings : [];

    if (localBookings.length === 0) {
      return NextResponse.json({ message: 'No bookings to sync', syncedCount: 0 });
    }

    const currentBookings = await dbService.getBookings();
    const existingIds = new Set(currentBookings.map((b) => b.id));
    const existingUtrs = new Set(currentBookings.map((b) => b.utrNumber?.trim()).filter(Boolean));

    const db = await getMongoDb();
    let syncedCount = 0;

    for (const lb of localBookings) {
      if (!lb.id || !lb.utrNumber) continue;

      const alreadyExists = existingIds.has(lb.id) || existingUtrs.has(lb.utrNumber.trim());
      if (!alreadyExists) {
        // Prepare valid booking object
        const fullBooking: Booking = {
          ...lb,
          startDate: new Date(lb.startDate),
          endDate: new Date(lb.endDate),
          createdAt: new Date(lb.createdAt || Date.now()),
          updatedAt: new Date(),
          status: lb.status || 'PENDING',
        };

        await dbService.syncBooking(fullBooking);

        existingIds.add(fullBooking.id);
        existingUtrs.add(fullBooking.utrNumber.trim());
        syncedCount++;
      }
    }

    return NextResponse.json({
      message: `Successfully verified and synced ${syncedCount} booking(s) to central database`,
      syncedCount,
    });
  } catch (error: any) {
    console.error('Error syncing client bookings:', error);
    return NextResponse.json({ error: 'Failed to sync client bookings' }, { status: 500 });
  }
}
