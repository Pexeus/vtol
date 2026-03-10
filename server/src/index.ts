import { Relay } from "./classes/Relay.js";

const relay = new Relay({
    ports: {
        data: 4200,
        video: 4201
    }
})

relay.init()