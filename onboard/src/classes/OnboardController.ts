import { TypedEmitter } from "tiny-typed-emitter";
import { OnboardControllerConfiguration, SystemState } from "../types.js";
import { FlightController } from "./FlightController.js";
import { E3372 } from "./E3372.js";
import { Client } from "udplus"
import { ChildProcess } from "./ChildProcess.js";
import path from "path"
import { getCapacity as calculateLipoCapacity } from "../util.js";

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
        this.socket = new Client('plane')
        this.videoStream = new ChildProcess(
            "python3",
            ["/home/pi/vtol/onboard/streamer/streamer.py"],
            { log: false })

        this.socket.on('disconnect', () => {
            console.log('lost connection to ground station');
        })
    }

    async init() {
        try {
            console.log('connecting to CGS server');
            await this.socket.connect(this.config.link.host, this.config.link.ports.data)
            console.log('setting up telemetry channels');
            this.setupTelemetry()
            console.log(`starting video stream`);
            this.videoStream.run()

            console.log('system ready!');
        }
        catch (err) {
            throw new Error(`Failed to initiate Controller: ${err}`)
        }
    }

    private setupTelemetry() {
        this.flightController.on("flightstate", state => {
            this.socket.send("flightstate", state, true)
        })
        this.flightController.on("position", pos => {
            this.socket.send("position", pos)
        })
        
        this.lteRouter.on("status", status => this.socket.send("networkstate", status))

        //system status
        const systemState: SystemState = {
            battery: {
                capacity: {
                    remainingAbsolute: 0,
                    remainingPercentage: 0,
                    total: this.config.hardware.battery.capacity
                },
                voltage: {
                    current: 0,
                    maximum: 4.2 * this.config.hardware.battery.cells
                }
            },
            network: {
                signalMax: 0,
                signalStrength: 0
            }
        }

        this.flightController.on('battery_voltage', voltage => {
            const perecentageRemaining = calculateLipoCapacity(this.config.hardware.battery.cells, voltage)
            const absoluteRemaining = perecentageRemaining / 100 * this.config.hardware.battery.capacity

            systemState.battery.capacity.remainingAbsolute = absoluteRemaining
            systemState.battery.capacity.remainingPercentage = perecentageRemaining
        })

        this.lteRouter.on("status", status => {
            systemState.network.signalMax = status.signalMax
            systemState.network.signalStrength = status.signalStrength
        })

        setInterval(() => {
            this.socket.send('systemstate', systemState)
        }, 1000);
    }
}