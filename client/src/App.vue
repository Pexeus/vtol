<template>
  <div class="viewport">
    <Video></Video>
    <HUD></HUD>
    <Console></Console>
  </div>
</template>

<script setup lang="ts">
import Console from './components/Console.vue';
import Video from './components/Video.vue';
import HUD from './components/HUD.vue';
</script>

<style scoped>
.viewport {
  width: 100vw;
  height: 100vh;
  position: absolute;
}
</style>
