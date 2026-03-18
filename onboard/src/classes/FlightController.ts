import { SerialPort } from 'serialport'
import { MavLinkPacketSplitter, MavLinkPacketParser, common, send, MavLinkProtocolV1 } from 'node-mavlink'
import { TypedEmitter } from "tiny-typed-emitter";
import { MavlinkParser } from './MavlinkParser.js';
import { ControlInput, FlightState, Heartbeat, Position, SystemState } from '../types.js';
import { mapFlightMode } from '../util.js';

interface Events {
    "position": (position: Position) => void
    "flightstate": (state: FlightState) => void
    "battery_voltage": (voltage: number) => void
    "heartbeat": (heartbeat: Heartbeat) => void
}

export class FlightController extends TypedEmitter<Events> {
    private parser: MavlinkParser;
    private protocol = new MavLinkProtocolV1(255, 190)

    constructor(devicePath: string, baudRate: number) {
        super()
        this.parser = new MavlinkParser(devicePath, baudRate)

        this.parser.on("ready", async () => {
            await this.enableHighFrequencyTelemetry()
            this.upstreamTelemetry()
        })
    }

    async arm() {
        const command = new common.ComponentArmDisarmCommand()
        command.arm = 1

        await this.parser.send(command)
    }

    async disarm() {
        const command = new common.ComponentArmDisarmCommand()
        command.arm = 0

        await this.parser.send(command)
    }

    async controlInput(controls: ControlInput) {
        const command = new common.ManualControl()

        command.x = controls.pitch * 1000
        command.y = controls.roll * 1000
        command.z = controls.thrust * 1000
        command.r = controls.yaw * 1000
        command.target = 1

        await this.parser.send(command)
    }

    private async enableHighFrequencyTelemetry() {
        const command = new common.SetMessageIntervalCommand()
        command.targetComponent = 1
        command.targetSystem = 1
        command.messageId = 30
        command.interval = 33_333

        await this.parser.send(command)
    }

    private async upstreamTelemetry() {
        //position
        this.parser.on('GLOBAL_POSITION_INT', data => {
            this.emit('position', {
                altitude: {
                    absolute: data.alt,
                    relative: data.relativeAlt
                },
                heading: data.hdg / 100,
                lat: data.lat / 10000000,
                lon: data.lon / 10000000
            })
        })

        //vehicle state
        let vfrData: any = {}

        this.parser.on("VFR_HUD", data => {
            vfrData = data
        })

        this.parser.on("ATTITUDE", attitude => {
            const flightState: FlightState = {
                airspeed: vfrData.airspeed,
                climb: vfrData.climb,
                groundspeed: vfrData.groundspeed,
                pitch: attitude.pitch * 180 / Math.PI,
                roll: attitude.roll * 180 / Math.PI,
                yaw: attitude.yaw * 180 / Math.PI,
                throttle: vfrData.throttle,
            }

            this.emit('flightstate', flightState)
        })

        this.parser.on("HEARTBEAT", packet => {
            const heartbeat: Heartbeat = {
                autopilot: packet.autopilot,
                base_mode: packet.baseMode,
                custom_mode: packet.customMode,
                mavlink_version: packet.mavlinkVersion,
                system_status: packet.systemStaus,
                type: packet.type
            }

            this.emit("heartbeat", heartbeat)
        })

        //battery state
        this.parser.on("BATTERY_STATUS", packet => {
            this.emit('battery_voltage', packet.voltages[0] / 1000)
        })
    }
}