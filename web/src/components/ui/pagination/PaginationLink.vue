<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { PaginationListItem, type PaginationListItemProps } from 'reka-ui'
import { Button, type ButtonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props extends PaginationListItemProps {
  class?: HTMLAttributes['class']
  isActive?: boolean
  size?: ButtonVariants['size']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'a',
  size: 'icon',
})

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})
</script>

<template>
  <PaginationListItem v-bind="delegatedProps">
    <Button
      :class="
        cn(
          'h-9 w-9',
          isActive
            ? 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
            : 'bg-transparent text-foreground hover:bg-muted',
          props.class
        )
      "
      :variant="isActive ? 'outline' : 'ghost'"
      :size="size"
    >
      <slot />
    </Button>
  </PaginationListItem>
</template>
