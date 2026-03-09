import dgram from "dgram"
import { encode as packEncode, decode as packDecode } from "@msgpack/msgpack"
import { decode, requiresConfirm } from "./util.js";
import { ConfirmMessage, ConnectMessage, Message, Packet } from "./types.js";
import { ConnectedClient } from "./ConnectedClient.js";
import { TypedEmitter } from 'tiny-typed-emitter';

interface ServerEvents {
    message: (packet: Packet) => void
    client: (client: ConnectedClient) => void
}

export class Server extends TypedEmitter<ServerEvents> {
    socket: dgram.Socket;

    private clients: ConnectedClient[] = []
    private seq: number = 0

    constructor() {
        super()
        this.socket = dgram.createSocket('udp4')

        this.socket.on("message", (data, rinfo) => {
            this.handleIncoming(data, rinfo)
        })
    }

    private handleIncoming(data: Uint8Array<ArrayBuffer>, rinfo: dgram.RemoteInfo) {
        try {
            const packet = decode(data)
            const message = packet.message
            let client = this.getClient(packet.from)

            if (!client) {
                const newClient = new ConnectedClient(this, packet.from, rinfo)
                this.clients.push(newClient)
                client = newClient

                this.emit('client', newClient)
            }
            else {
                //in case of ip/port change, update
                client.port = rinfo.port
                client.address = rinfo.address
            }

            if (requiresConfirm(message.type)) {
                this.confirmArrival(client, packet)
            }

            this.emit("message", packet)
        }
        catch (err) {
            console.log(`Cannot handle incoming message; ${err}`);
        }
    }

    private getClient(identifier: string) {
        const client = this.clients.find(client => client.identifier == identifier)

        if (!client) {
            return false
        }

        return client
    }

    private confirmArrival(targetClient: ConnectedClient, incomingPacket: Packet) {
        const confirmMessage: ConfirmMessage = {
            sequence: incomingPacket.sequence,
            type: 'confirm'
        }

        const buffer = this.encode(confirmMessage, targetClient.identifier)
        this.socket.send(buffer, targetClient.port, targetClient.address)
    }

    private encode(message: Message, targetClient: string) {
        const packet: Packet = {
            message: message,
            from: "server",
            to: targetClient,
            sequence: this.nextSeq()
        }

        return packEncode(packet)
    }

    private nextSeq() {
        this.seq = (this.seq + 1) >>> 0
        return this.seq
    }

    listen(port: number) {
        return new Promise(resolve => {
            this.socket.bind(port, "0.0.0.0", () => {
                resolve(this.socket.address())
            })
        })
    }
}