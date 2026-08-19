<template>
    <div class="modemenu-container" v-if="isVisible">
        <div class="modemenu">
            <div class="menu-title">
                <Icon icon="material-symbols-light:flight-takeoff-rounded" class="title-icon" />
                <span>FLIGHT MODE</span>
            </div>
            <div class="mode-list">
                <div v-for="(mode, index) in availableModes" :key="mode" class="mode-item"
                    :class="{ 'active': mode === currentMode, 'selected': index === selectedIndex }">
                    <Icon v-if="mode === currentMode" icon="material-symbols-light:check-circle" class="status-icon" />
                    <Icon v-else icon="material-symbols-light:radio-button-unchecked" class="status-icon" />
                    <span class="mode-name">{{ mode }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { SystemState } from 'vtol-onboard';
import { socket } from '../socket';
import { controller, state } from '../constants';
import { Icon } from '@iconify/vue';

const isVisible = ref(false);
const availableModes = ref<string[]>([]);
const currentMode = ref<string>('UNKNOWN');
const selectedIndex = ref<number>(0);

socket.on('systemstate', (systemState: SystemState) => {
    // Accommodate typo in the backend interface 'flighController'
    availableModes.value = systemState.config.flighController.flightModes || [];
    currentMode.value = systemState.flightController.mode;

    // Safety check, in case availableModes is empty but we have a mode
    if (availableModes.value.length === 0 && currentMode.value) {
        availableModes.value = [currentMode.value];
    }

    // Keep selectedIndex within bounds if availableModes updates
    if (availableModes.value.length > 0 && selectedIndex.value >= availableModes.value.length) {
        selectedIndex.value = availableModes.value.length - 1;
    }
});

let animationFrameId: number;
let lastRightState = false;
let lastUpState = false;
let lastDownState = false;
let lastCrossState = false;
let lastCircleState = false;

const pollGamepad = () => {
    let gp = controller.gamepad;
    if (gp) {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const updatedGp = gamepads[gp.index];
        if (updatedGp) {
            gp = updatedGp;
        }
    }

    if (gp && gp.buttons && gp.buttons.length >= 16) {
        // PS4 Controller mappings
        // D-pad Right: 15
        // D-pad Up: 12
        // D-pad Down: 13
        // Cross (X): 0
        // Circle (O): 1

        const rightPressed = gp.buttons[15]?.pressed || false;
        const upPressed = gp.buttons[12]?.pressed || false;
        const downPressed = gp.buttons[13]?.pressed || false;
        const crossPressed = gp.buttons[0]?.pressed || false;
        const circlePressed = gp.buttons[1]?.pressed || false;

        // Open menu with Right
        if (rightPressed && !lastRightState && state.mode == 'active') {
            isVisible.value = true;
            // Set selection to current mode when opened
            if (availableModes.value.length > 0) {
                const idx = availableModes.value.indexOf(currentMode.value);
                selectedIndex.value = idx !== -1 ? idx : 0;
            }
        }

        if (isVisible.value) {
            // Close menu with Circle
            if (circlePressed && !lastCircleState) {
                isVisible.value = false;
            }

            // Navigate up
            if (upPressed && !lastUpState) {
                if (selectedIndex.value > 0) {
                    selectedIndex.value--;
                } else {
                    selectedIndex.value = availableModes.value.length - 1; // Wrap around
                }
            }

            // Navigate down
            if (downPressed && !lastDownState) {
                if (selectedIndex.value < availableModes.value.length - 1) {
                    selectedIndex.value++;
                } else {
                    selectedIndex.value = 0; // Wrap around
                }
            }

            // Confirm with Cross
            if (crossPressed && !lastCrossState) {
                const selectedMode = availableModes.value[selectedIndex.value];
                if (selectedMode) {
                    socket.emit('setmode', selectedMode);
                }
            }
        }

        lastRightState = rightPressed;
        lastUpState = upPressed;
        lastDownState = downPressed;
        lastCrossState = crossPressed;
        lastCircleState = circlePressed;
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
.modemenu-container {
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
}

.modemenu {
    display: flex;
    flex-direction: column;
    min-width: 250px;
    overflow: hidden;
    color: white;
    font-family: inherit;
}

.menu-title {
    padding: 15px 20px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 10px;
}

.title-icon {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.85);
}

.mode-list {
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 5px;
}

.mode-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    border-radius: 8px;
    gap: 12px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.mode-item.selected {
    background-color: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.mode-item.active {
    color: var(--color-success, #10b981);
}

.mode-item.active .status-icon {
    color: var(--color-success, #10b981);
}

.mode-name {
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 1px;
}

.status-icon {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.5);
}

.mode-item.selected .status-icon {
    color: rgba(255, 255, 255, 0.9);
}
</style>