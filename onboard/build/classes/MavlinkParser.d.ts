import { SerialPort } from 'serialport';
import { MavLinkPacketParser } from 'node-mavlink';
import { TypedEmitter } from "tiny-typed-emitter";
interface Events {
    [event: string]: (message: any) => void;
}
export declare class MavlinkParser extends TypedEmitter<Events> {
    port: SerialPort;
    reader: MavLinkPacketParser;
    constructor(devicePath: string, baudRate: number);
}
export {};
//# sourceMappingURL=MavlinkParser.d.ts.map