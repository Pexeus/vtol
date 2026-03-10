import { FlightController } from "./classes/FlightController.js";
import { MavlinkParser } from "./classes/MavlinkParser.js";
import { OnboardController } from "./classes/OnboardController.js";
async function debugController() {
    const controller = new OnboardController({
        flighControllerLink: {
            baudRate: 921600,
            device: '/dev/ttyS0'
        },
        link: {
            host: 'verion.ch',
            ports: {
                data: 4200,
                video: 4201
            }
        },
        lteRouter: {
            updateInterval: 1000
        }
    });
    await controller.init();
}
function debugPort() {
    const parser = new MavlinkParser('/dev/serial0', 921600);
}
function debugFC() {
    const fc = new FlightController('/dev/ttyS0', 921600);
    let last = Date.now();
    fc.on("flightstate", state => {
        const now = Date.now();
        const diff = now - last;
        last = now;
        console.log(diff, state);
    });
}
debugFC();
//# sourceMappingURL=index.js.map