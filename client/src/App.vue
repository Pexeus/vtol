<template>
  <div class="viewport" v-if="state.dataRecieved">
    <Alerts></Alerts>
    <Dialog></Dialog>
    <div class="cockpit">
      <Video></Video>
      <HUD></HUD>
      <Console></Console>
      <ModeMenu></ModeMenu>
    </div>
    <div class="mapSizer" v-if="state.layout == 'overlay'">
      <Map></Map>
    </div>
    <Map v-if="state.layout == 'split'"></Map>
  </div>
  <div class="viewport" v-if="!state.dataRecieved">
    <Inactive></Inactive>
  </div>
</template>

<script setup lang="ts">
import Console from './components/Console.vue';
import Video from './components/Video.vue';
import HUD from './components/HUD.vue';
import Map from './components/Map.vue';
import Dialog from './components/Dialog.vue';
import Alerts from './components/Alerts.vue';
import Inactive from './components/Inactive.vue';
import { state } from './constants';
import { displayAlert } from './alert';
import ModeMenu from './ModeMenu.vue';

displayAlert('Hallo Test', 'error', 10000)
</script>

<style scoped>
.viewport {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.backgroundLayer {
  display: flex;
  align-items: center;
  flex-direction: row;
  width: 100%;
  height: 100%;
}

.cockpit {
  position: relative;
  height: 100%;
  flex: 0 0 auto;
}

.mapSizer {
  width: 450px;
  height: 300px;
  position: absolute;
  top: 10px;
  left: 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}
</style>
