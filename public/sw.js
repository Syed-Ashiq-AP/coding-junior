const CACHE_NAME = "voice-chat-v1";
const STATIC_CACHE_URLS = [
    "/",
    "/manifest.json",
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/whisper-worker.js",
];

const ASSETS_TO_CACHE = ["/models/whisper.wasm", "/models/tts-model.bin"];

self.addEventListener("install", (event) => {
    console.log("[SW] Install event");

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log("[SW] Caching static files");
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log("[SW] Static files cached successfully");
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error("[SW] Failed to cache static files:", error);
            })
    );
});

self.addEventListener("activate", (event) => {
    console.log("[SW] Activate event");

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log("[SW] Deleting old cache:", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log("[SW] Service worker activated");
                return self.clients.claim();
            })
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle OpenAI API requests with enhanced offline support
    if (
        url.hostname.includes("openai.com") ||
        url.hostname.includes("api.openai.com")
    ) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    console.log("[SW] ✅ OpenAI API request successful");
                    return response;
                })
                .catch(() => {
                    console.log(
                        "[SW] 🔴 OpenAI API request failed - serving offline response"
                    );
                    return new Response(
                        JSON.stringify({
                            error: "Offline - OpenAI API unavailable",
                            errorType: "offline",
                            choices: [
                                {
                                    message: {
                                        content:
                                            "I'm currently offline and cannot access my full knowledge base. I can still provide cached responses or basic offline assistance. Please check your internet connection for full functionality.",
                                    },
                                },
                            ],
                        }),
                        {
                            status: 503,
                            statusText: "Service Unavailable",
                            headers: { "Content-Type": "application/json" },
                        }
                    );
                })
        );
        return;
    }

    // Enhanced caching strategy for app assets
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                console.log("[SW] 📦 Serving from cache:", request.url);
                return response;
            }

            return fetch(request)
                .then((response) => {
                    // Only cache successful responses
                    if (
                        !response ||
                        response.status !== 200 ||
                        response.type !== "basic"
                    ) {
                        return response;
                    }

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then((cache) => {
                        console.log(
                            "[SW] 💾 Caching new resource:",
                            request.url
                        );
                        cache.put(request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    console.log(
                        "[SW] 🔌 Network failed, checking cache for:",
                        request.url
                    );
                    // For document requests, try to serve the main page from cache
                    if (request.destination === "document") {
                        return caches.match("/");
                    }
                    // For other requests, return a generic offline response
                    return new Response("Offline", { status: 503 });
                });
        })
    );
});

self.addEventListener("message", (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case "CACHE_MODELS":
            event.waitUntil(
                caches
                    .open(CACHE_NAME)
                    .then((cache) => {
                        console.log("[SW] Caching models:", payload.urls);
                        return cache.addAll(payload.urls);
                    })
                    .then(() => {
                        event.ports[0].postMessage({ success: true });
                    })
                    .catch((error) => {
                        console.error("[SW] Failed to cache models:", error);
                        event.ports[0].postMessage({
                            success: false,
                            error: error.message,
                        });
                    })
            );
            break;

        case "GET_CACHE_STATUS":
            event.waitUntil(
                caches
                    .open(CACHE_NAME)
                    .then((cache) => cache.keys())
                    .then((requests) => {
                        const cachedUrls = requests.map((req) => req.url);
                        event.ports[0].postMessage({
                            cached: cachedUrls,
                            cacheSize: cachedUrls.length,
                        });
                    })
            );
            break;

        default:
            console.log("[SW] Unknown message type:", type);
    }
});
