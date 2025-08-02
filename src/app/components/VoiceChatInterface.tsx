"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../hooks/useChat";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

export default function VoiceChatInterface() {
    const {
        messages,
        isLoading,
        error,
        errorType,
        isRetrying,
        isOnline,
        cacheStatus,
        sendMessage,
        clearChat,
        clearCache,
        retryLastMessage,
    } = useChat();
    const {
        speak,
        isPlaying: isSpeaking,
        isSupported: ttsSupported,
    } = useTextToSpeech();
    const {
        isSupported: sttSupported,
        isListening,
        transcript,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    const [isActive, setIsActive] = useState(false);
    const [showMessages, setShowMessages] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const lastProcessedTranscript = useRef<string>("");
    const isProcessing = useRef<boolean>(false);

    const handleVoiceInput = useCallback(
        async (text: string) => {
            if (
                !text.trim() ||
                isProcessing.current ||
                lastProcessedTranscript.current === text.trim()
            ) {
                return;
            }

            lastProcessedTranscript.current = text.trim();
            isProcessing.current = true;

            try {
                const response = await sendMessage(text);

                if (response && ttsSupported) {
                    try {
                        await speak(response);
                    } catch (error) {
                        console.error("TTS failed:", error);
                    }
                }
            } finally {
                isProcessing.current = false;
            }
        },
        [sendMessage, speak, ttsSupported]
    );

    useEffect(() => {
        if (transcript && !isListening && transcript.trim()) {
            handleVoiceInput(transcript);
        }
    }, [transcript, isListening, handleVoiceInput]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
            setIsActive(false);
        } else {
            lastProcessedTranscript.current = "";
            startListening();
            setIsActive(true);
        }
    };

    const toggleMessages = () => {
        setShowMessages(!showMessages);
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isListening) {
            interval = setInterval(() => {
                setAudioLevel(Math.random() * 0.8 + 0.2);
            }, 100);
        } else {
            setAudioLevel(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isListening]);

    if (!sttSupported) {
        return (
            <div className="text-center max-w-md mx-auto">
                <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 backdrop-blur-md">
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Browser Not Supported
                    </h2>
                    <p className="text-gray-300">
                        Please use Chrome, Edge, or Safari for voice
                        recognition.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4">
            <div className="text-center">
                <div className="relative inline-block mb-8">
                    <div
                        className={`relative w-32 h-32 md:w-40 md:h-40 transition-all duration-500 ${
                            isActive ? "scale-110" : "scale-100"
                        }`}
                    >
                        <div
                            className={`absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ${
                                isActive
                                    ? "animate-pulse opacity-20 scale-150"
                                    : "opacity-0 scale-100"
                            }`}
                        ></div>

                        <div
                            className={`absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-700 ${
                                isActive
                                    ? "animate-pulse opacity-30 scale-125"
                                    : "opacity-0 scale-100"
                            }`}
                        ></div>

                        {isActive && (
                            <div className="absolute inset-0 rounded-full">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping"
                                        style={{
                                            animationDelay: `${i * 0.3}s`,
                                            animationDuration: "2s",
                                        }}
                                    ></div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleMicClick}
                            disabled={isLoading || isSpeaking}
                            className={`relative w-full h-full rounded-full bg-gradient-to-br from-gray-900 to-black border-2 border-gray-800 hover:border-purple-400 transition-all duration-300 shadow-2xl backdrop-blur-md group ${
                                isActive
                                    ? "border-purple-400 shadow-purple-500/25"
                                    : ""
                            } ${
                                isLoading || isSpeaking
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:scale-105"
                            }`}
                        >
                            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/5 to-transparent"></div>

                            <div className="relative z-10 flex items-center justify-center h-full">
                                {isLoading ? (
                                    <div className="animate-spin text-4xl">
                                        🤖
                                    </div>
                                ) : isSpeaking ? (
                                    <div className="animate-pulse text-4xl">
                                        🔊
                                    </div>
                                ) : isListening ? (
                                    <div className="text-4xl animate-pulse text-red-400">
                                        🎤
                                    </div>
                                ) : (
                                    <div className="text-4xl group-hover:scale-110 transition-transform">
                                        🎤
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>

                    {isActive && (
                        <div className="mt-6 flex justify-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-gradient-to-t from-purple-500 to-blue-400 rounded-full animate-wave transition-all duration-150"
                                    style={{
                                        width: "4px",
                                        height: `${
                                            8 +
                                            audioLevel *
                                                40 *
                                                (0.5 + Math.random() * 0.5)
                                        }px`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4 mb-8">
                    <p className="text-xl md:text-2xl text-white font-medium">
                        {isRetrying
                            ? "Retrying..."
                            : isLoading
                            ? "Processing..."
                            : isSpeaking
                            ? "Speaking..."
                            : isListening
                            ? "Listening..."
                            : "Tap to start speaking"}
                    </p>

                    {transcript && (
                        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 max-w-lg mx-auto border border-gray-700">
                            <p className="text-gray-400 text-sm">You said:</p>
                            <p className="text-gray-100">
                                &ldquo;{transcript}&rdquo;
                            </p>
                        </div>
                    )}

                    {error && (
                        <div
                            className={`backdrop-blur-md rounded-2xl p-4 max-w-lg mx-auto border ${
                                errorType === "rate_limit"
                                    ? "bg-yellow-500/20 border-yellow-500/30"
                                    : errorType === "quota_exceeded"
                                    ? "bg-red-500/20 border-red-500/30"
                                    : "bg-red-500/20 border-red-500/30"
                            }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="text-2xl">
                                    {errorType === "rate_limit"
                                        ? "⏳"
                                        : errorType === "quota_exceeded"
                                        ? "💳"
                                        : errorType === "auth_error"
                                        ? "🔑"
                                        : errorType === "service_unavailable"
                                        ? "🚧"
                                        : "⚠️"}
                                </div>
                                <div className="flex-1">
                                    <p
                                        className={`${
                                            errorType === "rate_limit"
                                                ? "text-yellow-300"
                                                : errorType === "quota_exceeded"
                                                ? "text-red-300"
                                                : "text-red-300"
                                        }`}
                                    >
                                        {error}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {(errorType === "rate_limit" ||
                                            errorType ===
                                                "service_unavailable") && (
                                            <button
                                                onClick={retryLastMessage}
                                                disabled={isRetrying}
                                                className="bg-yellow-500/20 hover:bg-yellow-500/30 disabled:opacity-50 text-yellow-300 px-3 py-1 rounded-lg text-sm transition-colors"
                                            >
                                                {isRetrying
                                                    ? "Retrying..."
                                                    : "Try Again"}
                                            </button>
                                        )}
                                        <button
                                            onClick={clearChat}
                                            className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-3 py-1 rounded-lg text-sm transition-colors"
                                        >
                                            Clear Error
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {messages.length > 0 && (
                    <div className="text-center">
                        <button
                            onClick={toggleMessages}
                            className="bg-black/20 backdrop-blur-md border border-gray-700 hover:bg-black/30 text-gray-100 px-6 py-3 rounded-full transition-all duration-300 shadow-lg"
                        >
                            {showMessages
                                ? "Hide Chat"
                                : `Show Chat (${messages.length})`}
                        </button>
                    </div>
                )}

                {showMessages && messages.length > 0 && (
                    <div className="mt-8 bg-black/10 backdrop-blur-md rounded-2xl p-6 max-w-2xl mx-auto border border-gray-800 max-h-[50vh] md:max-h-[60vh] overflow-y-auto chat-history-scroll relative">
                        <div className="space-y-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`text-left ${
                                        message.role === "user"
                                            ? "text-blue-300"
                                            : "text-green-300"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="text-xs uppercase tracking-wide opacity-70">
                                            {message.role === "user" ? "You" : "AI"}
                                        </div>
                                        <div className="flex space-x-1">
                                            {message.cached && (
                                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                                    📦 Cached
                                                </span>
                                            )}
                                            {message.offline && (
                                                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                                                    🔌 Offline
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-black/20 rounded-lg p-3 border border-gray-800">
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Scroll indicator gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-b-2xl"></div>
                        <div className="flex space-x-2 mt-4">
                            <button
                                onClick={clearChat}
                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 py-2 rounded-lg transition-colors relative z-10"
                            >
                                Clear Chat
                            </button>
                            <button
                                onClick={clearCache}
                                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 py-2 rounded-lg transition-colors relative z-10"
                            >
                                Clear Cache
                            </button>
                        </div>
                    </div>
                )}

                {/* Status and Cache Indicator */}
                <div className="fixed bottom-4 left-4 flex flex-col space-y-2">
                    {/* Online/Offline Status */}
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-full backdrop-blur-md border text-sm ${
                        isOnline 
                            ? 'bg-green-500/20 border-green-500/30 text-green-300' 
                            : 'bg-red-500/20 border-red-500/30 text-red-300'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                        <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Cache Status */}
                    {cacheStatus.enabled && (
                        <div className="flex items-center space-x-2 px-3 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 backdrop-blur-md text-sm">
                            <span>📦</span>
                            <span>Cache: {cacheStatus.size}KB</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
