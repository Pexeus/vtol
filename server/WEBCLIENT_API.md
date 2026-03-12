# VTOL Webclient API Documentation

This documentation provides the necessary information to build a frontend web client for the VTOL drone project. The backend relies on Socket.IO to stream live telemetry and video data from the drone to connected clients.

## Connection Details

* **Protocol**: WebSocket (via Socket.IO v4)
* **Port**: `4202`
* **URL**: `http://verion.ch:4202`
* **CORS**: `*` (All origins allowed)

**Note:** You must use a Socket.IO client library (e.g., `socket.io-client` v4) to connect. Standard native WebSockets (`new WebSocket()`) will not work directly.

---

## Socket.IO Events

The server emits the following events to all connected clients. There are no events that the client currently needs to emit back to the server.

### 1. `flightstate`
Streams the current flight dynamics (roll, pitch, yaw, speeds, etc.) of the drone. update frequencies are around 30HZ for flightstate and about 4hz for position.
angles are in degrees.

**Payload JSON structure:**
```ts
{
    roll: number;
    pitch: number;
    yaw: number;
    airspeed: number;
    groundspeed: number;
    throttle: number;
    climb: number;
}
```

### 2. `position`
Streams the geographic location, heading, and altitude data.

**Payload JSON structure:**
```ts
{
    lat: number;
    lon: number;
    heading: number;
    altitude: {
        absolute: number; // Above Mean Sea Level (AMSL)
        relative: number; // Above Ground Level (AGL)
    }
}
```

### 3. `video`
Streams the live camera feed from the drone.

* **Payload Type:** `ArrayBuffer` (in browser) / `Buffer` (in Node.js)
* **Format:** Raw H.264 NAL Units (encoded natively on the drone via Picamera2).

since this is a heavily customized pipeline, heres a minimal example of how to get the video to display and some metadata: 
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <canvas id="video"></canvas>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io()
        const canvas = document.querySelector("#video")
        const ctx = canvas.getContext("2d");

        let frames = 0
        let last = performance.now()

        const decoder = new VideoDecoder({
            output: frame => {
                // set canvas resolution to video resolution (once or when it changes)
                if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
                    canvas.width = frame.displayWidth
                    canvas.height = frame.displayHeight
                    console.log(`Resolution: ${canvas.width}x${canvas.height}`)
                }

                ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
                frame.close()

                frames++
                const now = performance.now()
                if (now - last >= 1000) {
                    console.log(`FPS: ${frames}`)
                    frames = 0
                    last = now
                }
            },
            error: e => console.error(e)
        })

        decoder.configure({
            codec: 'avc1.42E01E'
        })

        socket.on("video", (data) => {
            const u8 = new Uint8Array(data)

            decoder.decode(new EncodedVideoChunk({
                type: "key",
                timestamp: performance.now() * 1000,
                data: u8
            }))
        })
    </script>

    <style>
        * {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }

        html {
            background-color: black;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        canvas {
            height: 100vh;
        }
    </style>
</body>

</html>