<template>
    <canvas id="videoCanvas"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { socket } from '../socket';
import { updateLayoutType } from '../util';

onMounted(() => {
    const canvas = document.querySelector("#videoCanvas") as HTMLCanvasElement
    if (!canvas) throw new Error('no canvas element')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

    let currentHeight = 0
    let currentWidth = 0

    const decoder = new VideoDecoder({
        output: (frame) => {
            // Set canvas resolution to video resolution (once or when it changes)
            if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight) {
                canvas.width = frame.displayWidth;
                canvas.height = frame.displayHeight;
                console.log(`Resolution: ${canvas.width}x${canvas.height}`);
                updateLayoutType(frame.displayHeight, frame.displayWidth)
            }

            if (currentHeight != window.innerHeight || currentWidth != window.innerWidth) {
                updateLayoutType(frame.displayHeight, frame.displayWidth)
                currentHeight = window.innerHeight
                currentWidth = window.innerWidth
            }


            ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
            frame.close();
        },
        error: (e) => {
            console.error('VideoDecoder error:', e)
        }
    });

    decoder.configure({
        codec: 'avc1.42E01E'
    });

    socket.on('video', (data: ArrayBuffer) => {
        if (decoder?.state !== 'configured') return;

        const u8 = new Uint8Array(data);

        try {
            decoder.decode(new EncodedVideoChunk({
                type: 'key',
                timestamp: performance.now() * 1000,
                data: u8
            }));
        }
        catch (err: any) {
            if (!err.message.includes('key frame')) {
                throw err
            }
        }
    });

    //cant find a better place to do this right now
    function updateFromCanvas() {
        const rect = canvas.getBoundingClientRect()
        updateLayoutType(rect.height, rect.width)
    }

    window.addEventListener('resize', updateFromCanvas)
})
</script>

<style scoped>
.container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(128, 128, 128, 0.212);
}

#videoCanvas {
    height: 100%;
}
</style>