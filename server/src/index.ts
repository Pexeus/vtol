import { Relay } from "./classes/Relay.js";
import express from "express"
import http from "http"
import { Server as SocketioServer } from "socket.io";
import { Server as UdplusServer } from "udplus"


const app = express()
const server = http.createServer(app)
const io = new SocketioServer(server, {
    cors: {
        origin: '*',
    }
})
const relay = new Relay({
    websocket: io,
    ports: {
        data: 4200,
        video: 4201
    }
})

io.on("connection", client => {
    console.log("client connected!", client.id);
})

server.listen(4202, () => {
    console.log("[HTTP] Online on port " + 4202);
    relay.init()
})