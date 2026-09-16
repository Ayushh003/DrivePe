import nodemailer from 'nodemailer';
import { Booking, Car } from '@/types';
import { formatCurrency, formatDate } from './utils';

// Configure transporter
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    if (host?.includes('gmail') || user.endsWith('@gmail.com')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host: host || 'smtp.ethereal.email',
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback simulator transporter
  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.SMTP_FROM || 'DrivePe <no-reply@drivepe.in>';
  const transporter = createTransporter();

  if (!transporter) {
    console.info(`\n================= 📩 EMAIL NOTIFICATION SENT =================`);
    console.info(`TO: ${to}`);
    console.info(`SUBJECT: ${subject}`);
    console.info(`TIME: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
    console.info(`[Note: Add SMTP_USER and SMTP_PASS in .env to deliver live emails to real inbox]`);
    console.info(`==============================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.info(`[Email Service] ✅ Real email sent successfully: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] ❌ Error sending email:', error);
    return { success: false, error };
  }
}

// LOGIN & ACCOUNT NOTIFICATION EMAILS (Sent to both Customer and Admin)
export async function sendLoginNotificationEmail({
  email,
  name,
  role = 'CUSTOMER',
}: {
  email: string;
  name: string;
  role?: string;
}) {
  const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@drivepe.in';

  // 1. Email template for Customer
  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 12px; max-width: 540px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">DrivePe</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Security & Account Notification</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">Successful Login Alert</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">You have successfully signed in to your DrivePe account on <strong>${time} (IST)</strong>.</p>
        
        <div style="margin: 16px 0; background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; color: #334155;">
          <p style="margin: 0;"><strong>Account:</strong> ${email}</p>
          <p style="margin: 4px 0 0 0;"><strong>Status:</strong> Active & Verified</p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.4;">If this was you, you can proceed to browse cars and rent with instant UPI payments. If you did not initiate this login, please change your password or contact support immediately.</p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} DrivePe Mobility Solutions. All rights reserved.
      </div>
    </div>
  `;

  // 2. Email template for Admin
  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 12px; max-width: 540px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">DrivePe Admin</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">User Activity Alert</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: inline-block; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; margin-bottom: 10px;">
          ${role === 'ADMIN' ? 'ADMIN LOGIN' : 'CUSTOMER LOGIN'}
        </div>
        <h3 style="color: #0f172a; margin-top: 0; font-size: 16px;">User Signed In</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">A user has just logged into the portal:</p>
        
        <div style="margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; font-size: 13px; color: #334155; line-height: 1.6;">
          <p style="margin: 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 4px 0 0 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 4px 0 0 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 4px 0 0 0;"><strong>Timestamp:</strong> ${time} (IST)</p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.4;">You can manage bookings and users from the <a href="http://localhost:3000/admin/dashboard" style="color: #2563eb; text-decoration: underline;">Admin Dashboard</a>.</p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} DrivePe Mobility Solutions.
      </div>
    </div>
  `;

  const emailPromises: Promise<any>[] = [
    sendEmail({
      to: email,
      subject: `Security Alert: Successful Sign-in to your DrivePe Account`,
      html: customerHtml,
    }),
  ];

  if (email.toLowerCase().trim() !== adminEmail.toLowerCase().trim()) {
    emailPromises.push(
      sendEmail({
        to: adminEmail,
        subject: `[DrivePe Alert] Customer Login: ${name} (${email})`,
        html: adminHtml,
      })
    );
  } else {
    emailPromises.push(
      sendEmail({
        to: adminEmail,
        subject: `[DrivePe Alert] Admin Login: ${name}`,
        html: adminHtml,
      })
    );
  }

  await Promise.allSettled(emailPromises);
}

// EMAIL TEMPLATES

export async function sendBookingRequestedEmails({
  booking,
  car,
}: {
  booking: Booking;
  car: Car;
}) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@drivepe.in';

  // 1. Email to Customer
  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 12px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800;">DrivePe</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Instant Car Rental Confirmation</p>
      </div>
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;">
          BOOKING RECEIVED &bull; VERIFYING UPI
        </div>
        <p style="color: #334155; line-height: 1.6; font-size: 14px;">Hello <strong>${booking.customerName}</strong>,</p>
        <p style="color: #334155; line-height: 1.6; font-size: 14px;">We have received your booking request for the <strong>${car.brand} ${car.model}</strong>. Our fleet team is verifying your UPI payment.</p>
        
        <div style="margin: 20px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px;">
          <p style="margin: 4px 0; color: #64748b;">Booking Reference: <span style="color: #0f172a; font-weight: bold;">#${booking.id}</span></p>
          <p style="margin: 4px 0; color: #64748b;">Submitted UPI Ref / UTR: <span style="color: #2563eb; font-weight: bold;">${booking.utrNumber}</span></p>
          <p style="margin: 4px 0; color: #64748b;">Rental Dates: <span style="color: #0f172a;">${formatDate(booking.startDate)} - ${formatDate(booking.endDate)} (${booking.totalDays} Days)</span></p>
          <p style="margin: 4px 0; color: #64748b;">Total Amount: <span style="color: #059669; font-weight: bold; font-size: 16px;">${formatCurrency(booking.totalPrice)}</span></p>
        </div>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">You will receive an automated confirmation as soon as the administrator verifies the payment transaction on their banking terminal.</p>
      <div style="border-top: 1px solid #e2e8f0; margin-top: 25px; padding-top: 15px; text-align: center; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} DrivePe Mobility Solutions. All rights reserved.
      </div>
    </div>
  `;

  // 2. Email to Admin
  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 12px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 800;">DrivePe Admin</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">New Booking Alert</p>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div style="display: inline-block; background: #fef3c7; color: #d97706; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;">
          ACTION REQUIRED: APPROVE UPI PAYMENT
        </div>
        <p style="color: #334155; font-size: 14px;">A customer has placed a booking and submitted their UPI transaction ID:</p>
        
        <div style="margin: 16px 0; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.6;">
          <p style="margin: 4px 0;"><strong>UPI UTR / Ref ID:</strong> <span style="background: #e0effe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${booking.utrNumber}</span></p>
          <p style="margin: 4px 0;"><strong>Expected Amount:</strong> <span style="color: #059669; font-weight: bold;">${formatCurrency(booking.totalPrice)}</span></p>
          <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${booking.customerName}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> ${booking.customerEmail}</p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> ${booking.customerPhone}</p>
          <p style="margin: 4px 0;"><strong>Car:</strong> ${car.brand} ${car.model} (${car.year})</p>
          <p style="margin: 4px 0;"><strong>Dates:</strong> ${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}</p>
        </div>

        <p style="color: #64748b; font-size: 12px;">Log in to the Admin Dashboard at <a href="http://localhost:3000/admin/bookings" style="color: #2563eb; text-decoration: underline;">/admin/bookings</a> to approve or reject this booking.</p>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 11px;">
        &copy; ${new Date().getFullYear()} DrivePe Mobility Solutions.
      </div>
    </div>
  `;

  await Promise.all([
    sendEmail({ to: booking.customerEmail, subject: `Booking Received: ${car.brand} ${car.model} [#${booking.id}]`, html: customerHtml }),
    sendEmail({ to: adminEmail, subject: `[DrivePe Alert] New UPI Booking #${booking.id} - UTR: ${booking.utrNumber}`, html: adminHtml }),
  ]);
}

export async function sendBookingStatusUpdateEmail({
  booking,
  car,
  status,
}: {
  booking: Booking;
  car: Car;
  status: 'APPROVED' | 'REJECTED' | 'COMPLETED';
}) {
  const isApproved = status === 'APPROVED';
  const isCompleted = status === 'COMPLETED';

  const statusColor = isApproved ? '#059669' : isCompleted ? '#2563eb' : '#dc2626';
  const statusTitle = isApproved ? 'Booking Confirmed & Approved! 🎉' : isCompleted ? 'Rental Completed - Thank You! 🌟' : 'Booking Update: Request Not Approved';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 30px; border-radius: 12px; max-width: 580px; margin: auto; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2563eb; margin: 0; font-size: 26px; font-weight: 800;">DrivePe</h1>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="color: ${statusColor}; margin-top: 0; font-size: 20px;">${statusTitle}</h2>
        <p style="color: #334155; line-height: 1.6; font-size: 14px;">Hello <strong>${booking.customerName}</strong>,</p>
        
        ${isApproved ? `
          <p style="color: #334155; line-height: 1.6; font-size: 14px;">Your UPI payment (UTR: <strong>${booking.utrNumber}</strong>) has been successfully verified by our team. Your car reservation is officially confirmed!</p>
          <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 12px; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0; color: #065f46; font-weight: 600;">Pickup Location: ${car.location}</p>
            <p style="margin: 5px 0 0 0; color: #065f46; font-size: 12px;">Please bring your valid Original Driving License and Government Photo ID at the time of handover.</p>
          </div>
        ` : isCompleted ? `
          <p style="color: #334155; line-height: 1.6; font-size: 14px;">Thank you for driving with DrivePe! We hope you enjoyed your ride in the <strong>${car.brand} ${car.model}</strong>.</p>
        ` : `
          <p style="color: #334155; line-height: 1.6; font-size: 14px;">Unfortunately, your booking request for the <strong>${car.brand} ${car.model}</strong> could not be approved. This may be due to an unverified transaction reference.</p>
        `}

        <div style="margin-top: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; font-size: 13px;">
          <p style="margin: 4px 0; color: #64748b;">Vehicle: <span style="color: #0f172a; font-weight: 600;">${car.brand} ${car.model}</span></p>
          <p style="margin: 4px 0; color: #64748b;">Duration: <span style="color: #0f172a;">${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}</span></p>
          <p style="margin: 4px 0; color: #64748b;">Total Paid: <span style="color: #059669; font-weight: bold;">${formatCurrency(booking.totalPrice)}</span></p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <a href="http://localhost:3000/my-bookings" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 13px;">View Booking in Portal</a>
      </div>
    </div>
  `;

  await sendEmail({
    to: booking.customerEmail,
    subject: `Booking Status Updated: ${status} [#${booking.id}]`,
    html,
  });
}
