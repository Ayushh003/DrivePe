import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbService } from '@/lib/db-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await dbService.createUser({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      role: 'CUSTOMER',
    });

    // Send Welcome Email & Admin Notification
    import('@/lib/mail')
      .then(({ sendLoginNotificationEmail }) => {
        sendLoginNotificationEmail({
          email: user.email,
          name: user.name,
          role: 'CUSTOMER (NEW REGISTRATION)',
        }).catch((err) => console.error('Error sending registration notification email:', err));
      })
      .catch((err) => console.error('Failed to import mail module:', err));

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
