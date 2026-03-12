<template>
    <div class="container">
        <div class="console">
            <Map></Map>
            <div class="flightdata">
                <div class="data-item">
                    <Icon icon="material-symbols-light:speed-outline" class="icon" />
                    <div class="data-text">
                        <span class="value">{{ speed }}</span>
                        <span class="unit">m/s</span>
                    </div>
                </div>
                <div class="data-item">
                    <Icon icon="material-symbols-light:height" class="icon" />
                    <div class="data-text">
                        <span class="value">{{ height }}</span>
                        <span class="unit">m</span>
                    </div>
                </div>
                <div class="data-item">
                    <Icon :icon="lteIcon" class="icon" :style="{ color: lteColor }" />
                    <div class="data-text">
                        <span class="value">LTE</span>
                        <span class="unit">{{ lteStrength }}/{{ lteMax }}</span>
                    </div>
                </div>
                <div class="data-item">
                    <Icon :icon="batteryIcon" class="icon" :style="{ color: batteryColor }" />
                    <div class="data-text">
                        <span class="value">{{ Math.round(batteryPercentage) }}</span>
                        <span class="unit">%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { FlightState, Position, SystemState } from 'vtol-onboard';
import { socket } from '../socket';
import Map from './Map.vue';
import { Icon } from '@iconify/vue';

const speed = ref("0.0");
const height = ref("0.0");
const lteStrength = ref(0);
const lteMax = ref(5);
const batteryPercentage = ref(0);

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
    speed.value = flightstate.groundspeed.toFixed(1);
})

socket.on("position", (position: Position) => {
    height.value = position.altitude.relative.toFixed(1);
})

socket.on("systemstate", (systemState: SystemState) => {
    lteStrength.value = systemState.network.signalStrength;
    lteMax.value = systemState.network.signalMax;
    batteryPercentage.value = systemState.battery.capacity.remainingPercentage;
})
</script>

<style>
.container {
    position: absolute;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
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
    min-width: 450px;
    overflow: hidden;
}

.flightdata {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 18px 20px;
    background-color: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.data-item {
    display: flex;
    align-items: center;
    gap: 14px;
}

.icon {
    font-size: 32px;
    color: rgba(255, 255, 255, 0.85);
}

.data-text {
    display: flex;
    flex-direction: column;
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
</style>
