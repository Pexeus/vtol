import { flightmodeMapping } from "./constants.js";

export function getCapacity(cellNum: number, voltage: number): number {
    const cellV = voltage / cellNum;

    const Vm = 3.73;     // midpoint
    const k = 12;        // steepness

    const pct = 100 / (1 + Math.exp(-k * (cellV - Vm)));

    return Math.max(0, Math.min(100, pct));
}

export function mapFlightMode(id: number) {
    const match = Object.keys(flightmodeMapping)
        .find(k => flightmodeMapping[k as keyof typeof flightmodeMapping] === id);

    if (!match) {
        throw new Error(`Flightmode ID ${id} is not mapped!`)
    }

    return match
}