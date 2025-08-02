"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface WhisperStatus {
    isReady: boolean;
    isLoading: boolean;
    isTranscribing: boolean;
    error: string | null;
    loadingProgress: number;
}

interface TranscriptionResult {
    text: string;
    processingTime: number;
    confidence: number;
}

interface UseWhisperResult {
    status: WhisperStatus;
    transcribe: (audioBlob: Blob) => Promise<TranscriptionResult | null>;
    lastTranscription: TranscriptionResult | null;
}

export function useWhisper(): UseWhisperResult {
    const [status, setStatus] = useState<WhisperStatus>({
        isReady: false,
        isLoading: false,
        isTranscribing: false,
        error: null,
        loadingProgress: 0,
    });

    const [lastTranscription, setLastTranscription] =
        useState<TranscriptionResult | null>(null);
    const worker = useRef<Worker | null>(null);
    const pendingTranscription = useRef<{
        resolve: (result: TranscriptionResult | null) => void;
        reject: (error: Error) => void;
    } | null>(null);

    useEffect(() => {
        console.log("🚀 Initializing Whisper Worker...");

        try {
            worker.current = new Worker("/whisper-worker.js"); 

            worker.current.onmessage = (event) => {
                const { type, data } = event.data;
                console.log("📨 Worker message:", type, data);

                switch (type) {
                    case "worker_ready":
                        console.log(
                            "✅ Whisper Worker ready, initializing model..."
                        );
                        setStatus((prev) => ({ ...prev, isLoading: true }));
                        worker.current?.postMessage({ type: "initialize" });
                        break;

                    case "loading_progress":
                        setStatus((prev) => ({
                            ...prev,
                            loadingProgress: data.progress * 100,
                            error: null,
                        }));
                        break;

                    case "ready":
                        console.log("✅ Whisper model ready!");
                        setStatus((prev) => ({
                            ...prev,
                            isReady: true,
                            isLoading: false,
                            loadingProgress: 100,
                            error: null,
                        }));
                        break;

                    case "transcription_result":
                        console.log("✅ Transcription complete:", data);
                        setLastTranscription(data);
                        setStatus((prev) => ({
                            ...prev,
                            isTranscribing: false,
                        }));

                        if (pendingTranscription.current) {
                            pendingTranscription.current.resolve(data);
                            pendingTranscription.current = null;
                        }
                        break;

                    case "error":
                        console.error("❌ Whisper error:", data);
                        setStatus((prev) => ({
                            ...prev,
                            error: data,
                            isLoading: false,
                            isTranscribing: false,
                        }));

                        if (pendingTranscription.current) {
                            pendingTranscription.current.reject(
                                new Error(data)
                            );
                            pendingTranscription.current = null;
                        }
                        break;

                    case "status":
                        console.log("ℹ️ Whisper status:", data);
                        break;
                }
            };

            worker.current.onerror = (error) => {
                console.error("❌ Worker error:", error);
                setStatus((prev) => ({
                    ...prev,
                    error: "Worker failed to load",
                    isLoading: false,
                }));
            };
        } catch (error) {
            console.error("❌ Failed to create Whisper Worker:", error);
            setStatus((prev) => ({
                ...prev,
                error: "Failed to initialize Whisper Worker",
            }));
        }

        return () => {
            if (worker.current) {
                worker.current.terminate();
                worker.current = null;
            }
        };
    }, []);

    const convertAudioForWhisper = useCallback(
        async (audioBlob: Blob): Promise<Float32Array> => {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();

                fileReader.onload = async () => {
                    try {
                        const arrayBuffer = fileReader.result as ArrayBuffer;
                        const audioContext = new AudioContext({
                            sampleRate: 16000,
                        });
                        const audioBuffer = await audioContext.decodeAudioData(
                            arrayBuffer
                        );

                        const audioData = audioBuffer.getChannelData(0);
                        await audioContext.close();

                        resolve(audioData);
                    } catch (error) {
                        reject(error);
                    }
                };

                fileReader.onerror = () =>
                    reject(new Error("Failed to read audio file"));
                fileReader.readAsArrayBuffer(audioBlob);
            });
        },
        []
    );

    const transcribe = useCallback(
        async (audioBlob: Blob): Promise<TranscriptionResult | null> => {
            if (!status.isReady || !worker.current) {
                throw new Error("Whisper is not ready");
            }

            if (status.isTranscribing) {
                throw new Error("Transcription already in progress");
            }

            try {
                setStatus((prev) => ({
                    ...prev,
                    isTranscribing: true,
                    error: null,
                }));

                const audioData = await convertAudioForWhisper(audioBlob);

                return new Promise((resolve, reject) => {
                    pendingTranscription.current = { resolve, reject };
                    worker.current?.postMessage({
                        type: "transcribe",
                        data: { audioData },
                    });
                });
            } catch (error) {
                setStatus((prev) => ({ ...prev, isTranscribing: false }));
                throw error;
            }
        },
        [status.isReady, status.isTranscribing, convertAudioForWhisper]
    );

    return {
        status,
        transcribe,
        lastTranscription,
    };
}
