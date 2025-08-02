"use client";

import { useEffect, useState } from "react";

interface ServiceWorkerStatus {
    isSupported: boolean;
    isRegistered: boolean;
    isOnline: boolean;
    cacheStatus?: {
        cached: string[];
        cacheSize: number;
    };
}

export default function ServiceWorkerProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [swStatus, setSWStatus] = useState<ServiceWorkerStatus>({
        isSupported: false,
        isRegistered: false,
        isOnline: true,
    });

    useEffect(() => {
        console.log("🚀 ServiceWorkerProvider mounting...");

        if ("serviceWorker" in navigator) {
            console.log("✅ Service Workers supported");
            setSWStatus((prev) => ({ ...prev, isSupported: true }));

            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log(
                        "✅ Service Worker registered successfully:",
                        registration
                    );
                    setSWStatus((prev) => ({ ...prev, isRegistered: true }));

                    registration.addEventListener("updatefound", () => {
                        console.log("🔄 Service Worker update found");
                    });
                })
                .catch((error) => {
                    console.error(
                        "❌ Service Worker registration failed:",
                        error
                    );
                    console.error("Error details:", error.message, error.stack);
                });

            navigator.serviceWorker.addEventListener("message", (event) => {
                console.log("📨 Message from SW:", event.data);
            });
        } else {
            console.log("❌ Service Workers not supported");
        }

        const handleOnline = () =>
            setSWStatus((prev) => ({ ...prev, isOnline: true }));
        const handleOffline = () =>
            setSWStatus((prev) => ({ ...prev, isOnline: false }));

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <>
            {children}
            <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-xs font-mono">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            swStatus.isOnline ? "bg-green-400" : "bg-red-400"
                        }`}
                    />
                    <span>{swStatus.isOnline ? "Online" : "Offline"}</span>
                    {swStatus.isRegistered && (
                        <span className="text-green-400">• SW Active</span>
                    )}
                </div>
            </div>
        </>
    );
}
