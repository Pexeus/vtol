<template>
    <div class="container">
        <div class="console">
            <div class="flightdata center-flightdata">
                <div class="data-item center-data-item">
                    <Icon icon="material-symbols-light:speed-outline" class="icon" />
                    <div class="data-text">
                        <span class="value">{{ airspeed }}</span>
                        <span class="unit">m/s</span>
                    </div>
                </div>
                <div class="data-item center-data-item">
                    <Icon icon="material-symbols-light:height" class="icon" />
                    <div class="data-text">
                        <span class="value">{{ altitude }}</span>
                        <span class="unit">m</span>
                    </div>
                </div>
                <div class="data-item center-data-item">
                    <div class="thrust-indicator">
                        <svg class="progress-ring" width="46" height="46">
                            <circle class="progress-ring__circle-bg" stroke="rgba(255,255,255,0.15)" stroke-width="3"
                                fill="transparent" r="19" cx="23" cy="23" />
                            <circle class="progress-ring__circle" :stroke="throttleColor" stroke-width="3"
                                fill="transparent" r="19" cx="23" cy="23" :stroke-dasharray="circumference"
                                :stroke-dashoffset="strokeDashoffset" />
                        </svg>
                        <Icon icon="material-symbols-light:mode-fan-2" class="icon inner-icon" />
                    </div>
                    <div class="data-text">
                        <span class="value">{{ Math.round(throttle) }}</span>
                        <span class="unit">%</span>
                    </div>
                </div>
            </div>
            <div class="flightdata">
                <div class="data-item">
                    <Icon icon="material-symbols-light:flight-rounded" class="icon" />
                    <div class="data-text">
                        <span class="value">{{ flightMode }}</span>
                        <span class="unit">MODE</span>
                    </div>
                </div>
                <div class="data-item">
                    <Icon :icon="lteIcon" class="icon" :style="{ color: lteColor }" />
                    <div class="data-text">
                        <span class="value">{{ lteStrength }}/{{ lteMax }}</span>
                        <span class="unit">LTE</span>
                    </div>
                </div>
                <div class="data-item">
                    <Icon :icon="batteryIcon" class="icon" :style="{ color: batteryColor }" />
                    <div class="data-text">
                        <span class="value">{{ Math.round(batteryPercentage) }}%</span>
                        <span class="unit">{{toFixed(batteryVoltage, 1)}}V</span>
                    </div>
                </div>
                <div v-if="armStatus == 'SAFETY'" class="data-item-novalue arm-switch" @click="arm()">
                    <Icon  icon="material-symbols-light:warning-rounded" class="icon"
                        color="var(--color-success)" />
                    <span class="unit">{{ armStatus }}</span>
                </div>
                <div v-if="armStatus == 'ARMED'" class="data-item-novalue arm-switch" @click="disarm()">
                    <Icon icon="material-symbols-light:warning-rounded" class="icon"
                        color="var(--color-error)" />
                    <span class="unit">{{ armStatus }}</span>
                </div>
                <div class="data-item-novalue">
                    <Icon v-if="state.mode == 'ready'" @click="enableControl"
                        icon="material-symbols-light:stadia-controller" class="icon gamepad-indictaor"
                        color="var(--color-success)" />
                    <Icon v-if="state.mode == 'idle'" icon="material-symbols-light:stadia-controller"
                        class="icon gamepad-indictaor" />
                    <Icon v-if="state.mode == 'active'" icon="material-symbols-light:stadia-controller"
                        class="icon gamepad-indictaor" color="var(--color-primary)" />
                    <span class="unit">{{ state.mode }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { FlightState, Position, SystemState } from 'vtol-onboard';
import { socket } from '../socket';
import { Icon } from '@iconify/vue';
import { controller, state } from '../constants';
import { toFixed } from '../util';


const airspeed = ref("0.0");
const altitude = ref("0.0");
const throttle = ref(0);
const lteStrength = ref(0);
const lteMax = ref(5);
const batteryPercentage = ref(0);
const batteryVoltage = ref(0);
const flightMode = ref('UNKNOWN');
const armStatus = ref('UNKOWN')

const radius = 19;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = computed(() => {
    const percentage = Math.max(0, Math.min(100, throttle.value));
    return circumference - (percentage / 100) * circumference;
});

function arm() {
    socket.emit('arm')
}

function disarm() {
    socket.emit('disarm')
}

const throttleColor = computed(() => {
    const percentage = Math.max(0, Math.min(100, throttle.value));
    const t = percentage / 100;

    let r, g, b;
    if (t < 0.5) {
        // Green (#10b981) to Blue (#3b82f6)
        // Green: rgb(16, 185, 129)
        // Blue: rgb(59, 130, 246)
        const t2 = t * 2; // Normalize to 0-1 for this half
        r = Math.round(16 + (59 - 16) * t2);
        g = Math.round(185 + (130 - 185) * t2);
        b = Math.round(129 + (246 - 129) * t2);
    } else {
        // Blue (#3b82f6) to Red (#ef4444)
        // Blue: rgb(59, 130, 246)
        // Red: rgb(239, 68, 68)
        const t2 = (t - 0.5) * 2; // Normalize to 0-1 for this half
        r = Math.round(59 + (239 - 59) * t2);
        g = Math.round(130 + (68 - 130) * t2);
        b = Math.round(246 + (68 - 246) * t2);
    }

    return `rgb(${r}, ${g}, ${b})`;
});

const lteIcon = computed(() => {
    const ratio = lteMax.value > 0 ? lteStrength.value / lteMax.value : 0;
    if (ratio <= 0) return 'material-symbols-light:signal-cellular-0-bar-rounded';
    if (ratio <= 0.25) return 'material-symbols-light:signal-cellular-1-bar-rounded';
    if (ratio <= 0.5) return 'material-symbols-light:signal-cellular-2-bar-rounded';
    if (ratio <= 0.75) return 'material-symbols-light:signal-cellular-3-bar-rounded';
    return 'material-symbols-light:signal-cellular-4-bar-rounded';
});

const lteColor = computed(() => {
    const ratio = lteMax.value > 0 ? lteStrength.value / lteMax.value : 0;
    if (ratio <= 0.25) return 'var(--color-error)';
    if (ratio <= 0.5) return 'var(--color-warning)';
    return 'var(--color-success)';
});

const batteryIcon = computed(() => {
    const p = batteryPercentage.value;
    if (p <= 5) return 'material-symbols-light:battery-0-bar-rounded';
    if (p <= 15) return 'material-symbols-light:battery-1-bar-rounded';
    if (p <= 30) return 'material-symbols-light:battery-2-bar-rounded';
    if (p <= 45) return 'material-symbols-light:battery-3-bar-rounded';
    if (p <= 60) return 'material-symbols-light:battery-4-bar-rounded';
    if (p <= 75) return 'material-symbols-light:battery-5-bar-rounded';
    if (p <= 90) return 'material-symbols-light:battery-6-bar-rounded';
    return 'material-symbols-light:battery-full-rounded';
});

const batteryColor = computed(() => {
    const ratio = batteryPercentage.value / 100;
    if (ratio <= 0.25) return 'var(--color-error)';
    if (ratio <= 0.5) return 'var(--color-warning)';
    return 'var(--color-success)';
});

socket.on("flightstate", (flightstate: FlightState) => {
    airspeed.value = flightstate.airspeed.toFixed(1);
    throttle.value = flightstate.throttle;
})

socket.on("position", (position: Position) => {
    altitude.value = position.altitude.relative.toFixed(1);
})

socket.on("systemstate", (systemState: SystemState) => {
    lteStrength.value = systemState.network.signalStrength;
    lteMax.value = systemState.network.signalMax;
    batteryPercentage.value = systemState.battery.capacity.remainingPercentage;
    flightMode.value = systemState.flightController.mode;
    batteryVoltage.value = systemState.battery.voltage.current    

    if (systemState.flightController.armed) {
        armStatus.value = "ARMED"
    }
    else {
        armStatus.value = 'SAFETY'
    }
})

function enableControl() {
    controller.enableControl()
}
</script>

<style>
.gamepad-indictaor {
    cursor: pointer;
}

.arm-switch {
    cursor: pointer;
}

.container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    top: 0;
    left: 0;
}

.console {
    position: absolute;
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    margin: 10px;
    min-width: 550px;
    overflow: hidden;
}

.flightdata {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 15px 15px;
    background-color: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: white;
}

.center-flightdata {
    justify-content: space-around;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.data-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.data-item-novalue {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: center;
}

.icon {
    font-size: 32px;
    color: rgba(255, 255, 255, 0.85);
}

.data-text {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.value {
    font-size: 22px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.5px;
}

.unit {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    margin-top: 5px;
    letter-spacing: 1px;
}

.thrust-indicator {
    position: relative;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.progress-ring {
    transform: rotate(-90deg);
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 50% 50%;
}

.progress-ring__circle {
    transition: stroke-dashoffset 0.1s linear;
}

.inner-icon {
    font-size: 30px;
    color: rgba(255, 255, 255, 0.85);
    z-index: 1;
}
</style>