/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'mongodb', 'bcryptjs', 'nodemailer'],
  },
};

module.exports = nextConfig;
