<template>
    <div class="alerts-container">
        <TransitionGroup name="alert">
            <div v-for="alert in alerts" :key="alert.id" class="alert-box console" :class="getAlertClass(alert.type)">
                <Icon :icon="getIcon(alert.type)" class="alert-icon" :style="{ color: getColor(alert.type) }" />
                <div class="alert-content">
                    {{ alert.message }}
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { alerts, type AlertType } from '../alert';

const getIcon = (type: AlertType) => {
    switch (type) {
        case 'information': return 'material-symbols-light:info-outline';
        case 'warning': return 'material-symbols-light:warning-outline-rounded';
        case 'error': 
        case 'error': return 'material-symbols-light:error-outline';
        default: return 'material-symbols-light:info-outline';
    }
};

const getColor = (type: AlertType) => {
    switch (type) {
        case 'information': return 'var(--color-primary)';
        case 'warning': return 'var(--color-warning)';
        case 'error': 
        case 'error': return 'var(--color-error)';
        default: return 'white';
    }
};

const getAlertClass = (type: AlertType) => {
    switch (type) {
        case 'information': return 'alert-information';
        case 'warning': return 'alert-warning';
        case 'error':
        case 'error': return 'alert-error';
        default: return 'alert-information';
    }
};
</script>

<style scoped>
.alerts-container {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 9998;
    pointer-events: none; /* Let clicks pass through container */
    align-items: flex-end;
}

.alert-box {
    background-color: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(8px);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    pointer-events: auto; /* Allow interaction if needed later */
    color: white;
    min-width: 280px;
    max-width: 400px;
    will-change: transform, opacity;
}

.alert-information {
    border-left: 4px solid var(--color-primary);
}

.alert-warning {
    border-left: 4px solid var(--color-warning);
}

.alert-error {
    border-left: 4px solid var(--color-error);
}

.alert-icon {
    font-size: 28px;
    flex-shrink: 0;
}

.alert-content {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.4;
    word-break: break-word;
}

/* Transitions */
.alert-enter-active,
.alert-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.alert-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.alert-leave-to {
    opacity: 0;
    transform: translateX(30px) scale(0.95);
}
</style>
