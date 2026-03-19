import { state } from "./constants"

export function updateLayoutType(frameHeight: number, frameWidth: number) {
    const aspectRatioVideo = frameWidth / frameHeight
    const aspectRatioViewport = window.innerWidth / window.innerHeight

    if (aspectRatioViewport / aspectRatioVideo > 1.5) {
        state.layout = 'split'
    }
    else {
        state.layout = 'overlay'
    }
}

export function toFixed(value: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}