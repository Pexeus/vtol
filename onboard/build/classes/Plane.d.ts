import { TypedEmitter } from "tiny-typed-emitter";
import { PlaneConfiguration } from "../types.js";
interface Events {
}
export declare class Plane extends TypedEmitter<Events> {
    config: PlaneConfiguration;
    private flightController;
    private lteRouter;
    constructor(config: PlaneConfiguration);
}
export {};
//# sourceMappingURL=Plane.d.ts.map