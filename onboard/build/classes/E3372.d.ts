import { TypedEmitter } from "tiny-typed-emitter";
import { LTEConnectionStatus } from "../types.js";
interface Events {
    "status": (status: LTEConnectionStatus) => void;
}
export declare class E3372 extends TypedEmitter<Events> {
    private headers;
    private updateInteval;
    private parser;
    constructor(updateIntervalMs: number);
    watch(): void;
}
export {};
//# sourceMappingURL=E3372.d.ts.map