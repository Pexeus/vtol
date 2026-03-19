import { ref } from 'vue';

export type AlertType = 'information' | 'warning' | 'error'

export interface Alert {
    id: number;
    message: string;
    type: AlertType;
}

export const alerts = ref<Alert[]>([]);
let nextId = 0;

export const displayAlert = (
    message: string,
    type: AlertType = 'information',
    duration: number = 3000
) => {
    const id = nextId++;
    alerts.value.push({ id, message, type });

    if (duration > 0) {
        setTimeout(() => {
            removeAlert(id);
        }, duration);
    }
};

export const removeAlert = (id: number) => {
    alerts.value = alerts.value.filter(a => a.id !== id);
};
