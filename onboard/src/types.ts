export interface Position {
    lat: number
    lon: number
    heading: number
    altitude: {
        absolute: number
        relative: number
    }
}

export interface FlightState {
    roll: number
    pitch: number
    yaw: number
    airspeed: number
    groundspeed: number
    throttle: number
    climb: number
}

export interface ControlInput {
    pitch: number,
    roll: number,
    thrust: number,
    yaw: number
}

export interface SystemState {
    battery: {
        voltage: {
            maximum: number,
            current: number
        },
        capacity: {
            total: number
            remainingAbsolute: number
            remainingPercentage: number
        }
    }
    network: LTEConnectionStatus,
    flightController: {
        mode: string
        armed: boolean,
    },
    config: OnboardControllerConfiguration
}

export interface LTEConnectionStatus {
    signalStrength: number
    signalMax: number
}

export interface OnboardControllerConfiguration {
    flighController: {
        device: string
        baudRate: number,
        flightModes: FlightMode[]
    }
    lteRouter: {
        updateInterval: number
    }
    link: {
        host: string
        ports: {
            video: number
            data: number
        }
    },
    hardware: {
        battery: {
            cells: number,
            capacity: number
        }
    }
}

export type Heartbeat = {
    type: number; // uint8
    autopilot: number; // uint8
    base_mode: number; // uint8
    custom_mode: number; // uint32
    system_status: number; // uint8
    mavlink_version: number; // uint8
};

export type Severity =
    | 'Emergency'
    | 'Alert'
    | 'Critical'
    | 'Error'
    | 'Warning'
    | 'Notice'
    | 'Info'
    | 'Debug';

export interface StatusMessage {
    text: string
    severity: Severity
}

export type FlightMode = 'QSTABILIZE' | 'FBWA' | 'STABILIZE' // only keep a limited set that is used right now