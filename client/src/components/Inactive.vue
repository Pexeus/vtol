<template>
    <div class="inactive">
        <div class="info">
            <i class="gg-spinner"></i>
            <h2>Waiting for Active Connection...</h2>
        </div>
    </div>
</template>

<script setup lang="ts">
import { state } from '../constants';
import { socket } from '../socket';

socket.once("systemstate", () => {
    state.dataRecieved = true
})
</script>

<style scoped>
.inactive {
    width: 100%;
    height: 100%;
    background-color: black;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.info {
    display: flex;
    align-items: center;
    gap: 20px
}

.info i {
    padding: 0px;
    color: var(--color-primary);
}
</style>