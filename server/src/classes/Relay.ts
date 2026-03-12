import { Client, Server } from "udplus"
import dgram from "dgram"
import { VideoParser } from "./VideoParser.js";
import { RelayConfig } from "../types.js";
import { Server as SocketioServer } from "socket.io";
import { ConnectedClient } from "udplus/build/ConnectedClient.js";
import {FlightState, LTEConnectionStatus, Position} from "vtol-onboard"

export class Relay {
    config: RelayConfig;
    sockets: { data: Server; video: dgram.Socket; };
    io: SocketioServer;

    constructor(config: RelayConfig) {
        this.config = config
        this.io = config.websocket
        this.sockets = {
            data: new Server(),
            video: dgram.createSocket('udp4')
        }
    }

    async init() {
        await this.relayData()
        this.relayVideo()

        console.log('[Relay] ready for connections');
    }

    private async relayData() {
        const socket = this.sockets.data
        let client: ConnectedClient

        await socket.listen(this.config.ports.data)

        socket.on("client", client => {
            if (client.identifier == 'plane') {
                client.on("flightstate", (flightstate: FlightState) => {                    
                    this.io.emit('flightstate', flightstate)
                })
                client.on("position", (position: Position) => {
                    this.io.emit('position', position)
                })
            }
        })
    }

    private relayVideo() {
        this.sockets.video.bind(this.config.ports.video)
        const parser = new VideoParser()

        this.sockets.video.on("message", (buffer, remote) => {
            const metadata = parser.write(buffer)
            if (metadata.timestamp != 0) {
                this.sockets.video.send(Buffer.from(metadata.timestamp.toString()), remote.port, remote.address);
            }
        })

        parser.on("data", nalSegment => {
            this.io.emit('video', nalSegment)
        })
    }
}