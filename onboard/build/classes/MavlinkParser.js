import { SerialPort } from 'serialport';
import { MavLinkPacketSplitter, MavLinkPacketParser, minimal, common, ardupilotmega, send, MavLinkProtocolV1 } from 'node-mavlink';
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
        this.port.once('data', () => this.emit("ready"));
        this.reader.on("error", err => {
            throw new Error(`Mavlink Parser Errored: ${err}`);
        });
    }
    async send(command) {
        await send(this.port, command, new MavLinkProtocolV1(255, 190));
    }
}
//# sourceMappingURL=MavlinkParser.js.map