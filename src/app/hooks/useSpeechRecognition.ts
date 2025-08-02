/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseSpeechRecognitionResult {
    isSupported: boolean;
    isListening: boolean;
    transcript: string;
    confidence: number;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
    const [isSupported, setIsSupported] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [confidence, setConfidence] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);

            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
                setTranscript("");
                setConfidence(0);
            };

            recognition.onresult = (event: any) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const transcript = result[0].transcript;
                    const confidence = result[0].confidence || 0;

                    setTranscript(transcript);
                    setConfidence(confidence);
                }
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                setError(`Speech recognition error: ${event.error}`);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
            setError("Speech recognition not supported in this browser");
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setError(null);
            setTranscript("");
            setConfidence(0);
            try {
                recognitionRef.current.start();
            } catch {
                setError("Failed to start speech recognition");
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            try {
                recognitionRef.current.stop();
            } catch {
                setError("Failed to stop speech recognition");
            }
        }
    }, [isListening]);

    return {
        isSupported,
        isListening,
        transcript,
        confidence,
        error,
        startListening,
        stopListening,
    };
}
