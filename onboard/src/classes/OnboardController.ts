import { TypedEmitter } from "tiny-typed-emitter";
import { OnboardControllerConfiguration } from "../types.js";
import { FlightController } from "./FlightController.js";
import { E3372 } from "./E3372.js";
import { Client } from "udplus"
import { ChildProcess } from "./ChildProcess.js";
import path from "path"

export class OnboardController {
    config: OnboardControllerConfiguration;

    private flightController: FlightController;
    private lteRouter: E3372;
    private socket: Client;
    private videoStream: ChildProcess

    constructor(config: OnboardControllerConfiguration) {
        this.config = config

        this.flightController = new FlightController(config.flighControllerLink.device, config.flighControllerLink.baudRate)
        this.lteRouter = new E3372(config.lteRouter.updateInterval)
        this.socket = new Client('vehicle')
        this.videoStream = new ChildProcess(
            "python3",
            ["/home/pi/vtol/onboard/streamer/streamer.py"],
            { log: false })
    }

    async init() {
        try {
            console.log('setting up telemetry channels');
            this.setupTelemetry()
            console.log(`starting video stream`);
            this.videoStream.run()
            console.log('connecting to CGS server');
            await this.socket.connect(this.config.link.host, this.config.link.ports.data)
        }
        catch (err) {
            throw new Error(`Failed to initiate Controller: ${err}`)
        }
    }

    private setupTelemetry() {
        this.flightController.on("flightstate", state => {
            console.log(state);
            this.socket.emit("flightstate", state)
        })
        this.flightController.on("position", pos => this.socket.emit("position", pos))
        this.lteRouter.on("status", status => this.socket.emit("status", status))
    }
}