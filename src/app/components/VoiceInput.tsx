"use client";

import React, { useState } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useWhisper } from "../hooks/useWhisper";

interface VoiceInputProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

export default function VoiceInput({
    onTranscription,
    disabled = false,
}: VoiceInputProps) {
    const {
        isRecording,
        audioLevel,
        startRecording,
        stopRecording,
        error: recordingError,
    } = useAudioRecorder();
    const {
        status: whisperStatus,
        transcribe,
        lastTranscription,
    } = useWhisper();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRecordingToggle = async () => {
        if (isRecording) {
            try {
                setIsProcessing(true);
                const audioBlob = await stopRecording();

                if (audioBlob && audioBlob.size > 0) {
                    console.log("🎵 Audio recorded, size:", audioBlob.size);
                    const result = await transcribe(audioBlob);

                    if (result && result.text.trim()) {
                        onTranscription(result.text.trim());
                    }
                }
            } catch (error) {
                console.error("❌ Transcription failed:", error);
            } finally {
                setIsProcessing(false);
            }
        } else {
            if (!whisperStatus.isReady) {
                return; 
            }
            await startRecording();
        }
    };

    const getButtonState = () => {
        if (!whisperStatus.isReady) return "loading";
        if (isProcessing || whisperStatus.isTranscribing) return "processing";
        if (isRecording) return "recording";
        return "ready";
    };

    const getButtonText = () => {
        switch (getButtonState()) {
            case "loading":
                return `Loading Model... ${Math.round(
                    whisperStatus.loadingProgress
                )}%`;
            case "processing":
                return "Processing...";
            case "recording":
                return "Stop Recording";
            case "ready":
                return "Start Recording";
            default:
                return "Voice Input";
        }
    };

    const getButtonColor = () => {
        switch (getButtonState()) {
            case "loading":
                return "bg-yellow-500 hover:bg-yellow-600";
            case "processing":
                return "bg-blue-500 animate-pulse";
            case "recording":
                return "bg-red-500 hover:bg-red-600 animate-pulse";
            case "ready":
                return "bg-green-500 hover:bg-green-600";
            default:
                return "bg-gray-500";
        }
    };

    const error = recordingError || whisperStatus.error;

    return (
        <div className="flex flex-col items-center space-y-4">
            {}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            whisperStatus.isReady
                                ? "bg-green-400"
                                : "bg-yellow-400"
                        }`}
                    />
                    <span>
                        {whisperStatus.isLoading
                            ? `Loading Whisper... ${Math.round(
                                  whisperStatus.loadingProgress
                              )}%`
                            : whisperStatus.isReady
                            ? "Whisper Ready"
                            : "Initializing..."}
                    </span>
                </div>
            </div>

            {}
            {isRecording && (
                <div className="flex items-center gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-8 rounded-full transition-all duration-100 ${
                                audioLevel * 10 > i
                                    ? "bg-red-400"
                                    : "bg-gray-300"
                            }`}
                            style={{
                                height: `${Math.max(
                                    8,
                                    audioLevel * 10 > i
                                        ? audioLevel * 40 + 8
                                        : 8
                                )}px`,
                            }}
                        />
                    ))}
                </div>
            )}

            {}
            <button
                onClick={handleRecordingToggle}
                disabled={disabled || (!whisperStatus.isReady && !isRecording)}
                className={`
          ${getButtonColor()} 
          text-white px-8 py-4 rounded-full font-semibold text-lg
          transition-all duration-200 transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          min-w-48
        `}
            >
                <div className="flex items-center justify-center gap-2">
                    {isRecording ? (
                        <div className="w-3 h-3 bg-white rounded-sm" />
                    ) : (
                        <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                    {getButtonText()}
                </div>
            </button>

            {}
            {error && (
                <div className="text-red-600 text-sm text-center max-w-md">
                    ❌ {error}
                </div>
            )}

            {}
            {lastTranscription && (
                <div className="bg-gray-100 p-3 rounded-lg max-w-md text-center">
                    <div className="text-sm text-gray-600 mb-1">
                        Last transcription:
                    </div>
                    <div className="font-medium">
                        &quot;{lastTranscription.text}&quot;
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Processed in {lastTranscription.processingTime}ms
                        (Confidence:{" "}
                        {Math.round(lastTranscription.confidence * 100)}%)
                    </div>
                </div>
            )}
        </div>
    );
}
