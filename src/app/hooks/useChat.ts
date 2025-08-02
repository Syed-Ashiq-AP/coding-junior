"use client";

import { useState, useCallback, useEffect } from "react";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    cached?: boolean;
    offline?: boolean;
}

interface CachedResponse {
    response: string;
    timestamp: number;
    messageHash: string;
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
    isOnline: boolean;
    cacheStatus: { size: number; enabled: boolean };
    sendMessage: (message: string) => Promise<string | null>;
    clearChat: () => void;
    clearCache: () => void;
    retryLastMessage: () => Promise<void>;
}

// Simple hash function for caching similar messages
function hashMessage(message: string): string {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
        const char = message.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

// Offline responses for common queries
const OFFLINE_RESPONSES = [
    {
        keywords: ["hello", "hi", "hey", "greeting"],
        response: "Hello! I'm currently in offline mode, but I can still chat with you using cached responses. How can I help you today?"
    },
    {
        keywords: ["help", "what can you do", "capabilities"],
        response: "I'm an AI assistant running in offline mode. I have limited functionality right now, but I can provide cached responses to common questions. When you're back online, I'll have full access to my knowledge base."
    },
    {
        keywords: ["weather", "temperature", "forecast"],
        response: "I'm sorry, I can't check the current weather while offline. Please connect to the internet for real-time weather information."
    },
    {
        keywords: ["time", "date", "today"],
        response: `The current time is ${new Date().toLocaleTimeString()} and today is ${new Date().toLocaleDateString()}.`
    },
    {
        keywords: ["offline", "connection", "internet"],
        response: "Yes, you're currently offline. I'm using cached responses and local processing. Some features may be limited until you reconnect to the internet."
    }
];

function findOfflineResponse(message: string): string {
    const lowercaseMessage = message.toLowerCase();
    
    for (const response of OFFLINE_RESPONSES) {
        if (response.keywords.some(keyword => lowercaseMessage.includes(keyword))) {
            return response.response;
        }
    }
    
    return "I'm currently offline and don't have a cached response for that question. Please try again when you're connected to the internet.";
}

export function useChat(): UseChatResult {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorType, setErrorType] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastMessage, setLastMessage] = useState<string | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [cacheStatus, setCacheStatus] = useState({ size: 0, enabled: true });

    const updateCacheStatus = useCallback(() => {
        try {
            const responses = localStorage.getItem('voiceai-responses');
            const messages = localStorage.getItem('voiceai-messages');
            const size = (responses?.length || 0) + (messages?.length || 0);
            setCacheStatus({ size: Math.round(size / 1024), enabled: true });
        } catch {
            setCacheStatus({ size: 0, enabled: false });
        }
    }, []);

    const loadCachedMessages = useCallback(() => {
        try {
            const cached = localStorage.getItem('voiceai-messages');
            if (cached) {
                const parsedMessages = JSON.parse(cached);
                setMessages(parsedMessages);
            }
        } catch {
            console.error('Failed to load cached messages');
        }
    }, []);

    const saveMessagesToCache = useCallback((newMessages: ChatMessage[]) => {
        try {
            // Only save last 50 messages to avoid storage bloat
            const messagesToCache = newMessages.slice(-50);
            localStorage.setItem('voiceai-messages', JSON.stringify(messagesToCache));
            updateCacheStatus();
        } catch {
            console.error('Failed to save messages to cache');
        }
    }, [updateCacheStatus]);

    // Initialize cache and online status
    useEffect(() => {
        // Check initial online status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => {
            setIsOnline(true);
            console.log("🟢 Back online! Full functionality restored.");
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            console.log("🔴 Offline mode activated. Using cached responses.");
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load cached messages from localStorage
        loadCachedMessages();
        updateCacheStatus();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [loadCachedMessages, updateCacheStatus]);

    const getCachedResponse = useCallback((message: string): string | null => {
        try {
            const cached = localStorage.getItem('voiceai-responses');
            if (!cached) return null;

            const cachedResponses: CachedResponse[] = JSON.parse(cached);
            const messageHash = hashMessage(message.trim().toLowerCase());
            
            const found = cachedResponses.find(item => item.messageHash === messageHash);
            if (found) {
                // Check if cached response is not too old (24 hours)
                const isExpired = Date.now() - found.timestamp > 24 * 60 * 60 * 1000;
                if (!isExpired) {
                    return found.response;
                }
            }
        } catch (error) {
            console.error('Failed to get cached response:', error);
        }
        return null;
    }, []);

    const saveCachedResponse = useCallback((message: string, response: string) => {
        try {
            const cached = localStorage.getItem('voiceai-responses');
            let cachedResponses: CachedResponse[] = cached ? JSON.parse(cached) : [];
            
            const messageHash = hashMessage(message.trim().toLowerCase());
            const newCache: CachedResponse = {
                response,
                timestamp: Date.now(),
                messageHash
            };

            // Remove existing cache for same message
            cachedResponses = cachedResponses.filter(item => item.messageHash !== messageHash);
            
            // Add new cache
            cachedResponses.push(newCache);
            
            // Keep only last 100 cached responses
            if (cachedResponses.length > 100) {
                cachedResponses = cachedResponses.slice(-100);
            }
            
            localStorage.setItem('voiceai-responses', JSON.stringify(cachedResponses));
            updateCacheStatus();
        } catch (error) {
            console.error('Failed to save cached response:', error);
        }
    }, [updateCacheStatus]);

    const makeRequest = useCallback(
        async (message: string, isRetry = false): Promise<string | null> => {
            if (isRetry) {
                setIsRetrying(true);
            } else {
                setIsLoading(true);
            }
            setError(null);
            setErrorType(null);

            // Check for cached response first
            const cachedResponse = getCachedResponse(message);
            if (cachedResponse && isOnline) {
                console.log("📦 Using cached response");
                if (!isRetry) {
                    const aiMessage: ChatMessage = {
                        role: "assistant",
                        content: cachedResponse,
                        timestamp: Date.now(),
                        cached: true
                    };
                    setMessages((prev) => {
                        const newMessages = [...prev, aiMessage];
                        saveMessagesToCache(newMessages);
                        return newMessages;
                    });
                }
                setIsLoading(false);
                setIsRetrying(false);
                return cachedResponse;
            }

            // If offline, use offline responses
            if (!isOnline) {
                const offlineResponse = findOfflineResponse(message);
                if (!isRetry) {
                    const aiMessage: ChatMessage = {
                        role: "assistant",
                        content: offlineResponse,
                        timestamp: Date.now(),
                        offline: true
                    };
                    setMessages((prev) => {
                        const newMessages = [...prev, aiMessage];
                        saveMessagesToCache(newMessages);
                        return newMessages;
                    });
                }
                setIsLoading(false);
                setIsRetrying(false);
                return offlineResponse;
            }

            try {
                const conversationHistory = messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                }));

                let response: Response;
                try {
                    response = await fetch("/api/chat", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            message: message.trim(),
                            conversationHistory,
                        }),
                    });
                } catch (fetchError) {
                    // Network failure - treat as offline
                    console.log("Network fetch failed:", fetchError);
                    throw new Error(
                        JSON.stringify({
                            message: "Network connection failed",
                            errorType: "offline",
                            retryable: true,
                            retryAfter: 2,
                        })
                    );
                }

                if (!response.ok) {
                    let errorData: ErrorResponse;
                    try {
                        errorData = await response.json();
                    } catch {
                        // Handle non-JSON error responses
                        const errorText = await response.text();
                        errorData = {
                            error: errorText || "Failed to get AI response",
                            errorType: response.status === 503 ? "offline" : "unknown_error",
                            retryable: response.status === 503
                        };
                    }
                    
                    throw new Error(
                        JSON.stringify({
                            message: errorData.error || "Failed to get AI response",
                            errorType: errorData.errorType || "unknown_error",
                            retryable: errorData.retryable || false,
                            retryAfter: errorData.retryAfter || 0,
                        })
                    );
                }

                let data: ChatResponse;
                try {
                    data = await response.json();
                } catch {
                    // Handle non-JSON success responses
                    const responseText = await response.text();
                    data = {
                        response: responseText || "Received response but couldn't parse it",
                    };
                }

                // Cache the response for future use
                saveCachedResponse(message, data.response);

                if (!isRetry) {
                    const aiMessage: ChatMessage = {
                        role: "assistant",
                        content: data.response,
                        timestamp: Date.now(),
                    };
                    setMessages((prev) => {
                        const newMessages = [...prev, aiMessage];
                        saveMessagesToCache(newMessages);
                        return newMessages;
                    });
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
        [messages, getCachedResponse, saveCachedResponse, saveMessagesToCache, isOnline]
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

            setMessages((prev) => {
                const newMessages = [...prev, userMessage];
                saveMessagesToCache(newMessages);
                return newMessages;
            });

            return makeRequest(message.trim());
        },
        [makeRequest, saveMessagesToCache]
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
        localStorage.removeItem('voiceai-messages');
        updateCacheStatus();
    }, [updateCacheStatus]);

    const clearCache = useCallback(() => {
        localStorage.removeItem('voiceai-responses');
        localStorage.removeItem('voiceai-messages');
        setMessages([]);
        updateCacheStatus();
    }, [updateCacheStatus]);

    return {
        messages,
        isLoading,
        error,
        errorType,
        isRetrying,
        isOnline,
        cacheStatus,
        sendMessage,
        clearChat,
        clearCache,
        retryLastMessage,
    };
}
