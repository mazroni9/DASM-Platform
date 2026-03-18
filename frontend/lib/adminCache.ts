// Simple cache utility for admin data
class AdminCache {
    private cache: Map<string, { data: any; timestamp: number; ttl: number }> =
        new Map();

    set(key: string, data: any, ttlMinutes: number = 5) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlMinutes * 60 * 1000, // Convert to milliseconds
        });
    }

    get(key: string) {
        const item = this.cache.get(key);
        if (!item) return null;

        const now = Date.now();
        if (now - item.timestamp > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear(key?: string) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // Clear all expired items
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > item.ttl) {
                this.cache.delete(key);
            }
        }
    }
}

export const adminCache = new AdminCache();

// Auto cleanup every 5 minutes
if (typeof window !== "undefined") {
    setInterval(() => {
        adminCache.cleanup();
    }, 5 * 60 * 1000);
}
