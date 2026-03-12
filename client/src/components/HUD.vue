<template>
  <div class="hud-wrapper">
    <div class="hud-viewport">
      <!-- Moving Horizon & Pitch Ladder -->
      <div class="horizon-wrapper">
        <div class="pitch-ladder-container" :style="horizonTransform">
          <!-- Horizon Line -->
          <div class="horizon-line"></div>

          <!-- Minimal Pitch Ladder -->
          <div v-for="deg in [40, 30, 20, 10, -10, -20, -30, -40]" :key="'pitch' + deg" class="pitch-mark" 
               :style="{ top: `calc(50% - ${deg * PPD}px)` }">
            <div class="pitch-line-mini left"></div>
            <span class="pitch-label-mini">{{ deg }}</span>
            <div class="pitch-line-mini right"></div>
          </div>
        </div>
      </div>

      <!-- Fixed Reticle -->
      <div class="reticle">
        <div class="wing"></div>
        <div class="center-dot"></div>
        <div class="wing"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed } from 'vue';
import { socket } from '../socket';
import type { FlightState } from "vtol-onboard";

const data = reactive({
  flightstate: {
    roll: 0,
    pitch: 0,
    yaw: 0,
    airspeed: 0,
    groundspeed: 0,
    throttle: 0,
    climb: 0
  } as FlightState
});

socket.on("flightstate", (state: FlightState) => {
  if (state) data.flightstate = { ...data.flightstate, ...state };
});

const PPD = 12;

const horizonTransform = computed(() => {
  const pitch = data.flightstate.pitch || 0;
  const roll = data.flightstate.roll || 0;
  return {
    transform: `translate(-50%, -50%) rotate(${-roll}deg) translateY(${pitch * PPD}px)`
  };
});
</script>

<style scoped>
.hud-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(1px);
}

.hud-viewport {
  position: relative;
  width: 35%;
  height: 60%;
  overflow: hidden;
  color: #fff;
  user-select: none;
}

.horizon-wrapper {
  position: absolute;
  inset: 0;
}

.pitch-ladder-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1000px;
  height: 1000px;
  transition: transform 0.05s linear;
  will-change: transform;
}

.horizon-line {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  height: 1px;
  background: rgb(255, 255, 255);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.pitch-mark {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.8;
}

.pitch-label-mini {
  font-size: 10px;
  width: 18px;
  text-align: center;
}

.pitch-line-mini {
  width: 32px;
  height: 1px;
  background: rgba(255, 255, 255);
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.15);
}

.reticle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 12px;
}

.wing {
  width: 64px;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 2px;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.2);
}

.center-dot {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
}
</style>