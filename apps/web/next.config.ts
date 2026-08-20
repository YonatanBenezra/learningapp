import type { NextConfig } from 'next';

const backendUrl = (process.env.BACKEND_URL ?? '').trim().replace(/\/$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['three', '@aieng/shared'],
  // Bake BACKEND_URL at build time so Vercel serverless functions always have it
  // after a deploy (dashboard env vars are injected before `next build`).
  env: {
    BACKEND_URL: backendUrl,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
