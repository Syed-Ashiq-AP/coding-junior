"use client";

import { useState, useCallback } from "react";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface ChatResponse {
    response: string;
    usage?: unknown;
    model?: string;
    provider?: string;
}

interface ErrorResponse {
    error: string;
    errorType?: string;
    retryable?: boolean;
    retryAfter?: number;
}

interface UseChatResult {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    errorType: string | null;
    isRetrying: boolean;
    sendMessage: (message: string) => Promise<string | null>;
    clearChat: () => void;
    retryLastMessage: () => Promise<void>;
}

export function useChat(): UseChatResult {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);

    const makeRequest = useCallback(
        async (message: string, isRetry = false): Promise<string | null> => {
            if (isRetry) {
                setIsRetrying(true);
            } else {
                setIsLoading(true);
            }
            setError(null);
            setErrorType(null);

            try {
                const conversationHistory = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        message: message.trim(),
                        conversationHistory,
                    }),
                });

                if (!response.ok) {
                    const errorData: ErrorResponse = await response.json();
                    throw new Error(
                        JSON.stringify({
                            message:
                                errorData.error || "Failed to get AI response",
                            errorType: errorData.errorType || "unknown_error",
                            retryable: errorData.retryable || false,
                            retryAfter: errorData.retryAfter || 0,
                        })
                    );
                }

                const data: ChatResponse = await response.json();

                if (!isRetry) {
                    const aiMessage: ChatMessage = {
                        role: "assistant",
                        content: data.response,
                        timestamp: Date.now(),
                    };
                    setMessages((prev) => [...prev, aiMessage]);
                }

                return data.response;
            } catch (err: unknown) {
                let errorMessage = "Failed to send message";
                let errorTypeValue = "unknown_error";
                let retryable = false;
                let retryAfter = 0;

                if (err instanceof Error) {
                    try {
                        const parsed = JSON.parse(err.message);
                        errorMessage = parsed.message;
                        errorTypeValue = parsed.errorType;
                        retryable = parsed.retryable;
                        retryAfter = parsed.retryAfter;
                    } catch {
                        errorMessage = err.message;
                    }
                }

                console.error("Chat error:", err);
                setError(errorMessage);
                setErrorType(errorTypeValue);

                // Auto-retry for retryable errors with exponential backoff
                if (retryable && !isRetry && errorTypeValue === "rate_limit") {
                    const delay = Math.max(retryAfter * 1000, 1000); // At least 1 second
                    setTimeout(() => {
                        makeRequest(message, true);
                    }, delay);
                    return null;
                }

                if (!isRetry) {
                    // Remove the user message if this wasn't a retry
                    setMessages((prev) => prev.slice(0, -1));
                }

                return null;
            } finally {
                setIsLoading(false);
                setIsRetrying(false);
            }
        },
        [messages]
    );

    const sendMessage = useCallback(
        async (message: string): Promise<string | null> => {
            if (!message.trim()) return null;

            setLastMessage(message.trim());

            const userMessage: ChatMessage = {
                role: "user",
                content: message.trim(),
                timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, userMessage]);

            return makeRequest(message.trim());
        },
        [makeRequest]
    );

    const retryLastMessage = useCallback(async () => {
        if (!lastMessage) return;
        await makeRequest(lastMessage, true);
    }, [lastMessage, makeRequest]);

    const clearChat = useCallback(() => {
        setMessages([]);
        setError(null);
        setErrorType(null);
        setLastMessage(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        errorType,
        isRetrying,
        sendMessage,
        clearChat,
        retryLastMessage,
    };
}
