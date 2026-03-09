import dgram from "dgram"
import { encode as packEncode, decode as packDecode } from "@msgpack/msgpack"
import { ConfirmMessage, Message, MessageBase, Packet, UserEnsureMessage, UserMessage } from "./types.js";
import { Server } from "./Server.js";
import { KEEPALIVE_TIMEOUT } from "./constants.js";
import { TypedEmitter } from "tiny-typed-emitter";

interface ConnectedClientEvents {
    disconnect: () => void;
    reconnect: () => void;
    // dynamic events
    [event: string]: (message: any) => void;
}

export class ConnectedClient extends TypedEmitter<ConnectedClientEvents> {
    private server: Server;
    private lastPing: number;
    private seq: number = 0;
    private pending: Number[] = []

    address: string;
    port: number;
    identifier: string
    connected: Boolean = true

    constructor(server: Server, identifier: string, rinfo: dgram.RemoteInfo) {
        super()
        this.address = rinfo.address
        this.port = rinfo.port
        this.server = server
        this.lastPing = Date.now()
        this.identifier = identifier

        this.server.on("message", (packet) => {
            if (packet.from != identifier) {
                return
            }

            this.handleIncoming(packet)
        })

        this.checkConnectionStatus()
    }

    async send(channel: string, mesage: any, ensureDelivery?: boolean) {
        if (ensureDelivery == undefined) {
            ensureDelivery = false
        }

        if (!ensureDelivery) {
            const message: UserMessage = {
                channel: channel,
                data: mesage,
                type: 'user'
            }

            this.dispatch(this.encode(message))
        }

        if (ensureDelivery) {
            const message: UserEnsureMessage = {
                channel: channel,
                data: mesage,
                type: 'user-ensure'
            }

            await this.sendAndConfirm(message)
        }
    }

    private dispatch(packet: Uint8Array<ArrayBuffer>) {
        this.server.socket.send(packet, this.port, this.address)
    }

    private async sendAndConfirm(message: Message) {
        return new Promise(resolve => {
            const seq = this.nextSeq()
            const packet = this.encode(message, seq)
            this.dispatch(packet)

            this.pending.push(seq)

            const interval = setInterval(() => {
                if (this.pending.includes(seq)) {
                    this.dispatch(packet)
                }
                else {
                    clearInterval(interval)
                    resolve(true)
                }
            }, 250);
        })
    }

    private encode(message: Message, seq?: number) {
        if (!seq) {
            seq = this.nextSeq()
        }

        const packet: Packet = {
            message: message,
            from: 'server',
            to: this.identifier,
            sequence: seq
        }

        return packEncode(packet)
    }

    private checkConnectionStatus() {
        const interval = setInterval(() => {
            const delta = Date.now() - this.lastPing

            if (delta > KEEPALIVE_TIMEOUT) {
                clearInterval(interval)
                this.connected = false
                this.pending = []
                this.emit("disconnect")
            }

        }, KEEPALIVE_TIMEOUT / 2);
    }

    private handleIncoming(packet: Packet) {
        if (!this.connected) {
            this.connected = true
            this.lastPing = Date.now()
            this.checkConnectionStatus()
            this.emit('reconnect')
        }

        if (packet.message.type == 'keepalive' && this.connected) {
            this.lastPing = Date.now()
            return
        }

        if (packet.message.type == 'user' || packet.message.type == 'user-ensure') {
            this.emit(packet.message.channel, packet.message.data)
        }

        if (packet.message.type == 'confirm') {
            const message = packet.message as ConfirmMessage
            this.pending = this.pending.filter(pending => pending != message.sequence)
        }
    }

    private nextSeq() {
        this.seq = (this.seq + 1) >>> 0
        return this.seq
    }
}