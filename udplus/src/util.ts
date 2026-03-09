import { Message, MessageBase, MessageType, Packet } from "./types.js";
import { encode as packEncode, decode as packDecode } from "@msgpack/msgpack"


export function decode(buffer: Uint8Array<ArrayBuffer>): Packet {
    try {
        const packet = packDecode(buffer) as Packet

        return packet
    }
    catch(err) {
        throw new Error(`Cannot decode Packet: ${err}`)
    }
}

export function requiresConfirm(messageType: MessageType) {
    if (messageType == 'connect') {
        return true
    }
    if (messageType == 'keepalive') {
        return true
    }
    if (messageType == 'user-ensure') {
        return true
    }

    return false
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));