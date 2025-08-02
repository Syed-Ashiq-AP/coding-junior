
let whisperPipeline = null;
let isInitializing = false;

self.importScripts(
    "https:
);

self.env.allowLocalModels = false;
self.env.allowRemoteModels = true;
self.env.backends.onnx.wasm.wasmPaths =
    "https:

async function initializeWhisper() {
    if (isInitializing || whisperPipeline) {
        return;
    }

    isInitializing = true;

    try {
        self.postMessage({ type: "status", data: "Loading Whisper model..." });

        whisperPipeline = await self.pipeline(
            "automatic-speech-recognition",
            "Xenova/whisper-tiny.en",
            {
                quantized: true,
                progress_callback: (progress) => {
                    self.postMessage({
                        type: "loading_progress",
                        data: {
                            status: progress.status || "loading",
                            name: progress.name || "whisper-tiny.en",
                            progress: progress.progress || 0,
                        },
                    });
                },
            }
        );

        self.postMessage({
            type: "status",
            data: "Whisper model loaded successfully!",
        });
        self.postMessage({ type: "ready", data: true });
        isInitializing = false;
    } catch (error) {
        console.error("Failed to initialize Whisper:", error);
        self.postMessage({
            type: "error",
            data: `Failed to load Whisper model: ${error.message}`,
        });
        isInitializing = false;
    }
}

async function transcribeAudio(audioData) {
    if (!whisperPipeline) {
        self.postMessage({
            type: "error",
            data: "Whisper model not initialized",
        });
        return;
    }

    try {
        self.postMessage({ type: "status", data: "Transcribing audio..." });

        const startTime = Date.now();

        const result = await whisperPipeline(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: "english",
            task: "transcribe",
            return_timestamps: false,
        });

        const processingTime = Date.now() - startTime;

        const text =
            result?.text ||
            (typeof result === "string"
                ? result
                : "No transcription available");

        self.postMessage({
            type: "transcription_result",
            data: {
                text: text.trim(),
                processingTime,
                confidence: result.confidence || 0.9,
            },
        });
    } catch (error) {
        console.error("Transcription error:", error);
        self.postMessage({
            type: "error",
            data: `Transcription failed: ${error.message}`,
        });
    }
}

self.onmessage = async function (event) {
    const { type, data } = event.data;

    try {
        switch (type) {
            case "initialize":
                await initializeWhisper();
                break;

            case "transcribe":
                await transcribeAudio(data.audioData);
                break;

            case "ping":
                self.postMessage({ type: "pong", data: "Worker is alive" });
                break;

            default:
                console.warn("Unknown message type:", type);
        }
    } catch (error) {
        console.error("Worker message handler error:", error);
        self.postMessage({
            type: "error",
            data: `Worker error: ${error.message}`,
        });
    }
};

self.postMessage({
    type: "worker_ready",
    data: "Whisper worker script loaded",
});
