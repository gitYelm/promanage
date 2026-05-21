import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex cursor-default items-center whitespace-nowrap gap-1 rounded-full border px-2 py-0 text-[11px] font-medium leading-5 shadow-none',
  {
    variants: {
      variant: {
        default: 'border-primary/20 bg-primary/10 text-primary',
        secondary:
          'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300',
        destructive:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300',
        outline: 'border-border bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
