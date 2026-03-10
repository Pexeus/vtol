import { SerialPort } from 'serialport'
import { MavLinkPacketSplitter, MavLinkPacketParser, MavLinkPacketRegistry, minimal, common, ardupilotmega } from 'node-mavlink'
import { TypedEmitter } from "tiny-typed-emitter";

interface Events {
    [event: string]: (message: any) => void;
}

const REGISTRY: MavLinkPacketRegistry = {
    ...minimal.REGISTRY,
    ...common.REGISTRY,
    ...ardupilotmega.REGISTRY,
};

export class MavlinkParser extends TypedEmitter<Events> {
    port: SerialPort;
    reader: MavLinkPacketParser;

    constructor(devicePath: string, baudRate: number) {
        super()
        this.port = new SerialPort({ path: devicePath, baudRate: baudRate });
        this.reader = this.port
            .pipe(new MavLinkPacketSplitter())
            .pipe(new MavLinkPacketParser());

        this.reader.on('data', packet => {            
            const match = REGISTRY[packet.header.msgid]

            if (match) {
                const data = packet.protocol.data(packet.payload, match);
                this.emit(match.MSG_NAME, data)
            }
        })

        this.reader.on("error", err => {
            throw new Error(`Mavlink Parser Errored: ${err}`)
        })
    }
}