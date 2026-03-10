import { TypedEmitter } from "tiny-typed-emitter";

interface VideoParserEvents {
    data: (frame: Buffer, timestamp: number | null) => void;
}

interface Frame {
    timestamp: number | null;
    chunks: Map<number, Buffer>;
    expected: number;
}

export class VideoParser extends TypedEmitter<VideoParserEvents> {
    private frames: Map<number, Frame>;
    private chunksExpected: number;
    private chunksReceived: number;

    constructor() {
        super();
        this.frames = new Map();
        this.chunksExpected = 1;
        this.chunksReceived = 1;

        setInterval(() => {
            this.chunksExpected = 1;
            this.chunksReceived = 1;
        }, 2000);
    }

    write(buf: Buffer): { timestamp: number; frameId: number; chunkId: number } {
        if (buf.length < 16) throw new Error('Invalid frame data')

        this.chunksReceived++;

        const timestamp = Number(buf.readBigUInt64BE(0));
        const frameId = buf.readUInt32BE(8);
        const chunkId = buf.readUInt16BE(12);
        const chunkCnt = buf.readUInt16BE(14);
        const payload = buf.slice(16);

        let frame = this.frames.get(frameId);
        if (!frame) {
            frame = {
                timestamp: timestamp === 0 ? null : timestamp,
                chunks: new Map(),
                expected: chunkCnt,
            };
            this.frames.set(frameId, frame);
            this.chunksExpected += chunkCnt;
        } else if (timestamp !== 0) {
            frame.timestamp = timestamp;
        }

        frame.chunks.set(chunkId, payload);

        if (frame.chunks.size === frame.expected) {
            const buffers: Buffer[] = [];
            for (let i = 0; i < frame.expected; i++) {
                const chunk = frame.chunks.get(i);
                if (!chunk) continue;
                buffers.push(chunk);
            }

            const fullFrame = Buffer.concat(buffers);
            this.emit("data", fullFrame, frame.timestamp);

            for (const key of [...this.frames.keys()]) {
                if (key <= frameId) this.frames.delete(key);
            }
        }

        return { timestamp, frameId, chunkId };
    }

    getLossRate(): number {
        return this.chunksReceived / this.chunksExpected;
    }
}