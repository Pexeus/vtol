import { TypedEmitter } from "tiny-typed-emitter";
import { FlightState, Position } from '../types.js';
interface Events {
    "position": (position: Position) => void;
    "flightstate": (state: FlightState) => void;
}
export declare class FlightController extends TypedEmitter<Events> {
    private parser;
    constructor(devicePath: string, baudRate: number);
    private enableHighFrequencyTelemetry;
    private upstreamTelemetry;
}
export {};
//# sourceMappingURL=FlightController.d.ts.map