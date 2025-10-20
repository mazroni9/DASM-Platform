/** @type {import('next').NextConfig} */
const normalize = (url) => (url || '').replace(/\/$/, '');

const API_BASE =
  process.env.LARAVEL_API_BASE
    ? normalize(process.env.LARAVEL_API_BASE) // مثال: https://api.example.com/api
    : (process.env.NODE_ENV === 'development'
        ? 'http://localhost:8000/api'
        : ''); // في الإنتاج لازم تتحدد صراحة

const nextConfig = {
  reactStrictMode: false,
  compress: true,

  // ملاحظة: لو API_BASE فاضي في الإنتاج، مافيش rewrites ونداءات /api/* هتعمل 404.
  async rewrites() {
    if (!API_BASE) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/:path*`,
      },
    ];
  },

  async headers() {
    return [
      // لا نكاش لـ /api (المسارات دي بتتروّح للـ Laravel)
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // كاش عام لمعظم الصفحات
      {
        source: '/:all*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      // كاش قوي لملفات Next الثابتة
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ملفات من الجذر (public/* بتتقدّم من / مباشرة)
      {
        source: '/:path*{.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2)}',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
  },

  // يصلح للنشر بـ next start أو Docker
  output: 'standalone',

  experimental: {
    forceSwcTransforms: true,
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },

  serverExternalPackages: ['sharp', 'sqlite3'],

  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: -5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

if (process.env.NODE_ENV === 'production' && !API_BASE) {
  // تحذير مفيد وقت البناء/التشغيل
  console.warn('⚠️  LARAVEL_API_BASE غير مُعَرَّف في الإنتاج — نداءات /api/* ستُرجِع 404.');
}

module.exports = nextConfig;
