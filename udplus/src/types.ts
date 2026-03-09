export type MessageType = 'keepalive' | 'connect' | 'confirm' | 'user' | 'user-ensure'

export interface MessageBase {
    type: MessageType
}

export interface ConnectMessage extends MessageBase {
    type: 'connect',
}

export interface ConfirmMessage extends MessageBase {
    type: 'confirm'
    sequence: number
}

export interface KeepaliveMessage extends MessageBase {
    type: 'keepalive',
}

export interface UserMessage extends MessageBase {
    type: 'user',
    channel: string
    data: any
}

export interface UserEnsureMessage extends MessageBase {
    type: 'user-ensure'
    channel: string
    data: any
}

export type Message = ConnectMessage | ConfirmMessage | KeepaliveMessage | UserMessage | UserEnsureMessage

export interface Packet {
    from: string,
    to: string,
    sequence: number
    message: Message
}