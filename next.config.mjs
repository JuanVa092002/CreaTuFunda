/** @type {import('next').NextConfig} */
const nextConfig = {
  // Neon's WebSocket driver needs the real `ws` implementation at runtime;
  // bundling it breaks its native addon detection ("mask is not a function").
  serverExternalPackages: [
    'ws',
    '@neondatabase/serverless',
    '@prisma/adapter-neon',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
