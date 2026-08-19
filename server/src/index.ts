import { Relay } from "./classes/Relay.js";
import express from "express"
import http from "http"
import { Server as SocketioServer } from "socket.io";


const app = express()
app.use(express.static('../client/dist'))

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

server.listen(4202, () => {
    console.log("[HTTP] Online on port " + 4202);
    relay.init()
})