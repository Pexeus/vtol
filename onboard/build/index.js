import { E3372 } from "./classes/E3372.js";
import { FlightController } from "./classes/FlightController.js";
const fc = new FlightController('/dev/ttyACM0', 115200);
//fc.on("position", pos => console.log(pos))
//fc.on("flightstate", state => console.log(state))
const stick = new E3372(1000);
stick.on("status", status => console.log(status));
//# sourceMappingURL=index.js.map