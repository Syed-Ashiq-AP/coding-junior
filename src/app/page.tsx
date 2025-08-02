"use client";

import VoiceChatInterface from "./components/VoiceChatInterface";

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>

            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="pt-8 pb-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-300 bg-clip-text text-transparent mb-2">
                        Voice AI
                    </h1>
                    <p className="text-gray-300 text-lg max-w-md mx-auto">
                        Speak naturally and get intelligent responses
                    </p>
                </header>

                <main className="flex-1 flex items-center justify-center px-4">
                    <VoiceChatInterface />
                </main>
            </div>
        </div>
    );
}
