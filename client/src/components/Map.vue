<template>
    <div class="mapContainer">
        <div ref="mapEl" class="map"></div>
        <div class="plane-marker" id="plane-marker">
            <Icon icon="material-symbols-light:navigation-rounded" class="plane-icon" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { socket } from "../socket"
import type { Position } from "vtol-onboard"
import { Icon } from '@iconify/vue'

const mapEl = ref<HTMLDivElement | null>(null)
let map: mapboxgl.Map
let plane: mapboxgl.Marker
let resizeObserver: ResizeObserver | undefined

function init() {
    mapboxgl.accessToken =
        "pk.eyJ1IjoicGV4ZXVzIiwiYSI6ImNsMGVrYnJ5dTBqcmYza216cXhib3k1ajEifQ.AVLmYS9GH1eFUlSMGvPQkg"

    map = new mapboxgl.Map({
        container: mapEl.value as HTMLElement,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [0, 0],
        zoom: 1,
        projection: "globe"
    })

    map.on("style.load", () => {
        map.setFog({})
    })

    resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapEl.value as Element)

    const marker = document.getElementById("plane-marker")
    if (!marker) throw new Error('cannot find marker element')
    marker.className = "plane-marker"

    plane = new mapboxgl.Marker({
        element: marker,
        anchor: "center"
    })
        .setLngLat([0, 0])
        .addTo(map)

    socket.on("position", (position: Position) => {
        map.setBearing(position.heading)
        map.setPitch(0)

        map.flyTo({
            center: [position.lon, position.lat],
            zoom: 15,
            animate: false
        })

        plane.setLngLat([position.lon, position.lat])
    })
}

onMounted(init)

onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    map?.remove()
})
</script>

<style>
.map {
    width: 100%;
    height: 100%;
}

.mapContainer {
    width: 100%;
    height: 100%;
    flex: 1;
}

.plane-icon {
    color: white;
    height: 45px;
    width: 45px;
    filter: drop-shadow(0px 0px 3px black);
}
</style>