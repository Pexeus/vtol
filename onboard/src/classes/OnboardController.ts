import { TypedEmitter } from "tiny-typed-emitter";
import { ControlInput, FlightMode, OnboardControllerConfiguration, SystemState } from "../types.js";
import { FlightController } from "./FlightController.js";
import { E3372 } from "./E3372.js";
import { Client } from "udplus"
import { ChildProcess } from "./ChildProcess.js";
import { getCapacity as calculateLipoCapacity, mapFlightMode } from "../util.js";

export class OnboardController {
    config: OnboardControllerConfiguration;

    private flightController: FlightController;
    private lteRouter: E3372;
    private socket: Client;
    private videoStream: ChildProcess

    constructor(config: OnboardControllerConfiguration) {
        this.config = config

        this.flightController = new FlightController(config.flighController.device, config.flighController.baudRate)
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

            console.log(`starting video stream`);
            this.videoStream.run()

            console.log('setting up Telemetry and Control channels');
            this.setupTelemetry()
            this.setupInput()

            console.log('system ready!');
        }
        catch (err) {
            throw new Error(`Failed to initiate Onboard Controller: ${err}`)
        }
    }

    private setupInput() {
        this.socket.on("control", (inputs: ControlInput) => {
            this.flightController.controlInput(inputs)
        })

        this.socket.on("arm", () => this.flightController.arm())
        this.socket.on("disarm", () => this.flightController.disarm())
        this.socket.on('setmode', (mode: FlightMode) => this.flightController.setFlightMode(mode))
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
            },
            flightController: {
                mode: '',
                armed: false
            },
            config: this.config
        }

        this.flightController.on("heartbeat", heartbeat => {
            systemState.flightController.mode = mapFlightMode(heartbeat.custom_mode)
            systemState.flightController.armed = (heartbeat.base_mode & 128) !== 0;
        })

        this.flightController.on('battery_voltage', voltage => {
            const perecentageRemaining = calculateLipoCapacity(this.config.hardware.battery.cells, voltage)
            const absoluteRemaining = perecentageRemaining / 100 * this.config.hardware.battery.capacity

            systemState.battery.voltage.current = voltage
            systemState.battery.capacity.remainingAbsolute = Math.round(absoluteRemaining)
            systemState.battery.capacity.remainingPercentage = Math.round(perecentageRemaining)
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