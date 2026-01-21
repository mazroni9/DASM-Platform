const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,

  // Fix monorepo root inference warning (adjust if needed)
  outputFileTracingRoot: path.join(__dirname, ".."),

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },

  async headers() {
    return [
      // ✅ Never cache API
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },

      // ✅ Cache Next build assets
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // ✅ Cache assets served from /public (served at root) by extension
      // IMPORTANT: no (?:...) here — Next doesn't support it in `source`
      {
        source:
          "/:path*.:ext(png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|woff|woff2|ttf|eot|mp4|mp3)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

      // ❌ أنصح تشيل أي rule عام زي "/:all*" لأنه ممكن يـ cache HTML بالغلط
      // لو محتاجه جدًا خليه بحذر ويفضل في production وراء CDN فقط
    ];
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
  },

  turbopack: {},
  output: "standalone",

  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons"],
  },

  serverExternalPackages: ["sharp", "sqlite3"],

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: -10,
            chunks: "all",
          },
          common: {
            name: "common",
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

module.exports = nextConfig;
