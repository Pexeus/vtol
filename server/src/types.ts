import { Server } from "socket.io";

export interface RelayConfig {
    websocket: Server
    ports: {
        data: number,
        video: number
    }
}