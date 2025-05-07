// next.config.js (بلا export، مع دعم كل الميزات اللي تحتاجها)
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    experimental: {},
    // Configuration for Cloudflare Pages
    output: "standalone",
    distDir: ".next",
    images: {
        unoptimized: true,
    },
    webpack: (config, { isServer, dev }) => {
        // Only apply in production client builds
        if (!isServer && !dev) {
            // Configure smaller chunk sizes to stay under Cloudflare's 25MB limit
            config.optimization.splitChunks = {
                chunks: "all",
                maxInitialRequests: 30,
                minSize: 10000,
                maxSize: 15 * 1024 * 1024, // Reduced to 15MB to be extra safe
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
                        minChunks: 1,
                        reuseExistingChunk: true,
                    },
                    commons: {
                        name: "commons",
                        minChunks: 2,
                        priority: 10,
                    },
                },
            };

            // Exclude cache files from build output
            if (config.output.path) {
                config.output.path = config.output.path.replace(/\/cache$/, "");
            }

            // Disable source maps in production to reduce file sizes
            if (!dev) {
                config.devtool = false;
            }
        }
        return config;
    },
    // Add this to exclude large files from Cloudflare deployment
    poweredByHeader: false,
    compress: true,
    generateEtags: false,
};

module.exports = nextConfig;
