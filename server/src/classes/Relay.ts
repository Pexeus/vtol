import { Server } from "udplus"
import dgram from "dgram"
import { VideoParser } from "./VideoParser.js";
import { RelayConfig } from "../types.js";

export class Relay {
    config: RelayConfig;
    sockets: { data: Server; video: dgram.Socket; };

    constructor(config: RelayConfig) {
        this.config = config
        this.sockets = {
            data: new Server(),
            video: dgram.createSocket('udp4')
        }
    }

    init() {
        this.relayVideo()
    }

    private relayVideo() {
        this.sockets.video.bind(this.config.ports.video)
        const parser = new VideoParser()

        this.sockets.video.on("message", (buffer, remote) => {
            const metadata = parser.write(buffer)
            if (metadata.timestamp != 0) {
                console.log(metadata.timestamp);

                this.sockets.video.send(Buffer.from(metadata.timestamp.toString()), remote.port, remote.address);
            }
        })

        parser.on("data", nalSegment => {
            console.log(nalSegment);
        })
    }
}