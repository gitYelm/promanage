import type { InjectionKey, Ref } from 'vue'

export interface DialogContext {
  titleText: Ref<string>
}

export const DIALOG_CONTEXT_KEY = Symbol('DialogContext') as InjectionKey<DialogContext>
