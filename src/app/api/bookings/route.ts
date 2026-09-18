import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { sendBookingRequestedEmails } from '@/lib/mail';
import { calculateDaysBetween } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Please log in to view bookings' },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        }
      );
    }

    const userRole = (session.user as any)?.role;
    const userId = (session.user as any)?.id;
    const userEmail = session.user?.email || undefined;

    if (userRole === 'ADMIN') {
      const allBookings = await dbService.getBookings();
      return NextResponse.json(allBookings, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      });
    }

    const userBookings = await dbService.getBookings({ userId, email: userEmail });
    return NextResponse.json(userBookings, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookings' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in or create an account to book a car.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      carId,
      startDate,
      endDate,
      customerName,
      customerEmail,
      customerPhone,
      utrNumber,
      notes,
    } = body;

    if (!carId || !startDate || !endDate || !customerName || !customerEmail || !customerPhone || !utrNumber) {
      return NextResponse.json(
        { error: 'All fields including the 12-digit UPI Transaction / UTR ID are mandatory' },
        { status: 400 }
      );
    }

    // Clean UTR ID
    const cleanUtr = utrNumber.toString().trim();
    if (cleanUtr.length < 8) {
      return NextResponse.json(
        { error: 'Please enter a valid UPI Transaction / UTR reference ID (at least 8-12 digits)' },
        { status: 400 }
      );
    }

    const car = await dbService.getCarById(carId);
    if (!car) {
      return NextResponse.json({ error: 'Selected vehicle not found' }, { status: 404 });
    }

    const totalDays = calculateDaysBetween(startDate, endDate);
    const totalPrice = totalDays * car.pricePerDay;

    const booking = await dbService.createBooking({
      userId: (session?.user as any)?.id || null,
      carId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalDays,
      totalPrice,
      customerName,
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone,
      utrNumber: cleanUtr,
      notes: notes || null,
    });

    // Send asynchronous notifications to customer & admin
    sendBookingRequestedEmails({ booking, car }).catch(err =>
      console.error('Failed to send booking notification emails:', err)
    );

    return NextResponse.json(
      {
        message: 'Booking submitted successfully. Pending UPI payment verification by administrator.',
        booking,
      },
      {
        status: 201,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
      }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Failed to process booking submission' }, { status: 500 });
  }
}
