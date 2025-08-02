"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface TTSVoice {
    voice: SpeechSynthesisVoice;
    id: string;
    name: string;
    lang: string;
    quality: "high" | "medium" | "low";
}

interface TTSMetrics {
    initTime: number;
    synthesisTime: number;
    totalTime: number;
    textLength: number;
    audioLength: number;
}

interface UseTextToSpeechResult {
    isSupported: boolean;
    isLoading: boolean;
    isPlaying: boolean;
    availableVoices: TTSVoice[];
    selectedVoiceId: string | null;
    setSelectedVoiceId: (voiceId: string) => void;
    volume: number;
    setVolume: (volume: number) => void;
    rate: number;
    setRate: (rate: number) => void;
    pitch: number;
    setPitch: (pitch: number) => void;
    lastMetrics: TTSMetrics | null;
    speak: (text: string) => Promise<void>;
    stop: () => void;
    pause: () => void;
    resume: () => void;
    isPaused: boolean;
}

export function useTextToSpeech(): UseTextToSpeechResult {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.8);
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [lastMetrics, setLastMetrics] = useState<TTSMetrics | null>(null);

    const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
    const isSupported =
        typeof window !== "undefined" && "speechSynthesis" in window;

    const getVoiceQuality = (
        voice: SpeechSynthesisVoice
    ): "high" | "medium" | "low" => {
        const premiumKeywords = [
            "premium",
            "enhanced",
            "neural",
            "natural",
            "microsoft",
            "google",
        ];
        const voiceName = voice.name.toLowerCase();

        if (premiumKeywords.some((keyword) => voiceName.includes(keyword))) {
            return "high";
        }

        if (voice.localService) {
            return "medium";
        }

        return "low";
    };

    const stop = useCallback(() => {
        if (!isSupported) return;

        if (currentUtterance.current) {
            speechSynthesis.cancel();
            currentUtterance.current = null;
            setIsPlaying(false);
            setIsLoading(false);
            setIsPaused(false);
            console.log("🎵 TTS stopped");
        }
    }, [isSupported]);

    const loadVoices = useCallback(() => {
        if (!isSupported) return;

        const voices = speechSynthesis.getVoices();
        console.log("🎵 Available TTS voices:", voices.length);

        if (voices.length === 0) {
            setTimeout(loadVoices, 100);
            return;
        }

        const mappedVoices: TTSVoice[] = voices
            .filter((voice) => voice.lang.startsWith("en")) 
            .map((voice) => ({
                voice,
                id: `${voice.name}-${voice.lang}`,
                name: voice.name,
                lang: voice.lang,
                quality: getVoiceQuality(voice),
            }))
            .sort((a, b) => {
                if (a.quality !== b.quality) {
                    const qualityOrder = { high: 0, medium: 1, low: 2 };
                    return qualityOrder[a.quality] - qualityOrder[b.quality];
                }
                return a.name.localeCompare(b.name);
            });

        setAvailableVoices(mappedVoices);

        if (!selectedVoiceId && mappedVoices.length > 0) {
            const bestVoice = mappedVoices[0];
            setSelectedVoiceId(bestVoice.id);
            console.log("🎵 Auto-selected best voice:", bestVoice.name);
        }
    }, [isSupported, selectedVoiceId]);

    useEffect(() => {
        if (!isSupported) return;

        loadVoices();

        const handleVoicesChanged = () => {
            console.log("🎵 Voices changed, reloading...");
            loadVoices();
        };

        speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);

        return () => {
            speechSynthesis.removeEventListener(
                "voiceschanged",
                handleVoicesChanged
            );
        };
    }, [loadVoices, isSupported]);

    const speak = useCallback(
        async (text: string): Promise<void> => {
            if (!isSupported || !text.trim()) {
                console.warn("🎵 TTS not supported or empty text");
                return;
            }

            stop();

            setIsLoading(true);
            setIsPaused(false);

            const startTime = Date.now();
            console.log(
                "🎵 Starting TTS for text:",
                text.substring(0, 50) + "..."
            );

            try {
                const utterance = new SpeechSynthesisUtterance(text.trim());
                currentUtterance.current = utterance;

                const selectedVoice = availableVoices.find(
                    (v) => v.id === selectedVoiceId
                );
                if (selectedVoice) {
                    utterance.voice = selectedVoice.voice;
                    console.log("🎵 Using voice:", selectedVoice.name);
                }

                utterance.volume = volume;
                utterance.rate = rate;
                utterance.pitch = pitch;

                const synthesisStartTime = Date.now();

                return new Promise<void>((resolve, reject) => {
                    utterance.onstart = () => {
                        const synthesisTime = Date.now() - synthesisStartTime;
                        console.log(
                            "🎵 TTS started, synthesis time:",
                            synthesisTime + "ms"
                        );
                        setIsLoading(false);
                        setIsPlaying(true);
                    };

                    utterance.onend = () => {
                        const totalTime = Date.now() - startTime;
                        const synthesisTime = Date.now() - synthesisStartTime;

                        console.log("🎵 TTS completed:", {
                            totalTime,
                            synthesisTime,
                            textLength: text.length,
                        });

                        const metrics: TTSMetrics = {
                            initTime: synthesisStartTime - startTime,
                            synthesisTime,
                            totalTime,
                            textLength: text.length,
                            audioLength: totalTime - synthesisTime, 
                        };

                        setLastMetrics(metrics);
                        setIsPlaying(false);
                        setIsPaused(false);
                        currentUtterance.current = null;
                        resolve();
                    };

                    utterance.onerror = (event) => {
                        console.error("🎵 TTS error:", event);
                        setIsLoading(false);
                        setIsPlaying(false);
                        setIsPaused(false);
                        currentUtterance.current = null;
                        reject(new Error(`TTS error: ${event.error}`));
                    };

                    utterance.onpause = () => {
                        console.log("🎵 TTS paused");
                        setIsPaused(true);
                    };

                    utterance.onresume = () => {
                        console.log("🎵 TTS resumed");
                        setIsPaused(false);
                    };

                    speechSynthesis.speak(utterance);
                });
            } catch (error) {
                console.error("🎵 TTS setup error:", error);
                setIsLoading(false);
                setIsPlaying(false);
                currentUtterance.current = null;
                throw error;
            }
        },
        [
            isSupported,
            availableVoices,
            selectedVoiceId,
            volume,
            rate,
            pitch,
            stop,
        ]
    );

    const pause = useCallback(() => {
        if (!isSupported || !isPlaying) return;

        speechSynthesis.pause();
        console.log("🎵 TTS pause requested");
    }, [isSupported, isPlaying]);

    const resume = useCallback(() => {
        if (!isSupported || !isPaused) return;

        speechSynthesis.resume();
        console.log("🎵 TTS resume requested");
    }, [isSupported, isPaused]);

    return {
        isSupported,
        isLoading,
        isPlaying,
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
        speak,
        stop,
        pause,
        resume,
        isPaused,
    };
}
