<template>
    
</template>

<script setup lang="ts">
import type { SystemState } from 'vtol-onboard';
import { socket } from './socket';


socket.on('systemstate', (systemState: SystemState) => {
    console.log(systemState);
})
</script>