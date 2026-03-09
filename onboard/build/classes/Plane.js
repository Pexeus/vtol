import { TypedEmitter } from "tiny-typed-emitter";
import { FlightController } from "./FlightController.js";
import { E3372 } from "./E3372.js";
export class Plane extends TypedEmitter {
    config;
    flightController;
    lteRouter;
    constructor(config) {
        super();
        this.config = config;
        this.flightController = new FlightController(config.flighControllerLink.device, config.flighControllerLink.baudRate);
        this.lteRouter = new E3372(config.lteRouter.updateInterval);
    }
}
//# sourceMappingURL=Plane.js.map