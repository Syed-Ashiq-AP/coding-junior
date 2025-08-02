"use client";

import { useState, useRef, useCallback } from "react";

interface UseAudioRecorderResult {
    isRecording: boolean;
    audioLevel: number;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderResult {
    const [isRecording, setIsRecording] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    const animationFrame = useRef<number | undefined>(undefined);
    const audioChunks = useRef<Blob[]>([]);

    const monitorAudioLevel = useCallback(() => {
        if (!analyser.current) return;

        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteFrequencyData(dataArray);

        const average =
            dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = average / 255;

        setAudioLevel(normalizedLevel);

        if (isRecording) {
            animationFrame.current = requestAnimationFrame(monitorAudioLevel);
        }
    }, [isRecording]);

    const startRecording = useCallback(async () => {
        try {
            setError(null);
            audioChunks.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                },
            });

            audioContext.current = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.current.createMediaStreamSource(stream);
            analyser.current = audioContext.current.createAnalyser();
            analyser.current.fftSize = 256;
            source.connect(analyser.current);

            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: "audio/webm;codecs=opus",
            });

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.current.push(event.data);
                }
            };

            mediaRecorder.current.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                setError("Recording failed");
                setIsRecording(false);
            };

            mediaRecorder.current.start(100);
            setIsRecording(true);

            monitorAudioLevel();

            console.log("🎤 Recording started");
        } catch (err) {
            console.error("Failed to start recording:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to access microphone"
            );
        }
    }, [monitorAudioLevel]);

    const stopRecording = useCallback(async (): Promise<Blob | null> => {
        return new Promise((resolve) => {
            if (!mediaRecorder.current || !isRecording) {
                resolve(null);
                return;
            }

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: "audio/webm",
                });

                if (audioContext.current) {
                    audioContext.current.close();
                }
                if (animationFrame.current) {
                    cancelAnimationFrame(animationFrame.current);
                }

                const tracks = mediaRecorder.current?.stream.getTracks();
                tracks?.forEach((track) => track.stop());

                setIsRecording(false);
                setAudioLevel(0);
                console.log(
                    "🎤 Recording stopped, audio blob size:",
                    audioBlob.size
                );

                resolve(audioBlob);
            };

            mediaRecorder.current.stop();
        });
    }, [isRecording]);

    return {
        isRecording,
        audioLevel,
        startRecording,
        stopRecording,
        error,
    };
}
