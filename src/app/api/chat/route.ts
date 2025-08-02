import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory = [] } = await request.json();

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key not configured" },
                { status: 500 }
            );
        }

        const messages = [
            {
                role: "system",
                content:
                    "You are a helpful AI assistant in a voice chat application. Keep your responses concise and conversational since they will be read aloud. Aim for 1-3 sentences unless specifically asked for more detail. Be friendly, helpful, and engaging.",
            },
            ...conversationHistory,
            {
                role: "user",
                content: message,
            },
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            max_tokens: 150,
            temperature: 0.7,
            stream: false,
        });

        const aiResponse =
            completion.choices[0]?.message?.content ||
            "Sorry, I could not generate a response.";

        return NextResponse.json({
            response: aiResponse,
            usage: completion.usage,
            model: completion.model,
            provider: "openai",
        });
    } catch (error: unknown) {
        console.error("Chat API error:", error);

        if (error && typeof error === "object" && "status" in error) {
            if (error.status === 429) {
                // Check if it's a rate limit or quota issue
                const errorMessage =
                    error &&
                    "message" in error &&
                    typeof error.message === "string"
                        ? error.message.toLowerCase()
                        : "";

                if (
                    errorMessage.includes("quota") ||
                    errorMessage.includes("billing")
                ) {
                    return NextResponse.json(
                        {
                            error: "API quota exceeded. Please check your OpenAI billing and usage limits.",
                            errorType: "quota_exceeded",
                            retryable: false,
                        },
                        { status: 429 }
                    );
                } else {
                    return NextResponse.json(
                        {
                            error: "Too many requests. Please wait a moment and try again.",
                            errorType: "rate_limit",
                            retryable: true,
                            retryAfter: 20, // seconds
                        },
                        { status: 429 }
                    );
                }
            }

            if (error.status === 401) {
                return NextResponse.json(
                    {
                        error: "Invalid API key. Please check your configuration.",
                        errorType: "auth_error",
                        retryable: false,
                    },
                    { status: 401 }
                );
            }

            if (error.status === 503) {
                return NextResponse.json(
                    {
                        error: "OpenAI service is temporarily unavailable. Please try again in a moment.",
                        errorType: "service_unavailable",
                        retryable: true,
                        retryAfter: 30,
                    },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            {
                error: "Failed to get AI response. Please try again.",
                errorType: "unknown_error",
                retryable: true,
            },
            { status: 500 }
        );
    }
}
