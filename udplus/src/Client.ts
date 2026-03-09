import EventEmitter from "events";
import dgram from "dgram"
import { ConfirmMessage, ConnectMessage, KeepaliveMessage, Message, MessageBase, Packet, UserEnsureMessage, UserMessage } from "./types.js";
import { decode, requiresConfirm, sleep } from "./util.js";
import { KEEPALIVE_TIMEOUT } from "./constants.js";
import { encode as packEncode, decode as packDecode } from "@msgpack/msgpack"
import { TypedEmitter } from "tiny-typed-emitter";

interface ClientEvents {
    disconnect: () => void
    [event: string]: (message: any) => void;
}

export class Client extends TypedEmitter<ClientEvents> {
    private socket: dgram.Socket;
    private pending: Number[] = []
    private seq: number = 0
    private host: string | undefined;
    private port: number | undefined;
    private lastServerResponse: number = 0

    identifier: string
    connected: Boolean = false

    constructor(identifier: string) {
        super()
        this.socket = dgram.createSocket('udp4')
        this.identifier = identifier

        this.socket.on("message", (data, rinfo) => {
            this.handleIncoming(decode(data))
        })
    }

    async connect(host: string, port: number) {
        this.host = host
        this.port = port

        const connectMessage: ConnectMessage = {
            type: 'connect'
        }

        await this.sendAndConfirm(connectMessage)
        this.connected = true
        this.keepAlive()
    }

    disconnect() {
        this.connected = false
        this.pending = []
        this.emit("disconnect")
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

    private handleIncoming(packet: Packet) {
        if (packet.message.type == 'confirm') {
            const message = packet.message as ConfirmMessage
            this.pending = this.pending.filter(pending => pending != message.sequence)
        }
        if (packet.message.type == 'user' || packet.message.type == 'user-ensure') {
            this.emit(packet.message.channel, packet.message.data)
        }

        if (requiresConfirm(packet.message.type)) {
            this.confirmArrival(packet)
        }
    }

    private confirmArrival(incomingPacket: Packet) {
        const confirmMessage: ConfirmMessage = {
            sequence: incomingPacket.sequence,
            type: 'confirm'
        }

        const buffer = this.encode(confirmMessage)
        this.socket.send(buffer, this.port, this.host)
    }


    private encode(message: Message, seq?: number) {
        if (!seq) {
            seq = this.nextSeq()
        }

        const packet: Packet = {
            message: message,
            from: this.identifier,
            to: 'server',
            sequence: seq
        }

        return packEncode(packet)
    }

    private dispatch(packet: Uint8Array<ArrayBuffer>) {
        this.socket.send(packet, this.port, this.host)
    }

    private async sendAndConfirm(message: Message) {
        return new Promise(resolve => {
            const seq = this.nextSeq()
            const packet = this.encode(message, seq)
            this.dispatch(packet)

            const interval = setInterval(() => {
                if (this.pending.includes(seq)) {
                    this.dispatch(packet)
                }
                else {
                    clearInterval(interval)
                    resolve(true)
                }
            }, 250);

            this.pending.push(seq)
        })
    }

    private keepAlive() {
        const keepaliveMessage: KeepaliveMessage = {
            type: 'keepalive'
        }

        const interval = setInterval(async () => {
            if (this.lastServerResponse != 0 && Date.now() - this.lastServerResponse > KEEPALIVE_TIMEOUT) {
                this.disconnect()
            }
            if (!this.connected) {
                clearInterval(interval)
                return
            }

            try {
                await this.sendAndConfirm(keepaliveMessage)
                this.lastServerResponse = Date.now()
            }
            catch (err) {
                console.log(`Failed to send keepalive message:`, err);
            }
        }, KEEPALIVE_TIMEOUT / 4);
    }

    private nextSeq() {
        this.seq = (this.seq + 1) >>> 0
        return this.seq
    }
}