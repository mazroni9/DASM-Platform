/** @type {import('next').NextConfig} */
const apiProxyTarget = (
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  ""
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
      {
        source: "/:all*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/public/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
  },
  turbopack: {
    root: __dirname,
  },
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

