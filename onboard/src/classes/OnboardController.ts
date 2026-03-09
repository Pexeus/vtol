import { TypedEmitter } from "tiny-typed-emitter";
import { OnboardControllerConfiguration } from "../types.js";
import { FlightController } from "./FlightController.js";
import { E3372 } from "./E3372.js";
import { Client } from "udplus"

interface Events {

}

export class OnboardController extends TypedEmitter<Events> {
    config: OnboardControllerConfiguration;

    private flightController: FlightController;
    private lteRouter: E3372;
    private socket: Client;

    constructor(config: OnboardControllerConfiguration) {
        super()
        this.config = config

        this.flightController = new FlightController(config.flighControllerLink.device, config.flighControllerLink.baudRate)
        this.lteRouter = new E3372(config.lteRouter.updateInterval)
        this.socket = new Client('vehicle')
    }

    async init() {
        try {
            await this.socket.connect(this.config.link.host, this.config.link.ports.data)
        }
        catch (err) {
            throw new Error(`Failed to initiate Controller: ${err}`)
        }
    }

    private async setupTelemetry() {
        this.flightController.on("flightstate", state => this.socket.emit("flightstate", state))
        this.flightController.on("position", pos => this.socket.emit("position", pos))
        this.lteRouter.on("status", status => this.socket.emit("lte_status", status))
    }
}