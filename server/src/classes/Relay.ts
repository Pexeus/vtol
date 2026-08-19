import { Client, Server } from "udplus"
import dgram from "dgram"
import { VideoParser } from "./VideoParser.js";
import { RelayConfig } from "../types.js";
import { Socket, Server as SocketioServer } from "socket.io";
import { ConnectedClient } from "udplus/build/ConnectedClient.js";
import { ControlInput, FlightState, LTEConnectionStatus, Position, StatusMessage, SystemState } from "vtol-onboard"

export class Relay {
    config: RelayConfig;
    sockets: { data: Server; video: dgram.Socket; };
    io: SocketioServer;

    cgs: Socket | undefined
    vehicle: ConnectedClient | undefined

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
        await socket.listen(this.config.ports.data)

        //Vehicle => CGS
        socket.on("client", client => {
            if (client.identifier == 'plane') {
                console.log(`Vehicle connected!`);

                this.vehicle = client

                client.on("flightstate", (flightstate: FlightState) => {
                    this.io.emit('flightstate', flightstate)
                })
                client.on("position", (position: Position) => {
                    this.io.emit('position', position)
                })
                client.on("systemstate", (sysState: SystemState) => {
                    this.io.emit("systemstate", sysState)
                })
                client.on("message", (statusMessage: StatusMessage) => {
                    this.io.emit('message', statusMessage)
                })
            }
        })

        //CGS => Vehicle
        this.io.on("connection", client => {
            console.log("CGS connected!", client.id);

            client.on("control", (controls: ControlInput) => {
                if (this.vehicle && this.vehicle.connected) {
                    this.vehicle.send('control', controls)
                }
            })

            client.on('arm', () => {
                console.log('arm');

                if (this.vehicle && this.vehicle.connected) {
                    this.vehicle.send('arm', '')
                }
            })

            client.on('disarm', () => {
                if (this.vehicle && this.vehicle.connected) {
                    this.vehicle.send('disarm', '')
                }
            })

            client.on('setmode', mode => {
                if (this.vehicle && this.vehicle.connected) {
                    this.vehicle.send('setmode', mode)
                }
            })

            client.on('heartbeat', epoch => {
                if (this.vehicle && this.vehicle.connected) {
                    this.vehicle.send('heartbeat', epoch)
                }
            })
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