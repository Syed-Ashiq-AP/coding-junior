"use client";

import React, { useState } from "react";
import SimplifiedVoiceInput from "./SimplifiedVoiceInput";
import TTSSettings from "./TTSSettings";
import { useChat } from "../hooks/useChat";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface ChatInterfaceProps {
    className?: string;
}

export default function ChatInterface({ className = "" }: ChatInterfaceProps) {
    const { messages, isLoading, error, sendMessage, clearChat } = useChat();
    const {
        speak,
        isPlaying: isSpeaking,
        stop: stopSpeaking,
        isSupported: ttsSupported,
        lastMetrics: ttsMetrics,
    } = useTextToSpeech();

    const [inputText, setInputText] = useState("");
    const [lastTranscript, setLastTranscript] = useState("");
    const [autoTTS, setAutoTTS] = useState(true);
    const [showTTSSettings, setShowTTSSettings] = useState(false);

    const handleVoiceTranscription = async (transcript: string) => {
        setLastTranscript(transcript);
        setInputText(transcript);

        const response = await sendMessage(transcript);

        if (autoTTS && ttsSupported && response) {
            try {
                await speak(response);
            } catch (error) {
                console.error("Auto-TTS failed:", error);
            }
        }
    };

    const handleTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !isLoading) {
            const response = await sendMessage(inputText.trim());
            setInputText("");

            if (autoTTS && ttsSupported && response) {
                try {
                    await speak(response);
                } catch (error) {
                    console.error("Auto-TTS failed:", error);
                }
            }
        }
    };

    const handleManualTTS = async (text: string) => {
        if (!ttsSupported) return;

        try {
            if (isSpeaking) {
                stopSpeaking();
            } else {
                await speak(text);
            }
        } catch (error) {
            console.error("Manual TTS failed:", error);
        }
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={`flex flex-col h-full ${className}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-blue-400">
                        Voice Chat AI
                    </h2>
                    <div className="flex items-center gap-4 mt-2">
                        {ttsSupported && (
                            <>
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={autoTTS}
                                        onChange={(e) =>
                                            setAutoTTS(e.target.checked)
                                        }
                                        className="rounded"
                                    />
                                    Auto-speak responses
                                </label>
                                <button
                                    onClick={() =>
                                        setShowTTSSettings(!showTTSSettings)
                                    }
                                    className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded transition-colors"
                                >
                                    🎵 TTS Settings
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            🔇 Stop TTS
                        </button>
                    )}
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            Clear Chat
                        </button>
                    )}
                </div>
            </div>

            {showTTSSettings && (
                <div className="mb-4">
                    <TTSSettings />
                </div>
            )}

            <div className="flex-1 bg-black/20 rounded-lg p-4 mb-6 min-h-64 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8">
                        <div className="text-4xl mb-2">💬</div>
                        <p>Start a conversation by speaking or typing!</p>
                        <p className="text-sm mt-2">
                            Voice → AI → Speech (Complete Loop)
                        </p>
                        {ttsSupported && (
                            <p className="text-xs mt-1 text-green-400">
                                ✅ Text-to-Speech ready • Auto-speak:{" "}
                                {autoTTS ? "ON" : "OFF"}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${
                                    message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-600 text-white"
                                    }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-xs">
                                            {message.role === "user"
                                                ? "🎤"
                                                : "🤖"}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                {message.content}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs opacity-70">
                                                    {formatTime(
                                                        message.timestamp
                                                    )}
                                                </p>

                                                {message.role === "assistant" &&
                                                    ttsSupported && (
                                                        <button
                                                            onClick={() =>
                                                                handleManualTTS(
                                                                    message.content
                                                                )
                                                            }
                                                            className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded ml-2 transition-colors"
                                                            disabled={isLoading}
                                                        >
                                                            {isSpeaking
                                                                ? "🔇"
                                                                : "🎵"}
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-600 text-white max-w-xs px-4 py-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">🤖</span>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                            <div
                                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: "0.1s",
                                                }}
                                            ></div>
                                            <div
                                                className="w-2 h-2 bg-white rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: "0.2s",
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isSpeaking && (
                            <div className="flex justify-start">
                                <div className="bg-purple-600/30 border border-purple-500 text-purple-200 max-w-xs px-4 py-2 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">🎵</span>
                                        <span className="text-sm">
                                            Speaking...
                                        </span>
                                        {ttsMetrics && (
                                            <span className="text-xs opacity-70">
                                                ({ttsMetrics.textLength} chars)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
                <SimplifiedVoiceInput
                    onTranscription={handleVoiceTranscription}
                    disabled={isLoading || isSpeaking}
                />
            </div>

            <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Or type your message here..."
                    disabled={isLoading || isSpeaking}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim() || isLoading || isSpeaking}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
                >
                    Send
                </button>
            </form>

            {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200">
                    <div className="flex items-center gap-2">
                        <span>❌</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="mt-4 flex gap-4 text-xs text-gray-400">
                {lastTranscript && (
                    <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-2 text-blue-200 flex-1">
                        <div className="flex items-center gap-2">
                            <span>🎤</span>
                            <span>
                                Last voice: &quot;{lastTranscript}&quot;
                            </span>
                        </div>
                    </div>
                )}

                {ttsSupported && (
                    <div className="bg-purple-500/20 border border-purple-500 rounded-lg p-2 text-purple-200">
                        <div className="flex items-center gap-2">
                            <span>🎵</span>
                            <span>
                                TTS: {isSpeaking ? "Speaking" : "Ready"}
                            </span>
                            {ttsMetrics && (
                                <span className="opacity-70">
                                    (Last: {ttsMetrics.totalTime}ms)
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
