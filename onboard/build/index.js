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
                data: 5000,
                video: 5001
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
debugController();
//# sourceMappingURL=index.js.map