import { flightmodeMapping } from "./constants.js";

export function getCapacity(cellNum: number, voltage: number): number {
    const curve = [
        [4.20, 100],
        [4.15, 95],
        [4.11, 90],
        [4.08, 85],
        [4.02, 80],
        [3.98, 75],
        [3.95, 70],
        [3.91, 65],
        [3.87, 60],
        [3.85, 55],
        [3.84, 50],
        [3.82, 45],
        [3.80, 40],
        [3.79, 35],
        [3.77, 30],
        [3.75, 25],
        [3.73, 20],
        [3.71, 15],
        [3.69, 10],
        [3.61, 5],
        [3.27, 0],
    ];

    const v = voltage / cellNum;

    for (let i = 0; i < curve.length - 1; i++) {
        const [v1, c1] = curve[i];
        const [v2, c2] = curve[i + 1];

        if (v <= v1 && v >= v2) {
            const t = (v - v2) / (v1 - v2);
            return c2 + t * (c1 - c2);
        }
    }

    return v >= 4.2 ? 100 : 0;
}

export function mapFlightMode(id: number) {
    const match = Object.keys(flightmodeMapping)
        .find(k => flightmodeMapping[k as keyof typeof flightmodeMapping] === id);

    if (!match) {
        throw new Error(`Flightmode ID ${id} is not mapped!`)
    }

    return match
}