export type Layout = 'overlay' | 'split'
export type InterfaceMode = 'idle' | 'ready' | 'active'

export interface State {
    layout: Layout
    mode: InterfaceMode
    dataRecieved: Boolean
}