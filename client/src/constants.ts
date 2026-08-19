import { reactive } from "vue";
import { Controller } from "./Controller";
import type { State } from "./types";

export const state: State = reactive({
    layout: '',
    mode: 'idle',
    dataRecieved: false
})

export const controller = new Controller()
