import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';
import { sendBookingStatusUpdateEmail } from '@/lib/mail';
import { BookingStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin privileges required' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    const validStatuses: BookingStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid booking status provided' }, { status: 400 });
    }

    const booking = await dbService.getBookingById(params.id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updatedBooking = await dbService.updateBookingStatus(params.id, status);
    if (!updatedBooking) {
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
    }

    // Retrieve car for email template
    const car = await dbService.getCarById(booking.carId);
    if (car && (status === 'APPROVED' || status === 'REJECTED' || status === 'COMPLETED')) {
      sendBookingStatusUpdateEmail({
        booking: updatedBooking,
        car,
        status,
      }).catch(err => console.error('Failed to send status update email:', err));
    }

    return NextResponse.json({
      message: `Booking #${params.id} has been marked as ${status}`,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}
