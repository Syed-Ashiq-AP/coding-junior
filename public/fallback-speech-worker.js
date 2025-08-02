
let recognition = null;

function initializeSpeechRecognition() {
    try {
        const SpeechRecognition =
            self.SpeechRecognition || self.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            self.postMessage({
                type: "error",
                data: "Speech Recognition API not supported in this browser",
            });
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const result = event.results[0];
            const text = result[0].transcript;
            const confidence = result[0].confidence;

            self.postMessage({
                type: "transcription_result",
                data: {
                    text: text.trim(),
                    processingTime: 0, 
                    confidence: confidence || 0.9,
                    source: "web-speech-api",
                },
            });
        };

        recognition.onerror = (event) => {
            self.postMessage({
                type: "error",
                data: `Speech recognition error: ${event.error}`,
            });
        };

        recognition.onend = () => {
            self.postMessage({
                type: "status",
                data: "Speech recognition ended",
            });
        };

        self.postMessage({ type: "ready", data: true });
        self.postMessage({
            type: "status",
            data: "Web Speech API ready (fallback mode)",
        });
    } catch (error) {
        self.postMessage({
            type: "error",
            data: `Failed to initialize speech recognition: ${error.message}`,
        });
    }
}

function transcribeWithWebSpeech(audioBlob) {
    try {
        self.postMessage({
            type: "error",
            data: "Web Speech API requires live audio stream, not audio blob. Please use browser microphone directly.",
        });
    } catch (error) {
        self.postMessage({
            type: "error",
            data: `Web Speech transcription failed: ${error.message}`,
        });
    }
}

self.onmessage = async function (event) {
    const { type, data } = event.data;

    try {
        switch (type) {
            case "initialize":
                initializeSpeechRecognition();
                break;

            case "transcribe":
                transcribeWithWebSpeech(data.audioData);
                break;

            case "ping":
                self.postMessage({
                    type: "pong",
                    data: "Fallback worker is alive",
                });
                break;

            default:
                console.warn("Unknown message type:", type);
        }
    } catch (error) {
        self.postMessage({
            type: "error",
            data: `Fallback worker error: ${error.message}`,
        });
    }
};

self.postMessage({
    type: "worker_ready",
    data: "Fallback speech worker loaded",
});
