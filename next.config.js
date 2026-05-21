/** @type {import('next').NextConfig} */
// FundHub Event Ratings — Next.js configuration
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['twilio'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
