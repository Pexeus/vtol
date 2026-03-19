<template>
    <div class="dialog-container" v-if="isDialogVisible">
        <div class="dialog-box console">
            <div class="dialog-content">
                <div class="question-text">{{ dialogQuestion }}</div>
                <div class="button-group">
                    <button class="dialog-btn btn-accept" @click="respondDialog(true)">
                        Confirm
                    </button>
                    <button class="dialog-btn btn-deny" @click="respondDialog(false)">
                        Abort
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { isDialogVisible, dialogQuestion, respondDialog } from '../dialog';
import { controller } from '../constants';

let animationFrameId: number;
let lastAcceptState = false;
let lastDenyState = false;

const pollGamepad = () => {
    if (isDialogVisible.value) {
        // According to instructions, use Controller.gamepad exported in constants
        // To get real-time button states, it is safer to poll navigator.getGamepads() using the index
        let gp = controller.gamepad;
        if (gp) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const updatedGp = gamepads[gp.index];
            if (updatedGp) {
                gp = updatedGp;
            }
        }

        if (gp && gp.buttons && gp.buttons.length >= 2) {
            // Button 0 is traditionally A/Cross (Accept), Button 1 is B/Circle (Deny)
            const acceptPressed = gp.buttons[0]?.pressed || false;
            const denyPressed = gp.buttons[1]?.pressed || false;

            // Only trigger on button down
            if (acceptPressed && !lastAcceptState) {
                respondDialog(true);
            } else if (denyPressed && !lastDenyState) {
                respondDialog(false);
            }

            lastAcceptState = acceptPressed;
            lastDenyState = denyPressed;
        }
    } else {
        lastAcceptState = false;
        lastDenyState = false;
    }

    animationFrameId = requestAnimationFrame(pollGamepad);
};

onMounted(() => {
    animationFrameId = requestAnimationFrame(pollGamepad);
});

onUnmounted(() => {
    cancelAnimationFrame(animationFrameId);
});
</script>

<style scoped>
.dialog-container {
    position: absolute;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    top: 0;
    left: 0;
    z-index: 9999;
    pointer-events: none;
    /* Let clicks pass through container */
}

.dialog-box {
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    max-width: 400px;
    overflow: hidden;
    pointer-events: auto;
    color: white;
}

.dialog-content {
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 35px;
}

.question-text {
    font-size: 20px;
    text-align: center;
}

.button-group {
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 20px;
}

.dialog-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: rgb(255, 255, 255);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px 24px;
    color: rgb(0, 0, 0);
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.btn-accept:hover {
    color: white;
    background-color: var(--color-success)
}

.btn-deny:hover {
    color: white;
    background-color: var(--color-error)
}

.btn-icon {
    font-size: 20px;
    font-weight: bold;
    display: inline-block;
    width: 25px;
    height: 25px;
}
</style>