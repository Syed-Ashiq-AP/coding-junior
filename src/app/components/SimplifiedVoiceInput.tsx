"use client";

import React, { useState, useEffect } from "react";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface SimplifiedVoiceInputProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
}

export default function SimplifiedVoiceInput({
    onTranscription,
    disabled = false,
}: SimplifiedVoiceInputProps) {
    const {
        isSupported,
        isListening,
        transcript,
        confidence,
        error,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    const [lastTranscript, setLastTranscript] = useState("");
    const [processingTime, setProcessingTime] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);

    useEffect(() => {
        if (transcript && !isListening && transcript !== lastTranscript) {
            setLastTranscript(transcript);
            setProcessingTime(startTime ? Date.now() - startTime : 0);
            onTranscription(transcript);
        }
    }, [transcript, isListening, lastTranscript, onTranscription, startTime]);

    const handleToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            setStartTime(Date.now());
            startListening();
        }
    };

    const getButtonState = () => {
        if (!isSupported) return "unsupported";
        if (isListening) return "listening";
        return "ready";
    };

    const getButtonText = () => {
        switch (getButtonState()) {
            case "unsupported":
                return "Speech Recognition Not Supported";
            case "listening":
                return "Stop Recording";
            case "ready":
                return "Start Recording";
            default:
                return "Voice Input";
        }
    };

    const getButtonColor = () => {
        switch (getButtonState()) {
            case "unsupported":
                return "bg-gray-500 cursor-not-allowed";
            case "listening":
                return "bg-red-500 hover:bg-red-600 animate-pulse";
            case "ready":
                return "bg-green-500 hover:bg-green-600";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="flex flex-col items-center space-y-4">
            {}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <div
                        className={`w-2 h-2 rounded-full ${
                            isSupported ? "bg-green-400" : "bg-red-400"
                        }`}
                    />
                    <span>
                        {isSupported
                            ? "Web Speech API Ready"
                            : "Speech Recognition Not Available"}
                    </span>
                </div>
            </div>

            {}
            {isListening && transcript && (
                <div className="bg-blue-100 p-3 rounded-lg max-w-md text-center border-2 border-blue-300">
                    <div className="text-sm text-blue-600 mb-1">
                        Live transcript:
                    </div>
                    <div className="font-medium text-blue-800">
                        &quot;{transcript}&quot;
                    </div>
                </div>
            )}

            {}
            <button
                onClick={handleToggle}
                disabled={disabled || !isSupported}
                className={`
          ${getButtonColor()} 
          text-white px-8 py-4 rounded-full font-semibold text-lg
          transition-all duration-200 transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          min-w-48
        `}
            >
                <div className="flex items-center justify-center gap-2">
                    {isListening ? (
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
            {lastTranscript && !isListening && (
                <div className="bg-gray-100 p-3 rounded-lg max-w-md text-center">
                    <div className="text-sm text-gray-600 mb-1">
                        Final transcription:
                    </div>
                    <div className="font-medium">
                        &quot;{lastTranscript}&quot;
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Processed in {processingTime}ms
                        {confidence > 0 && (
                            <span>
                                {" "}
                                (Confidence: {Math.round(confidence * 100)}%)
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
