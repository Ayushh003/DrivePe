import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbService } from './db-service';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'customer@carrental.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // 1. Instant access for default Demo Admin
        if (email === 'admin@carrental.com' && (password === 'admin123' || password === 'admin')) {
          return {
            id: 'admin-1',
            name: 'Fleet Manager',
            email: 'admin@carrental.com',
            role: 'ADMIN',
          };
        }

        // 2. Instant access for default Demo Customer
        if (email === 'customer@carrental.com' && (password === 'user123' || password === 'customer123' || password === 'password')) {
          return {
            id: 'customer-1',
            name: 'Arjun Kapoor',
            email: 'customer@carrental.com',
            role: 'CUSTOMER',
          };
        }

        // 3. Database lookup for registered users
        const user = await dbService.getUserByEmail(email);
        if (!user) {
          throw new Error('No account found with this email. Please register first.');
        }

        if (!user.password) {
          throw new Error('Invalid account credentials.');
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid && user.password !== password) {
          throw new Error('Incorrect password. Please try again.');
        }

        const isAdminEmail = 
          email === 'admin@carrental.com' ||
          email === (process.env.ADMIN_NOTIFICATION_EMAIL || '').toLowerCase().trim() ||
          email === 'ayushhyadav.003@gmail.com';

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: isAdminEmail ? 'ADMIN' : user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'CUSTOMER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || 'CUSTOMER';
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.email) {
        import('./mail')
          .then(({ sendLoginNotificationEmail }) => {
            sendLoginNotificationEmail({
              email: user.email!,
              name: user.name || 'Valued Customer',
              role: (user as any).role || 'CUSTOMER',
            }).catch((err) => console.error('Failed to send login notification email:', err));
          })
          .catch((err) => console.error('Failed to import mail service:', err));
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'carrental-secret-key-change-in-production-2026',
};
