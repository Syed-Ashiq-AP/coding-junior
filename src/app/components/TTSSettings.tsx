"use client";

import React from "react";
import { useTextToSpeech } from "../hooks/useTextToSpeech";

interface TTSSettingsProps {
    className?: string;
}

export default function TTSSettings({ className = "" }: TTSSettingsProps) {
    const {
        isSupported,
        availableVoices,
        selectedVoiceId,
        setSelectedVoiceId,
        volume,
        setVolume,
        rate,
        setRate,
        pitch,
        setPitch,
        lastMetrics,
        isPlaying,
        stop,
    } = useTextToSpeech();

    if (!isSupported) {
        return (
            <div
                className={`bg-red-500/20 border border-red-500 rounded-lg p-3 ${className}`}
            >
                <div className="flex items-center gap-2 text-red-200">
                    <span>❌</span>
                    <span>Text-to-Speech not supported in this browser</span>
                </div>
            </div>
        );
    }

    const getQualityBadge = (quality: "high" | "medium" | "low") => {
        const colors = {
            high: "bg-green-500/20 text-green-300 border-green-500",
            medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500",
            low: "bg-gray-500/20 text-gray-300 border-gray-500",
        };

        return (
            <span
                className={`px-2 py-0.5 text-xs border rounded ${colors[quality]}`}
            >
                {quality.toUpperCase()}
            </span>
        );
    };

    return (
        <div
            className={`bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-4 ${className}`}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    🎵 Text-to-Speech Settings
                </h3>
                {isPlaying && (
                    <button
                        onClick={stop}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                        Stop TTS
                    </button>
                )}
            </div>

            {}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Voice ({availableVoices.length} available)
                </label>
                <select
                    value={selectedVoiceId || ""}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                    disabled={isPlaying}
                >
                    {availableVoices.length === 0 ? (
                        <option value="">Loading voices...</option>
                    ) : (
                        availableVoices.map((voice) => (
                            <option
                                key={voice.id}
                                value={voice.id}
                                className="bg-gray-800"
                            >
                                {voice.name} ({voice.lang}){" "}
                                {voice.quality === "high" ? "⭐" : ""}
                            </option>
                        ))
                    )}
                </select>

                {}
                {selectedVoiceId && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                        {(() => {
                            const selectedVoice = availableVoices.find(
                                (v) => v.id === selectedVoiceId
                            );
                            return selectedVoice ? (
                                <>
                                    <span>{selectedVoice.name}</span>
                                    {getQualityBadge(selectedVoice.quality)}
                                    <span>Lang: {selectedVoice.lang}</span>
                                </>
                            ) : null;
                        })()}
                    </div>
                )}
            </div>

            {}
            <div className="grid grid-cols-3 gap-4">
                {}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Volume
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-8">🔊</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) =>
                                setVolume(parseFloat(e.target.value))
                            }
                            className="flex-1"
                            disabled={isPlaying}
                        />
                        <span className="text-xs text-gray-400 w-8">
                            {Math.round(volume * 100)}%
                        </span>
                    </div>
                </div>

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Speed
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-8">⚡</span>
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.1"
                            value={rate}
                            onChange={(e) =>
                                setRate(parseFloat(e.target.value))
                            }
                            className="flex-1"
                            disabled={isPlaying}
                        />
                        <span className="text-xs text-gray-400 w-8">
                            {rate.toFixed(1)}x
                        </span>
                    </div>
                </div>

                {}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                        Pitch
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-8">🎶</span>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={pitch}
                            onChange={(e) =>
                                setPitch(parseFloat(e.target.value))
                            }
                            className="flex-1"
                            disabled={isPlaying}
                        />
                        <span className="text-xs text-gray-400 w-8">
                            {pitch.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {}
            {lastMetrics && (
                <div className="bg-black/20 rounded p-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                        📊 Last TTS Performance
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Init Time:</span>
                            <span className="text-green-300">
                                {lastMetrics.initTime}ms
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Synthesis:</span>
                            <span className="text-blue-300">
                                {lastMetrics.synthesisTime}ms
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Time:</span>
                            <span className="text-purple-300">
                                {lastMetrics.totalTime}ms
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Text Length:</span>
                            <span className="text-yellow-300">
                                {lastMetrics.textLength} chars
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {}
            <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                    onClick={() => {
                        setVolume(0.8);
                        setRate(1.0);
                        setPitch(1.0);
                    }}
                    className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1 rounded transition-colors"
                    disabled={isPlaying}
                >
                    Reset to Defaults
                </button>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-500">
                    {availableVoices.length} voices loaded
                </span>
            </div>
        </div>
    );
}
