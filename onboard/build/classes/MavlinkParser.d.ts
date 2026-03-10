import { SerialPort } from 'serialport';
import { MavLinkPacketParser, MavLinkData } from 'node-mavlink';
import { TypedEmitter } from "tiny-typed-emitter";
interface Events {
    "ready": () => void;
    [event: string]: (message: any) => void;
}
export declare class MavlinkParser extends TypedEmitter<Events> {
    port: SerialPort;
    reader: MavLinkPacketParser;
    constructor(devicePath: string, baudRate: number);
    send(command: MavLinkData): Promise<void>;
}
export {};
//# sourceMappingURL=MavlinkParser.d.ts.map