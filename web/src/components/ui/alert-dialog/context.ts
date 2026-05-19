import type { InjectionKey, Ref } from 'vue'

export interface AlertDialogContext {
  titleText: Ref<string>
}

export const ALERT_DIALOG_CONTEXT_KEY = Symbol('AlertDialogContext') as InjectionKey<AlertDialogContext>
