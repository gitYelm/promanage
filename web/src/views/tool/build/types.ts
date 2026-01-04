export interface FormOption {
  label: string
  value: string
}

export interface FormField {
  id: string
  type:
    | 'input'
    | 'textarea'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'switch'
    | 'slider'
    | 'date'
    | 'alert'
    | 'pin-input'
    | 'toggle-group'
    | 'toggle'
    | 'combobox'
    | 'accordion'
    | 'tabs'
    | 'alert-dialog'
    | 'drawer'
    | 'sheet'
    | 'hover-card'
    | 'dropdown-menu'
    | 'menubar'
    | 'navigation-menu'
    | 'context-menu'
    | 'breadcrumb'
    | 'pagination'
    | 'collapsible'
    | 'carousel'
    | 'aspect-ratio'
    | 'table'
  label: string
  key: string // Field name for v-model
  placeholder?: string
  required: boolean
  options?: FormOption[]
  description?: string // For Alert
  min?: number // For Slider
  max?: number // For Slider
  step?: number // For Slider
  tooltip?: string // For all fields
  pinCount?: number // For PinInput
  progress?: number // For Progress
  skeletonSize?: 'sm' | 'md' | 'lg' // For Skeleton
  side?: 'left' | 'right' | 'top' | 'bottom' // For Drawer/Sheet
  ratio?: number // For AspectRatio
}
