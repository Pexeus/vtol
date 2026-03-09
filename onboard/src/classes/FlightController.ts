import { SerialPort } from 'serialport'
import { MavLinkPacketSplitter, MavLinkPacketParser } from 'node-mavlink'
import { TypedEmitter } from "tiny-typed-emitter";
import { MavlinkParser } from './MavlinkParser.js';
import { FlightState, Position } from '../types.js';

interface Events {
    "position": (position: Position) => void
    "flightstate": (state: FlightState) => void
}

export class FlightController extends TypedEmitter<Events> {
    private parser: MavlinkParser;

    constructor(devicePath: string, baudRate: number) {
        super()
        this.parser = new MavlinkParser(devicePath, baudRate)

        this.upstreamTelemetry()
    }

    private async upstreamTelemetry() {
        //position
        this.parser.on('GLOBAL_POSITION_INT', data => {
            this.emit('position', {
                altitude: {
                    absolute: data.alt,
                    relative: data.relativeAlt
                },
                heading: data.hdg,
                lat: data.lat,
                lon: data.lon
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
                pitch: attitude.pitch,
                roll: attitude.roll,
                yaw: attitude.yaw,
                throttle: vfrData.throttle,
            }

            this.emit('flightstate', flightState)
        })
    }
}