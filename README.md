# DrivePe — Self-Drive Car Rental & UPI Booking Platform

A full-stack, production-ready Self-Drive Car Rental web application built with **Next.js 14 (App Router)**, **MongoDB with Prisma ORM**, **NextAuth.js**, **Tailwind CSS**, and **Framer Motion**.

---

## 🚀 Key Features

1. **Modern Automotive SaaS Design**:
   - Clean, aesthetic UI built with **Outfit** and **Plus Jakarta Sans** typography.
   - Glassmorphic navigation, micro-interactions, status badges, and confetti animations on booking.

2. **Role-Based Authentication (NextAuth.js)**:
   - Strict separation between `ADMIN` and `CUSTOMER` roles.
   - 1-Click Quick Demo Login on `/login` for seamless recruiter and evaluation testing.

3. **UPI QR Code Payment Workflow**:
   - Dynamic rental breakdown based on selected dates and duration.
   - High-contrast UPI QR Code with copyable Admin UPI ID and masked UI protection.
   - Mandatory **12-Digit UPI Transaction / UTR ID** submission on checkout.
   - Admin approves or rejects bookings directly from the dashboard after verifying the UTR ID.

4. **Comprehensive Admin Dashboard**:
   - **Executive Dashboard (`/admin/dashboard`)**: Revenue metrics, fleet count, pending approvals, and active bookings.
   - **Fleet Management (`/admin/cars`)**: Full CRUD to add, edit, and delete cars with specifications (Brand, Model, Year, Category, Daily Tariff, Mileage, Fuel, Seats, Transmission, and Features).
   - **Bookings Management (`/admin/bookings`)**: Customer table displaying customer details, dates, total amount, and UTR number with 1-click copy and status actions.

5. **Customer Fleet & Booking Flow**:
   - **Fleet Showroom (`/cars`)**: Search and multi-faceted filter hub (Category, Fuel, Price slider, Sort).
   - **Car Details (`/cars/[id]`)**: Multi-photo gallery, vehicle technical specs, dynamic date picker with live tariff breakdown, and instant booking modal.
   - **Ratings & Reviews**: Customer review submission with dynamic rating recalculations.
   - **My Bookings (`/my-bookings`)**: Real-time status tracking (`PENDING`, `APPROVED`, `COMPLETED`, `REJECTED`).

6. **Automated Nodemailer Notifications**:
   - Instant email notifications to customer and admin upon new booking creation and status updates.

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Access Routes |
|---|---|---|---|
| **Admin** | `admin@carrental.com` | `admin123` | `/admin/dashboard`, `/admin/cars`, `/admin/bookings` |
| **Customer** | `customer@carrental.com` | `user123` | `/my-bookings`, `/cars`, `/cars/[id]` |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Next.js API Routes, NextAuth.js
- **Database & ORM**: MongoDB with Prisma ORM (and resilient JSON store persistence fallback)
- **Payments**: UPI QR Code & 12-Digit UTR Transaction Verification
- **Email Service**: Nodemailer (SMTP)

---

## 📦 Project Setup & Local Run

### 1. Clone the repository
```bash
git clone https://github.com/Ayushh003/DrivePe.git
cd DrivePe
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Environment Variables Setup
Create a `.env` file in the root directory:
```env
DATABASE_URL="your-mongodb-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_UPI_ID="drivepe@okaxis"
ADMIN_UPI_NAME="DrivePe Mobility"
NEXT_PUBLIC_ADMIN_UPI_ID="drivepe@okaxis"
NEXT_PUBLIC_ADMIN_UPI_NAME="DrivePe Mobility"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="DrivePe <no-reply@drivepe.in>"
ADMIN_NOTIFICATION_EMAIL="your-email@gmail.com"
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

