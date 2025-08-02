import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable static file serving
    trailingSlash: false,

    // Add headers for Service Worker
    async headers() {
        return [
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=0, must-revalidate",
                    },
                    {
                        key: "Service-Worker-Allowed",
                        value: "/",
                    },
                ],
            },
        ];
    },

    // Ensure manifest.json is served correctly
    async rewrites() {
        return [
            {
                source: "/manifest.json",
                destination: "/manifest.json",
            },
        ];
    },
};

export default nextConfig;
