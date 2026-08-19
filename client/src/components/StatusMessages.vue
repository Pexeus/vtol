<template>
    <div class="status-messages" ref="container">
        <transition-group name="msg-list" tag="div" class="messages-list">
            <div 
                v-for="msg in data.messages" 
                :key="msg.id" 
                class="message"
            >
                <span :class="['severity', `severity-${msg.severity}`]" class="text">{{ msg.text }}</span>
            </div>
        </transition-group>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref, nextTick } from 'vue';
import { socket } from '../socket';
import type { StatusMessage } from 'vtol-onboard';

interface LocalMessage extends StatusMessage {
    id: number;
}

const data = reactive({
    messages: [] as LocalMessage[]
});

const container = ref<HTMLElement | null>(null);
let messageIdCounter = 0;

socket.on('message', (message: StatusMessage) => {
    data.messages.push({ ...message, id: messageIdCounter++ });
    
    if (data.messages.length > 10) {
        data.messages.shift();
    }
    
    nextTick(() => {
        if (container.value) {
            container.value.scrollTo({
                top: container.value.scrollHeight,
                behavior: 'smooth'
            });
        }
    });
});
</script>

<style scoped>
.status-messages {
    position: absolute;
    left: 0;
    bottom: 0;
    max-height: 200px;
    overflow-y: auto;
    color: #e0e0e0;
    margin: 12px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 13px;
    overflow: hidden;
}

/* Optional custom scrollbar for better look */
.status-messages::-webkit-scrollbar {
    display: none;
}

.messages-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

.message {
    display: flex;
    gap: 10px;
    word-break: break-word;
    padding: 6px 10px;
    border-radius: 4px;
}

/* Severity Colors */
.severity-Emergency { color: var(--color-error); }
.severity-Alert { color: var(--color-error); }
.severity-Critical { color: var(--color-error); }
.severity-Error { color: var(--color-error); }
.severity-Warning { color: var(--color-warning); }
.severity-Notice { color: var(--color-text-primary); }
.severity-Info { color: var(--color-text-primary); }
.severity-Debug { color: var(--color-text-primary); }

/* Transition Group Animations */
.msg-list-enter-active,
.msg-list-leave-active {
    transition: all 0.3s ease;
}

.msg-list-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.msg-list-leave-to {
    opacity: 0;
    transform: translateX(-20px);
}
</style>
