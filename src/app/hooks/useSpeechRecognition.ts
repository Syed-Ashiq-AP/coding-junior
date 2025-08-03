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
    const isStartingRef = useRef(false);

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
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log("🎤 Speech recognition started");
                setIsListening(true);
                setError(null);
                setTranscript("");
                setConfidence(0);
                isStartingRef.current = false;
            };

            recognition.onresult = (event: any) => {
                const result = event.results[event.results.length - 1];
                if (result.isFinal) {
                    const transcript = result[0].transcript;
                    const confidence = result[0].confidence || 0;

                    console.log(
                        "🗣️ Speech recognized:",
                        transcript,
                        "Confidence:",
                        confidence
                    );
                    setTranscript(transcript);
                    setConfidence(confidence);
                }
            };

            recognition.onend = () => {
                console.log("🔇 Speech recognition ended");
                setIsListening(false);
                isStartingRef.current = false;
            };

            recognition.onerror = (event: any) => {
                console.error("❌ Speech recognition error:", event.error);

                // Handle specific errors gracefully
                let errorMessage = `Speech recognition error: ${event.error}`;

                switch (event.error) {
                    case "not-allowed":
                        errorMessage =
                            "Microphone access denied. Please allow microphone permissions.";
                        break;
                    case "no-speech":
                        errorMessage = "No speech detected. Please try again.";
                        break;
                    case "audio-capture":
                        errorMessage =
                            "No microphone found. Please check your microphone.";
                        break;
                    case "network":
                        errorMessage =
                            "Network error during speech recognition.";
                        break;
                    case "aborted":
                        // Don't show error for aborted (user stopped)
                        errorMessage = "";
                        break;
                }

                if (errorMessage) {
                    setError(errorMessage);
                }
                setIsListening(false);
                isStartingRef.current = false;
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
            setError("Speech recognition not supported in this browser");
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    console.log("Cleanup: Recognition already stopped");
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current || !isSupported) {
            setError("Speech recognition not available");
            return;
        }

        if (isListening || isStartingRef.current) {
            console.log("Already listening or starting...");
            return;
        }

        setError(null);
        setTranscript("");
        setConfidence(0);
        isStartingRef.current = true;

        try {
            console.log("🎤 Starting speech recognition...");
            recognitionRef.current.start();
        } catch (error) {
            console.error("Failed to start speech recognition:", error);
            setError("Failed to start speech recognition. Please try again.");
            setIsListening(false);
            isStartingRef.current = false;
        }
    }, [isListening, isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && (isListening || isStartingRef.current)) {
            try {
                console.log("🔇 Stopping speech recognition...");
                recognitionRef.current.stop();
            } catch (error) {
                console.error("Failed to stop speech recognition:", error);
                setError("Failed to stop speech recognition");
                setIsListening(false);
                isStartingRef.current = false;
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
