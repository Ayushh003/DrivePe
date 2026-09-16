import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbService } from '@/lib/db-service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { carId, rating, comment } = body;

    if (!carId || !rating || !comment) {
      return NextResponse.json({ error: 'Car ID, rating (1-5), and review text are required' }, { status: 400 });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5 stars' }, { status: 400 });
    }

    const userId = (session?.user as any)?.id || `guest-${Date.now()}`;
    const userName = session?.user?.name || 'Verified Renter';

    const review = await dbService.addReview({
      carId,
      userId,
      rating: numRating,
      comment,
      userName,
    });

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
