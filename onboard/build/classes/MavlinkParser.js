import { SerialPort } from 'serialport';
import { MavLinkPacketSplitter, MavLinkPacketParser, minimal, common, ardupilotmega } from 'node-mavlink';
import { TypedEmitter } from "tiny-typed-emitter";
const REGISTRY = {
    ...minimal.REGISTRY,
    ...common.REGISTRY,
    ...ardupilotmega.REGISTRY,
};
export class MavlinkParser extends TypedEmitter {
    port;
    reader;
    constructor(devicePath, baudRate) {
        super();
        this.port = new SerialPort({ path: devicePath, baudRate: baudRate });
        this.reader = this.port
            .pipe(new MavLinkPacketSplitter())
            .pipe(new MavLinkPacketParser());
        this.reader.on('data', packet => {
            const match = REGISTRY[packet.header.msgid];
            if (match) {
                const data = packet.protocol.data(packet.payload, match);
                this.emit(match.MSG_NAME, data);
            }
        });
        this.reader.on("error", err => {
            throw new Error(`Mavlink Parser Errored: ${err}`);
        });
    }
}
//# sourceMappingURL=MavlinkParser.js.map