import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerProvider from "./components/ServiceWorkerProvider";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Voice Chat AI",
    description: "Offline voice chat with AI using local speech processing",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Voice Chat AI",
    },
    icons: {
        icon: "/icon-192x192.png",
        apple: "/icon-192x192.png",
    },
};

export function generateViewport() {
    return {
        width: "device-width",
        initialScale: 1,
        maximumScale: 1,
        userScalable: 0,
        themeColor: "#000000",
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
            </body>
        </html>
    );
}
