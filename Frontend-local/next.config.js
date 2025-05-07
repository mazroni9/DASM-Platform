// next.config.js (بلا export، مع دعم كل الميزات اللي تحتاجها)
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {},
    // Configuration for Cloudflare Pages
    output: "standalone",
    distDir: ".next-cloudflare",
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer, dev }) => {
        // Only apply in production client builds
        if (!isServer && !dev) {
            // Configure smaller chunk sizes to stay under Cloudflare's 25MB limit
            config.optimization.splitChunks = {
                chunks: "all",
                maxInitialRequests: 25,
                minSize: 20000,
                maxSize: 20 * 1024 * 1024, // 20MB max size to be safe
                cacheGroups: {
                    default: false,
                    vendors: false,
                    framework: {
                        name: "framework",
                        test: /[\\/]node_modules[\\/](@react|react|react-dom|next|scheduler)[\\/]/,
                        priority: 40,
                        chunks: "all",
                    },
                    lib: {
                        test: /[\\/]node_modules[\\/]/,
                        name(module) {
                            // Get the package name
                            const packageName = module.context.match(
                                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                            )[1];
                            return `npm.${packageName.replace("@", "")}`;
                        },
                        priority: 20,
                        minChunks: 2,
                        reuseExistingChunk: true,
                    },
                    commons: {
                        name: "commons",
                        minChunks: 2,
                        priority: 10,
                    },
                },
            };
        }
        return config;
    },
};

module.exports = nextConfig;
