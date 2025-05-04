// next.config.js (بلا export، مع دعم كل الميزات اللي تحتاجها)
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {},
};

module.exports = nextConfig;
