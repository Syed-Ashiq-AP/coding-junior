"use client";

import { useState, useEffect } from "react";
import VoiceChatInterface from "./components/VoiceChatInterface";

export default function Home() {
    const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            setCanInstall(true);
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt || !("prompt" in installPrompt)) return;
        await (installPrompt as { prompt: () => Promise<void> }).prompt();
        setInstallPrompt(null);
        setCanInstall(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="pt-8 pb-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                        Voice AI
                    </h1>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                        Speak naturally and get intelligent responses
                    </p>
                </header>

                <main className="flex-1 flex items-center justify-center px-4">
                    <VoiceChatInterface />
                </main>

                {canInstall && (
                    <div className="fixed bottom-6 right-6">
                        <button
                            onClick={handleInstall}
                            className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all duration-300 text-sm shadow-lg"
                        >
                            📱 Install App
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
