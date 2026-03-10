import socket
import time
from picamera2 import Picamera2
from picamera2.encoders import H264Encoder
from picamera2.outputs import Output
from collections import deque
from typing import Deque
import struct

CHUNK_SIZE = 1400
HEADER_FMT = "!Q I H H"   # timestamp, frame_id, chunk_id, chunk_cnt
HEADER_SIZE = struct.calcsize(HEADER_FMT)
PAYLOAD_SIZE = CHUNK_SIZE - HEADER_SIZE

BITRATE_MAX = 4_000_000
BITRATE_MIN = 1_000_000
BITRATE = 2_000_000

last_latency_check = 123

class UDPSender(Output):
    def __init__(self, host, port):
        super().__init__()
        self.addr = (host, port)
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.mtu = 1400 
        self.sock.setblocking(True)
        self.frame_id = 0

        self.sock.setsockopt(
            socket.SOL_SOCKET,
            socket.SO_BINDTODEVICE,
            b"usb0"
        )

    def outputframe(self, frame, keyframe=True, timestamp=None, packet=None, audio=False):
        timestamp = time.time_ns() 
        self.frame_id = (self.frame_id + 1) & 0xFFFFFFFF
        print(timestamp)
        chunk_cnt = (len(frame) + PAYLOAD_SIZE - 1) // PAYLOAD_SIZE

        for chunk_id in range(chunk_cnt):
            start = chunk_id * PAYLOAD_SIZE
            payload = frame[start:start + PAYLOAD_SIZE]

            ts = timestamp if chunk_id == 0 else 0

            header = struct.pack(
                HEADER_FMT,
                ts,
                self.frame_id,
                chunk_id,
                chunk_cnt
            )

            self.sock.sendto(header + payload, self.addr)

    def flush(self):
        pass

class MovingAverage:
    def __init__(self, maxlen: int) -> None:
        if maxlen <= 0:
            raise ValueError("maxlen must be > 0")
        self._window: Deque[float] = deque(maxlen=maxlen)
        self._sum: float = 0.0

    def push(self, value: float) -> None:
        if len(self._window) == self._window.maxlen:
            self._sum -= self._window[0]
        self._window.append(value)
        self._sum += value

    def average(self) -> float:
        if not self._window:
            return 0.0
        return self._sum / len(self._window)

latencyWindow = MovingAverage(30)

cam = Picamera2()
print(cam.sensor_modes)
video_config = cam.create_video_configuration(
    main={"size": (640, 480), "format": "YUV420"},
    controls={"FrameRate": 60.0}  # framerate goes here
)

cam.configure(video_config)

encoder = H264Encoder(
    bitrate=2_000_000,
    profile="baseline",
    iperiod=30,
    repeat=True
)

udp_output = UDPSender("verion.ch", 4201)

# Start recording
cam.start_recording(encoder, udp_output)
print("Streaming started")

def monitorNetwork():
    global last_latency_check
    global encoder
    global cam
    global udp_output
    global BITRATE, BITRATE_MIN, BITRATE_MAX

    data, addr = udp_output.sock.recvfrom(1024)
    timestamp = int(data.decode())
    now = getTimeMs()
    latencyWindow.push(now - timestamp)

    if now - last_latency_check > 100:
        last_latency_check = now
        averageLatency = latencyWindow.average()
        print(averageLatency)

        if averageLatency > 45:
            last_latency_check = now + 1000
            BITRATE = int(max(BITRATE * 0.8, BITRATE_MIN))
            if BITRATE == BITRATE_MIN:
                return

            print(f"Decreased to {BITRATE}")

            restartEncoder()
        
        if averageLatency < 40:
            last_latency_check = now + 2000
            BITRATE = int(min(BITRATE * 1.1, BITRATE_MAX))
            if BITRATE == BITRATE_MAX:
                return

            print(f"Increased to {BITRATE}")

            restartEncoder()

def restartEncoder():
    global cam, encoder, udp_output, BITRATE

    cam.stop_recording()
    encoder = H264Encoder(
        bitrate=BITRATE,
        profile="baseline",
        iperiod=10,
        repeat=True
    )

    cam.start_recording(encoder, udp_output)

def getTimeMs():
    return int(time.time() * 1000)

try:
    while True:
        monitorNetwork()
except KeyboardInterrupt:
    cam.stop_recording()
    print("Streaming stopped")
