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
        this.port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 });
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
    }
}
//# sourceMappingURL=MavlinkParser.js.map