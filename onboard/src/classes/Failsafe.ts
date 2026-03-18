import { TypedEmitter } from "tiny-typed-emitter";
import { Client } from "udplus";

interface Events {
    "connect": () => void
    "disconnect": () => void
    "reconnect": () => void
}


export class Failsafe extends TypedEmitter<Events> {
    private client: Client;

    constructor(client: Client) {
        super()
        this.client = client
    }

    async monitor() {

    }
}