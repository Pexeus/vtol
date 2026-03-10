export interface Position {
    lat: number;
    lon: number;
    heading: number;
    altitude: {
        absolute: number;
        relative: number;
    };
}
export interface FlightState {
    roll: number;
    pitch: number;
    yaw: number;
    airspeed: number;
    groundspeed: number;
    throttle: number;
    climb: number;
}
export interface LTEConnectionStatus {
    signalStrength: number;
    signalMax: number;
}
export interface OnboardControllerConfiguration {
    flighControllerLink: {
        device: string;
        baudRate: number;
    };
    lteRouter: {
        updateInterval: number;
    };
    link: {
        host: string;
        ports: {
            video: number;
            data: number;
        };
    };
}
//# sourceMappingURL=types.d.ts.map