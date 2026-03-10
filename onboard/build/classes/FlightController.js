import { common } from 'node-mavlink';
import { TypedEmitter } from "tiny-typed-emitter";
import { MavlinkParser } from './MavlinkParser.js';
export class FlightController extends TypedEmitter {
    parser;
    constructor(devicePath, baudRate) {
        super();
        this.parser = new MavlinkParser(devicePath, baudRate);
        this.parser.on("ready", () => {
            this.upstreamTelemetry();
            this.enableHighFrequencyTelemetry();
        });
    }
    async enableHighFrequencyTelemetry() {
        const command = new common.SetMessageIntervalCommand();
        command.targetComponent = 1;
        command.targetSystem = 1;
        command.messageId = 30;
        command.interval = 100;
        await this.parser.send(command);
    }
    async upstreamTelemetry() {
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
            });
        });
        //vehicle state
        let vfrData = {};
        this.parser.on("VFR_HUD", data => {
            vfrData = data;
        });
        this.parser.on("ATTITUDE", attitude => {
            const flightState = {
                airspeed: vfrData.airspeed,
                climb: vfrData.climb,
                groundspeed: vfrData.groundspeed,
                pitch: attitude.pitch,
                roll: attitude.roll,
                yaw: attitude.yaw,
                throttle: vfrData.throttle,
            };
            this.emit('flightstate', flightState);
        });
    }
}
//# sourceMappingURL=FlightController.js.map