<template>
    <div class="container">
        <canvas id="videoCanvas"></canvas>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { socket } from '../socket';

onMounted(() => {
    const canvas = document.querySelector("#videoCanvas") as HTMLCanvasElement
    if (!canvas) throw new Error('no canvas element')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    const decoder = new VideoDecoder({
        output: (frame) => {
            // Set canvas resolution to video resolution (once or when it changes)
            if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
                canvas.width = frame.displayWidth;
                canvas.height = frame.displayHeight;
                console.log(`Resolution: ${canvas.width}x${canvas.height}`);
            }

            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            frame.close();
        },
        error: (e) => console.error('VideoDecoder error:', e)
    });

    decoder.configure({
        codec: 'avc1.42E01E'
    });

    socket.on('video', (data: ArrayBuffer) => {
        if (decoder?.state !== 'configured') return;

        const u8 = new Uint8Array(data);

        decoder.decode(new EncodedVideoChunk({
            type: 'key',
            timestamp: performance.now() * 1000,
            data: u8
        }));
    });
})
</script>

<style scoped>
canvas {
    height: 100%;
    width: 100%;
}
</style>