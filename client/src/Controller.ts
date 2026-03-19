import type { ControlInput } from "vtol-onboard"
import { state } from "./constants"
import { showDialog } from "./dialog"
import { socket } from "./socket"
import { toFixed } from "./util"


export class Controller {
    gamepad: Gamepad | null = null

    private controlFrequency: number = 30 //transmit inputs at 30HZ

    constructor() {
        window.addEventListener('gamepadconnected', (e) => {
            state.mode = 'ready'
            this.gamepad = e.gamepad
        })
        window.addEventListener('gamepaddisconnected', () => {
            state.mode == 'idle'
        })

        requestAnimationFrame(this.updateGamepadContinously)
        this.streamInputs()
    }

    async enableControl() {
        if (state.mode != 'ready') {
            return
        }

        const confirmed = await showDialog('Enable Pilot Mode now? This will enable Realtime Control and activate Failsafe')

        if (!confirmed) {
            return
        }

        state.mode = 'active'
    }

    //arrow function to preserve context
    private updateGamepadContinously = () => {
        if (this.gamepad) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const updated = gamepads[this.gamepad.index]

            if (updated) {
                this.gamepad = updated
            }
        }

        requestAnimationFrame(this.updateGamepadContinously)
    }

    private streamInputs() {
        let lastInput: ControlInput | false = false

        setInterval(() => {
            if (state.mode != 'active') {
                return
            }

            if (!this.gamepad) {
                return
            }

            const inputs: ControlInput = {
                roll: toFixed(this.gamepad!.axes[2]!, 3),
                pitch: toFixed(this.gamepad!.axes[3]!, 3) * -1,
                yaw: toFixed(this.gamepad!.axes[0]!, 3),
                thrust: toFixed(this.gamepad!.buttons[7]!.value, 3)
            };

            if (JSON.stringify(lastInput) == JSON.stringify(inputs)) {
                return
            }
            lastInput = inputs

            socket.emit('control', inputs)

        }, 1000 / this.controlFrequency);
    }
}